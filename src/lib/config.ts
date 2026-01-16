import { mkdir } from "fs/promises";
import { SKILLS_ROOT, SKILLS_STORE, CONFIG_PATH } from "./paths.ts";
import type { Config, Source, Target } from "../types.ts";

const DEFAULT_CONFIG: Config = {
  sources: [],
  targets: [],
};

/**
 * Ensure the skills directories exist
 */
export async function ensureDirectories(): Promise<void> {
  await mkdir(SKILLS_ROOT, { recursive: true });
  await mkdir(SKILLS_STORE, { recursive: true });
}

/**
 * Read the config file, creating it if it doesn't exist
 */
export async function readConfig(): Promise<Config> {
  await ensureDirectories();

  const configFile = Bun.file(CONFIG_PATH);
  
  if (!(await configFile.exists())) {
    await writeConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }

  try {
    const content = await configFile.json();
    return content as Config;
  } catch {
    // If config is corrupted, reset it
    await writeConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }
}

/**
 * Write the config file
 */
export async function writeConfig(config: Config): Promise<void> {
  await ensureDirectories();
  await Bun.write(CONFIG_PATH, JSON.stringify(config, null, 2));
}

/**
 * Add a source to the config
 */
export async function addSource(source: Source): Promise<void> {
  const config = await readConfig();
  
  // Check if namespace already exists
  const existing = config.sources.find(s => s.namespace === source.namespace);
  if (existing) {
    throw new Error(`Source with namespace "${source.namespace}" already exists`);
  }

  config.sources.push(source);
  await writeConfig(config);
}

/**
 * Remove a source from the config
 */
export async function removeSource(namespace: string): Promise<Source | null> {
  const config = await readConfig();
  
  const index = config.sources.findIndex(s => s.namespace === namespace);
  if (index === -1) {
    return null;
  }

  const [removed] = config.sources.splice(index, 1);
  await writeConfig(config);
  return removed;
}

/**
 * Get all sources
 */
export async function getSources(): Promise<Source[]> {
  const config = await readConfig();
  return config.sources;
}

/**
 * Add a target to the config
 */
export async function addTarget(target: Target): Promise<void> {
  const config = await readConfig();
  
  // Check if name already exists
  const existing = config.targets.find(t => t.name === target.name);
  if (existing) {
    throw new Error(`Target with name "${target.name}" already exists`);
  }

  config.targets.push(target);
  await writeConfig(config);
}

/**
 * Remove a target from the config
 */
export async function removeTarget(name: string): Promise<Target | null> {
  const config = await readConfig();
  
  const index = config.targets.findIndex(t => t.name === name);
  if (index === -1) {
    return null;
  }

  const [removed] = config.targets.splice(index, 1);
  await writeConfig(config);
  return removed;
}

/**
 * Get all targets
 */
export async function getTargets(): Promise<Target[]> {
  const config = await readConfig();
  return config.targets;
}
