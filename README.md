# Starred to logseq action

---

This action get github stars from a github person and write to Mardown files. It will generate github repo using the style like `[[github.com/zhaochunqi/starred-to-logseq-action]]`

I generate use it for my Logseq.

## How to Use

```yaml
name: Generate Github Star

on:
  schedule:
    - cron: "5 22 * * *"
env:
  TZ: "Asia/Shanghai"
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: zhaochunqi/starred-to-logseq-action@main
        with:
          username: "zhaochunqi"
          target_dir: "./pages"
       - uses: EndBug/add-and-commit@v9
         with:
           message: "Update Github Stars"
```

## Release

To release a new version, create and push a tag:

```bash
git tag v1.0.0  # replace with your version
git push --tags
```

The GitHub Action will automatically create a release with the tag.
