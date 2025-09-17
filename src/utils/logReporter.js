import api from '../lib/api';

let initialized = false;

export function initClientLogReporter(options = {}) {
  if (initialized) return;
  const enable = options.enabled === true; // default off
  if (!enable) return;

  initialized = true;

  const recent = new Map();
  const dedupeMs = 5000;

  const shouldSend = (key) => {
    const now = Date.now();
    const last = recent.get(key) || 0;
    if (now - last > dedupeMs) {
      recent.set(key, now);
      return true;
    }
    return false;
  };

  const send = async (level, payload) => {
    try {
      const key = `${level}:${payload.message}`;
      if (!shouldSend(key)) return;
      // Ignore chrome extensions to avoid noise
      if (payload?.source && String(payload.source).startsWith('chrome-extension://')) return;
      await api.post('client-logs', {
        level,
        ...payload,
        url: window.location.href,
        userAgent: navigator.userAgent,
        ts: new Date().toISOString(),
      });
    } catch (_) {
      // swallow reporter errors
    }
  };

  // Global runtime errors
  window.addEventListener('error', (event) => {
    send('error', {
      message: event?.error?.message || event?.message || 'Unknown error',
      stack: event?.error?.stack,
      source: event?.filename,
      line: event?.lineno,
      col: event?.colno,
    });
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason || {};
    send('error', {
      message: reason?.message || String(reason),
      stack: reason?.stack,
    });
  });

  // Mirror console.error/warn to server
  const origError = console.error;
  const origWarn = console.warn;
  console.error = function (...args) {
    try {
      const msg = args.map(a => (a && a.stack) ? a.stack : String(a)).join(' ');
      send('error', { message: msg });
    } catch (_) {}
    origError.apply(console, args);
  };
  console.warn = function (...args) {
    try {
      const msg = args.map(String).join(' ');
      send('warn', { message: msg });
    } catch (_) {}
    origWarn.apply(console, args);
  };
}


