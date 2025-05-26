import { capitalCase, kebabCase } from "change-case";
import moment from "moment";
import type { Repo } from "./types";

/**
 * Date item type definition
 */
type DateItem = {
  name: string; // Date name
  id: string; // Anchor ID
  items: Repo[]; // Repository list
};

/**
 * Logseq page header constants
 */
const PAGE_HEADER = {
  ICON: "icon:: ⭐",
  TAGS: "tags:: 自动更新，",
  PUBLIC: "public:: false，",
  DESCRIPTION: "description:: 本页面是每日由 [[GitHub Action]] 自动构建生成的。",
};

/**
 * Encode string to anchor format
 * @param str String to encode
 * @returns Encoded anchor string
 */
const encodeAnchor = (str: string) => kebabCase(str.toLocaleLowerCase());

/**
 * Render repository data to Markdown format
 * @param repository Repository name
 * @param repos Repository list
 * @returns Markdown formatted string
 */
export const renderToMd = (repository: string, repos: Repo[]) => {
  const title = capitalCase(repository.split(`/`)[1]);

  // Use Map to track anchor usage
  const anchorMap = new Map<string, number>();
  anchorMap.set(kebabCase(title), 1); // Initialize title anchor

  // Step 1: Get unique date list and sort
  const uniqueDates = Array.from(new Set(repos.map((repo) => repo.starredAt)));

  // Use moment.js for date sorting to ensure correct date format
  const sortedDates = uniqueDates.sort((a, b) => {
    return moment(a.split(" ")[0], "YYYY-MM-DD").isBefore(moment(b.split(" ")[0], "YYYY-MM-DD"))
      ? 1
      : -1;
  });

  // Step 2: Create DateItem for each date
  const dates: DateItem[] = sortedDates.map((date) => {
    // Create and track anchor
    const anchor = encodeAnchor(date);
    const count = anchorMap.get(anchor) || 0;
    anchorMap.set(anchor, count + 1);

    // Generate anchor ID
    const id = `#${anchor}` + (count === 0 ? `` : `-${count}`);

    // Get and sort repositories for this date
    const items = repos
      .filter((repo) => repo.starredAt === date)
      .sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1));

    return {
      name: date,
      id,
      items,
    };
  });

  // Build page header
  const rawHeading = `${PAGE_HEADER.ICON}
${PAGE_HEADER.TAGS}
${PAGE_HEADER.PUBLIC}
${PAGE_HEADER.DESCRIPTION}
`;
  // Add update time
  const updateTime = new Date().toLocaleString();
  const rawUpdateTime = `updateTime:: ${updateTime}

`;

  // Build content section
  const rawContent = dates
    .map((date) => {
      // Create date heading
      const rawH2 = `- ## [[${date.name}]]
`;

      // Create repository list
      const rawItems = date.items
        .map((repo) => {
          const description = repo.description
            ? repo.description.replace(/\[\[|\]\]|#/g, "").trim() || "No Description Yet."
            : "No Description Yet.";
          return `	- [[github.com/${repo.name}]] - ${description}
`;
        })
        .join(``);

      return `${rawH2}${rawItems}`;
    })
    .join(``);

  // Combine final Markdown content
  const rawMd = rawHeading + rawUpdateTime + rawContent;

  return rawMd;
};
