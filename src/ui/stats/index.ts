import { getEvents } from '../../storage/repo';
import type { Event } from '../../types';
import { aggregate, daysTotalFor, type Period } from '../../domain/stats';

const PERIODS: ReadonlyArray<{ key: Period; label: string }> = [
  { key: 'week', label: 'Неделя' },
  { key: 'month', label: 'Месяц' },
  { key: 'year', label: 'Год' },
];

interface Card {
  label: string;
  value: string;
  unit?: string;
}

function buildCards(events: ReadonlyArray<Event>, period: Period): Card[] {
  const s = aggregate(events, period);
  const total = daysTotalFor(period);
  return [
    { label: 'Спирта всего', value: s.totalG.toFixed(1), unit: 'г' },
    { label: 'Порций', value: String(s.count), unit: 'событий' },
    { label: 'Дней с записями', value: String(s.daysWith), unit: `/ ${total}` },
    { label: 'Дней без записей', value: String(Math.max(0, total - s.daysWith)), unit: `/ ${total}` },
  ];
}

export function renderStatsScreen(): HTMLElement {
  const screen = document.createElement('section');
  screen.className = 'screen';
  screen.dataset.screen = 'stats';

  let eventsCache: Event[] = [];
  let period: Period = 'week';

  const heading = document.createElement('div');
  heading.className = 'screen-heading';
  heading.textContent = 'Статистика';

  const periodRow = document.createElement('div');
  periodRow.className = 'stats-period';

  const cards = document.createElement('div');
  cards.className = 'stat-cards';

  screen.append(heading, periodRow, cards);

  for (const p of PERIODS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.period = p.key;
    btn.className = p.key === period ? 'is-on' : '';
    btn.textContent = p.label;
    btn.addEventListener('click', () => {
      if (period === p.key) return;
      period = p.key;
      paint();
    });
    periodRow.append(btn);
  }

  function paint(): void {
    for (const b of Array.from(periodRow.querySelectorAll<HTMLButtonElement>('button[data-period]'))) {
      b.classList.toggle('is-on', b.dataset.period === period);
    }
    cards.innerHTML = '';
    for (const card of buildCards(eventsCache, period)) {
      cards.append(buildCardEl(card));
    }
  }

  function buildCardEl(card: Card): HTMLElement {
    const el = document.createElement('div');
    el.className = 'stat-card';
    const lbl = document.createElement('div');
    lbl.className = 'stat-lbl';
    lbl.textContent = card.label;
    const val = document.createElement('div');
    val.className = 'stat-val';
    val.textContent = card.value;
    if (card.unit) {
      const u = document.createElement('span');
      u.className = 'u';
      u.textContent = card.unit;
      val.append(u);
    }
    el.append(lbl, val);
    return el;
  }

  void (async () => {
    eventsCache = await getEvents();
    paint();
  })();

  return screen;
}