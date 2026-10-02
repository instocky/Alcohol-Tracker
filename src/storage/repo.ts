// Promise-wrapped chrome.storage.local access.
// Repo does NOT aggregate — aggregation lives in domain/stats.ts.

import type { Event, Preset } from '../types';
import { STORAGE_KEYS } from './keys';

type EventMap = { [STORAGE_KEYS.events]: Event[] };
type PresetMap = { [STORAGE_KEYS.presets]: Preset[] };

function getSingle<K extends keyof typeof STORAGE_KEYS>(key: K): Promise<unknown> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (data) => {
      const err = chrome.runtime.lastError;
      if (err) reject(new Error(err.message));
      else resolve(data[key]);
    });
  });
}

function setSingle(map: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(map, () => {
      const err = chrome.runtime.lastError;
      if (err) reject(new Error(err.message));
      else resolve();
    });
  });
}

export async function getEvents(): Promise<Event[]> {
  const raw = await getSingle(STORAGE_KEYS.events);
  return Array.isArray(raw) ? (raw as Event[]) : [];
}

export async function addEvent(e: Event): Promise<void> {
  const current = await getEvents();
  await setSingle({ [STORAGE_KEYS.events]: [...current, e] } satisfies EventMap);
}

export async function removeEvent(id: string): Promise<void> {
  const current = await getEvents();
  const next = current.filter((ev) => ev.id !== id);
  await setSingle({ [STORAGE_KEYS.events]: next } satisfies EventMap);
}

export async function getPresets(): Promise<Preset[]> {
  const raw = await getSingle(STORAGE_KEYS.presets);
  return Array.isArray(raw) ? (raw as Preset[]) : [];
}

export async function setPresets(presets: Preset[]): Promise<void> {
  await setSingle({ [STORAGE_KEYS.presets]: presets } satisfies PresetMap);
}