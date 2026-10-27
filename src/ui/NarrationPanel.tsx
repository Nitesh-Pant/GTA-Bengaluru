import { useEffect } from 'react';
import { bridge } from '../game/bridge';
import { useUi } from '../store/uiStore';

export function NarrationPanel() {
  const n = useUi((s) => s.narration);
  useEffect(() => {
    if (!n) return;
    const openedAt = performance.now();
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || performance.now() - openedAt < 150) return;
      if (e.key === 'Enter' || e.key === ' ' || e.key.toLowerCase() === 'e') {
        e.preventDefault();
        bridge.api?.closeNarration();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [n]);
  if (!n) return null;
  return (
    <div className="dialogue panel" role="dialog" aria-label={n.title}>
      <div className="dialogue-head">
        <span className="dialogue-name">{n.title}</span>
      </div>
      <p className="dialogue-text narration">{n.text}</p>
      <button className="option selected" onClick={() => bridge.api?.closeNarration()}>
        <kbd>Enter</kbd> Moo. (Close)
      </button>
    </div>
  );
}
