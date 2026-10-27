-- Phase 4: structured data extracted from each source (one row per entity).

create table public.extracted_items (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports (id) on delete cascade,
  source_id uuid not null references public.sources (id) on delete cascade,
  entity_name text not null,
  entity_type text not null default 'product',
  normalized_data jsonb not null,
  confidence numeric check (confidence is null or (confidence >= 0 and confidence <= 1)),
  schema_version text not null,
  created_at timestamptz not null default now()
);

create index extracted_items_report_id_idx on public.extracted_items (report_id);
create index extracted_items_source_id_idx on public.extracted_items (source_id);
-- Supports the 24h extraction cache lookup.
create index extracted_items_schema_version_created_at_idx
  on public.extracted_items (schema_version, created_at desc);

alter table public.extracted_items enable row level security;

-- Users may read items of their own reports. Writes: service role only.
create policy "extracted_items_select_own_report"
  on public.extracted_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.reports r
      where r.id = extracted_items.report_id
        and r.user_id = (select auth.uid())
    )
  );

revoke all on public.extracted_items from anon;
revoke all on public.extracted_items from authenticated;
grant select on public.extracted_items to authenticated;
grant select, insert, update, delete on public.extracted_items to service_role;
