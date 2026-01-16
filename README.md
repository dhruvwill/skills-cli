# Skills CLI

> Sync AI skills across all your agent tools with one command

Supports **Cursor**, **Claude Code**, **Gemini CLI**, **GitHub Copilot**, **OpenCode**, **Windsurf**, and more.

[Installation](#installation) •
[Quick Start](#quick-start) •
[Commands](#commands) •
[Supported Tools](#supported-tools) •
[Configuration](#configuration) •
[FAQ](#faq)

---

## Why Skills CLI?

**The problem**: You create a skill for Cursor, but need it in Claude Code and Gemini too. Manually copying? Tedious. What if you update it? Copy again to every tool.

**The solution**: One source of truth. Add once, sync everywhere.

```bash
skills source add https://github.com/user/repo/tree/main/skills/react --remote
skills target add cursor
skills target add claude
skills sync  # Done! Skills synced to all targets
```

### What makes it different

| Feature | Description |
|---------|-------------|
| 🔄 **Multi-source** | Pull from GitHub, GitLab, Bitbucket, or local folders |
| 🎯 **Multi-target** | Sync to Cursor, Claude, Gemini, Copilot, or any custom directory |
| 📂 **Subdirectory support** | Install specific skills from large mono-repos |
| 🏷️ **Rename skills** | Use `--name` to avoid conflicts |
| 🔍 **Diagnostics** | `doctor` command checks your setup |
| ⚡ **Fast** | Built with Bun for maximum performance |

---

## Installation

### Prerequisites

- [Bun](https://bun.sh) runtime (required - uses Bun shell)
- Git (for remote sources)

### Install via Bun

```bash
bun install -g @dhruvwill/skills-cli
```

### Install from Source

```bash
# Clone the repository
git clone https://github.com/dhruvwill/skills.git
cd skills

# Install dependencies
bun install

# Link globally
bun link
```

### Verify Installation

```bash
skills --version
skills doctor
```

---

## Quick Start

```bash
# 1. Add a skill from GitHub
skills source add https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices --remote

# 2. Add your targets (path auto-detected for known tools)
skills target add cursor
skills target add claude

# 3. Sync!
skills sync
```

Check your setup anytime:

```bash
skills status   # Overview of skills & targets
skills doctor   # Diagnose issues
```

---

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    Remote Sources                           │
│   GitHub • GitLab • Bitbucket • Self-hosted Git            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ skills source add
┌─────────────────────────────────────────────────────────────┐
│                    ~/.skills/store/                         │
│                                                             │
│   react-best-practices/    my-custom-skill/    local-skill/ │
│                                                             │
│                   ⬆ Single Source of Truth ⬆                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ skills sync
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│    Cursor     │     │  Claude Code  │     │  Gemini CLI   │
│ ~/.cursor/    │     │ ~/.claude/    │     │ ~/.gemini/    │
│    skills/    │     │    skills/    │     │    skills/    │
└───────────────┘     └───────────────┘     └───────────────┘
```

---

## Commands

### Overview

| Command | Description |
|---------|-------------|
| `skills status` | Show overview of skills, targets & sync state |
| `skills doctor` | Diagnose configuration issues |
| `skills sync` | Push skills from store to all targets |
| `skills update` | Refresh all skills from origin |

### Skill Management

| Command | Description |
|---------|-------------|
| `skills source list` | List all registered skills |
| `skills source add <url> --remote` | Add a skill from Git repository |
| `skills source add <path> --local` | Add a skill from local folder |
| `skills source add <url> --remote --name <name>` | Add with custom name |
| `skills source remove <name>` | Remove a skill by name |

### Target Management

| Command | Description |
|---------|-------------|
| `skills target list` | List all targets with sync status |
| `skills target available` | Show predefined targets with paths |
| `skills target add <name>` | Add a predefined target (auto-detects path) |
| `skills target add <name> <path>` | Add a custom target with specific path |
| `skills target remove <name>` | Remove a target |

---

## Supported Tools

Run `skills target available` to see all supported tools:

| Tool | Path | Status |
|------|------|--------|
| **Cursor** | `~/.cursor/skills/` | GA |
| **Claude Code** | `~/.claude/skills/` | GA |
| **GitHub Copilot** | `~/.copilot/skills/` | GA |
| **OpenCode** | `~/.config/opencode/skills/` | GA |
| **Windsurf** | `~/.windsurf/skills/` | GA |
| **Gemini CLI** | `~/.gemini/skills/` | Beta |
| **Aider** | `~/.aider/skills/` | Beta |
| **Goose** | `~/.config/goose/skills/` | Beta |
| **Amp** | `~/.amp/skills/` | Beta |
| **Antigravity** | `~/.gemini/antigravity/` | Experimental |

### Adding Predefined Targets

```bash
# Just use the name - path is auto-detected
skills target add cursor
skills target add claude
skills target add gemini
```

### Adding Custom Targets

```bash
# For tools not in the list, specify the path
skills target add mytool ~/path/to/mytool/skills
```

---

## Adding Skills

### From GitHub

```bash
# Full repository
skills source add https://github.com/owner/repo --remote

# Specific subdirectory (great for mono-repos)
skills source add https://github.com/owner/repo/tree/main/skills/my-skill --remote

# With custom name (to avoid conflicts)
skills source add https://github.com/owner/repo --remote --name my-custom-name
```

### From GitLab

```bash
skills source add https://gitlab.com/owner/repo --remote
skills source add https://gitlab.com/owner/repo/-/tree/main/skills/my-skill --remote
```

### From Bitbucket

```bash
skills source add https://bitbucket.org/owner/repo --remote
skills source add https://bitbucket.org/owner/repo/src/main/skills/my-skill --remote
```

### From Local Folder

```bash
skills source add ./my-local-skills --local
skills source add /absolute/path/to/skills --local
```

---

## Configuration

### Directory Structure

```
~/.skills/
├── store/                    # Central repository for all skills
│   ├── react-best-practices/ # Each skill in its own folder
│   │   ├── SKILL.md
│   │   └── rules/
│   └── my-custom-skill/
│       └── SKILL.md
└── config.json               # Registry of sources and targets
```

### Skill Folder Structure

Each skill should follow this structure:

```
skill-name/
├── SKILL.md          # Main skill definition (required)
├── AGENTS.md         # Agent behavior (optional)
├── rules/            # Additional rules (optional)
│   ├── rule-1.md
│   └── rule-2.md
└── metadata.json     # Skill metadata (optional)
```

### Config File

Located at `~/.skills/config.json`:

```json
{
  "sources": [
    {
      "type": "remote",
      "url": "https://github.com/owner/repo/tree/main/skills/my-skill",
      "name": "my-skill"
    },
    {
      "type": "local",
      "path": "/home/user/my-skills",
      "name": "my-local-skill"
    }
  ],
  "targets": [
    {
      "name": "cursor",
      "path": "/home/user/.cursor/skills"
    },
    {
      "name": "claude",
      "path": "/home/user/.claude/skills"
    }
  ]
}
```

---

## FAQ

### How is this different from manually copying files?

Skills CLI provides:
- **Single source of truth** - Update once, sync everywhere
- **Git integration** - Pull updates from remote repos with `skills update`
- **Subdirectory support** - Install specific skills from large mono-repos
- **Status tracking** - Know which targets are synced or outdated
- **Auto-detection** - No need to remember paths for common tools

### What happens when I run `skills sync`?

The contents of `~/.skills/store/` are copied to all registered target directories, maintaining the folder structure:

```
~/.skills/store/my-skill/  →  ~/.cursor/skills/my-skill/
                           →  ~/.claude/skills/my-skill/
                           →  ~/.gemini/skills/my-skill/
```

### How do I handle naming conflicts?

Use the `--name` flag when adding skills:

```bash
# Two different "utils" skills from different repos
skills source add https://github.com/user1/repo --remote --name user1-utils
skills source add https://github.com/user2/repo --remote --name user2-utils
```

### How do I update skills from remote sources?

```bash
skills update  # Pulls latest from all remote sources
skills sync    # Pushes to all targets
```

### Can I add a tool that's not in the predefined list?

Yes! Just specify the path:

```bash
skills target add mytool ~/path/to/mytool/skills
```

---

## Common Issues

### "Git is not installed"

Install Git from [git-scm.com](https://git-scm.com/) or via your package manager.

### "Skill already exists"

Either remove it first or use `--name` to give it a different name:

```bash
skills source remove old-skill
skills source add <url> --remote

# Or use a different name
skills source add <url> --remote --name new-name
```

### "Unknown target"

The target isn't in the predefined list. Specify the path:

```bash
skills target add mytool ~/path/to/skills
```

### Need help?

```bash
skills doctor        # Run diagnostics
skills status        # Check current state
skills target available  # See predefined targets
skills --help        # Show all commands
```

---

## Contributing

```bash
git clone https://github.com/dhruvwill/skills.git
cd skills
bun install
bun test
```

## Links

- **npm**: [npmjs.com/package/@dhruvwill/skills-cli](https://www.npmjs.com/package/@dhruvwill/skills-cli)
- **GitHub**: [github.com/dhruvwill/skills](https://github.com/dhruvwill/skills)

---

## License

MIT
