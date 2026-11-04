from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.services.ai_service import AIService
from app.services.rag_service import RAGService

router = APIRouter()
ai_service = AIService()
rag_service = RAGService()


@router.post("", response_model=schemas.MeetingListResponse, status_code=status.HTTP_201_CREATED)
def create_meeting(
    meeting_in: schemas.MeetingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Create a new meeting record."""
    meeting = models.Meeting(
        user_id=current_user.id,
        title=meeting_in.title,
        date=meeting_in.date,
        project_name=meeting_in.project_name,
        participants=meeting_in.participants or [],
        raw_content=meeting_in.raw_content,
        status=models.MeetingStatusEnum.PENDING,
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting


@router.get("", response_model=List[schemas.MeetingListResponse])
def list_meetings(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """List the current user's meetings with pagination."""
    meetings = (
        db.query(models.Meeting)
        .filter(models.Meeting.user_id == current_user.id)
        .order_by(models.Meeting.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return meetings


@router.get("/{meeting_id}", response_model=schemas.MeetingResponse)
def get_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Get a single meeting with all its related data."""
    meeting = (
        db.query(models.Meeting)
        .options(
            joinedload(models.Meeting.summary),
            joinedload(models.Meeting.decisions),
            joinedload(models.Meeting.action_items),
            joinedload(models.Meeting.important_dates),
            joinedload(models.Meeting.follow_ups),
        )
        .filter(
            models.Meeting.id == meeting_id,
            models.Meeting.user_id == current_user.id,
        )
        .first()
    )
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
    return meeting


@router.put("/{meeting_id}", response_model=schemas.MeetingListResponse)
def update_meeting(
    meeting_id: int,
    meeting_in: schemas.MeetingUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Update a meeting's metadata."""
    meeting = (
        db.query(models.Meeting)
        .filter(
            models.Meeting.id == meeting_id,
            models.Meeting.user_id == current_user.id,
        )
        .first()
    )
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    update_data = meeting_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(meeting, field, value)

    db.commit()
    db.refresh(meeting)
    return meeting


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Delete a meeting and all its related data."""
    meeting = (
        db.query(models.Meeting)
        .filter(
            models.Meeting.id == meeting_id,
            models.Meeting.user_id == current_user.id,
        )
        .first()
    )
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    db.delete(meeting)
    db.commit()
    return None


@router.post("/{meeting_id}/reanalyze", response_model=schemas.MeetingAnalysisResult)
async def reanalyze_meeting(
    meeting_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Re-run AI analysis on an existing meeting."""
    meeting = (
        db.query(models.Meeting)
        .filter(
            models.Meeting.id == meeting_id,
            models.Meeting.user_id == current_user.id,
        )
        .first()
    )
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")
    if not meeting.raw_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Meeting has no content to analyze",
        )

    # Remove old AI-generated data
    db.query(models.MeetingSummary).filter(models.MeetingSummary.meeting_id == meeting_id).delete()
    db.query(models.Decision).filter(models.Decision.meeting_id == meeting_id).delete()
    db.query(models.ActionItem).filter(models.ActionItem.meeting_id == meeting_id).delete()
    db.query(models.ImportantDate).filter(models.ImportantDate.meeting_id == meeting_id).delete()
    db.query(models.FollowUp).filter(models.FollowUp.meeting_id == meeting_id).delete()
    db.commit()

    # Pull RAG context
    rag_results = rag_service.search(current_user.id, meeting.raw_content[:500], n_results=3)
    context = "\n".join([r["content"] for r in rag_results]) if rag_results else ""

    # Run AI analysis
    ai_result = await ai_service.analyze_meeting(meeting.raw_content, context=context)

    # Persist results
    _persist_analysis(db, meeting, current_user.id, ai_result)
    meeting.status = models.MeetingStatusEnum.ANALYZED
    if ai_result.get("participants"):
        meeting.participants = ai_result["participants"]
    db.commit()

    return _build_analysis_response(meeting_id, ai_result, db)


def _persist_analysis(db: Session, meeting: models.Meeting, user_id: int, ai_result: dict):
    """Store AI analysis results in the database."""
    # Summary
    summary = models.MeetingSummary(
        meeting_id=meeting.id,
        executive_summary=ai_result.get("executive_summary", ""),
        discussion_points=ai_result.get("discussion_points", []),
        topics=ai_result.get("topics", []),
    )
    db.add(summary)

    # Decisions
    for d in ai_result.get("decisions", []):
        decision = models.Decision(
            meeting_id=meeting.id,
            content=d.get("content", ""),
            context=d.get("context"),
            decision_type=d.get("decision_type", "approved"),
        )
        db.add(decision)

    # Action Items
    for item in ai_result.get("action_items", []):
        action = models.ActionItem(
            meeting_id=meeting.id,
            user_id=user_id,
            title=item.get("title", ""),
            description=item.get("description"),
            assigned_to=item.get("assigned_to", "Unassigned"),
            deadline=item.get("deadline"),
            priority=item.get("priority", "Medium"),
            status=models.StatusEnum.PENDING,
            source_context=item.get("source_context"),
            confidence_score=item.get("confidence", 0.8),
        )
        db.add(action)

    # Important Dates
    for date_entry in ai_result.get("important_dates", []):
        imp_date = models.ImportantDate(
            meeting_id=meeting.id,
            date_text=date_entry.get("date_text"),
            context=date_entry.get("context"),
            mentioned_date=date_entry.get("date_text"),
        )
        db.add(imp_date)

    # Follow-ups
    for fu in ai_result.get("follow_ups", []):
        follow_up = models.FollowUp(
            meeting_id=meeting.id,
            question=fu.get("question", ""),
            context=fu.get("context"),
        )
        db.add(follow_up)

    db.flush()


def _build_analysis_response(meeting_id: int, ai_result: dict, db: Session) -> schemas.MeetingAnalysisResult:
    """Build the MeetingAnalysisResult schema from persisted DB rows."""
    action_items_db = db.query(models.ActionItem).filter(
        models.ActionItem.meeting_id == meeting_id
    ).all()

    return schemas.MeetingAnalysisResult(
        meeting_id=meeting_id,
        executive_summary=ai_result.get("executive_summary", ""),
        discussion_points=ai_result.get("discussion_points", []),
        topics=ai_result.get("topics", []),
        decisions=[
            schemas.AIDecision(
                content=d.get("content", ""),
                context=d.get("context"),
                decision_type=d.get("decision_type", "approved"),
            )
            for d in ai_result.get("decisions", [])
        ],
        action_items=[schemas.ActionItemResponse.model_validate(a) for a in action_items_db],
        important_dates=[
            schemas.AIImportantDate(
                date_text=d.get("date_text"),
                context=d.get("context"),
            )
            for d in ai_result.get("important_dates", [])
        ],
        participants=ai_result.get("participants", []),
        follow_ups=[
            schemas.AIFollowUp(
                question=fu.get("question", ""),
                context=fu.get("context"),
            )
            for fu in ai_result.get("follow_ups", [])
        ],
    )
