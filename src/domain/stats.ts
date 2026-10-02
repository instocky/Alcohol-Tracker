// Period aggregates. Pure, testable.

import { addDays, formatLocal, parseLocal, todayLocal } from './date';
import type { Event } from '../types';

export type Period = 'week' | 'month' | 'year';

export interface PeriodStats {
  totalG: number;
  count: number;
  daysWith: number;
  daysTotal: number;
}

export interface PeriodRange {
  from: string; // YYYY-MM-DD inclusive
  to: string;   // YYYY-MM-DD inclusive
}

function startOfToday(): Date {
  const today = parseLocal(todayLocal());
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function daysInMonth(year: number, monthIdx: number): number {
  return new Date(year, monthIdx + 1, 0).getDate();
}

export function rangeFor(period: Period): PeriodRange {
  const today = startOfToday();
  if (period === 'week') {
    const from = addDays(today, -6);
    return { from: formatLocal(from), to: formatLocal(today) };
  }
  if (period === 'month') {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    const to = new Date(today.getFullYear(), today.getMonth(), daysInMonth(today.getFullYear(), today.getMonth()));
    return { from: formatLocal(from), to: formatLocal(to) };
  }
  // year
  const from = new Date(today.getFullYear(), 0, 1);
  const to = new Date(today.getFullYear(), 11, 31);
  return { from: formatLocal(from), to: formatLocal(to) };
}

export function daysTotalFor(period: Period): number {
  if (period === 'week') return 7;
  const today = startOfToday();
  if (period === 'month') return daysInMonth(today.getFullYear(), today.getMonth());
  const y = today.getFullYear();
  return ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0) ? 366 : 365;
}

export function aggregate(events: ReadonlyArray<Event>, period: Period): PeriodStats {
  const { from, to } = rangeFor(period);
  let totalG = 0;
  let count = 0;
  const uniqueDates = new Set<string>();

  for (const e of events) {
    if (e.date < from || e.date > to) continue;
    totalG += e.pure_alcohol_g;
    count += 1;
    uniqueDates.add(e.date);
  }

  return {
    totalG: Math.round(totalG * 100) / 100,
    count,
    daysWith: uniqueDates.size,
    daysTotal: daysTotalFor(period),
  };
}