-- Phase 1: account profiles, RLS and the auth.users -> profiles trigger.
--
-- Security invariants:
--   * A user can only read their own profile.
--   * A user can only update display_name. plan/credits are server-controlled.
--   * Rows are created by a security-definer trigger, not by the browser.
--   * Anonymous users have no access at all.

create type public.user_plan as enum ('free', 'pro');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text,
  plan public.user_plan not null default 'free',
  credits integer not null default 2,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_credits_non_negative check (credits >= 0),
  constraint profiles_display_name_length check (
    display_name is null or char_length(display_name) <= 50
  )
);

comment on table public.profiles is
  'Public profile mirror of auth.users. One row per authenticated user.';
comment on column public.profiles.credits is
  'Server-controlled research credits. Never writable by the browser.';

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

revoke all on public.profiles from anon;
revoke all on public.profiles from authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant select, insert, update, delete on public.profiles to service_role;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    coalesce(new.email, ''),
    left(nullif(new.raw_user_meta_data ->> 'display_name', ''), 50)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
