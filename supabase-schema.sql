-- Linkerble DB Schema
-- Run this in Supabase SQL Editor

create extension if not exists "uuid-ossp";

create table public.bookmarks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  url         text not null,
  title       text,
  description text,
  favicon_url text,
  og_image    text,
  summary     text,
  tags        text[] default '{}',
  domain      text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 사용자별 조회, 태그 검색을 위한 인덱스
create index bookmarks_user_id_idx on public.bookmarks(user_id);
create index bookmarks_tags_idx on public.bookmarks using gin(tags);
create index bookmarks_created_at_idx on public.bookmarks(created_at desc);

-- RLS 활성화
alter table public.bookmarks enable row level security;

-- 사용자는 자신의 북마크만 접근 가능
create policy "Users can manage own bookmarks"
  on public.bookmarks
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- updated_at 자동 갱신 함수
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on public.bookmarks
  for each row execute function update_updated_at();
