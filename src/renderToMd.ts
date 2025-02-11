import { capitalCase, kebabCase } from "change-case";
import type { Repo } from "./types";

type DateItem = {
  name: string;
  id: string;
  items: Repo[];
};

const encodeAnchor = (str: string) => kebabCase(str.toLocaleLowerCase());

export const renderToMd = (repository: string, repos: Repo[]) => {
  const title = capitalCase(repository.split(`/`)[1]);

  const anchors: string[] = [kebabCase(title)];
  const dates: DateItem[] = Array.from(new Set(repos.map((repo) => repo.starredAt)))
    .sort((a, b) => {
      return a < b ? 1 : -1;
    })
    .reduce((acc, date) => {
      const anchor = encodeAnchor(date);
      const times = anchors.filter((item) => item === anchor).length;
      anchors.push(anchor);

      const id = `#${anchor}` + (times === 0 ? `` : `-${times}`);
      const items = repos
        .filter((repo) => repo.starredAt === date)
        .sort((a, b) => (a.name > b.name ? 1 : -1));
      acc.push({
        name: date,
        id,
        items,
      });
      return acc;
    }, Array<DateItem>());

  const rawHeading = `icon:: ⭐\ntags:: 自动更新，\npublic:: false，\ndescription:: 本页面是每日由 [[GitHub Action]] 自动构建生成的。\n`;
  const updateTime = new Date().toLocaleString();

  const rawUpdateTime = `updateTime:: ${updateTime}\n\n`;

  const rawContent = dates
    .map((date) => {
      const rawH2 = `- ## [[${date.name}]]\n`;

      const rawItems = date.items
        .map(
          (repo) =>
            `\t- [[github.com/${repo.name}]] - ${
              repo.description.trim() ? repo.description.trim() : "No Description Yet."
            }\n`
        )
        .join(``);

      return `${rawH2}${rawItems}`;
    })
    .join(``);

  const rawMd = rawHeading + rawUpdateTime + rawContent;

  return rawMd;
};
