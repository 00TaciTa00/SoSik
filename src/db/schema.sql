-- Sosik SQLite Schema
-- 민감 정보(API Key, Access Token, Webhook Secret)는 electron-store에 별도 저장

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ============================================================
-- repositories
-- 레포지토리 목록 및 레포별 설정
-- id = UUID v4 (웹훅 경로 /webhook/{id} 에 노출되므로 예측 불가 값 사용)
-- ============================================================
CREATE TABLE IF NOT EXISTS repositories (
  id               TEXT    PRIMARY KEY,
  name             TEXT    NOT NULL,
  -- 등록 후 읽기 전용
  platform         TEXT    NOT NULL CHECK (platform IN ('gitlab', 'github')),
  diff_source      TEXT    NOT NULL CHECK (diff_source IN ('api', 'local_git')),
  repo_url         TEXT    NOT NULL,
  -- diff_source = 'local_git' 일 때만 사용
  local_path       TEXT,
  -- 레포별 AI/요약 설정 (수정 가능)
  ai_provider      TEXT    NOT NULL DEFAULT 'claude'   CHECK (ai_provider IN ('claude', 'gpt')),
  summary_language TEXT    NOT NULL DEFAULT 'ko'       CHECK (summary_language IN ('ko', 'en', 'both')),
  summary_style    TEXT    NOT NULL DEFAULT 'detailed' CHECK (summary_style IN ('detailed', 'concise', 'technical')),
  -- 다음 diff 시작 기준 SHA
  -- 등록 시 origin/main HEAD로 초기화, 릴리즈 노트 생성 후 to_sha로 갱신
  baseline_sha     TEXT,
  display_order    INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- security_exclusion_rules
-- 보안 파일 제외 규칙 (레포별 완전 독립)
-- ============================================================
CREATE TABLE IF NOT EXISTS security_exclusion_rules (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  repo_id    TEXT    NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  pattern    TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_security_rules_repo
  ON security_exclusion_rules(repo_id);

-- ============================================================
-- release_notes
-- AI 원본 초안 + 사용자 편집본
-- 한국어/영어 독립 컬럼 — summary_language 설정에 따라 일부 NULL
-- ============================================================
CREATE TABLE IF NOT EXISTS release_notes (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  repo_id      TEXT    NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  from_sha     TEXT    NOT NULL,  -- diff 시작 커밋 SHA
  to_sha       TEXT    NOT NULL,  -- diff 끝 커밋 SHA (HEAD)
  version_tag  TEXT,              -- Git 태그 (없으면 NULL)
  raw_diff     TEXT    NOT NULL,  -- 보안 제외 적용 후 원본 diff
  -- AI 원본 (불변 보존)
  ai_draft_ko  TEXT,
  ai_draft_en  TEXT,
  -- 사용자 편집본 (편집 전 NULL)
  edited_ko    TEXT,
  edited_en    TEXT,
  -- 변경 유형: JSON 배열 ["bug_fix","feature","ui","performance"]
  change_types TEXT,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_release_notes_repo
  ON release_notes(repo_id);

-- 목록 조회: 레포별 최신순 정렬 최적화
CREATE INDEX IF NOT EXISTS idx_release_notes_created
  ON release_notes(repo_id, created_at DESC);

-- ============================================================
-- global_settings
-- 전역 비민감 설정 (key-value)
-- 민감 정보는 electron-store에 저장:
--   claude_api_key, openai_api_key, naver_works_api_key
--   webhook_secret_token
--   repo:{uuid}:access_token
-- ============================================================
CREATE TABLE IF NOT EXISTS global_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 초기 기본값
INSERT OR IGNORE INTO global_settings (key, value) VALUES
  ('app_language',    'ko'),
  ('app_theme',       'light'),
  ('startup_launch',  'false'),
  ('webhook_enabled', 'false'),
  ('webhook_port',    '45678');
