import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { crawlUrl } from "@/lib/crawler";
import { summarizeAndTag } from "@/lib/ai";

// GET /api/bookmarks — 목록 조회
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tag = searchParams.get("tag");
  const q = searchParams.get("q");

  let query = supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (tag) query = query.contains("tags", [tag]);
  if (q) query = query.or(`title.ilike.%${q}%,summary.ilike.%${q}%,url.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

// POST /api/bookmarks — URL 저장
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { url, memo } = await req.json();
  if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

  // 중복 체크
  const { data: existing } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("url", url)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Already saved" }, { status: 409 });
  }

  // 크롤링
  const crawl = await crawlUrl(url);

  // AI 요약 + 태깅
  const ai = await summarizeAndTag(crawl, memo);

  // DB 저장
  const { data, error } = await supabase
    .from("bookmarks")
    .insert({
      user_id: user.id,
      url: crawl.url,
      title: crawl.title,
      description: crawl.description,
      favicon_url: crawl.favicon_url,
      og_image: crawl.og_image,
      domain: crawl.domain,
      summary: ai.summary,
      intent: ai.intent,
      memo: memo ?? null,
      tags: ai.tags,
      folder: ai.folder,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
