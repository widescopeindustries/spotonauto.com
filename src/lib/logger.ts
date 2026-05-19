/**
 * Production-safe logger.
 * In development: logs to console.
 * In production: only errors are logged; warnings and info are suppressed
 * to prevent log spam and reduce noise in production.
 */

const IS_DEV = process.env.NODE_ENV === 'development';

export function logInfo(...args: unknown[]) {
  if (IS_DEV) console.log(...args);
}

export function logWarn(...args: unknown[]) {
  if (IS_DEV) console.warn(...args);
}

export function logError(...args: unknown[]) {
  console.error(...args);
}
