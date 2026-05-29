"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AddBookmarkForm from "@/components/AddBookmarkForm";
import { Bookmark } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

function ShareHandler() {
  const params = useSearchParams();
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [done, setDone] = useState(false);

  // url 파라미터 → text 파라미터 순으로 URL 추출
  const rawUrl = params.get("url") || params.get("text") || params.get("title") || "";
  // text 안에 URL이 섞여 있을 수 있으므로 정규식으로 추출
  const urlMatch = rawUrl.match(/https?:\/\/[^\s<>"{}|\\^`[\]]+/i);
  const sharedUrl = urlMatch ? urlMatch[0] : rawUrl;

  useEffect(() => {
    createClient().auth.getUser().then(({ data }: { data: { user: { email?: string } | null } }) => {
      if (!data.user) {
        // 로그인 후 다시 돌아오도록 redirect_to 포함
        const returnTo = encodeURIComponent(`/share?url=${encodeURIComponent(sharedUrl)}`);
        router.replace(`/login?next=${returnTo}`);
      } else {
        setAuthed(true);
      }
    });
  }, []);

  function handleAdded(_bookmark: Bookmark) {
    setDone(true);
    setTimeout(() => router.replace("/"), 1200);
  }

  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-2xl">✅</div>
        <p className="font-semibold text-gray-700">저장됐어요!</p>
        <p className="text-xs text-gray-400">잠시 후 홈으로 이동합니다</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-sm">Linkerble</span>
        <button
          onClick={() => router.replace("/")}
          className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition"
        >
          취소
        </button>
      </header>

      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-gray-700">공유된 링크 저장</p>
          {sharedUrl && (
            <p className="text-xs text-indigo-500 break-all bg-indigo-50 rounded-xl px-3 py-2">{sharedUrl}</p>
          )}
        </div>
        <AddBookmarkForm onAdded={handleAdded} initialUrl={sharedUrl} />
      </div>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense>
      <ShareHandler />
    </Suspense>
  );
}
