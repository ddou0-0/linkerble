"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Link2 } from "lucide-react";

export default function AuthConfirmPage() {
  const [status, setStatus] = useState<"loading" | "error">("loading");

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    async function handleAuth() {
      // 1) PKCE 방식: URL 쿼리에 token_hash + type이 있는 경우 (최신 Supabase 기본값)
      const params = new URLSearchParams(window.location.search);
      const token_hash = params.get("token_hash");
      const type = params.get("type");

      if (token_hash && type) {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as "email" | "magiclink" | "recovery" | "invite",
        });
        if (!error && data.session) {
          window.location.href = "/";
          return;
        }
        setStatus("error");
        return;
      }

      // 2) Implicit 방식: URL 해시에 access_token이 있는 경우 (구버전 호환)
      if (window.location.hash.includes("access_token")) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event, session) => {
            if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
              window.location.href = "/";
            }
          }
        );
        // 6초 안에 세션이 잡히지 않으면 에러
        setTimeout(() => {
          subscription.unsubscribe();
          setStatus("error");
        }, 6000);
        return;
      }

      // 3) 이미 세션이 있는 경우 (재방문)
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        window.location.href = "/";
        return;
      }

      // 파라미터가 없으면 바로 에러
      setStatus("error");
    }

    handleAuth();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm text-center space-y-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center mx-auto">
          <Link2 className="w-5 h-5 text-white" />
        </div>

        {status === "loading" ? (
          <>
            <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-500">로그인 중이에요...</p>
          </>
        ) : (
          <>
            <p className="text-sm text-red-500 font-medium">링크가 만료됐거나 올바르지 않아요.</p>
            <p className="text-xs text-gray-400">링크는 1회만 사용 가능하고 24시간 후 만료돼요.</p>
            <a
              href="/login"
              className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
            >
              다시 로그인하기
            </a>
          </>
        )}
      </div>
    </div>
  );
}
