import fs from "fs";
import path from "path";

/*
====================================
OCC SNAPSHOT BACKUP SYSTEM
====================================
Creates automatic backups before
files are modified
*/

const workspaceRoot = path.resolve(process.cwd(), "workspace");

const snapshotRoot = path.resolve(workspaceRoot, ".snapshots");

function ensureSnapshotFolder() {

  if (!fs.existsSync(snapshotRoot)) {
    fs.mkdirSync(snapshotRoot, { recursive: true });
  }

}

/*
====================================
CREATE SNAPSHOT
====================================
*/

export function createSnapshot(filePath) {

  ensureSnapshotFolder();

  if (!fs.existsSync(filePath)) {
    return;
  }

  const filename = path.basename(filePath);

  const timestamp = Date.now();

  const snapshotFile = path.join(
    snapshotRoot,
    `${timestamp}-${filename}`
  );

  fs.copyFileSync(filePath, snapshotFile);

}

/*
====================================
LIST SNAPSHOTS
====================================
*/

export function listSnapshots() {

  ensureSnapshotFolder();

  return fs.readdirSync(snapshotRoot);

}