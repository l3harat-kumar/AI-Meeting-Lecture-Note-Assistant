export interface TranscriptItem {
  id: string;
  speaker: string;
  color: string;
  time: string;
  text: string;
  source?: "voice" | "ocr" | "note";
}

export interface KeyPoint {
  id: string;
  text: string;
  confidence: number;
  timestamp?: string;
}

export interface ActionItem {
  id: string;
  task: string;
  owner: string;
  due: string;
  priority: "high" | "medium" | "low";
  done: boolean;
  sessionTitle?: string;
  sessionId?: string;
}

export interface Decision {
  id: string;
  text: string;
  timestamp: string;
}

export interface SessionAttendee {
  name: string;
  color: string;
  role?: string;
  pct?: number;
}

export interface SessionTopic {
  label: string;
  duration: string;
  pct: number;
}

export interface Session {
  id: string;
  title: string;
  date: string;
  createdAt: number;
  duration: string;
  durationSeconds: number;
  attendees: SessionAttendee[];
  summary: string;
  keyPoints: KeyPoint[];
  actionItems: ActionItem[];
  decisions: Decision[];
  topics: SessionTopic[];
  transcript: TranscriptItem[];
  tags: string[];
  status: "completed" | "in_progress";
  screenSnapshots?: string[];
}
