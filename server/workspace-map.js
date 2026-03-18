import fs from "fs";
import path from "path";

/*
====================================
WORKSPACE MAP SYSTEM
====================================
Scans project directory and returns
file tree for agent awareness
*/

const ROOT = path.resolve(process.cwd(), "..");

/*
====================================
SCAN DIRECTORY
====================================
*/

function scanDirectory(dir) {

  const items = fs.readdirSync(dir);

  const result = [];

  for (const item of items) {

    const full = path.join(dir, item);

    const stat = fs.statSync(full);

    if (stat.isDirectory()) {

      if (
        item === "node_modules" ||
        item === ".git" ||
        item === ".DS_Store"
      ) continue;

      result.push({
        type: "folder",
        name: item,
        children: scanDirectory(full)
      });

    } else {

      result.push({
        type: "file",
        name: item
      });

    }

  }

  return result;

}

/*
====================================
BUILD WORKSPACE MAP
====================================
*/

export function getWorkspaceMap() {

  return scanDirectory(ROOT);

}