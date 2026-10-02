import type { Preset } from '../../types';
import { getPresets, setPresets } from '../../storage/repo';

const BUILTIN_IDS = new Set(['vodka', 'wine', 'beer']);

export interface PresetsSectionHandle {
  root: HTMLElement;
  refresh(): Promise<void>;
}

export function renderPresets(): PresetsSectionHandle {
  const root = document.createElement('div');
  root.className = 'preset-list';

  // ponytail: own source of truth — outer `presets` in settings/index.ts is stale
  // (loaded once at init, never updated), so map/filter on it would drop new presets.
  let current: Preset[] = [];

  async function save(next: Preset[]): Promise<void> {
    current = next;
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
      const onDelete = BUILTIN_IDS.has(preset.id)
        ? undefined
        : async (): Promise<void> => {
            if (!confirm(`Удалить «${preset.name}»?`)) return;
            const next = current.filter((p) => p.id !== preset.id);
            await save(next);
          };
      editor = buildEditor(preset, async (updated) => {
        const next = current.map((p) => (p.id === preset.id ? updated : p));
        await save(next);
      }, () => {
        editor?.remove();
        editor = null;
        chevron.textContent = '›';
      }, onDelete);
      row.after(editor);
      chevron.textContent = '⌄';
    });

    return row;
  }

  function buildEditor(
    preset: Preset,
    onSave: (p: Preset) => Promise<void>,
    onCancel: () => void,
    onDelete?: () => Promise<void>,
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
    if (onDelete) {
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'btn-delete';
      del.setAttribute('aria-label', 'Удалить пресет');
      del.title = 'Удалить пресет';
      // ponytail: inline SVG — не зависит от шрифта
      del.innerHTML =
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<polyline points="3 6 5 6 21 6"/>' +
        '<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>' +
        '<path d="M10 11v6M14 11v6"/>' +
        '<path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>' +
        '</svg>';
      del.addEventListener('click', () => { void onDelete(); });
      actions.append(del);
    }
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

  async function refresh(): Promise<void> {
    root.innerHTML = '';
    current = await getPresets();
    for (const p of current) root.append(presetRow(p));
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