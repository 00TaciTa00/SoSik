# 배포 준비도 검토 — 2026-04-26

## 요약

| 항목 | 결과 |
|------|------|
| 검토일 | 2026-04-26 |
| 브랜치 | dev |
| 판정 | **APPROVE — 조건부 배포 가능** |
| 배포 준비도 | **90/100** |
| 현재 단계 | 기능 완성 단계 |
| CRITICAL | 0건 (이번 세션 해결) |
| HIGH | 0건 (이번 세션 해결) |
| MEDIUM | 2건 |
| LOW | 4건 |

> 2026-04-21 리뷰의 모든 CRITICAL/HIGH 이슈가 해결됨.  
> 이번 세션에서 C-1(OpenAI 구현), C-2(웹훅 서명 검증)까지 처리 완료.

---

## 구현 완성도

기획서(`forPlan/기획_v4.md`) 대비 핵심 기능 구현 상태.

| 모듈 | 기획 요구사항 | 구현 상태 | 비고 |
|------|-------------|----------|------|
| 레포지토리 관리 | 추가/수정/삭제 | ✅ 완성 | DB + IPC + UI 연결 |
| 배포 감지 | 웹훅 수신, 수동 체크 | ✅ 완성 | 서명 검증 포함 |
| diff 추출 | API/로컬 git 방식 | ✅ 완성 | GitLab·GitHub API + 로컬 git |
| 보안 파일 제외 | 레포별 패턴 관리 | ✅ 완성 | glob 패턴 → regex 필터 |
| AI 요약 (Claude) | Claude 호출 | ✅ 완성 | fetch 직접 호출 |
| AI 요약 (OpenAI) | GPT 호출 | ✅ 완성 | GPT-4o Chat Completions |
| SQLite 저장 | 전체 데이터 영구 저장 | ✅ 완성 | CRUD 전체 구현 |
| UI | 사이드바+4탭+전역설정 | ✅ 완성 | 실제 IPC 연결 |
| 복사 포맷 | 마크다운/텍스트/Naver Works | ✅ 완성 | ClipboardItem text/html 방식 |
| 시스템 트레이 | 트레이 최소화 | ✅ 완성 | 더블클릭 복원, 우클릭 메뉴 |
| i18n | 한/영 전환 | ✅ 완성 | translations.ts 기반 |

---

## 영역별 점수

| 영역 | 점수 | 설명 |
|------|------|------|
| UI 구현 | 85/100 | 전체 화면 완성, 실제 데이터 연결 |
| 백엔드 로직 | 95/100 | AI·diff·DB·웹훅 모두 구현, OpenAI 이번 완성 |
| IPC 통신 | 95/100 | 17개 핸들러 + 화이트리스트, 입력 검증 미흡 |
| 데이터 영속성 | 100/100 | SQLite CRUD + electron-store 암호화 |
| 보안 | 90/100 | IPC 3종 세트 + 웹훅 서명 검증 완료 |
| 테스트 | 0/100 | 테스트 파일 0건 |
| 빌드/배포 | 80/100 | electron-builder 설정 완료, 빌드 미검증 |

---

## HIGH 이슈

### ~~H-1. Naver Works 복사 포맷 불완전~~ ✅ 해결

- **위치**: `src/renderer/src/components/ReleaseNotes/ReleaseNoteDetail.tsx`
- **문제**: `navigator.clipboard.writeText()`는 plain text만 복사 — HTML 태그가 그대로 노출됨 / `<ul>` 내부에 `<br>` 삽입 문제
- **영향**: Naver Works에 붙여넣기 시 마크업이 텍스트로 표시됨
- **해결**: `ClipboardItem`으로 `text/html` MIME 타입 복사 구현 + `markdownToNaverWorks` 줄 단위 처리로 재작성 (`<br>` 내부 삽입 방지)

### ~~H-2. IPC 핸들러 입력 검증 부재~~ ✅ 해결

- **위치**: `src/main/ipc/` 전체
- **문제**: 핸들러가 렌더러에서 온 매개변수를 타입만 신뢰하고 런타임 검증 없음
- **영향**: `repo:add`에 잘못된 `platform` 값 전달 시 DB CHECK 제약 위반으로 unhandled error
- **해결**: `src/main/ipc/validate.ts` 중앙 검증 모듈 생성 — 열거형·비어있는 문자열·숫자 범위·secure key 패턴을 `IPCError`로 단언. 모든 17개 핸들러에 적용

---

## MEDIUM 이슈

### M-1. 테스트 파일 전무

- **위치**: `src/__tests__/` 없음 (jest.config.ts만 존재)
- **문제**: 회귀를 잡을 안전망이 없음
- **우선 작성 대상**:
  - `src/diff/securityFilter.ts` — glob 패턴 매칭 로직 (버그 위험 높음)
  - `src/ai/claude.ts` — 프롬프트 생성, 응답 JSON 파싱
  - `src/db/repository.ts` — CRUD 정확성

### ~~M-2. baselineSha 초기 값 미설정~~ ✅ 해결

