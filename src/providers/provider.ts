export interface ProviderTask {
  prompt: string;
  structuredPrompt: string;
  model: string;
  projectType?: string;
}

export interface AIResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface Model {
  id: string;
  name: string;
}

export interface AIProvider {
  readonly name: string;
  validateCredentials(): Promise<boolean>;
  sendTask(task: ProviderTask): Promise<AIResponse>;
  listModels?(): Promise<Model[]>;
}
