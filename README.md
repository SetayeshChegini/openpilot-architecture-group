# Group H – OpenPilot Architecture Project

A static GitHub Pages website for York University Group H's software architecture and design analysis of OpenPilot.

The Assignment 1 dashboard includes the team responsibility overview, an overall project pipeline, expandable member workflows, handoffs, report requirements, shared resources, submission rules, and a repository-backed detailed progress tracker.

## Team Members

Student numbers are maintained directly in `index.html` as a simple static roster.

- Setayesh Chegini — 218804096
- Spence Hashemi — 220785408
- Mehdi Jafarian — 219899095
- David Odidi — 214208086
- Dan Logvinovsky — 215753494

## Project Files

```text
index.html
css/
  style.css
data/
  task-status.json
js/
  task-progress.js
assignments/
reports/
documents/
resources/
README.md
```

## Updating the Team List

Edit the member cards in the `Team Members` section of `index.html`, then commit and push the change to `main`.

## Updating Task Progress

Edit the relevant entry in each member's `items` array in `data/task-status.json`, then commit and push the change to `main`.

- Set `status` to `Not Started`, `In Progress`, or `Completed`.
- Add an optional `link` to the submitted document or diagram.
- Keep the task `id` stable so existing progress is preserved.

The website calculates each member's completion percentage and the overall percentage from the committed step data. It does not save progress in browser storage.

## Assignment 1 File Names

Use lowercase kebab-case names following this pattern:

```text
lastname-assignment1-artifact-v01.ext
```

Example: `hashemi-assignment1-architecture-diagram-v01.svg`.

## GitHub Pages

The website deploys from the `main` branch and `/ (root)` folder.

Live site: https://eecs4314-group-h.github.io/openpilot-architecture-group/

## Privacy

This repository and website are public. Do not add passwords, API keys, private credentials, or information that should not be publicly visible.
