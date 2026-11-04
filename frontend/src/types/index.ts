export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  created_at: string;
}

export interface Meeting {
  id: number;
  title: string;
  date: string;
  project_name?: string;
  participants?: string[];
  raw_content?: string;
  status: 'pending' | 'analyzed' | 'failed';
  created_at: string;
  updated_at: string;
  summary?: MeetingSummary;
  decisions?: Decision[];
  action_items?: ActionItem[];
  important_dates?: ImportantDate[];
  follow_ups?: FollowUp[];
}

export interface MeetingSummary {
  id: number;
  executive_summary: string;
  discussion_points: string[];
  topics: string[];
}

export interface Decision {
  id: number;
  content: string;
  context: string;
  decision_type: string;
}

export interface ActionItem {
  id: number;
  title: string;
  description: string;
  assigned_to: string;
  deadline?: string | null;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Completed';
  source_context?: string;
  confidence_score?: number;
  meeting_id: number;
  meeting_title?: string;
  created_at: string;
  updated_at: string;
}

export interface ImportantDate {
  id: number;
  date_text: string;
  context: string;
}

export interface FollowUp {
  id: number;
  question: string;
  context: string;
}

export interface KnowledgeDocument {
  id: number;
  filename: string;
  file_type: string;
  chunk_count: number;
  created_at: string;
}

export interface AnalyticsOverview {
  total_meetings: number;
  total_action_items: number;
  pending_tasks: number;
  completed_tasks: number;
  overdue_tasks: number;
  in_progress_tasks: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}
