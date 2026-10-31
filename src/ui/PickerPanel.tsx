import { useEffect, useRef, useState } from 'react';
import { useMenuKeys } from './useMenuKeys';

export interface PickerItem {
  id: string;
  name: string;
  note?: string;
}

/** A "where to?" list (metro, bus, Rapido): keyboard numbers / arrows / Enter, mouse or touch. */
export function PickerPanel({
  label,
  logo,
  logoClass = '',
  title,
  subtitle,
  prompt,
  items,
  closeLabel = 'Not now',
  verb,
  closeOnBackdrop = true,
  onChoose,
  onClose,
}: {
  label: string;
  logo: string;
  logoClass?: string;
  title: string;
  subtitle: string;
  prompt?: string;
  items: PickerItem[];
  closeLabel?: string;
  verb: string;
  closeOnBackdrop?: boolean;
  onChoose: (id: string) => void;
  onClose: () => void;
}) {
  const [sel, setSel] = useState(0);
  const choose = (i: number) => (i >= items.length ? onClose() : onChoose(items[i].id));
  useMenuKeys(items.length + 1, sel, setSel, choose, true);
  // Keep the highlighted row in sight as the keys move it through a long list (not when the mouse moves it).
  const selRef = useRef<HTMLButtonElement | null>(null);
  const byMouse = useRef(false);
  useEffect(() => {
    if (!byMouse.current) selRef.current?.scrollIntoView({ block: 'nearest' });
    byMouse.current = false;
  }, [sel]);
  const hover = (i: number) => {
    if (i === sel) return;
    byMouse.current = true;
    setSel(i);
  };
  const row = (i: number, body: React.ReactNode) => (
    <li key={i}>
      <button ref={i === sel ? selRef : undefined} className={i === sel ? 'option selected' : 'option'} onMouseEnter={() => hover(i)} onClick={() => choose(i)}>
        <kbd>{i + 1}</kbd> {body}
      </button>
    </li>
  );
  return (
    <div className="modal-backdrop" onClick={closeOnBackdrop ? onClose : undefined}>
      <div className="metro panel" role="dialog" aria-label={label} onClick={(e) => e.stopPropagation()}>
        <div className="metro-head">
          <span className={`metro-logo ${logoClass}`}>{logo}</span>
          <div>
            <div className="metro-title">{title}</div>
            <div className="muted">{subtitle}</div>
          </div>
        </div>
        {prompt && <p className="muted">{prompt}</p>}
        <ol className="options picker-options">
          {items.map((it, i) =>
            row(
              i,
              <>
                {it.name} {it.note && <span className="muted">· {it.note}</span>}
              </>,
            ),
          )}
          {row(items.length, closeLabel)}
        </ol>
        <div className="panel-foot muted">
          <kbd>Enter</kbd> {verb} · <kbd>Esc</kbd> cancel
        </div>
      </div>
    </div>
  );
}
