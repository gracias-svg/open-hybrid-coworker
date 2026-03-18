import { executeTool } from "./tools.js";

/*
Autonomous Agent Loop
Handles multi-step reasoning
*/

export async function runAgent(provider, prompt, chatId) {

  const MAX_STEPS = 6;

  let step = 0;

  let currentPrompt = prompt;

  while (step < MAX_STEPS) {

    const stream = provider.query({
      prompt: currentPrompt,
      chatId
    });

    for await (const event of stream) {

      if (event.type === "tool_use") {

        const toolName = event.name;
        const args = event.input || {};

        const result = await executeTool(toolName, args);

        currentPrompt =
          `Tool ${toolName} executed.\nResult:\n${result}\n\nContinue task.`;

        step++;

        break;

      }

      if (event.type === "text") {
        return event.content;
      }

    }

  }

  return "Agent reached maximum reasoning steps.";
}