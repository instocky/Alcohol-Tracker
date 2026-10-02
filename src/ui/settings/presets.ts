import type { Preset } from '../../types';
import { getPresets, setPresets } from '../../storage/repo';

export interface PresetsSectionHandle {
  root: HTMLElement;
  refresh(): Promise<void>;
}

export function renderPresets(getCurrent: () => Preset[]): PresetsSectionHandle {
  const root = document.createElement('div');
  root.className = 'preset-list';

  async function save(next: Preset[]): Promise<void> {
    await setPresets(next);
    await refresh();
  }

  function presetRow(preset: Preset): HTMLElement {
    const row = document.createElement('div');
    row.className = 'preset-row';
    row.dataset.preset = preset.id;

    const left = document.createElement('div');
    left.className = 'left';
    const emoji = document.createElement('span');
    emoji.className = 'emoji';
    emoji.textContent = preset.emoji;
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = preset.name;
    left.append(emoji, name);

    const chevron = document.createElement('span');
    chevron.className = 'chev';
    chevron.textContent = '›';
    chevron.setAttribute('aria-hidden', 'true');

    row.append(left, chevron);

    let editor: HTMLElement | null = null;
    row.addEventListener('click', () => {
      if (editor) {
        editor.remove();
        editor = null;
        chevron.textContent = '›';
        return;
      }
      editor = buildEditor(preset, async (updated) => {
        const next = getPresetsSnapshot().map((p) => (p.id === preset.id ? updated : p));
        await save(next);
      }, () => {
        editor?.remove();
        editor = null;
        chevron.textContent = '›';
      });
      row.after(editor);
      chevron.textContent = '⌄';
    });

    return row;
  }

  function buildEditor(
    preset: Preset,
    onSave: (p: Preset) => Promise<void>,
    onCancel: () => void,
  ): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'preset-editor';

    // Name input (не редактируется в v0.1, но показываем read-only)
    const nameLbl = document.createElement('div');
    nameLbl.className = 'editor-lbl';
    nameLbl.textContent = 'Название';
    const nameInp = document.createElement('input');
    nameInp.type = 'text';
    nameInp.value = preset.name;
    nameInp.disabled = true;

    // ABV
    const abvLbl = document.createElement('div');
    abvLbl.className = 'editor-lbl';
    abvLbl.textContent = 'ABV, %';
    const abvInp = document.createElement('input');
    abvInp.type = 'number';
    abvInp.min = '0';
    abvInp.max = '100';
    abvInp.step = '0.1';
    abvInp.value = String(preset.abv);

    // Options list editor
    const optsLbl = document.createElement('div');
    optsLbl.className = 'editor-lbl';
    optsLbl.textContent = 'Объёмы (мл)';
    const optsList = document.createElement('div');
    optsList.className = 'opts-list';
    const optsInputs: HTMLInputElement[] = [];
    for (const o of preset.options) {
      const row = document.createElement('div');
      row.className = 'opt-row';
      const inp = document.createElement('input');
      inp.type = 'number';
      inp.min = '1';
      inp.step = '1';
      inp.value = String(o.volume_ml);
      const lbl = document.createElement('span');
      lbl.className = 'opt-lbl';
      lbl.textContent = o.label;
      row.append(inp, lbl);
      optsInputs.push(inp);
      optsList.append(row);
    }

    // Actions
    const actions = document.createElement('div');
    actions.className = 'editor-actions';
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'btn-cancel';
    cancel.textContent = 'Отмена';
    cancel.addEventListener('click', onCancel);
    const save = document.createElement('button');
    save.type = 'button';
    save.className = 'btn-save';
    save.textContent = 'Сохранить';
    save.addEventListener('click', async () => {
      const abv = Number(abvInp.value);
      if (!Number.isFinite(abv) || abv < 0 || abv > 100) return;
      const newOpts = optsInputs.map((inp, i) => {
        const v = Math.max(1, Math.round(Number(inp.value) || 1));
        const label = preset.options[i]?.label ?? `${v} мл`;
        return { volume_ml: v, label };
      });
      await onSave({ ...preset, abv, options: newOpts });
    });
    actions.append(cancel, save);

    wrap.append(nameLbl, nameInp, abvLbl, abvInp, optsLbl, optsList, actions);
    return wrap;
  }

  function getPresetsSnapshot(): Preset[] {
    return getCurrent();
  }

  async function refresh(): Promise<void> {
    root.innerHTML = '';
    const presets = await getPresets();
    for (const p of presets) root.append(presetRow(p));
    // Add-row
    const addRow = document.createElement('div');
    addRow.className = 'preset-add';
    addRow.textContent = '＋ Добавить пресет';
    addRow.addEventListener('click', async () => {
      const newPreset: Preset = {
        id: crypto.randomUUID(),
        name: 'Новый напиток',
        emoji: '🍸',
        abv: 12,
        options: [{ volume_ml: 50, label: '50 мл' }],
        activeOptionIndex: 0,
      };
      const next = [...(await getPresets()), newPreset];
      await save(next);
    });
    root.append(addRow);
  }

  void refresh();

  return {
    root,
    refresh,
  };
}