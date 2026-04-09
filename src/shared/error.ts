/** 앱 전역 커스텀 에러 base class */
export class AppError extends Error {
  public readonly code: string

  constructor(message: string, code: string) {
    super(message)
    this.name = 'AppError'
    this.code = code
    // Error 상속 시 prototype chain 복구
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

/** SQLite 관련 에러 */
export class DatabaseError extends AppError {
  constructor(message: string, public readonly query?: string) {
    super(message, 'DATABASE_ERROR')
    this.name = 'DatabaseError'
  }
}

/** AI 제공자 호출 에러 */
export class AIError extends AppError {
  constructor(
    message: string,
    public readonly provider?: string,
    public readonly statusCode?: number
  ) {
    super(message, 'AI_ERROR')
    this.name = 'AIError'
  }
}

/** git diff 추출 에러 */
export class DiffError extends AppError {
  constructor(message: string, public readonly repoUrl?: string) {
    super(message, 'DIFF_ERROR')
    this.name = 'DiffError'
  }
}

/** IPC 통신 에러 */
export class IPCError extends AppError {
  constructor(message: string, public readonly channel?: string) {
    super(message, 'IPC_ERROR')
    this.name = 'IPCError'
  }
}

/** 설정 관련 에러 */
export class ConfigError extends AppError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR')
    this.name = 'ConfigError'
  }
}
