import chalk from "chalk";

const PACKAGE_NAME = "@dhruvwill/skills-cli";

/**
 * Get the currently installed version
 */
async function getCurrentVersion(): Promise<string | null> {
  try {
    const proc = Bun.spawn(["bun", "pm", "ls", "-g"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const output = await new Response(proc.stdout).text();
    await proc.exited;

    // Parse output to find our package version
    const lines = output.split("\n");
    for (const line of lines) {
      if (line.includes(PACKAGE_NAME)) {
        // Format: "@dhruvwill/skills-cli@1.1.0"
        const match = line.match(/@dhruvwill\/skills-cli@([\d.]+)/);
        if (match) {
          return match[1];
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get the latest version from npm registry
 */
async function getLatestVersion(): Promise<string | null> {
  try {
    const response = await fetch(`https://registry.npmjs.org/${PACKAGE_NAME}/latest`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.version;
  } catch {
    return null;
  }
}

/**
 * Self-update the CLI to the latest version
 */
export async function selfUpdate(): Promise<void> {
  console.log();
  console.log(chalk.bold("Updating skills CLI..."));
  console.log();

  // Get current version
  const currentVersion = await getCurrentVersion();
  if (currentVersion) {
    console.log(`  Current version: ${chalk.cyan(`v${currentVersion}`)}`);
  }

  // Check latest version
  const latestVersion = await getLatestVersion();
  if (latestVersion) {
    console.log(`  Latest version:  ${chalk.green(`v${latestVersion}`)}`);
  }

  if (currentVersion && latestVersion && currentVersion === latestVersion) {
    console.log();
    console.log(chalk.green("✓ Already up to date!"));
    console.log();
    return;
  }

  console.log();
  console.log(chalk.dim(`Running: bun install -g ${PACKAGE_NAME}`));
  console.log();

  // Run the update command
  const proc = Bun.spawn(["bun", "install", "-g", PACKAGE_NAME], {
    stdout: "inherit",
    stderr: "inherit",
  });

  const exitCode = await proc.exited;

  if (exitCode === 0) {
    console.log();
    console.log(chalk.green("✓ Successfully updated skills CLI!"));
    
    // Show new version
    const newVersion = await getCurrentVersion();
    if (newVersion) {
      console.log(`  New version: ${chalk.green(`v${newVersion}`)}`);
    }
    console.log();
  } else {
    console.log();
    console.error(chalk.red("✗ Failed to update. Please try manually:"));
    console.log(`  ${chalk.cyan(`bun install -g ${PACKAGE_NAME}`)}`);
    console.log();
    process.exit(1);
  }
}
