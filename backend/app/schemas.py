from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime


# ─── Auth / User ─────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    full_name: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ─── Meetings ────────────────────────────────────────────────────────────────

class MeetingCreate(BaseModel):
    title: str
    date: Optional[str] = None
    project_name: Optional[str] = None
    participants: Optional[List[str]] = []
    raw_content: Optional[str] = None


class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[str] = None
    project_name: Optional[str] = None
    participants: Optional[List[str]] = None
    raw_content: Optional[str] = None


class DecisionResponse(BaseModel):
    id: int
    content: str
    context: Optional[str] = None
    decision_type: str

    class Config:
        from_attributes = True


class ActionItemResponse(BaseModel):
    id: int
    meeting_id: int
    user_id: str
    title: str
    description: Optional[str] = None
    assigned_to: str = "Unassigned"
    deadline: Optional[str] = None
    priority: str = "Medium"
    status: str = "Pending"
    source_context: Optional[str] = None
    confidence_score: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ImportantDateResponse(BaseModel):
    id: int
    date_text: Optional[str] = None
    context: Optional[str] = None
    mentioned_date: Optional[str] = None

    class Config:
        from_attributes = True


class FollowUpResponse(BaseModel):
    id: int
    question: str
    context: Optional[str] = None

    class Config:
        from_attributes = True


class MeetingSummaryResponse(BaseModel):
    id: int
    executive_summary: Optional[str] = None
    discussion_points: Optional[List[str]] = []
    topics: Optional[List[str]] = []

    class Config:
        from_attributes = True


class MeetingResponse(BaseModel):
    id: int
    user_id: str
    title: str
    date: Optional[str] = None
    project_name: Optional[str] = None
    participants: Optional[List[str]] = []
    raw_content: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    summary: Optional[MeetingSummaryResponse] = None
    decisions: Optional[List[DecisionResponse]] = []
    action_items: Optional[List[ActionItemResponse]] = []
    important_dates: Optional[List[ImportantDateResponse]] = []
    follow_ups: Optional[List[FollowUpResponse]] = []

    class Config:
        from_attributes = True


class MeetingListResponse(BaseModel):
    id: int
    user_id: str
    title: str
    date: Optional[str] = None
    project_name: Optional[str] = None
    participants: Optional[List[str]] = []
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ─── Action Items ─────────────────────────────────────────────────────────────

class ActionItemCreate(BaseModel):
    meeting_id: int
    title: str
    description: Optional[str] = None
    assigned_to: str = "Unassigned"
    deadline: Optional[str] = None
    priority: str = "Medium"
    source_context: Optional[str] = None
    confidence_score: float = 0.8


class ActionItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    deadline: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None


# ─── Knowledge Base ───────────────────────────────────────────────────────────

class KnowledgeDocumentResponse(BaseModel):
    id: int
    user_id: str
    filename: str
    file_type: Optional[str] = None
    chunk_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class KnowledgeSearchRequest(BaseModel):
    query: str
    n_results: int = 5


class KnowledgeSearchResult(BaseModel):
    content: str
    filename: str
    distance: float


# ─── AI Analysis ─────────────────────────────────────────────────────────────

class AIDecision(BaseModel):
    content: str
    context: Optional[str] = None
    decision_type: str = "approved"


class AIActionItem(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_to: str = "Unassigned"
    deadline: Optional[str] = None
    priority: str = "Medium"
    confidence: float = 0.8
    source_context: Optional[str] = None


class AIImportantDate(BaseModel):
    date_text: Optional[str] = None
    context: Optional[str] = None


class AIFollowUp(BaseModel):
    question: str
    context: Optional[str] = None


class MeetingAnalysisResult(BaseModel):
    meeting_id: int
    executive_summary: str
    discussion_points: List[str] = []
    topics: List[str] = []
    decisions: List[AIDecision] = []
    action_items: List[ActionItemResponse] = []
    important_dates: List[AIImportantDate] = []
    participants: List[str] = []
    follow_ups: List[AIFollowUp] = []


class AnalyzeRequest(BaseModel):
    meeting_id: int
    notes: str


class GenerateSummaryRequest(BaseModel):
    notes: str


class ExtractActionsRequest(BaseModel):
    notes: str
    meeting_id: Optional[int] = None


# ─── Analytics ───────────────────────────────────────────────────────────────

class AnalyticsOverview(BaseModel):
    total_meetings: int
    total_action_items: int
    pending_tasks: int
    in_progress_tasks: int
    completed_tasks: int
    overdue_tasks: int
    completion_rate: float


class PriorityDistribution(BaseModel):
    high: int
    medium: int
    low: int


class StatusDistribution(BaseModel):
    pending: int
    in_progress: int
    completed: int


class TaskAnalytics(BaseModel):
    priority_distribution: PriorityDistribution
    status_distribution: StatusDistribution
    completion_rate: float
    total_tasks: int
    meetings_over_time: List[dict] = []
