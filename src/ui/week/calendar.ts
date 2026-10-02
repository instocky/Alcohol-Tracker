import { addDays, formatLocal, parseLocal, todayLocal, isSameLocal } from '../../domain/date';
import type { Event } from '../../types';

const WINDOW_HALF = 2; // 2 дня влево + selected + 2 вправо = 5 ячеек

export interface CalendarView {
  root: HTMLElement;
  setSelected(date: string): void;
  getSelected(): string;
  setEvents(events: ReadonlyArray<Event>): void;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDateStr(s: string): Date {
  return parseLocal(s);
}

function buildRangeText(center: Date): string {
  const start = addDays(center, -WINDOW_HALF);
  const end = addDays(center, WINDOW_HALF);
  const fmt = (d: Date): string =>
    d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  return `${fmt(start)} – ${fmt(end)} ${end.getFullYear()}`;
}

export function renderCalendar(
  initialSelected: string,
  events: ReadonlyArray<Event>,
  onSelect: (date: string) => void,
): CalendarView {
  let selected = initialSelected;
  const today = todayLocal();

  const root = document.createElement('div');
  root.className = 'calendar-block';

  const range = document.createElement('div');
  range.className = 'week-nav';
  range.innerHTML = `
    <span class="range" data-role="cal-range"></span>
  `;

  const grid = document.createElement('div');
  grid.className = 'calendar';

  const leftArrow = document.createElement('button');
  leftArrow.type = 'button';
  leftArrow.className = 'arrow';
  leftArrow.setAttribute('aria-label', 'Предыдущий день');
  leftArrow.textContent = '‹';
  leftArrow.addEventListener('click', () => shiftBy(-1));

  const rightArrow = document.createElement('button');
  rightArrow.type = 'button';
  rightArrow.className = 'arrow';
  rightArrow.setAttribute('aria-label', 'Следующий день');
  rightArrow.textContent = '›';
  rightArrow.addEventListener('click', () => shiftBy(1));

  grid.append(leftArrow);
  for (let i = -WINDOW_HALF; i <= WINDOW_HALF; i++) {
    const cellDate = addDays(startOfDay(parseDateStr(selected)), i);
    const iso = formatLocal(cellDate);
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'day';
    cell.dataset.date = iso;
    cell.setAttribute('aria-label', cellDate.toLocaleDateString('ru-RU', {
      weekday: 'long', day: 'numeric', month: 'long',
    }));
    cell.innerHTML = `
      <span class="dow">${cellDate.toLocaleDateString('ru-RU', { weekday: 'short' })}</span>
      <span class="num">${cellDate.getDate()}</span>
    `;
    cell.addEventListener('click', () => {
      selected = iso;
      onSelect(iso);
      paint();
    });
    grid.append(cell);
  }
  grid.append(rightArrow);

  root.append(range, grid);

  function shiftBy(delta: number): void {
    const next = formatLocal(addDays(parseDateStr(selected), delta));
    selected = next;
    onSelect(next);
    paint();
  }

  function hasDataOn(date: string): boolean {
    return events.some((e) => e.date === date);
  }

  function paint(): void {
    const center = parseDateStr(selected);
    const rangeEl = root.querySelector<HTMLElement>('[data-role="cal-range"]');
    if (rangeEl) rangeEl.textContent = buildRangeText(center);

    for (const cell of Array.from(grid.querySelectorAll<HTMLElement>('.day'))) {
      const d = cell.dataset.date;
      if (!d) continue;
      const cellDate = parseDateStr(d);
      const isSelected = d === selected;
      const isToday = d === today;
      const hasData = hasDataOn(d);
      cell.classList.toggle('is-selected', isSelected);
      cell.classList.toggle('is-today', isToday);
      cell.classList.toggle('has-data', hasData);
      // Соседние дни: week-day в верхнем регистре
      const dowEl = cell.querySelector<HTMLElement>('.dow');
      if (dowEl) {
        dowEl.textContent = cellDate.toLocaleDateString('ru-RU', { weekday: 'short' });
      }
    }
  }

  paint();
  isSameLocal; // keep import alive for future use
  return {
    root,
    setSelected(date: string): void {
      selected = date;
      paint();
    },
    getSelected(): string {
      return selected;
    },
    setEvents(next: ReadonlyArray<Event>): void {
      events = next;
      paint();
    },
  };
}

export function renderDayTitle(selected: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'day-title';

  const date = parseLocal(selected);
  const today = todayLocal();
  const isToday = selected === today;

  const h = document.createElement('div');
  h.className = 'h';
  h.textContent = date.toLocaleDateString('ru-RU', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  wrap.append(h);

  if (isToday) {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = 'сегодня';
    wrap.append(tag);
  }

  return wrap;
}