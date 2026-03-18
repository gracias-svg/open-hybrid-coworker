/*
===================================
OCC DRY RUN SYSTEM
===================================
Simulates tool actions before execution
*/

export function simulateTool(name, input) {

  if (name === "write_file") {

    return {
      type: "dry_run",
      message: `DRY RUN: Would write file "${input.filename}".`,
      tool: name,
      input
    };

  }

  if (name === "bash") {

    return {
      type: "dry_run",
      message: `DRY RUN: Would execute command "${input.command}".`,
      tool: name,
      input
    };

  }

  return null;

}