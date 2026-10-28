import { useState } from 'react';
import { quitToMenu } from '../session';
import { bridge } from '../game/bridge';
import { PERIODS } from '../logic/dayClock';
import type { ChatterLevel, Settings } from '../logic/save';
import { uiStore, useUi } from '../store/uiStore';

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="setting">
      <span>{label}</span>
      <input type="range" min={0} max={1} step={0.05} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <span className="muted">{Math.round(value * 100)}%</span>
    </label>
  );
}

export function PauseMenu() {
  const panel = useUi((s) => s.panel);
  const settings = useUi((s) => s.settings);
  const player = useUi((s) => s.player);
  const period = useUi((s) => s.clock?.period);
  const [confirm, setConfirm] = useState(false);
  if (panel !== 'pause') return null;
  const set = (patch: Partial<Settings>) => bridge.api?.updateSettings(patch);
  const resume = () => {
    setConfirm(false);
    uiStore.set({ panel: null });
    bridge.api?.setPaused(false);
  };
  const open = (p: 'journal' | 'map' | 'character' | 'tour') => {
    bridge.api?.setPaused(false);
    uiStore.set({ panel: p });
  };
  return (
    <div className="modal-backdrop">
      <div className="pause panel" role="dialog" aria-label="Paused">
        <h2>Swalpa break</h2>
        <div className="pause-buttons">
          <button className="btn btn-primary" onClick={resume} autoFocus>
            Resume <kbd>Esc</kbd>
          </button>
          <button className="btn" onClick={() => open('journal')}>
            Journal <kbd>J</kbd>
          </button>
          <button className="btn" onClick={() => open('map')}>
            Map <kbd>M</kbd>
          </button>
          <button className="btn" onClick={() => open('tour')}>
            How to play
          </button>
        </div>
        <h3>Character &amp; time</h3>
        <div className="setting">
          <span>
            You: {player.name || 'No name'} · {player.gender === 'f' ? 'Female' : 'Male'}
          </span>
          <button className="btn" onClick={() => open('character')}>
            Change character
          </button>
        </div>
        <div className="setting" role="group" aria-label="Time of day">
          <span>Time of day</span>
          <span className="time-choices">
            {PERIODS.map((t) => (
              <button key={t.id} className={period === t.id ? 'btn btn-on' : 'btn'} aria-pressed={period === t.id} onClick={() => bridge.api?.setTime(t.jumpTo)}>
                {t.label}
              </button>
            ))}
          </span>
        </div>
        <h3>Settings</h3>
        <label className="setting">
          <span>Mute all sound</span>
          <input type="checkbox" checked={settings.muted} onChange={(e) => set({ muted: e.target.checked })} />
        </label>
        <Slider label="Master volume" value={settings.masterVolume} onChange={(v) => set({ masterVolume: v })} />
        <Slider label="Sound effects" value={settings.sfxVolume} onChange={(v) => set({ sfxVolume: v })} />
        <Slider label="City ambience" value={settings.ambienceVolume} onChange={(v) => set({ ambienceVolume: v })} />
        <Slider label="Voices" value={settings.voiceVolume} onChange={(v) => set({ voiceVolume: v })} />
        <Slider label="Music" value={settings.musicVolume} onChange={(v) => set({ musicVolume: v })} />
        <label className="setting">
          <span>Street chatter</span>
          <select value={settings.chatter} onChange={(e) => set({ chatter: e.target.value as ChatterLevel })}>
            <option value="low">Low (peaceful)</option>
            <option value="normal">Normal</option>
            <option value="high">High (full Bengaluru)</option>
          </select>
        </label>
        <label className="setting">
          <span>Destination markers</span>
          <input type="checkbox" checked={settings.showMarkers} onChange={(e) => set({ showMarkers: e.target.checked })} />
        </label>
        <label className="setting">
          <span>Route dots to markers</span>
          <input type="checkbox" checked={settings.showRoute} onChange={(e) => set({ showRoute: e.target.checked })} />
        </label>
        <label className="setting">
          <span>Word meanings (Kannada, Hindi)</span>
          <input type="checkbox" checked={settings.glosses} onChange={(e) => set({ glosses: e.target.checked })} />
        </label>
        <label className="setting">
          <span>Screen shake</span>
          <input type="checkbox" checked={settings.screenShake} onChange={(e) => set({ screenShake: e.target.checked })} />
        </label>
        <h3>Controls</h3>
        <ul className="controls-list">
          <li><kbd>WASD</kbd>/<kbd>Arrows</kbd> walk, or accelerate/brake/steer when driving</li>
          <li><kbd>E</kbd> talk, enter/exit a vehicle, use a metro entrance</li>
          <li><kbd>Space</kbd> handbrake · <kbd>H</kbd> horn (driving)</li>
          <li><kbd>1</kbd>-<kbd>9</kbd>, <kbd>↑↓</kbd> + <kbd>Enter</kbd>, or mouse to pick options</li>
          <li><kbd>J</kbd> journal · <kbd>M</kbd> map · <kbd>?</kbd> controls hint · <kbd>Esc</kbd> pause / close</li>
        </ul>
        <div className="pause-foot">
          <button className="btn" onClick={() => quitToMenu(false)}>
            Save &amp; quit to title
          </button>
          {confirm ? (
            <span className="confirm">
              Erase all discoveries, stats and settings?
              <button className="btn btn-danger" onClick={() => quitToMenu(true)}>
                Yes, reset
              </button>
              <button className="btn" onClick={() => setConfirm(false)}>
                Cancel
              </button>
            </span>
          ) : (
            <button className="btn btn-danger" onClick={() => setConfirm(true)}>
              Reset progress…
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
