import fs from "fs";
import path from "path";

/*
====================================
OCC MEMORY SYSTEM
====================================
Persistent agent memory storage
*/

const memoryPath = path.resolve(process.cwd(), "workspace", "memory.json");

/*
====================================
LOAD MEMORY
====================================
*/

export function loadMemory() {

  if (!fs.existsSync(memoryPath)) {
    return { history: [] };
  }

  try {

    const raw = fs.readFileSync(memoryPath, "utf8");

    return JSON.parse(raw);

  } catch {

    return { history: [] };

  }

}

/*
====================================
SAVE MEMORY
====================================
*/

export function saveMemory(memory) {

  fs.writeFileSync(
    memoryPath,
    JSON.stringify(memory, null, 2),
    "utf8"
  );

}

/*
====================================
ADD MEMORY ENTRY
====================================
*/

export function remember(entry) {

  const memory = loadMemory();

  memory.history.push({
    time: Date.now(),
    entry
  });

  saveMemory(memory);

}

/*
====================================
GET MEMORY
====================================
*/

export function recall(limit = 10) {

  const memory = loadMemory();

  return memory.history.slice(-limit);

}