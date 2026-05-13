"use client";

import { useState, useRef } from "react";
import { Plus, Loader2, Pencil, Link2, X } from "lucide-react";
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

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`[\]]+/i;

function extractUrl(text: string): string | null {
  const match = text.match(URL_REGEX);
  return match ? match[0] : null;
}

export default function AddBookmarkForm({ onAdded }: Props) {
  const [text, setText] = useState("");
  const [selectedIntent, setSelectedIntent] = useState("");
  const [customMemo, setCustomMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const detectedUrl = extractUrl(text);
  const isCustom = selectedIntent === "__custom__";
  const intentMemo = isCustom ? customMemo.trim() : selectedIntent;
  const showIntents = !!detectedUrl && !loading;

  // 텍스트에서 URL 제거한 순수 컨텍스트 (저장 이유 자동 추출용)
  const contextText = text.replace(URL_REGEX, "").replace(/\s+/g, " ").trim();

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    setError("");
    // 높이 자동 조절
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  function handleClear() {
    setText("");
    setSelectedIntent("");
    setCustomMemo("");
    setError("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!detectedUrl) return;

    setLoading(true);
    setError("");

    // 저장 이유: 직접 입력 > 칩 선택 > 원문 컨텍스트 텍스트
    const memo = intentMemo || contextText || undefined;

    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: detectedUrl, memo }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "저장에 실패했어요.");
      } else {
        onAdded(data);
        setText("");
        setSelectedIntent("");
        setCustomMemo("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
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
        {/* 텍스트 입력 */}
        <div className="flex gap-2 p-3 items-start">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder="URL 또는 카카오톡 내용을 붙여넣으세요"
              value={text}
              onChange={handleChange}
              disabled={loading}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white
                transition disabled:opacity-50 resize-none overflow-hidden leading-relaxed"
            />
            {text && !loading && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2 top-2.5 p-0.5 rounded-full text-gray-300 hover:text-gray-500 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !detectedUrl}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white flex items-center gap-1.5
              text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-40 whitespace-nowrap flex-shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {loading ? "저장 중..." : "저장"}
          </button>
        </div>

        {/* URL 감지 칩 */}
        {text && (
          <div className="px-3 pb-2 -mt-1">
            {detectedUrl ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-50 w-fit max-w-full">
                <Link2 className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                <span className="text-xs text-indigo-600 truncate">{detectedUrl}</span>
              </div>
            ) : (
              <p className="text-xs text-amber-500">URL이 포함된 텍스트를 붙여넣어 주세요</p>
            )}
          </div>
        )}

        {/* 저장 이유 칩 */}
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
                placeholder={"예) OO님이 추천&#10;예) JAMS 2.0 버튼 작업 참고용"}
                rows={2}
                autoFocus
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white
                  transition resize-none placeholder:text-gray-300"
              />
            )}
          </div>
        )}
      </form>

      {error && <p className="px-4 pb-3 text-xs text-red-500">{error}</p>}
    </div>
  );
}
