import { resolve } from "path";
import { mkdir } from "fs/promises";
import chalk from "chalk";
import Table from "cli-table3";
import { addTarget, removeTarget, getTargets } from "../lib/config.ts";
import { SKILLS_STORE } from "../lib/paths.ts";
import { compareDirectories, directoryExists } from "../lib/hash.ts";
import { syncToTarget } from "./sync.ts";

/**
 * Add a target directory
 */
export async function targetAdd(name: string, path: string): Promise<void> {
  const absolutePath = resolve(path.replace(/^~/, process.env.HOME || process.env.USERPROFILE || ""));

  console.log(`Adding target: ${name}`);
  console.log(`Path: ${absolutePath}`);

  // Create the target directory if it doesn't exist
  await mkdir(absolutePath, { recursive: true });

  // Add to config
  await addTarget({
    name,
    path: absolutePath,
  });

  console.log(`Successfully registered target: ${name}`);

  // Perform initial sync
  console.log("Performing initial sync...");
  await syncToTarget({ name, path: absolutePath });
  
  console.log(`Target "${name}" is now synced.`);
}

/**
 * Remove a target by name
 */
export async function targetRemove(name: string): Promise<void> {
  const removed = await removeTarget(name);
  
  if (!removed) {
    throw new Error(`Target not found: ${name}`);
  }

  console.log(`Removed target: ${name}`);
  console.log(`Note: Files at ${removed.path} were not deleted.`);
}

/**
 * List all targets with sync status in a table format
 */
export async function targetList(): Promise<void> {
  const targets = await getTargets();

  if (targets.length === 0) {
    console.log("No targets registered.");
    console.log(`Add a target with: ${chalk.cyan("skills target add <name> <path>")}`);
    return;
  }

  const table = new Table({
    head: [
      chalk.bold("Name"),
      chalk.bold("Path"),
      chalk.bold("Status"),
    ],
    style: {
      head: [],
      border: [],
    },
  });

  for (const target of targets) {
    const status = await compareDirectories(SKILLS_STORE, target.path);
    let statusDisplay: string;
    
    if (status === "synced") {
      statusDisplay = chalk.green("synced");
    } else if (status === "not synced") {
      statusDisplay = chalk.yellow("outdated");
    } else {
      statusDisplay = chalk.red("missing");
    }
    
    table.push([
      target.name,
      target.path,
      statusDisplay,
    ]);
  }

  console.log();
  console.log(table.toString());
  console.log();
}
