import { resolve } from "path";
import { mkdir } from "fs/promises";
import chalk from "chalk";
import Table from "cli-table3";
import { addTarget, removeTarget, getTargets } from "../lib/config.ts";
import { SKILLS_STORE } from "../lib/paths.ts";
import { compareDirectories, directoryExists } from "../lib/hash.ts";
import { syncToTarget } from "./sync.ts";
import { getKnownTarget, KNOWN_TARGETS } from "../lib/known-targets.ts";

/**
 * Add a target directory
 * If path is not provided, looks up known targets
 */
export async function targetAdd(name: string, path?: string): Promise<void> {
  let absolutePath: string;
  
  if (path) {
    // User provided a custom path
    absolutePath = resolve(path.replace(/^~/, process.env.HOME || process.env.USERPROFILE || ""));
  } else {
    // Look up known target
    const known = getKnownTarget(name);
    if (!known) {
      console.error(chalk.red(`Unknown target: ${name}`));
      console.log(`\nRun ${chalk.cyan("skills target available")} to see predefined targets.`);
      console.log(`Or specify a custom path: ${chalk.cyan(`skills target add ${name} <path>`)}`);
      process.exit(1);
    }
    absolutePath = known.path;
    console.log(`Using predefined path for ${chalk.cyan(known.description)}`);
  }

  console.log(`Adding target: ${chalk.cyan(name)}`);
  console.log(`Path: ${absolutePath}`);

  // Create the target directory if it doesn't exist
  await mkdir(absolutePath, { recursive: true });

  // Add to config
  await addTarget({
    name,
    path: absolutePath,
  });

  console.log(chalk.green(`Successfully registered target: ${name}`));

  // Perform initial sync
  console.log("Performing initial sync...");
  await syncToTarget({ name, path: absolutePath });
  
  console.log(chalk.green(`Target "${name}" is now synced.`));
}

/**
 * Show available predefined targets
 */
export async function targetAvailable(): Promise<void> {
  const existingTargets = await getTargets();
  const existingNames = new Set(existingTargets.map(t => t.name.toLowerCase()));

  console.log();
  console.log(chalk.bold("Available Predefined Targets"));
  console.log(chalk.dim("─".repeat(60)));
  console.log();

  const table = new Table({
    head: [
      chalk.bold("Name"),
      chalk.bold("Description"),
      chalk.bold("Path"),
      chalk.bold("Added"),
    ],
    style: {
      head: [],
      border: [],
    },
  });

  for (const target of KNOWN_TARGETS) {
    const isAdded = existingNames.has(target.name.toLowerCase());
    const addedStatus = isAdded ? chalk.green("✓") : chalk.dim("-");
    
    table.push([
      target.name,
      target.description,
      target.path,
      addedStatus,
    ]);
  }

  console.log(table.toString());
  console.log();
  console.log(chalk.bold("Usage:"));
  console.log(`  ${chalk.cyan("skills target add <name>")}              Add a predefined target`);
  console.log(`  ${chalk.cyan("skills target add <name> <path>")}       Add a custom target`);
  console.log();
  console.log(chalk.bold("Examples:"));
  console.log(`  ${chalk.cyan("skills target add cursor")}              Uses predefined path`);
  console.log(`  ${chalk.cyan("skills target add myapp ~/.myapp/skills")}  Custom path`);
  console.log();
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
