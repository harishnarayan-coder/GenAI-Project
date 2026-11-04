from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timezone

from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter()


@router.get("/overview", response_model=schemas.AnalyticsOverview)
def analytics_overview(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """High-level analytics: meeting counts, task summary, overdue items."""
    total_meetings = (
        db.query(func.count(models.Meeting.id))
        .filter(models.Meeting.user_id == current_user.id)
        .scalar()
        or 0
    )

    total_action_items = (
        db.query(func.count(models.ActionItem.id))
        .filter(models.ActionItem.user_id == current_user.id)
        .scalar()
        or 0
    )

    pending_tasks = (
        db.query(func.count(models.ActionItem.id))
        .filter(
            models.ActionItem.user_id == current_user.id,
            models.ActionItem.status == models.StatusEnum.PENDING,
        )
        .scalar()
        or 0
    )

    in_progress_tasks = (
        db.query(func.count(models.ActionItem.id))
        .filter(
            models.ActionItem.user_id == current_user.id,
            models.ActionItem.status == models.StatusEnum.IN_PROGRESS,
        )
        .scalar()
        or 0
    )

    completed_tasks = (
        db.query(func.count(models.ActionItem.id))
        .filter(
            models.ActionItem.user_id == current_user.id,
            models.ActionItem.status == models.StatusEnum.COMPLETED,
        )
        .scalar()
        or 0
    )

    # Overdue: deadline is set, is in the past, and task is not completed
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    all_active_tasks = (
        db.query(models.ActionItem)
        .filter(
            models.ActionItem.user_id == current_user.id,
            models.ActionItem.status != models.StatusEnum.COMPLETED,
            models.ActionItem.deadline.isnot(None),
        )
        .all()
    )
    overdue_tasks = sum(
        1
        for t in all_active_tasks
        if t.deadline and t.deadline < today_str
    )

    completion_rate = (
        round(completed_tasks / total_action_items * 100, 1) if total_action_items > 0 else 0.0
    )

    return schemas.AnalyticsOverview(
        total_meetings=total_meetings,
        total_action_items=total_action_items,
        pending_tasks=pending_tasks,
        in_progress_tasks=in_progress_tasks,
        completed_tasks=completed_tasks,
        overdue_tasks=overdue_tasks,
        completion_rate=completion_rate,
    )


@router.get("/tasks", response_model=schemas.TaskAnalytics)
def task_analytics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Detailed task analytics: priority/status distribution, completion rate, meetings over time."""
    # Priority distribution
    high_count = (
        db.query(func.count(models.ActionItem.id))
        .filter(
            models.ActionItem.user_id == current_user.id,
            models.ActionItem.priority == models.PriorityEnum.HIGH,
        )
        .scalar()
        or 0
    )
    medium_count = (
        db.query(func.count(models.ActionItem.id))
        .filter(
            models.ActionItem.user_id == current_user.id,
            models.ActionItem.priority == models.PriorityEnum.MEDIUM,
        )
        .scalar()
        or 0
    )
    low_count = (
        db.query(func.count(models.ActionItem.id))
        .filter(
            models.ActionItem.user_id == current_user.id,
            models.ActionItem.priority == models.PriorityEnum.LOW,
        )
        .scalar()
        or 0
    )

    # Status distribution
    pending_count = (
        db.query(func.count(models.ActionItem.id))
        .filter(
            models.ActionItem.user_id == current_user.id,
            models.ActionItem.status == models.StatusEnum.PENDING,
        )
        .scalar()
        or 0
    )
    in_progress_count = (
        db.query(func.count(models.ActionItem.id))
        .filter(
            models.ActionItem.user_id == current_user.id,
            models.ActionItem.status == models.StatusEnum.IN_PROGRESS,
        )
        .scalar()
        or 0
    )
    completed_count = (
        db.query(func.count(models.ActionItem.id))
        .filter(
            models.ActionItem.user_id == current_user.id,
            models.ActionItem.status == models.StatusEnum.COMPLETED,
        )
        .scalar()
        or 0
    )

    total_tasks = high_count + medium_count + low_count
    completion_rate = (
        round(completed_count / total_tasks * 100, 1) if total_tasks > 0 else 0.0
    )

    # Meetings over time (last 30 meetings grouped by month)
    meetings = (
        db.query(models.Meeting)
        .filter(models.Meeting.user_id == current_user.id)
        .order_by(models.Meeting.created_at.desc())
        .limit(100)
        .all()
    )

    # Group meetings by year-month
    month_counts: dict = {}
    for m in meetings:
        if m.created_at:
            key = m.created_at.strftime("%Y-%m")
            month_counts[key] = month_counts.get(key, 0) + 1

    meetings_over_time = [
        {"month": k, "count": v}
        for k, v in sorted(month_counts.items())
    ]

    return schemas.TaskAnalytics(
        priority_distribution=schemas.PriorityDistribution(
            high=high_count,
            medium=medium_count,
            low=low_count,
        ),
        status_distribution=schemas.StatusDistribution(
            pending=pending_count,
            in_progress=in_progress_count,
            completed=completed_count,
        ),
        completion_rate=completion_rate,
        total_tasks=total_tasks,
        meetings_over_time=meetings_over_time,
    )
