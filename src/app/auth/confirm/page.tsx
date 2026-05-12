"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Link2 } from "lucide-react";

export default function AuthConfirmPage() {
  const [status, setStatus] = useState<"loading" | "error">("loading");

  useEffect(() => {
    // 싱글턴 재사용 방지 — 매번 새 인스턴스로 해시 토큰 재처리
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // SIGNED_IN 이벤트 수신 → 바로 홈으로
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        window.location.href = "/";
      }
    });

    // 이미 세션이 있는 경우 (재방문 등)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.href = "/";
    });

    // 6초 안에 세션이 잡히지 않으면 에러
    const timer = setTimeout(() => setStatus("error"), 6000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
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
            <p className="text-sm text-red-500">링크가 만료됐거나 올바르지 않아요.</p>
            <a href="/login" className="text-sm text-indigo-600 font-medium hover:underline">
              다시 로그인하기
            </a>
          </>
        )}
      </div>
    </div>
  );
}
