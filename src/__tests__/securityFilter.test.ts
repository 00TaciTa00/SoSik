import { applySecurityFilter } from '../diff/securityFilter'

// 보안 필터 테스트에 쓸 최소 diff 블록 생성 헬퍼
function makeDiffBlock(filePath: string, content = '+some change'): string {
  return `diff --git a/${filePath} b/${filePath}\n--- a/${filePath}\n+++ b/${filePath}\n@@ -1 +1 @@\n${content}\n`
}

describe('applySecurityFilter', () => {
  describe('패턴 없음', () => {
    it('패턴 배열이 비어 있으면 diff를 그대로 반환한다', () => {
      const diff = makeDiffBlock('src/index.ts')
      expect(applySecurityFilter(diff, [])).toBe(diff)
    })
  })

  describe('*.ext 패턴 (슬래시 제외)', () => {
    it('*.env 패턴이 .env 파일을 제거한다', () => {
      const safe = makeDiffBlock('src/index.ts')
      const sensitive = makeDiffBlock('.env')
      const result = applySecurityFilter(safe + sensitive, ['*.env'])
      expect(result).toContain('src/index.ts')
      expect(result).not.toContain('.env\n')
    })

    it('*.pem 패턴이 하위 디렉토리의 pem 파일을 제거한다 (basename 매칭)', () => {
      const sensitive = makeDiffBlock('certs/server.pem')
      const result = applySecurityFilter(sensitive, ['*.pem'])
      expect(result.trim()).toBe('')
    })

    it('*.pem 패턴이 .ts 파일은 제거하지 않는다', () => {
      const safe = makeDiffBlock('src/utils.ts')
      const result = applySecurityFilter(safe, ['*.pem'])
      expect(result).toContain('src/utils.ts')
    })
  })

  describe('**/ 패턴 (경로 접두사 포함)', () => {
    it('**/.env 패턴이 루트 및 중첩 .env 파일을 제거한다', () => {
      const root = makeDiffBlock('.env')
      const nested = makeDiffBlock('packages/api/.env')
      const safe = makeDiffBlock('src/env.ts')
      const result = applySecurityFilter(root + nested + safe, ['**/.env'])
      expect(result).not.toContain('b/.env\n')
      expect(result).not.toContain('packages/api/.env')
      expect(result).toContain('src/env.ts')
    })
  })

  describe('prefix/** 패턴 (디렉토리 전체)', () => {
    it('secrets/** 패턴이 secrets/ 아래 모든 파일을 제거한다', () => {
      const secret1 = makeDiffBlock('secrets/db_password.txt')
      const secret2 = makeDiffBlock('secrets/nested/key.json')
      const safe = makeDiffBlock('src/config.ts')
      const result = applySecurityFilter(secret1 + secret2 + safe, ['secrets/**'])
      expect(result).not.toContain('secrets/')
      expect(result).toContain('src/config.ts')
    })
  })

  describe('여러 패턴', () => {
    it('여러 패턴 중 하나라도 매칭되면 제거한다', () => {
      const env = makeDiffBlock('.env')
      const pem = makeDiffBlock('cert.pem')
      const safe = makeDiffBlock('src/main.ts')
      const result = applySecurityFilter(env + pem + safe, ['*.env', '*.pem'])
      expect(result).not.toContain('.env\n')
      expect(result).not.toContain('cert.pem')
      expect(result).toContain('src/main.ts')
    })
  })

  describe('? 와일드카드', () => {
    it('?.txt 패턴이 단일 문자 이름의 txt 파일을 제거한다', () => {
      const sensitive = makeDiffBlock('a.txt')
      const safe = makeDiffBlock('ab.txt')
      const result = applySecurityFilter(sensitive + safe, ['?.txt'])
      expect(result).not.toContain('b/a.txt')
      expect(result).toContain('ab.txt')
    })
  })

  describe('diff 없는 입력', () => {
    it('빈 문자열에 패턴을 적용해도 빈 문자열을 반환한다', () => {
      expect(applySecurityFilter('', ['*.env'])).toBe('')
    })

    it('diff --git 헤더가 없는 비표준 텍스트는 제거하지 않는다', () => {
      const text = 'some random text\nwithout git header\n'
      expect(applySecurityFilter(text, ['*.env'])).toBe(text)
    })
  })

  describe('특수문자 포함 파일명', () => {
    it('파일명에 점(.)이 있어도 정상 매칭한다', () => {
      const sensitive = makeDiffBlock('config/.env.local')
      const result = applySecurityFilter(sensitive, ['*.env.local'])
      expect(result.trim()).toBe('')
    })
  })
})
