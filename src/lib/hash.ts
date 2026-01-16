import { readdir, stat } from "fs/promises";
import { join } from "path";

/**
 * Recursively get all files in a directory with their content hashes
 */
async function getDirectoryFiles(dirPath: string, basePath: string = ""): Promise<Map<string, string>> {
  const files = new Map<string, string>();
  
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;
      
      if (entry.isDirectory()) {
        const subFiles = await getDirectoryFiles(fullPath, relativePath);
        for (const [path, hash] of subFiles) {
          files.set(path, hash);
        }
      } else if (entry.isFile()) {
        const file = Bun.file(fullPath);
        const content = await file.arrayBuffer();
        const hash = Bun.hash(content).toString(16);
        files.set(relativePath, hash);
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }
  
  return files;
}

/**
 * Compute a hash representing the entire directory structure and contents
 */
export async function hashDirectory(dirPath: string): Promise<string> {
  const files = await getDirectoryFiles(dirPath);
  
  if (files.size === 0) {
    return "empty";
  }
  
  // Sort files by path for consistent hashing
  const sortedEntries = Array.from(files.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  
  // Combine all file paths and hashes
  const combined = sortedEntries.map(([path, hash]) => `${path}:${hash}`).join("|");
  
  return Bun.hash(combined).toString(16);
}

/**
 * Check if a directory exists and is not empty
 */
export async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Compare two directories and return if they are in sync
 */
export async function compareDirectories(source: string, target: string): Promise<"synced" | "not synced" | "target missing"> {
  const targetExists = await directoryExists(target);
  if (!targetExists) {
    return "target missing";
  }
  
  const sourceHash = await hashDirectory(source);
  const targetHash = await hashDirectory(target);
  
  return sourceHash === targetHash ? "synced" : "not synced";
}
