import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// POST /api/push/notify — 안 읽은 항목 있으면 알림 발송
// 하루에 한 번 cron으로 호출하거나, 설정 페이지에서 수동 테스트
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 안 읽은 항목 수
  const { count } = await supabase
    .from("bookmarks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (!count || count === 0) {
    return NextResponse.json({ message: "No unread items" });
  }

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", user.id);

  if (!subs?.length) {
    return NextResponse.json({ message: "No subscriptions" });
  }

  const payload = JSON.stringify({
    title: "Linkerble",
    body: `아직 읽지 않은 항목이 ${count}개 있어요 👀`,
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

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return NextResponse.json({ sent, total: subs.length, unread: count });
}
