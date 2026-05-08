import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// GET /api/cron/reminders — 만료된 리마인더 푸시 후 remind_at 초기화
// Vercel cron: "*/5 * * * *" or 매일 특정 시간
export async function GET(req: NextRequest) {
  // 크론 시크릿 체크 (CRON_SECRET 환경 변수 설정 권장)
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // supabase service role로 직접 접근 (인증 없이)
  const { createClient: createSC } = await import("@supabase/supabase-js");
  const supabase = createSC(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();
  const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000);

  // 지금~10분 전 사이에 remind_at이 걸린 북마크 (중복 발송 방지)
  const { data: due } = await supabase
    .from("bookmarks")
    .select("id, user_id, title, url, remind_at")
    .lte("remind_at", now.toISOString())
    .gte("remind_at", tenMinAgo.toISOString());

  if (!due?.length) return NextResponse.json({ sent: 0 });

  let sent = 0;
  for (const bookmark of due) {
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", bookmark.user_id);

    if (!subs?.length) continue;

    const payload = JSON.stringify({
      title: "🔔 리마인더",
      body: bookmark.title ?? "저장한 링크를 확인해보세요",
      url: "/",
    });

    await Promise.allSettled(
      subs.map((s) =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        )
      )
    );

    // 발송 후 remind_at 초기화
    await supabase
      .from("bookmarks")
      .update({ remind_at: null })
      .eq("id", bookmark.id);

    sent++;
  }

  return NextResponse.json({ sent });
}
