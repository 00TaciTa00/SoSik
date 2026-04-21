# 배포 준비도 검토 — 2026-04-21

## 요약

| 항목 | 결과 |
|------|------|
| 검토일 | 2026-04-21 |
| 브랜치 | dev |
| 판정 | **REQUEST CHANGES — 배포 불가** |
| 배포 준비도 | **20/100** |
| 현재 단계 | UI 프로토타입 |
| CRITICAL | 5건 |
| HIGH | 7건 |
| MEDIUM | 5건 |
| LOW | 4건 |

---

## 구현 완성도

기획서(`forPlan/기획_v4.md`) 대비 핵심 기능 구현 상태.

| 모듈 | 기획 요구사항 | 구현 상태 | 비고 |
|------|-------------|----------|------|
| 레포지토리 관리 | 추가/수정/삭제 | UI만 존재 (mock) | IPC 미연결, DB 미연결 |
| 배포 감지 | 웹훅 수신, 수동 체크 | 미구현 | HTTP 서버, 트레이 아이콘 없음 |
| diff 추출 | API/로컬 git 방식 | 미구현 | `src/diff/`에 `.gitkeep`만 존재 |
| 보안 파일 제외 | 레포별 패턴 관리 | UI만 존재 | DB/로직 미연결, 메모리에서만 동작 |
| AI 요약 | Claude/GPT 호출 | 미구현 | `src/ai/`에 `.gitkeep`만 존재 |
| SQLite 저장 | 전체 데이터 영구 저장 | 스키마만 존재 | DB 초기화/CRUD 코드 없음 |
| UI | 사이드바+4탭+전역설정 | 구현됨 | mock 데이터로 동작 |
| 복사 포맷 | 마크다운/텍스트/Naver Works | 구현됨 | `ReleaseNoteDetail.tsx`에서 동작 |

---

## 영역별 점수

| 영역 | 점수 | 설명 |
|------|------|------|
| UI 구현 | 70/100 | 모든 화면 존재, mock 데이터로 동작 가능 |
| 백엔드 로직 | 0/100 | AI, diff, DB, 웹훅 모두 미구현 |
| IPC 통신 | 5/100 | preload 구조만 존재, 핸들러 0건 |
| 데이터 영속성 | 5/100 | SQL 스키마만 존재, CRUD 코드 없음 |
| 보안 | 30/100 | contextIsolation 적용했으나 채널 화이트리스트 부재, 암호화 저장 미구현 |
| 테스트 | 0/100 | 테스트 파일 0건 |
| 빌드/배포 | 40/100 | electron-builder 설정 존재, 빌드는 가능하나 실질적 기능 없음 |

---

## CRITICAL 이슈

### C-1. 전체 백엔드 로직 미구현

- **위치**: `src/ai/.gitkeep`, `src/diff/.gitkeep`, `src/db/.gitkeep`
- **문제**: 핵심 기능 3개 모듈(AI 요약, diff 추출, DB CRUD)이 빈 디렉토리. `src/renderer/src/lib/api.ts`의 모든 함수가 `Promise.resolve([])` 또는 `Promise.reject(new Error('not implemented'))` 반환.
- **영향**: 사용자가 앱을 설치해도 레포 등록, diff 추출, AI 요약 생성 모두 불가능.
- **수정**: `src/db/repository.ts`, `src/diff/extractor.ts`, `src/ai/provider.ts` 등 핵심 모듈 구현 필요.

### C-2. IPC 핸들러 전무

- **위치**: `src/main/index.ts`
- **문제**: `ipcMain.handle()`이 단 한 건도 없음. preload에서 `contextBridge`로 `api.invoke()`를 노출했지만, main process 측에 대응하는 핸들러가 없어 모든 IPC 호출이 실패함.
- **영향**: renderer에서 main으로의 모든 통신이 불가.
- **수정**: `src/main/ipc/` 디렉토리에 도메인별 IPC 핸들러(`repo.ts`, `diff.ts`, `ai.ts`, `settings.ts`, `secure.ts`) 생성 및 `src/main/index.ts`에서 등록.

### C-3. Renderer API 레이어가 실제 IPC를 사용하지 않음

- **위치**: `src/renderer/src/lib/api.ts:1-46`
- **문제**: 주석에 "현재는 mock, IPC 구현 시 window.api.invoke로 교체"라고 명시. 모든 메서드가 더미 데이터를 반환하거나 reject함.
- **영향**: UI의 모든 데이터 조회/저장 요청이 mock 응답만 받음.
- **수정**: 각 메서드를 `window.api.invoke('channel-name', ...args)` 패턴으로 교체.

### C-4. electron-store 암호화 저장 미구현

