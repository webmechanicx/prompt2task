import { createProgram } from "./cli/index.js";
import { debug } from "./utils/logger.js";

async function main(): Promise<void> {
  const program = createProgram();

  // Handle global --debug before parsing
  const rawArgs = process.argv.slice(2);
  if (rawArgs.includes("--debug")) {
    debug("Debug mode enabled");
  }

  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // Avoid leaking secrets
    const sanitized = message.replace(/sk-[a-zA-Z0-9-_]+/g, "[REDACTED]").replace(/sk-ant-[a-zA-Z0-9-_]+/g, "[REDACTED]");
    console.error(sanitized);
    if (process.argv.includes("--debug") && err instanceof Error && err.stack) {
      console.error(err.stack.replace(/sk-[a-zA-Z0-9-_]+/g, "[REDACTED]"));
    }
    process.exit(1);
  }
}

main();
