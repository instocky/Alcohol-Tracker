// Domain types — single source of truth.
// brief §Data model + AGENTS.md §2.

export interface PresetOption {
  volume_ml: number; // > 0
  label: string;     // human-readable, e.g. '50 мл', '0,45 л'
}

export interface Preset {
  id: string;                // 'vodka' | 'wine' | 'beer' | uuid для кастомных
  name: string;              // 'Водка'
  emoji: string;             // 🥃 / 🍷 / 🍺 — допустимо v0.1 (anti-pattern осознанно)
  abv: number;               // 0..100, 1 decimal precision
  options: PresetOption[];   // 1 для водки, 2 для вина/пива
  activeOptionIndex: number; // 0..options.length-1
}

export interface Event {
  id: string;                // crypto.randomUUID
  date: string;              // YYYY-MM-DD local
  type: string;              // preset.id)
  volume_ml: number;         // > 0
  abv: number;               // 0..100
  pure_alcohol_g: number;    // SNAPSHOT, 2 знака после запятой
  created_at: string;        // ISO 8601 UTC
}