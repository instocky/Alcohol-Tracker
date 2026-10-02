import { getEvents } from '../../storage/repo';
import type { Event, Preset } from '../../types';
import { todayLocal, parseLocal } from '../../domain/date';

interface Group {
  dateLabel: string;
  rows: Event[];
}

function groupEvents(events: Event[]): Group[] {
  const map = new Map<string, Event[]>();
  for (const e of events) {
    const list = map.get(e.date) ?? [];
    list.push(e);
    map.set(e.date, list);
  }
  // Sort by date desc
  const sorted = Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  const today = todayLocal();
  const groups: Group[] = [];
  for (const [date, rows] of sorted) {
    const d = parseLocal(date);
    const base = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    const tag = date === today ? `${base} · сегодня` : base;
    // Inside group: latest first
    rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    groups.push({ dateLabel: tag, rows });
  }
  return groups;
}

function volumeLabel(preset: Preset | undefined, volume_ml: number): string {
  const opt = preset?.options.find((o) => o.volume_ml === volume_ml);
  return opt?.label ?? `${volume_ml} мл`;
}

export function renderHistory(presets: ReadonlyArray<Preset>): HTMLElement {
  const root = document.createElement('div');
  root.className = 'history';

  const presetById = new Map(presets.map((p) => [p.id, p]));

  async function paint(): Promise<void> {
    root.innerHTML = '';
    const all = await getEvents();
    const last20 = all.slice(-20).reverse();
    const groups = groupEvents(last20);

    if (groups.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'history-empty';
      empty.textContent = 'История пуста.';
      root.append(empty);
      return;
    }

    for (const g of groups) {
      const groupEl = document.createElement('div');
      groupEl.className = 'history-group';
      const head = document.createElement('div');
      head.className = 'history-head';
      head.textContent = g.dateLabel;
      groupEl.append(head);
      for (const e of g.rows) {
        const preset = presetById.get(e.type);
        const row = document.createElement('div');
        row.className = 'history-row';
        const left = document.createElement('div');
        left.className = 'left';
        const ic = document.createElement('span');
        ic.className = 'ic';
        ic.textContent = preset?.emoji ?? '·';
        const txt = document.createElement('span');
        txt.textContent = `${preset?.name ?? e.type} ${volumeLabel(preset, e.volume_ml)} × 1 · ${e.abv}%`;
        left.append(ic, txt);
        const grams = document.createElement('span');
        grams.className = 'g';
        grams.textContent = `${e.pure_alcohol_g.toFixed(1)} г`;
        row.append(left, grams);
        groupEl.append(row);
      }
      root.append(groupEl);
    }
  }

  void paint();
  return root;
}