import { OpenRouter } from '@openrouter/sdk';

export interface FetchConfig {
  apiKey?: string;
  prompt: string;
  llmModel: string;
  jsonSchema?: any;
}

export class Fetcher {
  private config: FetchConfig;
  private client: any;

  constructor(config: FetchConfig) {
    this.config = {
      ...config,
      apiKey: config.apiKey || process.env.OPENROUTER_API_KEY
    };
    this.client = new OpenRouter({ apiKey: this.config.apiKey });
  }

  async fetchResults(input: string) {
    const completion = await this.client.chat.send({
      model: this.config.llmModel,
      messages: [
        { role: 'user', content: `${this.config.prompt}\n\nInput: ${input}` },
      ],
      responseFormat: {
        type: this.config.jsonSchema ? "json_schema" : "json_object",
        jsonSchema: this.config.jsonSchema
      },
      stream: false,
    });
    console.dir(completion?.choices?.[0]?.message);
    const content = completion?.choices?.[0]?.message?.content;
    const stripped = content?.replace("```json", "")?.replace("```", "")?.trim()
    return stripped;
  }
}
