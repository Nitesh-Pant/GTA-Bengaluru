import { useEffect, useRef, useState } from 'react';
import { OUTFITS, playerLook } from '../data/player';
import { CHAR_H, CHAR_W, paintCharacterSheet } from '../game/art/characters';
import { bridge } from '../game/bridge';
import { uiStore, useUi } from '../store/uiStore';
import { cleanName, DEFAULT_NAMES, DEFAULT_PROFILE, MAX_NAME, type Gender, type PlayerProfile } from '../logic/player';

/** Front-facing preview of the player sprite, scaled up; walks on the spot when selected. */
function PlayerPreview({ gender, outfit, walking }: { gender: Gender; outfit: number; walking: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current!.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    const sheet = paintCharacterSheet(playerLook({ name: '', gender, outfit }));
    let i = 0;
    const draw = () => {
      const frame = walking ? [1, 0, 2, 0][i++ % 4] : 0;
      ctx.clearRect(0, 0, CHAR_W * 5, CHAR_H * 5);
      ctx.drawImage(sheet, frame * CHAR_W, 0, CHAR_W, CHAR_H, 0, 0, CHAR_W * 5, CHAR_H * 5);
    };
    draw();
    const id = walking ? window.setInterval(draw, 160) : 0;
    return () => clearInterval(id);
  }, [gender, outfit, walking]);
  return <canvas ref={ref} width={CHAR_W * 5} height={CHAR_H * 5} className="player-preview" aria-hidden />;
}

/** Pick male or female (how people address you), a name, then an outfit. Used for a new game and from the pause menu. */
export function CharacterSetup({
  initial = DEFAULT_PROFILE,
  submitLabel,
  onSubmit,
  onBack,
}: {
  initial?: PlayerProfile;
  submitLabel: string;
  onSubmit: (p: PlayerProfile) => void;
  onBack: () => void;
}) {
  const [name, setName] = useState(initial.name || DEFAULT_NAMES[initial.gender]);
  const [gender, setGender] = useState<Gender>(initial.gender);
  // Switching boy/girl swaps the suggested name, but never one you typed yourself.
  const pickGender = (g: Gender) => {
    if (!name.trim() || name === DEFAULT_NAMES[gender]) setName(DEFAULT_NAMES[g]);
    setGender(g);
  };
  const [outfit, setOutfit] = useState(initial.outfit);
  const go = () => onSubmit({ name: cleanName(name) || DEFAULT_NAMES[gender], gender, outfit });
  return (
    <form
      className="setup"
      onSubmit={(e) => {
        e.preventDefault();
        go();
      }}
    >
      <div className="setup-sides" role="group" aria-label="Character">
        {(['m', 'f'] as const).map((g) => (
          <button key={g} type="button" className={gender === g ? 'side-card side-on' : 'side-card'} aria-pressed={gender === g} onClick={() => pickGender(g)}>
            <span className="side-name">{gender === g ? cleanName(name) || '…' : DEFAULT_NAMES[g]}</span>
            <PlayerPreview gender={g} outfit={outfit} walking={gender === g} />
            <span>{g === 'm' ? 'Male' : 'Female'}</span>
          </button>
        ))}
      </div>
      <label className="setup-name">
        <span>Your name</span>
        <input value={name} maxLength={MAX_NAME} placeholder={DEFAULT_NAMES[gender]} onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="setup-outfits" role="group" aria-label="Outfit">
        {OUTFITS[gender].map((o, i) => (
          <button key={o.name} type="button" aria-pressed={outfit === i} className={outfit === i ? 'outfit outfit-on' : 'outfit'} onClick={() => setOutfit(i)}>
            <i style={{ background: o.swatch }} />
            {o.name}
          </button>
        ))}
      </div>
      <div className="setup-actions">
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
        <button type="button" className="btn" onClick={onBack}>
          Back
        </button>
      </div>
    </form>
  );
}

/** The character screen mid-game, opened from the side bar or the pause menu. */
export function CharacterPanel() {
  const panel = useUi((s) => s.panel);
  const player = useUi((s) => s.player);
  if (panel !== 'character') return null;
  const close = () => uiStore.set({ panel: null });
  return (
    <div className="modal-backdrop">
      <div className="pause panel" role="dialog" aria-label="Change character">
        <h2>Change character</h2>
        <CharacterSetup
          initial={player}
          submitLabel="Save"
          onSubmit={(p) => {
            bridge.api?.setProfile(p);
            close();
          }}
          onBack={close}
        />
      </div>
    </div>
  );
}
