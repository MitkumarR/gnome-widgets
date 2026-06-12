/**
 * Clo Widgets — Helpers
 * Shared utility functions for reading system files and formatting values.
 */

import Gio from 'gi://Gio';

/**
 * Read a file synchronously and return its contents as a string.
 * Optimized for /proc virtual files (memory-backed, near-instant).
 * @param {string} path - Absolute file path
 * @returns {string|null} File contents or null on failure
 */
export function readFile(path) {
    try {
        const file = Gio.File.new_for_path(path);
        const [success, contents] = file.load_contents(null);
        if (success)
            return new TextDecoder().decode(contents);
        return null;
    } catch (e) {
        return null;
    }
}

/**
 * Format bytes into a human-readable string (KB, MB, GB).
 * @param {number} bytes
 * @param {number} [decimals=1]
 * @returns {string}
 */
export function formatBytes(bytes, decimals = 1) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
    const value = bytes / Math.pow(k, i);
    return `${value.toFixed(decimals)} ${units[i]}`;
}

/**
 * Format bytes-per-second into a human-readable speed string.
 * @param {number} bytesPerSec
 * @returns {string}
 */
export function formatSpeed(bytesPerSec) {
    if (bytesPerSec < 1024)
        return `${bytesPerSec.toFixed(0)} B/s`;
    if (bytesPerSec < 1024 * 1024)
        return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
    if (bytesPerSec < 1024 * 1024 * 1024)
        return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
    return `${(bytesPerSec / (1024 * 1024 * 1024)).toFixed(2)} GB/s`;
}

/**
 * Clamp a number between min and max.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Perform an async HTTP GET request using libsoup3 via Gio.
 * Returns the response body as a string.
 * @param {string} url
 * @returns {Promise<string>}
 */
export function httpGet(url) {
    return new Promise((resolve, reject) => {
        try {
            const file = Gio.File.new_for_uri(url);
            file.load_contents_async(null, (source, result) => {
                try {
                    const [success, contents] = source.load_contents_finish(result);
                    if (success)
                        resolve(new TextDecoder().decode(contents));
                    else
                        reject(new Error(`HTTP request failed for ${url}`));
                } catch (e) {
                    reject(e);
                }
            });
        } catch (e) {
            reject(e);
        }
    });
}
