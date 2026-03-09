/**
 * http.ts
 * Central axios instance — single source of truth for the backend base URL.
 * All API calls in this project must go through this instance.
 *
 * Base URL is read from VITE_API_BASE_URL in .env  →  /api
 */

import axios from 'axios';
console.log({a: import.meta.env.VITE_API_BASE_URL})
const http = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL as string) || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10_000,
});

// Optional: global error log (keeps individual callers clean)
http.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('[http]', err.config?.url, err.response?.status, err.message);
    return Promise.reject(err);
  },
);

export default http;
