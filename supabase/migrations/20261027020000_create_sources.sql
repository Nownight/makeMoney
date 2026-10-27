-- Phase 3: search results (sources) per report, plus a failure message on reports.
--
-- Security invariants:
--   * A user can only read sources whose parent report they own.
--   * Sources are written only by the server (service_role); no client writes.
--   * reports.error_message is server-written; the browser can only read it.
--   * Anonymous users have no access at all.

alter table public.reports add column error_message text;

comment on column public.reports.error_message is
  'Server-written, user-facing failure reason. Null unless status = failed.';

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  url text not null,
  title text,
  domain text not null,
  snippet text,
  published_at timestamptz,
  search_rank integer,
  status text not null default 'found',
  quality_score integer,
  raw_metadata jsonb,
  fetched_at timestamptz,
  created_at timestamptz not null default now(),
  constraint sources_status_valid check (
    status in ('found', 'extracted', 'partial', 'failed', 'filtered')
  ),
  constraint sources_quality_score_range check (
    quality_score is null or quality_score between 0 and 100
  ),
  constraint sources_report_url_unique unique (report_id, url)
);

comment on table public.sources is
  'Web sources found for a report. Written by the server/worker only.';

create index sources_report_id_idx on public.sources (report_id);

alter table public.sources enable row level security;

create policy "sources_select_own_report"
  on public.sources
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.reports r
      where r.id = sources.report_id
        and r.user_id = (select auth.uid())
    )
  );

revoke all on public.sources from anon;
revoke all on public.sources from authenticated;
grant select on public.sources to authenticated;
grant select, insert, update, delete on public.sources to service_role;
