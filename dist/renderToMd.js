"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderToMd = void 0;
const capital_case_1 = require("capital-case");
const param_case_1 = require("param-case");
const markdown_to_text_emoji_1 = require("markdown-to-text-emoji");
const escapeInput = (str) => str
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
const encodeAnchor = (str) => (0, param_case_1.paramCase)(str.toLocaleLowerCase());
const renderToMd = (repository, description, workflow, repos) => {
    const title = (0, capital_case_1.capitalCase)(repository.split(`/`)[1]);
    const badge = {
        text: `build`,
        svg: `https://github.com/${repository}/workflows/${workflow}/badge.svg`,
        href: `https://github.com/${repository}/actions`
    };
    const anchors = [(0, param_case_1.paramCase)(title)];
    const categories = Array
        .from(new Set(repos.map(repo => repo.language)))
        .sort((a, b) => {
        if (a == "Misc") {
            return 1;
        }
        if (b == "Misc") {
            return -1;
        }
        return a > b ? 1 : -1;
    })
        .reduce((acc, language) => {
        const anchor = encodeAnchor(language);
        const times = anchors.filter(item => item === anchor).length;
        anchors.push(anchor);
        const id = `#${anchor}` + (times === 0 ? `` : `-${times}`);
        const items = repos
            .filter(repo => repo.language === language)
            .sort((a, b) => a.name > b.name ? 1 : -1);
        acc.push({
            name: language,
            id,
            items
        });
        return acc;
    }, Array());
    // const rawHeading = `# ${title}  [![${badge.text}](${badge.svg})](${badge.href})\n\n`
    const rawHeading = `tags:: 自动更新，\ndescription:: 本页面是每日由 [[GitHub Action]] 自动构建生成的。\n`;
    const updateTime = new Date().toLocaleString();
    const rawUpdateTime = `updateTime:: ${updateTime}\n\n`;
    const rawDescription = `${escapeInput(description)}\n\n`;
    const rawCategories = categories
        .map(category => `- [${category.name}](${category.id})\n`)
        .join(``);
    const rawLine = `\n---\n\n`;
    const rawContent = categories.map(category => {
        const rawH2 = `## ${category.name}\n\n`;
        const rawItems = category.items
            .map(repo => ` - [[github.com/${repo.name}]] - ${escapeInput((0, markdown_to_text_emoji_1.textEmoji)(repo.description))}\n`)
            .join(``);
        return `${rawH2}${rawItems}\n`;
    }).join(``);
    const rawMd = rawHeading
        + rawUpdateTime
        // + rawDescription
        // + rawCategories
        // + 
        // rawLine
        + rawContent;
    return rawMd;
};
exports.renderToMd = renderToMd;
