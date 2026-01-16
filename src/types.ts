/**
 * Source configuration - where skills originate from
 */
export interface Source {
  /** Type of source */
  type: "remote" | "local";
  /** Git URL for remote sources */
  url?: string;
  /** Absolute path for local sources */
  path?: string;
  /** Skill name used in store and targets (e.g., "react-best-practices") */
  name: string;
}

/**
 * Target configuration - where skills are synced to
 */
export interface Target {
  /** User-friendly name (e.g., "cursor") */
  name: string;
  /** Absolute path to target directory */
  path: string;
}

/**
 * Main configuration file structure
 */
export interface Config {
  sources: Source[];
  targets: Target[];
}

/**
 * Sync status for targets
 */
export type SyncStatus = "synced" | "not synced" | "target missing";
