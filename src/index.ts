import { getInput, info, warning, error as logError, setFailed } from "@actions/core";
import { getOctokit } from "@actions/github";
import dotenv from "dotenv";
import { promises as fs } from "fs";
import { mkdirp } from "mkdirp";
import { join } from "path";
import { fetchRepos } from "./fetchRepos";
import { renderToMd } from "./renderToMd";
import { ApiError } from "./utils";

dotenv.config();

/**
 * Validate input parameters
 * @param params Parameters object
 * @throws {Error} If parameters are invalid
 */
function validateInputs(params: { [key: string]: string }): void {
  const requiredParams = ["username", "repository", "token", "target_dir"];

  for (const param of requiredParams) {
    if (!params[param] || params[param].trim() === "") {
      throw new Error(`Missing required parameter: ${param}`);
    }
  }

  // Validate token length
  // Matches gh[pousru]_, ghe_, or github_pat_ + 35-80 base-62/- chars
  const tokenRe = /^(gh[pousru]|ghe|github_pat)_[A-Za-z0-9_-]{35,80}$/;
  if (!tokenRe.test(params.token)) {
    throw new Error("Invalid GitHub token format");
  }
}

/**
 * Main function
 */
const main = async () => {
  try {
    // Get input parameters
    const inputs = {
      username: getInput(`username`),
      repository: getInput(`repository`),
      token: getInput(`token`),
      target_dir: getInput(`target_dir`),
    };

    // Validate input parameters
    validateInputs(inputs);

    info(`Starting to fetch ${inputs.username}'s starred repositories...`);

    // Create GitHub client and fetch repository data
    const github = getOctokit(inputs.token);
    const repos = await fetchRepos(github, inputs.username);

    info(`Successfully fetched ${repos.length} repositories`);

    // Create target directory
    await mkdirp(inputs.target_dir);
    info(`Created directory: ${inputs.target_dir}`);

    // Render and write Markdown file
    const md = renderToMd(inputs.repository, repos);
    const mdFilename = join(inputs.target_dir, "Github Stars.md");

    info(`Writing file: "${mdFilename}"`);
    await fs.writeFile(mdFilename, md);

    info(`Processing complete! File has been generated at ${mdFilename}`);
  } catch (error) {
    // Error handling
    if (error instanceof ApiError) {
      setFailed(`API error (${error.status}): ${error.message}`);
    } else if (error instanceof Error) {
      setFailed(`Error: ${error.message}`);
    } else {
      setFailed(`Unknown error: ${error}`);
    }
  }
};

// Execute main function
main();
