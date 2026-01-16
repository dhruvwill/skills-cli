import { $ } from "bun";
import { resolve } from "path";
import { rm, cp, mkdir } from "fs/promises";
import chalk from "chalk";
import Table from "cli-table3";
import { addSource, removeSource, getSources } from "../lib/config.ts";
import { parseGitUrl, getDefaultSkillName, getLocalSkillName, getSkillPath, SKILLS_STORE } from "../lib/paths.ts";
import { directoryExists } from "../lib/hash.ts";

/**
 * Add a source (remote or local)
 * @param pathOrUrl - Git URL or local path
 * @param type - "remote" or "local"
 * @param customName - Optional custom name to override default
 */
export async function sourceAdd(pathOrUrl: string, type: "remote" | "local", customName?: string): Promise<void> {
  if (type === "remote") {
    await addRemoteSource(pathOrUrl, customName);
  } else {
    await addLocalSource(pathOrUrl, customName);
  }
}

/**
 * Add a remote Git repository as a source
 */
async function addRemoteSource(url: string, customName?: string): Promise<void> {
  const parsed = parseGitUrl(url);
  
  if (!parsed) {
    throw new Error(`Invalid Git URL: ${url}. Expected formats:\n  - https://github.com/owner/repo\n  - https://gitlab.com/owner/repo\n  - https://bitbucket.org/owner/repo\n  - https://any-host.com/owner/repo.git`);
  }

  const defaultName = getDefaultSkillName(parsed);
  const skillName = customName || defaultName;
  const targetPath = getSkillPath(skillName);
  const cloneUrl = parsed.cloneUrl;
  const branch = parsed.branch || "main";

  console.log(`Adding remote source: ${url}`);
  console.log(`Skill name: ${chalk.cyan(skillName)}`);
  if (customName && customName !== defaultName) {
    console.log(`  (renamed from: ${defaultName})`);
  }
  if (parsed.subdir) {
    console.log(`Subdirectory: ${parsed.subdir}`);
  }

  // Check if skill name already exists
  if (await directoryExists(targetPath)) {
    throw new Error(`Skill "${skillName}" already exists. Remove it first with 'skills source remove ${skillName}' or use --name to specify a different name.`);
  }

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
    name: skillName,
  });

  console.log(chalk.green(`Successfully added skill: ${skillName}`));
}

/**
 * Add a local folder as a source
 */
async function addLocalSource(folderPath: string, customName?: string): Promise<void> {
  const absolutePath = resolve(folderPath);
  
  if (!(await directoryExists(absolutePath))) {
    throw new Error(`Local folder does not exist: ${absolutePath}`);
  }

  const defaultName = getLocalSkillName(absolutePath);
  const skillName = customName || defaultName;
  const targetPath = getSkillPath(skillName);

  console.log(`Adding local source: ${absolutePath}`);
  console.log(`Skill name: ${chalk.cyan(skillName)}`);
  if (customName && customName !== defaultName) {
    console.log(`  (renamed from: ${defaultName})`);
  }

  // Check if skill name already exists
  if (await directoryExists(targetPath)) {
    throw new Error(`Skill "${skillName}" already exists. Remove it first with 'skills source remove ${skillName}' or use --name to specify a different name.`);
  }

  // Copy files
  console.log("Copying files...");
  await cp(absolutePath, targetPath, { recursive: true });

  // Add to config
  await addSource({
    type: "local",
    path: absolutePath,
    name: skillName,
  });

  console.log(chalk.green(`Successfully added skill: ${skillName}`));
}

/**
 * Remove a source by name
 */
export async function sourceRemove(name: string): Promise<void> {
  const removed = await removeSource(name);
  
  if (!removed) {
    throw new Error(`Skill not found: ${name}`);
  }

  // Remove the files from store
  const targetPath = getSkillPath(name);
  await rm(targetPath, { recursive: true, force: true });

  console.log(chalk.green(`Removed skill: ${name}`));
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
      chalk.bold("Skill"),
      chalk.bold("Type"),
      chalk.bold("Source"),
      chalk.bold("Status"),
    ],
    style: {
      head: [],
      border: [],
    },
  });

  for (const source of sources) {
    const exists = await directoryExists(getSkillPath(source.name));
    const status = exists ? chalk.green("OK") : chalk.red("MISSING");
    
    table.push([
      source.name,
      source.type,
      source.url || source.path || "",
      status,
    ]);
  }

  console.log();
  console.log(table.toString());
  console.log();
}
