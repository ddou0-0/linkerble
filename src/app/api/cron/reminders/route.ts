import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { Resend } from "resend";

if (process.env.VAPID_SUBJECT && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(process.env.VAPID_SUBJECT, process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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

    // 유저 이메일 조회
    const { data: { user: authUser } } = await supabase.auth.admin.getUserById(bookmark.user_id);
    const userEmail = authUser?.email;

    // 이메일 발송
    if (resend && userEmail) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://linkerble.com";
      await resend.emails.send({
        from: "Linkerble <noreply@linkerble.com>",
        to: userEmail,
        subject: `🔔 리마인더: ${bookmark.title ?? "저장한 링크"}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
            <h2 style="font-size:18px;margin-bottom:8px">🔔 리마인더가 도착했어요</h2>
            <p style="color:#555;margin-bottom:16px">설정해두신 시간이 됐어요. 저장한 링크를 확인해보세요.</p>
            <div style="background:#f5f5f5;border-radius:12px;padding:16px;margin-bottom:20px">
              <p style="font-weight:600;margin:0 0 8px">${bookmark.title ?? "제목 없음"}</p>
              <a href="${bookmark.url}" style="color:#6366f1;word-break:break-all;font-size:13px">${bookmark.url}</a>
            </div>
            <a href="${appUrl}" style="display:inline-block;background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Linkerble 열기</a>
          </div>
        `,
      }).catch((e: unknown) => console.warn("[reminders] email send failed:", e));
      console.log(`[reminders] email sent to ${userEmail} for bookmark ${bookmark.id}`);
    } else if (!resend) {
      console.warn("[reminders] RESEND_API_KEY not set, skipping email");
    }

    // 웹 푸시 발송
    if (subs?.length) {
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
    } else {
      console.log(`[reminders] no push subs for user ${bookmark.user_id}`);
    }

    // 발송 후 remind_at 초기화
    await supabase.from("bookmarks").update({ remind_at: null }).eq("id", bookmark.id);

    sent++;
  }

  return NextResponse.json({ sent, total: due.length, checked: now.toISOString() });
}
