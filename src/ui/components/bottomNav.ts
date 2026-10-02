import { getRoute, setRoute, type Route } from '../router';

const ITEMS: ReadonlyArray<{ route: Route; label: string; icon: string }> = [
  { route: 'week', label: 'Неделя', icon: '📅' },
  { route: 'stats', label: 'Статистика', icon: '📊' },
  { route: 'settings', label: 'Настройки', icon: '⚙️' },
];

export function renderBottomNav(): HTMLElement {
  const nav = document.createElement('nav');
  nav.className = 'nav';
  nav.setAttribute('aria-label', 'Навигация');

  for (const item of ITEMS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.route = item.route;
    btn.className = item.route === getRoute() ? 'is-on' : '';
    btn.setAttribute('aria-current', btn.className ? 'page' : 'false');

    const ic = document.createElement('span');
    ic.className = 'ic';
    ic.setAttribute('aria-hidden', 'true');
    ic.textContent = item.icon;

    const lbl = document.createElement('span');
    lbl.className = 'lbl';
    lbl.textContent = item.label;

    btn.append(ic, lbl);
    btn.addEventListener('click', () => setRoute(item.route));
    nav.append(btn);
  }

  return nav;
}