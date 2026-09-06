import { select, password } from "@inquirer/prompts";

export async function promptProvider(): Promise<"openai" | "claude"> {
  const answer = await select({
    message: "AI provider",
    choices: [
      { name: "OpenAI", value: "openai" as const },
      { name: "Claude", value: "claude" as const },
    ],
  });
  return answer;
}

export async function promptApiKey(provider: string): Promise<string> {
  const answer = await password({
    message: `${provider === "openai" ? "OpenAI" : "Claude"} API Key:`,
    mask: "*",
    validate: (val) => (val.trim().length > 0 ? true : "API key cannot be empty"),
  });
  return answer.trim();
}

export async function promptModel(provider: string): Promise<string> {
  const models =
    provider === "openai"
      ? [
          { name: "GPT-5", value: "gpt-5" },
          { name: "GPT-5-mini", value: "gpt-5-mini" },
          { name: "GPT-4o", value: "gpt-4o" },
          { name: "Other", value: "__other" },
        ]
      : [
          { name: "Claude 3.5 Sonnet", value: "claude-3-5-sonnet-20241022" },
          { name: "Claude 3.5 Haiku", value: "claude-3-5-haiku-20241022" },
          { name: "Claude 3 Opus", value: "claude-3-opus-20240229" },
          { name: "Other", value: "__other" },
        ];

  const answer = await select({
    message: "Default model",
    choices: models,
  });

  if (answer === "__other") {
    const { input } = await import("@inquirer/prompts");
    const custom = await input({
      message: "Enter model name:",
      validate: (val) => (val.trim() ? true : "Model cannot be empty"),
    });
    return custom.trim();
  }
  return answer;
}

export async function promptProjectType(): Promise<string> {
  const answer = await select({
    message: "What do you normally build?",
    choices: [
      { name: "Web applications", value: "web-applications" },
      { name: "WordPress", value: "wordpress" },
      { name: "Laravel", value: "laravel" },
      { name: "React", value: "react" },
      { name: "Other", value: "other" },
    ],
  });
  if (answer === "other") {
    const { input } = await import("@inquirer/prompts");
    const custom = await input({
      message: "Enter project type:",
      validate: (val) => (val.trim() ? true : "Project type cannot be empty"),
    });
    return custom.trim().toLowerCase().replace(/\s+/g, "-");
  }
  return answer;
}
