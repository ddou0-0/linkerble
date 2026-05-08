export interface Bookmark {
  id: string;
  user_id: string;
  url: string;
  title: string | null;
  description: string | null;
  favicon_url: string | null;
  og_image: string | null;
  summary: string | null;
  intent: string | null;
  memo: string | null;
  tags: string[];
  folder: string | null;
  domain: string | null;
  is_read: boolean;
  remind_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrawlResult {
  url: string;
  title: string;
  description: string;
  favicon_url: string;
  og_image: string;
  domain: string;
  text_content: string;
}

export interface AIResult {
  summary: string;
  intent: string;
  tags: string[];
  folder: string;
}
