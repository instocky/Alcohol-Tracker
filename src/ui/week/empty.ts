import { todayLocal } from '../../domain/date';

export function renderEmpty(selectedDate: string): HTMLElement {
  const isToday = selectedDate === todayLocal();
  const root = document.createElement('div');
  root.className = 'empty';
  root.innerHTML = `
    <div class="big">${isToday ? '✨' : '·'}</div>
    <div class="small">${
      isToday ? 'Сегодня чисто. Хорошего дня.' : 'Этот день без записей.'
    }</div>
  `;
  return root;
}