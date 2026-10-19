# Group H – OpenPilot Architecture Project

A static GitHub Pages website for York University Group H's software architecture and design analysis of OpenPilot.

The Team Responsibilities, Report Requirements, and Task Progress Tracker sections document the group's Assignment 1 plan.

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

Edit each member's `status` in `data/task-status.json`, then commit and push the change to `main`. Supported values are `Not Started`, `In Progress`, and `Completed`. The website reads this file whenever the page loads, so the committed status is visible to every visitor.

## GitHub Pages

The website deploys from the `main` branch and `/ (root)` folder.

Live site: https://eecs4314-group-h.github.io/openpilot-architecture-group/

## Privacy

This repository and website are public. Do not add passwords, API keys, private credentials, or information that should not be publicly visible.
