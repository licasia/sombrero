const models = {
  deepseekChimera: 'tngtech/deepseek-r1t2-chimera:free',
};
const schemas = {
  default: {
    "type": "array",
    "items": {
      "type": "object",
      "properties": {
        "id": { "type": "number" },
        "output": {}
      },
      "required": ["id", "result"],
      "additionalProperties": false
    }
  }
};

export { models, schemas }
