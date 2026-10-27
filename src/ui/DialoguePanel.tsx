import { useEffect, useState } from 'react';
import { audio } from '../game/audio';
import { bridge } from '../game/bridge';
import { useUi } from '../store/uiStore';
import { useMenuKeys } from './useMenuKeys';

export function DialoguePanel() {
  const d = useUi((s) => s.dialogue);
  const [sel, setSel] = useState(0);
  useEffect(() => setSel(0), [d?.text]);
  const choose = (i: number) => {
    audio.chime('ui');
    bridge.api?.chooseOption(i);
  };
  useMenuKeys(d?.options.length ?? 0, sel, setSel, choose, !!d);
  if (!d) return null;
  return (
    <div className="dialogue panel" role="dialog" aria-label={`Talking to ${d.speaker || 'narrator'}`}>
      {d.speaker && (
        <div className="dialogue-head">
          <span className="dialogue-name">{d.speaker}</span>
          <span className="muted">{d.role}</span>
        </div>
      )}
      <p className={d.speaker ? 'dialogue-text' : 'dialogue-text narration'}>{d.text}</p>
      <ol className="options">
        {d.options.map((o, i) => (
          <li key={o}>
            <button className={i === sel ? 'option selected' : 'option'} onMouseEnter={() => setSel(i)} onClick={() => choose(i)}>
              <kbd>{i + 1}</kbd> {o}
            </button>
          </li>
        ))}
      </ol>
      <div className="panel-foot muted">
        <kbd>1</kbd>-<kbd>{d.options.length}</kbd> or <kbd>↑↓</kbd> + <kbd>Enter</kbd> · <kbd>Esc</kbd> leave
      </div>
    </div>
  );
}
