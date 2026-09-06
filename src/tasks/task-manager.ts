import type { Task, TaskStatus } from "./task.js";
import type { TaskRepository } from "../storage/repositories/task-repository.js";
import { generateTaskId } from "../utils/ids.js";
import { buildStructuredPrompt } from "./prompt-builder.js";
import type { ProjectContext } from "../project/context.js";
import type { AIProvider } from "../providers/provider.js";

export interface RunTaskOptions {
  prompt: string;
  provider: AIProvider;
  model: string;
  providerName: string;
  projectType?: string;
  projectContext?: ProjectContext;
}

export class TaskManager {
  constructor(private readonly repo: TaskRepository) {}

  createTask(opts: {
    prompt: string;
    provider: string;
    model: string;
    projectType?: string;
    projectPath?: string;
  }): Task {
    const now = new Date().toISOString();
    const task: Task = {
      id: generateTaskId(),
      prompt: opts.prompt,
      status: "pending",
      provider: opts.provider,
      model: opts.model,
      projectType: opts.projectType,
      projectPath: opts.projectPath,
      createdAt: now,
    };
    this.repo.create(task);
    return task;
  }

  updateStatus(id: string, status: TaskStatus, patch?: Partial<Task>): Task | null {
    return this.repo.update(id, { status, ...patch });
  }

  async runTask(options: RunTaskOptions): Promise<Task> {
    const { prompt, provider, model, providerName, projectType, projectContext } = options;

    if (!prompt || !prompt.trim()) {
      throw new Error("Prompt cannot be empty.");
    }

    const task = this.createTask({
      prompt,
      provider: providerName,
      model,
      projectType,
      projectPath: projectContext?.path,
    });

    // pending -> running
    this.repo.update(task.id, { status: "running" });

    const structured = buildStructuredPrompt({
      prompt,
      projectType,
      projectContext,
    });

    try {
      const response = await provider.sendTask({
        prompt,
        structuredPrompt: structured,
        model,
        projectType,
      });

      const completed = this.repo.update(task.id, {
        status: "completed",
        response: response.content,
        completedAt: new Date().toISOString(),
      });
      return completed ?? { ...task, status: "completed", response: response.content };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const failed = this.repo.update(task.id, {
        status: "failed",
        error: message,
        completedAt: new Date().toISOString(),
      });
      // Re-throw to let CLI display error, but ensure persistence
      throw err instanceof Error ? err : new Error(message);
    }
  }
}
