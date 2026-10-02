import './ui/styles/tokens.css';
import './ui/styles/reset.css';
import './ui/styles/app.css';

import { getPresets, setPresets } from './storage/repo';
import { migrate } from './storage/migrate';
import { DEFAULT_PRESETS } from './domain/presets';

async function bootstrap(): Promise<void> {
  // 1. Migrate (no-op in v0.1, hook for future schema bumps).
  await migrate();

  // 2. Seed presets on first launch.
  const existing = await getPresets();
  if (existing.length === 0) {
    await setPresets([...DEFAULT_PRESETS]);
  }

  // T03 will mount the router; for now show "ready".
  const root = document.getElementById('app');
  if (root) {
    root.innerHTML = `
      <div class="frame">
        <main class="app" aria-live="polite">
          <div class="boot">v0.1 — data layer ready</div>
        </main>
      </div>
    `;
  }
}

void bootstrap();