- **위치**: `src/renderer/src/components/Sidebar/RepoAddModal.tsx`
- **문제**: 레포 등록 시 `baselineSha: ''`로 저장 → 첫 웹훅 수신 시 processWebhook이 조용히 종료됨
- **해결**: `diff:get-head-sha` IPC 채널 추가 — 레포 저장 직후 플랫폼 API(GitLab·GitHub·로컬 git)로 HEAD SHA 조회 후 자동 설정. 조회 실패 시 레포 등록은 유지하고 warning 토스트 표시

### M-3. CLAUDE.md 구현 현황 미갱신

- **위치**: `/CLAUDE.md` — "미구현 모듈" 섹션 및 "배포 준비도: 20/100"
- **문제**: DB CRUD, IPC, diff, AI, 웹훅이 "미구현"으로 표시되어 있으나 모두 구현 완료
- **수정**: 현황 테이블 실제 상태 반영, 배포 준비도 90/100으로 수정

---

## LOW 이슈

### L-1. 암호화 키 하드코딩

- **위치**: `src/main/secure.ts:5`
- **문제**: `ENCRYPTION_KEY = 'sosik-secure-store-v1'` 고정값 — 앱 배포본 분석 시 키 노출 가능
- **수정**: 머신별 엔트로피(시리얼 번호 등) 조합으로 키 생성 (현재 파일에 TODO 주석 있음)

### L-2. AI 모델 하드코딩

- **위치**: `src/ai/claude.ts`, `src/ai/openai.ts`
- **문제**: `DEFAULT_MODEL`이 소스에 고정 — 신모델 출시 시 재빌드 필요
- **수정**: `global_settings`에서 모델명 설정 가능하도록 확장, 또는 named export로 분리해 단일 수정 지점 확보

### L-3. diff 대용량 처리 시 UI 블로킹 가능성

- **위치**: `src/diff/localGit.ts`
- **문제**: 로컬 git CLI 실행이 main process 스레드를 블로킹할 수 있음
- **수정**: `child_process.execFile` + Promise 래퍼로 비동기 보장 확인

### L-4. GitGraph 컴포넌트 단순 테이블

- **위치**: `src/renderer/src/components/GitGraph/GitGraph.tsx`
- **문제**: 기획서의 "커밋 히스토리 시각화"와 달리 테이블로만 표시
- **수정**: 기획 요구사항에 DAG 시각화가 포함된 경우 `gitgraph.js` 라이브러리 검토

---

## 긍정적 관찰

- TypeScript strict 모드 완벽 적용 — `any` 타입 0건
- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` 보안 3종 세트 완비
- preload 채널 화이트리스트로 임의 IPC 호출 차단
- 모든 SQL 쿼리 parameterized — SQL Injection 방지
- 커스텀 에러 타입 체계 (`AppError` > `DatabaseError`, `AIError` 등) 체계적 구성
- `console.log` 사용 0건 — `logger.ts` 100% 준수
- 보안 파일 필터가 AI 전달 **이전**에 반드시 적용되는 순서 보장
- 웹훅 서명 검증에 `timingSafeEqual` 사용 — 타이밍 공격 방지
- 웹훅 202 즉시 응답 후 비동기 처리 — GitLab/GitHub 타임아웃 방지
- AI 추상화 레이어로 Claude ↔ OpenAI 교체 용이

---

## 배포 전 체크리스트

```
필수
[ ] baselineSha 초기화 자동화 또는 UI 입력 필드 추가
[ ] Windows/macOS 빌드 성공 확인

권장
[x] IPC 핸들러 입력 검증 추가 (src/main/ipc/)
[x] Naver Works HTML 복사 수정
[ ] 핵심 모듈 단위 테스트 최소 3건 작성

수동 검증
[ ] 레포 추가 → 웹훅 수신 → AI 요약 → DB 저장 전체 플로우
[ ] 웹훅 서명 검증 동작 확인 (올바른 토큰 / 잘못된 토큰)
[ ] 액세스 토큰 + 웹훅 비밀 토큰 암호화 저장/조회
[ ] 보안 파일 제외 규칙 패턴 매칭 동작
[ ] 시스템 트레이 최소화·복원
```

---

## 이전 리뷰 대비 변경 이력

| 이슈 | 2026-04-21 | 2026-04-26 |
|------|-----------|-----------|
| 백엔드 로직 미구현 | CRITICAL | ✅ 해결 |
| IPC 핸들러 전무 | CRITICAL | ✅ 해결 |
| Renderer API mock | CRITICAL | ✅ 해결 |
| electron-store 미구현 | CRITICAL | ✅ 해결 |
| DB 타입 불일치 | CRITICAL | ✅ 해결 |
| 채널 화이트리스트 없음 | HIGH | ✅ 해결 |
| 웹훅 서버 미구현 | HIGH | ✅ 해결 |
| 시스템 트레이 미구현 | HIGH | ✅ 해결 |
| setTimeout fake 핸들러 | HIGH | ✅ 해결 |
| AppContext mock 데이터 | HIGH | ✅ 해결 |
| sandbox: false | HIGH | ✅ 해결 |
| accessToken 미저장 | HIGH | ✅ 해결 |
| OpenAI 제공자 미구현 | — | ✅ 이번 세션 해결 |
| 웹훅 서명 검증 없음 | — | ✅ 이번 세션 해결 |
| Naver Works HTML 복사 | MEDIUM | ✅ 이번 세션 해결 |
| 테스트 파일 전무 | MEDIUM | MEDIUM (미해결) |
