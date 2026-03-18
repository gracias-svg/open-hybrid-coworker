import fs from "fs";
import path from "path";

const workspaceRoot = process.cwd();

/*
Recursively scan workspace
*/

function walkDirectory(dir, fileList = []) {

  const files = fs.readdirSync(dir);

  for (const file of files) {

    const fullPath = path.join(dir, file);

    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {

      if (
        file === "node_modules" ||
        file === ".git" ||
        file === "dist"
      ) {
        continue;
      }

      walkDirectory(fullPath, fileList);

    } else {

      fileList.push(fullPath);

    }

  }

  return fileList;

}

/*
Search workspace for keyword
*/

export function searchWorkspace(query) {

  if (!query) {
    return "No search query provided.";
  }

  const files = walkDirectory(workspaceRoot);

  const matches = [];

  for (const file of files) {

    try {

      const content = fs.readFileSync(file, "utf8");

      if (content.toLowerCase().includes(query.toLowerCase())) {

        matches.push(file);

      }

    } catch (err) {
      // ignore binary files
    }

  }

  if (!matches.length) {
    return "No matches found.";
  }

  return matches.join("\n");

}