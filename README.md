# Starred to logseq action

```yaml
name: Generate Github Star

on:
  schedule:
    - cron: "5 22 * * *"

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: zhaochunqi/starred-to-logseq-action@main
        with:
          username: "zhaochunqi"
          targetDir: "./pages"
      - uses: EndBug/add-and-commit@v9
        with:
          message: "Update Github Stars"
```
