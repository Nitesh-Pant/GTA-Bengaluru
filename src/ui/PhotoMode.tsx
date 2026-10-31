import { useEffect, useState } from 'react';
import { bridge } from '../game/bridge';
import { uiStore, useUi } from '../store/uiStore';
import { composePostcard } from './postcard';

/**
 * Photo mode (P, or the Photo button): the HUD steps aside while the city carries on, you zoom to
 * frame the shot, and "Take postcard" turns it into a Greetings-from-Bengaluru card to save or share.
 */
export function PhotoMode() {
  const panel = useUi((s) => s.panel);
  const [card, setCard] = useState<{ url: string; blob: Blob } | null>(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(false);
  const open = panel === 'photo';
  // Leaving photo mode puts the camera back and drops the preview.
  useEffect(() => {
    if (open) return;
    bridge.api?.endPhoto();
    setCard((c) => {
      if (c) URL.revokeObjectURL(c.url);
      return null;
    });
  }, [open]);
  if (!open) return null;

  const close = () => uiStore.set({ panel: null });
  const take = async () => {
    if (busy || !bridge.api) return;
    setBusy(true);
    setFlash(true);
    setTimeout(() => setFlash(false), 350);
    try {
      const { image, focus } = await bridge.api.takePhoto();
      if (!image.complete) await new Promise((r) => (image.onload = r));
      const s = uiStore.get();
      const canvas = await composePostcard(image, { area: s.area.name, time: s.clock?.label ?? '', name: s.player.name, festival: s.festival }, focus);
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
      if (blob) {
        setCard({ url: URL.createObjectURL(blob), blob });
        bridge.api.notePostcard();
      }
    } finally {
      setBusy(false);
    }
  };
  const file = () => new File([card!.blob], 'gte-bengaluru-postcard.png', { type: 'image/png' });
  const canShare = !!card && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file()] });
  const save = () => {
    const a = document.createElement('a');
    a.href = card!.url;
    a.download = 'gte-bengaluru-postcard.png';
    a.click();
  };
  const share = () =>
    navigator.share({ files: [file()], title: 'Greetings from Bengaluru', text: 'Greetings from Bengaluru! Made in GTE-Bengaluru: https://gte-bengaluru.pages.dev' }).catch(() => {});

  if (card)
    return (
      <div className="modal-backdrop photo-backdrop">
        <div className="postcard-preview panel" role="dialog" aria-label="Your postcard">
          <img src={card.url} alt="Your postcard: Greetings from Bengaluru" />
          <div className="postcard-actions">
            {canShare && (
              <button className="btn btn-primary" onClick={share}>
                Share
              </button>
            )}
            <button className={canShare ? 'btn' : 'btn btn-primary'} onClick={save}>
              Save
            </button>
            <button
              className="btn"
              onClick={() => {
                URL.revokeObjectURL(card.url);
                setCard(null);
              }}
            >
              Take another
            </button>
            <button className="btn" onClick={close}>
              Done
            </button>
          </div>
        </div>
      </div>
    );

  return (
    <div className="photo-mode" role="dialog" aria-label="Photo mode">
      {flash && <div className="photo-flash" />}
      <div className="photo-tip panel">Photo mode · frame your shot</div>
      <div className="photo-bar">
        <button className="btn photo-zoom" aria-label="Zoom out" onClick={() => bridge.api?.photoZoom(1 / 1.25)}>
          −
        </button>
        <button className="btn btn-primary photo-take" disabled={busy} onClick={() => void take()}>
          {busy ? 'Developing…' : 'Take postcard'}
        </button>
        <button className="btn photo-zoom" aria-label="Zoom in" onClick={() => bridge.api?.photoZoom(1.25)}>
          +
        </button>
        <button className="btn photo-close" aria-label="Close photo mode" onClick={close}>
          ✕
        </button>
      </div>
    </div>
  );
}
