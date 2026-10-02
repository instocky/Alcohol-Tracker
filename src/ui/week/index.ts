import { todayLocal } from '../../domain/date';
import { getEvents, getPresets } from '../../storage/repo';
import type { Event, Preset } from '../../types';
import { renderCalendar, renderDayTitle, type CalendarView } from './calendar';
import { renderQuickAdd, type QuickAddHandle } from './quickAdd';
import { renderDayList } from './dayList';
import { renderTotal } from './total';
import { renderEmpty } from './empty';

export function renderWeekScreen(): HTMLElement {
  const screen = document.createElement('section');
  screen.className = 'screen is-active';
  screen.dataset.screen = 'week';

  const header = document.createElement('header');
  header.className = 'header';
  const titleRow = document.createElement('div');
  titleRow.className = 'day-title';
  titleRow.dataset.role = 'day-title';
  header.append(titleRow);

  const calendarHost = document.createElement('div');
  calendarHost.dataset.role = 'calendar';

  const body = document.createElement('div');
  body.className = 'body';

  screen.append(header, calendarHost, body);

  let selectedDate = todayLocal();
  let events: Event[] = [];
  let presets: Preset[] = [];
  let cal: CalendarView | null = null;
  let quickAdd: QuickAddHandle | null = null;
  let dayContentHost: HTMLElement | null = null; // entries OR empty

  function paintDayContent(): void {
    if (!dayContentHost) return;
    const dayEvents = events.filter((e) => e.date === selectedDate);
    const next = dayEvents.length === 0
      ? renderEmpty(selectedDate)
      : renderDayList(dayEvents, presets, () => void refresh());
    dayContentHost.replaceWith(next);
    dayContentHost = next;
  }

  function paintTotal(): void {
    const totalHost = body.querySelector<HTMLElement>('[data-role="total"]');
    if (!totalHost) return;
    const dayEvents = events.filter((e) => e.date === selectedDate);
    totalHost.replaceWith(renderTotal(dayEvents));
  }

  async function refresh(): Promise<void> {
    events = await getEvents();
    if (cal) cal.setEvents(events);
    paintDayContent();
    paintTotal();
  }

  async function bootstrap(): Promise<void> {
    [events, presets] = await Promise.all([getEvents(), getPresets()]);

    cal = renderCalendar(todayLocal(), events, (newSelected) => {
      selectedDate = newSelected;
      titleRow.innerHTML = '';
      titleRow.append(renderDayTitle(selectedDate));
      paintDayContent();
      paintTotal();
    });

    quickAdd = renderQuickAdd(
      presets,
      () => selectedDate,
      () => {
        void refresh();
      },
    );

    dayContentHost = renderEmpty(selectedDate);
    const totalHost = renderTotal([]);

    calendarHost.append(cal.root);
    body.append(quickAdd.root, totalHost, dayContentHost);
    titleRow.innerHTML = '';
    titleRow.append(renderDayTitle(selectedDate));

    // ponytail: initial hosts смонтированы пустыми (empty / total=0) до загрузки events.
    // Пересчитываем с реальными данными, иначе первое открытие показывает "Сегодня чисто"
    // даже если у него есть записи (refresh() ещё не вызывался).
    paintDayContent();
    paintTotal();
  }

  void bootstrap();

  return screen;
}