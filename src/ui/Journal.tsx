import { DISTRICTS } from '../data/map';
import { POIS } from '../data/pois';
import { bridge } from '../game/bridge';
import { visibilityOf } from '../logic/discovery';
import { uiStore, useUi } from '../store/uiStore';
import { KIND_COLOUR } from './Minimap';

export function Journal() {
  const panel = useUi((s) => s.panel);
  const discovered = useUi((s) => s.discovered);
  const hinted = useUi((s) => s.hinted);
  const destination = useUi((s) => s.destination);
  const stats = useUi((s) => s.stats);
  if (panel !== 'journal') return null;
  const state = { discovered, hinted };
  const close = () => uiStore.set({ panel: null });
  const setDest = (id: string | null) => bridge.api?.setDestination(id);
  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="journal panel" role="dialog" aria-label="Journal" onClick={(e) => e.stopPropagation()}>
        <div className="journal-head">
          <h2>Namma Journal</h2>
          <span className="muted">
            {discovered.length}/{POIS.length} places · {stats.chai} chai · {stats.dosa} dose · {stats.metroRides} metro rides · {stats.drives} drives
          </span>
          <button className="btn" onClick={close}>
            Close <kbd>J</kbd>
          </button>
        </div>
        <p className="muted">Destinations are optional. Set one to get a marker, or just wander.</p>
        <div className="journal-body">
          {DISTRICTS.map((d) => {
            const pois = POIS.filter((p) => p.district === d.id && visibilityOf(state, p) !== 'secret');
            const secrets = POIS.filter((p) => p.district === d.id && visibilityOf(state, p) === 'secret').length;
            return (
              <section key={d.id}>
                <h3>{d.name}</h3>
                {pois.map((p) => {
                  const known = visibilityOf(state, p) === 'known';
                  const isDest = destination === p.id;
                  return (
                    <div key={p.id} className={known ? 'place' : 'place unknown'}>
                      <span className="dot" style={{ background: known ? KIND_COLOUR[p.kind] : 'transparent' }} />
                      <div className="place-text">
                        <div className="place-name">{known ? p.name : hinted.includes(p.id) ? `${p.name} (tip)` : '??? (not visited)'}</div>
                        <div className="place-desc">
                          {known ? p.description : hinted.includes(p.id) ? p.hint ?? 'Someone mentioned this place…' : 'Seen on a signboard. Go find it.'}
                        </div>
                        {known && p.inspiredBy && <div className="place-note">Inspired by {p.inspiredBy}. Fictionalised, not a recreation.</div>}
                      </div>
                      {(known || hinted.includes(p.id) || !p.hidden) && (
                        <button className={isDest ? 'btn btn-on' : 'btn'} onClick={() => setDest(isDest ? null : p.id)}>
                          {isDest ? 'Clear marker' : 'Mark'}
                        </button>
                      )}
                    </div>
                  );
                })}
                {secrets > 0 && <div className="muted secret-count">+ {secrets} secret {secrets === 1 ? 'spot' : 'spots'}. Talk to locals.</div>}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
