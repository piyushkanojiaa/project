/**
 * App Constants
 * 
 * Centralized configuration and constants
 */

// API Configuration
export const API_CONFIG = {
    DEFAULT_URL: 'http://localhost:8000/graphql',
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000, // 1 second
};

// Polling Intervals (milliseconds)
export const POLLING_INTERVALS = {
    SATELLITES: 30 * 1000, // 30 seconds
    CONJUNCTIONS: 60 * 1000, // 1 minute
    HIGH_RISK: 15 * 1000, // 15 seconds
    BACKGROUND_FETCH: 15 * 60 * 1000, // 15 minutes
};

// Cache Configuration
export const CACHE_CONFIG = {
    SATELLITES_STALE_TIME: 5 * 60 * 1000, // 5 minutes
    CONJUNCTIONS_STALE_TIME: 10 * 60 * 1000, // 10 minutes
    MAX_CACHE_SIZE: 50 * 1024 * 1024, // 50 MB
    MAX_OFFLINE_QUEUE: 100,
};

// Notification Configuration
export const NOTIFICATION_CONFIG = {
    CHANNELS: {
        DEFAULT: 'default',
        CRITICAL: 'critical',
        HIGH: 'high',
        MEDIUM: 'medium',
    },
    IMPORTANCE: {
        CRITICAL: 5, // MAX
        HIGH: 4,
        MEDIUM: 3,
        LOW: 2,
    },
};

// UI Configuration
export const UI_CONFIG = {
    SKELETON_COUNT: 5,
    LIST_PAGE_SIZE: 20,
    DEBOUNCE_SEARCH: 300, // milliseconds
    ANIMATION_DURATION: 200,
};

// Risk Level Configuration
export const RISK_LEVELS = {
    CRITICAL: 'CRITICAL',
    HIGH: 'HIGH',
    MEDIUM: 'MEDIUM',
    LOW: 'LOW',
} as const;

// Colors
export const COLORS = {
    PRIMARY: '#00ffff',
    BACKGROUND: '#000510',
    SURFACE: 'rgba(10, 25, 47, 0.95)',
    TEXT: '#ffffff',
    TEXT_SECONDARY: 'rgba(255, 255, 255, 0.7)',
    TEXT_MUTED: 'rgba(255, 255, 255, 0.5)',

    // Risk Colors
    RISK_CRITICAL: '#ff3366',
    RISK_HIGH: '#ff9800',
    RISK_MEDIUM: '#ffaa00',
    RISK_LOW: '#4caf50',

    // Status Colors
    STATUS_ACTIVE: '#00ffff',
    STATUS_ARCHIVED: '#9e9e9e',
    STATUS_RESOLVED: '#4caf50',

    // UI Colors
    ERROR: '#ff3366',
    WARNING: '#ff9800',
    SUCCESS: '#4caf50',
    INFO: '#00ffff',
};

// Limits
export const LIMITS = {
    MAX_SATELLITES: 1000,
    MAX_CONJUNCTIONS: 500,
    MAX_SEARCH_RESULTS: 100,
    MAX_NOTIFICATION_QUEUE: 50,
};

// Feature Flags
export const FEATURES = {
    PUSH_NOTIFICATIONS: true,
    BACKGROUND_FETCH: true,
    OFFLINE_MODE: true,
    ANALYTICS: false, // Enable when analytics is set up
    CRASH_REPORTING: false, // Enable when Sentry is configured
    BETA_FEATURES: __DEV__, // Only in development
};

// Performance Configuration
export const PERFORMANCE = {
    ENABLE_HERMES: true,
    ENABLE_INLINE_REQUIRES: true,
    MAX_MEMORY_MB: 150,
    FPS_TARGET: 60,
};

// Error Messages
export const ERROR_MESSAGES = {
    NETWORK: 'Unable to connect to server. Please check your internet connection.',
    TIMEOUT: 'Request timed out. Please try again.',
    GENERIC: 'An unexpected error occurred. Please try again.',
    NO_DATA: 'No data available.',
    PERMISSION_DENIED: 'Permission denied. Please enable in settings.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
    SYNC_COMPLETE: 'Data synchronized successfully',
    NOTIFICATION_ENABLED: 'Notifications enabled',
    SETTINGS_SAVED: 'Settings saved successfully',
    CACHE_CLEARED: 'Cache cleared successfully',
};
