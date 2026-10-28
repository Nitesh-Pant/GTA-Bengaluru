import { useState } from 'react';
import { useMenuKeys } from './useMenuKeys';

export interface PickerItem {
  id: string;
  name: string;
  note?: string;
}

/** A "where to?" list (metro, bus, Rapido): keyboard 1–9 / arrows / Enter, mouse or touch. */
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
  const row = (i: number, body: React.ReactNode) => (
    <li key={i}>
      <button className={i === sel ? 'option selected' : 'option'} onMouseEnter={() => setSel(i)} onClick={() => choose(i)}>
        {i < 9 && <kbd>{i + 1}</kbd>} {body}
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
