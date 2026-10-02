import type { Event } from '../../types';

const STD_DRINK_G = 14;

function sumG(events: ReadonlyArray<Event>): number {
  let s = 0;
  for (const e of events) s += e.pure_alcohol_g;
  return s;
}

function pluralRu(n: number): string {
  // PluralRules('ru', { type: 'fraction' }) — для дробей.
  // Для слов «дринков» используем category-правила.
  const pr = new Intl.PluralRules('ru');
  const cat = pr.select(n);
  if (cat === 'one') return 'дринк';
  if (cat === 'few') return 'дринка';
  return 'дринков';
}

export function renderTotal(events: ReadonlyArray<Event>): HTMLElement {
  const root = document.createElement('div');
  root.className = 'total';

  const left = document.createElement('div');
  left.className = 'left';

  const lbl = document.createElement('div');
  lbl.className = 'lbl';
  lbl.textContent = 'Итого спирта';

  const sum = sumG(events);
  const drinks = sum / STD_DRINK_G;
  const sub = document.createElement('div');
  sub.className = 's';
  const rounded = Math.round(drinks * 10) / 10;
  sub.textContent = `≈ ${rounded.toFixed(1)} ${pluralRu(Math.round(rounded))}`;

  left.append(lbl, sub);

  const val = document.createElement('div');
  val.className = 'val';
  val.textContent = sum.toFixed(1);
  const u = document.createElement('span');
  u.className = 'u';
  u.textContent = 'г';
  val.append(u);

  root.append(left, val);
  return root;
}