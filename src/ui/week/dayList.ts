import type { Event, Preset } from '../../types';
import { removeEvent } from '../../storage/repo';

interface GroupedRow {
  type: string;
  volume_ml: number;
  abv: number;
  count: number;
  total_g: number;
  ids: string[];
}

function groupKey(e: Event): string {
  return `${e.type}|${e.volume_ml}|${e.abv}`;
}

function groupEvents(events: ReadonlyArray<Event>): GroupedRow[] {
  const map = new Map<string, GroupedRow>();
  for (const e of events) {
    const key = groupKey(e);
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
      existing.total_g += e.pure_alcohol_g;
      existing.ids.push(e.id);
    } else {
      map.set(key, {
        type: e.type,
        volume_ml: e.volume_ml,
        abv: e.abv,
        count: 1,
        total_g: e.pure_alcohol_g,
        ids: [e.id],
      });
    }
  }
  // Stable: last event ID = new one added; remove that to undo last action.
  // For dayList display we only need totals.
  return Array.from(map.values());
}

function fmtGrams(g: number): string {
  return `${g.toFixed(1)} г`;
}

function volumeLabel(preset: Preset | undefined, volume_ml: number): string {
  const opt = preset?.options.find((o) => o.volume_ml === volume_ml);
  return opt?.label ?? `${volume_ml} мл`;
}

export function renderDayList(
  events: ReadonlyArray<Event>,
  presets: ReadonlyArray<Preset>,
  onChanged: () => void,
): HTMLElement {
  const root = document.createElement('div');
  root.className = 'entries';
  const presetById = new Map(presets.map((p) => [p.id, p]));

  function paint(): void {
    root.innerHTML = '';
    const groups = groupEvents(events);
    for (const g of groups) {
      root.append(buildRow(g));
    }
  }

  function buildRow(g: GroupedRow): HTMLElement {
    const row = document.createElement('div');
    row.className = 'entry';

    const preset = presetById.get(g.type);
    const ic = document.createElement('span');
    ic.className = 'ic';
    ic.setAttribute('aria-hidden', 'true');
    ic.textContent = preset?.emoji ?? '·';

    const name = document.createElement('div');
    name.className = 'name';
    const nameTop = document.createElement('div');
    nameTop.textContent = `${preset?.name ?? g.type} ${volumeLabel(preset, g.volume_ml)}`;
    if (g.count > 1) {
      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = `× ${g.count} · ${g.abv}%`;
      name.append(nameTop, meta);
    } else {
      const meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = `${g.abv}%`;
      name.append(nameTop, meta);
    }

    const grams = document.createElement('div');
    grams.className = 'g';
    grams.textContent = fmtGrams(g.total_g);

    const rm = document.createElement('button');
    rm.type = 'button';
    rm.className = 'rm';
    rm.setAttribute('aria-label', 'Удалить запись');
    rm.textContent = '−';
    rm.addEventListener('click', async () => {
      // Удаляем последнюю запись группы (последний добавленный).
      const lastId = g.ids[g.ids.length - 1];
      if (!lastId) return;
      await removeEvent(lastId);
      onChanged();
    });

    row.append(ic, name, grams, rm);
    return row;
  }

  paint();
  return root;
}