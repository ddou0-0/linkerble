"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, ArrowLeft, RefreshCw, Bookmark, Smartphone, Bell, BellOff, Sparkles, CalendarClock, Hash } from "lucide-react";
import Link from "next/link";
import { usePush } from "@/lib/usePush";

export default function SettingsPage() {
  const push = usePush();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [dailySending, setDailySending] = useState(false);
  const [dailyResult, setDailyResult] = useState("");
  const [countSending, setCountSending] = useState(false);
  const [countResult, setCountResult] = useState("");
  const [reminders, setReminders] = useState<{ id: string; title: string | null; remind_at: string }[]>([]);
  const [remindersLoading, setRemindersLoading] = useState(false);
  const [bookmarkletCopied, setBookmarkletCopied] = useState(false);
  const [shortcutCopied, setShortcutCopied] = useState(false);

  useEffect(() => { loadToken(); loadReminders(); }, []);

  async function loadReminders() {
    setRemindersLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("bookmarks")
      .select("id, title, remind_at")
      .eq("user_id", user.id)
      .not("remind_at", "is", null)
      .gte("remind_at", new Date().toISOString())
      .order("remind_at", { ascending: true });
    setReminders((data ?? []) as { id: string; title: string | null; remind_at: string }[]);
    setRemindersLoading(false);
  }

  async function cancelReminder(id: string) {
    await fetch(`/api/bookmarks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remind_at: null }),
    });
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }

  async function loadToken() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/login"; return; }

    const { data } = await supabase
      .from("user_settings")
      .select("share_token")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setToken(data.share_token);
    } else {
      const { data: created } = await supabase
        .from("user_settings")
        .insert({ user_id: user.id })
        .select("share_token")
        .single();
      if (created) setToken(created.share_token);
    }
    setLoading(false);
  }

  async function regenerateToken() {
    if (!confirm("재발급하면 기존 북마클릿·단축어가 동작하지 않아요. 계속할까요?")) return;
    setRegenerating(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const newToken = crypto.randomUUID();
    await supabase.from("user_settings").update({ share_token: newToken }).eq("user_id", user.id);
    setToken(newToken);
    setRegenerating(false);
  }

  const base = typeof window !== "undefined" ? window.location.origin : "";
  const bookmarklet = `javascript:(function(){fetch('${base}/api/share?url='+encodeURIComponent(location.href)+'&token=${token}').then(r=>r.json()).then(d=>alert(d.message==='Saved'?'✅ Linkerble에 저장됐어요!':d.message==='Already saved'?'이미 저장된 링크예요.':'❌ 저장 실패'));})()`;

  function copyBookmarklet() {
    navigator.clipboard.writeText(bookmarklet);
    setBookmarkletCopied(true);
    setTimeout(() => setBookmarkletCopied(false), 2000);
  }

  function copyShortcutUrl() {
    navigator.clipboard.writeText(`${base}/api/share?url=SHARED_URL&token=${token}`);
    setShortcutCopied(true);
    setTimeout(() => setShortcutCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="p-1.5 rounded-lg hover:bg-gray-100 transition">
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </Link>
          <span className="font-bold text-sm">설정</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* 방법 1 — 북마클릿 */}
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <Bookmark className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">
                Safari 북마클릿
                <span className="ml-2 text-xs font-normal text-indigo-500">추천 · 가장 쉬움</span>
              </h2>
              <p className="text-xs text-gray-400">북마크 하나 저장하면 끝 — 어떤 페이지든 탭 하나로 저장</p>
            </div>
          </div>

          <div className="px-5 py-4 space-y-4">
            <ol className="space-y-2.5">
              {[
                { step: "아래 버튼으로 코드 복사" },
                { step: "Safari에서 아무 페이지나 Cmd+D (Mac) 또는 공유→북마크 추가 (iPhone)로 북마크 저장. 이름은 'Linkerble'로" },
                { step: "Mac: 북마크 편집 → Linkerble 찾아 URL 칸에 붙여넣기\niPhone: 북마크 탭(📖) → Linkerble 길게 탭 → 편집 → URL 칸에 붙여넣기" },
                { step: "⚠️ 주소창(검색창)에 직접 붙여넣으면 안 돼요 — 반드시 북마크 URL 편집 화면에서!" },
                { step: "이제 어느 페이지에서든 북마크 바에서 Linkerble 탭하면 저장 완료!" },
              ].map(({ step }, i) => (
                <li key={i} className={`flex items-start gap-2.5 text-xs list-none ${i === 3 ? "text-amber-600 font-medium" : "text-gray-600"}`}>
                  {i === 3
                    ? <span className="flex-shrink-0 text-amber-500 mt-0.5">⚠️</span>
                    : <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center mt-0.5" style={{ fontSize: 10 }}>{i + 1}</span>
                  }
                  <span className="whitespace-pre-line leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>

            <button
              onClick={copyBookmarklet}
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {bookmarkletCopied
                ? <><Check className="w-4 h-4" /> 복사됐어요!</>
                : "북마클릿 코드 복사"}
            </button>
          </div>
        </section>

        {/* 방법 2 — iOS 단축어 */}
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">iOS 공유 시트 연결</h2>
              <p className="text-xs text-gray-400">카카오톡 등 어떤 앱에서도 공유 가능 · 설정 5분</p>
            </div>
          </div>

          <div className="px-5 py-4 space-y-4">
            <ol className="space-y-2.5">
              {[
                "iPhone 단축어 앱 열기 → 우상단 + 탭",
                "동작 추가 → 'URL' 검색 → 선택 후 아래 주소 붙여넣기",
                "동작 추가 → 'URL 내용 가져오기' 선택",
                "단축어 이름 'Linkerble 저장'으로 저장",
                "단축어 편집 → … → 공유 시트에 표시 켜기",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-gray-600 list-none">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-500 font-bold flex items-center justify-center mt-0.5" style={{ fontSize: 10 }}>
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>

            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
              <p className="text-xs font-medium text-gray-500">2번에서 붙여넣을 주소</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono text-gray-700 bg-white border border-gray-200 rounded-lg px-2.5 py-2 break-all leading-relaxed">
                  {loading ? "불러오는 중..." : `${base}/api/share?url=`}
                  {!loading && <span className="text-indigo-500 font-semibold">[단축어 입력]</span>}
                  {!loading && `&token=${token}`}
                </code>
                <button
                  onClick={copyShortcutUrl}
                  className="flex-shrink-0 px-2.5 py-2 rounded-lg border border-gray-200 hover:bg-white transition text-xs text-gray-500"
                >
                  {shortcutCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : "복사"}
                </button>
              </div>
              <p className="text-xs text-gray-400">URL 자리에 단축어의 '단축어 입력' 변수를 끌어다 놓아요</p>
            </div>

            <button
              onClick={regenerateToken}
              disabled={regenerating || loading}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition disabled:opacity-40"
            >
              <RefreshCw className={`w-3 h-3 ${regenerating ? "animate-spin" : ""}`} />
              연결 코드 재발급
            </button>
          </div>
        </section>

        {/* 푸시 알림 */}
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <Bell className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">읽기 알림</h2>
              <p className="text-xs text-gray-400">안 읽은 항목이 있을 때 알림으로 알려드려요</p>
            </div>
          </div>

          <div className="px-5 py-4 space-y-3">
            {!push.supported ? (
              <p className="text-xs text-gray-400">이 브라우저는 푸시 알림을 지원하지 않아요.</p>
            ) : (
              <>
                <p className="text-xs text-gray-600 leading-relaxed">
                  알림을 허용하면 안 읽은 링크가 남아있을 때 알려드려요.<br />
                  언제든 브라우저 설정에서 끌 수 있어요.
                </p>
                <button
                  onClick={push.subscribed ? push.unsubscribe : push.subscribe}
                  disabled={push.loading}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition disabled:opacity-40 flex items-center justify-center gap-2 ${
                    push.subscribed
                      ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      : "bg-amber-500 text-white hover:bg-amber-600"
                  }`}
                >
                  {push.subscribed
                    ? <><BellOff className="w-4 h-4" /> 알림 끄기</>
                    : <><Bell className="w-4 h-4" /> 알림 켜기</>
                  }
                </button>
                {push.subscribed && (
                  <p className="text-xs text-center text-green-600">✓ 알림이 활성화돼 있어요</p>
                )}
              </>
            )}
          </div>
        </section>

        {/* 하루 저장 현황 알림 */}
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Hash className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">오늘의 링커블 현황</h2>
              <p className="text-xs text-gray-400">하루 한 번, 오늘 저장한 링크 수를 알려드려요</p>
            </div>
          </div>
          <div className="px-5 py-4 space-y-3">
            <p className="text-xs text-gray-600 leading-relaxed">
              매일 저녁, 오늘 몇 개의 링크를 링커블에 담았는지 알림으로 확인할 수 있어요.
            </p>
            <button
              onClick={async () => {
                setCountSending(true);
                setCountResult("");
                const res = await fetch("/api/push/daily-count", { method: "POST" });
                const data = await res.json();
                setCountResult(data.count != null ? `오늘 ${data.count}개 저장됨 ✓` : data.message ?? "완료");
                setCountSending(false);
              }}
              disabled={countSending || !push.subscribed}
              className="w-full py-3 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Hash className="w-4 h-4" />
              {countSending ? "확인 중..." : "지금 현황 알림 받기"}
            </button>
            {!push.subscribed && <p className="text-xs text-center text-gray-400">알림을 먼저 켜주세요</p>}
            {countResult && <p className="text-xs text-center text-green-600">{countResult}</p>}
          </div>
        </section>

        {/* 예정된 리마인더 */}
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <CalendarClock className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">예정된 리마인더</h2>
              <p className="text-xs text-gray-400">각 글에서 설정한 알림 일정을 관리해요</p>
            </div>
          </div>
          <div className="px-5 py-4">
            {remindersLoading ? (
              <p className="text-xs text-gray-400">불러오는 중...</p>
            ) : reminders.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-2">예정된 리마인더가 없어요.<br/>글을 열어 리마인더를 설정해보세요.</p>
            ) : (
              <ul className="space-y-2">
                {reminders.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{r.title ?? "제목 없음"}</p>
                      <p className="text-xs text-indigo-500">
                        🔔 {new Date(r.remind_at).toLocaleDateString("ko-KR", {
                          month: "long", day: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => cancelReminder(r.id)}
                      className="flex-shrink-0 text-xs text-gray-400 hover:text-red-500 transition"
                    >
                      취소
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* 데일리 큐레이션 */}
        <section className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">오늘의 추천</h2>
              <p className="text-xs text-gray-400">AI가 지금 읽기 좋은 링크 3개를 골라서 알려드려요</p>
            </div>
          </div>
          <div className="px-5 py-4 space-y-3">
            <p className="text-xs text-gray-600 leading-relaxed">
              저장된 링크 중 오늘 업무에 참고할 만한 것들을 AI가 추려서 푸시로 보내드려요.<br />
              알림이 켜져 있어야 받을 수 있어요.
            </p>
            <button
              onClick={async () => {
                setDailySending(true);
                setDailyResult("");
                const res = await fetch("/api/push/daily", { method: "POST" });
                const data = await res.json();
                setDailyResult(data.picks ? `추천 완료: ${data.picks.join(", ")}` : data.message ?? "완료");
                setDailySending(false);
              }}
              disabled={dailySending || !push.subscribed}
              className="w-full py-3 rounded-xl bg-purple-500 text-white text-sm font-semibold hover:bg-purple-600 transition disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {dailySending ? "추천 중..." : "지금 추천 받기"}
            </button>
            {!push.subscribed && (
              <p className="text-xs text-center text-gray-400">알림을 먼저 켜주세요</p>
            )}
            {dailyResult && (
              <p className="text-xs text-center text-green-600">{dailyResult}</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
