export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private format(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    return JSON.stringify({
      timestamp,
      level: level.toUpperCase(),
      message,
      ...(context || {}),
    });
  }

  info(message: string, context?: LogContext) {
    console.log(this.format('info', message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.format('warn', message, context));
  }

  error(message: string, context?: LogContext) {
    console.error(this.format('error', message, context));
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.format('debug', message, context));
    }
  }
}

export const logger = new Logger();
