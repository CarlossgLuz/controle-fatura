export function devInfo(...args: unknown[]) {
  if (__DEV__) {
    console.info(...args);
  }
}

export function devWarn(...args: unknown[]) {
  if (__DEV__) {
    console.warn(...args);
  }
}

export function devError(...args: unknown[]) {
  if (__DEV__) {
    console.error(...args);
  }
}
