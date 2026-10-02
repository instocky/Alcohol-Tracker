import './ui/styles/tokens.css';
import './ui/styles/reset.css';
import './ui/styles/app.css';

import { getPresets, setPresets } from './storage/repo';
import { migrate } from './storage/migrate';
import { DEFAULT_PRESETS } from './domain/presets';
import { getRoute, onRouteChange, type Route } from './ui/router';
import { renderBottomNav } from './ui/components/bottomNav';
import { renderWeekScreen } from './ui/week';
import { renderStatsScreen } from './ui/stats';
import { renderSettingsScreen } from './ui/settings';

const SCREENS: Record<Route, () => HTMLElement> = {
  week: renderWeekScreen,
  stats: renderStatsScreen,
  settings: renderSettingsScreen,
};

function buildShell(root: HTMLElement): void {
  root.innerHTML = '';

  const frame = document.createElement('div');
  frame.className = 'frame';

  const app = document.createElement('main');
  app.className = 'app';
  app.id = 'screens';
  app.append(SCREENS[getRoute()]());

  const nav = renderBottomNav();

  frame.append(app, nav);
  root.append(frame);
}

function refreshActiveScreen(app: HTMLElement, route: Route): void {
  for (const child of Array.from(app.children)) {
    if (child instanceof HTMLElement && child.dataset.screen !== route) {
      child.remove();
    }
  }
  const current = app.querySelector(`[data-screen="${route}"]`);
  if (!current) {
    app.append(SCREENS[route]());
  }
}

function refreshNavHighlight(): void {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const route = getRoute();
  for (const btn of Array.from(nav.querySelectorAll<HTMLButtonElement>('button[data-route]'))) {
    const isOn = btn.dataset.route === route;
    btn.classList.toggle('is-on', isOn);
    btn.setAttribute('aria-current', isOn ? 'page' : 'false');
  }
}

async function bootstrap(): Promise<void> {
  await migrate();
  const existing = await getPresets();
  if (existing.length === 0) {
    await setPresets([...DEFAULT_PRESETS]);
  }

  const root = document.getElementById('app');
  if (!root) return;

  buildShell(root);
  const app = document.getElementById('screens');
  if (!app) return;

  onRouteChange((route) => {
    refreshActiveScreen(app, route);
    refreshNavHighlight();
  });
  refreshNavHighlight();
}

void bootstrap();