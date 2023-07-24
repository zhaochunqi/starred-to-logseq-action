"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderToMd = void 0;
const capital_case_1 = require("capital-case");
const param_case_1 = require("param-case");
const markdown_to_text_emoji_1 = require("markdown-to-text-emoji");
const encodeAnchor = (str) => (0, param_case_1.paramCase)(str.toLocaleLowerCase());
const renderToMd = (repository, repos) => {
    const title = (0, capital_case_1.capitalCase)(repository.split(`/`)[1]);
    const anchors = [(0, param_case_1.paramCase)(title)];
    const dates = Array
        .from(new Set(repos.map(repo => repo.starredAt)))
        .sort((a, b) => {
        return a < b ? 1 : -1;
    })
        .reduce((acc, date) => {
        const anchor = encodeAnchor(date);
        const times = anchors.filter(item => item === anchor).length;
        anchors.push(anchor);
        const id = `#${anchor}` + (times === 0 ? `` : `-${times}`);
        const items = repos
            .filter(repo => repo.starredAt === date)
            .sort((a, b) => a.name > b.name ? 1 : -1);
        acc.push({
            name: date,
            id,
            items
        });
        return acc;
    }, Array());
    // const rawHeading = `# ${title}  [![${badge.text}](${badge.svg})](${badge.href})\n\n`
    const rawHeading = `tags:: 自动更新，\ndescription:: 本页面是每日由 [[GitHub Action]] 自动构建生成的。\n`;
    const updateTime = new Date().toLocaleString();
    const rawUpdateTime = `updateTime:: ${updateTime}\n\n`;
    const rawContent = dates.map(date => {
        const rawH2 = `## [[${date.name}]]\n`;
        const rawItems = date.items
            .map(repo => ` - [[github.com/${repo.name}]] - ${(0, markdown_to_text_emoji_1.textEmoji)(repo.description)}\n`)
            .join(``);
        return `${rawH2}${rawItems}`;
    }).join(``);
    const rawMd = rawHeading
        + rawUpdateTime
        + rawContent;
    return rawMd;
};
exports.renderToMd = renderToMd;
