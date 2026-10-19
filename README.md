# Group H – OpenPilot Architecture Project

A static GitHub Pages website for York University Group H's software architecture and design analysis of OpenPilot.

Assignment 1 has two independent workspaces:

- `assignment-1-presentation.html` contains the presentation pipeline, all five detailed member workflows, the October 22 deadline, presentation schedule, handoffs, resources, and submission checklist.
- `assignment-1-report.html` contains the ten-stage report pipeline, complete report requirements, all five detailed member workflows, the October 25 deadline, handoffs, resources, and submission checklist.

The homepage stays focused on the project overview, roster, assignment cards, and general resources.

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
assignment-1-presentation.html
assignment-1-report.html
css/
  style.css
data/
  assignment-1-presentation.json
  assignment-1-report.json
js/
  assignment-dashboard.js
  home-progress.js
assignments/
reports/
documents/
resources/
README.md
```

## Updating the Team List

Edit the member cards in the `Team Members` section of `index.html`, then commit and push the change to `main`.

## Updating Task Progress

Edit the relevant entry in the correct repository data file, then commit and push the change to `main`:

- Presentation: `data/assignment-1-presentation.json`
- Report: `data/assignment-1-report.json`

- Set `status` to `Not Started`, `In Progress`, or `Completed`.
- Add an optional `deliverableUrl` to the submitted document, slide, or diagram.
- Keep the task `id` stable so existing progress is preserved.

Each assignment calculates its own member and overall completion percentages from committed step data. Presentation completion never changes report completion. The website does not save progress in browser storage.

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
