import { mkdir, rename, rm } from "fs/promises";
import { join } from "path";
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
 * Also handles migration from old config format (namespace -> name)
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
    
    // Migrate old config format (namespace -> name)
    let needsMigration = false;
    if (content.sources) {
      for (const source of content.sources) {
        if (source.namespace && !source.name) {
          // Extract skill name from old namespace (e.g., "owner/skill" -> "skill")
          const oldNamespace = source.namespace;
          const parts = oldNamespace.split("/");
          const newName = parts[parts.length - 1];
          source.name = newName;
          delete source.namespace;
          needsMigration = true;
          
          // Also migrate the folder structure
          await migrateSkillFolder(oldNamespace, newName);
        }
      }
    }
    
    if (needsMigration) {
      await writeConfig(content as Config);
    }
    
    return content as Config;
  } catch {
    // If config is corrupted, reset it
    await writeConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }
}

/**
 * Migrate a skill folder from old nested structure to new flat structure
 */
async function migrateSkillFolder(oldNamespace: string, newName: string): Promise<void> {
  const oldPath = join(SKILLS_STORE, oldNamespace);
  const newPath = join(SKILLS_STORE, newName);
  
  try {
    // Check if old path exists
    const oldExists = await Bun.file(join(oldPath, "SKILL.md")).exists() || 
                      await Bun.file(oldPath).exists();
    
    if (oldExists) {
      // Check if new path already exists
      const newExists = await Bun.file(newPath).exists();
      
      if (!newExists) {
        // Move the folder
        await rename(oldPath, newPath);
        console.log(`Migrated skill folder: ${oldNamespace} -> ${newName}`);
        
        // Try to clean up empty parent directories
        const parentDir = join(SKILLS_STORE, oldNamespace.split("/")[0]);
        try {
          await rm(parentDir, { recursive: false });
        } catch {
          // Parent dir not empty or doesn't exist, ignore
        }
      }
    }
  } catch {
    // Migration failed, folder might not exist
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
  
  // Check if name already exists
  const existing = config.sources.find(s => s.name === source.name);
  if (existing) {
    throw new Error(`Skill with name "${source.name}" already exists`);
  }

  config.sources.push(source);
  await writeConfig(config);
}

/**
 * Remove a source from the config
 */
export async function removeSource(name: string): Promise<Source | null> {
  const config = await readConfig();
  
  const index = config.sources.findIndex(s => s.name === name);
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
