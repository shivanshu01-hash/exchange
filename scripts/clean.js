#!/usr/bin/env node

/**
 * Cross-platform clean script
 * Removes build artifacts and node_modules
 */

const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");

const dirsToRemove = [
  path.join(rootDir, "dist"),
  path.join(rootDir, "apps", "api", "dist"),
  path.join(rootDir, "apps", "web", ".next"),
  path.join(rootDir, "apps", "web", "dist"),
  path.join(rootDir, "packages", "shared", "dist"),
];

function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`✓ Removed ${path.relative(rootDir, dirPath)}`);
  } else {
    console.log(`  Skipped ${path.relative(rootDir, dirPath)} (not found)`);
  }
}

console.log("Cleaning build artifacts...\n");

for (const dir of dirsToRemove) {
  removeDir(dir);
}

console.log("\n✓ Clean completed");
