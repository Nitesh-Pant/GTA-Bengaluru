import { useEffect, useRef, useState } from 'react';
import { loadGameSave, startGame } from '../session';
import { LOOKS } from '../data/looks';
import { BUILDINGS } from '../data/map';
import { paintBuilding } from '../game/art/buildings';
import { paintCharacterSheet } from '../game/art/characters';
import { paintProp } from '../game/art/props';
import { paintVehicle } from '../game/art/vehicles';
import { hasSave, safeStorage } from '../logic/save';
import { loadGame } from '../game/loadGame';
import type { PlayerProfile } from '../logic/player';
import { CharacterSetup } from './CharacterSetup';

/** A little animated street at golden hour, painted with the game's own sprite painters. */
function StreetScene() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const W = 320;
    const H = 200;
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    const pick = ['bunbytes', 'kaapi', 'darshini', 'brewpub', 'metro_in'];
    const shops = pick.map((id) => paintBuilding(BUILDINGS.find((b) => b.id === id)!));
    const tree = paintProp('treePink');
    const lamp = paintProp('lamp');
    const chai = paintProp('chaiCart');
    const auto = paintVehicle('auto', 0);
    const car = paintVehicle('car', 3);
    const bus = paintVehicle('bus', 0);
    const people = ['techie_f', 'aunty', 'chaiwala', 'student'].map((l) => paintCharacterSheet(LOOKS[l]));
    let raf = 0;
    const draw = (time: number) => {
      raf = requestAnimationFrame(draw);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const sky = ctx.createLinearGradient(0, 0, 0, 120);
      sky.addColorStop(0, '#3b2c5a');
      sky.addColorStop(0.6, '#e8590c');
      sky.addColorStop(1, '#ffc078');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      ctx.setTransform(1, 0, 0, 1, 0, 50);
      ctx.fillStyle = '#2b2140';
      for (let i = 0; i < 16; i++) {
        const h = 14 + ((i * 37) % 22);
        ctx.fillRect(i * 22 - 4, 66 - h, 18, h);
      }
      // Shopfronts: draw only the facade portion, side by side.
      let x = 0;
      for (const s of shops) {
        const sh = Math.min(s.height, 64);
        ctx.drawImage(s, 0, s.height - sh, s.width, sh, x, 86 - sh, s.width, sh);
        x += s.width + 2;
        if (x > W) break;
      }
      ctx.fillStyle = '#a8a39a';
      ctx.fillRect(0, 86, W, 14);
      ctx.fillStyle = '#d9d4c7';
      ctx.fillRect(0, 99, W, 2);
      ctx.fillStyle = '#45474f';
      ctx.fillRect(0, 101, W, 40);
      for (let dx = 0; dx < W; dx += 16) {
        ctx.fillStyle = '#f1f3f5';
        ctx.fillRect(dx + 2, 120, 8, 2);
      }
      ctx.fillStyle = '#a8a39a';
      ctx.fillRect(0, 141, W, 9);
      ctx.drawImage(tree, 196, 58);
      ctx.drawImage(lamp, 110, 68);
      ctx.drawImage(chai, 150, 74);
      const step = Math.floor(time / 140) % 4;
      const frame = [1, 0, 2, 0][step];
      people.forEach((p, i) => {
        const walking = i % 2 === 0;
        const px = walking ? ((time / (40 + i * 10) + i * 90) % (W + 40)) - 20 : 140 + i * 30;
        const row = walking ? 2 : 0;
        ctx.drawImage(p, (walking ? frame : 0) * 16, row * 24, 16, 24, Math.round(px), 76, 16, 24);
      });
      const t1 = (time / 18) % (W + 80);
      ctx.drawImage(auto, Math.round(t1 - 40), 104);
      ctx.drawImage(car, Math.round(((time / 12 + 140) % (W + 80)) - 40), 104);
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(bus, -Math.round(W + 60 - ((time / 26) % (W + 120))), 121);
      ctx.restore();
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} width={320} height={200} className="menu-scene" />;
}

export function MainMenu() {
  const [saved] = useState(() => hasSave(safeStorage()));
  // Start fetching the game engine while the player reads the menu.
  useEffect(() => {
    const id = window.setTimeout(() => void loadGame(), 300);
    return () => clearTimeout(id);
  }, []);
  const [confirm, setConfirm] = useState(false);
  const [setup, setSetup] = useState<null | { fresh: boolean; initial?: PlayerProfile }>(null);
  return (
    <div className="menu">
      <StreetScene />
      <div className="menu-card panel">
        <h1>
          GTE-BENGALURU
          <span className="menu-gte">Gaadi · Thindi · Enjoy</span>
          <span>Swalpa Adjust Maadi</span>
        </h1>
        <p className="menu-tag">A top-down wander through traffic, darshinis, metro rides and street gossip. No missions. Just the city.</p>
        {setup ? (
          <CharacterSetup initial={setup.initial} submitLabel="Let's go!" onSubmit={(p) => startGame(setup.fresh, p)} onBack={() => setSetup(null)} />
        ) : (
          <div className="menu-buttons">
            {saved ? (
              <>
                <button className="btn btn-primary" autoFocus onClick={() => startGame(false)}>
                  Continue wandering
                </button>
                <button className="btn" onClick={() => setSetup({ fresh: false, initial: loadGameSave().player })}>
                  Change character &amp; continue
                </button>
                {confirm ? (
                  <span className="confirm">
                    Start over and forget everything?
                    <button className="btn btn-danger" onClick={() => setSetup({ fresh: true })}>
                      Yes, fresh start
                    </button>
                    <button className="btn" onClick={() => setConfirm(false)}>
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button className="btn" onClick={() => setConfirm(true)}>
                    New game
                  </button>
                )}
              </>
            ) : (
              <button className="btn btn-primary" autoFocus onClick={() => setSetup({ fresh: true })}>
                Start exploring
              </button>
            )}
          </div>
        )}
        <div className="menu-controls">
          <span><kbd>WASD</kbd> move</span>
          <span><kbd>E</kbd> interact</span>
          <span><kbd>J</kbd> journal</span>
          <span><kbd>M</kbd> map</span>
          <span><kbd>Esc</kbd> pause</span>
        </div>
        <p className="disclaimer">
          Places, roads, lakes, companies and shops use their real Bengaluru names, but the layout is simplified and not to scale. People,
          conversations and events are fictional, and no business named here is affiliated with or endorses this game. Progress is saved in this
          browser only.
        </p>
      </div>
    </div>
  );
}
