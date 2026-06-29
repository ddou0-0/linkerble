"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bookmark } from "@/lib/types";
import AddBookmarkForm from "@/components/AddBookmarkForm";
import BookmarkCard from "@/components/BookmarkCard";
import ReadingPanel from "@/components/ReadingPanel";
import FolderPickerSheet from "@/components/FolderPickerSheet";
import Toast from "@/components/Toast";
import { LogOut, Search, Settings, Archive, UserCircle2, Bell, X, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePush } from "@/lib/usePush";

type Tab = "unread" | "read";

function getDateGroup(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(todayStart.getDate() - 1);
  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - 6);
  if (d >= todayStart) return "오늘";
  if (d >= yesterdayStart) return "어제";
  if (d >= weekStart) return "이번 주";
  return "이전";
}

const GROUP_ORDER = ["오늘", "어제", "이번 주", "이전"];

/* ── 메인 페이지 ── */
export default function HomePage() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFolder, setActiveFolder] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("unread");
  const [openBookmark, setOpenBookmark] = useState<Bookmark | null>(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [notifDismissed, setNotifDismissed] = useState(true); // true = 숨김 (초기)
  const [toast, setToast] = useState<string | null>(null);
  const [archivingBookmark, setArchivingBookmark] = useState<Bookmark | null>(null);
  const [readView, setReadView] = useState<"list" | "folder">("list");
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const router = useRouter();
  const push = usePush();

  useEffect(() => {
    createClient().auth.getUser().then(({ data }: { data: { user: { email?: string } | null } }) => {
      if (!data.user) window.location.href = "/login";
      else { setAuthed(true); setUserEmail(data.user.email ?? ""); }
    });
  }, []);

  // 알림 배너: localStorage에서 dismiss 여부 확인
  useEffect(() => {
    const dismissed = localStorage.getItem("notif_banner_dismissed") === "1";
    setNotifDismissed(dismissed);
  }, []);

  useEffect(() => { if (authed) fetchBookmarks(); }, [authed]);

  async function fetchBookmarks() {
    setLoading(true);
    const res = await fetch("/api/bookmarks");
    if (res.ok) setBookmarks(await res.json());
    setLoading(false);
  }

  function handleAdded(bookmark: Bookmark) {
    setBookmarks((prev) => [bookmark, ...prev]);
    setTab("unread");
    setActiveFolder("");
    setToast("✓ 링크가 저장됐어요");
  }

  function handleDelete(id: string) {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }

  function handleReadToggle(id: string, is_read: boolean) {
    setBookmarks((prev) => prev.map((b) => (b.id === id ? { ...b, is_read } : b)));
  }

  function handleMemoUpdate(id: string, memo: string) {
    setBookmarks((prev) => prev.map((b) => (b.id === id ? { ...b, memo } : b)));
  }

  function handleReminderSet(id: string, remind_at: string | null) {
    setBookmarks((prev) => prev.map((b) => (b.id === id ? { ...b, remind_at } : b)));
  }

  function handleFolderMove(id: string, folder: string) {
    setBookmarks((prev) => prev.map((b) => (b.id === id ? { ...b, folder } : b)));
    setOpenBookmark((prev) => (prev?.id === id ? { ...prev, folder } : prev));
  }

  async function handleArchiveWithFolder(folder: string) {
    if (!archivingBookmark) return;
    const id = archivingBookmark.id;
    await fetch(`/api/bookmarks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_read: true, folder }),
    });
    setBookmarks((prev) => prev.map((b) => b.id === id ? { ...b, is_read: true, folder } : b));
    setOpenBookmark(null);
    setArchivingBookmark(null);
    setToast("✓ 보관됐어요");
  }

  async function handleRename(oldName: string, newName: string) {
    await fetch("/api/folders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldName, newName }),
    });
    setBookmarks((prev) =>
      prev.map((b) => (b.folder === oldName ? { ...b, folder: newName } : b))
    );
    if (activeFolder === oldName) setActiveFolder(newName);
  }

  async function handleLogout() {
    await createClient().auth.signOut();
    router.push("/login");
  }

  const unreadCount = useMemo(() => bookmarks.filter((b) => !b.is_read).length, [bookmarks]);

  useEffect(() => { setVisibleCount(10); }, [tab, activeFolder, query, selectedFolder]);
  useEffect(() => { setEditingFolder(null); setSelectedFolder(null); }, [tab, readView]);
  // 검색 시 폴더 뷰 → 리스트 뷰 자동 전환
  useEffect(() => { if (query.trim()) setReadView("list"); }, [query]);

  /* 탭 + 폴더 + 검색 필터 */
  const filtered = useMemo(() => {
    let list = bookmarks;
    if (tab === "unread") list = list.filter((b) => !b.is_read);
    else list = list.filter((b) => b.is_read);
    if (activeFolder) list = list.filter((b) => (b.folder ?? "미분류") === activeFolder);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (b) =>
          b.title?.toLowerCase().includes(q) ||
          b.summary?.toLowerCase().includes(q) ||
          b.url.toLowerCase().includes(q) ||
          b.tags.some((t) => t.toLowerCase().includes(q)) ||
          (b.folder ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [bookmarks, tab, activeFolder, query]);

  /* 폴더 목록 (탭 기준) */
  const folders = useMemo(() => {
    const base = bookmarks.filter(
      tab === "unread" ? (b) => !b.is_read : (b) => b.is_read
    );
    const map = new Map<string, number>();
    base.forEach((b) => {
      const f = b.folder ?? "미분류";
      map.set(f, (map.get(f) ?? 0) + 1);
    });
    return [...map.entries()]
      .sort((a, b) => {
        if (a[0] === "미분류") return 1;
        if (b[0] === "미분류") return -1;
        return b[1] - a[1];
      })
      .map(([name, count]) => ({ name, count }));
  }, [bookmarks, tab]);

  /* 보관 시 폴더 선택용 — 전체 북마크 기준 (탭 무관) */
  const allFolderNames = useMemo(() => {
    const set = new Set<string>();
    bookmarks.forEach((b) => set.add(b.folder ?? "미분류"));
    return [...set].filter((f) => f !== "미분류").sort();
  }, [bookmarks]);

  /* 폴더 뷰 드릴다운 시 해당 폴더 항목만 */
  const displayItems = useMemo(() => {
    if (tab === "read" && readView === "folder" && selectedFolder !== null) {
      return filtered.filter((b) => (b.folder ?? "미분류") === selectedFolder);
    }
    return filtered;
  }, [filtered, tab, readView, selectedFolder]);

  /* 날짜별(unread) / 리스트·드릴다운(read) 그룹 */
  const grouped = useMemo(() => {
    const visible = displayItems.slice(0, visibleCount);

    if (tab === "read") {
      if (readView === "list" || selectedFolder !== null) {
        // 플랫 리스트 — 섹션 헤더 없음
        return [{ label: "", items: visible }];
      }
      // 폴더 타일 뷰: 그룹 없이 별도 렌더링
      return [];
    }

    const map = new Map<string, Bookmark[]>();
    for (const b of visible) {
      const g = getDateGroup(b.created_at);
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(b);
    }
    return GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({ label: g, items: map.get(g)! }));
  }, [displayItems, visibleCount, tab, readView, selectedFolder]);


  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── 헤더 ── */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => window.location.reload()}
            className="font-bold text-sm tracking-tight px-1 hover:opacity-70 transition"
          >
            Linkerble
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => { setTab("read"); setActiveFolder(""); }}
              title="보관됨"
              className={`relative p-2 rounded-xl transition ${tab === "read" ? "bg-indigo-50 text-indigo-600" : "text-gray-400 hover:bg-gray-100"}`}
            >
              <Archive className="w-5 h-5" />
              {bookmarks.filter((b) => b.is_read).length > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-indigo-400" />
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                title="내 계정"
                className={`p-2 rounded-xl transition ${menuOpen ? "bg-gray-100 text-gray-700" : "text-gray-400 hover:bg-gray-100"}`}
              >
                <UserCircle2 className="w-5 h-5" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-20 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-xs text-gray-400 mb-0.5">로그인 계정</p>
                      <p className="text-sm font-medium truncate">{userEmail}</p>
                    </div>
                    <Link
                      href="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition"
                    >
                      <Settings className="w-4 h-4" />
                      설정 · 저장 단축어
                    </Link>
                    <Link
                      href="/intro"
                      onClick={() => setMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition"
                    >
                      <Info className="w-4 h-4" />
                      서비스 소개
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition border-t border-gray-100"
                    >
                      <LogOut className="w-4 h-4" />
                      로그아웃
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── 메인 콘텐츠 ── */}
      <div className="flex-1 flex flex-col">
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 space-y-4">
        {tab === "unread" && <AddBookmarkForm onAdded={handleAdded} />}

        {/* 검색 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            placeholder="제목, 요약, 폴더, 태그 검색..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* 탭 */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
          {([
            { key: "unread", label: "읽을 것" },
            { key: "read",   label: "보관됨" },
          ] as { key: Tab; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setActiveFolder(""); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                tab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
              {key === "unread" && unreadCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600 text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 보관 탭 — 뷰 토글 */}
        {tab === "read" && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {filtered.length}개 저장됨
            </p>
            <div className="flex gap-0.5 p-0.5 bg-gray-100 rounded-lg">
              {([
                { key: "list",   label: "리스트" },
                { key: "folder", label: "폴더"   },
              ] as { key: "list" | "folder"; label: string }[]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setReadView(key)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                    readView === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 폴더 필터 — 읽을 것 탭에서만 */}
        {tab === "unread" && folders.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveFolder("")}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition ${
                !activeFolder ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"
              }`}
            >
              전체
            </button>
            {folders.map(({ name, count }) => (
              <button
                key={name}
                onClick={() => setActiveFolder(activeFolder === name ? "" : name)}
                className={`flex-shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition ${
                  activeFolder === name ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"
                }`}
              >
                {name}
                <span className={`text-[10px] ${activeFolder === name ? "text-indigo-200" : "text-gray-400"}`}>{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* 알림 배너 */}
        {push.supported && !push.subscribed && !notifDismissed && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Bell className="w-4 h-4 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-800">안 읽은 링크가 쌓이면 알려드릴까요?</p>
              <p className="text-xs text-amber-600 mt-0.5">하루 한 번, 읽을 것이 남아있을 때만 알림을 보내요</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={async () => { await push.subscribe(); setNotifDismissed(true); }}
                disabled={push.loading}
                className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition disabled:opacity-40"
              >
                켜기
              </button>
              <button
                onClick={() => { setNotifDismissed(true); localStorage.setItem("notif_banner_dismissed", "1"); }}
                className="p-1.5 rounded-lg text-amber-400 hover:text-amber-600 hover:bg-amber-100 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 빈 상태 */}
        {!loading && filtered.length === 0 && tab === "unread" && !query && !activeFolder && (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
            <p className="font-semibold text-gray-700">다 읽었어요!</p>
            <p className="text-xs text-gray-400">오늘도 수고하셨습니다.</p>
          </div>
        )}
        {!loading && filtered.length === 0 && (tab !== "unread" || query || activeFolder) && (
          <p className="text-center text-gray-400 text-sm py-16">항목이 없어요.</p>
        )}
        {!loading && bookmarks.length === 0 && (
          <div className="bg-indigo-50 rounded-2xl px-5 py-4 text-sm text-indigo-700 space-y-1">
            <p className="font-semibold">링크를 저장하면 AI가 폴더에 자동 정리해요</p>
            <p className="text-indigo-500 text-xs leading-relaxed">
              요약과 폴더를 자동 제안하고, 폴더명은 언제든 수정할 수 있어요.
            </p>
          </div>
        )}

        {/* 폴더 타일 뷰 */}
        {!loading && tab === "read" && readView === "folder" && !selectedFolder && (
          <div className="grid grid-cols-2 gap-3 animate-tab-in">
            {folders.length === 0 && (
              <p className="col-span-2 text-center text-gray-400 text-sm py-12">보관된 항목이 없어요.</p>
            )}
            {folders.map(({ name, count }) => (
              <button
                key={name}
                onClick={() => setSelectedFolder(name)}
                className="bg-white rounded-2xl border border-gray-100 p-5 text-left hover:shadow-md hover:border-indigo-100 active:scale-[0.97] transition-all"
              >
                <div className="text-2xl mb-3">🗂</div>
                {editingFolder === name ? (
                  <input
                    autoFocus
                    value={editFolderName}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => setEditFolderName(e.target.value)}
                    onBlur={() => {
                      const trimmed = editFolderName.trim();
                      if (trimmed && trimmed !== name) handleRename(name, trimmed);
                      setEditingFolder(null);
                    }}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") { setEditFolderName(name); setEditingFolder(null); }
                    }}
                    className="text-sm font-semibold text-gray-700 bg-transparent border-b-2 border-indigo-400 focus:outline-none w-full"
                  />
                ) : (
                  <p
                    className="font-semibold text-sm text-gray-800 truncate group flex items-center gap-1"
                    onClick={(e) => { e.stopPropagation(); setEditingFolder(name); setEditFolderName(name); }}
                  >
                    {name}
                    <span className="text-[10px] text-gray-300 group-hover:text-indigo-400 transition">✎</span>
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">{count}개</p>
              </button>
            ))}
          </div>
        )}

        {/* 리스트 / 드릴다운 */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse">
                <div className="h-3 bg-gray-100 rounded w-1/4 mb-3" />
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-full" />
              </div>
            ))}
          </div>
        ) : (tab !== "read" || readView === "list" || selectedFolder !== null) && (
          <div key={`${tab}-${readView}-${selectedFolder}`} className="space-y-4 animate-tab-in">
            {/* 폴더 드릴다운 뒤로가기 헤더 */}
            {tab === "read" && readView === "folder" && selectedFolder && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedFolder(null)}
                  className="text-xs text-gray-400 hover:text-gray-600 transition px-2 py-1 rounded-lg hover:bg-gray-100"
                >
                  ← 폴더 목록
                </button>
                <span className="text-sm font-semibold text-gray-700">🗂 {selectedFolder}</span>
                <span className="text-xs text-gray-400">{displayItems.length}개</span>
              </div>
            )}

            {grouped.map(({ label, items }) => (
              <section key={label || "__list__"}>
                {label && tab !== "read" && (
                  <h2 className="text-sm font-semibold text-gray-500 mb-3 px-1">
                    {label === "오늘" ? "오늘 모았어요 👀"
                      : label === "어제" ? "어제 모았어요"
                      : label === "이번 주" ? "이번 주에 모았어요"
                      : "이전에 모았어요"}
                  </h2>
                )}
                <div className="space-y-3">
                  {items.map((b, idx) => (
                    <div
                      key={b.id}
                      className="animate-card-in"
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <BookmarkCard
                        bookmark={b}
                        onDelete={handleDelete}
                        onTagClick={(tag) => setQuery(tag)}
                        onReadToggle={handleReadToggle}
                        onOpen={setOpenBookmark}
                        onArchive={setArchivingBookmark}
                        query={query}
                      />
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {displayItems.length > visibleCount && (
              <button
                onClick={() => setVisibleCount((n) => n + 10)}
                className="w-full py-3 rounded-2xl border border-gray-200 bg-white text-sm text-gray-500 font-medium hover:bg-gray-50 transition"
              >
                더보기 ({displayItems.length - visibleCount}개 남음)
              </button>
            )}
          </div>
        )}
      </main>
      </div>

      <ReadingPanel
        bookmark={openBookmark}
        onClose={() => setOpenBookmark(null)}
        onReadToggle={(id, is_read) => { handleReadToggle(id, is_read); setOpenBookmark(null); }}
        onTagClick={(tag) => { setQuery(tag); setOpenBookmark(null); }}
        onMemoUpdate={handleMemoUpdate}
        onReminderSet={handleReminderSet}
        onArchive={setArchivingBookmark}
        folders={folders.map((f) => f.name)}
        onFolderMove={handleFolderMove}
      />

      {archivingBookmark && (
        <FolderPickerSheet
          folders={["미분류", ...allFolderNames]}
          currentFolder={archivingBookmark.folder}
          onSelect={handleArchiveWithFolder}
          onCancel={() => setArchivingBookmark(null)}
        />
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
