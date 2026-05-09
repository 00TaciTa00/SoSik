/**
 * IPC 핸들러 입력 검증 유틸
 *
 * 렌더러에서 전달된 값은 TypeScript 타입이 런타임에 보장되지 않으므로
 * 열거형·비어있는 문자열·숫자 범위를 직접 검사합니다.
 *
 * 검증 실패 시 모두 IPCError를 throw하여 핸들러 밖으로 전파합니다.
 */

import { IPCError } from '../../shared/error'
import type {
  Repository,
  GlobalSettings,
  Platform,
  DiffSource,
  AIProvider,
  SummaryLanguage,
  SummaryStyle,
} from '../../shared/types'

// ── 허용값 목록 ──────────────────────────────────────────────────────────────

const VALID_PLATFORMS: readonly Platform[] = ['gitlab', 'github']
const VALID_DIFF_SOURCES: readonly DiffSource[] = ['api', 'local-git']
const VALID_AI_PROVIDERS: readonly AIProvider[] = ['claude', 'openai']
const VALID_SUMMARY_LANGUAGES: readonly SummaryLanguage[] = ['ko', 'en', 'both']
const VALID_SUMMARY_STYLES: readonly SummaryStyle[] = ['detailed', 'concise', 'technical']
const VALID_APP_LANGUAGES = ['ko', 'en'] as const
const VALID_APP_THEMES = ['light', 'dark'] as const

// secure 키는 영문·숫자·콜론·언더스코어·하이픈만 허용 (임의 경로 주입 방지)
const SECURE_KEY_PATTERN = /^[a-zA-Z0-9_:/-]+$/

// ── 기본 단언 헬퍼 ────────────────────────────────────────────────────────────

function assertNonEmptyString(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new IPCError(`${field}은(는) 비어 있을 수 없습니다`)
  }
}

function assertPositiveInt(value: unknown, field: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new IPCError(`${field}은(는) 양의 정수여야 합니다: ${String(value)}`)
  }
}

function assertEnum<T extends string>(
  value: unknown,
  field: string,
  valid: readonly T[]
): asserts value is T {
  if (!valid.includes(value as T)) {
    throw new IPCError(
      `유효하지 않은 ${field}: "${String(value)}". 허용값: ${valid.join(', ')}`
    )
  }
}

// ── 도메인 검증 함수 ──────────────────────────────────────────────────────────

/** repo:add — Repository 전체 검증 */
export function validateRepo(repo: unknown): asserts repo is Repository {
  if (typeof repo !== 'object' || repo === null) {
    throw new IPCError('레포지토리 데이터가 객체가 아닙니다')
  }
  const r = repo as Record<string, unknown>
  assertNonEmptyString(r.id, 'id')
  assertNonEmptyString(r.name, 'name')
  assertEnum(r.platform, 'platform', VALID_PLATFORMS)
  assertEnum(r.diffSource, 'diffSource', VALID_DIFF_SOURCES)
  // local-git 방식은 repoUrl이 없어도 됨 — api 방식만 필수
  if (r.diffSource !== 'local-git') {
    assertNonEmptyString(r.repoUrl, 'repoUrl')
  }
  assertEnum(r.aiProvider, 'aiProvider', VALID_AI_PROVIDERS)
  assertEnum(r.summaryLanguage, 'summaryLanguage', VALID_SUMMARY_LANGUAGES)
  assertEnum(r.summaryStyle, 'summaryStyle', VALID_SUMMARY_STYLES)
}

/** repo:update-settings — 존재하는 필드만 검증 */
export function validateRepoPatch(patch: unknown): asserts patch is Partial<Repository> {
  if (typeof patch !== 'object' || patch === null) {
    throw new IPCError('레포 패치 데이터가 객체가 아닙니다')
  }
  const p = patch as Record<string, unknown>
  if ('aiProvider' in p)      assertEnum(p.aiProvider, 'aiProvider', VALID_AI_PROVIDERS)
  if ('summaryLanguage' in p) assertEnum(p.summaryLanguage, 'summaryLanguage', VALID_SUMMARY_LANGUAGES)
  if ('summaryStyle' in p)    assertEnum(p.summaryStyle, 'summaryStyle', VALID_SUMMARY_STYLES)
}

/** settings:update — 존재하는 필드만 검증 */
export function validateSettingsPatch(patch: unknown): asserts patch is Partial<GlobalSettings> {
  if (typeof patch !== 'object' || patch === null) {
    throw new IPCError('설정 패치 데이터가 객체가 아닙니다')
  }
  const p = patch as Record<string, unknown>
  if ('appLanguage' in p) assertEnum(p.appLanguage, 'appLanguage', VALID_APP_LANGUAGES)
  if ('appTheme' in p)    assertEnum(p.appTheme, 'appTheme', VALID_APP_THEMES)
  if ('webhookPort' in p) {
    const port = p.webhookPort
    if (typeof port !== 'number' || !Number.isInteger(port) || port < 1 || port > 65535) {
      throw new IPCError(`webhookPort는 1–65535 사이의 정수여야 합니다: ${String(port)}`)
    }
  }
}

/** secure:get-api-key / secure:set-api-key — 키 패턴 검증 */
export function validateSecureKey(key: unknown): asserts key is string {
  assertNonEmptyString(key, 'key')
  if (!SECURE_KEY_PATTERN.test(key)) {
    throw new IPCError(`허용되지 않는 문자가 포함된 secure key: ${key}`)
  }
}

/** security-rule:remove — id 검증 (양의 정수) */
export { assertPositiveInt as validateRuleId }

/** security-rule:add — pattern 검증 */
export function validateSecurityPattern(pattern: unknown): asserts pattern is string {
  assertNonEmptyString(pattern, 'pattern')
}

/** 공통 — repoId / id 검증 */
export { assertNonEmptyString, assertPositiveInt }
