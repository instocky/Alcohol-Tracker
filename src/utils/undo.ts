// Last-action stack: 1 уровень, в памяти (НЕ в storage).

import type { Event } from '../types';

export type UndoAction =
  | { type: 'add'; event: Event }
  | { type: 'remove'; event: Event };

let last: UndoAction | null = null;

export function pushLast(action: UndoAction): void {
  last = action;
}

export function popLast(): UndoAction | null {
  const a = last;
  last = null;
  return a;
}

export function hasLast(): boolean {
  return last !== null;
}