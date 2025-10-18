const DEBUG_KEY = 'debug_mode_enabled';

function isDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false;

  const envDebug = import.meta.env.VITE_ENABLE_DEBUG_LOGGING === 'true';
  const localDebug = localStorage.getItem(DEBUG_KEY) === 'true';

  return envDebug || localDebug;
}

export function enableDebugMode(): void {
  localStorage.setItem(DEBUG_KEY, 'true');
  console.log('%c[DEBUG MODE ENABLED]', 'color: green; font-weight: bold;');
}

export function disableDebugMode(): void {
  localStorage.removeItem(DEBUG_KEY);
  console.log('%c[DEBUG MODE DISABLED]', 'color: orange; font-weight: bold;');
}

export function isDebugModeEnabled(): boolean {
  return isDebugEnabled();
}

export const debug = {
  log: (...args: unknown[]) => {
    if (isDebugEnabled()) {
      console.log('[DEBUG]', ...args);
    }
  },

  warn: (...args: unknown[]) => {
    if (isDebugEnabled()) {
      console.warn('[DEBUG]', ...args);
    }
  },

  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args);
  },

  info: (...args: unknown[]) => {
    if (isDebugEnabled()) {
      console.info('[DEBUG]', ...args);
    }
  },

  table: (data: unknown) => {
    if (isDebugEnabled()) {
      console.table(data);
    }
  },

  group: (label: string) => {
    if (isDebugEnabled()) {
      console.group(`[DEBUG] ${label}`);
    }
  },

  groupEnd: () => {
    if (isDebugEnabled()) {
      console.groupEnd();
    }
  },

  time: (label: string) => {
    if (isDebugEnabled()) {
      console.time(`[DEBUG] ${label}`);
    }
  },

  timeEnd: (label: string) => {
    if (isDebugEnabled()) {
      console.timeEnd(`[DEBUG] ${label}`);
    }
  },
};

export default debug;
