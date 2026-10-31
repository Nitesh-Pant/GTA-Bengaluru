import { useState } from 'react';
import { BUCKET } from '../data/bucket';
import { DISHES } from '../data/food';
import { DISTRICTS } from '../data/map';
import { POIS } from '../data/pois';
import { bridge } from '../game/bridge';
import { bucketDone } from '../logic/bucket';
import { visibilityOf } from '../logic/discovery';
import { uiStore, useUi } from '../store/uiStore';
import { KIND_COLOUR } from './Minimap';

type Tab = 'try' | 'food' | 'places';

/**
 * The Bengaluru Bucket List, the one place for progress: things to try (ticked off as you go, with a
 * hint and "Show me" for the rest), the food book, and the places you've found.
 */
export function BucketPanel() {
  const panel = useUi((s) => s.panel);
  const stats = useUi((s) => s.stats);
  const discovered = useUi((s) => s.discovered);
  const hinted = useUi((s) => s.hinted);
  const tasted = useUi((s) => s.tasted);
  const marks = useUi((s) => s.marks);
  const destination = useUi((s) => s.destination);
  const [tab, setTab] = useState<Tab>('try');
  if (panel !== 'bucket') return null;
  const done = new Set(bucketDone(BUCKET, { stats, discovered, tasted, marks }));
  const close = () => uiStore.set({ panel: null });
  const tabs: Array<[Tab, string]> = [
    ['try', `To try ${done.size}/${BUCKET.length}`],
    ['food', `Food book ${tasted.length}/${DISHES.length}`],
    ['places', `Places ${discovered.length}/${POIS.length}`],
  ];
  return (
    <div className="modal-backdrop bucket-backdrop" onClick={close}>
      <div className="bucket panel" role="dialog" aria-label="Bucket list" onClick={(e) => e.stopPropagation()}>
        <div className="journal-head">
          <h2>Bengaluru Bucket List</h2>
          <button className="btn bucket-close" aria-label="Close bucket list" onClick={close}>
            ✕
          </button>
        </div>
        <div className="bucket-tabs" role="tablist">
          {tabs.map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'btn btn-on' : 'btn'} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>
        {tab === 'try' && (
          <>
            <div className="bucket-bar" aria-hidden>
              <i style={{ width: `${(done.size / BUCKET.length) * 100}%` }} />
            </div>
            <div className="bucket-body">
              {[...new Set(BUCKET.map((b) => b.group))].map((g) => (
                <section key={g}>
                  <h3>{g}</h3>
                  {BUCKET.filter((b) => b.group === g).map((b) => (
                    <Item
                      key={b.id}
                      done={done.has(b.id)}
                      title={b.title}
                      hint={b.hint}
                      action={b.show && !done.has(b.id) ? { label: 'Show me', run: () => (close(), bridge.api?.showBucket(b.id)) } : undefined}
                    />
                  ))}
                </section>
              ))}
            </div>
          </>
        )}
        {tab === 'food' && (
          <div className="bucket-body">
            <p className="muted">Order something at a counter to stamp it. Every dish is somewhere in the city (festival sweets on their day).</p>
            {DISHES.map((d) => {
              const ok = tasted.includes(d.id);
              return <Item key={d.id} done={ok} title={d.name} hint={ok ? d.blurb : `Find it at ${d.where}.`} showHintWhenDone />;
            })}
          </div>
        )}
        {tab === 'places' && (
          <div className="bucket-body">
            <p className="muted">Places you pass are found automatically. Mark one to get an arrow to it.</p>
            {DISTRICTS.map((d) => {
              const state = { discovered, hinted };
              const pois = POIS.filter((p) => p.district === d.id && visibilityOf(state, p) !== 'secret');
              const secrets = POIS.filter((p) => p.district === d.id && visibilityOf(state, p) === 'secret').length;
              if (!pois.length && !secrets) return null;
              return (
                <section key={d.id}>
                  <h3>{d.name}</h3>
                  {pois.map((p) => {
                    const known = visibilityOf(state, p) === 'known';
                    const tip = hinted.includes(p.id);
                    const isDest = destination === p.id;
                    return (
                      <Item
                        key={p.id}
                        done={known}
                        colour={KIND_COLOUR[p.kind]}
                        title={known ? p.name : tip ? `${p.name} (tip)` : '??? (not found yet)'}
                        hint={known ? p.description : tip ? (p.hint ?? 'Someone mentioned this place…') : 'Seen on a signboard. Go find it.'}
                        showHintWhenDone
                        action={known || tip || !p.hidden ? { label: isDest ? 'Clear' : 'Mark', run: () => bridge.api?.setDestination(isDest ? null : p.id) } : undefined}
                      />
                    );
                  })}
                  {secrets > 0 && <div className="muted bucket-secret">+ {secrets} secret {secrets === 1 ? 'spot' : 'spots'}. Talk to locals.</div>}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/** One row: a tick box (or a coloured dot for places), a title, a hint, and maybe a button. */
function Item({
  done,
  title,
  hint,
  colour,
  showHintWhenDone = false,
  action,
}: {
  done: boolean;
  title: string;
  hint: string;
  colour?: string;
  showHintWhenDone?: boolean;
  action?: { label: string; run: () => void };
}) {
  return (
    <div className={done ? (showHintWhenDone ? 'bucket-item done kept' : 'bucket-item done') : 'bucket-item'}>
      <span className="bucket-check" style={done && colour ? { background: colour, borderColor: colour } : undefined} aria-label={done ? 'Done' : 'Not yet'}>
        {done ? '✓' : ''}
      </span>
      <div className="bucket-text">
        <div className="bucket-title">{title}</div>
        {(!done || showHintWhenDone) && <div className="bucket-hint">{hint}</div>}
      </div>
      {action && (
        <button className="btn bucket-show" onClick={action.run}>
          {action.label}
        </button>
      )}
    </div>
  );
}
