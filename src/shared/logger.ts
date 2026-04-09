type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: unknown
}

function formatTimestamp(): string {
  return new Date().toISOString()
}

function formatMessage(entry: LogEntry): string {
  const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`
  if (entry.context !== undefined) {
    return `${base} ${JSON.stringify(entry.context)}`
  }
  return base
}

function log(level: LogLevel, message: string, context?: unknown): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: formatTimestamp(),
    context
  }

  const formatted = formatMessage(entry)

  switch (level) {
    case 'debug':
      // 개발 환경에서만 출력
      if (process.env.NODE_ENV === 'development') {
        process.stderr.write(formatted + '\n')
      }
      break
    case 'info':
      process.stdout.write(formatted + '\n')
      break
    case 'warn':
      process.stderr.write(formatted + '\n')
      break
    case 'error':
      process.stderr.write(formatted + '\n')
      break
  }
}

export const logger = {
  debug: (message: string, context?: unknown): void => log('debug', message, context),
  info: (message: string, context?: unknown): void => log('info', message, context),
  warn: (message: string, context?: unknown): void => log('warn', message, context),
  error: (message: string, context?: unknown): void => log('error', message, context)
}
