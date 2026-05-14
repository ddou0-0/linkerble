import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// GET /api/cron/reminders — 만료된 리마인더 푸시 후 remind_at 초기화
// vercel.json cron: "*/5 * * * *"
export async function GET(req: NextRequest) {
  // Vercel cron은 자동으로 Authorization: Bearer <CRON_SECRET> 헤더를 보냄
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    const xCronSecret = req.headers.get("x-cron-secret");
    if (
      authHeader !== `Bearer ${cronSecret}` &&
      xCronSecret !== cronSecret
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.error("[reminders] SUPABASE_SERVICE_ROLE_KEY is not set");
    return NextResponse.json({ error: "Server misconfigured: missing service key" }, { status: 500 });
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey
  );

  const now = new Date();
  const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000);

  // 지금~10분 전 사이에 remind_at이 걸린 북마크
  const { data: due, error: fetchError } = await supabase
    .from("bookmarks")
    .select("id, user_id, title, url, remind_at")
    .lte("remind_at", now.toISOString())
    .gte("remind_at", tenMinAgo.toISOString());

  if (fetchError) {
    console.error("[reminders] DB fetch error:", fetchError);
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  console.log(`[reminders] due count: ${due?.length ?? 0} at ${now.toISOString()}`);

  if (!due?.length) return NextResponse.json({ sent: 0, checked: now.toISOString() });

  let sent = 0;
  for (const bookmark of due) {
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", bookmark.user_id);

    if (!subs?.length) {
      console.log(`[reminders] no push subs for user ${bookmark.user_id}`);
      // 구독 없어도 remind_at은 초기화
      await supabase.from("bookmarks").update({ remind_at: null }).eq("id", bookmark.id);
      continue;
    }

    const payload = JSON.stringify({
      title: "🔔 리마인더",
      body: bookmark.title ?? "저장한 링크를 확인해보세요",
      url: "/",
    });

    const results = await Promise.allSettled(
      subs.map((s) =>
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        )
      )
    );

    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length) {
      console.warn(`[reminders] ${failed.length}/${subs.length} push failed for bookmark ${bookmark.id}`);
    }

    // 발송 후 remind_at 초기화
    await supabase.from("bookmarks").update({ remind_at: null }).eq("id", bookmark.id);

    sent++;
  }

  return NextResponse.json({ sent, total: due.length, checked: now.toISOString() });
}
