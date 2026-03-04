/**
 * Performance Utilities
 * 
 * Helper functions for optimizing performance
 */

import { InteractionManager } from 'react-native';

/**
 * Defer expensive operations until after interactions complete
 */
export const afterInteractions = (callback: () => void): void => {
    InteractionManager.runAfterInteractions(() => {
        callback();
    });
};

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            timeout = null;
            func(...args);
        };

        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return function executedFunction(...args: Parameters<T>) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

/**
 * Memoize function results
 */
export function memoize<T extends (...args: any[]) => any>(
    func: T
): (...args: Parameters<T>) => ReturnType<T> {
    const cache = new Map();

    return function memoized(...args: Parameters<T>): ReturnType<T> {
        const key = JSON.stringify(args);

        if (cache.has(key)) {
            return cache.get(key);
        }

        const result = func(...args);
        cache.set(key, result);
        return result;
    };
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Get memory usage (development only)
 */
export function getMemoryUsage(): number | null {
    if (__DEV__ && (performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize;
    }
    return null;
}

/**
 * Log performance metric
 */
export function logPerformance(label: string, startTime: number): void {
    if (__DEV__) {
        const duration = Date.now() - startTime;
        console.log(`[Performance] ${label}: ${duration}ms`);
    }
}

/**
 * Batch state updates
 */
export function batchUpdates(callback: () => void): void {
    // React Native batches updates automatically in event handlers
    // This is mainly for compatibility
    callback();
}
