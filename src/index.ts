import { error, getInput } from "@actions/core";
import { getOctokit } from "@actions/github";
import { info } from "console";
import dotenv from "dotenv";
import { promises as fs } from "fs";
import { mkdirp } from "mkdirp";
import { join } from "path";
import { fetchRepos } from "./fetchRepos";
import { renderToMd } from "./renderToMd";
import type { Repo } from "./types";

dotenv.config();

const main = async () => {
  const username = getInput(`username`);
  const repository = getInput(`repository`);
  const token = getInput(`token`);
  const targetDir = getInput(`targetDir`);

  const github = getOctokit(token);
  const repos = await fetchRepos(github, username);

  await mkdirp(targetDir);

  const md = renderToMd(repository, repos);
  const mdFilename = join(targetDir, "Github Stars.md");
  info(`write file: "${mdFilename}"`);
  info(md);
  await fs.writeFile(mdFilename, md);
};

main();
