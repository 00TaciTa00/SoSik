import { ipcMain } from 'electron'
import { getSettings, updateSettings } from '../../db/settings'
import { logger } from '../../shared/logger'
import { validateSettingsPatch } from './validate'

export function registerSettingsHandlers(): void {
  ipcMain.handle('settings:get', () => {
    logger.debug('IPC settings:get')
    return getSettings()
  })

  ipcMain.handle('settings:update', (_event, patch: unknown) => {
    validateSettingsPatch(patch)
    logger.debug('IPC settings:update')
    updateSettings(patch)
  })
}
