import { homedir } from "os";
import { join } from "path";

export interface KnownTarget {
  name: string;
  description: string;
  path: string;
  status: "GA" | "Beta" | "Experimental";
}

const home = homedir();

/**
 * Predefined target paths for common AI tools
 * Based on official documentation for each tool's global skills folder
 * 
 * Reference:
 * | Tool         | Global Skills Folder              | Status |
 * |--------------|-----------------------------------|--------|
 * | Claude Code  | ~/.claude/skills/                 | GA     |
 * | Gemini CLI   | ~/.gemini/skills/                 | Beta   |
 * | Cursor       | ~/.cursor/skills/                 | GA     |
 * | VS Code      | ~/.copilot/skills/                | GA     |
 * | OpenCode     | ~/.config/opencode/skills/        | GA     |
 * | Windsurf     | ~/.windsurf/skills/               | GA     |
 * | Antigravity  | ~/.gemini/antigravity/            | Exp.   |
 * | Aider        | ~/.aider/skills/                  | Beta   |
 * | Goose        | ~/.config/goose/skills/           | Beta   |
 * | Amp          | ~/.amp/skills/                    | Beta   |
 */
export const KNOWN_TARGETS: KnownTarget[] = [
  {
    name: "cursor",
    description: "Cursor IDE",
    path: join(home, ".cursor", "skills"),
    status: "GA",
  },
  {
    name: "claude",
    description: "Claude Code / Claude Desktop",
    path: join(home, ".claude", "skills"),
    status: "GA",
  },
  {
    name: "gemini",
    description: "Gemini CLI",
    path: join(home, ".gemini", "skills"),
    status: "Beta",
  },
  {
    name: "copilot",
    description: "GitHub Copilot / VS Code",
    path: join(home, ".copilot", "skills"),
    status: "GA",
  },
  {
    name: "opencode",
    description: "OpenCode CLI",
    path: join(home, ".config", "opencode", "skills"),
    status: "GA",
  },
  {
    name: "windsurf",
    description: "Windsurf IDE",
    path: join(home, ".windsurf", "skills"),
    status: "GA",
  },
  {
    name: "antigravity",
    description: "Antigravity",
    path: join(home, ".gemini", "antigravity"),
    status: "Experimental",
  },
  {
    name: "aider",
    description: "Aider CLI",
    path: join(home, ".aider", "skills"),
    status: "Beta",
  },
  {
    name: "goose",
    description: "Goose AI",
    path: join(home, ".config", "goose", "skills"),
    status: "Beta",
  },
  {
    name: "amp",
    description: "Amp AI",
    path: join(home, ".amp", "skills"),
    status: "Beta",
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
