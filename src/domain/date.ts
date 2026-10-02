// Local-date helpers. NEVER use new Date().toISOString().slice(0,10)
// — это UTC и баг на таймзонах. Brief §Data rules.

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatLocal(date: Date): string {
  // YYYY-MM-DD in *local* time.
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayLocal(): string {
  return formatLocal(new Date());
}

export function parseLocal(str: string): Date {
  // 'YYYY-MM-DD' → Date at local midnight. NaN-safe: throws on bad input.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
  if (!m) throw new Error(`bad local date: ${str}`);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  return new Date(y, mo - 1, d);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function isSameLocal(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}