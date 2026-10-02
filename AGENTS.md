# Alcohol Tracker — AGENTS.md

> Источник правды для имплементации. Бриф `brief_20261002.md` — UX/data contract. Этот файл — engineering contract (стек, структура, модули, контракты между ними).

## 0. Стек и решения

- **MV3 Chrome Extension**, popup-режим (action-click → popup), не side panel.
- **TypeScript strict**, **Vite**, vanilla HTML/CSS/TS. Без фреймворков (React/Vue — overkill для popup 360×600).
- **chrome.storage.local** — единственное хранилище. Никакого IndexedDB / localStorage / backend.
- **uuid v4** — для `id` событий (`crypto.randomUUID()`, нативный, без dep).
- **Без runtime-зависимостей** кроме Vite/TS. Pure ES2020 target, no polyfills.
- **Popup size**: 360×600 как в `artifacts/proposed.html`. Min height = 600, scroll внутри экранов если контент > высоты.

## 1. Структура репо

```text
alcohol-tracker/
├── brief_20261002.md           # источник правды UX/data
├── AGENTS.md                   # ← этот файл
├── README.md
├── artifacts/
│   ├── current.html            # baseline
│   └── proposed.html           # design ref v0.1 (открыть, прокликать)
├── docs/
│   └── tickets.md              # план MVP по тикетам
├── public/
│   ├── manifest.json           # MV3 manifest
│   └── icons/                  # 16/48/128, можно пустые PNG-плейсхолдеры
├── src/
│   ├── main.ts                 # entry, mount роутера + bottom nav
│   ├── types.ts                # все доменные типы в одном файле
│   ├── storage/
│   │   ├── keys.ts             # STORAGE_KEYS = ['events', 'presets']
│   │   ├── repo.ts             # async обёртки над chrome.storage.local
│   │   └── migrate.ts          # v0.x schema migrations (no-op в v0.1)
│   ├── domain/
│   │   ├── date.ts             # local YYYY-MM-DD (НЕ ISO, НЕ UTC)
│ │   │   ├── calc.ts            # pure_alcohol_g = volume_ml * (abv/100) * 0.789
│   │   │   └── stats.ts         # period aggregates (week/month/year)
│   │   └── presets.ts          # дефолтные пресеты: vodka/wine/beer
│   ├── ui/
│   │   ├── router.ts           # 3 экрана, state в URL hash (#week/stats/settings)
│   │   ├── week/               # экран «Неделя»
│   │   │   ├── index.ts
│   │   │   ├── calendar.ts     # 5 ячеек + ring/dot/fill
│   │   │   ├── quickAdd.ts     # карточки пресетов + тогглы объёма
│   │   │   ├── dayList.ts      # список записей дня + −
│   │   │   ├── total.ts        # граммы + дринки
│   │   │   └── empty.ts
│   │   ├── stats/
│   │   │   └── index.ts
│   │   ├── settings/
│   │   │   ├── index.ts
│   │   │   ├── presets.ts
│   │   │   ├── history.ts      # последние 20, grouped by day
│   │   │   └── export.ts       # CSV
│   │   ├── components/
│   │   │   ├── bottomNav.ts
│   │   │   ├── toast.ts        # 5-сек undo toast
│   │   │   └── segmentToggle.ts# тоггл объёма (вино/пиво)
│   │   └── styles/
│   │       ├── tokens.css      # CSS variables из proposed.html
│   │       ├── reset.css
│   │       └── app.css         # компоновка popup
│   └── utils/
│       ├── debounce.ts         # 300мс per-button debounce
│       └── undo.ts             # last-action stack (1 шаг)
└── vite.config.ts              # Vite + CRX plugin (или ручной build → dist/)
```

## 2. Storage contract

**Keys** (`src/storage/keys.ts`):

```ts
export const STORAGE_KEYS = {
  events: 'events',           // Event[]
  presets: 'presets',         // Preset[]
} as const;
```

**Event** (`src/types.ts`):

```ts
export interface Event {
  id: string;                 // crypto.randomUUID()
  date: string;               // YYYY-MM-DD, local date
  type: string;               // preset.id ('vodka' | 'wine' | 'beer' | custom)
  volume_ml: number;          // > 0, integer ml (для пива допускаем 450/330 — целое)
  abv: number;                // 0..100, fixed 1 decimal (например 40.0)
  pure_alcohol_g: number;     // СНАПШОТ на момент записи, 2 знака после запятой
  created_at: string;         // ISO 8601 UTC, для сортировки в истории
}
```

**Preset**:

