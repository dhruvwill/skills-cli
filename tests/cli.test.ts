import { describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from "bun:test";
import { mkdir, rm, writeFile, readdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { $ } from "bun";

/**
 * Integration tests for CLI commands
 * 
 * These tests create temporary directories and clean up after themselves.
 * They test the full CLI workflow including source and target management.
 */

describe("CLI Integration Tests", () => {
  let testDir: string;
  let testSourceDir: string;
  let testTargetDir: string;

  beforeAll(async () => {
    // Create a master test directory
    testDir = join(tmpdir(), `skills-integration-${Date.now()}`);
    await mkdir(testDir, { recursive: true });

    // Create test subdirectories
    testSourceDir = join(testDir, "test-source");
    testTargetDir = join(testDir, "test-target");

    await mkdir(testSourceDir, { recursive: true });
    await mkdir(testTargetDir, { recursive: true });

    // Create a test skill in source directory
    await writeFile(join(testSourceDir, "SKILL.md"), "# Test Skill\n\nThis is a test skill.");
    await writeFile(join(testSourceDir, "rules.md"), "# Rules\n\n- Rule 1\n- Rule 2");
  });

  afterAll(async () => {
    // Clean up test directory
    await rm(testDir, { recursive: true, force: true });
  });

  describe("Local Source Management", () => {
    test("can add a local source", async () => {
      const result = await $`bun run src/cli.ts source add ${testSourceDir} --local`.text();
      
      expect(result).toContain("Adding local source");
      expect(result).toContain("Successfully added local source");
    });

    test("lists the added source", async () => {
      const result = await $`bun run src/cli.ts source list`.text();
      
      expect(result).toContain("local/test-source");
      expect(result).toContain("local");
      expect(result).toContain("OK");
    });

    test("can remove the source", async () => {
      const result = await $`bun run src/cli.ts source remove local/test-source`.text();
      
      expect(result).toContain("Removed source");
    });

    test("source is no longer listed", async () => {
      const result = await $`bun run src/cli.ts source list`.text();
      
      // The specific test source should be removed (may have other sources)
      expect(result).not.toContain("local/test-source");
    });
  });

  describe("Target Management", () => {
    beforeEach(async () => {
      // Add a source first
      await $`bun run src/cli.ts source add ${testSourceDir} --local`.quiet();
    });

    afterEach(async () => {
      // Clean up
      try {
        await $`bun run src/cli.ts target remove test-target`.quiet();
      } catch {}
      try {
        await $`bun run src/cli.ts source remove local/test-source`.quiet();
      } catch {}
    });

    test("can add a target", async () => {
      const result = await $`bun run src/cli.ts target add test-target ${testTargetDir}`.text();
      
      expect(result).toContain("Adding target: test-target");
      expect(result).toContain("Successfully registered target");
      expect(result).toContain("Performing initial sync");
    });

    test("lists the added target with sync status", async () => {
      await $`bun run src/cli.ts target add test-target ${testTargetDir}`.quiet();
      
      const result = await $`bun run src/cli.ts target list`.text();
      
      expect(result).toContain("test-target");
      expect(result).toContain("synced");
    });

    test("can remove the target", async () => {
      await $`bun run src/cli.ts target add test-target ${testTargetDir}`.quiet();
      
      const result = await $`bun run src/cli.ts target remove test-target`.text();
      
      expect(result).toContain("Removed target");
    });
  });

  describe("Sync Operations", () => {
    beforeEach(async () => {
      // Add source and target
      await $`bun run src/cli.ts source add ${testSourceDir} --local`.quiet();
      await $`bun run src/cli.ts target add test-target ${testTargetDir}`.quiet();
    });

    afterEach(async () => {
      try {
        await $`bun run src/cli.ts target remove test-target`.quiet();
      } catch {}
      try {
        await $`bun run src/cli.ts source remove local/test-source`.quiet();
      } catch {}
    });

    test("sync copies files to target", async () => {
      const result = await $`bun run src/cli.ts sync`.text();
      
      expect(result).toContain("Syncing skills to all targets");
      expect(result).toContain("Synced");
      expect(result).toContain("Sync complete");

      // Verify files exist in target
      const files = await readdir(testTargetDir, { recursive: true });
      expect(files.length).toBeGreaterThan(0);
    });

    test("update refreshes sources", async () => {
      const result = await $`bun run src/cli.ts update`.text();
      
      expect(result).toContain("Updating all sources");
      expect(result).toContain("Updated");
      expect(result).toContain("Update complete");
    });
  });

  describe("Status and Doctor", () => {
    test("status shows overview", async () => {
      const result = await $`bun run src/cli.ts status`.text();
      
      expect(result).toContain("Skills Status");
      expect(result).toContain("Paths");
      expect(result).toContain("Sources");
      expect(result).toContain("Targets");
    });

    test("doctor runs diagnostics", async () => {
      const result = await $`bun run src/cli.ts doctor`.text();
      
      expect(result).toContain("Skills Doctor");
      expect(result).toContain("Git");
      expect(result).toContain("passed");
    });
  });

  describe("Help and Version", () => {
    test("--help shows usage", async () => {
      const result = await $`bun run src/cli.ts --help`.text();
      
      expect(result).toContain("skills");
      expect(result).toContain("USAGE");
      expect(result).toContain("COMMANDS");
      expect(result).toContain("source");
      expect(result).toContain("target");
      expect(result).toContain("sync");
    });

    test("-h shows usage", async () => {
      const result = await $`bun run src/cli.ts -h`.text();
      
      expect(result).toContain("USAGE");
    });

    test("--version shows version", async () => {
      const result = await $`bun run src/cli.ts --version`.text();
      
      expect(result).toMatch(/skills v\d+\.\d+\.\d+/);
    });

    test("-v shows version", async () => {
      const result = await $`bun run src/cli.ts -v`.text();
      
      expect(result).toMatch(/skills v\d+\.\d+\.\d+/);
    });

    test("help command shows usage", async () => {
      const result = await $`bun run src/cli.ts help`.text();
      
      expect(result).toContain("USAGE");
    });
  });

  describe("Error Handling", () => {
    test("unknown command shows error", async () => {
      try {
        await $`bun run src/cli.ts unknown-command`.text();
        expect(true).toBe(false); // Should not reach
      } catch (error: any) {
        expect(error.stderr.toString()).toContain("Unknown command");
      }
    });

    test("source add without flags shows error", async () => {
      try {
        await $`bun run src/cli.ts source add /some/path`.text();
        expect(true).toBe(false); // Should not reach
      } catch (error: any) {
        expect(error.stderr.toString()).toContain("--remote or --local");
      }
    });

    test("target add without path shows error", async () => {
      try {
        await $`bun run src/cli.ts target add myname`.text();
        expect(true).toBe(false); // Should not reach
      } catch (error: any) {
        expect(error.stderr.toString()).toContain("Usage:");
      }
    });

    test("removing non-existent source shows error", async () => {
      try {
        await $`bun run src/cli.ts source remove nonexistent/source`.text();
        expect(true).toBe(false); // Should not reach
      } catch (error: any) {
        expect(error.stderr.toString()).toContain("not found");
      }
    });

    test("removing non-existent target shows error", async () => {
      try {
        await $`bun run src/cli.ts target remove nonexistent`.text();
        expect(true).toBe(false); // Should not reach
      } catch (error: any) {
        expect(error.stderr.toString()).toContain("not found");
      }
    });
  });
});
