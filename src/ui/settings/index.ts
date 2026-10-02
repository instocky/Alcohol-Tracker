import { getPresets } from '../../storage/repo';
import type { Preset } from '../../types';
import { renderPresets } from './presets';
import { renderHistory } from './history';
import { downloadCsv } from './export';

export function renderSettingsScreen(): HTMLElement {
  const screen = document.createElement('section');
  screen.className = 'screen';
  screen.dataset.screen = 'settings';

  const heading = document.createElement('div');
  heading.className = 'screen-heading';
  heading.textContent = 'Настройки';
  screen.append(heading);

  let presets: Preset[] = [];
  let presetsSection: HTMLElement | null = null;

  async function refreshPresets(): Promise<void> {
    presets = await getPresets();
    presetsSection?.replaceWith(buildPresetsSection());
  }

  function buildSection(title: string, body: HTMLElement): HTMLElement {
    const sec = document.createElement('div');
    sec.className = 'settings-section';
    const h = document.createElement('div');
    h.className = 'section-title';
    h.textContent = title;
    sec.append(h, body);
    return sec;
  }

  function buildPresetsSection(): HTMLElement {
    const handle = renderPresets(() => presets);
    presetsSection = handle.root;
    return buildSection('Пресеты напитков', handle.root);
  }

  function buildHistorySection(): HTMLElement {
    return buildSection('История', renderHistory(presets));
  }

  function buildDataSection(): HTMLElement {
    const body = document.createElement('div');
    body.className = 'data-row';
    body.setAttribute('role', 'button');
    body.setAttribute('tabindex', '0');
    const ic = document.createElement('span');
    ic.className = 'emoji';
    ic.textContent = '💾';
    const lbl = document.createElement('span');
    lbl.className = 'lbl';
    lbl.textContent = 'Экспорт CSV';
    const chev = document.createElement('span');
    chev.className = 'chev';
    chev.textContent = '›';
    body.append(ic, lbl, chev);
    body.addEventListener('click', () => void downloadCsv());
    body.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        void downloadCsv();
      }
    });
    return buildSection('Данные', body);
  }

  function buildInfoStrip(): HTMLElement {
    const info = document.createElement('div');
    info.className = 'info-strip';
    info.innerHTML = `
      <div class="info-text">
        Все данные хранятся локально (chrome.storage).<br>
        Расширение работает офлайн. Никакой синхронизации.
      </div>
    `;
    return info;
  }

  void (async () => {
    presets = await getPresets();
    screen.append(buildPresetsSection(), buildHistorySection(), buildDataSection(), buildInfoStrip());
  })();

  // Refresh helper for settings screen updates (kept for future use).
  void refreshPresets;

  return screen;
}