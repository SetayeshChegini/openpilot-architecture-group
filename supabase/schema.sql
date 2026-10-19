-- Group H shared task progress for GitHub Pages
-- Run this complete file once in the Supabase SQL Editor.

begin;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  member_id text not null unique check (member_id in (
    'setayesh-chegini', 'spence-hashemi', 'mehdi-jafarian', 'david-odidi', 'dan-logvinovsky'
  )),
  display_name text not null,
  role text not null default 'member' check (role in ('member', 'coordinator')),
  created_at timestamptz not null default now()
);

create table if not exists public.task_progress (
  assignment_id text not null check (assignment_id in ('presentation', 'report')),
  task_id text not null,
  member_id text not null check (member_id in (
    'setayesh-chegini', 'spence-hashemi', 'mehdi-jafarian', 'david-odidi', 'dan-logvinovsky'
  )),
  completed boolean not null default false,
  deliverable_url text,
  verification_status text not null default 'Not submitted' check (verification_status in (
    'Not submitted', 'Submitted', 'Verified', 'Changes requested'
  )),
  updated_at timestamptz not null default now(),
  primary key (assignment_id, task_id)
);

create or replace function public.set_task_progress_audit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_task_progress_audit on public.task_progress;
create trigger set_task_progress_audit
before update on public.task_progress
for each row execute function public.set_task_progress_audit();

alter table public.profiles enable row level security;
alter table public.task_progress enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.task_progress from anon, authenticated;

-- Members need only their own profile to determine which task rows they may edit.
grant select (user_id, member_id, display_name, role) on table public.profiles to authenticated;

-- Progress is intentionally public because the GitHub Pages website is public.
-- Browser users may update only the completion flag; task ownership, submission,
-- verification, and timestamp fields cannot be changed through the public client.
grant select on table public.task_progress to anon, authenticated;
grant update (completed) on table public.task_progress to authenticated;

drop policy if exists "Members can read their own profile" on public.profiles;
create policy "Members can read their own profile"
on public.profiles for select
to authenticated
using ((select auth.uid()) is not null and user_id = (select auth.uid()));

drop policy if exists "Public can read task progress" on public.task_progress;
create policy "Public can read task progress"
on public.task_progress for select
to anon, authenticated
using (true);

drop policy if exists "Members update own tasks and coordinator updates all" on public.task_progress;
create policy "Members update own tasks and coordinator updates all"
on public.task_progress for update
to authenticated
using (
  (select auth.uid()) is not null
  and exists (
    select 1
    from public.profiles
    where profiles.user_id = (select auth.uid())
      and (profiles.role = 'coordinator' or profiles.member_id = task_progress.member_id)
  )
)
with check (
  (select auth.uid()) is not null
  and exists (
    select 1
    from public.profiles
    where profiles.user_id = (select auth.uid())
      and (profiles.role = 'coordinator' or profiles.member_id = task_progress.member_id)
  )
);

