const models = {
  deepseekChimera: 'tngtech/deepseek-r1t2-chimera:free',
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
