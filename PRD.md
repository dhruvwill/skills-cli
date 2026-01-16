# PRD: skills CLI

**Version:** 1.1  
**CLI Name:** `skills`  
**Root Directory:** `~/.skills`  
**Tech Stack:** Bun (Runtime & Shell), Git Subtree

---

## 1. Overview
The `skills` CLI is a synchronization tool designed to manage AI "skills"—collections of prompts, tool definitions, and logic—across various local agent environments and remote repositories. It centralizes these assets into a single source of truth at `~/.skills/store` and distributes them to defined "targets" (e.g., Cursor, Antigravity, Claude Desktop).

## 2. Problem Statement
* **Target Fragmentation:** AI editors and agent frameworks require skill files to be located in specific, often hidden, local directories.
* **Update Lag:** When a remote skill repository is updated, the local agent's copy remains stale until manually updated.
* **Redundancy:** Developers often have the same skill logic duplicated across multiple directories, making maintenance difficult.

## 3. Directory Structure
The CLI operates within a hidden root directory in the user's home folder:
* `~/.skills/` - Root directory.
* `~/.skills/store/` - The central repository for all ingested skill files.
* `~/.skills/config.json` - Registry for all sources (remote/local) and targets (agent directories).

---

## 4. Functional Requirements

### 4.1 Source Management
The "Source" is where the skills originate. The CLI pulls these into the central `/store`.

| Command | Flag | Description | Implementation |
| :--- | :--- | :--- | :--- |
| `skills source add "url"` | `--remote` | Adds a remote Git repo or subdirectory. | Uses `git subtree add` to pull files into `/store`. |
| `skills source add "path"` | `--local` | Registers a local folder as a source. | Copies or symlinks content into `/store`. |
| `skills update` | N/A | Refreshes all sources. | Executes `git subtree pull` for remotes and `rsync` for locals. |

### 4.2 Target Management
The "Target" is the destination where the skills are needed (e.g., the `.gemini` folder).

| Command | Description | Implementation |
| :--- | :--- | :--- |
| `skills target list` | Lists all registered targets and status. | Checks if the target folder contents match the `/store` hash. Displays `synced` or `not synced`. |
| `skills target add <name> <path>` | Adds an agent directory as a target. | Saves path to `config.json` and triggers an initial sync to that directory. |
| `skills sync` | Pushes skills to all targets. | Iterates through all targets in `config.json` and copies `/store` content to them. |

---

## 5. Technical Implementation Details

### 5.1 Bun Shell Integration
To ensure high performance, all filesystem and Git operations should utilize Bun's native shell:
```typescript
import { $ } from "bun";

// Example: Syncing a target
await $`cp -r ~/.skills/store/* ${targetPath}`;