```ts
export interface PresetOption { volume_ml: number; label: string }  // '50 мл' / '150 мл' и т.д.
export interface Preset {
  id: string;                 // slug: 'vodka' / 'wine' / 'beer' / uuid для кастомных
  name: string;               // 'Водка'
  emoji: string;              // 🥃/🍷/🍺 — допустимо v0.1 (anti-pattern note в брифе есть, осознанно)
  abv: number;                // 0..100
  options: PresetOption[];    // 1 элемент для водки, 2 для вина/пива
  activeOptionIndex: number;  // 0 или 1, мутируется при тоггле
}
```

**Дефолтные пресеты** (seed в `domain/presets.ts`, пишутся в storage при первом запуске если пусто):

- Водка: id=`vodka`, abv=40, options=[{50, '50 мл'}], activeIndex=0
- Вино: id=`wine`, abv=12, options=[{150, '150 мл'},{100, '100 мл'}], activeIndex=0
- Пиво: id=`beer`, abv=5, options=[{450, '0,45 л'},{330, '0,33 л'}], activeIndex=0

**Repo API** (`src/storage/repo.ts`):

```ts
export async function getEvents(): Promise<Event[]>
export async function addEvent(e: Event): Promise<void>     // append
export async function removeEvent(id: string): Promise<void> // по id
export async function getPresets(): Promise<Preset[]>
export async function setPresets(p: Preset[]): Promise<void>  // replace all
```

> Repo НЕ агрегирует. Агрегация — в `domain/stats.ts` на render. Каждое `+` = 1 event append = 1 запись в storage.

## 3. Data rules (контракт для имплементации)

- `pure_alcohol_g = round(volume_ml * (abv/100) * 0.789, 2)`. **Никогда** не считать из пресета при чтении — снапшот хранится.
- `date` = local date в формате `YYYY-MM-DD`. Без времени. **Запрещено** `new Date().toISOString().slice(0,10)` — это UTC.
- `created_at` = ISO 8601 UTC, для сортировки в истории (последние 20).
- Агрегация: `events → filter(date ∈ window) → reduce(sum pure_alcohol_g)` — pure function, тестируемая.
- Стандартные дринки: `pure_alcohol_g / 14`, `Intl.PluralRules('ru', {type:'fraction'})` для склонения («дринк / дринка / дринков»).
- Debounce на `+` — per-button (через `data-key`), 300мс. После успешного добавления — сброс.
- Undo: 1 уровень. Хранится в памяти (НЕ в storage), `{type: 'add'|'remove', event: Event}`.

## 4. UX реализация (must match `proposed.html`)

- 5-дневное окно: центр = выбранный день, по 2 дня влево/вправо. `‹/›` смещают на 1 день (не на неделю).
- Три индикатора (по брифу §«Календарь»): fill = selected, ring = today, dot = has-events. Они **независимы** — selected сегодня = ring + fill + dot.
- Day title: `«Четверг, 2 октября»` + тег «сегодня» справа **только** при `selected === today`.
- Empty state: разный текст для today vs selected-other.
- Bottom nav: 3 кнопки «Неделя / Статистика / Настройки». Активная — filled bg.
- Toast: появляется снизу, 5 сек, [Действие] слева + [Отменить] справа. Для undo remove: возвращает запись на исходный день, не на selected.
- CSV экспорт: header `id,date,type,volume_ml,abv,pure_alcohol_g,created_at`. UTF-8 с BOM (для Excel по-русски).

## 5. CSS tokens (выровнять с `proposed.html`)

```css
--bg:#fafaf7; --surface:#fff; --fg:#1a1a1a; --fg-muted:#6b6b6b; --fg-faint:#a3a3a3;
--line:#ececec; --line-strong:#d4d4d4;
--accent:#0f7a52; --accent-bg:#e8f3ed;
--warn:#b66a00; --warn-bg:#fbf1e3;
--radius:10px; --radius-sm:6px; --tap:36px;
```

## 6. Сборка

- `npm create vite@latest` → vanilla-ts, переименовать.
- `@crxjs/vite-plugin` для MV3 (manifest.json + html → dist). Если не взлетит — fallback на ручной `vite build` + копирование manifest.json в `dist/`.
- `npm run build` → `dist/` готов к Load unpacked.
- `npm run typecheck` = `tsc --noEmit`. **CI gate**.

## 7. Anti-patterns (из брифа)

- НЕ объединять `+` в 1 физическую запись. Цена — потеря истории «я выпил два бокала подряд».
- НЕ показывать «тревожный уровень» / «перебор» без opt-in (opt-in WHO 20 г/день — backlog).
- НЕ красный цвет для shame-индикации. Только amber `--warn` если opt-in.
- НЕ «Очистить все данные» в UI v0.1 (случайный тап = потеря).
- НЕ считать `pure_alcohol_g` из пресета при чтении. Только снапшот.

## 8. Definition of Done (v0.1)

См. бриф §«Done when». 12 пунктов. Каждый маппится на конкретный тест-мануал (открыть popup → кликнуть → сверить).