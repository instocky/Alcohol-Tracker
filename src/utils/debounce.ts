// Per-button debounce: 300 мс окно. После успешного вызова — сброс.

const WINDOW_MS = 300;

export function makeDebounced<F extends (...args: never[]) => unknown>(fn: F): F {
  let lastFire = 0;
  const wrapped = ((...args: Parameters<F>): void => {
    const now = Date.now();
    if (now - lastFire < WINDOW_MS) return;
    lastFire = now;
    fn(...args);
  }) as F;
  return wrapped;
}