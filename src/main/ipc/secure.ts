import { ipcMain } from 'electron'
import { getSecureKey, setSecureKey } from '../secure'
import { logger } from '../../shared/logger'
import { validateSecureKey, assertNonEmptyString } from './validate'

export function registerSecureHandlers(): void {
  ipcMain.handle('secure:get-api-key', (_event, key: unknown) => {
    validateSecureKey(key)
    logger.debug('IPC secure:get-api-key', { key })
    return getSecureKey(key)
  })

  ipcMain.handle('secure:set-api-key', (_event, key: unknown, value: unknown) => {
    validateSecureKey(key)
    assertNonEmptyString(value, 'value')
    logger.debug('IPC secure:set-api-key', { key })
    setSecureKey(key, value)
  })
}
