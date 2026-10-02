// Placeholder. T09 заменит на presets editor + history + CSV export + info strip.

export function renderSettingsScreen(): HTMLElement {
  const screen = document.createElement('section');
  screen.className = 'screen';
  screen.dataset.screen = 'settings';
  screen.innerHTML = `
    <div class="placeholder">
      <div class="big">Настройки</div>
      <div class="small">T09: пресеты, история (20), CSV экспорт, info-полоса</div>
    </div>
  `;
  return screen;
}