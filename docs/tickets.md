# MVP Tickets — v0.1

> Один файл с планом MVP. Каждый тикет — атомарный, с блокирующими edges. Делать строго по порядку (кроме случаев помеченных [parallel]).
> Бриф: `brief_20261002.md`. Engineering contract: `AGENTS.md`.

## T01 — Foundation scaffold [BLOCKER для T02+]

**Что входит:**

- `npm create vite@latest` → vanilla-ts шаблон → переименовать.
- `tsconfig.json`: strict, target ES2020, noUncheckedIndexedAccess.
- Установить `@crxjs/vite-plugin` (или fallback если не взлетит).
- `public/manifest.json` (MV3, action.popup = `index.html`, permissions = `["storage"]`).
- Иконки-плейсхолдеры `public/icons/{16,48,128}.png` (любая заглушка).
- Скопировать токены и reset из `artifacts/proposed.html` в `src/ui/styles/`.
- Каркас `index.html` + `src/main.ts` → mount `#app` div.

**Done when:**

- `npm run build` собирает в `dist/`.
- `dist/manifest.json` валиден (`chrome://extensions` → Load unpacked → popup открывается пустой).
- `npm run typecheck` = 0 ошибок.

---

## T02 — Types + storage layer [BLOCKER для T03+]

**Что входит:**

- `src/types.ts` — `Event`, `Preset`, `PresetOption` (из AGENTS.md §2).
- `src/storage/keys.ts` — `STORAGE_KEYS` enum.
- `src/storage/repo.ts` — `getEvents/addEvent/removeEvent/getPresets/setPresets` поверх `chrome.storage.local` (обёртка `chrome.storage.local.get/set` → Promise).
- `src/storage/migrate.ts` — no-op (для будущих schema versions).
- `src/domain/calc.ts` — `computePureAlcohol(volume_ml, abv): number` (round до 2 знаков).
- `src/domain/date.ts` — `todayLocal(): YYYY-MM-DD`, `formatLocal(date): YYYY-MM-DD`, `parseLocal(str)`. БЕЗ `toISOString().slice(0,10)`.
- `src/domain/presets.ts` — дефолтные пресеты vodka/wine/beer.
- Seed: при первом запуске если `EXTREMENTS[key]` отсутствует — записать дефолтные пресеты.

**Done when:**

- Smoke test (через dev console в popup): `await getEvents()` → `[]`, `await getPresets()` → 3 пресета.
- `computePureAlcohol(50, 40)` → `15.78`. `computePureAlcohol(450, 5)` → `17.75`.
- `todayLocal()` совпадает с системной датой.
- `addEvent({...})` → `getEvents().length` === 1, запись видна.

---

## T03 — Router + bottom nav + базовый shell

**Что входит:**

- `src/ui/router.ts` — hash-based, `#week | #stats | #settings`, default `#week`.
- `src/ui/components/bottomNav.ts` — 3 кнопки, активная = filled bg, переключает hash.
- 3 пустых экрана: `#week`, `#stats`, `#settings` (placeholder "WIP").
- App shell: header + screen + bottom nav, popup size 360×600.

**Done when:**

- Клик по nav меняет экран, выделение кнопки обновляется.
- Refresh popup — состояние восстановлено (hash сохраняется в URL).
- Popup помещается в 360×600 без вертикального scroll на пустых экранах.

---

## T04 — Экран «Неделя»: календарь + day title

**Что входит:**

- `src/ui/week/calendar.ts`:
  - 5 ячеек вокруг selected (по 2 слева/справа).
  - Стрелки `‹/›` смещают selected на 1 день.
  - 3 индикатора: fill (selected), ring (today, 1.5px outline), dot (has-events).
  - `data-date` на каждой ячейке для click handler.
- `src/ui/week/index.ts`:
  - Header: `«30 сен – 4 окт 2026»` (range = `min..max` из 5 видимых дней).
  - Календарь.
  - Day title: `«Четверг, 2 октября»` + тег «сегодня» справа если `selected === today`.
- `src/utils/debounce.ts` — `withDebounce(fn, 300)`.

