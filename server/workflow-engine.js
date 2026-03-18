import { runAgent } from "./agent-runtime.js";

/*
====================================
OCC WORKFLOW ENGINE
====================================
Runs scheduled autonomous workflows
*/

class WorkflowEngine {

  constructor() {

    this.workflows = [];

  }

  /*
  ====================================
  REGISTER WORKFLOW
  ====================================
  */

  registerWorkflow(name, prompt, interval) {

    this.workflows.push({
      name,
      prompt,
      interval,
      timer: null
    });

  }

  /*
  ====================================
  START ENGINE
  ====================================
  */

  start() {

    console.log("[WorkflowEngine] Starting autonomous workflows");

    for (const workflow of this.workflows) {

      console.log(`[WorkflowEngine] Scheduled: ${workflow.name}`);

      workflow.timer = setInterval(async () => {

        try {

          console.log(`[WorkflowEngine] Running: ${workflow.name}`);

          const result = await runAgent(workflow.prompt);

          console.log("[WorkflowEngine] Result:", result);

        } catch (error) {

          console.error("[WorkflowEngine] Error:", error.message);

        }

      }, workflow.interval);

    }

  }

}

/*
====================================
WORKFLOW INSTANCE
====================================
*/

export const workflowEngine = new WorkflowEngine();

/*
====================================
DEFAULT WORKFLOWS
====================================
*/

workflowEngine.registerWorkflow(
  "AI Agents Research",
  "Research the latest AI agents news and summarize it",
  1000 * 60 * 60 * 6
);