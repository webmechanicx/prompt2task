import chalk from "chalk";
import { getDatabase } from "../../storage/database.js";
import { TaskRepository } from "../../storage/repositories/task-repository.js";
import { renderTaskTable } from "../ui/table.js";
import { configExists } from "../../config/config-manager.js";

export interface SearchOptions {
  json?: boolean;
  limit?: string;
}

export function searchCommand(query: string, options: SearchOptions): void {
  if (!configExists()) {
    console.error(chalk.red("✗ Not initialized. Run `prompt2task init` first."));
    process.exit(1);
  }

  if (!query || !query.trim()) {
    console.error(chalk.red("✗ Search query cannot be empty."));
    process.exit(1);
  }

  const db = getDatabase();
  const repo = new TaskRepository(db);

  let limit: number | undefined;
  if (options.limit) {
    limit = parseInt(options.limit, 10);
    if (isNaN(limit) || limit <= 0) {
      console.error(chalk.red("✗ Invalid --limit value."));
      process.exit(1);
    }
  }

  const results = repo.search(query, { limit });

  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  if (results.length === 0) {
    console.log(chalk.dim(`No tasks found for query: "${query}"`));
    return;
  }

  console.log(renderTaskTable(results));
}
