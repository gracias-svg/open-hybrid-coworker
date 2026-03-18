/*
====================================
OCC OBSERVER SYSTEM
====================================
Monitors task execution and results
*/

export function observeStep(step, result) {

  if (!result || (typeof result === "string" && result.toLowerCase().includes("error"))) {
    
    // Prevent false retries on successful tool outcomes
    if (typeof result === "string" && (result.includes("Opened URL") || result.includes("Search URL"))) {
      return { success: true };
    }

    return {
      success: false,
      reason: result || "Empty result"
    };
  }

  // Double check success strings even if they don't contain "error"
  if (typeof result === "string" && (result.includes("Opened URL") || result.includes("Search URL"))) {
    return { success: true };
  }

  return {
    success: true
  };

}

export function observeTask(step, result) {

  if (!step) {
    return {
      status: "unknown",
      message: "No step provided"
    };
  }

  /*
  ====================================
  DETECT TOOL ERRORS
  ====================================
  */

  if (typeof result === "string" && result.toLowerCase().includes("error")) {

    return {
      status: "failed",
      message: result
    };

  }

  /*
  ====================================
  DETECT PERMISSION DENIAL
  ====================================
  */

  if (typeof result === "string" && result.toLowerCase().includes("denied")) {

    return {
      status: "denied",
      message: result
    };

  }

  /*
  ====================================
  SUCCESS
  ====================================
  */

  return {
    status: "success",
    message: result
  };

}