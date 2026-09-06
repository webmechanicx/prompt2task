import chalk from "chalk";
import { loadConfig, saveConfig, configExists } from "../../config/config-manager.js";
import { getAppDir, getConfigPath, getDbPath } from "../../utils/paths.js";

export function configShowCommand(): void {
  if (!configExists()) {
    console.error(chalk.red("✗ Not initialized. Run `prompt2task init` first."));
    process.exit(1);
  }
  const config = loadConfig();
  console.log(chalk.bold("prompt2task configuration"));
  console.log("");
  console.log(`${chalk.dim("Provider:")}     ${capitalize(config.provider)}`);
  console.log(`${chalk.dim("Model:")}        ${config.model}`);
  console.log(`${chalk.dim("Project type:")} ${capitalize(config.projectType)}`);
  console.log(`${chalk.dim("Config:")}       ${getConfigPath()}`);
  console.log(`${chalk.dim("History:")}      ${getDbPath()}`);
  console.log(`${chalk.dim("App dir:")}      ${getAppDir()}`);
}

export function configSetCommand(key: string, value: string): void {
  if (!configExists()) {
    console.error(chalk.red("✗ Not initialized. Run `prompt2task init` first."));
    process.exit(1);
  }
  const config = loadConfig();

  const normalizedKey = key.replace(/-/g, "").toLowerCase();

  if (normalizedKey === "model") {
    config.model = value;
  } else if (normalizedKey === "projecttype" || normalizedKey === "project_type") {
    config.projectType = value;
  } else if (normalizedKey === "provider") {
    if (value !== "openai" && value !== "claude") {
      console.error(chalk.red(`✗ Invalid provider "${value}". Allowed: openai, claude`));
      process.exit(1);
    }
    config.provider = value as "openai" | "claude";
  } else {
    console.error(chalk.red(`✗ Unknown config key "${key}". Allowed: model, project-type, provider`));
    process.exit(1);
  }

  saveConfig(config);
  console.log(chalk.green(`✓ Config updated: ${key} = ${value}`));
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
