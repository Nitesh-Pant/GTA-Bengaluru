import { useEffect, useRef } from 'react';

/**
 * Keyboard navigation for option lists: number keys pick directly, arrows move, Enter/Space confirm.
 * Ignores held-down repeats so the key that opened a panel can't also choose in it.
 */
export function useMenuKeys(count: number, selected: number, setSelected: (i: number) => void, onChoose: (i: number) => void, active: boolean) {
  const state = useRef({ selected, count, onChoose, setSelected });
  state.current = { selected, count, onChoose, setSelected };
  useEffect(() => {
    if (!active) return;
    const openedAt = performance.now();
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || performance.now() - openedAt < 120) return;
      const s = state.current;
      if (/^[1-9]$/.test(e.key)) {
        const i = Number(e.key) - 1;
        if (i < s.count) {
          e.preventDefault();
          s.onChoose(i);
        }
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        s.setSelected((s.selected + 1) % s.count);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        s.setSelected((s.selected - 1 + s.count) % s.count);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        s.onChoose(s.selected);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);
}
