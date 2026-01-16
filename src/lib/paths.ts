import { homedir } from "os";
import { join } from "path";

/** Root directory for skills CLI */
export const SKILLS_ROOT = join(homedir(), ".skills");

/** Central store for all ingested skills */
export const SKILLS_STORE = join(SKILLS_ROOT, "store");

/** Configuration file path */
export const CONFIG_PATH = join(SKILLS_ROOT, "config.json");

/**
 * Get the store path for a given namespace
 */
export function getNamespacePath(namespace: string): string {
  return join(SKILLS_STORE, namespace);
}

export interface ParsedGitUrl {
  host: string;
  owner: string;
  repo: string;
  branch?: string;
  subdir?: string;
  cloneUrl: string;
}

/**
 * Parse a Git URL from various hosts (GitHub, GitLab, Bitbucket, self-hosted)
 * 
 * Supports formats:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo/tree/branch/path
 * - https://gitlab.com/owner/repo
 * - https://gitlab.com/owner/repo/-/tree/branch/path
 * - https://bitbucket.org/owner/repo
 * - https://bitbucket.org/owner/repo/src/branch/path
 * - https://any-host.com/owner/repo.git
 * - git@host:owner/repo.git
 */
export function parseGitUrl(url: string): ParsedGitUrl | null {
  // Try each parser in order
  return parseGitHubUrl(url) 
    || parseGitLabUrl(url) 
    || parseBitbucketUrl(url) 
    || parseGenericGitUrl(url);
}

/**
 * Parse GitHub URLs
 */
function parseGitHubUrl(url: string): ParsedGitUrl | null {
  // GitHub with subdirectory (tree or blob)
  const subdirMatch = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/(?:tree|blob)\/([^\/]+)\/(.+)/);
  if (subdirMatch) {
    const [, owner, repo, branch, subdir] = subdirMatch;
    return {
      host: "github.com",
      owner,
      repo: repo.replace(/\.git$/, ""),
      branch,
      subdir: subdir.replace(/\/$/, ""),
      cloneUrl: `https://github.com/${owner}/${repo.replace(/\.git$/, "")}.git`,
    };
  }

  // GitHub basic HTTPS
  const httpsMatch = url.match(/github\.com\/([^\/]+)\/([^\/\.\s]+)/);
  if (httpsMatch) {
    const [, owner, repo] = httpsMatch;
    return {
      host: "github.com",
      owner,
      repo: repo.replace(/\.git$/, ""),
      cloneUrl: `https://github.com/${owner}/${repo.replace(/\.git$/, "")}.git`,
    };
  }

  // GitHub SSH
  const sshMatch = url.match(/git@github\.com:([^\/]+)\/(.+?)(?:\.git)?$/);
  if (sshMatch) {
    const [, owner, repo] = sshMatch;
    return {
      host: "github.com",
      owner,
      repo: repo.replace(/\.git$/, ""),
      cloneUrl: `git@github.com:${owner}/${repo.replace(/\.git$/, "")}.git`,
    };
  }

  return null;
}

/**
 * Parse GitLab URLs
 */
function parseGitLabUrl(url: string): ParsedGitUrl | null {
  // GitLab with subdirectory (uses /-/tree/ pattern)
  const subdirMatch = url.match(/gitlab\.com\/([^\/]+)\/([^\/]+)\/-\/tree\/([^\/]+)\/(.+)/);
  if (subdirMatch) {
    const [, owner, repo, branch, subdir] = subdirMatch;
    return {
      host: "gitlab.com",
      owner,
      repo: repo.replace(/\.git$/, ""),
      branch,
      subdir: subdir.replace(/\/$/, ""),
      cloneUrl: `https://gitlab.com/${owner}/${repo.replace(/\.git$/, "")}.git`,
    };
  }

  // GitLab basic HTTPS
  const httpsMatch = url.match(/gitlab\.com\/([^\/]+)\/([^\/\.\s]+)/);
  if (httpsMatch) {
    const [, owner, repo] = httpsMatch;
    return {
      host: "gitlab.com",
      owner,
      repo: repo.replace(/\.git$/, ""),
      cloneUrl: `https://gitlab.com/${owner}/${repo.replace(/\.git$/, "")}.git`,
    };
  }

  // GitLab SSH
  const sshMatch = url.match(/git@gitlab\.com:([^\/]+)\/(.+?)(?:\.git)?$/);
  if (sshMatch) {
    const [, owner, repo] = sshMatch;
    return {
      host: "gitlab.com",
      owner,
      repo: repo.replace(/\.git$/, ""),
      cloneUrl: `git@gitlab.com:${owner}/${repo.replace(/\.git$/, "")}.git`,
    };
  }

  return null;
}

