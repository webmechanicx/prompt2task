import chalk from "chalk";
import { loadConfig } from "../../config/config-manager.js";
import { getCredential } from "../../config/credentials.js";
import { getDatabase } from "../../storage/database.js";
import { TaskRepository } from "../../storage/repositories/task-repository.js";
import { TaskManager } from "../../tasks/task-manager.js";
import { OpenAIProvider } from "../../providers/openai.js";
import { ClaudeProvider } from "../../providers/claude.js";
import type { AIProvider } from "../../providers/provider.js";
import { detectProject } from "../../project/detector.js";
import { createSpinner } from "../ui/spinner.js";
import { NotInitializedError, ProviderError } from "../../utils/errors.js";

function getProviderInstance(name: string): AIProvider {
  if (name === "openai") return new OpenAIProvider();
  if (name === "claude") return new ClaudeProvider();
  throw new ProviderError(`Unsupported provider: ${name}`);
}

export interface RunOptions {
  json?: boolean;
  debug?: boolean;
}

export async function runPrompt(prompt: string, options: RunOptions = {}): Promise<void> {
  if (!prompt || !prompt.trim()) {
    console.error(chalk.red("✗ Prompt cannot be empty."));
    process.exit(1);
  }

  let config;
  try {
    config = loadConfig();
  } catch (err) {
    if (err instanceof NotInitializedError || (err as Error).message.includes("not been initialized")) {
      console.error(chalk.red("✗ prompt2task has not been initialized."));
      console.error(chalk.dim("Run `prompt2task init` first."));
    } else {
      console.error(chalk.red(`✗ ${(err as Error).message}`));
      if ((err as Error & { hint?: string }).hint) console.error(chalk.dim((err as Error & { hint?: string }).hint));
    }
    process.exit(1);
  }

  const apiKey = getCredential(config!.provider);
  if (!apiKey) {
    console.error(chalk.red(`✗ Missing API key for provider "${config!.provider}".`));
    console.error(chalk.dim(`Set ${config!.provider === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY"} or run \`prompt2task provider\``));
    process.exit(1);
  }

  const db = getDatabase();
  const repo = new TaskRepository(db);
  const manager = new TaskManager(repo);
  const provider = getProviderInstance(config!.provider);
  const projectContext = detectProject(process.cwd());

  const isJson = options.json ?? false;

  let spinner;
  if (!isJson) {
    spinner = createSpinner("Creating task...");
  }

  let taskId: string | null = null;

  try {
    // We'll manually handle task lifecycle for spinner UX
    const task = manager.createTask({
      prompt,
      provider: config!.provider,
      model: config!.model,
      projectType: config!.projectType,
      projectPath: projectContext.path,
    });
    taskId = task.id;

    if (!isJson && spinner) {
      spinner.succeed(chalk.green(`Task created: ${task.id}`));
      spinner = createSpinner(`Sending task to ${config!.provider === "openai" ? "OpenAI" : "Claude"}...`);
      // Update to running
      repo.update(task.id, { status: "running" });
      spinner.text = "AI is working...";
    } else {
      repo.update(task.id, { status: "running" });
    }

    // Build and send
    const { buildStructuredPrompt } = await import("../../tasks/prompt-builder.js");
    const structured = buildStructuredPrompt({
      prompt,
      projectType: config!.projectType,
      projectContext,
    });

    const response = await provider.sendTask({
      prompt,
      structuredPrompt: structured,
      model: config!.model,
      projectType: config!.projectType,
    });

    repo.update(task.id, {
      status: "completed",
      response: response.content,
      completedAt: new Date().toISOString(),
    });

    if (isJson) {
      const finalTask = repo.findById(task.id)!;
      console.log(
        JSON.stringify(
          {
            id: finalTask.id,
            status: finalTask.status,
            provider: finalTask.provider,
            model: finalTask.model,
            response: finalTask.response,
          },
          null,
          2,
        ),
      );
    } else {
      if (spinner) spinner.succeed(chalk.green("Task completed."));
      console.log("");
      console.log(chalk.bold(`Task ID: ${task.id}`));
      console.log("");
      console.log(chalk.bold("Response:"));
      console.log(chalk.dim("─".repeat(40)));
      console.log(response.content);
      console.log(chalk.dim("─".repeat(40)));
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (taskId) {
      try {
        const existing = repo.findById(taskId);
        if (existing && existing.status !== "completed") {
          repo.update(taskId, {
            status: "failed",
            error: message,
            completedAt: new Date().toISOString(),
          });
        }
      } catch {
        // ignore db error
      }
    }

    if (isJson) {
      console.log(
        JSON.stringify(
          {
            id: taskId,
            status: "failed",
            error: message,
          },
          null,
          2,
        ),
      );
      process.exit(1);
    }

    if (spinner) spinner.fail(chalk.red("Task failed."));
    console.error("");
    console.error(chalk.red(`✗ ${message}`));
    if (err instanceof ProviderError && err.hint) {
      console.error(chalk.dim(err.hint));
    } else if (message.toLowerCase().includes("authentication") || message.includes("401")) {
      console.error(chalk.dim("Check your API key with: prompt2task provider"));
    }
    if (options.debug) {
      console.error(chalk.dim((err as Error).stack ?? ""));
    }
    process.exit(1);
  }
}
