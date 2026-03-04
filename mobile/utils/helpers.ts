/**
 * Utility Functions
 * 
 * Common helper functions
 */

import { RiskLevel, ConjunctionStatus, SatelliteType } from '../types';

/**
 * Format date to relative time
 */
export function formatRelativeTime(date: Date | string): string {
    const now = new Date();
    const target = typeof date === 'string' ? new Date(date) : date;
    const diffMs = target.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 0) {
        return 'Past';
    } else if (diffMins < 60) {
        return `${diffMins}m`;
    } else if (diffHours < 24) {
        return `${diffHours}h`;
    } else {
        return `${diffDays}d`;
    }
}

/**
 * Get risk color
 */
export function getRiskColor(level: RiskLevel): string {
    switch (level) {
        case 'CRITICAL':
            return '#ff3366';
        case 'HIGH':
            return '#ff9800';
        case 'MEDIUM':
            return '#ffaa00';
        case 'LOW':
            return '#4caf50';
        default:
            return '#9e9e9e';
    }
}

/**
 * Get satellite type icon
 */
export function getSatelliteTypeIcon(type: SatelliteType): string {
    switch (type) {
        case 'ACTIVE':
            return 'satellite-variant';
        case 'DEBRIS':
            return 'alert-circle';
        case 'UNKNOWN':
        default:
            return 'help-circle';
    }
}

/**
 * Get conjunction status color
 */
export function getStatusColor(status: ConjunctionStatus): string {
    switch (status) {
        case 'ACTIVE':
            return '#00ffff';
        case 'ARCHIVED':
            return '#9e9e9e';
        case 'RESOLVED':
            return '#4caf50';
        default:
            return '#ffffff';
    }
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals = 2): string {
    return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format distance (km or m)
 */
export function formatDistance(km: number): string {
    if (km < 1) {
        return `${(km * 1000).toFixed(0)} m`;
    }
    return `${km.toFixed(2)} km`;
}

/**
 * Format altitude
 */
export function formatAltitude(km: number): string {
    return `${km.toFixed(0)} km`;
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * Generate unique ID
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Truncate string
 */
export function truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - 3) + '...';
}
