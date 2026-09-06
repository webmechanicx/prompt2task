export type TaskStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface Task {
  id: string;
  prompt: string;
  status: TaskStatus;
  provider: string;
  model: string;
  projectType?: string;
  projectPath?: string;
  response?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export const TASK_STATUSES: TaskStatus[] = [
  "pending",
  "running",
  "completed",
  "failed",
  "cancelled",
];
