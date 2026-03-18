import { createPlan } from "./planner.js";
import { executeTask } from "./task-manager.js";
import { observeTask } from "./observer.js";
import { remember } from "./memory.js";

/*
====================================
OCC AGENT RUNTIME
====================================
Coordinates planning, execution,
observation, and memory
*/

export async function runAgent(prompt) {

  const plan = await createPlan(prompt);

  const results = [];

  if (!plan || !plan.steps) {
    return "No plan generated.";
  }

  for (const step of plan.steps) {

    /*
    ====================================
    EXECUTE TASK
    ====================================
    */

    const result = await executeTask(step);

    /*
    ====================================
    OBSERVE RESULT
    ====================================
    */

    const observation = observeTask(step, result);

    /*
    ====================================
    STORE MEMORY
    ====================================
    */

    remember({
      step: step.description,
      tool: step.tool,
      result: observation.status
    });

    results.push({
      step: step.description,
      tool: step.tool,
      input: step.input,
      result
    });

  }

  return results;

}