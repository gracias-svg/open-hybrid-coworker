import fs from "fs";
import path from "path";
import { exec } from "child_process";

import { getWorkspaceMap } from "./workspace-map.js";
import { createSnapshot } from "./snapshot-system.js";
import { searchProject } from "./file-search.js";

/*
====================================
WORKSPACE ROOT (SANDBOX)
====================================
*/

const WORKSPACE = path.resolve(process.cwd(), "workspace");

/*
====================================
SAFE PATH RESOLUTION
====================================
*/

function resolveWorkspacePath(filename) {

  const full = path.resolve(WORKSPACE, filename);

  if (!full.startsWith(WORKSPACE)) {
    throw new Error(`Access outside workspace blocked: ${full}`);
  }

  return full;

}

/*
====================================
COMMAND FIREWALL
====================================
*/

const BLOCKED_COMMANDS = [
  "rm",
  "rm -rf",
  "sudo",
  "dd",
  "mkfs",
  "shutdown",
  "reboot",
  "chmod",
  "chown"
];

/*
====================================
RUN SHELL COMMAND
====================================
*/

function runCommand(command) {

  if (BLOCKED_COMMANDS.some(cmd => command.trim().startsWith(cmd) || command.includes(` ${cmd} `))) {
    return Promise.resolve("Command blocked by safety firewall.");
  }

  return new Promise((resolve) => {

    const safeCommand = `cd ${WORKSPACE} && ${command}`;

    exec(safeCommand, { shell: true }, (error, stdout, stderr) => {

      if (error) {
        resolve(stderr || error.message);
      } else {
        resolve(stdout || "Command executed.");
      }

    });

  });

}

/*
====================================
WRITE FILE TOOL
====================================
*/

async function writeFileTool(input) {

  const filename = input.filename || "output.txt";
  const content = input.content || "";

  const filePath = resolveWorkspacePath(filename);

  console.log(`🧪 DRY RUN: Would write file "${filename}".`);

  createSnapshot(filePath);

  fs.writeFileSync(filePath, content, "utf8");

  return `File written: ${filename}`;

}

/*
====================================
READ FILE TOOL
====================================
*/

async function readFileTool(input) {

  const filename = input.filename;

  if (!filename) {
    return "No filename provided.";
  }

  const filePath = resolveWorkspacePath(filename);

  if (!fs.existsSync(filePath)) {
    return "File not found.";
  }

  const content = fs.readFileSync(filePath, "utf8");

  return content;

}

/*
====================================
WEB SEARCH TOOL
====================================
*/

async function webSearchTool(input) {

  const query = input.query || "";

  if (!query) {
    return "No search query provided.";
  }

  const url = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;

  return `Search URL: ${url}`;

}

/*
====================================
OPEN URL TOOL
====================================
*/

async function openUrlTool(input) {

  const url = input.url;

  if (!url) {
    return "No URL provided.";
  }

  const command =
    process.platform === "darwin"
      ? `open "${url}"`
      : process.platform === "win32"
      ? `start ${url}`
      : `xdg-open "${url}"`;

  exec(command);

  return {
    success: true,
    url: url
  };

}

/*
====================================
WORKSPACE INDEX TOOL
====================================
*/

async function workspaceIndexTool() {

  const map = getWorkspaceMap();

  return JSON.stringify(map, null, 2);

}

/*
====================================
FILE SEARCH TOOL
====================================
*/

async function fileSearchTool(input) {

  const keyword = input.keyword;

  if (!keyword) {
    return "No search keyword provided.";
  }

  const results = searchProject(keyword);

  if (results.length === 0) {
    return "No matches found.";
  }

  return results.join("\n");

}

/*
====================================
YOUTUBE SEARCH TOOL
====================================
*/

export async function youtubeSearch(query) {

  const searchUrl =
    "https://www.youtube.com/results?search_query=" +
    encodeURIComponent(query);

  const res = await fetch(searchUrl);
  const html = await res.text();

  const match = html.match(/\/watch\?v=[a-zA-Z0-9_-]{11}/);

  if (match) {
    const videoUrl = "https://www.youtube.com" + match[0];
    return "Here is the video you requested: " + videoUrl;
  }

  return "No YouTube video found";

}

/*
====================================
WEB SCRAPE TOOL
====================================
*/

export async function webScrape(url) {

  const res = await fetch(url);
  const html = await res.text();

  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text.slice(0, 2000);

}

/*
====================================
EXTRACT FIRST YOUTUBE LINK TOOL
====================================
*/

export async function extractFirstYoutubeLink(searchUrl) {

  const res = await fetch(searchUrl);
  const html = await res.text();

  const match = html.match(/https:\/\/www\.youtube\.com\/watch\?v=[a-zA-Z0-9_-]+/);

  if (match) {
    return "Opened URL: " + match[0];
  }

  return "No YouTube video found";

}

/*
====================================
LEGACY EXPORTS FOR PROVIDER
====================================
*/

export async function webSearch(query) {
  return await webSearchTool({ query });
}

export async function webFetch(url) {
  return await openUrlTool({ url });
}

export async function writeFile(filename, content) {
  return await writeFileTool({ filename, content });
}

export async function readFile(filename) {
  return await readFileTool({ filename });
}

export async function youtube_search(query) {
  return await youtubeSearch(query);
}

export async function web_scrape(url) {
  return await webScrape(url);
}

/*
====================================
TOOL REGISTRY (JSON)
====================================
*/

export const TOOL_REGISTRY = [
  {
    type: "function",
    function: {
      name: "youtube_search",
      description: "Search YouTube and return the first video URL",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "web_scrape",
      description: "Extract readable text from a webpage",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string" }
        },
        required: ["url"]
      }
    }
  }
];

/*
====================================
TOOL ROUTER
====================================
*/

export async function executeTool(name, input) {

  if (name === "write_file") {
    return await writeFileTool(input);
  }

  if (name === "read_file") {
    return await readFileTool(input);
  }

  if (name === "bash") {
    return await runCommand(input.command);
  }

  if (name === "web_search") {
    return await webSearchTool(input);
  }

  if (name === "youtube_search") {
    return await youtubeSearch(input.query);
  }

  if (name === "web_scrape") {
    return await webScrape(input.url);
  }

  if (name === "open_url") {
    return await openUrlTool(input);
  }

  if (name === "workspace_index") {
    return await workspaceIndexTool();
  }

  if (name === "file_search") {
    return await fileSearchTool(input);
  }

  return `Unknown tool: ${name}`;

}