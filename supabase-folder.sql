-- Supabase SQL Editor에서 실행하세요
ALTER TABLE public.bookmarks ADD COLUMN IF NOT EXISTS folder text;