- **위치**: `src/renderer/src/components/GlobalSettings/GlobalSettingsModal.tsx:27-41`
- **문제**: `claudeKey`, `openaiKey`, `naverWorksKey`를 입력받지만, 실제로 electron-store에 저장하는 코드가 없음. 주석만 있음(`// ipc:secure:setApiKey for keys`).
- **영향**: 사용자가 API Key를 입력해도 앱 재시작 시 사라짐.
- **수정**: main process에서 `electron-store`를 `encryptionKey`와 함께 초기화하고, IPC 채널을 통해 secure store CRUD 구현.

### C-5. DB 타입과 SQL 스키마 간 값 불일치

- **위치**: `src/db/schema.sql:17` vs `src/shared/types.ts:3`
- **문제**: SQL CHECK 제약조건은 `'local_git'`(underscore)인데, TypeScript 타입은 `'local-git'`(hyphen). DB에 데이터 삽입 시 CHECK 제약 위반으로 실패함.
- **영향**: 로컬 git 방식의 레포를 DB에 저장할 수 없음.
- **수정**: `src/db/schema.sql`의 `local_git`을 `local-git`으로 변경하거나, TypeScript 타입을 `local_git`으로 변경. **어느 쪽으로든 통일 필요.**

---

## HIGH 이슈

### H-1. preload에서 IPC 채널 화이트리스트 없음

- **위치**: `src/preload/index.ts:8-9`
- **문제**: `invoke(channel: string, ...args: unknown[])` 형태로 아무 채널이나 호출 가능. 악성 renderer 코드가 임의의 IPC 채널을 호출할 수 있음.
- **수정**: 허용된 채널 목록을 정의하고 검증 추가.

```typescript
const ALLOWED_CHANNELS = ['repo:get-all', 'repo:add', 'diff:check', ...] as const
```

### H-2. 웹훅 HTTP 서버 미구현

- **위치**: `src/main/index.ts` (부재)
- **문제**: 기획서 "배포 감지"의 핵심인 `localhost:{port}/webhook/{repo-id}` HTTP 서버가 전혀 없음.
- **수정**: `src/main/webhook/server.ts`에 Node.js `http` 모듈로 웹훅 수신 서버 구현.

### H-3. 시스템 트레이 미구현

- **위치**: `src/main/index.ts:4`
- **문제**: `// TODO: 트레이 최소화 구현 예정`으로 주석만 있음. `Tray`, `Menu` import 비활성화.
- **수정**: Tray + Menu로 트레이 최소화 로직 구현.

### H-4. 모든 비동기 작업이 setTimeout fake

- **위치**: `Dashboard.tsx:28`, `GitGraph.tsx:33`, `RepoSettings.tsx:40`, `GlobalSettingsModal.tsx:29`, `ReleaseNoteDetail.tsx:66`
- **문제**: 5개 컴포넌트의 비동기 핸들러가 모두 `await new Promise((r) => setTimeout(r, N))`으로 지연만 시뮬레이션.
- **수정**: `src/renderer/src/lib/api.ts`의 실제 IPC 호출로 교체.

### H-5. AppContext에 하드코딩된 mock 데이터

- **위치**: `src/renderer/src/contexts/AppContext.tsx:21-107`
- **문제**: `MOCK_REPOS`, `MOCK_RELEASE_NOTES`가 하드코딩. 앱 시작 시 DB에서 로드하는 `useEffect`가 없음.
- **수정**: `useEffect`에서 `api.repo.getAll()`, `api.settings.get()`으로 DB 데이터 로드. mock 제거.

### H-6. `sandbox: false` 설정

- **위치**: `src/main/index.ts:19`
- **문제**: Electron 보안 모범 사례에서는 `sandbox: true` 권장.
- **수정**: `sandbox: true`로 변경 후 preload 동작 검증.

### H-7. accessToken을 입력받지만 저장하지 않음

- **위치**: `src/renderer/src/components/Sidebar/RepoAddModal.tsx:20,42-43`
- **문제**: `handleSubmit`에서 accessToken을 `repo` 객체에 포함하지 않고 `resetForm()`으로 버림.
- **수정**: `api.secure.setApiKey(`repo:${repo.id}:access_token`, accessToken)` 호출 추가.

---

## MEDIUM 이슈

### M-1. ai_provider 값 불일치

- **위치**: `src/db/schema.sql:22` vs `src/shared/types.ts:5`
- **문제**: SQL CHECK는 `IN ('claude', 'gpt')`이고 TypeScript는 `'openai'`. DB에 `'openai'` 삽입 시 CHECK 제약 위반.
- **수정**: `'openai'`로 통일 권장.

### M-2. i18n 미구현

