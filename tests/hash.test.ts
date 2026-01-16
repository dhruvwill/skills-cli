import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdir, rm, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { hashDirectory, directoryExists, compareDirectories } from "../src/lib/hash.ts";

describe("Hash Utilities", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `skills-hash-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe("directoryExists", () => {
    test("returns true for existing directory", async () => {
      expect(await directoryExists(testDir)).toBe(true);
    });

    test("returns false for non-existing directory", async () => {
      expect(await directoryExists(join(testDir, "nonexistent"))).toBe(false);
    });

    test("returns false for file path", async () => {
      const filePath = join(testDir, "file.txt");
      await writeFile(filePath, "content");
      expect(await directoryExists(filePath)).toBe(false);
    });
  });

  describe("hashDirectory", () => {
    test("returns 'empty' for empty directory", async () => {
      const hash = await hashDirectory(testDir);
      expect(hash).toBe("empty");
    });

    test("returns consistent hash for same content", async () => {
      await writeFile(join(testDir, "file1.txt"), "content1");
      await writeFile(join(testDir, "file2.txt"), "content2");

      const hash1 = await hashDirectory(testDir);
      const hash2 = await hashDirectory(testDir);

      expect(hash1).toBe(hash2);
    });

    test("returns different hash for different content", async () => {
      await writeFile(join(testDir, "file.txt"), "content1");
      const hash1 = await hashDirectory(testDir);

      await writeFile(join(testDir, "file.txt"), "content2");
      const hash2 = await hashDirectory(testDir);

      expect(hash1).not.toBe(hash2);
    });

    test("includes nested directories in hash", async () => {
      await mkdir(join(testDir, "subdir"), { recursive: true });
      await writeFile(join(testDir, "subdir", "nested.txt"), "nested content");

      const hash1 = await hashDirectory(testDir);

      await writeFile(join(testDir, "subdir", "nested.txt"), "modified content");
      const hash2 = await hashDirectory(testDir);

      expect(hash1).not.toBe(hash2);
    });

    test("returns 'empty' for non-existing directory", async () => {
      const hash = await hashDirectory(join(testDir, "nonexistent"));
      expect(hash).toBe("empty");
    });
  });

  describe("compareDirectories", () => {
    let sourceDir: string;
    let targetDir: string;

    beforeEach(async () => {
      sourceDir = join(testDir, "source");
      targetDir = join(testDir, "target");
      await mkdir(sourceDir, { recursive: true });
      await mkdir(targetDir, { recursive: true });
    });

    test("returns 'synced' for identical directories", async () => {
      await writeFile(join(sourceDir, "file.txt"), "content");
      await writeFile(join(targetDir, "file.txt"), "content");

      const status = await compareDirectories(sourceDir, targetDir);
      expect(status).toBe("synced");
    });

    test("returns 'not synced' for different directories", async () => {
      await writeFile(join(sourceDir, "file.txt"), "content1");
      await writeFile(join(targetDir, "file.txt"), "content2");

      const status = await compareDirectories(sourceDir, targetDir);
      expect(status).toBe("not synced");
    });

    test("returns 'target missing' for non-existing target", async () => {
      await writeFile(join(sourceDir, "file.txt"), "content");
      await rm(targetDir, { recursive: true });

      const status = await compareDirectories(sourceDir, targetDir);
      expect(status).toBe("target missing");
    });

    test("returns 'synced' for two empty directories", async () => {
      const status = await compareDirectories(sourceDir, targetDir);
      expect(status).toBe("synced");
    });
  });
});
