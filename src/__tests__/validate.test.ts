import {
  validateRepo,
  validateRepoPatch,
  validateSettingsPatch,
  validateSecureKey,
  validateSecurityPattern,
  assertNonEmptyString,
  assertPositiveInt,
} from '../main/ipc/validate'
import { IPCError } from '../shared/error'

// ── assertNonEmptyString ──────────────────────────────────────────────────────

describe('assertNonEmptyString', () => {
  it('정상 문자열은 통과한다', () => {
    expect(() => assertNonEmptyString('hello', 'field')).not.toThrow()
  })

  it('빈 문자열은 IPCError를 던진다', () => {
    expect(() => assertNonEmptyString('', 'field')).toThrow(IPCError)
  })

  it('공백만 있는 문자열은 IPCError를 던진다', () => {
    expect(() => assertNonEmptyString('   ', 'field')).toThrow(IPCError)
  })

  it('undefined는 IPCError를 던진다', () => {
    expect(() => assertNonEmptyString(undefined, 'field')).toThrow(IPCError)
  })

  it('null은 IPCError를 던진다', () => {
    expect(() => assertNonEmptyString(null, 'field')).toThrow(IPCError)
  })

  it('숫자는 IPCError를 던진다', () => {
    expect(() => assertNonEmptyString(42, 'field')).toThrow(IPCError)
  })
})

// ── assertPositiveInt ─────────────────────────────────────────────────────────

describe('assertPositiveInt', () => {
  it('양의 정수는 통과한다', () => {
    expect(() => assertPositiveInt(1, 'id')).not.toThrow()
    expect(() => assertPositiveInt(999, 'id')).not.toThrow()
  })

  it('0은 IPCError를 던진다', () => {
    expect(() => assertPositiveInt(0, 'id')).toThrow(IPCError)
  })

  it('음수는 IPCError를 던진다', () => {
    expect(() => assertPositiveInt(-1, 'id')).toThrow(IPCError)
  })

  it('소수는 IPCError를 던진다', () => {
    expect(() => assertPositiveInt(1.5, 'id')).toThrow(IPCError)
  })

  it('문자열 숫자는 IPCError를 던진다', () => {
    expect(() => assertPositiveInt('1', 'id')).toThrow(IPCError)
  })
})

// ── validateRepo ──────────────────────────────────────────────────────────────

const validRepo = {
  id: 'repo-001',
  name: 'My Repo',
  platform: 'gitlab' as const,
  diffSource: 'api' as const,
  repoUrl: 'https://gitlab.com/org/repo',
  aiProvider: 'claude' as const,
  summaryLanguage: 'ko' as const,
  summaryStyle: 'detailed' as const,
  baselineSha: '',
  displayOrder: 0,
  createdAt: '2026-05-01T00:00:00Z',
  updatedAt: '2026-05-01T00:00:00Z',
}

describe('validateRepo', () => {
  it('유효한 레포 객체는 통과한다', () => {
    expect(() => validateRepo(validRepo)).not.toThrow()
  })

  it('null이면 IPCError를 던진다', () => {
    expect(() => validateRepo(null)).toThrow(IPCError)
  })

  it('id가 빈 문자열이면 IPCError를 던진다', () => {
    expect(() => validateRepo({ ...validRepo, id: '' })).toThrow(IPCError)
  })

  it('platform이 잘못된 값이면 IPCError를 던진다', () => {
    expect(() => validateRepo({ ...validRepo, platform: 'bitbucket' })).toThrow(IPCError)
  })

  it('diffSource가 잘못된 값이면 IPCError를 던진다', () => {
    expect(() => validateRepo({ ...validRepo, diffSource: 'webhook' })).toThrow(IPCError)
  })

  it('aiProvider가 잘못된 값이면 IPCError를 던진다', () => {
    expect(() => validateRepo({ ...validRepo, aiProvider: 'gemini' })).toThrow(IPCError)
  })

  it('summaryLanguage가 잘못된 값이면 IPCError를 던진다', () => {
    expect(() => validateRepo({ ...validRepo, summaryLanguage: 'ja' })).toThrow(IPCError)
  })

  it('summaryStyle이 잘못된 값이면 IPCError를 던진다', () => {
    expect(() => validateRepo({ ...validRepo, summaryStyle: 'brief' })).toThrow(IPCError)
  })

  it('platform=github도 통과한다', () => {
    expect(() => validateRepo({ ...validRepo, platform: 'github' })).not.toThrow()
  })

  it('diffSource=local-git + repoUrl 빈 문자열도 통과한다', () => {
    expect(() =>
      validateRepo({ ...validRepo, diffSource: 'local-git', repoUrl: '' })
    ).not.toThrow()
  })

  it('diffSource=api + repoUrl 빈 문자열은 IPCError를 던진다', () => {
    expect(() =>
      validateRepo({ ...validRepo, diffSource: 'api', repoUrl: '' })
    ).toThrow(IPCError)
  })
})

