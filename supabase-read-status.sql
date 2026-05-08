-- Supabase SQL Editor에서 실행하세요
-- is_read 컬럼 추가 (읽음/안읽음)
ALTER TABLE public.bookmarks ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;

-- 푸시 알림 구독 정보 테이블
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    text NOT NULL,
  p256dh      text NOT NULL,
  auth        text NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
