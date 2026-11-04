from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.services.ai_service import AIService
from app.services.rag_service import RAGService
from app.routers.meetings_router import _persist_analysis, _build_analysis_response

router = APIRouter()
ai_service = AIService()
rag_service = RAGService()


@router.post("/analyze", response_model=schemas.MeetingAnalysisResult)
async def analyze_meeting(
    request: schemas.AnalyzeRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Main analysis endpoint.
    Accepts meeting notes + meeting_id, runs full AI analysis,
    stores results, and returns structured output.
    """
    # Validate meeting ownership
    meeting = (
        db.query(models.Meeting)
        .filter(
            models.Meeting.id == request.meeting_id,
            models.Meeting.user_id == current_user.id,
        )
        .first()
    )
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    # Update raw content if new notes are provided
    meeting.raw_content = request.notes
    db.commit()

    # Remove any previous analysis data for this meeting
    db.query(models.MeetingSummary).filter(
        models.MeetingSummary.meeting_id == request.meeting_id
    ).delete()
    db.query(models.Decision).filter(
        models.Decision.meeting_id == request.meeting_id
    ).delete()
    db.query(models.ActionItem).filter(
        models.ActionItem.meeting_id == request.meeting_id
    ).delete()
    db.query(models.ImportantDate).filter(
        models.ImportantDate.meeting_id == request.meeting_id
    ).delete()
    db.query(models.FollowUp).filter(
        models.FollowUp.meeting_id == request.meeting_id
    ).delete()
    db.commit()

    # Pull relevant context from user's knowledge base via RAG
    rag_results = rag_service.search(
        user_id=current_user.id,
        query=request.notes[:500],
        n_results=3,
    )
    context = "\n\n".join([r["content"] for r in rag_results]) if rag_results else ""

    # Run AI analysis
    ai_result = await ai_service.analyze_meeting(request.notes, context=context)

    # Persist all results
    _persist_analysis(db, meeting, current_user.id, ai_result)

    # Update meeting status and participants
    meeting.status = models.MeetingStatusEnum.ANALYZED
    if ai_result.get("participants"):
        meeting.participants = ai_result["participants"]
    db.commit()

    return _build_analysis_response(request.meeting_id, ai_result, db)


@router.post("/generate-summary")
async def generate_summary(
    request: schemas.GenerateSummaryRequest,
    current_user: models.User = Depends(get_current_user),
):
    """Generate only the executive summary for given notes."""
    if not request.notes.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Notes cannot be empty",
        )
    ai_result = await ai_service.analyze_meeting(request.notes)
    return {
        "executive_summary": ai_result.get("executive_summary", ""),
        "discussion_points": ai_result.get("discussion_points", []),
        "topics": ai_result.get("topics", []),
    }


@router.post("/extract-actions")
async def extract_actions(
    request: schemas.ExtractActionsRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Extract only action items from given notes (optionally persisting to a meeting)."""
    if not request.notes.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Notes cannot be empty",
        )

    ai_result = await ai_service.analyze_meeting(request.notes)
    action_items_raw = ai_result.get("action_items", [])

    # Optionally persist if meeting_id is provided
    if request.meeting_id:
        meeting = (
            db.query(models.Meeting)
            .filter(
                models.Meeting.id == request.meeting_id,
                models.Meeting.user_id == current_user.id,
            )
            .first()
        )
        if meeting:
            for item in action_items_raw:
                action = models.ActionItem(
                    meeting_id=meeting.id,
                    user_id=current_user.id,
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
            db.commit()

    return {"action_items": action_items_raw}