**Done when:**

- `‹/›` смещают selected на 1 день, range в header пересчитывается.
- 3 индикатора видны одновременно на «сегодня» (выбран + ring + dot если есть запись).
- Стрелки при изменении selected уводят scroll, не выходя за реальную дату (backfill на прошлые/будущие — можно).

---

## T05 — Quick-add (карточки пресетов + тогглы)

**Что входит:**

- `src/ui/components/segmentToggle.ts` — рендер 2-сегментного тоггла (для вина/пива). Active = filled bg.
- `src/ui/week/quickAdd.ts`:
  - Карточка для каждого пресета.
  - Vodka: одна кнопка `[ + ]`, объём 50 мл.
  - Wine: тоггл `[150][100]` + `[ + ]`, активный объём из `preset.activeOptionIndex`.
  - Beer: тоггл `[0,45 л][0,33 л]` + `[ + ]`.
  - `+` имеет debounce 300мс.
  - Клик `+`:
    1. Берёт активный объём из пресета.
    2. Считает `pure_alcohol_g = computePureAlcohol(volume_ml, preset.abv)`.
    3. Снапшотит в Event.
    4. `addEvent` → обновить dayList + total.
  - `data-key` на `+` обновляется при тоггле (для тестов).
- Прессет визуально подсвечивается при hover (на десктопе) / press state (touch).

**Done when:**

- Клик `+` на водку → в storage новая запись, dayList +1, total `+15.78`.
- Тоггл вина 150→100 → `data-key` на `+` меняется, клик даёт `pure_alcohol_g ≈ 9.47`.
- Двойной клик `+` за 300мс = 1 запись (debounce работает).
- Перезапуск popup → запись на месте, `pure_alcohol_g` НЕ пересчитан из пресета.

---

## T06 — Day list + total + empty state

**Что входит:**

- `src/ui/week/dayList.ts`:
  - Список events для `selected_date`, group by type+volume_ml+abv (отображаемое `× N` если >1).
  - Каждая строка: emoji + name + объём + `× N · abv%` + `Σ grams` + `[−]`.
  - `[−]` → `removeEvent(id)` → toast undo.
- `src/ui/week/total.ts`:
  - `Σ pure_alcohol_g` (1 знак после запятой в UI).
  - Sub: `≈ X стандартных дринков` (PluralRules).
- `src/ui/week/empty.ts`:
  - Если `events.length === 0`: «Сегодня чисто. Хорошего дня.» при `selected === today`, иначе «Этот день без записей.».

**Done when:**

- Добавил водку+пиво → dayList показывает 2 строки.
- Добавил ещё водку → строка показывает `× 2 · 40%`, total = `31.6` г, sub «2 дринка» (PluralRules).
- Удалил последнюю запись → она пропала, total пересчитался, toast появился.
- Если удалить все записи — empty state с правильным текстом.

---

## T07 — Toast + undo (5 сек, last-action)

**Что входит:**

- `src/ui/components/toast.ts`:
  - 5-сек таймер, dismiss по таймеру или клику вне.
  - Текст: «Запись добавлена» / «Запись удалена».
  - Кнопка «Отменить» → восстанавливает/добавляет запись.
  - **Один toast в моменте** (новое действие перезапускает).
- `src/utils/undo.ts`:
  - `pushLast(action)` — хранит в `window.__undoStack` (1 уровень).
  - `consumeLast()` — возвращает и очищает.
- При `removeEvent(id)` если selected !== event.date → toast говорит «Запись удалена из <date>» (для прозрачности).

**Done when:**

- Клик `−` → toast «Запись удалена», 5 сек.
- Клик «Отменить» в окне 5 сек → запись восстановлена, dayList снова показывает.
- Клик `−` повторно до истечения → toast перезапускается (предыдущий action теряется).
- Toast исчезает через 5 сек без действия.

---

## T08 — Экран «Статистика»

**Что входит:**

