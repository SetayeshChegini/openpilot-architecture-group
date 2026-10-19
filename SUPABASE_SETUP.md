# Supabase Setup for Shared Group H Progress

The website integration, schema, authentication UI, and Row Level Security rules are included in this repository, but **cloud persistence is not active until this setup is completed**. Until then, the website intentionally keeps task checkboxes read-only and shows the committed JSON baseline.

## 1. Create the project

1. Sign in at <https://supabase.com/dashboard> and create one Supabase project for Group H.
2. Keep the database password in a private password manager. Do not add it to GitHub.
3. In **Authentication → Providers → Email**, enable email/password authentication.
4. Disable public user sign-ups. Team accounts should be created or invited by the coordinator only.
5. In **Authentication → URL Configuration**, set:
   - Site URL: `https://eecs4314-group-h.github.io/openpilot-architecture-group/`
   - Redirect URL: `https://eecs4314-group-h.github.io/openpilot-architecture-group/**`

## 2. Create the secure database

1. Open **SQL Editor** in the Supabase dashboard.
2. Run the complete [`supabase/schema.sql`](supabase/schema.sql) file.
3. Confirm that `public.task_progress` contains 64 rows: 33 presentation tasks and 31 report tasks.
4. Confirm Row Level Security is enabled for both `public.profiles` and `public.task_progress`.
5. Confirm `task_progress` appears in the `supabase_realtime` publication.

The migration allows public read access because this GitHub Pages website is public. It does **not** allow anonymous writes. Authenticated members can update only the `completed` column on their own rows; the coordinator can update all rows. Task ownership, deliverable URLs, verification status, and timestamp fields cannot be changed by the browser.

## 3. Invite and map the five members

1. In **Authentication → Users**, invite or create one email/password account for each member.
2. Copy [`supabase/map-users.sql.example`](supabase/map-users.sql.example) into the SQL Editor.
3. Replace each example email with the exact invited email.
4. Run the edited SQL.
5. Confirm its final query returns exactly these mappings:

| Member ID | Name | Role |
|---|---|---|
| `setayesh-chegini` | Setayesh Chegini | `coordinator` |
| `spence-hashemi` | Spence Hashemi | `member` |
| `mehdi-jafarian` | Mehdi Jafarian | `member` |
| `david-odidi` | David Odidi | `member` |
| `dan-logvinovsky` | Dan Logvinovsky | `member` |

An authenticated account without one of these profile rows cannot change any task.

## 4. Add the public browser configuration

1. In the Supabase dashboard, open the project's **Connect** dialog or **Settings → API Keys**.
2. Copy the project URL and the **publishable key** (or legacy public `anon` key).
3. Edit [`js/supabase-config.js`](js/supabase-config.js):

```js
window.GROUP_H_SUPABASE_CONFIG = Object.freeze({
  url: "https://YOUR_PROJECT_REF.supabase.co",
  publishableKey: "YOUR_PUBLIC_PUBLISHABLE_OR_ANON_KEY"
});
```

The publishable/anon key is designed for browser use and is protected by the included RLS policies. **Never put a secret key or service-role key in this file, any HTML file, or GitHub.**

4. Commit and push only this public configuration change to `main`.
5. Wait for GitHub Pages to deploy.

## 5. Required security and cross-device test

Use two different browsers or devices and at least two member accounts.

1. Signed out: confirm progress is visible and every checkbox is read-only.
2. Sign in as Spence: check a Spence presentation task. Confirm the row turns green and progress updates immediately.
3. Refresh: confirm the checkbox remains checked.
4. On the second browser: confirm the change appears without editing GitHub; Realtime should update an already-open page.
5. As Spence: confirm Setayesh, Mehdi, David, and Dan tasks remain disabled.
6. Uncheck the Spence task and confirm progress decreases on both browsers.
7. Sign in as Setayesh: confirm the coordinator can update any member's task.
8. Confirm presentation changes do not affect report progress.
9. Mark one member's complete task list finished and confirm the page shows **Completed – All Tasks Finished** and a green 100% bar.
10. Sign in with an authenticated but unmapped test account and confirm no task can be modified.

Do not claim the cross-device tracker is fully operational until this test passes against the configured Supabase project.

## Operational notes

- Shared task status lives in Supabase, not `localStorage` and not the JSON files.
- Supabase Auth may store the signed-in session in browser storage; this is authentication state, not the shared task database.
- The JSON files remain the stable task catalog and safe read-only fallback.
- A checked task is only a member's completion claim. It does not automatically mark a deliverable as submitted or verified.
- Use the Supabase dashboard or a separately secured coordinator workflow for deliverable and verification updates.
