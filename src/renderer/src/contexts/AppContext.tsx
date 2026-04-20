import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Repository, ReleaseNote, GlobalSettings } from '../../../shared/types'

interface AppContextValue {
  repos: Repository[]
  setRepos: (repos: Repository[]) => void
  selectedRepoId: string | null
  setSelectedRepoId: (id: string | null) => void
  selectedRepo: Repository | null
  releaseNotes: ReleaseNote[]
  setReleaseNotes: (notes: ReleaseNote[]) => void
  settings: GlobalSettings
  setSettings: (s: GlobalSettings) => void
  addRepo: (repo: Repository) => void
  deleteRepo: (id: string) => void
  updateRepo: (id: string, patch: Partial<Repository>) => void
}

const AppContext = createContext<AppContextValue | null>(null)

const MOCK_REPOS: Repository[] = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'frontend-service',
    platform: 'gitlab',
    diffSource: 'api',
    repoUrl: 'https://gitlab.com/example/frontend-service',
    aiProvider: 'claude',
    summaryLanguage: 'both',
    summaryStyle: 'detailed',
    baselineSha: 'abc1234',
    displayOrder: 0,
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z',
  },
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    name: 'backend-api',
    platform: 'github',
    diffSource: 'local-git',
    repoUrl: 'https://github.com/example/backend-api',
    localPath: '/home/user/projects/backend-api',
    aiProvider: 'claude',
    summaryLanguage: 'ko',
    summaryStyle: 'concise',
    baselineSha: 'def5678',
    displayOrder: 1,
    createdAt: '2026-04-02T00:00:00Z',
    updatedAt: '2026-04-15T00:00:00Z',
  },
]

const MOCK_RELEASE_NOTES: ReleaseNote[] = [
  {
    id: 1,
    repoId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    fromSha: 'abc1234',
    toSha: 'def5678',
    versionTag: 'v1.2.0',
    rawDiff: 'diff --git a/src/App.tsx b/src/App.tsx\n...',
    aiDraftKo: `## v1.2.0 업데이트 노트

### 기능 추가
- 사용자 알림 설정 기능 추가
- 다크모드 지원

### 버그 수정
- 로그인 세션 만료 시 올바르게 처리되지 않던 문제 수정
- 모바일 환경에서 레이아웃이 깨지는 문제 수정`,
    aiDraftEn: `## v1.2.0 Release Notes

### New Features
- Added user notification settings
- Dark mode support

### Bug Fixes
- Fixed session expiry handling on login
- Fixed layout issues on mobile`,
    changeTypes: ['feature', 'bug_fix'],
    createdAt: '2026-04-18T09:00:00Z',
    updatedAt: '2026-04-18T09:00:00Z',
  },
  {
    id: 2,
    repoId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    fromSha: 'def5678',
    toSha: 'ghi9012',
    versionTag: 'v1.1.5',
    rawDiff: 'diff --git a/src/components/Button.tsx...',
    aiDraftKo: `## v1.1.5 업데이트 노트

### UI 변경
- 버튼 컴포넌트 디자인 통일
- 폰트 크기 조정`,
    changeTypes: ['ui'],
    createdAt: '2026-04-10T14:30:00Z',
    updatedAt: '2026-04-10T14:30:00Z',
  },
]

const DEFAULT_SETTINGS: GlobalSettings = {
  appLanguage: 'ko',
  appTheme: 'light',
  startupLaunch: false,
  webhookEnabled: false,
  webhookPort: 45678,
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [repos, setRepos] = useState<Repository[]>(MOCK_REPOS)
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(MOCK_REPOS[0]?.id ?? null)
  const [releaseNotes, setReleaseNotes] = useState<ReleaseNote[]>(MOCK_RELEASE_NOTES)
  const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.appTheme)
  }, [settings.appTheme])

  const selectedRepo = repos.find((r) => r.id === selectedRepoId) ?? null

  function addRepo(repo: Repository) {
    setRepos((prev) => [...prev, repo])
    setSelectedRepoId(repo.id)
  }

  function deleteRepo(id: string) {
    setRepos((prev) => prev.filter((r) => r.id !== id))
    setSelectedRepoId((prev) => {
      if (prev === id) {
        const remaining = repos.filter((r) => r.id !== id)
        return remaining[0]?.id ?? null
      }
      return prev
    })
  }

  function updateRepo(id: string, patch: Partial<Repository>) {
    setRepos((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  return (
    <AppContext.Provider
      value={{
        repos,
        setRepos,
        selectedRepoId,
        setSelectedRepoId,
        selectedRepo,
        releaseNotes,
        setReleaseNotes,
        settings,
        setSettings,
        addRepo,
        deleteRepo,
        updateRepo,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
