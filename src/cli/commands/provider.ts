import chalk from "chalk";
import { loadConfig, saveConfig, configExists } from "../../config/config-manager.js";
import { getCredential, saveCredential } from "../../config/credentials.js";
import { promptApiKey, promptModel, promptProvider } from "../ui/prompts.js";
import { createSpinner } from "../ui/spinner.js";

export async function providerCommand(): Promise<void> {
  if (!configExists()) {
    console.error(chalk.red("✗ Not initialized. Run `prompt2task init` first."));
    process.exit(1);
  }

  const config = loadConfig();

  console.log(chalk.bold("Change provider\n"));
  console.log(chalk.dim(`Current: ${config.provider} / ${config.model}\n`));

  const provider = await promptProvider();
  const apiKey = await promptApiKey(provider);

  const spinner = createSpinner("Saving credentials...");
  try {
    saveCredential(provider, apiKey);
    spinner.succeed(chalk.green("Credentials saved."));
  } catch (err) {
    spinner.fail(chalk.red("Failed to save credentials."));
    throw err;
  }

  const model = await promptModel(provider);

  config.provider = provider;
  config.model = model;
  saveConfig(config);

  console.log(chalk.green(`\n✓ Provider updated to ${provider} (${model})`));
}
