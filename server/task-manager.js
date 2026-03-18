import { executeTool } from "./tools.js";

const tasks = new Map(); 

export async function executeTask(step) {
  if (step.tool === "none") {
    return step.description;
  }
  return await executeTool(step.tool, step.input || {});
}

export function createTask(prompt, plan) { 

  const task_id = "task_" + Date.now(); 

  const task = { 
    task_id, 
    prompt, 
    plan, 
    completedSteps: [] 
  }; 

  tasks.set(task_id, task); 

  return task; 

} 

export function updateTask(task_id, step) { 

  const task = tasks.get(task_id); 

  if (!task) return; 

  task.completedSteps.push(step); 

}
