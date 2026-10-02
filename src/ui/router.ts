// Hash-based router: 3 экрана, default 'week'.

export type Route = 'week' | 'stats' | 'settings';

const VALID: readonly Route[] = ['week', 'stats', 'settings'];
const DEFAULT: Route = 'week';

function parseHash(hash: string): Route {
  const clean = hash.startsWith('#') ? hash.slice(1) : hash;
  return (VALID as readonly string[]).includes(clean) ? (clean as Route) : DEFAULT;
}

export function getRoute(): Route {
  return parseHash(window.location.hash);
}

export function setRoute(r: Route): void {
  if (window.location.hash !== `#${r}`) {
    window.location.hash = `#${r}`;
  }
}

export function onRouteChange(cb: (r: Route) => void): () => void {
  const handler = (): void => cb(getRoute());
  window.addEventListener('hashchange', handler);
  return () => window.removeEventListener('hashchange', handler);
}