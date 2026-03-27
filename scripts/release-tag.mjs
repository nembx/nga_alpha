import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

function readPackageVersion() {
  const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

  if (!packageJson.version) {
    throw new Error("package.json is missing a version field.");
  }

  return packageJson.version;
}

function runGit(args, options = {}) {
  return execFileSync("git", args, {
    stdio: ["ignore", "pipe", "pipe"],
    encoding: "utf8",
    ...options,
  }).trim();
}

function tagExists(tagName) {
  const output = runGit(["tag", "--list", tagName]);
  return output === tagName;
}

function ensureGitRepo() {
  const insideWorkTree = runGit(["rev-parse", "--is-inside-work-tree"]);

  if (insideWorkTree !== "true") {
    throw new Error("Current directory is not a git repository.");
  }
}

function main() {
  const args = new Set(process.argv.slice(2));
  const shouldPush = args.has("--push");
  const remote = "origin";
  const version = readPackageVersion();
  const tagName = `v${version}`;

  ensureGitRepo();

  if (tagExists(tagName)) {
    throw new Error(`Tag ${tagName} already exists.`);
  }

  runGit(["tag", "-a", tagName, "-m", `Release ${tagName}`], { stdio: "inherit" });
  console.log(`Created tag ${tagName}`);

  if (shouldPush) {
    runGit(["push", remote, tagName], { stdio: "inherit" });
    console.log(`Pushed ${tagName} to ${remote}`);
    return;
  }

  console.log(`Next step: git push ${remote} ${tagName}`);
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}
