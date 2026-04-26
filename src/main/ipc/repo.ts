import { ipcMain } from 'electron'
import { getAllRepos, addRepo, updateRepoSettings, deleteRepo } from '../../db/repository'
import { logger } from '../../shared/logger'
import { validateRepo, validateRepoPatch, assertNonEmptyString } from './validate'

export function registerRepoHandlers(): void {
  ipcMain.handle('repo:get-all', () => {
    logger.debug('IPC repo:get-all')
    return getAllRepos()
  })

  ipcMain.handle('repo:add', (_event, repo: unknown) => {
    validateRepo(repo)
    logger.debug('IPC repo:add', { id: repo.id, name: repo.name })
    return addRepo(repo)
  })

  ipcMain.handle('repo:update-settings', (_event, id: unknown, patch: unknown) => {
    assertNonEmptyString(id, 'id')
    validateRepoPatch(patch)
    logger.debug('IPC repo:update-settings', { id })
    updateRepoSettings(id, patch)
  })

  ipcMain.handle('repo:delete', (_event, id: unknown) => {
    assertNonEmptyString(id, 'id')
    logger.debug('IPC repo:delete', { id })
    deleteRepo(id)
  })
}
