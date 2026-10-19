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
  shared-progress.js
  supabase-config.js
supabase/
  schema.sql
  map-users.sql.example
SUPABASE_SETUP.md
assignments/
reports/
documents/
resources/
README.md
```

## Updating the Team List

Edit the member cards in the `Team Members` section of `index.html`, then commit and push the change to `main`.

## Interactive Shared Progress

The website contains a Supabase-backed interactive checkbox system with independent presentation and report progress, per-member authorization, coordinator access, automatic percentages, and Realtime updates.

**Cloud persistence is not active until the one-time Supabase configuration is completed.** Follow [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md). Until then, task rows remain read-only and use the committed JSON files as the baseline task catalog.

After setup:

- Invited members sign in on either assignment page and update only their assigned task checkboxes.
- Setayesh's coordinator account can update every member's tasks.
- Anonymous visitors may view progress but cannot change it.
- Completion is stored in Supabase and shared across browsers; it is not stored in `localStorage`.
- Presentation and report completion remain independent.
- A completion checkbox does not automatically mark a deliverable submitted or verified.

Do not change stable task IDs after the database has been seeded. Never add a Supabase secret or service-role key to the repository; only the public publishable/anon key belongs in `js/supabase-config.js`.

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
