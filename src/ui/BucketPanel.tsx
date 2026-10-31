import { BUCKET } from '../data/bucket';
import { bridge } from '../game/bridge';
import { bucketDone } from '../logic/bucket';
import { uiStore, useUi } from '../store/uiStore';

/** The Bengaluru Bucket List: everything to try, ticked off as you go, with a hint and "Show me" for the rest. */
export function BucketPanel() {
  const panel = useUi((s) => s.panel);
  const stats = useUi((s) => s.stats);
  const discovered = useUi((s) => s.discovered);
  const tasted = useUi((s) => s.tasted);
  const marks = useUi((s) => s.marks);
  if (panel !== 'bucket') return null;
  const done = new Set(bucketDone(BUCKET, { stats, discovered, tasted, marks }));
  const groups = [...new Set(BUCKET.map((b) => b.group))];
  const close = () => uiStore.set({ panel: null });
  return (
    <div className="modal-backdrop bucket-backdrop" onClick={close}>
      <div className="bucket panel" role="dialog" aria-label="Bucket list" onClick={(e) => e.stopPropagation()}>
        <div className="journal-head">
          <h2>Bengaluru Bucket List</h2>
          <span className="muted">
            {done.size} / {BUCKET.length} done
          </span>
          <button className="btn bucket-close" aria-label="Close bucket list" onClick={close}>
            ✕
          </button>
        </div>
        <div className="bucket-bar" aria-hidden>
          <i style={{ width: `${(done.size / BUCKET.length) * 100}%` }} />
        </div>
        <div className="bucket-body">
          {groups.map((g) => (
            <section key={g}>
              <h3>{g}</h3>
              {BUCKET.filter((b) => b.group === g).map((b) => {
                const ok = done.has(b.id);
                return (
                  <div key={b.id} className={ok ? 'bucket-item done' : 'bucket-item'}>
                    <span className="bucket-check" aria-label={ok ? 'Done' : 'Not yet'}>
                      {ok ? '✓' : ''}
                    </span>
                    <div className="bucket-text">
                      <div className="bucket-title">{b.title}</div>
                      {!ok && <div className="bucket-hint">{b.hint}</div>}
                    </div>
                    {!ok && b.show && (
                      <button
                        className="btn bucket-show"
                        onClick={() => {
                          close();
                          bridge.api?.showBucket(b.id);
                        }}
                      >
                        Show me
                      </button>
                    )}
                  </div>
                );
              })}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
