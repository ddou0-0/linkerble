import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import webpush from "web-push";
import Anthropic from "@anthropic-ai/sdk";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// POST /api/push/daily — 오늘의 추천 링크 3개 푸시
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 지난 30일 내 저장된 안 읽은 링크 (최대 20개)
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select("id, title, intent, summary, folder, created_at")
    .eq("user_id", user.id)
    .eq("is_read", false)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: false })
    .limit(20);

  if (!bookmarks?.length) {
    return NextResponse.json({ message: "No unread bookmarks" });
  }

  // 3개 이하면 바로 사용
  let picks = bookmarks.slice(0, 3);

  // 4개 이상이면 AI가 오늘 읽기 좋은 3개 선택
  if (bookmarks.length > 3 && process.env.ANTHROPIC_API_KEY) {
    try {
      const client = new Anthropic();
      const list = bookmarks.map((b, i) =>
        `${i + 1}. [${b.folder ?? "미분류"}] ${b.title ?? "제목 없음"} — ${b.intent || b.summary || ""}`
      ).join("\n");

      const msg = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 50,
        messages: [{
          role: "user",
          content: `다음 저장된 링크 중 오늘 읽기 좋은 3개를 골라 번호만 쉼표로 응답해줘 (예: 1,4,7).\n\n${list}`,
        }],
      });

      const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
      const indices = text.split(",").map((n) => parseInt(n.trim()) - 1).filter((n) => n >= 0 && n < bookmarks.length);
      if (indices.length >= 3) picks = indices.slice(0, 3).map((i) => bookmarks[i]);
    } catch { /* AI 실패 시 상위 3개 사용 */ }
  }

  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", user.id);

  if (!subs?.length) return NextResponse.json({ message: "No subscriptions" });

  const first = picks[0];
  const payload = JSON.stringify({
    title: "📚 오늘의 추천 링크",
    body: `${first.title ?? "링크"} 외 ${picks.length - 1}개`,
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

  return NextResponse.json({ picks: picks.map((p) => p.title) });
}
