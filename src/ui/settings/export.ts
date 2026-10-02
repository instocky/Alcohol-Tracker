// CSV export with BOM (\uFEFF) for Excel-ru compatibility.
// Permission: 'downloads' declared in manifest.json.

import { getEvents } from '../../storage/repo';
import { todayLocal } from '../../domain/date';

const HEADER = 'id,date,type,volume_ml,abv,pure_alcohol_g,created_at';

function csvEscape(v: string | number): string {
  // Только для строк, но наши поля — без кавычек в id/date/created_at/type.
  // На всякий случай: экранируем любые запятые/кавычки в строковых полях.
  if (typeof v === 'number') return String(v);
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

export async function exportCsv(): Promise<string> {
  const events = await getEvents();
  const lines: string[] = [HEADER];
  for (const e of events) {
    lines.push(
      [
        csvEscape(e.id),
        csvEscape(e.date),
        csvEscape(e.type),
        csvEscape(e.volume_ml),
        csvEscape(e.abv),
        csvEscape(e.pure_alcohol_g),
        csvEscape(e.created_at),
      ].join(','),
    );
  }
  return '\ufeff' + lines.join('\n');
}

export async function downloadCsv(): Promise<void> {
  const csv = await exportCsv();
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const filename = `alcohol-tracker-${todayLocal()}.csv`;
  try {
    await new Promise<void>((resolve, reject) => {
      chrome.downloads.download({ url, filename, saveAs: true }, () => {
        const err = chrome.runtime.lastError;
        if (err) reject(new Error(err.message));
        else resolve();
      });
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}