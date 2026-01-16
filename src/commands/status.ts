import chalk from "chalk";
import Table from "cli-table3";
import { getSources, getTargets } from "../lib/config.ts";
import { SKILLS_ROOT, SKILLS_STORE, getSkillPath } from "../lib/paths.ts";
import { directoryExists, compareDirectories } from "../lib/hash.ts";

/**
 * Show status overview of sources, targets, and sync state
 */
export async function status(): Promise<void> {
  console.log();
  console.log(chalk.bold("Skills Status"));
  console.log(chalk.dim("─".repeat(50)));

  // Paths
  console.log();
  console.log(chalk.bold("Paths"));
  console.log(`  Root:   ${chalk.cyan(SKILLS_ROOT)}`);
  console.log(`  Store:  ${chalk.cyan(SKILLS_STORE)}`);

  // Sources summary
  const sources = await getSources();
  console.log();
  console.log(chalk.bold(`Skills (${sources.length})`));
  
  if (sources.length === 0) {
    console.log(chalk.dim("  No skills registered"));
  } else {
    for (const source of sources) {
      const exists = await directoryExists(getSkillPath(source.name));
      const icon = exists ? chalk.green("●") : chalk.red("●");
      const typeLabel = source.type === "remote" ? chalk.blue("remote") : chalk.magenta("local");
      console.log(`  ${icon} ${source.name} ${chalk.dim(`(${typeLabel})`)}`);
    }
  }

  // Targets summary
  const targets = await getTargets();
  console.log();
  console.log(chalk.bold(`Targets (${targets.length})`));
  
  if (targets.length === 0) {
    console.log(chalk.dim("  No targets registered"));
  } else {
    for (const target of targets) {
      const syncStatus = await compareDirectories(SKILLS_STORE, target.path);
      let icon: string;
      let statusText: string;
      
      if (syncStatus === "synced") {
        icon = chalk.green("●");
        statusText = chalk.green("synced");
      } else if (syncStatus === "not synced") {
        icon = chalk.yellow("●");
        statusText = chalk.yellow("outdated");
      } else {
        icon = chalk.red("●");
        statusText = chalk.red("missing");
      }
      
      console.log(`  ${icon} ${target.name} ${chalk.dim(`→ ${statusText}`)}`);
    }
  }

  // Quick actions
  console.log();
  console.log(chalk.bold("Quick Actions"));
  
  if (sources.length === 0) {
    console.log(`  ${chalk.cyan("skills source add <url> --remote")}  Add a remote skill`);
  }
  
  if (targets.length === 0) {
    console.log(`  ${chalk.cyan("skills target add <name> <path>")}  Add a target`);
  }
  
  if (sources.length > 0 && targets.length > 0) {
    console.log(`  ${chalk.cyan("skills sync")}    Push skills to all targets`);
    console.log(`  ${chalk.cyan("skills update")}  Refresh all sources`);
  }
  
  console.log(`  ${chalk.cyan("skills doctor")}  Run diagnostics`);
  console.log();
}
