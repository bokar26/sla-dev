/**
 * Application configuration
 */
export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
export const DEV_FAKE_RESULTS = import.meta.env.VITE_DEV_FAKE_RESULTS === '1';
