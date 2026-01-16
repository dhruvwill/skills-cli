import { homedir } from "os";
import { join } from "path";

export interface KnownTarget {
  name: string;
  description: string;
  path: string;
}

const home = homedir();

/**
 * Predefined target paths for common AI tools
 * Based on official documentation for each tool's global skills folder
 * 
 * Reference:
 * | Tool         | Global Skills Folder              |
 * |--------------|-----------------------------------|
 * | Cursor       | ~/.cursor/skills/                 |
 * | Claude Code  | ~/.claude/skills/                 |
 * | Gemini CLI   | ~/.gemini/skills/                 |
 * | VS Code      | ~/.copilot/skills/                |
 * | OpenCode     | ~/.config/opencode/skills/        |
 * | Windsurf     | ~/.windsurf/skills/               |
 * | Antigravity  | ~/.gemini/antigravity/skills/     |
 */
export const KNOWN_TARGETS: KnownTarget[] = [
  {
    name: "cursor",
    description: "Cursor IDE",
    path: join(home, ".cursor", "skills"),
  },
  {
    name: "claude",
    description: "Claude Code / Claude Desktop",
    path: join(home, ".claude", "skills"),
  },
  {
    name: "gemini",
    description: "Gemini CLI",
    path: join(home, ".gemini", "skills"),
  },
  {
    name: "vscode",
    description: "GitHub Copilot / VS Code",
    path: join(home, ".copilot", "skills"),
  },
  {
    name: "opencode",
    description: "OpenCode CLI",
    path: join(home, ".config", "opencode", "skills"),
  },
  {
    name: "windsurf",
    description: "Windsurf IDE",
    path: join(home, ".windsurf", "skills"),
  },
  {
    name: "antigravity",
    description: "Antigravity",
    path: join(home, ".gemini", "antigravity", "skills"),
  },
];

/**
 * Get a known target by name
 */
export function getKnownTarget(name: string): KnownTarget | undefined {
  return KNOWN_TARGETS.find(t => t.name.toLowerCase() === name.toLowerCase());
}

/**
 * Get all known target names
 */
export function getKnownTargetNames(): string[] {
  return KNOWN_TARGETS.map(t => t.name);
}