/**
 * Parse Bitbucket URLs
 */
function parseBitbucketUrl(url: string): ParsedGitUrl | null {
  // Bitbucket with subdirectory (uses /src/branch/path pattern)
  const subdirMatch = url.match(/bitbucket\.org\/([^\/]+)\/([^\/]+)\/src\/([^\/]+)\/(.+)/);
  if (subdirMatch) {
    const [, owner, repo, branch, subdir] = subdirMatch;
    return {
      host: "bitbucket.org",
      owner,
      repo: repo.replace(/\.git$/, ""),
      branch,
      subdir: subdir.replace(/\/$/, ""),
      cloneUrl: `https://bitbucket.org/${owner}/${repo.replace(/\.git$/, "")}.git`,
    };
  }

  // Bitbucket basic HTTPS
  const httpsMatch = url.match(/bitbucket\.org\/([^\/]+)\/([^\/\.\s]+)/);
  if (httpsMatch) {
    const [, owner, repo] = httpsMatch;
    return {
      host: "bitbucket.org",
      owner,
      repo: repo.replace(/\.git$/, ""),
      cloneUrl: `https://bitbucket.org/${owner}/${repo.replace(/\.git$/, "")}.git`,
    };
  }

  // Bitbucket SSH
  const sshMatch = url.match(/git@bitbucket\.org:([^\/]+)\/(.+?)(?:\.git)?$/);
  if (sshMatch) {
    const [, owner, repo] = sshMatch;
    return {
      host: "bitbucket.org",
      owner,
      repo: repo.replace(/\.git$/, ""),
      cloneUrl: `git@bitbucket.org:${owner}/${repo.replace(/\.git$/, "")}.git`,
    };
  }

  return null;
}

/**
 * Parse generic Git URLs (self-hosted, other providers)
 */
function parseGenericGitUrl(url: string): ParsedGitUrl | null {
  // SSH format: git@host:owner/repo.git
  const sshMatch = url.match(/git@([^:]+):([^\/]+)\/(.+?)(?:\.git)?$/);
  if (sshMatch) {
    const [, host, owner, repo] = sshMatch;
    return {
      host,
      owner,
      repo: repo.replace(/\.git$/, ""),
      cloneUrl: url.endsWith(".git") ? url : `${url}.git`,
    };
  }

  // HTTPS format: https://host/owner/repo.git or https://host/owner/repo
  const httpsMatch = url.match(/https?:\/\/([^\/]+)\/([^\/]+)\/([^\/\.\s]+)/);
  if (httpsMatch) {
    const [, host, owner, repo] = httpsMatch;
    return {
      host,
      owner,
      repo: repo.replace(/\.git$/, ""),
      cloneUrl: url.endsWith(".git") ? url : `${url}.git`,
    };
  }

  return null;
}

/**
 * Get the namespace for a parsed Git URL
 * For subdirectories, uses owner/skill-name
 * For full repos, uses owner/repo
 */
export function getRemoteNamespace(parsed: ParsedGitUrl): string {
  if (parsed.subdir) {
    // Use the last part of the subdir path as the skill name
    const subdirName = parsed.subdir.split("/").pop() || parsed.subdir;
    return `${parsed.owner}/${subdirName}`;
  }
  return `${parsed.owner}/${parsed.repo}`;
}

/**
 * Get the local namespace for a folder path
 */
export function getLocalNamespace(folderPath: string): string {
  const folderName = folderPath.split(/[\/\\]/).filter(Boolean).pop() || "unnamed";
  return `local/${folderName}`;
}