// ── validateRepoPatch ─────────────────────────────────────────────────────────

describe('validateRepoPatch', () => {
  it('빈 객체는 통과한다', () => {
    expect(() => validateRepoPatch({})).not.toThrow()
  })

  it('유효한 aiProvider만 있으면 통과한다', () => {
    expect(() => validateRepoPatch({ aiProvider: 'openai' })).not.toThrow()
  })

  it('잘못된 aiProvider면 IPCError를 던진다', () => {
    expect(() => validateRepoPatch({ aiProvider: 'gemini' })).toThrow(IPCError)
  })

  it('잘못된 summaryStyle이면 IPCError를 던진다', () => {
    expect(() => validateRepoPatch({ summaryStyle: 'verbose' })).toThrow(IPCError)
  })

  it('null이면 IPCError를 던진다', () => {
    expect(() => validateRepoPatch(null)).toThrow(IPCError)
  })
})

// ── validateSettingsPatch ─────────────────────────────────────────────────────

describe('validateSettingsPatch', () => {
  it('빈 객체는 통과한다', () => {
    expect(() => validateSettingsPatch({})).not.toThrow()
  })

  it('유효한 appLanguage는 통과한다', () => {
    expect(() => validateSettingsPatch({ appLanguage: 'en' })).not.toThrow()
  })

  it('잘못된 appLanguage면 IPCError를 던진다', () => {
    expect(() => validateSettingsPatch({ appLanguage: 'ja' })).toThrow(IPCError)
  })

  it('유효한 webhookPort는 통과한다', () => {
    expect(() => validateSettingsPatch({ webhookPort: 8080 })).not.toThrow()
    expect(() => validateSettingsPatch({ webhookPort: 1 })).not.toThrow()
    expect(() => validateSettingsPatch({ webhookPort: 65535 })).not.toThrow()
  })

  it('webhookPort가 0이면 IPCError를 던진다', () => {
    expect(() => validateSettingsPatch({ webhookPort: 0 })).toThrow(IPCError)
  })

  it('webhookPort가 65536이면 IPCError를 던진다', () => {
    expect(() => validateSettingsPatch({ webhookPort: 65536 })).toThrow(IPCError)
  })

  it('webhookPort가 소수면 IPCError를 던진다', () => {
    expect(() => validateSettingsPatch({ webhookPort: 8080.5 })).toThrow(IPCError)
  })

  it('잘못된 appTheme이면 IPCError를 던진다', () => {
    expect(() => validateSettingsPatch({ appTheme: 'blue' })).toThrow(IPCError)
  })
})

// ── validateSecureKey ─────────────────────────────────────────────────────────

describe('validateSecureKey', () => {
  it('정상 키 형식은 통과한다', () => {
    expect(() => validateSecureKey('repo:abc-123:access_token')).not.toThrow()
    expect(() => validateSecureKey('claudeApiKey')).not.toThrow()
    expect(() => validateSecureKey('openaiApiKey')).not.toThrow()
  })

  it('빈 문자열은 IPCError를 던진다', () => {
    expect(() => validateSecureKey('')).toThrow(IPCError)
  })

  it('허용되지 않는 문자(@)가 있으면 IPCError를 던진다', () => {
    expect(() => validateSecureKey('repo@id')).toThrow(IPCError)
  })

  it('경로 트래버설 시도는 IPCError를 던진다', () => {
    expect(() => validateSecureKey('../etc/passwd')).toThrow(IPCError)
  })
})

// ── validateSecurityPattern ───────────────────────────────────────────────────

describe('validateSecurityPattern', () => {
  it('정상 패턴은 통과한다', () => {
    expect(() => validateSecurityPattern('**/.env')).not.toThrow()
    expect(() => validateSecurityPattern('*.pem')).not.toThrow()
    expect(() => validateSecurityPattern('secrets/**')).not.toThrow()
  })

  it('빈 문자열은 IPCError를 던진다', () => {
    expect(() => validateSecurityPattern('')).toThrow(IPCError)
  })

  it('공백만 있는 문자열은 IPCError를 던진다', () => {
    expect(() => validateSecurityPattern('   ')).toThrow(IPCError)
  })
})
