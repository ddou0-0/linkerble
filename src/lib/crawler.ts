import * as cheerio from "cheerio";
import { CrawlResult } from "./types";

const IMAGE_EXTS = /\.(jpe?g|png|gif|webp|svg|bmp|avif|tiff?)(\?.*)?$/i;

export function isImageUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname;
    return IMAGE_EXTS.test(path);
  } catch {
    return false;
  }
}

export async function crawlUrl(url: string): Promise<CrawlResult> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; Linkerble/1.0; +https://linkerble.app)",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch URL: ${res.status}`);
  }

  // 이미지 URL이면 HTML 파싱 없이 바로 반환
  const contentType = res.headers.get("content-type") ?? "";
  if (isImageUrl(url) || contentType.startsWith("image/")) {
    const domain = new URL(url).hostname;
    const filename = new URL(url).pathname.split("/").pop() ?? "이미지";
    return {
      url,
      title: filename,
      description: "",
      favicon_url: "",
      og_image: url,
      domain,
      text_content: "",
    };
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  const domain = new URL(url).hostname;

  const title =
    $('meta[property="og:title"]').attr("content") ||
    $("title").text().trim() ||
    "";

  const description =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    "";

  const og_image =
    $('meta[property="og:image"]').attr("content") ||
    $('meta[name="twitter:image"]').attr("content") ||
    "";

  const favicon_url =
    $('link[rel="icon"]').attr("href") ||
    $('link[rel="shortcut icon"]').attr("href") ||
    `https://${domain}/favicon.ico`;

  // 절대 URL로 변환
  const resolvedFavicon = toAbsoluteUrl(favicon_url, url);
  const resolvedOgImage = og_image ? toAbsoluteUrl(og_image, url) : "";

  // 본문 텍스트 추출 (요약용, 최대 3000자)
  $("script, style, nav, footer, header, aside").remove();
  const text_content = $("body").text().replace(/\s+/g, " ").trim().slice(0, 3000);

  return {
    url,
    title,
    description,
    favicon_url: resolvedFavicon,
    og_image: resolvedOgImage,
    domain,
    text_content,
  };
}

function toAbsoluteUrl(href: string, base: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}
