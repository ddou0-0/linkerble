-- Supabase SQL Editor에서 실행하세요

create table if not exists public.user_settings (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  share_token text unique default gen_random_uuid()::text,
  created_at  timestamptz default now()
);

alter table public.user_settings enable row level security;

create policy "Users manage own settings"
  on public.user_settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
