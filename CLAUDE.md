@AGENTS.md

# Linkerble — 프로젝트 컨텍스트

AI 기반 북마크 관리 PWA. Next.js 16 App Router + Supabase + Tailwind CSS v4.

## 기술 스택
- **Framework**: Next.js 16.2.4 (App Router, Turbopack)
- **Auth**: Supabase Magic Link (PKCE flow — `verifyOtp` with `token_hash`)
- **DB**: Supabase (bookmarks, folders, push_subscriptions 테이블)
- **Styling**: Tailwind CSS v4
- **Push**: web-push (VAPID)
- **AI**: Anthropic Claude API (북마크 요약/태그/폴더 자동 분류)
- **배포**: Vercel

## 주요 파일 구조
```
src/
  app/
    page.tsx              # 메인 홈 (북마크 리스트)
    login/page.tsx        # 매직링크 로그인
    auth/confirm/page.tsx # 매직링크 콜백 처리 (PKCE)
    intro/page.tsx        # 서비스 소개 랜딩페이지
    settings/page.tsx     # 설정
    api/
      bookmarks/          # 북마크 CRUD + AI 분석
      cron/reminders/     # 리마인더 푸시 알림 (Vercel cron, 5분마다)
      push/               # 푸시 구독 관리
  components/
    ReadingPanel.tsx      # 북마크 상세 뷰 (모바일: 하단 슬라이드, PC: 우측 패널)
    AddBookmarkForm.tsx   # URL 입력 → AI 분석 → 저장
    FolderPickerSheet.tsx # 폴더 선택 (모바일: 바텀시트, PC: 중앙 모달)
  lib/
    supabase/             # client.ts / server.ts
    types.ts
src/proxy.ts              # Next.js 16 middleware (세션 갱신)
vercel.json               # Vercel cron 설정 (reminders 5분마다)
supabase-email-template.html  # Supabase 이메일 템플릿 (한국어)
```

## 환경변수 (.env.local + Vercel)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   ← ⚠️ 아직 미설정 (리마인더 작동에 필수!)
ANTHROPIC_API_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=
CRON_SECRET=                 ← 선택사항 (Vercel cron 보안용)
```

## ⚠️ 미완료 / 해야 할 것

### 1. 리마인더 활성화 (우선순위 높음)
- Supabase Dashboard > Settings > API > service_role 키 복사
- `.env.local`에 `SUPABASE_SERVICE_ROLE_KEY=...` 추가
- Vercel 대시보드 > Settings > Environment Variables에도 동일하게 추가
- 재배포하면 5분마다 cron이 자동 실행됨

### 2. 이메일 커스텀 템플릿 적용
- `supabase-email-template.html` 내용을 Supabase Dashboard > Authentication > Email Templates > Magic Link에 붙여넣기
- Subject: `Linkerble 로그인 링크가 도착했어요`

### 3. 커스텀 도메인 (나중에)
- Cloudflare Registrar에서 도메인 구매
- Resend에 도메인 연결 → 기업 메일 발송 가능
- Supabase SMTP를 Resend로 교체

## 현재 작동하는 기능
- 매직링크 로그인/로그아웃 (PKCE)
- URL 붙여넣기 → AI 자동 요약/태그/폴더 분류
- 북마크 리스트 (탭: 전체/읽음/보관), 폴더 필터링, 검색
- 리마인더 설정 UI (실제 발송은 위 #1 완료 후 작동)
- 서비스 소개 랜딩페이지 `/intro`
- PWA (manifest, service worker)
- 모바일/PC 반응형 (ReadingPanel, FolderPickerSheet)

## 최근 작업 이력
1. iOS 인풋 클릭 시 줌 방지 (font-size 16px 강제)
2. PC ReadingPanel 스크롤 수정
3. 리마인더 클릭 시 push 권한 자동 요청
4. FolderPickerSheet → PC에서 중앙 모달
5. 폴더 선택 시 기존 폴더 안 보이던 버그 수정
6. ReadingPanel 정보 계층 개편 (저장이유+메모 amber, AI요약 gray)
7. /intro 서비스 소개 랜딩페이지 신설
8. 매직링크 PKCE 인증 수정 (verifyOtp + token_hash)
9. 로그인 성공 화면 개선 (메일함 열기 버튼, 계층 조정)
10. vercel.json cron 설정 추가
11. 리마인더 API 에러 처리 및 로그 강화
