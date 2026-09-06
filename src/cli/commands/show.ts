import chalk from "chalk";
import { getDatabase } from "../../storage/database.js";
import { TaskRepository } from "../../storage/repositories/task-repository.js";
import { configExists } from "../../config/config-manager.js";

export interface ShowOptions {
  json?: boolean;
}

export function showCommand(taskId: string, options: ShowOptions): void {
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

  if (options.json) {
    console.log(JSON.stringify(task, null, 2));
    return;
  }

  console.log(chalk.bold("Task details"));
  console.log(chalk.dim("─".repeat(40)));
  console.log(`${chalk.bold("Task ID:")}      ${task.id}`);
  console.log(`${chalk.bold("Status:")}       ${task.status}`);
  console.log(`${chalk.bold("Provider:")}     ${task.provider}`);
  console.log(`${chalk.bold("Model:")}        ${task.model}`);
  console.log(`${chalk.bold("Project type:")} ${task.projectType ?? "-"}`);
  console.log(`${chalk.bold("Project path:")} ${task.projectPath ?? "-"}`);
  console.log(`${chalk.bold("Created:")}      ${task.createdAt}`);
  console.log(`${chalk.bold("Completed:")}    ${task.completedAt ?? "-"}`);
  console.log("");
  console.log(chalk.bold("Prompt:"));
  console.log(task.prompt);
  console.log("");
  if (task.response) {
    console.log(chalk.bold("Response:"));
    console.log(chalk.dim("─".repeat(40)));
    console.log(task.response);
    console.log(chalk.dim("─".repeat(40)));
  }
  if (task.error) {
    console.log(chalk.bold(chalk.red("Error:")));
    console.log(chalk.red(task.error));
  }
}
