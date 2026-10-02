// 5-сек toast с «Отменить». Один в моменте — новый вызов перезапускает таймер.

const DURATION_MS = 5000;

let root: HTMLDivElement | null = null;
let timer: number | null = null;

function ensureRoot(): HTMLElement {
  if (root) return root;
  const frame = document.querySelector('.frame');
  const r = document.createElement('div');
  r.className = 'toast';
  r.setAttribute('role', 'status');
  r.setAttribute('aria-live', 'polite');
  (frame ?? document.body).append(r);
  root = r;
  return r;
}

function clearTimer(): void {
  if (timer !== null) {
    window.clearTimeout(timer);
    timer = null;
  }
}

export function showToast(text: string, onUndo: () => void): void {
  const r = ensureRoot();
  clearTimer();

  r.innerHTML = '';
  const label = document.createElement('span');
  label.textContent = text;
  const undoBtn = document.createElement('button');
  undoBtn.type = 'button';
  undoBtn.className = 'undo';
  undoBtn.textContent = 'Отменить';
  undoBtn.addEventListener('click', () => {
    clearTimer();
    r.classList.remove('is-visible');
    onUndo();
  });

  r.append(label, undoBtn);
  // Force reflow before adding class — ensures transition fires.
  void r.offsetHeight;
  r.classList.add('is-visible');

  timer = window.setTimeout(() => {
    r.classList.remove('is-visible');
    timer = null;
  }, DURATION_MS);
}