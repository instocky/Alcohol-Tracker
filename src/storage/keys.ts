export const STORAGE_KEYS = {
  events: 'events',
  presets: 'presets',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];