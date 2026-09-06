import { Command } from "commander";
import chalk from "chalk";
import { initCommand } from "./commands/init.js";
import { runPrompt } from "./commands/run.js";
import { listCommand } from "./commands/list.js";
import { showCommand } from "./commands/show.js";
import { searchCommand } from "./commands/search.js";
import { configShowCommand, configSetCommand } from "./commands/config.js";
import { providerCommand } from "./commands/provider.js";
import { credentialsRemoveCommand } from "./commands/credentials.js";
import { setDebug } from "../utils/logger.js";

export function createProgram(): Command {
  const program = new Command();

  program
    .name("prompt2task")
    .description("Turn natural-language prompts into structured tasks and send them to AI providers")
    .version("0.1.0")
    .option("--json", "Output result as JSON (for automation)")
    .option("--debug", "Enable debug output")
    .hook("preAction", (thisCommand) => {
      const opts = thisCommand.opts();
      if (opts.debug) setDebug(true);
    });

  // Default action: run task if prompt provided
  program
    .argument("[prompt]", "Natural language prompt to execute")
    .action(async (prompt: string | undefined, _opts: unknown, command: Command) => {
      const opts = command.optsWithGlobals();
      if (opts.debug) setDebug(true);

      // If no prompt, show help
      if (!prompt) {
        command.help();
        return;
      }

      // prompt is the main task execution
      await runPrompt(prompt, { json: !!opts.json, debug: !!opts.debug });
    });

  program
    .command("init")
    .description("Interactive first-time setup")
    .option("-f, --force", "Force re-initialization")
    .action(async (opts) => {
      try {
        await initCommand({ force: !!opts.force });
      } catch (err) {
        console.error(chalk.red(`✗ ${(err as Error).message}`));
        if ((err as Error & { hint?: string }).hint) console.error(chalk.dim((err as Error & { hint?: string }).hint));
        process.exit(1);
      }
    });

  program
    .command("list")
    .description("List task history")
    .option("--limit <n>", "Limit number of results")
    .option("--status <status>", "Filter by status (pending, running, completed, failed, cancelled)")
    .option("--json", "Output as JSON")
    .action((opts) => {
      const globalOpts = program.opts();
      listCommand({ ...opts, json: opts.json ?? globalOpts.json });
    });

  program
    .command("show")
    .description("Show task details")
    .argument("<id>", "Task ID")
    .option("--json", "Output as JSON")
    .action((id: string, opts) => {
      const globalOpts = program.opts();
      showCommand(id, { json: opts.json ?? globalOpts.json });
    });

  program
    .command("search")
    .description("Search tasks by prompt or response")
    .argument("<query>", "Search query")
    .option("--json", "Output as JSON")
    .option("--limit <n>", "Limit results")
    .action((query: string, opts) => {
      const globalOpts = program.opts();
      searchCommand(query, { ...opts, json: opts.json ?? globalOpts.json });
    });

  const configCmd = program.command("config").description("Manage configuration");

  configCmd
    .action(() => {
      configShowCommand();
    });

  configCmd
    .command("set")
    .description("Set a config value (model, project-type, provider)")
    .argument("<key>", "Config key")
    .argument("<value>", "Config value")
    .action((key: string, value: string) => {
      configSetCommand(key, value);
    });

  // Alias: prompt2task config should show config
  // Already handled by default action of config command

  program
    .command("provider")
    .description("Change AI provider and credentials")
    .action(async () => {
      try {
        await providerCommand();
      } catch (err) {
        console.error(chalk.red(`✗ ${(err as Error).message}`));
        process.exit(1);
      }
    });

  const credentialsCmd = program.command("credentials").description("Manage credentials");

  credentialsCmd
    .command("remove")
    .description("Remove stored credentials (openai, claude, or all)")
    .argument("[provider]", "Provider to remove")
    .action((provider?: string) => {
      credentialsRemoveCommand(provider);
    });

  return program;
}
