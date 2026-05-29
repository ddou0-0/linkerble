"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

function ShareHandler() {
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const url = params.get("url") || params.get("text") || "";
    if (url) {
      router.replace(`/?shared=${encodeURIComponent(url)}`);
    } else {
      router.replace("/");
    }
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-2">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500">링크 저장 중...</p>
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
