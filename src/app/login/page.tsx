"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Link2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
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
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {loading ? "전송 중..." : "로그인 링크 받기"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