- **문제**: 기획서 "한/영 언어 전환"이 요구사항이지만, 모든 UI 문자열이 한국어 하드코딩. `settings.appLanguage` 변경해도 UI가 바뀌지 않음.
- **수정**: `react-i18next` 도입 또는 번역 객체 패턴 적용.

### M-3. 테스트 파일 0건

- **문제**: `jest.config.ts`는 존재하나 `.test.ts`, `.spec.ts` 파일이 단 하나도 없음.
- **수정**: shared 유틸 및 핵심 비즈니스 로직에 최소 단위 테스트 작성.

### M-4. Naver Works 복사 포맷 불완전

- **위치**: `src/renderer/src/components/ReleaseNotes/ReleaseNoteDetail.tsx:29-38`
- **문제**: `markdownToNaverWorks` 정규식이 여러 `<ul>` 목록 중 첫 번째만 감쌈. `navigator.clipboard.writeText()`는 plain text만 복사하므로 HTML 태그가 그대로 노출됨.
- **수정**: `navigator.clipboard.write()`와 `ClipboardItem`으로 `text/html` MIME 타입 복사.

### M-5. `deleteRepo` stale closure 가능성

- **위치**: `src/renderer/src/contexts/AppContext.tsx:127-133`
- **문제**: `setSelectedRepoId` 콜백 내에서 클로저로 캡처된 이전 `repos`를 참조.
- **수정**: updater 함수 패턴 또는 `useReducer`로 전환.

---

## LOW 이슈

### L-1. DIFF_SOURCE_LABEL 상수 중복

- **위치**: `Dashboard.tsx:9`, `RepoSettings.tsx:11`
- **수정**: `src/shared/constants.ts`로 추출.

### L-2. GitGraph가 진짜 그래프가 아닌 테이블

- **위치**: `src/renderer/src/components/GitGraph/GitGraph.tsx:15-20`
- **문제**: 기획서의 "커밋 히스토리 시각화"와 달리 단순 테이블로 mock 데이터만 표시.

### L-3. `markdownToText` 변환 불완전

- **위치**: `src/renderer/src/components/ReleaseNotes/ReleaseNoteDetail.tsx:19-27`
- **문제**: 링크, 이미지, 테이블, 코드 블록 등을 처리하지 못함.
- **수정**: `remove-markdown` 라이브러리 도입 권장.

### L-4. Toast module-level mutable counter

- **위치**: `src/renderer/src/components/common/Toast.tsx:18`
- **문제**: `let _id = 0`이 모듈 스코프에 존재. HMR 시 리셋되지 않음.
- **수정**: `useRef` 또는 `Date.now()` 사용.

---

## 긍정적 관찰

- TypeScript strict 모드 완벽 적용 — `any` 타입 0건
- `contextIsolation: true`, `nodeIntegration: false` 보안 기본 설정 올바름
- 커스텀 에러 타입 체계 체계적으로 설계됨 (`src/shared/error.ts`)
- `console.log` 사용 0건 — `logger.ts` 100% 준수
- UI 컴포넌트 공통화가 잘 되어 있음 (Button, Modal, TabBar, Toast, EmptyState 등)
- SQL 스키마 설계 견고함 (foreign key, ON DELETE CASCADE, 인덱스, CHECK 제약)
- 레포별 설정 독립성이 타입 수준에서 보장됨

---

## 구현 우선순위 로드맵

### P0 — 핵심 동작 가능 수준

1. SQL 스키마 ↔ TypeScript 타입 값 불일치 해소 (C-5, M-1)
2. DB 초기화 및 CRUD 구현 (`src/db/`)
3. IPC 핸들러 등록 (`src/main/ipc/`) + preload 채널 화이트리스트 (C-2, H-1)
4. renderer API를 실제 IPC 호출로 교체 (C-3)
5. electron-store 암호화 저장 구현 (C-4, H-7)
6. AppContext mock 데이터 제거 및 DB 로드 연결 (H-5)

### P1 — 핵심 기능 완성

7. diff 추출 모듈 구현 (`src/diff/`) — GitLab/GitHub API 방식 우선
8. AI 요약 모듈 구현 (`src/ai/provider.ts`) — Claude 우선
9. sandbox: true 적용 및 검증 (H-6)
10. setTimeout fake 핸들러 교체 (H-4)

### P2 — 완성도 향상

11. 웹훅 HTTP 서버 구현 (`src/main/webhook/`) (H-2)
12. 시스템 트레이 구현 (H-3)
13. 핵심 로직 단위 테스트 작성 (M-3)
14. Naver Works HTML 복사 수정 (M-4)

### P3 — 품질 개선

15. i18n 적용 (M-2)
16. GitGraph 시각화 (L-2)
17. markdownToText 개선 (L-3)
18. 공통 상수 추출 (L-1)
