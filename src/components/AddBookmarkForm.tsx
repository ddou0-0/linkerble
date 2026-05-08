"use client";

import { useState } from "react";
import { Plus, Loader2, Pencil } from "lucide-react";
import { Bookmark } from "@/lib/types";

interface Props {
  onAdded: (bookmark: Bookmark) => void;
}

const QUICK_INTENTS = [
  { label: "나중에 읽으려고", value: "나중에 읽으려고 저장" },
  { label: "레퍼런스", value: "업무 레퍼런스로 저장" },
  { label: "팀 공유", value: "팀원과 공유하려고 저장" },
  { label: "직접 입력", value: "__custom__" },
];

export default function AddBookmarkForm({ onAdded }: Props) {
  const [url, setUrl] = useState("");
  const [selectedIntent, setSelectedIntent] = useState("");
  const [customMemo, setCustomMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isCustom = selectedIntent === "__custom__";
  const memo = isCustom ? customMemo.trim() : selectedIntent;
  const showIntents = url.trim().length > 0 && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), memo: memo || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "저장에 실패했어요.");
      } else {
        onAdded(data);
        setUrl("");
        setSelectedIntent("");
        setCustomMemo("");
      }
    } catch {
      setError("네트워크 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <form onSubmit={handleSubmit}>
        {/* URL 입력 */}
        <div className="flex gap-2 p-3">
          <input
            type="url"
            placeholder="저장할 URL을 붙여넣으세요"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(""); }}
            disabled={loading}
            className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white flex items-center gap-1.5 text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-40 whitespace-nowrap"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {loading ? "분석 중..." : "저장"}
          </button>
        </div>

        {/* 저장 이유 칩 — URL 입력하면 바로 등장 */}
        {showIntents && (
          <div className="px-3 pb-3 space-y-2 border-t border-gray-100 pt-2.5">
            <p className="text-xs text-gray-400">저장 이유 <span className="text-gray-300">(선택)</span></p>
            <div className="flex flex-wrap gap-2">
              {QUICK_INTENTS.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setSelectedIntent(selectedIntent === value ? "" : value);
                    if (value !== "__custom__") setCustomMemo("");
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                    selectedIntent === value
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                  }`}
                >
                  {value === "__custom__" && <Pencil className="w-3 h-3" />}
                  {label}
                </button>
              ))}
            </div>

            {isCustom && (
              <textarea
                value={customMemo}
                onChange={(e) => setCustomMemo(e.target.value)}
                placeholder={"예) OO님이 추천&#10;예) JAMS 2.0 버튼 작업 참고용&#10;예) 카카오 대화 붙여넣기"}
                rows={3}
                autoFocus
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition resize-none placeholder:text-gray-300"
              />
            )}
          </div>
        )}
      </form>

      {error && <p className="px-4 pb-3 text-xs text-red-500">{error}</p>}
    </div>
  );
}
