"use client";

import { useEffect, useState, useRef } from "react";
import { X, ExternalLink, Archive, ArchiveX, Check, Sparkles, Clock, X as XIcon } from "lucide-react";
import { Bookmark } from "@/lib/types";
import { usePush } from "@/lib/usePush";
import Toast from "./Toast";

interface Props {
  bookmark: Bookmark | null;
  onClose: () => void;
  onReadToggle: (id: string, is_read: boolean) => void;
  onTagClick: (tag: string) => void;
  onMemoUpdate?: (id: string, memo: string) => void;
  onReminderSet?: (id: string, remind_at: string | null) => void;
  onArchive?: (bookmark: Bookmark) => void;
  folders?: string[];
  onFolderMove?: (id: string, folder: string) => void;
}

const REMINDER_OPTIONS = [
  { label: "1시간 후",    key: "1h"       },
  { label: "오늘 저녁 9시", key: "tonight"  },
  { label: "내일 아침 9시", key: "tomorrow" },
  { label: "1주일 후",   key: "week"      },
] as const;

function getReminderDate(key: string): Date {
  const d = new Date();
  if (key === "1h") { d.setHours(d.getHours() + 1); }
  else if (key === "tonight") {
    d.setHours(21, 0, 0, 0);
    if (d <= new Date()) d.setDate(d.getDate() + 1);
  }
  else if (key === "tomorrow") { d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); }
  else if (key === "week")     { d.setDate(d.getDate() + 7); d.setHours(9, 0, 0, 0); }
  return d;
}

