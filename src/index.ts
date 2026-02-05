import { OpenRouter } from '@openrouter/sdk';
import 'dotenv/config';

const API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = 'tngtech/deepseek-r1t2-chimera:free';
const SCHEMA = {
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": { "type": "number" },
      "extractedName": { "type": "string" }
    },
    "required": ["id", "extractedName"],
    "additionalProperties": false
  }
};

class Sombrero {
  getOpenRouter(apiKey) {
    return openRouter = new OpenRouter({
      apiKey: apiKey
    });
  }

  async fetchResult() {
    return Sombrero.fetchResult(this.prompt, this.model);
  }

  static async fetchResult(prompt, model) {
    const completion = await openRouter.chat.send({
      model: model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: jsonSchema
      },
      stream: false,
    });
    return completion?.choices?.[0]?.message?.content
  }
}
