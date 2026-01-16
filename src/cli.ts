#!/usr/bin/env bun

import chalk from "chalk";
import { sourceAdd, sourceRemove, sourceList } from "./commands/source.ts";
import { targetAdd, targetRemove, targetList, targetAvailable } from "./commands/target.ts";
import { sync } from "./commands/sync.ts";
import { update } from "./commands/update.ts";
import { doctor } from "./commands/doctor.ts";
import { status } from "./commands/status.ts";

const VERSION = "1.1.0";

function printHelp() {
  console.log(`
${chalk.bold("skills")} - Sync AI skills across all your agent tools

${chalk.bold("USAGE")}
  ${chalk.cyan("skills")} <command> [options]

${chalk.bold("COMMANDS")}
  ${chalk.cyan("status")}                        Show overview of skills, targets & sync state
  ${chalk.cyan("doctor")}                        Diagnose configuration issues

  ${chalk.bold("Skill Management")}
  ${chalk.cyan("source list")}                   List all registered skills
  ${chalk.cyan("source add")} <url> ${chalk.dim("--remote")}     Add a skill from Git repository
  ${chalk.cyan("source add")} <path> ${chalk.dim("--local")}     Add a skill from local folder
  ${chalk.cyan("source remove")} <name>          Remove a skill by name

  ${chalk.bold("Target Management")}
  ${chalk.cyan("target list")}                   List all targets with sync status
  ${chalk.cyan("target available")}              Show predefined targets (cursor, claude, etc.)
  ${chalk.cyan("target add")} <name>             Add a predefined target (auto-detects path)
  ${chalk.cyan("target add")} <name> <path>      Add a custom target with specific path
  ${chalk.cyan("target remove")} <name>          Remove a target

  ${chalk.bold("Synchronization")}
  ${chalk.cyan("sync")}                          Push skills from store to all targets
  ${chalk.cyan("update")}                        Refresh all skills from origin

${chalk.bold("OPTIONS")}
  ${chalk.cyan("--name <name>")}                 Custom name for the skill (avoids conflicts)
  ${chalk.cyan("--remote")}                      Source is a Git repository
  ${chalk.cyan("--local")}                       Source is a local folder
  ${chalk.cyan("--help, -h")}                    Show this help message
  ${chalk.cyan("--version, -v")}                 Show version

${chalk.bold("EXAMPLES")}
  ${chalk.dim("# Add a skill from GitHub")}
  ${chalk.cyan("skills source add")} https://github.com/user/repo/tree/main/skills/react --remote

  ${chalk.dim("# Add with custom name (to avoid conflicts)")}
  ${chalk.cyan("skills source add")} https://github.com/user/repo --remote --name my-react-skill

  ${chalk.dim("# Add from GitLab or Bitbucket")}
  ${chalk.cyan("skills source add")} https://gitlab.com/user/repo --remote
  ${chalk.cyan("skills source add")} https://bitbucket.org/user/repo --remote

  ${chalk.dim("# Add local skills folder")}
  ${chalk.cyan("skills source add")} ./my-local-skills --local

  ${chalk.dim("# Add predefined targets (path auto-detected)")}
  ${chalk.cyan("skills target add")} cursor
  ${chalk.cyan("skills target add")} claude
  ${chalk.cyan("skills target add")} gemini

  ${chalk.dim("# Add custom target with specific path")}
  ${chalk.cyan("skills target add")} myapp ~/myapp/skills

  ${chalk.dim("# Sync to all targets")}
  ${chalk.cyan("skills sync")}

${chalk.bold("FOLDER STRUCTURE")}
  ${chalk.dim("After sync, skills are stored as:")}
  ~/.cursor/skills/skill-name/SKILL.md
  ~/.claude/skills/skill-name/SKILL.md

${chalk.bold("DOCUMENTATION")}
  ${chalk.dim("https://github.com/dhruvwill/skills")}
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  if (args.includes("--version") || args.includes("-v")) {
    console.log(`skills v${VERSION}`);
    process.exit(0);
  }

  const command = args[0];
  const subcommand = args[1];

  try {
    switch (command) {
      case "source":
        await handleSourceCommand(subcommand, args.slice(2));
        break;

      case "target":
        await handleTargetCommand(subcommand, args.slice(2));
        break;

      case "sync":
        await sync();
        break;

      case "update":
        await update();
        break;

      case "doctor":
        await doctor();
        break;

      case "status":
        await status();
        break;

      case "help":
        printHelp();
        break;

      default:
        console.error(chalk.red(`Unknown command: ${command}`));
        console.log(`Run ${chalk.cyan("skills --help")} for usage.`);
        process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
    process.exit(1);
  }
}

async function handleSourceCommand(subcommand: string, args: string[]) {
  switch (subcommand) {
    case "add": {
      // Filter out flags to get the path/URL
      const nonFlagArgs = args.filter(a => !a.startsWith("--"));
      const pathOrUrl = nonFlagArgs[0];
      const isRemote = args.includes("--remote");
      const isLocal = args.includes("--local");
      
      // Extract --name value
      const nameIndex = args.findIndex(a => a === "--name");
      const customName = nameIndex !== -1 ? args[nameIndex + 1] : undefined;

      if (!pathOrUrl) {
        console.error("Missing path or URL for source add");
        process.exit(1);
      }

      if (!isRemote && !isLocal) {
        console.error("Please specify --remote or --local");
        process.exit(1);
      }

      if (isRemote && isLocal) {
        console.error("Cannot specify both --remote and --local");
        process.exit(1);
      }

      await sourceAdd(pathOrUrl, isRemote ? "remote" : "local", customName);
      break;
    }

    case "remove": {
      const name = args[0];
      if (!name) {
        console.error("Missing skill name for source remove");
        process.exit(1);
      }
      await sourceRemove(name);
      break;
    }

    case "list":
      await sourceList();
      break;

    default:
      console.error(`Unknown source subcommand: ${subcommand}`);
      console.log("Available: add, remove, list");
      process.exit(1);
  }
}

async function handleTargetCommand(subcommand: string, args: string[]) {
  switch (subcommand) {
    case "add": {
      const name = args[0];
      const path = args[1]; // Optional - if not provided, uses known target

      if (!name) {
        console.error("Usage: skills target add <name> [path]");
        console.log(`\nRun ${chalk.cyan("skills target available")} to see predefined targets.`);
        process.exit(1);
      }

      await targetAdd(name, path);
      break;
    }

    case "remove": {
      const name = args[0];
      if (!name) {
        console.error("Missing name for target remove");
        process.exit(1);
      }
      await targetRemove(name);
      break;
    }

    case "list":
      await targetList();
      break;

    case "available":
      await targetAvailable();
      break;

    default:
      console.error(`Unknown target subcommand: ${subcommand}`);
      console.log("Available: add, remove, list, available");
      process.exit(1);
  }
}

main();