- `src/ui/stats/index.ts`:
  - Period switcher: Неделя / Месяц / Год (segment toggle).
  - 4 карточки:
    1. Спирта всего, г
    2. Порций (events count)
    3. Дней с записями / N
    4. Дней без записей / N
  - Week = последние 7 дней включая сегодня. Month = текущий календарный месяц. Year = текущий год.
- `src/domain/stats.ts`:
  - `aggregate(events, period): { totalG, count, daysWith, daysTotal }`.
  - `daysTotal` = 7 / кол-во дней в месяце / 366(или 365).
  - `daysWith` = unique dates в window.
- Инфо-полоса (opt-in) — **out of scope v0.1**, заглушка или скрыта (см. backlog).

**Done when:**

- С добавленными записями за 3 дня в текущей неделе: «Спирта всего X г», «Порций N», «Дней с записями 3 / 7».
- Month/Year переключают окно и пересчитывают все 4 карточки.
- При пустом storage — все 4 карточки показывают «0», «0 / N».

---

## T09 — Экран «Настройки» (без db, очистка, экспорт)

**Что входит:**

- `src/ui/settings/index.ts`:
  - Секция «ПРЕСЕТЫ НАПИТКОВ»: 3 строки + `＋ Добавить пресет`.
  - Секция «ИСТОРИЯ»: последние 20 events, формат как в брифе.
  - Секция «ДАННЫЕ»: `[💾 Экспорт CSV ›]`.
  - Info-полоса: «Все данные хранятся локально. Расширение работает офлайн. Никакой синхронизации.»
- `src/ui/settings/presets.ts`:
  - Tap на пресет → mini-редактор (abv, options) в этой же строке (inline) или в модалке. v0.1 — inline collapse.
  - «＋ Добавить пресет» → пустой inline-редактор + Save/Cancel.
- `src/ui/settings/history.ts`:
  - Берёт `events.slice(-20)`, group by date, render.
  - Каждая группа: `«2 окт · сегодня»` / `«30 сен»`.
- `src/ui/settings/export.ts`:
  - CSV с BOM (`\ufeff`), header `id,date,type,volume_ml,abv,pure_alcohol_g,created_at`.
  - Trigger через `chrome.downloads.download({url: blob URL, filename: 'alcohol-tracker-YYYY-MM-DD.csv'})`.
  - Требует permission `downloads` в manifest.

**Done when:**

- 3 пресета отрисованы, tap раскрывает editor, Save → `getPresets()` обновился.
- «＋ Добавить пресет» → новый пресет в списке, доступен в quick-add.
- История: последние 20 events сгруппированы по дням с правильными заголовками.
- Экспорт CSV → файл скачивается, открывается в Excel/Numbers без кракозябр (BOM).

---

## T10 — Polish + E2E sanity

**Что входит:**

- Manual playthrough всех 12 Done-when из брифа, фиксация любых расхождений.
- Layout: проверить на ширине 320 (нижний край popup) — нет horizontal scroll.
- Touch targets: все интерактивные ≥ 36px (`--tap`).
- Цвета токени: `--accent` emerald, `--warn` amber. Никаких красных.
- Scroll внутри экранов если контент > 600px (особенно на настройках с историей).

**Done when:**

- Все 12 пунктов Done-when из брифа проходят руками.
- Закрыл/открыл popup → состояние восстановлено.
- Закрыл/открыл chrome → данные на месте.

---

## Порядок выполнения

```
T01 ─▶ T02 ─▶ T03 ─▶ T04 ─▶ T05 ─▶ T06 ─▶ T07 ─▶ T08 ─▶ T09 ─▶ T10
                                  │
                                  └─ T08/T09 можно частично параллелить после T07.
```

T02 жёстко блокирует T04+ (нужны types/storage/calc/date). T03 может стартовать параллельно с T02 (только UI-каркас, без данных).

## Не входит в MVP (backlog)

- Undo-history (multi-undo).
- Hard-reset combo (7 тапов на лого).
- Hotkeys для quick-add.
- Bulk-add / copy-from-yesterday.
- Dark mode toggle.
- Notifications / reminders.
- WHO 20 г/день threshold с amber-цветом (opt-in).