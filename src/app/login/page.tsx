"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Link2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }: { data: { user: unknown } }) => {
      if (data.user) window.location.href = "/";
    });
  }, []);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });
    if (error) {
      const msg = error.message;
      const match = msg.match(/after (\d+) seconds/);
      if (match) {
        const secs = parseInt(match[1]);
        setCooldown(secs);
        const timer = setInterval(() => {
          setCooldown((prev) => {
            if (prev <= 1) { clearInterval(timer); return 0; }
            return prev - 1;
          });
        }, 1000);
      } else if (msg.includes("rate limit") || msg.includes("rate_limit")) {
        setError("이메일 전송 횟수를 초과했어요. 잠시 후 다시 시도해주세요.");
      } else if (msg.includes("invalid email") || msg.includes("valid email")) {
        setError("올바른 이메일 주소를 입력해주세요.");
      } else {
        console.error("[login] signInWithOtp error:", msg);
        setError(`오류가 발생했어요. 잠시 후 다시 시도해주세요. (${msg})`);
      }
    } else setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Link2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">Linkerble</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {sent ? (
            <div className="text-center space-y-4 py-4">
              <div className="text-4xl">📬</div>
              <div>
                <h2 className="font-bold text-gray-900 mb-1">메일을 확인해주세요</h2>
                <p className="text-sm text-gray-500 leading-relaxed">
                  <span className="font-medium text-gray-700">{email}</span>으로<br />
                  로그인 링크를 보냈어요.
                </p>
              </div>
              <a
                href={
                  email.endsWith("@gmail.com") ? "https://mail.google.com" :
                  email.endsWith("@naver.com") ? "https://mail.naver.com" :
                  email.endsWith("@kakao.com") || email.endsWith("@daum.net") ? "https://mail.kakao.com" :
                  email.endsWith("@hanmail.net") ? "https://mail.daum.net" :
                  email.endsWith("@outlook.com") || email.endsWith("@hotmail.com") ? "https://outlook.live.com" :
                  email.endsWith("@yahoo.com") ? "https://mail.yahoo.com" :
                  `mailto:${email}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
              >
                <span>📩</span> 메일함 열기
              </a>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="text-xs text-gray-400 hover:text-gray-500 transition"
              >
                다른 이메일로 시도하기
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h1 className="text-xl font-bold mb-1">시작하기</h1>
                <p className="text-sm text-gray-400">이메일로 링크를 받아 바로 로그인해요</p>
              </div>
              <form onSubmit={handleMagicLink} className="space-y-2.5">
                <input
                  type="email"
                  placeholder="이메일 주소"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {error && <p className="text-xs text-red-500">{error}</p>}
                {cooldown > 0 && (
                  <p className="text-xs text-amber-500 text-center">
                    {cooldown}초 후에 다시 시도할 수 있어요
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading || cooldown > 0}
                  className="w-full py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {loading ? "전송 중..." : cooldown > 0 ? `${cooldown}초 대기 중...` : "로그인 링크 받기"}
                </button>
              </form>
            </div>
          )}
        </div>
        <p className="mt-5 text-center text-[11px] text-gray-300">
          <Link href="/intro" className="hover:text-gray-400 transition">
            서비스 소개 보기
          </Link>
        </p>
      </div>
    </div>
  );
}