export default function ReadingPanel({
  bookmark, onClose, onReadToggle, onTagClick, onMemoUpdate, onReminderSet, onArchive, folders, onFolderMove,
}: Props) {
  /* ── 애니메이션 상태 ── */
  const [displayBookmark, setDisplayBookmark] = useState<Bookmark | null>(null);
  const [panelVisible, setPanelVisible] = useState(false);

  useEffect(() => {
    if (bookmark) {
      setDisplayBookmark(bookmark);
      // 두 번의 RAF로 CSS 트랜지션이 확실히 트리거되도록
      const raf = requestAnimationFrame(() =>
        requestAnimationFrame(() => setPanelVisible(true))
      );
      return () => cancelAnimationFrame(raf);
    } else {
      setPanelVisible(false);
      const t = setTimeout(() => setDisplayBookmark(null), 320);
      return () => clearTimeout(t);
    }
  }, [bookmark]);

  /* ── 로컬 상태 ── */
  const [memoText, setMemoText]       = useState("");
  const [memoEditing, setMemoEditing] = useState(false);
  const [memoSaving, setMemoSaving]   = useState(false);
  const [remindAt, setRemindAt]       = useState<string | null>(null);
  const [reminderSaving, setReminderSaving] = useState(false);
  const [toast, setToast]             = useState<string | null>(null);
  const [expanded, setExpanded]       = useState(false);
  const [folderMoving, setFolderMoving] = useState(false);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const contentRef     = useRef<HTMLDivElement>(null);
  const dragStartY     = useRef(0);   // 핸들용
  const dragContentY   = useRef(0);   // 콘텐츠 스와이프용
  const push = usePush();

  // bookmark가 바뀔 때마다 상태 초기화
  useEffect(() => {
    setMemoText(bookmark?.memo ?? "");
    setMemoEditing(false);
    setRemindAt(bookmark?.remind_at ?? null);
    setExpanded(false);
  }, [bookmark?.id]);

  useEffect(() => {
    if (memoEditing) textareaRef.current?.focus();
  }, [memoEditing]);

  // body 스크롤 잠금
  useEffect(() => {
    document.body.style.overflow = displayBookmark ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [displayBookmark]);

  // Escape 키
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);


  if (!displayBookmark) return null;
  const bm = displayBookmark; // 타입 단언 편의

  /* ── 액션 ── */
  async function handleReadToggle() {
    const next = !bm.is_read;
    await fetch(`/api/bookmarks/${bm.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_read: next }),
    });
    onReadToggle(bm.id, next);
    if (next) onClose();
  }

  async function handleMemoSave() {
    setMemoSaving(true);
    await fetch(`/api/bookmarks/${bm.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memo: memoText }),
    });
    onMemoUpdate?.(bm.id, memoText);
    setMemoSaving(false);
    setMemoEditing(false);
    setToast("✓ 메모가 저장됐어요");
  }

  async function handleFolderMove(folder: string) {
    setFolderMoving(true);
    await fetch(`/api/bookmarks/${bm.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder }),
    });
    onFolderMove?.(bm.id, folder);
    setFolderMoving(false);
    setToast(`📁 ${folder}로 이동했어요`);
  }

  async function handleReminderSet(key: string | null) {
    setReminderSaving(true);
    const remind_at = key ? getReminderDate(key).toISOString() : null;
    await fetch(`/api/bookmarks/${bm.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remind_at }),
    });
    setRemindAt(remind_at);
    onReminderSet?.(bm.id, remind_at);
    setReminderSaving(false);
    setToast(remind_at ? "🔔 리마인더가 설정됐어요" : "리마인더가 취소됐어요");
  }

  /* ── 핸들 드래그 (React 이벤트로 충분) ── */
  function onHandleTouchStart(e: React.TouchEvent) {
    dragStartY.current = e.touches[0].clientY;
  }
  function onHandleTouchEnd(e: React.TouchEvent) {
    const dy = dragStartY.current - e.changedTouches[0].clientY;
    if (dy > 40) setExpanded(true);
    else if (dy < -40) {
      if (expanded) setExpanded(false);
      else onClose();
    }
  }

  function formatRemindAt(iso: string) {
    return new Date(iso).toLocaleDateString("ko-KR", {
      month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  }

  const memoChanged = memoText !== (bm.memo ?? "");

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          panelVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Panel — mobile: bottom sheet / desktop: right side panel */}
      <div
        className={`fixed z-50 flex flex-col bg-white shadow-2xl overflow-hidden transition-all duration-300 ease-out
          /* mobile */
          inset-x-0 bottom-0
          ${expanded ? "h-[100dvh] rounded-none" : "h-[88svh] rounded-t-3xl"}
          ${panelVisible ? "translate-y-0" : "translate-y-full"}
          /* desktop */
          md:inset-x-auto md:inset-y-0 md:right-0 md:w-[480px] md:h-full md:rounded-none md:rounded-l-3xl
          ${panelVisible ? "md:translate-x-0" : "md:translate-x-full"}
          md:translate-y-0
        `}
      >
        {/* Handle — 모바일 드래그용 (PC에서 숨김) */}
        <div
          className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0 touch-none select-none"
          onTouchStart={onHandleTouchStart}
          onTouchEnd={onHandleTouchEnd}
        >
          <div className={`h-1 rounded-full transition-all duration-200 ${expanded ? "w-6 bg-gray-100" : "w-10 bg-gray-200"}`} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {bm.favicon_url && (
              <img
                src={bm.favicon_url} alt=""
                className="w-5 h-5 rounded flex-shrink-0"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
            <span className="text-xs text-gray-400 truncate">{bm.domain}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:scale-90 transition flex-shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content — scrollable */}
        <div
          ref={contentRef}
          className={`flex-1 px-5 py-4 space-y-4 md:overflow-y-auto ${expanded ? "overflow-y-auto" : "overflow-hidden"}`}
          onTouchStart={(e) => { dragContentY.current = e.touches[0].clientY; }}
          onTouchEnd={(e) => {
            const dy = dragContentY.current - e.changedTouches[0].clientY;
            if (!expanded && dy > 30) setExpanded(true);
            if (expanded && (contentRef.current?.scrollTop ?? 0) === 0 && dy < -30) setExpanded(false);
          }}
        >
          {/* 이미지 전용 */}
          {bm.og_image === bm.url ? (
            <div className="rounded-2xl overflow-hidden bg-gray-100">
              <img src={bm.url} alt={bm.title || ""}
                className="w-full object-contain max-h-[50vh]" />
            </div>
          ) : (
            <>
              {bm.og_image && (
                <div className="rounded-2xl overflow-hidden aspect-[2/1] bg-gray-100">
                  <img src={bm.og_image} alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")} />
                </div>
              )}
              <h1 className="font-bold text-lg leading-snug text-gray-900">
                {bm.title || bm.url}
              </h1>

              {bm.intent && (
                <div className="flex items-start gap-2 bg-indigo-600 rounded-2xl px-4 py-3">
                  <span className="text-lg flex-shrink-0">💡</span>
                  <p className="text-sm text-white leading-relaxed font-medium">{bm.intent}</p>
                </div>
              )}

              {bm.summary ? (
                <div className="bg-indigo-50 rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-100/60 border-b border-indigo-100">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <p className="text-xs font-semibold text-indigo-500">AI 요약</p>
                  </div>
                  <p className="text-sm text-indigo-900 leading-relaxed px-4 py-3">{bm.summary}</p>
                </div>
              ) : bm.description ? (
                <p className="text-sm text-gray-600 leading-relaxed">{bm.description}</p>
              ) : null}
            </>
          )}

          {/* Tags */}
          {(bm.tags ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {bm.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => { onTagClick(tag); onClose(); }}
                  className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium
                    hover:bg-indigo-100 hover:text-indigo-700 active:scale-95 transition"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}

          {/* 폴더 이동 */}
          {folders && folders.length > 1 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400 flex-shrink-0">폴더</span>
              {folders.map((f) => (
                <button
                  key={f}
                  onClick={() => handleFolderMove(f)}
                  disabled={folderMoving || (bm.folder ?? "미분류") === f}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition active:scale-95 disabled:cursor-default ${
                    (bm.folder ?? "미분류") === f
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-40"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}

          {/* 내 메모 */}
          <div className="rounded-2xl border border-amber-100 overflow-hidden">
            {memoEditing && (
              <div className="flex items-center justify-end gap-2 px-4 py-2 bg-amber-50 border-b border-amber-100">
                <button
                  onClick={() => { setMemoText(bm.memo ?? ""); setMemoEditing(false); }}
                  className="text-xs text-gray-400 hover:text-gray-600 transition"
                >취소</button>
                <button
                  onClick={handleMemoSave}
                  disabled={memoSaving || !memoChanged}
                  className="flex items-center gap-1 text-xs text-white bg-indigo-600 hover:bg-indigo-700
                    disabled:opacity-40 px-2.5 py-1 rounded-lg active:scale-95 transition"
                >
                  <Check className="w-3 h-3" />
                  {memoSaving ? "저장 중..." : "저장"}
                </button>
              </div>
            )}
            <div
              className="px-4 py-3 bg-amber-50/40 cursor-text"
              onClick={() => !memoEditing && setMemoEditing(true)}
            >
              {memoEditing ? (
                <textarea
                  ref={textareaRef}
                  value={memoText}
                  onChange={(e) => setMemoText(e.target.value)}
                  placeholder="읽고 나서 떠오른 생각이나 메모를 남겨보세요"
                  rows={3}
                  className="w-full text-sm text-amber-900 bg-transparent resize-none focus:outline-none
                    placeholder:text-amber-200 leading-relaxed"
                />
              ) : memoText ? (
                <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{memoText}</p>
              ) : (
                <p className="text-sm text-amber-300">여기를 눌러 메모를 남겨보세요</p>
              )}
            </div>
          </div>

          {/* 리마인더 */}
          <div className="rounded-2xl bg-blue-50/60 border border-blue-100 px-4 py-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-semibold text-blue-600">리마인더</span>
              </div>
              {remindAt ? (
                <>
                  <span className="text-xs text-blue-700 flex-1">🔔 {formatRemindAt(remindAt)}</span>
                  <button
                    onClick={() => handleReminderSet(null)}
                    disabled={reminderSaving}
                    className="flex items-center gap-0.5 text-xs text-blue-300 hover:text-red-400 active:scale-95 transition flex-shrink-0"
                  >
                    <XIcon className="w-3 h-3" /> 취소
                  </button>
                </>
              ) : (
                <>
                  {REMINDER_OPTIONS.map(({ label, key }) => (
                    <button
                      key={key}
                      onClick={() => handleReminderSet(key)}
                      disabled={reminderSaving || !push.subscribed}
                      className="px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-blue-200
                        text-blue-600 hover:bg-blue-100 active:scale-95 transition disabled:opacity-40"
                    >
                      {label}
                    </button>
                  ))}
                  {!push.subscribed && (
                    <span className="text-xs text-gray-400">알림을 먼저 켜주세요</span>
                  )}
                </>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-400 pb-2">
            {new Date(bm.created_at).toLocaleDateString("ko-KR", {
              year: "numeric", month: "long", day: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </p>
        </div>

        {/* 페이드 힌트 — 모바일 미확장 시만 표시 */}
        {!expanded && (
          <div className="md:hidden pointer-events-none flex-shrink-0 h-10 -mt-10
            bg-gradient-to-t from-white to-transparent" />
        )}

        {/* Footer CTA */}
        <div className="px-5 py-4 border-t border-gray-100 bg-white flex gap-3 flex-shrink-0">
          <a
            href={bm.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2
              bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-[0.97] transition"
          >
            <ExternalLink className="w-4 h-4" />
            원문보기
          </a>
          <button
            onClick={() => {
              if (!bm.is_read && onArchive) onArchive(bm);
              else handleReadToggle();
            }}
            className={`flex-1 py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2
              active:scale-[0.97] transition ${
              bm.is_read
                ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {bm.is_read
              ? <><ArchiveX className="w-4 h-4" /> 보관 취소</>
              : <><Archive className="w-4 h-4" /> 보관</>
            }
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </>
  );
}
