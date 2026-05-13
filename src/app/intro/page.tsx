import Link from "next/link";
import { Link2, Sparkles, FolderOpen, Tag, Search, Bell, ArrowRight, Check } from "lucide-react";

export default function IntroPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ── Nav ── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Link2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base tracking-tight">Linkerble</span>
          </div>
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition"
          >
            무료로 시작하기
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="pt-32 pb-20 px-5 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          AI 기반 북마크 관리
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mb-5">
          흘려보낸 정보,<br />
          <span className="text-indigo-600">이제 제대로 보관하세요</span>
        </h1>
        <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-xl mx-auto">
          URL만 저장하면 AI가 알아서 요약하고, 태그 달고, 폴더에 정리해드려요.
          나중에 꼭 읽어야 할 글은 리마인더로 챙길 수 있어요.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/login"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 active:scale-[0.97] transition"
          >
            무료로 시작하기 <ArrowRight className="w-4 h-4" />
          </Link>
          <span className="text-xs text-gray-400">이메일 한 번으로 가입 완료</span>
        </div>
      </section>

      {/* ── Problem ── */}
      <section className="py-16 px-5 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-4">이런 경험 있으신가요?</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            바쁜 업무 중 공유받은 링크,<br className="hidden sm:block" /> 결국 안 보게 되죠
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { emoji: "💬", text: "팀원이 보내준 아티클, 나중에 읽어야지 하고 저장" },
              { emoji: "📂", text: "폴더는 쌓여가는데 정작 뭐가 있는지 기억 안 남" },
              { emoji: "😮‍💨", text: "결국 못 읽고 시간이 지나 버리는 소중한 정보들" },
            ].map(({ emoji, text }) => (
              <div key={text} className="bg-white rounded-2xl p-5 border border-gray-100 text-center space-y-3">
                <div className="text-3xl">{emoji}</div>
                <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-5">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-4">사용 방법</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            URL 하나만 넣으면 끝
          </h2>
          <div className="space-y-6">
            {[
              {
                step: "01",
                title: "URL 붙여넣기",
                desc: "링크를 그대로 붙여넣거나, 카카오톡 메시지에서 복사해서 넣으면 URL을 자동으로 감지해요.",
                color: "bg-indigo-50 text-indigo-600",
              },
              {
                step: "02",
                title: "AI가 알아서 분석",
                desc: "원문을 읽고 핵심 내용을 요약하고, 관련 태그를 달아 적절한 폴더에 자동으로 분류해드려요.",
                color: "bg-violet-50 text-violet-600",
              },
              {
                step: "03",
                title: "필요할 때 바로 찾기",
                desc: "제목·요약·태그·폴더 통합 검색으로 원하는 글을 빠르게 찾고, 리마인더로 중요한 글을 챙겨요.",
                color: "bg-sky-50 text-sky-600",
              },
            ].map(({ step, title, desc, color }) => (
              <div key={step} className="flex items-start gap-5">
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${color}`}>
                  {step}
                </div>
                <div className="pt-1">
                  <h3 className="font-bold text-base mb-1">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-5 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-xs font-semibold text-indigo-500 uppercase tracking-widest mb-4">주요 기능</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            정보를 의미 있게 만드는 모든 것
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: <Sparkles className="w-5 h-5" />,
                color: "bg-indigo-100 text-indigo-600",
                title: "AI 자동 요약",
                desc: "원문을 직접 읽지 않아도 핵심 내용을 3줄로 요약해드려요.",
              },
              {
                icon: <FolderOpen className="w-5 h-5" />,
                color: "bg-violet-100 text-violet-600",
                title: "자동 폴더링",
                desc: "주제에 맞는 폴더를 AI가 추천하고 자동으로 분류해요.",
              },
              {
                icon: <Tag className="w-5 h-5" />,
                color: "bg-sky-100 text-sky-600",
                title: "스마트 태그",
                desc: "내용을 분석해 관련 키워드를 자동으로 태그로 달아드려요.",
              },
              {
                icon: <Search className="w-5 h-5" />,
                color: "bg-teal-100 text-teal-600",
                title: "통합 검색",
                desc: "제목, 요약, 태그, 폴더를 한 번에 검색해 원하는 글을 찾아요.",
              },
              {
                icon: <Bell className="w-5 h-5" />,
                color: "bg-amber-100 text-amber-600",
                title: "리마인더",
                desc: "꼭 읽어야 할 글은 알림으로 다시 알려드려요. 놓치지 마세요.",
              },
              {
                icon: <Link2 className="w-5 h-5" />,
                color: "bg-rose-100 text-rose-600",
                title: "원문 바로 보기",
                desc: "저장된 링크에서 원문으로 바로 이동할 수 있어요.",
              },
            ].map(({ icon, color, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-5 border border-gray-100 space-y-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                  {icon}
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-5 text-center">
        <div className="max-w-xl mx-auto space-y-6">
          <h2 className="text-3xl md:text-4xl font-extrabold leading-tight">
            정보, 쌓아만 두지 말고<br />
            <span className="text-indigo-600">의미 있게 보관하세요</span>
          </h2>
          <p className="text-gray-500 text-base leading-relaxed">
            지금 이 순간에도 읽지 못한 링크들이 사라지고 있어요.<br />
            Linkerble이 대신 챙겨드릴게요.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Link
              href="/login"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 text-white font-bold text-base hover:bg-indigo-700 active:scale-[0.97] transition shadow-lg shadow-indigo-200"
            >
              무료로 시작하기 <ArrowRight className="w-4 h-4" />
            </Link>
            <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-gray-400">
              {["이메일만으로 가입", "신용카드 불필요", "완전 무료"].map((t) => (
                <li key={t} className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-indigo-400" /> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-5 border-t border-gray-100 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center">
            <Link2 className="w-3 h-3 text-white" />
          </div>
          <span className="font-bold text-sm">Linkerble</span>
        </div>
        <p className="text-xs text-gray-400">정보를 의미 있게 보관하는 가장 쉬운 방법</p>
      </footer>

    </div>
  );
}
