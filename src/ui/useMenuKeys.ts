import { useEffect, useRef } from 'react';

/**
 * Keyboard navigation for option lists: number keys pick directly, arrows move, Enter/Space confirm.
 * Long lists take two-digit numbers: "1" waits a moment in case "2" follows for item 12.
 * Ignores held-down repeats so the key that opened a panel can't also choose in it.
 */
export function useMenuKeys(count: number, selected: number, setSelected: (i: number) => void, onChoose: (i: number) => void, active: boolean) {
  const state = useRef({ selected, count, onChoose, setSelected });
  state.current = { selected, count, onChoose, setSelected };
  useEffect(() => {
    if (!active) return;
    const openedAt = performance.now();
    let typed = '';
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || performance.now() - openedAt < 120) return;
      const s = state.current;
      if (/^[0-9]$/.test(e.key)) {
        clearTimeout(timer);
        // A second digit that makes no item starts again from this one.
        typed = Number(typed + e.key) <= s.count ? typed + e.key : e.key;
        const n = Number(typed);
        if (n < 1 || n > s.count) {
          typed = '';
          return;
        }
        e.preventDefault();
        if (n * 10 > s.count) {
          typed = '';
          s.onChoose(n - 1);
        } else {
          s.setSelected(n - 1);
          timer = setTimeout(() => {
            typed = '';
            state.current.onChoose(n - 1);
          }, 700);
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
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', onKey);
    };
  }, [active]);
}
