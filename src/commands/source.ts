import { $ } from "bun";
import { resolve } from "path";
import { rm, cp, mkdir } from "fs/promises";
import chalk from "chalk";
import Table from "cli-table3";
import { addSource, removeSource, getSources } from "../lib/config.ts";
import { parseGitUrl, getRemoteNamespace, getLocalNamespace, getNamespacePath, SKILLS_STORE } from "../lib/paths.ts";
import { directoryExists } from "../lib/hash.ts";

/**
 * Add a source (remote or local)
 */
export async function sourceAdd(pathOrUrl: string, type: "remote" | "local"): Promise<void> {
  if (type === "remote") {
    await addRemoteSource(pathOrUrl);
  } else {
    await addLocalSource(pathOrUrl);
  }
}

/**
 * Add a remote Git repository as a source
 */
async function addRemoteSource(url: string): Promise<void> {
  const parsed = parseGitUrl(url);
  
  if (!parsed) {
    throw new Error(`Invalid Git URL: ${url}. Expected formats:\n  - https://github.com/owner/repo\n  - https://gitlab.com/owner/repo\n  - https://bitbucket.org/owner/repo\n  - https://any-host.com/owner/repo.git`);
  }

  const namespace = getRemoteNamespace(parsed);
  const targetPath = getNamespacePath(namespace);
  const cloneUrl = parsed.cloneUrl;
  const branch = parsed.branch || "main";

  console.log(`Adding remote source: ${url}`);
  console.log(`Namespace: ${namespace}`);
  if (parsed.subdir) {
    console.log(`Subdirectory: ${parsed.subdir}`);
  }

  // Check if directory already exists
  if (await directoryExists(targetPath)) {
    throw new Error(`Source already exists at ${namespace}. Remove it first with 'skills source remove ${namespace}'`);
  }

  // Create parent directory if needed
  await mkdir(getNamespacePath(parsed.owner), { recursive: true });

  // Clone the repository
  console.log("Cloning repository...");
  
  try {
    if (parsed.subdir) {
      // Use sparse checkout to only get the specific subdirectory
      const tempPath = `${targetPath}_temp`;
      
      // Initialize sparse checkout
      await $`git clone --filter=blob:none --no-checkout --depth 1 --branch ${branch} ${cloneUrl} ${tempPath}`.quiet();
      
      // Configure sparse checkout
      await $`git -C ${tempPath} sparse-checkout init --cone`.quiet();
      await $`git -C ${tempPath} sparse-checkout set ${parsed.subdir}`.quiet();
      await $`git -C ${tempPath} checkout`.quiet();
      
      // Move the subdirectory to the target path
      const subdirFullPath = `${tempPath}/${parsed.subdir}`;
      await cp(subdirFullPath, targetPath, { recursive: true });
      
      // Clean up temp directory
      await rm(tempPath, { recursive: true, force: true });
    } else {
      // Clone the entire repository
      await $`git clone --depth 1 --branch ${branch} ${cloneUrl} ${targetPath}`.quiet();
      
      // Remove .git directory to avoid nested git repos
      await rm(`${targetPath}/.git`, { recursive: true, force: true });
    }
  } catch (error) {
    // Clean up on failure
    await rm(targetPath, { recursive: true, force: true });
    await rm(`${targetPath}_temp`, { recursive: true, force: true });
    throw new Error(`Failed to clone repository: ${error}`);
  }

  // Add to config
  await addSource({
    type: "remote",
    url,
    namespace,
  });

  console.log(`Successfully added remote source: ${namespace}`);
}

/**
 * Add a local folder as a source
 */
async function addLocalSource(folderPath: string): Promise<void> {
  const absolutePath = resolve(folderPath);
  
  if (!(await directoryExists(absolutePath))) {
    throw new Error(`Local folder does not exist: ${absolutePath}`);
  }

  const namespace = getLocalNamespace(absolutePath);
  const targetPath = getNamespacePath(namespace);

  console.log(`Adding local source: ${absolutePath}`);
  console.log(`Namespace: ${namespace}`);

  // Check if namespace already exists
  if (await directoryExists(targetPath)) {
    throw new Error(`Source already exists at ${namespace}. Remove it first with 'skills source remove ${namespace}'`);
  }

  // Create local directory
  await mkdir(getNamespacePath("local"), { recursive: true });

  // Copy files
  console.log("Copying files...");
  await cp(absolutePath, targetPath, { recursive: true });

  // Add to config
  await addSource({
    type: "local",
    path: absolutePath,
    namespace,
  });

  console.log(`Successfully added local source: ${namespace}`);
}

/**
 * Remove a source by namespace
 */
export async function sourceRemove(namespace: string): Promise<void> {
  const removed = await removeSource(namespace);
  
  if (!removed) {
    throw new Error(`Source not found: ${namespace}`);
  }

  // Remove the files from store
  const targetPath = getNamespacePath(namespace);
  await rm(targetPath, { recursive: true, force: true });

  console.log(`Removed source: ${namespace}`);
}

/**
 * List all sources in a table format
 */
export async function sourceList(): Promise<void> {
  const sources = await getSources();

  if (sources.length === 0) {
    console.log("No sources registered.");
    console.log(`Add a source with: ${chalk.cyan("skills source add <url> --remote")}`);
    return;
  }

  const table = new Table({
    head: [
      chalk.bold("Namespace"),
      chalk.bold("Type"),
      chalk.bold("Location"),
      chalk.bold("Status"),
    ],
    style: {
      head: [],
      border: [],
    },
  });

  for (const source of sources) {
    const exists = await directoryExists(getNamespacePath(source.namespace));
    const status = exists ? chalk.green("OK") : chalk.red("MISSING");
    
    table.push([
      source.namespace,
      source.type,
      source.url || source.path || "",
      status,
    ]);
  }

  console.log();
  console.log(table.toString());
  console.log();
}
