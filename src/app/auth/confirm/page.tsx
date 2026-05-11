"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Link2 } from "lucide-react";

export default function AuthConfirmPage() {
  const [status, setStatus] = useState<"loading" | "error">("loading");

  useEffect(() => {
    // URL 해시의 access_token을 Supabase가 자동으로 세션으로 처리
    const supabase = createClient();

    supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        window.location.href = "/";
      }
    });

    // 이미 세션이 있을 수도 있으니 체크
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        window.location.href = "/";
      } else {
        // 해시 토큰이 처리될 시간을 줌
        setTimeout(() => {
          supabase.auth.getSession().then(({ data }) => {
            if (data.session) window.location.href = "/";
            else setStatus("error");
          });
        }, 2000);
      }
    });
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
