// Placeholder. T04 заменит на calendar + day title + quick-add + dayList + total.

export function renderWeekScreen(): HTMLElement {
  const screen = document.createElement('section');
  screen.className = 'screen is-active';
  screen.dataset.screen = 'week';
  screen.innerHTML = `
    <div class="placeholder">
      <div class="big">Неделя</div>
      <div class="small">T04–T07: календарь, quick-add, day list, total, toast</div>
    </div>
  `;
  return screen;
}