/**
 * Clo Widgets — Logger
 * Prefixed logging utility for structured debug output.
 */

const PREFIX = '[Clo Widgets]';

/**
 * Log an informational message.
 * @param  {...any} args
 */
export function info(...args) {
    console.log(`${PREFIX}`, ...args);
}

/**
 * Log a warning.
 * @param  {...any} args
 */
export function warn(...args) {
    console.warn(`${PREFIX} ⚠`, ...args);
}

/**
 * Log an error.
 * @param  {...any} args
 */
export function error(...args) {
    console.error(`${PREFIX} ✖`, ...args);
}

/**
 * Log a debug message (only visible in journal).
 * @param  {...any} args
 */
export function debug(...args) {
    console.log(`${PREFIX} 🐛`, ...args);
}
