import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { crawlUrl } from "@/lib/crawler";
import { summarizeAndTag } from "@/lib/ai";

// GET /api/share?url=...&token=...
// iOS 단축어에서 쿠키 없이 호출하는 엔드포인트
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const token = searchParams.get("token");

  if (!url || !token) {
    return NextResponse.json({ error: "url and token required" }, { status: 400 });
  }

  const supabase = await createClient();

  // 토큰으로 사용자 찾기
  const { data: settings } = await supabase
    .from("user_settings")
    .select("user_id")
    .eq("share_token", token)
    .maybeSingle();

  if (!settings) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const userId = settings.user_id;

  // 중복 체크
  const { data: existing } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", userId)
    .eq("url", url)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ message: "Already saved", id: existing.id });
  }

  const crawl = await crawlUrl(url);
  const ai = await summarizeAndTag(crawl);

  const { data, error } = await supabase
    .from("bookmarks")
    .insert({
      user_id: userId,
      url: crawl.url,
      title: crawl.title,
      description: crawl.description,
      favicon_url: crawl.favicon_url,
      og_image: crawl.og_image,
      domain: crawl.domain,
      summary: ai.summary,
      tags: ai.tags,
      folder: ai.folder,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: "Saved", id: data.id, title: data.title });
}
