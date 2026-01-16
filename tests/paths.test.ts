import { describe, test, expect } from "bun:test";
import { parseGitUrl, getRemoteNamespace, getLocalNamespace } from "../src/lib/paths.ts";

describe("parseGitUrl", () => {
  describe("GitHub URLs", () => {
    test("parses basic GitHub HTTPS URL", () => {
      const result = parseGitUrl("https://github.com/owner/repo");
      expect(result).toEqual({
        host: "github.com",
        owner: "owner",
        repo: "repo",
        cloneUrl: "https://github.com/owner/repo.git",
      });
    });

    test("parses GitHub URL with .git suffix", () => {
      const result = parseGitUrl("https://github.com/owner/repo.git");
      expect(result).toEqual({
        host: "github.com",
        owner: "owner",
        repo: "repo",
        cloneUrl: "https://github.com/owner/repo.git",
      });
    });

    test("parses GitHub URL with tree subdirectory", () => {
      const result = parseGitUrl("https://github.com/owner/repo/tree/main/path/to/skill");
      expect(result).toEqual({
        host: "github.com",
        owner: "owner",
        repo: "repo",
        branch: "main",
        subdir: "path/to/skill",
        cloneUrl: "https://github.com/owner/repo.git",
      });
    });

    test("parses GitHub URL with blob subdirectory", () => {
      const result = parseGitUrl("https://github.com/owner/repo/blob/main/skills/my-skill");
      expect(result).toEqual({
        host: "github.com",
        owner: "owner",
        repo: "repo",
        branch: "main",
        subdir: "skills/my-skill",
        cloneUrl: "https://github.com/owner/repo.git",
      });
    });

    test("parses GitHub SSH URL", () => {
      const result = parseGitUrl("git@github.com:owner/repo.git");
      expect(result).toEqual({
        host: "github.com",
        owner: "owner",
        repo: "repo",
        cloneUrl: "git@github.com:owner/repo.git",
      });
    });
  });

  describe("GitLab URLs", () => {
    test("parses basic GitLab URL", () => {
      const result = parseGitUrl("https://gitlab.com/owner/repo");
      expect(result).toEqual({
        host: "gitlab.com",
        owner: "owner",
        repo: "repo",
        cloneUrl: "https://gitlab.com/owner/repo.git",
      });
    });

    test("parses GitLab URL with subdirectory", () => {
      const result = parseGitUrl("https://gitlab.com/owner/repo/-/tree/main/skills/my-skill");
      expect(result).toEqual({
        host: "gitlab.com",
        owner: "owner",
        repo: "repo",
        branch: "main",
        subdir: "skills/my-skill",
        cloneUrl: "https://gitlab.com/owner/repo.git",
      });
    });

    test("parses GitLab SSH URL", () => {
      const result = parseGitUrl("git@gitlab.com:owner/repo.git");
      expect(result).toEqual({
        host: "gitlab.com",
        owner: "owner",
        repo: "repo",
        cloneUrl: "git@gitlab.com:owner/repo.git",
      });
    });
  });

  describe("Bitbucket URLs", () => {
    test("parses basic Bitbucket URL", () => {
      const result = parseGitUrl("https://bitbucket.org/owner/repo");
      expect(result).toEqual({
        host: "bitbucket.org",
        owner: "owner",
        repo: "repo",
        cloneUrl: "https://bitbucket.org/owner/repo.git",
      });
    });

    test("parses Bitbucket URL with subdirectory", () => {
      const result = parseGitUrl("https://bitbucket.org/owner/repo/src/main/skills/my-skill");
      expect(result).toEqual({
        host: "bitbucket.org",
        owner: "owner",
        repo: "repo",
        branch: "main",
        subdir: "skills/my-skill",
        cloneUrl: "https://bitbucket.org/owner/repo.git",
      });
    });
  });

  describe("Generic Git URLs", () => {
    test("parses self-hosted HTTPS URL", () => {
      const result = parseGitUrl("https://git.company.com/owner/repo.git");
      expect(result).toEqual({
        host: "git.company.com",
        owner: "owner",
        repo: "repo",
        cloneUrl: "https://git.company.com/owner/repo.git",
      });
    });

    test("parses generic SSH URL", () => {
      const result = parseGitUrl("git@git.company.com:owner/repo.git");
      expect(result).toEqual({
        host: "git.company.com",
        owner: "owner",
        repo: "repo",
        cloneUrl: "git@git.company.com:owner/repo.git",
      });
    });
  });

  describe("Invalid URLs", () => {
    test("returns null for invalid URL", () => {
      expect(parseGitUrl("not-a-url")).toBeNull();
      expect(parseGitUrl("")).toBeNull();
      expect(parseGitUrl("ftp://example.com")).toBeNull();
    });
  });
});

describe("getRemoteNamespace", () => {
  test("returns owner/repo for basic URL", () => {
    const parsed = parseGitUrl("https://github.com/owner/repo")!;
    expect(getRemoteNamespace(parsed)).toBe("owner/repo");
  });

  test("returns owner/skill-name for subdirectory URL", () => {
    const parsed = parseGitUrl("https://github.com/owner/repo/tree/main/skills/my-skill")!;
    expect(getRemoteNamespace(parsed)).toBe("owner/my-skill");
  });

  test("handles nested subdirectories", () => {
    const parsed = parseGitUrl("https://github.com/owner/repo/tree/main/path/to/deep/skill")!;
    expect(getRemoteNamespace(parsed)).toBe("owner/skill");
  });
});

describe("getLocalNamespace", () => {
  test("extracts folder name from path", () => {
    expect(getLocalNamespace("/home/user/my-skills")).toBe("local/my-skills");
    expect(getLocalNamespace("C:\\Users\\Admin\\skills")).toBe("local/skills");
    expect(getLocalNamespace("./relative-path")).toBe("local/relative-path");
  });
});
