import chalk from "chalk";
import { getDatabase } from "../../storage/database.js";
import { TaskRepository } from "../../storage/repositories/task-repository.js";
import { configExists } from "../../config/config-manager.js";

export interface CopyOptions {
  json?: boolean;
  response?: boolean;
}

export async function copyCommand(taskId: string, options: CopyOptions): Promise<void> {
  if (!configExists()) {
    console.error(chalk.red("✗ Not initialized. Run `prompt2task init` first."));
    process.exit(1);
  }

  const db = getDatabase();
  const repo = new TaskRepository(db);
  const task = repo.findById(taskId);

  if (!task) {
    console.error(chalk.red(`✗ Task not found: ${taskId}`));
    process.exit(1);
  }

  let content: string;
  let label: string;

  if (options.json) {
    content = JSON.stringify(task, null, 2);
    label = "task JSON";
  } else if (options.response) {
    if (!task.response) {
      console.error(chalk.yellow(`⚠ Task ${taskId} has no response to copy.`));
      if (task.error) console.error(chalk.dim(`Error: ${task.error}`));
      process.exit(1);
    }
    content = task.response;
    label = "response";
  } else {
    content = task.prompt;
    label = "prompt";
  }

  if (!content) {
    console.error(chalk.red(`✗ Nothing to copy for ${label}.`));
    process.exit(1);
  }

  try {
    const { default: clipboardy } = await import("clipboardy");
    await clipboardy.write(content);
    console.log(chalk.green(`✓ Copied ${label} to clipboard.`));
    if (options.json) {
      // For json, don't dump large content to terminal
      console.log(chalk.dim(`Task: ${taskId} (${content.length} chars)`));
    } else {
      console.log(chalk.dim(content.slice(0, 120) + (content.length > 120 ? "..." : "")));
    }
  } catch (err) {
    // Clipboard unavailable (e.g., no xclip/pbcopy, headless CI)
    console.error(chalk.yellow(`⚠ Clipboard unavailable: ${(err as Error).message}`));
    console.log(chalk.dim("Falling back to stdout — copy manually:"));
    console.log(chalk.dim("─".repeat(40)));
    console.log(content);
    console.log(chalk.dim("─".repeat(40)));
    // Do not exit with error; content is still provided
  }
}
