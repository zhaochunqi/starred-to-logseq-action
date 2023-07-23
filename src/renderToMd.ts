import { capitalCase } from "capital-case"
import type { Repo } from "./types"
import { paramCase } from 'param-case'

type Category = {
  name: string,
  id: string,
  items: Repo[]
}

const escapeInput = (str: string) => str
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")

const encodeAnchor = (str: string) => paramCase(str.toLocaleLowerCase())

export const renderToMd = (
  repository: string,
  description: string,
  workflow: string,
  repos: Repo[]
) => {
  const title = capitalCase(repository.split(`/`)[1])
  const badge = {
    text: `build`,
    svg: `https://github.com/${repository}/workflows/${workflow}/badge.svg`,
    href: `https://github.com/${repository}/actions`
  }

  const anchors: string[] = [paramCase(title)]
  const categories: Category[] = Array
    .from(new Set(
      repos.map(repo => repo.language))
    )
    .sort((a, b) => {
      if (a == "Misc") {
        return 1
      }
      if (b == "Misc") {
        return -1
      }
      return a > b ? 1 : -1
    })
    .reduce((acc, language) => {
      const anchor = encodeAnchor(language)
      const times = anchors.filter(item => item === anchor).length
      anchors.push(anchor)

      const id = `#${anchor}` + (times === 0 ? `` : `-${times}`)
      const items = repos
        .filter(repo => repo.language === language)
        .sort((a, b) => a.name > b.name ? 1 : -1)
      acc.push({
        name: language,
        id,
        items
      })
      return acc
    }, Array<Category>())

  // const rawHeading = `# ${title}  [![${badge.text}](${badge.svg})](${badge.href})\n\n`
  const rawHeading = `tags:: 自动更新，\ndescription:: 本页面是每日由 [[GitHub Action]] 自动构建生成的。\n`
  const updateTime = new Date().toLocaleString()

  const rawUpdateTime = `updateTime:: ${updateTime}\n\n`

  const rawDescription = `${escapeInput(description)}\n\n`

  const rawCategories = categories
    .map(category => `- [${category.name}](${category.id})\n`)
    .join(``)

  const rawLine = `\n---\n\n`

  const rawContent = categories.map(category => {
    const rawH2 = `## ${category.name}\n\n`

    const rawItems = category.items
      .map(repo => ` - [[github.com/${repo.name}]] - ${escapeInput(repo.description)}\n`)
      .join(``)

    return `${rawH2}${rawItems}\n`
  }).join(``)

  const rawMd = 
  rawHeading
  + rawUpdateTime
    // + rawDescription
    // + rawCategories
    // + 
    // rawLine
    + rawContent

  return rawMd
}