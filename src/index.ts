import { OpenRouter } from '@openrouter/sdk';
import 'dotenv/config';
import { prisma } from './db.js';

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
  static API_KEY: string = process.env.OPENROUTER_API_KEY || "";
  prompt: string = "";
  model: string = "";
  jsonSchema: any;

  constructor(prompt: string, model: string, jsonSchema: any) {
    this.prompt = prompt;
    this.model = model;
    this.jsonSchema = jsonSchema;
  }

  static getOpenRouter(apiKey: string) {
    return new OpenRouter({
      apiKey: apiKey
    });
  }

  async fetchResult() {
    return Sombrero.fetchResult(this.prompt, this.model, this.jsonSchema);
  }

  static async fetchResult(prompt: string, model: string, jsonSchema: any) {
    const completion = await this.getOpenRouter(this.API_KEY).chat.send({
      model: model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      responseFormat: {
        type: "json_schema",
        jsonSchema: jsonSchema
      },
      stream: false,
    });
    return completion?.choices?.[0]?.message?.content
  }
}

console.log(await prisma.escort.findFirst({}));
