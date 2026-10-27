-- Pivot (契机 AI): store the expanded search queries used for each report.
-- Array of strings, e.g. ["AI 漫画 新产品 发布 2026", ...]; null for older reports.
alter table public.reports
  add column if not exists search_queries jsonb;

alter table public.reports
  add constraint reports_search_queries_is_array check (
    search_queries is null or jsonb_typeof(search_queries) = 'array'
  );
