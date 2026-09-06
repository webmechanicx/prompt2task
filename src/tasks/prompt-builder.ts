import type { ProjectContext } from "../project/context.js";

export interface BuildPromptOptions {
  prompt: string;
  projectType?: string;
  projectContext?: ProjectContext;
}

export function buildStructuredPrompt(options: BuildPromptOptions): string {
  const { prompt, projectType, projectContext } = options;

  const lines: string[] = [];

  lines.push("You are an expert software development agent.");
  lines.push("");
  if (projectType) {
    lines.push(`Project type:`);
    lines.push(projectType);
    lines.push("");
  }
  lines.push(`User request:`);
  lines.push(`"${prompt}"`);
  lines.push("");

  if (projectContext) {
    lines.push("Project context:");
    if (projectContext.path) lines.push(`- Path: ${projectContext.path}`);
    if (projectContext.type) lines.push(`- Detected type: ${projectContext.type}`);
    if (projectContext.framework) lines.push(`- Framework: ${projectContext.framework}`);
    if (projectContext.language) lines.push(`- Language: ${projectContext.language}`);
    if (!projectContext.type && !projectContext.framework) {
      lines.push("- No specific framework detected (generic project).");
    }
    lines.push("");
  } else {
    lines.push("Project context: Not detected (running outside a project or detection unavailable).");
    lines.push("");
  }

  lines.push("Your task:");
  lines.push("1. Inspect the existing project before making changes.");
  lines.push("2. Understand the current implementation.");
  lines.push("3. Implement the requested improvement.");
  lines.push("4. Preserve existing functionality.");
  lines.push("5. Follow the project's existing coding conventions.");
  lines.push("6. Avoid unrelated changes.");
  lines.push("7. Validate the implementation.");
  lines.push("8. Explain what was changed.");
  lines.push("");
  lines.push("Return:");
  lines.push("- Summary");
  lines.push("- Files changed");
  lines.push("- Implementation details");
  lines.push("- Testing performed");
  lines.push("- Remaining issues");

  return lines.join("\n");
}
