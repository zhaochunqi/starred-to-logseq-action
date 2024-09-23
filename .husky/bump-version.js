// bump-version.js
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const packageJsonPath = path.resolve(__dirname, "../package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

const versionParts = packageJson.version.split(".");
const major = parseInt(versionParts[0], 10);
const minor = parseInt(versionParts[1], 10);
const patch = parseInt(versionParts[2], 10);

console.log(`Current version: ${packageJson.version}`);
console.log(
  `Parsed version - Major: ${major}, Minor: ${minor}, Patch: ${patch}`
);

// Check if this is an --amend operation
const isAmend = process.argv.includes("--amend");

if (isAmend) {
  console.log("Amend operation detected, no version bump needed.");
  process.exit(0);
}

// Get the previous version from the last committed package.json
let previousVersion;
try {
  const previousPackageJson = execSync(`git show HEAD:package.json`, {
    encoding: "utf8",
  });
  previousVersion = JSON.parse(previousPackageJson).version;
} catch (error) {
  console.error("Error retrieving previous version:", error);
  process.exit(1);
}

console.log(`Previous version: ${previousVersion}`);

if (packageJson.version === previousVersion) {
  versionParts[2] = patch + 1;
  packageJson.version = versionParts.join(".");
  fs.writeFileSync(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + "\n"
  );
  console.log(`Version bumped to ${packageJson.version}`);
  // Add the updated package.json to the staging area
  execSync(`git add ${packageJsonPath}`);
} else {
  console.log("Version has been updated, no patch bump needed.");
}
