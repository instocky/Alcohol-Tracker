import { todayLocal } from '../../domain/date';
import { getEvents, getPresets } from '../../storage/repo';
import type { Event, Preset } from '../../types';
import { renderCalendar, renderDayTitle, type CalendarView } from './calendar';
import { renderQuickAdd, type QuickAddHandle } from './quickAdd';

export function renderWeekScreen(): HTMLElement {
  const screen = document.createElement('section');
  screen.className = 'screen is-active';
  screen.dataset.screen = 'week';

  // Header (day title only — range показывает сам calendar)
  const header = document.createElement('header');
  header.className = 'header';
  const titleRow = document.createElement('div');
  titleRow.className = 'day-title';
  titleRow.dataset.role = 'day-title';
  header.append(titleRow);

  // Calendar block
  const calendarHost = document.createElement('div');
  calendarHost.dataset.role = 'calendar';

  // Body: пока в getbody
  const body = document.createElement('div');
  body.className = 'body';
  const placeholder = document.createElement('div');
  placeholder.className = 'placeholder';
  placeholder.innerHTML = `
    <div class="big">Неделя — T05 ✓</div>
    <div class="small">Quick-add готов. T06 добавит day list + total.</div>
  `;
  body.append(placeholder);

  screen.append(header, calendarHost, body);

  let selectedDate = todayLocal();
  let events: Event[] = [];
  let presets: Preset[] = [];
  let cal: CalendarView | null = null;
  let quickAdd: QuickAddHandle | null = null;

  async function refresh(): Promise<void> {
    events = await getEvents();
    if (cal) cal.setEvents(events);
    if (quickAdd) {
      // Quick-add не зависит от events, но callbacks нужны после rerender
    }
    // Toast
  }

  async function bootstrap(): Promise<void> {
    [events, presets] = await Promise.all([getEvents(), getPresets()]);

    cal = renderCalendar(todayLocal(), events, (newSelected) => {
      selectedDate = newSelected;
      paintDayTitle();
    });

    quickAdd = renderQuickAdd(
      presets,
      () => selectedDate,
      () => {
        void refresh();
      },
    );

    calendarHost.append(cal.root);
    body.insertBefore(quickAdd.root, placeholder);
    paintDayTitle();
  }

  function paintDayTitle(): void {
    titleRow.innerHTML = '';
    titleRow.append(renderDayTitle(selectedDate));
  }

  void bootstrap();

  return screen;
}