import { todayLocal } from '../../domain/date';
import { getEvents } from '../../storage/repo';
import type { Event } from '../../types';
import { renderCalendar, renderDayTitle, type CalendarView } from './calendar';

export function renderWeekScreen(): HTMLElement {
  const screen = document.createElement('section');
  screen.className = 'screen is-active';
  screen.dataset.screen = 'week';

  // Header (range — обновляется внутри calendar)
  const header = document.createElement('header');
  header.className = 'header';
  const titleRow = document.createElement('div');
  titleRow.className = 'day-title';
  titleRow.dataset.role = 'day-title';
  header.append(titleRow);

  // Calendar block: range + 5 ячеек
  const calendarHost = document.createElement('div');
  calendarHost.dataset.role = 'calendar';

  // Body
  const body = document.createElement('div');
  body.className = 'body';
  body.innerHTML = `
    <div class="placeholder">
      <div class="big">Неделя — T04 ✓</div>
      <div class="small">Календарь и day title. T06 добавит quick-add / day list / total.</div>
    </div>
  `;

  screen.append(header, calendarHost, body);

  let events: Event[] = [];
  let cal: CalendarView | null = null;

  async function bootstrapCalendar(): Promise<void> {
    events = await getEvents();
    cal = renderCalendar(todayLocal(), events, (newSelected) => {
      titleRow.innerHTML = '';
      titleRow.append(renderDayTitle(newSelected));
    });
    // Initial day-title
    titleRow.innerHTML = '';
    titleRow.append(renderDayTitle(todayLocal()));
    calendarHost.append(cal.root);
  }

  void bootstrapCalendar();

  return screen;
}