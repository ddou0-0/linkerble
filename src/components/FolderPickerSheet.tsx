"use client";

import { useState } from "react";
import { X, Plus, Check } from "lucide-react";

interface Props {
  folders: string[];
  currentFolder?: string | null;
  onSelect: (folder: string) => void;
  onCancel: () => void;
}

export default function FolderPickerSheet({ folders, currentFolder, onSelect, onCancel }: Props) {
  const [newFolder, setNewFolder] = useState("");
  const [showNew, setShowNew] = useState(false);

  const named = folders.filter((f) => f !== "미분류");

  function confirm(folder: string) {
    if (folder.trim()) onSelect(folder.trim());
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={onCancel} />

      {/* Sheet — mobile: bottom sheet / desktop: center modal */}
      <div className="
        fixed z-[60] bg-white shadow-2xl
        /* mobile */
        inset-x-0 bottom-0 rounded-t-3xl pb-safe
        /* desktop */
        md:inset-x-auto md:inset-y-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
        md:w-[420px] md:rounded-2xl md:bottom-auto
      ">
        {/* 핸들 — 모바일만 */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="px-5 pt-4 pb-6 space-y-4 md:pt-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-gray-900">어디에 보관할까요?</h3>
            <button onClick={onCancel} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {named.map((f) => (
              <button
                key={f}
                onClick={() => confirm(f)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-medium transition active:scale-[0.98] ${
                  currentFolder === f
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>🗂 {f}</span>
                {currentFolder === f && <Check className="w-4 h-4" />}
              </button>
            ))}

            {/* 미분류 */}
            <button
              onClick={() => confirm("미분류")}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-medium transition active:scale-[0.98] ${
                (currentFolder === "미분류" || !currentFolder)
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span>📁 미분류</span>
              {(currentFolder === "미분류" || !currentFolder) && <Check className="w-4 h-4" />}
            </button>
          </div>

          {/* 새 폴더 */}
          {showNew ? (
            <div className="flex gap-2">
              <input
                autoFocus
                value={newFolder}
                onChange={(e) => setNewFolder(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirm(newFolder);
                  if (e.key === "Escape") { setShowNew(false); setNewFolder(""); }
                }}
                placeholder="새 폴더 이름"
                className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => confirm(newFolder)}
                disabled={!newFolder.trim()}
                className="px-4 py-3 rounded-2xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-40 transition"
              >
                추가
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNew(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border-2 border-dashed border-gray-200 text-sm text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition"
            >
              <Plus className="w-4 h-4" />
              새 폴더 만들기
            </button>
          )}
        </div>
      </div>
    </>
  );
}
