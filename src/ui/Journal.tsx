import { useState } from 'react';
import { ACHIEVEMENTS } from '../data/achievements';
import { DISHES } from '../data/food';
import { DISTRICTS } from '../data/map';
import { POIS } from '../data/pois';
import { bridge } from '../game/bridge';
import { visibilityOf } from '../logic/discovery';
import { uiStore, useUi } from '../store/uiStore';
import { KIND_COLOUR } from './Minimap';

/** One ticked-or-not line in the food book or achievements. */
function Row({ done, colour, title, desc }: { done: boolean; colour: string; title: string; desc: string }) {
  return (
    <div className={done ? 'place' : 'place unknown'}>
      <span className="dot" style={{ background: done ? colour : 'transparent' }} />
      <div className="place-text">
        <div className="place-name">{title}</div>
        <div className="place-desc">{desc}</div>
      </div>
    </div>
  );
}

export function Journal() {
  const panel = useUi((s) => s.panel);
  const discovered = useUi((s) => s.discovered);
  const hinted = useUi((s) => s.hinted);
  const destination = useUi((s) => s.destination);
  const stats = useUi((s) => s.stats);
  const tasted = useUi((s) => s.tasted);
  const achievements = useUi((s) => s.achievements);
  const [tab, setTab] = useState<'places' | 'food' | 'achievements'>('places');
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
            {discovered.length}/{POIS.length} places · {stats.chai} chai · {stats.dosa} dose · {stats.metroRides} metro · {stats.busRides} bus · {stats.rides} Rapido · {stats.drives} drives · ₹{stats.rupees} earned
          </span>
          <button className="btn" onClick={close}>
            Close <kbd>J</kbd>
          </button>
        </div>
        <div className="journal-tabs" role="tablist">
          {(
            [
              ['places', `Places ${discovered.length}/${POIS.length}`],
              ['food', `Food book ${tasted.length}/${DISHES.length}`],
              ['achievements', `Achievements ${achievements.length}/${ACHIEVEMENTS.length}`],
            ] as const
          ).map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'btn btn-on' : 'btn'} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>
        {tab === 'food' && (
          <div className="journal-body">
            <p className="muted">Order something at a counter to stamp it. Every dish is somewhere in the city.</p>
            {DISHES.map((d) => {
              const done = tasted.includes(d.id);
              return <Row key={d.id} done={done} colour="var(--saffron)" title={d.name} desc={done ? d.blurb : `Not tried yet. Find it at ${d.where}.`} />;
            })}
          </div>
        )}
        {tab === 'achievements' && (
          <div className="journal-body">
            {ACHIEVEMENTS.map((a) => (
              <Row key={a.id} done={achievements.includes(a.id)} colour="#51cf66" title={a.title} desc={a.description} />
            ))}
          </div>
        )}
        {tab === 'places' && <p className="muted">Destinations are optional. Set one to get a marker, or just wander.</p>}
        {tab === 'places' && (
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
                          {known && p.inspiredBy && <div className="place-note">Inspired by {p.inspiredBy}.</div>}
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
        )}
      </div>
    </div>
  );
}
