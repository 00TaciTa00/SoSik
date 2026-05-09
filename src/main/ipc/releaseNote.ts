import { ipcMain } from 'electron'
import { getNotesByRepo, updateNote } from '../../db/releaseNote'
import { logger } from '../../shared/logger'
import { IPCError } from '../../shared/error'
import { assertNonEmptyString, assertPositiveInt } from './validate'

export function registerReleaseNoteHandlers(): void {
  ipcMain.handle('release-note:get-by-repo', (_event, repoId: unknown) => {
    assertNonEmptyString(repoId, 'repoId')
    logger.debug('IPC release-note:get-by-repo', { repoId })
    return getNotesByRepo(repoId)
  })

  ipcMain.handle('release-note:update', (_event, id: unknown, patch: unknown) => {
    assertPositiveInt(id, 'id')
    if (typeof patch !== 'object' || patch === null) {
      throw new IPCError('patch가 객체가 아닙니다')
    }
    logger.debug('IPC release-note:update', { id })
    updateNote(id, patch as Parameters<typeof updateNote>[1])
  })
}
