import type { DatabaseSync } from "node:sqlite";
import type { Task, TaskStatus } from "../../tasks/task.js";

/* Raw row shape from sqlite */
interface TaskRow {
  id: string;
  prompt: string;
  status: string;
  provider: string;
  model: string;
  project_type: string | null;
  project_path: string | null;
  response: string | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    prompt: row.prompt,
    status: row.status as TaskStatus,
    provider: row.provider,
    model: row.model,
    projectType: row.project_type ?? undefined,
    projectPath: row.project_path ?? undefined,
    response: row.response ?? undefined,
    error: row.error ?? undefined,
    createdAt: row.created_at,
    completedAt: row.completed_at ?? undefined,
  };
}

export class TaskRepository {
  constructor(private readonly db: DatabaseSync) {}

  create(task: Task): Task {
    const stmt = this.db.prepare(
      `INSERT INTO tasks (id, prompt, status, provider, model, project_type, project_path, response, error, created_at, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    stmt.run(
      task.id,
      task.prompt,
      task.status,
      task.provider,
      task.model,
      task.projectType ?? null,
      task.projectPath ?? null,
      task.response ?? null,
      task.error ?? null,
      task.createdAt,
      task.completedAt ?? null,
    );
    return task;
  }

  update(id: string, patch: Partial<Task>): Task | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const fields: string[] = [];
    const values: unknown[] = [];

    if (patch.status !== undefined) {
      fields.push("status = ?");
      values.push(patch.status);
    }
    if (patch.prompt !== undefined) {
      fields.push("prompt = ?");
      values.push(patch.prompt);
    }
    if (patch.provider !== undefined) {
      fields.push("provider = ?");
      values.push(patch.provider);
    }
    if (patch.model !== undefined) {
      fields.push("model = ?");
      values.push(patch.model);
    }
    if (patch.projectType !== undefined) {
      fields.push("project_type = ?");
      values.push(patch.projectType);
    }
    if (patch.projectPath !== undefined) {
      fields.push("project_path = ?");
      values.push(patch.projectPath);
    }
    if (patch.response !== undefined) {
      fields.push("response = ?");
      values.push(patch.response);
    }
    if (patch.error !== undefined) {
      fields.push("error = ?");
      values.push(patch.error);
    }
    if (patch.completedAt !== undefined) {
      fields.push("completed_at = ?");
      values.push(patch.completedAt);
    }
    if (patch.createdAt !== undefined) {
      fields.push("created_at = ?");
      values.push(patch.createdAt);
    }

    if (fields.length > 0) {
      const sql = `UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`;
      values.push(id);
      this.db.prepare(sql).run(...(values as string[]));
    }

    return this.findById(id);
  }

  findById(id: string): Task | null {
    const row = this.db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as TaskRow | undefined;
    if (!row) return null;
    return rowToTask(row);
  }

  list(options?: { limit?: number; status?: TaskStatus; offset?: number }): Task[] {
    let sql = "SELECT * FROM tasks ORDER BY created_at DESC";
    const params: unknown[] = [];

    // We filter status in JS after fetch for simplicity with prepared statements,
    // but we can also do SQL filtering. We'll do SQL if status provided.
    if (options?.status) {
      sql = "SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC";
      params.push(options.status);
    }

    const rows = this.db.prepare(sql).all(...(params as string[])) as unknown as TaskRow[];
    let filtered = rows;

    if (options?.offset) {
      filtered = filtered.slice(options.offset);
    }
    if (options?.limit) {
      filtered = filtered.slice(0, options.limit);
    }
    return filtered.map(rowToTask);
  }

  search(query: string, options?: { limit?: number }): Task[] {
    const pattern = `%${query}%`;
    const rows = this.db
      .prepare(
        "SELECT * FROM tasks WHERE prompt LIKE ? OR response LIKE ? ORDER BY created_at DESC",
      )
      .all(pattern, pattern) as unknown as TaskRow[];
    let result = rows.map(rowToTask);
    if (options?.limit) result = result.slice(0, options.limit);
    return result;
  }

  deleteAll(): void {
    this.db.exec("DELETE FROM tasks");
  }

  count(): number {
    const row = this.db.prepare("SELECT COUNT(*) as cnt FROM tasks").get() as { cnt: number };
    return row.cnt;
  }
}
