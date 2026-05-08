import Anthropic from "@anthropic-ai/sdk";
import { AIResult, CrawlResult } from "./types";

export async function summarizeAndTag(crawl: CrawlResult, memo?: string): Promise<AIResult> {
  // 이미지는 요약 불필요
  if (!crawl.text_content && crawl.og_image === crawl.url) {
    return { summary: "", intent: memo ? `메모: ${memo}` : "저장한 이미지", tags: ["이미지"], folder: "이미지" };
  }

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "your_anthropic_api_key") {
    return { summary: crawl.description || "", intent: "", tags: [], folder: "미분류" };
  }

  const memoSection = memo?.trim()
    ? `\n사용자 메모 (저장 당시 컨텍스트):\n${memo.trim()}`
    : "";

  const prompt = `다음 웹페이지 내용을 분석해서 JSON으로 응답해줘.

URL: ${crawl.url}
제목: ${crawl.title}
설명: ${crawl.description}
본문:
${crawl.text_content}${memoSection}

응답 형식 (JSON만, 마크다운 없이):
{
  "summary": "2-3문장으로 핵심 내용 요약 (한국어)",
  "intent": "저장 이유를 자연스러운 한 문장으로 (예: 'JAMS 2.0 버튼 컴포넌트 작업에 참고할 디자인 가이드', '팀원이 추천한 React 성능 최적화 자료')",
  "tags": ["태그1", "태그2", "태그3"],
  "folder": "폴더명"
}

규칙:
- intent: 사용자 메모가 있으면 메모 맥락을 반영해서 '왜 저장했는지' 한 문장. 메모 없으면 콘텐츠 성격으로 추론.
- tags: 3~8개, 한국어 또는 영어 명사형 키워드
- folder: 2~6글자의 짧고 명확한 카테고리명 (예: 개발, 디자인, 마케팅, AI, 뉴스, 금융, 커리어)`;

  const client = new Anthropic();
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";

  try {
    const json = JSON.parse(text.trim());
    return {
      summary: json.summary ?? "",
      intent: json.intent ?? "",
      tags: Array.isArray(json.tags) ? json.tags.slice(0, 8) : [],
      folder: json.folder ?? "미분류",
    };
  } catch {
    return { summary: text.slice(0, 300), intent: "", tags: [], folder: "미분류" };
  }
}
