from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter()


@router.get("", response_model=List[schemas.ActionItemResponse])
def list_tasks(
    priority: Optional[str] = Query(None, description="Filter by priority: High, Medium, Low"),
    task_status: Optional[str] = Query(None, alias="status", description="Filter by status"),
    assigned_to: Optional[str] = Query(None, description="Filter by assignee"),
    meeting_id: Optional[int] = Query(None, description="Filter by meeting ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """List all tasks for the current user with optional filters."""
    query = db.query(models.ActionItem).filter(
        models.ActionItem.user_id == current_user.id
    )

    if priority:
        query = query.filter(models.ActionItem.priority == priority)
    if task_status:
        query = query.filter(models.ActionItem.status == task_status)
    if assigned_to:
        query = query.filter(
            models.ActionItem.assigned_to.ilike(f"%{assigned_to}%")
        )
    if meeting_id:
        query = query.filter(models.ActionItem.meeting_id == meeting_id)

    tasks = (
        query.order_by(models.ActionItem.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return tasks


@router.post("", response_model=schemas.ActionItemResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_in: schemas.ActionItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Manually create an action item / task."""
    # Verify meeting belongs to user
    meeting = (
        db.query(models.Meeting)
        .filter(
            models.Meeting.id == task_in.meeting_id,
            models.Meeting.user_id == current_user.id,
        )
        .first()
    )
    if not meeting:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meeting not found")

    task = models.ActionItem(
        meeting_id=task_in.meeting_id,
        user_id=current_user.id,
        title=task_in.title,
        description=task_in.description,
        assigned_to=task_in.assigned_to,
        deadline=task_in.deadline,
        priority=task_in.priority,
        status=models.StatusEnum.PENDING,
        source_context=task_in.source_context,
        confidence_score=task_in.confidence_score,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.put("/{task_id}", response_model=schemas.ActionItemResponse)
def update_task(
    task_id: int,
    task_in: schemas.ActionItemUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Update a task's status, assignee, deadline, priority, or description."""
    task = (
        db.query(models.ActionItem)
        .filter(
            models.ActionItem.id == task_id,
            models.ActionItem.user_id == current_user.id,
        )
        .first()
    )
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    update_data = task_in.model_dump(exclude_unset=True)

    # Record status change history
    if "status" in update_data and update_data["status"] != task.status.value:
        history = models.TaskHistory(
            task_id=task.id,
            user_id=current_user.id,
            old_status=task.status.value if task.status else None,
            new_status=update_data["status"],
        )
        db.add(history)

    for field, value in update_data.items():
        setattr(task, field, value)

    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Delete an action item."""
    task = (
        db.query(models.ActionItem)
        .filter(
            models.ActionItem.id == task_id,
            models.ActionItem.user_id == current_user.id,
        )
        .first()
    )
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    db.delete(task)
    db.commit()
    return None
