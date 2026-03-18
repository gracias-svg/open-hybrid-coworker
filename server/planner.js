/*
====================================
OCC AGENT PLANNER
====================================
Converts user prompts into a
structured multi-step execution plan
*/

export async function generatePlan(callLLM, prompt) {

  const systemPrompt = `
You are an AI task planner.

You MUST return ONLY a valid JSON array.

Format:
[
{ "type": "response", "content": "text response" }
]

Rules:

* No explanations
* No markdown
* No text outside JSON
* Always return an array
  `;

  const message = await callLLM([
    {
      role: "user",
      content: systemPrompt + "\n\nUser request: " + prompt
    }
  ]);

  let raw = message?.content?.trim() || "";

  try {

    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return parsed.slice(0, 3);
    }

  } catch (err) {
    // Fallback to treating raw text as response
  }

  return [{
    type: "response",
    content: raw || "I’m here. How can I help you?"
  }];
}

export async function createPlan(prompt) {

  if (!prompt) {

    return {
      steps: []
    };

  }

  const lower = prompt.toLowerCase();

  /*
  ====================================
  FILE WRITE TASK
  ====================================
  */

  if (lower.includes("write") && lower.includes(".md")) {

    return {
      steps: [
        {
          description: "Write markdown file",
          tool: "write_file",
          input: {
            filename: "output.md",
            content: prompt
          }
        }
      ]
    };

  }

  /*
  ====================================
  WEB SEARCH TASK
  ====================================
  */

  if (lower.includes("search") || lower.includes("research")) {

    return {
      steps: [
        {
          description: "Search the web",
          tool: "web_search",
          input: {
            query: prompt
          }
        }
      ]
    };

  }

  /*
  ====================================
  OPEN URL TASK
  ====================================
  */

  if (lower.includes("open") && lower.includes("youtube")) {

    return {
      steps: [
        {
          description: "Open YouTube",
          tool: "open_url",
          input: {
            url: "https://youtube.com"
          }
        }
      ]
    };

  }

  /*
  ====================================
  DEFAULT RESPONSE
  ====================================
  */

  return {
    steps: [
      {
        description: "Return prompt",
        tool: "none",
        input: {
          message: prompt
        }
      }
    ]
  };

}