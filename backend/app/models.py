from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float,
    DateTime, ForeignKey, JSON, Enum as SAEnum
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class PriorityEnum(str, enum.Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class StatusEnum(str, enum.Enum):
    PENDING = "Pending"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"


class MeetingStatusEnum(str, enum.Enum):
    PENDING = "pending"
    ANALYZED = "analyzed"
    FAILED = "failed"


class DecisionTypeEnum(str, enum.Enum):
    APPROVED = "approved"
    REJECTED = "rejected"
    DEFERRED = "deferred"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    meetings = relationship("Meeting", back_populates="user", cascade="all, delete-orphan")
    action_items = relationship("ActionItem", back_populates="user")
    knowledge_documents = relationship("KnowledgeDocument", back_populates="user", cascade="all, delete-orphan")


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(500), nullable=False)
    date = Column(String(100), nullable=True)
    project_name = Column(String(255), nullable=True)
    participants = Column(JSON, default=list)
    raw_content = Column(Text, nullable=True)
    status = Column(
        SAEnum(MeetingStatusEnum, name="meetingstatus_enum", create_type=True),
        default=MeetingStatusEnum.PENDING
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="meetings")
    summary = relationship("MeetingSummary", back_populates="meeting", uselist=False, cascade="all, delete-orphan")
    decisions = relationship("Decision", back_populates="meeting", cascade="all, delete-orphan")
    action_items = relationship("ActionItem", back_populates="meeting", cascade="all, delete-orphan")
    important_dates = relationship("ImportantDate", back_populates="meeting", cascade="all, delete-orphan")
    follow_ups = relationship("FollowUp", back_populates="meeting", cascade="all, delete-orphan")


class MeetingSummary(Base):
    __tablename__ = "meeting_summaries"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False, unique=True)
    executive_summary = Column(Text, nullable=True)
    discussion_points = Column(JSON, default=list)
    topics = Column(JSON, default=list)

    meeting = relationship("Meeting", back_populates="summary")


class Decision(Base):
    __tablename__ = "decisions"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    context = Column(Text, nullable=True)
    decision_type = Column(
        SAEnum(DecisionTypeEnum, name="decisiontype_enum", create_type=True),
        default=DecisionTypeEnum.APPROVED
    )

    meeting = relationship("Meeting", back_populates="decisions")


class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    assigned_to = Column(String(255), default="Unassigned")
    deadline = Column(String(100), nullable=True)
    priority = Column(
        SAEnum(PriorityEnum, name="priority_enum", create_type=True),
        default=PriorityEnum.MEDIUM
    )
    status = Column(
        SAEnum(StatusEnum, name="status_enum", create_type=True),
        default=StatusEnum.PENDING
    )
    source_context = Column(Text, nullable=True)
    confidence_score = Column(Float, default=0.8)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    meeting = relationship("Meeting", back_populates="action_items")
    user = relationship("User", back_populates="action_items")
    history = relationship("TaskHistory", back_populates="task", cascade="all, delete-orphan")


class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=True)
    content = Column(Text, nullable=True)
    chunk_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="knowledge_documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("knowledge_documents.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=True)
    chroma_id = Column(String(255), nullable=True)

    document = relationship("KnowledgeDocument", back_populates="chunks")


class TaskHistory(Base):
    __tablename__ = "task_history"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("action_items.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    old_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=True)
    changed_at = Column(DateTime(timezone=True), server_default=func.now())

    task = relationship("ActionItem", back_populates="history")


class ImportantDate(Base):
    __tablename__ = "important_dates"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    date_text = Column(String(255), nullable=True)
    context = Column(Text, nullable=True)
    mentioned_date = Column(String(255), nullable=True)

    meeting = relationship("Meeting", back_populates="important_dates")


class FollowUp(Base):
    __tablename__ = "follow_ups"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    question = Column(Text, nullable=False)
    context = Column(Text, nullable=True)

    meeting = relationship("Meeting", back_populates="follow_ups")
