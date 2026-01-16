import { $ } from "bun";
import { rm, cp } from "fs/promises";
import { getSources } from "../lib/config.ts";
import { getNamespacePath, parseGitUrl } from "../lib/paths.ts";
import { directoryExists } from "../lib/hash.ts";

/**
 * Update all sources from their origins
 */
export async function update(): Promise<void> {
  const sources = await getSources();

  if (sources.length === 0) {
    console.log("No sources registered.");
    console.log("Add a source with: skills source add <url> --remote");
    return;
  }

  console.log("Updating all sources...\n");

  for (const source of sources) {
    try {
      if (source.type === "remote") {
        await updateRemoteSource(source.namespace, source.url!);
      } else {
        await updateLocalSource(source.namespace, source.path!);
      }
    } catch (error) {
      console.error(`  ${source.namespace}: Failed - ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log("\nUpdate complete.");
  console.log("Run 'skills sync' to push changes to targets.");
}

/**
 * Update a remote source by re-cloning
 */
async function updateRemoteSource(namespace: string, url: string): Promise<void> {
  const targetPath = getNamespacePath(namespace);
  const parsed = parseGitUrl(url);
  
  if (!parsed) {
    throw new Error(`Invalid URL: ${url}`);
  }
  
  const cloneUrl = parsed.cloneUrl;
  const branch = parsed.branch || "main";
  
  console.log(`  ${namespace}: Updating from ${url}...`);

  // Remove existing directory
  await rm(targetPath, { recursive: true, force: true });

  // Re-clone
  try {
    if (parsed.subdir) {
      // Use sparse checkout for subdirectory
      const tempPath = `${targetPath}_temp`;
      
      await $`git clone --filter=blob:none --no-checkout --depth 1 --branch ${branch} ${cloneUrl} ${tempPath}`.quiet();
      await $`git -C ${tempPath} sparse-checkout init --cone`.quiet();
      await $`git -C ${tempPath} sparse-checkout set ${parsed.subdir}`.quiet();
      await $`git -C ${tempPath} checkout`.quiet();
      
      // Move subdirectory to target
      const subdirFullPath = `${tempPath}/${parsed.subdir}`;
      await cp(subdirFullPath, targetPath, { recursive: true });
      
      // Clean up
      await rm(tempPath, { recursive: true, force: true });
    } else {
      await $`git clone --depth 1 --branch ${branch} ${cloneUrl} ${targetPath}`.quiet();
      
      // Remove .git directory
      await rm(`${targetPath}/.git`, { recursive: true, force: true });
    }
    
    console.log(`  ${namespace}: Updated`);
  } catch (error) {
    // Clean up on failure
    await rm(`${targetPath}_temp`, { recursive: true, force: true });
    throw new Error(`Failed to clone: ${error}`);
  }
}

/**
 * Update a local source by re-copying
 */
async function updateLocalSource(namespace: string, sourcePath: string): Promise<void> {
  const targetPath = getNamespacePath(namespace);
  
  console.log(`  ${namespace}: Updating from ${sourcePath}...`);

  // Check if source still exists
  if (!(await directoryExists(sourcePath))) {
    throw new Error(`Source folder no longer exists: ${sourcePath}`);
  }

  // Remove existing directory
  await rm(targetPath, { recursive: true, force: true });

  // Re-copy
  await cp(sourcePath, targetPath, { recursive: true });
  
  console.log(`  ${namespace}: Updated`);
}
