import chalk from "chalk";
import { configExists, loadConfig, saveConfig, ensureAppDir } from "../../config/config-manager.js";
import { getCredential, saveCredential } from "../../config/credentials.js";
import { getDatabase } from "../../storage/database.js";
import { promptApiKey, promptModel, promptProjectType, promptProvider } from "../ui/prompts.js";
import { createSpinner } from "../ui/spinner.js";

export async function initCommand(options?: { force?: boolean }): Promise<void> {
  console.log(chalk.bold("Let's get you set up.\n"));

  const alreadyExists = configExists();
  if (alreadyExists && !options?.force) {
    const { confirm } = await import("@inquirer/prompts");
    const shouldReconfigure = await confirm({
      message: "Configuration already exists. Reconfigure?",
      default: false,
    });
    if (!shouldReconfigure) {
      console.log(chalk.dim("Aborted. Existing configuration preserved."));
      return;
    }
  }

  const provider = await promptProvider();

  let apiKey = getCredential(provider) ?? "";

  // Always prompt for API key on init, but allow keeping existing if force not needed?
  // We'll prompt every time for security, unless env var provides it.
  const hasEnv = provider === "openai" ? !!process.env.OPENAI_API_KEY : !!process.env.ANTHROPIC_API_KEY;
  if (hasEnv) {
    console.log(chalk.dim(`Using ${provider} API key from environment variable.`));
    apiKey = getCredential(provider)!;
  } else {
    apiKey = await promptApiKey(provider);
    const spinner = createSpinner("Saving API key...");
    try {
      saveCredential(provider, apiKey);
      spinner.succeed(chalk.green(`${provider === "openai" ? "OpenAI" : "Claude"} API key saved securely.`));
    } catch (err) {
      spinner.fail(chalk.red("Failed to save API key."));
      throw err;
    }
  }

  // If using env var, still optionally save if user wants to persist? We'll not save env var.
  if (!hasEnv) {
    // already saved above
  } else {
    // Offer to also save if they entered? Already handled.
  }

  const model = await promptModel(provider);
  const projectType = await promptProjectType();

  const spinner2 = createSpinner("Saving configuration...");
  try {
    ensureAppDir();
    saveConfig({
      version: 1,
      provider,
      model,
      projectType,
    });
    // Initialize DB
    getDatabase();
    spinner2.succeed(chalk.green("Setup complete."));
  } catch (err) {
    spinner2.fail(chalk.red("Failed to save configuration."));
    throw err;
  }

  console.log("");
  console.log(chalk.dim(`Config:  ~/.prompt2task/config.json`));
  console.log(chalk.dim(`History: ~/.prompt2task/history.db`));
}
