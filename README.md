# Alcohol Tracker

Chrome-расширение для локального учёта употреблённого алкоголя. Базовой единицей хранения — **граммы чистого спирта**.

## Status

**v0.1 — design frozen, не реализован.**

Design-итерации завершены. Артефакт `proposed.html` принят как референс для имплементации. Бриф фиксирует принятые UX и data-правила.

## Содержимое

| Файл | Назначение |
|------|------------|
| `brief_20261002.md` | Бриф v0.1 — UX, data model, расчёты, constraints, backlog, anti-patterns. Источник правды для имплементации. |
| `artifacts/current.html` | Визуализация исходного брифа (baseline). |
| `artifacts/proposed.html` | Design-референс v0.1. Интерактивный preview: календарь, quick-add с тогглами, undo, debounce, дринки, история. |

## Где смотреть

1. Бриф — `brief_20261002.md`. Прочитать целиком до старта.
2. `proposed.html` — открыть в браузере, прокликать demo-кнопки (`Week empty` / `Week filled` / `Stats` / `Settings`), проверить `‹/›` в календаре и тогглы объёма.

## Стек (целевой)

- Manifest V3
- TypeScript, Vite, vanilla HTML/CSS/TS
- chrome.storage.local — единственное хранилище
- Offline-first, без backend / auth / sync / telemetry

## Разработка

```text
# (после имплементации)
npm install
npm run build       # vite build → dist/
# Load unpacked: dist/
```

> До старта имплементации — никакого кода в репо нет. Только спека + design preview.

## Backlog (не v0.1)

См. секцию «Backlog» в `brief_20261002.md`. Ключевое: multi-undo, hard-reset combo, hotkeys, bulk-add, dark mode, WHO 20 г/день как opt-in порог.