import chalk from "chalk";
import { removeCredential, removeAllCredentials } from "../../config/credentials.js";

export function credentialsRemoveCommand(provider?: string): void {
  if (!provider || provider === "all") {
    removeAllCredentials();
    console.log(chalk.green("✓ All credentials removed."));
    return;
  }

  if (provider !== "openai" && provider !== "claude") {
    console.error(chalk.red(`✗ Unknown provider "${provider}". Use: openai, claude, or all`));
    process.exit(1);
  }

  const removed = removeCredential(provider);
  if (removed) {
    console.log(chalk.green(`✓ Credentials removed for ${provider}.`));
  } else {
    console.log(chalk.dim(`No credentials found for ${provider}.`));
  }
}
