/** 지원하는 git 플랫폼 */
export type Platform = 'gitlab' | 'github'

/** diff 추출 방식 */
export type DiffSource = 'api' | 'local-git'

/** AI 제공자 */
export type AIProvider = 'claude' | 'openai'

/** 요약 언어 */
export type SummaryLanguage = 'ko' | 'en'

/** 레포지토리 */
export interface Repository {
  id: number
  name: string
  platform: Platform
  repoUrl: string
  diffSource: DiffSource
  /** 액세스 토큰 (encrypted) */
  accessToken: string
  /** 보안 제외 파일 패턴 목록 (레포별 독립) */
  excludePatterns: string[]
  /** 요약 언어 (레포별 독립) */
  summaryLanguage: SummaryLanguage
  createdAt: string
  updatedAt: string
}

/** 릴리즈 노트 초안 */
export interface ReleaseNote {
  id: number
  repositoryId: number
  title: string
  content: string
  fromRef: string
  toRef: string
  createdAt: string
  updatedAt: string
}

/** 전역 앱 설정 */
export interface AppSettings {
  aiProvider: AIProvider
  /** AI API Key (encrypted) */
  aiApiKey: string
  /** Naver Works API Key (encrypted) */
  naverWorksApiKey?: string
}
