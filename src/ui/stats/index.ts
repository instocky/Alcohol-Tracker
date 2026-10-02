// Placeholder. T08 заменит на period switcher + 4 metric cards.

export function renderStatsScreen(): HTMLElement {
  const screen = document.createElement('section');
  screen.className = 'screen';
  screen.dataset.screen = 'stats';
  screen.innerHTML = `
    <div class="placeholder">
      <div class="big">Статистика</div>
      <div class="small">T08: неделя / месяц / год, 4 карточки метрик</div>
    </div>
  `;
  return screen;
}