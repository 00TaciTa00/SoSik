import { contextBridge, ipcRenderer } from 'electron'

// TODO: IPC 채널 정의 후 아래 API를 확장할 것
// 각 기능 모듈(db, ai, diff)에서 IPC 핸들러 등록 시 여기에 대응하는 API 추가

const api = {
  // 예시: invoke('channel-name', ...args)
  invoke: (channel: string, ...args: unknown[]): Promise<unknown> => {
    return ipcRenderer.invoke(channel, ...args)
  },
  on: (channel: string, callback: (...args: unknown[]) => void): (() => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, ...args: unknown[]): void =>
      callback(...args)
    ipcRenderer.on(channel, subscription)
    return () => {
      ipcRenderer.removeListener(channel, subscription)
    }
  }
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
