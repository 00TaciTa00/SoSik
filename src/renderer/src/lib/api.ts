import type { Repository, ReleaseNote, GlobalSettings } from '../../../shared/types'

/** IPC 채널 래퍼 — 현재는 mock, IPC 구현 시 window.api.invoke로 교체 */
export const api = {
  repo: {
    getAll: (): Promise<Repository[]> => Promise.resolve([]),
    add: (_repo: Omit<Repository, 'id' | 'createdAt' | 'updatedAt'>): Promise<Repository> =>
      Promise.reject(new Error('ipc:repo:add not implemented')),
    updateSettings: (_id: string, _patch: Partial<Repository>): Promise<void> =>
      Promise.resolve(),
    delete: (_id: string): Promise<void> => Promise.resolve(),
  },

  releaseNote: {
    getByRepo: (_repoId: string): Promise<ReleaseNote[]> => Promise.resolve([]),
    update: (_id: number, _patch: Partial<ReleaseNote>): Promise<void> => Promise.resolve(),
  },

  settings: {
    get: (): Promise<GlobalSettings> =>
      Promise.resolve({
        appLanguage: 'ko',
        appTheme: 'light',
        startupLaunch: false,
        webhookEnabled: false,
        webhookPort: 45678,
      }),
    update: (_patch: Partial<GlobalSettings>): Promise<void> => Promise.resolve(),
  },

  diff: {
    check: (_repoId: string): Promise<{ hasNew: boolean; commitCount: number }> =>
      Promise.resolve({ hasNew: false, commitCount: 0 }),
    extract: (_repoId: string): Promise<string> => Promise.resolve(''),
  },

  ai: {
    generate: (_repoId: string, _diff: string): Promise<ReleaseNote> =>
      Promise.reject(new Error('ipc:ai:generate not implemented')),
  },

  secure: {
    getApiKey: (_key: string): Promise<string | undefined> => Promise.resolve(undefined),
    setApiKey: (_key: string, _value: string): Promise<void> => Promise.resolve(),
  },
}
