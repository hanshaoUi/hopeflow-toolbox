# Illustrator Reference Archive

Downloaded from the public Notion Illustrator Reference page for local project lookup.

Source: https://judicious-night-bca.notion.site/Illustrator-Reference-bb586c9667764361b2ed3aa312049d35

Last update in source: 2025-12-29
Target Illustrator version in source: 30.0.0
Generated locally: 2026-04-30

## What is useful here

- `menu-commands-v30.*`: `680` rows of `app.executeMenuCommand(...)` / menuCommandString data. This is directly useful for our CEP/ExtendScript scripts.
- `select-tools-v30.*`: `100` rows of `app.selectTool(...)` tool-name data. Useful if we add tool switching or validation.
- AppleScript and JXA columns are kept for reference, but they are mostly macOS automation material and should not be used in the runtime CEP panel.

## Files

- `menu-commands-v30.md` / `menu-commands-v30.csv` / `menu-commands-v30.json`
- `select-tools-v30.md` / `select-tools-v30.csv` / `select-tools-v30.json`
- `metadata.json`

## Notes

These Illustrator command/tool strings are not official stable APIs. Before adding one to production code, test it in the Illustrator versions we support and note whether it opens UI, requires a selection, or depends on locale/plugins.
