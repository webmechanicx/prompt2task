import chalk from "chalk";
import { getDatabase } from "../../storage/database.js";
import { TaskRepository } from "../../storage/repositories/task-repository.js";
import { renderTaskTable } from "../ui/table.js";
import type { TaskStatus } from "../../tasks/task.js";
import { configExists } from "../../config/config-manager.js";

export interface ListOptions {
  limit?: string;
  status?: string;
  json?: boolean;
}

export function listCommand(options: ListOptions): void {
  if (!configExists()) {
    console.error(chalk.red("✗ Not initialized. Run `prompt2task init` first."));
    process.exit(1);
  }

  const db = getDatabase();
  const repo = new TaskRepository(db);

  let limit: number | undefined;
  if (options.limit) {
    limit = parseInt(options.limit, 10);
    if (isNaN(limit) || limit <= 0) {
      console.error(chalk.red("✗ Invalid --limit value. Must be a positive number."));
      process.exit(1);
    }
  }

  let status: TaskStatus | undefined;
  if (options.status) {
    const allowed = ["pending", "running", "completed", "failed", "cancelled"];
    if (!allowed.includes(options.status)) {
      console.error(chalk.red(`✗ Invalid --status "${options.status}". Allowed: ${allowed.join(", ")}`));
      process.exit(1);
    }
    status = options.status as TaskStatus;
  }

  const tasks = repo.list({ limit, status });

  if (options.json) {
    console.log(JSON.stringify(tasks, null, 2));
    return;
  }

  if (tasks.length === 0) {
    console.log(chalk.dim("No tasks found."));
    return;
  }

  console.log(renderTaskTable(tasks));
}
