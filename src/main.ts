import './ui/styles/tokens.css';
import './ui/styles/reset.css';
import './ui/styles/app.css';

const root = document.getElementById('app');
if (root) {
  // T01: empty shell. T03 will mount the router; T04+ will mount screens.
  root.innerHTML = `
    <div class="frame">
      <main class="app" aria-live="polite">
        <div class="boot">v0.1 — scaffold ready</div>
      </main>
    </div>
  `;
}
