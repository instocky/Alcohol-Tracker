import type { Preset } from '../types';

// Дефолтные пресеты — seed при первом запуске если storage пуст.
export const DEFAULT_PRESETS: readonly Preset[] = [
  {
    id: 'vodka',
    name: 'Водка',
    emoji: '🥃',
    abv: 40,
    options: [{ volume_ml: 50, label: '50 мл' }],
    activeOptionIndex: 0,
  },
  {
    id: 'wine',
    name: 'Вино',
    emoji: '🍷',
    abv: 12,
    options: [
      { volume_ml: 150, label: '150 мл' },
      { volume_ml: 100, label: '100 мл' },
    ],
    activeOptionIndex: 0,
  },
  {
    id: 'beer',
    name: 'Пиво',
    emoji: '🍺',
    abv: 5,
    options: [
      { volume_ml: 450, label: '0,45 л' },
      { volume_ml: 330, label: '0,33 л' },
    ],
    activeOptionIndex: 0,
  },
] as const;