import OpenRouter from '@openrouter/sdk';
const client = new OpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY
});
const response = await client.chat.send({
  model: "minimax/minimax-m2",
  messages: [
    { role: "user", content: "Explain quantum computing" }
  ]
});
