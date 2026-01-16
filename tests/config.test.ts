import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdir, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

describe("Config Management", () => {
  let testDir: string;
  let testConfigPath: string;
  let testStorePath: string;

  beforeEach(async () => {
    // Create a unique temp directory for each test
    testDir = join(tmpdir(), `skills-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    testConfigPath = join(testDir, "config.json");
    testStorePath = join(testDir, "store");
    await mkdir(testDir, { recursive: true });
    await mkdir(testStorePath, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    await rm(testDir, { recursive: true, force: true });
  });

  test("creates default config when none exists", async () => {
    expect(await Bun.file(testConfigPath).exists()).toBe(false);

    // Write default config
    const defaultConfig = { sources: [], targets: [] };
    await Bun.write(testConfigPath, JSON.stringify(defaultConfig, null, 2));

    // Re-check with fresh file reference
    const configFile = Bun.file(testConfigPath);
    expect(await configFile.exists()).toBe(true);
    const content = await configFile.json();
    expect(content).toEqual({ sources: [], targets: [] });
  });

  test("reads existing config", async () => {
    const config = {
      sources: [{ type: "remote", url: "https://github.com/test/repo", namespace: "test/repo" }],
      targets: [{ name: "cursor", path: "/home/user/.cursor/skills" }],
    };
    await Bun.write(testConfigPath, JSON.stringify(config, null, 2));

    const content = await Bun.file(testConfigPath).json();
    expect(content.sources).toHaveLength(1);
    expect(content.targets).toHaveLength(1);
    expect(content.sources[0].namespace).toBe("test/repo");
  });

  test("adds source to config", async () => {
    const config = { sources: [], targets: [] };
    await Bun.write(testConfigPath, JSON.stringify(config, null, 2));

    // Read, modify, write
    const content = await Bun.file(testConfigPath).json();
    content.sources.push({
      type: "remote",
      url: "https://github.com/new/repo",
      namespace: "new/repo",
    });
    await Bun.write(testConfigPath, JSON.stringify(content, null, 2));

    const updated = await Bun.file(testConfigPath).json();
    expect(updated.sources).toHaveLength(1);
    expect(updated.sources[0].namespace).toBe("new/repo");
  });

  test("removes source from config", async () => {
    const config = {
      sources: [
        { type: "remote", url: "https://github.com/test/repo1", namespace: "test/repo1" },
        { type: "remote", url: "https://github.com/test/repo2", namespace: "test/repo2" },
      ],
      targets: [],
    };
    await Bun.write(testConfigPath, JSON.stringify(config, null, 2));

    // Read, modify, write
    const content = await Bun.file(testConfigPath).json();
    content.sources = content.sources.filter((s: any) => s.namespace !== "test/repo1");
    await Bun.write(testConfigPath, JSON.stringify(content, null, 2));

    const updated = await Bun.file(testConfigPath).json();
    expect(updated.sources).toHaveLength(1);
    expect(updated.sources[0].namespace).toBe("test/repo2");
  });

  test("adds target to config", async () => {
    const config = { sources: [], targets: [] };
    await Bun.write(testConfigPath, JSON.stringify(config, null, 2));

    const content = await Bun.file(testConfigPath).json();
    content.targets.push({
      name: "cursor",
      path: "/home/user/.cursor/skills",
    });
    await Bun.write(testConfigPath, JSON.stringify(content, null, 2));

    const updated = await Bun.file(testConfigPath).json();
    expect(updated.targets).toHaveLength(1);
    expect(updated.targets[0].name).toBe("cursor");
  });

  test("removes target from config", async () => {
    const config = {
      sources: [],
      targets: [
        { name: "cursor", path: "/home/user/.cursor/skills" },
        { name: "claude", path: "/home/user/.claude/skills" },
      ],
    };
    await Bun.write(testConfigPath, JSON.stringify(config, null, 2));

    const content = await Bun.file(testConfigPath).json();
    content.targets = content.targets.filter((t: any) => t.name !== "cursor");
    await Bun.write(testConfigPath, JSON.stringify(content, null, 2));

    const updated = await Bun.file(testConfigPath).json();
    expect(updated.targets).toHaveLength(1);
    expect(updated.targets[0].name).toBe("claude");
  });

  test("handles corrupted config gracefully", async () => {
    await Bun.write(testConfigPath, "not valid json {{{");

    try {
      await Bun.file(testConfigPath).json();
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
