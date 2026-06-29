"use client";

import { useState, useRef } from "react";
import { Plus, Loader2, Pencil, X } from "lucide-react";
import { Bookmark } from "@/lib/types";

interface Props {
  onAdded: (bookmark: Bookmark) => void;
  compact?: boolean;
  flat?: boolean;
  className?: string;
  initialUrl?: string;
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

export default function AddBookmarkForm({ onAdded, compact = false, flat = false, className, initialUrl }: Props) {
  const [text, setText] = useState(initialUrl ?? "");
  const [selectedIntent, setSelectedIntent] = useState("");
  const [customMemo, setCustomMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const detectedUrl = extractUrl(text);
  const isCustom = selectedIntent === "__custom__";
  const intentMemo = isCustom ? customMemo.trim() : selectedIntent;
  const showIntents = !!detectedUrl && !loading;

  const contextText = text.replace(URL_REGEX, "").replace(/\s+/g, " ").trim();

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value);
    setError("");
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

  if (flat) {
    return (
      <div className={className}>
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder="URL 붙여넣기..."
                value={text}
                onChange={handleChange}
                disabled={loading}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white
                  transition disabled:opacity-50 resize-none overflow-hidden leading-relaxed"
              />
              {text && !loading && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition"
                >
                  <X className="w-4 h-4" />
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
              저장
            </button>
          </div>

          {/* 저장 이유 칩 — 입력 바 아래 드롭다운 */}
          {showIntents && (
            <div className="mt-2 bg-white rounded-xl border border-gray-200 shadow-md px-3 py-3 space-y-2">
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
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 overflow-hidden${className ? ` ${className}` : ""}`}>
      <form onSubmit={handleSubmit}>
        <div className="flex gap-2 items-start p-3">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder={compact ? "URL 붙여넣기..." : "URL 또는 카카오톡 내용을 붙여넣으세요"}
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
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition"
              >
                <X className="w-4 h-4" />
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
