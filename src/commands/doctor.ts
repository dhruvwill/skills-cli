import chalk from "chalk";
import { $ } from "bun";
import { getSources, getTargets } from "../lib/config.ts";
import { getNamespacePath, SKILLS_ROOT, SKILLS_STORE, CONFIG_PATH } from "../lib/paths.ts";
import { directoryExists } from "../lib/hash.ts";

interface DiagnosticResult {
  name: string;
  status: "ok" | "warn" | "error";
  message: string;
}

/**
 * Run diagnostics on the skills CLI configuration
 */
export async function doctor(): Promise<void> {
  console.log();
  console.log(chalk.bold("Skills Doctor"));
  console.log(chalk.dim("─".repeat(50)));
  console.log();

  const results: DiagnosticResult[] = [];

  // Check 1: Git installation
  results.push(await checkGit());

  // Check 2: Skills directory
  results.push(await checkSkillsDirectory());

  // Check 3: Config file
  results.push(await checkConfigFile());

  // Check 4: Store directory
  results.push(await checkStoreDirectory());

  // Check 5: Sources
  results.push(...await checkSources());

  // Check 6: Targets
  results.push(...await checkTargets());

  // Print results
  for (const result of results) {
    const icon = result.status === "ok" 
      ? chalk.green("✓") 
      : result.status === "warn" 
        ? chalk.yellow("!") 
        : chalk.red("✗");
    
    const statusColor = result.status === "ok"
      ? chalk.green
      : result.status === "warn"
        ? chalk.yellow
        : chalk.red;

    console.log(`  ${icon} ${chalk.bold(result.name)}`);
    console.log(`    ${statusColor(result.message)}`);
    console.log();
  }

  // Summary
  const errors = results.filter(r => r.status === "error").length;
  const warnings = results.filter(r => r.status === "warn").length;
  const ok = results.filter(r => r.status === "ok").length;

  console.log(chalk.dim("─".repeat(50)));
  
  if (errors > 0) {
    console.log(chalk.red(`${errors} error(s), ${warnings} warning(s), ${ok} passed`));
  } else if (warnings > 0) {
    console.log(chalk.yellow(`${warnings} warning(s), ${ok} passed`));
  } else {
    console.log(chalk.green(`All ${ok} checks passed!`));
  }
  
  console.log();
}

async function checkGit(): Promise<DiagnosticResult> {
  try {
    const result = await $`git --version`.quiet();
    const version = result.text().trim();
    return {
      name: "Git",
      status: "ok",
      message: version,
    };
  } catch {
    return {
      name: "Git",
      status: "error",
      message: "Git is not installed. Required for remote sources.",
    };
  }
}

async function checkSkillsDirectory(): Promise<DiagnosticResult> {
  if (await directoryExists(SKILLS_ROOT)) {
    return {
      name: "Skills Directory",
      status: "ok",
      message: SKILLS_ROOT,
    };
  }
  return {
    name: "Skills Directory",
    status: "warn",
    message: `Not found: ${SKILLS_ROOT}. Will be created on first use.`,
  };
}

async function checkConfigFile(): Promise<DiagnosticResult> {
  const file = Bun.file(CONFIG_PATH);
  if (await file.exists()) {
    try {
      await file.json();
      return {
        name: "Config File",
        status: "ok",
        message: CONFIG_PATH,
      };
    } catch {
      return {
        name: "Config File",
        status: "error",
        message: `Invalid JSON: ${CONFIG_PATH}`,
      };
    }
  }
  return {
    name: "Config File",
    status: "warn",
    message: `Not found: ${CONFIG_PATH}. Will be created on first use.`,
  };
}

async function checkStoreDirectory(): Promise<DiagnosticResult> {
  if (await directoryExists(SKILLS_STORE)) {
    const { readdir } = await import("fs/promises");
    try {
      const entries = await readdir(SKILLS_STORE);
      const count = entries.length;
      return {
        name: "Store Directory",
        status: "ok",
        message: `${SKILLS_STORE} (${count} item${count !== 1 ? "s" : ""})`,
      };
    } catch {
      return {
        name: "Store Directory",
        status: "ok",
        message: SKILLS_STORE,
      };
    }
  }
  return {
    name: "Store Directory",
    status: "warn",
    message: `Not found: ${SKILLS_STORE}. Will be created on first use.`,
  };
}

async function checkSources(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];
  
  try {
    const sources = await getSources();
    
    if (sources.length === 0) {
      results.push({
        name: "Sources",
        status: "warn",
        message: "No sources registered. Add one with: skills source add <url> --remote",
      });
      return results;
    }

    for (const source of sources) {
      const path = getNamespacePath(source.namespace);
      const exists = await directoryExists(path);
      
      if (exists) {
        results.push({
          name: `Source: ${source.namespace}`,
          status: "ok",
          message: `${source.type} → ${path}`,
        });
      } else {
        results.push({
          name: `Source: ${source.namespace}`,
          status: "error",
          message: `Missing directory: ${path}. Run: skills update`,
        });
      }
    }
  } catch (error) {
    results.push({
      name: "Sources",
      status: "error",
      message: `Failed to read sources: ${error}`,
    });
  }

  return results;
}

async function checkTargets(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];
  
  try {
    const targets = await getTargets();
    
    if (targets.length === 0) {
      results.push({
        name: "Targets",
        status: "warn",
        message: "No targets registered. Add one with: skills target add <name> <path>",
      });
      return results;
    }

    for (const target of targets) {
      const exists = await directoryExists(target.path);
      
      if (exists) {
        results.push({
          name: `Target: ${target.name}`,
          status: "ok",
          message: target.path,
        });
      } else {
        results.push({
          name: `Target: ${target.name}`,
          status: "warn",
          message: `Directory missing: ${target.path}. Will be created on sync.`,
        });
      }
    }
  } catch (error) {
    results.push({
      name: "Targets",
      status: "error",
      message: `Failed to read targets: ${error}`,
    });
  }

  return results;
}
