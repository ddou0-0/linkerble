"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Link2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "kakao" | null>(null);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

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
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) setError(error.message);
    else setSent(true);
    setLoading(false);
  }

  async function handleSocial(provider: "google" | "kakao") {
    setSocialLoading(provider);
    const { error } = await createClient().auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setSocialLoading(null);
    }
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

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-4">
          {sent ? (
            /* 전송 완료 화면 */
            <div className="text-center space-y-3 py-4">
              <div className="text-4xl">📬</div>
              <h2 className="font-bold text-gray-900">메일을 확인해주세요</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                <span className="font-medium text-gray-700">{email}</span>으로<br />
                로그인 링크를 보냈어요.<br />
                링크를 클릭하면 바로 시작할 수 있어요!
              </p>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="text-xs text-indigo-500 hover:underline mt-2"
              >
                다른 이메일로 시도하기
              </button>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-xl font-bold mb-1">시작하기</h1>
                <p className="text-sm text-gray-400">이메일로 링크를 받아 바로 로그인해요</p>
              </div>

              {/* 소셜 로그인 */}
              <div className="space-y-2.5">
                <button
                  onClick={() => handleSocial("google")}
                  disabled={!!socialLoading || loading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                >
                  {socialLoading === "google" ? (
                    <span className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  ) : (
                    <GoogleIcon />
                  )}
                  Google로 계속하기
                </button>

                <button
                  onClick={() => handleSocial("kakao")}
                  disabled={!!socialLoading || loading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-[#FEE500] text-sm font-medium text-[#191919] hover:bg-[#f5dc00] transition disabled:opacity-50"
                >
                  {socialLoading === "kakao" ? (
                    <span className="w-5 h-5 border-2 border-yellow-600/30 border-t-yellow-900 rounded-full animate-spin" />
                  ) : (
                    <KakaoIcon />
                  )}
                  카카오로 계속하기
                </button>
              </div>

              {/* 구분선 */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">또는</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* 이메일 매직링크 */}
              <form onSubmit={handleMagicLink} className="space-y-2.5">
                <input
                  type="email"
                  placeholder="이메일 주소"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                {error && <p className="text-xs text-red-500">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || !!socialLoading}
                  className="w-full py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {loading ? "전송 중..." : "이메일로 링크 받기"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
    </svg>
  );
}

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#191919" d="M9 1.5C4.582 1.5 1 4.332 1 7.818c0 2.178 1.37 4.09 3.444 5.21l-.877 3.224c-.077.284.21.514.46.357l3.71-2.45A9.84 9.84 0 0 0 9 14.136c4.418 0 8-2.832 8-6.318C17 4.332 13.418 1.5 9 1.5z"/>
    </svg>
  );
}
