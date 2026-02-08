const models = {
  deepseekChimera: 'tngtech/deepseek-r1t2-chimera:free',
  arcee: 'arcee-ai/trinity-large-preview:free',
  stepFun: 'stepfun/step-3.5-flash:free',
  pony: 'openrouter/pony-alpha',
};
const schemas = {
  default: {
    "name": "defaultSchema",
    "strict": true,
    "schema": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "number" },
          "output": { "type": "string" }
        },
        "required": ["id", "output"],
        "additionalProperties": false
      }
    }
  }
};

export { models, schemas }
