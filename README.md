# skills

> Sync AI skills across all your agent tools with one command

Supports **Cursor**, **Claude Desktop**, **Gemini CLI**, **Codex**, **GitHub Copilot**, and any tool with a skills directory.

[Installation](#installation) •
[Quick Start](#quick-start) •
[Commands](#commands) •
[Configuration](#configuration) •
[FAQ](#faq)

---

## Why skills?

**The problem**: You create a skill for Cursor, but need it in Claude Desktop and Gemini too. Manually copying? Tedious. What if you update it? Copy again to every tool.

**The solution**: One source of truth. Add once, sync everywhere.

```bash
skills source add https://github.com/vercel/ai-skills --remote
skills target add cursor ~/.cursor/skills
skills target add claude ~/.claude/settings/skills
skills sync  # Done! Skills synced to all targets
```

### What makes it different

| Feature | Description |
|---------|-------------|
| 🔄 **Multi-source** | Pull from GitHub, GitLab, Bitbucket, or local folders |
| 🎯 **Multi-target** | Sync to Cursor, Claude, Gemini, or any custom directory |
| 📂 **Subdirectory support** | Install specific skills from large repos |
| 🔍 **Diagnostics** | `doctor` command checks your setup |
| ⚡ **Fast** | Built with Bun for maximum performance |

---

## Installation

### Prerequisites

- [Bun](https://bun.sh) runtime
- Git (for remote sources)

### Install via Bun

```bash
# Clone the repository
git clone https://github.com/yourusername/skills.git
cd skills

# Install dependencies
bun install

# Link globally
bun link
```

After linking, the `skills` command is available globally.

### Verify Installation

```bash
skills --version
skills doctor
```

---

## Quick Start

```bash
# 1. Add a skill source (from GitHub)
skills source add https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices --remote

# 2. Add your targets (where skills should be synced)
skills target add cursor ~/.cursor/skills
skills target add claude ~/.claude/settings/skills

# 3. Sync!
skills sync
```

Check your setup anytime:

```bash
skills status   # Overview of sources & targets
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
│   vercel-labs/           anthropic/         local/          │
│   └── react-best-...     └── cursor-...     └── my-skill/   │
│                                                             │
│                   ⬆ Single Source of Truth ⬆                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ skills sync
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│    Cursor     │     │ Claude Desktop│     │  Gemini CLI   │
│ ~/.cursor/    │     │ ~/.claude/    │     │ ~/.gemini/    │
│    skills/    │     │    skills/    │     │    skills/    │
└───────────────┘     └───────────────┘     └───────────────┘
```

---

## Commands

### Overview

| Command | Description |
|---------|-------------|
| `skills status` | Show overview of sources, targets & sync state |
| `skills doctor` | Diagnose configuration issues |
| `skills sync` | Push skills from store to all targets |
| `skills update` | Refresh all sources from origin |

### Source Management

| Command | Description |
|---------|-------------|
| `skills source list` | List all registered sources |
| `skills source add <url> --remote` | Add a remote Git repository |
| `skills source add <path> --local` | Add a local folder |
| `skills source remove <namespace>` | Remove a source |

### Target Management

| Command | Description |
|---------|-------------|
| `skills target list` | List all targets with sync status |
| `skills target add <name> <path>` | Add a target directory |
| `skills target remove <name>` | Remove a target |

---

## Adding Sources

### From GitHub

```bash
# Full repository
skills source add https://github.com/owner/repo --remote

# Specific subdirectory (great for mono-repos)
skills source add https://github.com/owner/repo/tree/main/skills/specific-skill --remote
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

## Adding Targets

Add any directory where you want skills synced:

```bash
# Cursor
skills target add cursor ~/.cursor/skills

# Claude Desktop
skills target add claude ~/.claude/settings/skills

# Gemini CLI
skills target add gemini ~/.gemini/skills

# Custom location
skills target add myapp ~/myapp/ai-skills
```

---

## Configuration

### Directory Structure

```
~/.skills/
├── store/                    # Central repository for all skills
│   ├── owner/skill-name/     # Remote sources (owner/skill format)
│   └── local/folder-name/    # Local sources
└── config.json               # Registry of sources and targets
```

### Config File

Located at `~/.skills/config.json`:

```json
{
  "sources": [
    {
      "type": "remote",
      "url": "https://github.com/owner/repo/tree/main/skills/my-skill",
      "namespace": "owner/my-skill"
    },
    {
      "type": "local",
      "path": "/home/user/my-skills",
      "namespace": "local/my-skills"
    }
  ],
  "targets": [
    {
      "name": "cursor",
      "path": "/home/user/.cursor/skills"
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

### Can I sync to a custom/uncommon tool?

Yes! Use `skills target add <name> <path>` with any directory path.

### What happens when I run `skills sync`?

The contents of `~/.skills/store/` are copied to all registered target directories.

### How do I update skills from remote sources?

```bash
skills update  # Pulls latest from all remote sources
skills sync    # Pushes to all targets
```

### What if a source URL changes?

Remove the old source and add the new one:

```bash
skills source remove owner/old-skill
skills source add https://github.com/owner/new-skill --remote
```

---

## Common Issues

### "Git is not installed"

Install Git from [git-scm.com](https://git-scm.com/) or via your package manager.

### "Source already exists"

Remove it first, then re-add:

```bash
skills source remove owner/skill-name
skills source add <url> --remote
```

### "Target directory missing"

The directory will be created automatically when you run `skills sync`.

### Need help?

```bash
skills doctor  # Run diagnostics
skills status  # Check current state
skills --help  # Show all commands
```

---

## Contributing

```bash
git clone https://github.com/yourusername/skills.git
cd skills
bun install
bun test
```

---

## License

MIT
