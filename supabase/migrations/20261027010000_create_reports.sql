-- Phase 2: research reports created by users, processed later by the worker.
--
-- Security invariants:
--   * A user can only read their own reports.
--   * A user can only insert reports for themselves, and only the input
--     columns (query, source_limit, language). Status, progress, results and
--     is_paid are server-controlled (service_role) and never browser-writable.
--   * No client update/delete.
--   * Anonymous users have no access at all.

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  query text not null,
  title text,
  status text not null default 'queued',
  progress integer not null default 0,
  source_limit integer not null default 5,
  language text,
  executive_summary text,
  analysis_json jsonb,
  visualization_json jsonb,
  is_paid boolean not null default false,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint reports_query_length check (char_length(query) between 1 and 200),
  constraint reports_status_valid check (
    status in (
      'queued', 'searching', 'extracting', 'normalizing',
      'analyzing', 'rendering', 'completed', 'failed'
    )
  ),
  constraint reports_progress_range check (progress between 0 and 100),
  constraint reports_source_limit_valid check (source_limit in (5, 10, 20))
);

comment on table public.reports is
  'Research reports. Created by the owner; processed by server/worker only.';

create index reports_user_id_created_at_idx
  on public.reports (user_id, created_at desc);

alter table public.reports enable row level security;

create policy "reports_select_own"
  on public.reports
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "reports_insert_own"
  on public.reports
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

revoke all on public.reports from anon;
revoke all on public.reports from authenticated;
grant select on public.reports to authenticated;
grant insert (user_id, query, source_limit, language) on public.reports to authenticated;
grant select, insert, update, delete on public.reports to service_role;
