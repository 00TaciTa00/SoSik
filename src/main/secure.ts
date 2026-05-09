import Store from 'electron-store'
import * as os from 'os'
import * as crypto from 'crypto'
import { logger } from '../shared/logger'

/**
 * 머신+계정별 고유 암호화 키를 파생합니다.
 *
 * hostname과 username을 조합한 해시를 사용하므로
 * 다른 머신이나 계정에서 복사한 secure store는 복호화되지 않습니다.
 * 고정 문자열보다 실질적으로 안전합니다.
 *
 * 주의: 계정명이 변경되면 기존 저장 데이터에 접근 불가 — 설정 재입력 필요
 */
function deriveEncryptionKey(): string {
  const entropy = `${os.hostname()}:${os.userInfo().username}:sosik-store-v1`
  return crypto.createHash('sha256').update(entropy).digest('hex').substring(0, 32)
}

const ENCRYPTION_KEY = deriveEncryptionKey()

type SecureRecord = Record<string, string>

let _store: Store<SecureRecord> | null = null

function getStore(): Store<SecureRecord> {
  if (!_store) {
    _store = new Store<SecureRecord>({ encryptionKey: ENCRYPTION_KEY, name: 'secure' })
  }
  return _store
}

export function getSecureKey(key: string): string | undefined {
  try {
    return getStore().get(key) as string | undefined
  } catch (err) {
    logger.error('secure store 읽기 실패', { key, err: String(err) })
    return undefined
  }
}

export function setSecureKey(key: string, value: string): void {
  try {
    getStore().set(key, value)
  } catch (err) {
    logger.error('secure store 쓰기 실패', { key, err: String(err) })
    throw err
  }
}

export function deleteSecureKey(key: string): void {
  try {
    getStore().delete(key)
  } catch (err) {
    logger.error('secure store 삭제 실패', { key, err: String(err) })
  }
}