-- Seed the exact stable task IDs already used by both assignment JSON files.
insert into public.task_progress (assignment_id, task_id, member_id) values
  ('presentation', 'presentation-setayesh-01', 'setayesh-chegini'),
  ('presentation', 'presentation-setayesh-02', 'setayesh-chegini'),
  ('presentation', 'presentation-setayesh-03', 'setayesh-chegini'),
  ('presentation', 'presentation-setayesh-04', 'setayesh-chegini'),
  ('presentation', 'presentation-setayesh-05', 'setayesh-chegini'),
  ('presentation', 'presentation-setayesh-06', 'setayesh-chegini'),
  ('presentation', 'presentation-setayesh-07', 'setayesh-chegini'),
  ('presentation', 'presentation-spence-01', 'spence-hashemi'),
  ('presentation', 'presentation-spence-02', 'spence-hashemi'),
  ('presentation', 'presentation-spence-03', 'spence-hashemi'),
  ('presentation', 'presentation-spence-04', 'spence-hashemi'),
  ('presentation', 'presentation-spence-05', 'spence-hashemi'),
  ('presentation', 'presentation-spence-06', 'spence-hashemi'),
  ('presentation', 'presentation-spence-07', 'spence-hashemi'),
  ('presentation', 'presentation-mehdi-01', 'mehdi-jafarian'),
  ('presentation', 'presentation-mehdi-02', 'mehdi-jafarian'),
  ('presentation', 'presentation-mehdi-03', 'mehdi-jafarian'),
  ('presentation', 'presentation-mehdi-04', 'mehdi-jafarian'),
  ('presentation', 'presentation-mehdi-05', 'mehdi-jafarian'),
  ('presentation', 'presentation-mehdi-06', 'mehdi-jafarian'),
  ('presentation', 'presentation-mehdi-07', 'mehdi-jafarian'),
  ('presentation', 'presentation-david-01', 'david-odidi'),
  ('presentation', 'presentation-david-02', 'david-odidi'),
  ('presentation', 'presentation-david-03', 'david-odidi'),
  ('presentation', 'presentation-david-04', 'david-odidi'),
  ('presentation', 'presentation-david-05', 'david-odidi'),
  ('presentation', 'presentation-david-06', 'david-odidi'),
  ('presentation', 'presentation-dan-01', 'dan-logvinovsky'),
  ('presentation', 'presentation-dan-02', 'dan-logvinovsky'),
  ('presentation', 'presentation-dan-03', 'dan-logvinovsky'),
  ('presentation', 'presentation-dan-04', 'dan-logvinovsky'),
  ('presentation', 'presentation-dan-05', 'dan-logvinovsky'),
  ('presentation', 'presentation-dan-06', 'dan-logvinovsky'),
  ('report', 'report-setayesh-01', 'setayesh-chegini'),
  ('report', 'report-setayesh-02', 'setayesh-chegini'),
  ('report', 'report-setayesh-03', 'setayesh-chegini'),
  ('report', 'report-setayesh-04', 'setayesh-chegini'),
  ('report', 'report-setayesh-05', 'setayesh-chegini'),
  ('report', 'report-setayesh-06', 'setayesh-chegini'),
  ('report', 'report-spence-01', 'spence-hashemi'),
  ('report', 'report-spence-02', 'spence-hashemi'),
  ('report', 'report-spence-03', 'spence-hashemi'),
  ('report', 'report-spence-04', 'spence-hashemi'),
  ('report', 'report-spence-05', 'spence-hashemi'),
  ('report', 'report-spence-06', 'spence-hashemi'),
  ('report', 'report-mehdi-01', 'mehdi-jafarian'),
  ('report', 'report-mehdi-02', 'mehdi-jafarian'),
  ('report', 'report-mehdi-03', 'mehdi-jafarian'),
  ('report', 'report-mehdi-04', 'mehdi-jafarian'),
  ('report', 'report-mehdi-05', 'mehdi-jafarian'),
  ('report', 'report-mehdi-06', 'mehdi-jafarian'),
  ('report', 'report-david-01', 'david-odidi'),
  ('report', 'report-david-02', 'david-odidi'),
  ('report', 'report-david-03', 'david-odidi'),
  ('report', 'report-david-04', 'david-odidi'),
  ('report', 'report-david-05', 'david-odidi'),
  ('report', 'report-dan-01', 'dan-logvinovsky'),
  ('report', 'report-dan-02', 'dan-logvinovsky'),
  ('report', 'report-dan-03', 'dan-logvinovsky'),
  ('report', 'report-dan-04', 'dan-logvinovsky'),
  ('report', 'report-dan-05', 'dan-logvinovsky'),
  ('report', 'report-dan-06', 'dan-logvinovsky'),
  ('report', 'report-dan-07', 'dan-logvinovsky'),
  ('report', 'report-dan-08', 'dan-logvinovsky')
on conflict (assignment_id, task_id) do nothing;

-- Enable Postgres Changes once so other browsers receive progress immediately.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'task_progress'
  ) then
    execute 'alter publication supabase_realtime add table public.task_progress';
  end if;
end
$$;

commit;
