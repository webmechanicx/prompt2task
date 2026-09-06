export class AppError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly hint?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotInitializedError extends AppError {
  constructor() {
    super(
      "prompt2task has not been initialized. Run `prompt2task init` first.",
      "NOT_INITIALIZED",
      "Run: prompt2task init",
    );
    this.name = "NotInitializedError";
  }
}

export class ConfigError extends AppError {
  constructor(message: string, hint?: string) {
    super(message, "CONFIG_ERROR", hint);
    this.name = "ConfigError";
  }
}

export class CredentialError extends AppError {
  constructor(message: string, hint?: string) {
    super(message, "CREDENTIAL_ERROR", hint);
    this.name = "CredentialError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, hint?: string) {
    super(message, "VALIDATION_ERROR", hint);
    this.name = "ValidationError";
  }
}

export class ProviderError extends AppError {
  constructor(message: string, hint?: string) {
    super(message, "PROVIDER_ERROR", hint);
    this.name = "ProviderError";
  }
}
