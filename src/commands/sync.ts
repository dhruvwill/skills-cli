import { cp, rm, mkdir } from "fs/promises";
import { getTargets } from "../lib/config.ts";
import { SKILLS_STORE } from "../lib/paths.ts";
import { directoryExists } from "../lib/hash.ts";
import type { Target } from "../types.ts";

/**
 * Sync a single target with the store
 */
export async function syncToTarget(target: Target): Promise<void> {
  // Ensure target directory exists
  await mkdir(target.path, { recursive: true });

  // Check if store has content
  const storeExists = await directoryExists(SKILLS_STORE);
  if (!storeExists) {
    console.log(`  ${target.name}: Store is empty, nothing to sync`);
    return;
  }

  // Clear target and copy fresh from store
  // We remove contents but keep the directory
  const entries = await Bun.file(target.path).exists() ? [] : [];
  
  try {
    // Remove existing contents
    const { readdir } = await import("fs/promises");
    const existingFiles = await readdir(target.path);
    
    for (const file of existingFiles) {
      await rm(`${target.path}/${file}`, { recursive: true, force: true });
    }
  } catch {
    // Directory might be empty or not exist
  }

  // Copy store contents to target
  await cp(SKILLS_STORE, target.path, { recursive: true });
  
  console.log(`  ${target.name}: Synced`);
}

/**
 * Sync all targets with the store
 */
export async function sync(): Promise<void> {
  const targets = await getTargets();

  if (targets.length === 0) {
    console.log("No targets registered.");
    console.log("Add a target with: skills target add <name> <path>");
    return;
  }

  const storeExists = await directoryExists(SKILLS_STORE);
  if (!storeExists) {
    console.log("Store is empty. Add sources first with: skills source add <url> --remote");
    return;
  }

  console.log("Syncing skills to all targets...\n");

  for (const target of targets) {
    try {
      await syncToTarget(target);
    } catch (error) {
      console.error(`  ${target.name}: Failed - ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log("\nSync complete.");
}
