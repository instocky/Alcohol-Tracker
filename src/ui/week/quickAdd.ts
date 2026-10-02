import type { Event, Preset } from '../../types';
import { computePureAlcohol } from '../../domain/calc';
import { addEvent, removeEvent } from '../../storage/repo';
import { makeDebounced } from '../../utils/debounce';
import { pushLast } from '../../utils/undo';
import { renderSegmentToggle } from '../components/segmentToggle';
import { showToast } from '../components/toast';

export interface QuickAddHandle {
  root: HTMLElement;
  setPresets(presets: ReadonlyArray<Preset>): void;
}

export function renderQuickAdd(
  presets: ReadonlyArray<Preset>,
  getSelectedDate: () => string,
  onChanged: () => void,
): QuickAddHandle {
  let current = presets;
  const root = document.createElement('div');
  root.className = 'quick-add';

  function rebuild(): void {
    root.innerHTML = '';
    for (const preset of current) {
      root.append(buildRow(preset));
    }
  }

  function buildRow(preset: Preset): HTMLElement {
    const row = document.createElement('div');
    row.className = 'qa-row';
    row.dataset.preset = preset.id;

    // left: emoji + (title + sub)
    const left = document.createElement('div');
    left.className = 'qa-name';

    const emoji = document.createElement('span');
    emoji.className = 'qa-emoji';
    emoji.setAttribute('aria-hidden', 'true');
    emoji.textContent = preset.emoji;

    const titleBlock = document.createElement('div');

    const title = document.createElement('div');
    title.className = 'qa-title';
    const name = document.createElement('span');
    name.textContent = preset.name;
    const deg = document.createElement('span');
    deg.className = 'deg';
    deg.textContent = `· ${preset.abv}%`;
    title.append(name, deg);

    const sub = document.createElement('div');
    sub.className = 'qa-sub';

    // Toggle если options > 1, иначе static label
    if (preset.options.length >= 2) {
      const labels = preset.options.map((o) => o.label);
      const toggle = renderSegmentToggle(labels, preset.activeOptionIndex, () => {
        preset.activeOptionIndex = toggle.getActiveIndex();
        updateSub();
        updateDataKey();
      });
      // After first render: clamp activeOptionIndex into bounds
      if (preset.activeOptionIndex < 0 || preset.activeOptionIndex >= labels.length) {
        preset.activeOptionIndex = 0;
      }
      sub.append(toggle.root);
    }

    function updateSub(): void {
      if (preset.options.length === 1) {
        const opt = preset.options[0];
        if (opt) sub.textContent = opt.label;
      }
    }
    updateSub();

    titleBlock.append(title, sub);
    left.append(emoji, titleBlock);

    // right: + button
    const plus = document.createElement('button');
    plus.type = 'button';
    plus.className = 'qa-plus';
    plus.setAttribute('aria-label', `Добавить ${preset.name}`);
    plus.textContent = '+';

    function updateDataKey(): void {
      const opt = preset.options[preset.activeOptionIndex];
      if (!opt) return;
      plus.dataset.key = `${preset.id}:${opt.volume_ml}`;
    }
    updateDataKey();

    const fire = makeDebounced(async () => {
      const opt = preset.options[preset.activeOptionIndex];
      if (!opt) return;
      const pure = computePureAlcohol(opt.volume_ml, preset.abv);
      const event: Event = {
        id: crypto.randomUUID(),
        date: getSelectedDate(),
        type: preset.id,
        volume_ml: opt.volume_ml,
        abv: preset.abv,
        pure_alcohol_g: pure,
        created_at: new Date().toISOString(),
      };
      await addEvent(event);
      pushLast({ type: 'add', event });
      showToast('Запись добавлена', () => {
        void removeEvent(event.id);
        onChanged();
      });
      onChanged();
    });
    plus.addEventListener('click', fire);

    row.append(left, plus);
    return row;
  }

  rebuild();

  return {
    root,
    setPresets(next: ReadonlyArray<Preset>): void {
      current = next;
      rebuild();
    },
  };
}