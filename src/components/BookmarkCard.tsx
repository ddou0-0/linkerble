"use client";

import { useState } from "react";
import { Trash2, ExternalLink, Archive, ArchiveX, Folder } from "lucide-react";
import { Bookmark } from "@/lib/types";

interface Props {
  bookmark: Bookmark;
  onDelete: (id: string) => void;
  onTagClick: (tag: string) => void;
  onReadToggle: (id: string, is_read: boolean) => void;
  onOpen: (bookmark: Bookmark) => void;
  onArchive?: (bookmark: Bookmark) => void;
  query?: string;
}

function Highlight({ text, query }: { text: string; query?: string }) {
  if (!query?.trim()) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">{part}</mark>
        ) : part
      )}
    </>
  );
}

export default function BookmarkCard({ bookmark, onDelete, onTagClick, onReadToggle, onOpen, onArchive, query }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    if (!confirm("이 항목을 삭제할까요?")) return;
    setDeleting(true);
    await fetch(`/api/bookmarks/${bookmark.id}`, { method: "DELETE" });
    onDelete(bookmark.id);
  }

  async function handleReadToggle(e: React.MouseEvent) {
    setToggling(true);
    const next = !bookmark.is_read;
    await fetch(`/api/bookmarks/${bookmark.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_read: next }),
    });
    onReadToggle(bookmark.id, next);
    setToggling(false);
  }

  const saved = new Date(bookmark.created_at);
  const isToday = new Date().toDateString() === saved.toDateString();
  const date = isToday
    ? saved.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    : saved.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });

  const isImage = bookmark.og_image === bookmark.url;

  // 이미지 전용 카드
  if (isImage) {
    return (
      <article
        onClick={() => onOpen(bookmark)}
        className={`bg-white rounded-2xl border overflow-hidden cursor-pointer active:scale-[0.98] transition-all duration-150 ${
          bookmark.is_read ? "border-gray-100 hover:shadow-sm" : "border-gray-200 hover:shadow-md"
        }`}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
          <img src={bookmark.url} alt={bookmark.title || ""}
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.style.display = "none")} />
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!bookmark.is_read && onArchive) onArchive(bookmark);
              else handleReadToggle(e);
            }}
            disabled={toggling}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition disabled:opacity-40"
          >
            {bookmark.is_read ? <ArchiveX className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs text-gray-400 truncate">{bookmark.domain}</p>
            <p className="text-xs text-gray-500 truncate">{bookmark.title}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <a href={bookmark.url} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1 rounded-lg text-gray-300 hover:text-gray-500 transition">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button onClick={(e) => { e.stopPropagation(); handleDelete(e); }} disabled={deleting}
              className="p-1 rounded-lg text-gray-300 hover:text-red-500 transition disabled:opacity-40">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      onClick={() => onOpen(bookmark)}
      className={`bg-white rounded-2xl border overflow-hidden cursor-pointer active:scale-[0.98] transition-all duration-150 ${
        bookmark.is_read
          ? "border-gray-100 hover:shadow-sm"
          : "border-gray-200 hover:shadow-md"
      }`}
    >
      {/* OG Image */}
      {bookmark.og_image && (
        <div className="relative aspect-[2/1] overflow-hidden bg-gray-100">
          <img src={bookmark.og_image} alt=""
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.style.display = "none")} />
          {!bookmark.is_read && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onArchive) onArchive(bookmark);
                else handleReadToggle(e as any);
              }}
              disabled={toggling}
              title="보관"
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/30 backdrop-blur-sm text-white hover:bg-black/50 transition disabled:opacity-40"
            >
              <Archive className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      <div className="p-4 space-y-2.5">
        {/* Header */}
        <div className="flex items-start gap-2">
          {bookmark.favicon_url && (
            <img
              src={bookmark.favicon_url}
              alt=""
              className="w-4 h-4 mt-0.5 rounded flex-shrink-0"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-400 truncate">{bookmark.domain}</p>
            <p className="font-semibold text-sm leading-snug line-clamp-1 text-gray-900">
              <Highlight text={bookmark.title || bookmark.url} query={query} />
            </p>
          </div>
        </div>

        {/* Intent (저장 이유) */}
        {bookmark.intent && !bookmark.is_read && (
          <p className="text-xs font-medium text-gray-500 leading-relaxed line-clamp-2">
            <Highlight text={bookmark.intent} query={query} />
          </p>
        )}

        {/* AI Summary */}
        {bookmark.summary && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
            <Highlight text={bookmark.summary} query={query} />
          </p>
        )}

        {/* Tags */}
        {(bookmark.tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {bookmark.tags.map((tag) => (
              <button
                key={tag}
                onClick={(e) => { e.stopPropagation(); onTagClick(tag); }}
                className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium hover:bg-indigo-100 active:scale-95 transition"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Folder badge — 미분류는 노출 안 함 */}
        {bookmark.folder && bookmark.folder !== "미분류" && (
          <div className="flex items-center gap-1">
            <Folder className="w-3 h-3 text-indigo-300 flex-shrink-0" />
            <span className="text-xs text-indigo-400 font-medium">{bookmark.folder}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-xs text-gray-400">{date}</span>
          <div className="flex items-center gap-1">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition"
              title="원문 열기"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            {/* 미보관 + og_image 없을 때만 보관 버튼 */}
            {!bookmark.is_read && !bookmark.og_image && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onArchive) onArchive(bookmark);
                  else handleReadToggle(e);
                }}
                disabled={toggling}
                title="보관"
                className="p-1 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition disabled:opacity-40"
              >
                <Archive className="w-3.5 h-3.5" />
              </button>
            )}
            {/* 삭제 — 항상 노출 */}
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(e); }}
              disabled={deleting}
              className="p-1 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
