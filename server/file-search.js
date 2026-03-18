import fs from "fs";
import path from "path";

/*
====================================
FILE SEARCH SYSTEM
====================================
Searches project files for keywords
*/

const ROOT = path.resolve(process.cwd(), "..");

/*
====================================
SCAN DIRECTORY
====================================
*/

function scan(dir, keyword, results) {

  const items = fs.readdirSync(dir);

  for (const item of items) {

    const full = path.join(dir, item);

    const stat = fs.statSync(full);

    if (stat.isDirectory()) {

      if (
        item === "node_modules" ||
        item === ".git" ||
        item === ".DS_Store"
      ) continue;

      scan(full, keyword, results);

    } else {

      try {

        const content = fs.readFileSync(full, "utf8");

        if (content.toLowerCase().includes(keyword.toLowerCase())) {

          results.push(full.replace(ROOT + "/", ""));

        }

      } catch {}

    }

  }

}

/*
====================================
SEARCH PROJECT
====================================
*/

export function searchProject(keyword) {

  const results = [];

  scan(ROOT, keyword, results);

  return results;

}