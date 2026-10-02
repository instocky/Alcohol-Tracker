// 2-сегментный тоггл (вино/пиво). Active = filled bg.

export interface SegmentToggle {
  root: HTMLElement;
  getActiveIndex(): number;
  setActiveIndex(i: number): void;
}

export function renderSegmentToggle(
  labels: readonly string[],
  initialIndex: number,
  onChange: (i: number) => void,
): SegmentToggle {
  if (labels.length < 2) throw new Error('segmentToggle needs >= 2 labels');
  let active = initialIndex;

  const root = document.createElement('div');
  root.className = 'qa-toggle';

  const buttons: HTMLButtonElement[] = [];

  for (let i = 0; i < labels.length; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.segment = String(i);
    btn.className = i === active ? 'is-on' : '';
    btn.textContent = labels[i] ?? '';
    btn.addEventListener('click', () => {
      if (active === i) return;
      active = i;
      paint();
      onChange(i);
    });
    buttons.push(btn);
    root.append(btn);
  }

  function paint(): void {
    for (let i = 0; i < buttons.length; i++) {
      const b = buttons[i];
      if (!b) continue;
      b.classList.toggle('is-on', i === active);
    }
  }

  return {
    root,
    getActiveIndex: () => active,
    setActiveIndex(i: number): void {
      if (i < 0 || i >= labels.length) return;
      active = i;
      paint();
    },
  };
}