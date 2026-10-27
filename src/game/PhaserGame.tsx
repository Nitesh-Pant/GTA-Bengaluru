import Phaser from 'phaser';
import { useEffect, useRef } from 'react';
import { destroyGame, ensureGame } from './gameHost';
import { BootScene } from './scenes/BootScene';
import { WorldScene } from './scenes/WorldScene';

function createGame(parent: HTMLElement) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#1c1726',
    pixelArt: true,
    roundPixels: true,
    scale: { mode: Phaser.Scale.RESIZE, width: parent.clientWidth || 1280, height: parent.clientHeight || 720 },
    physics: { default: 'arcade', arcade: { debug: false } },
    audio: { noAudio: true },
    disableContextMenu: true,
    banner: false,
    scene: [BootScene, WorldScene],
  });
}

/** Mounts the one Phaser game. Re-renders never recreate it; unmounting destroys it. */
export function PhaserGame() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const game = ensureGame(el, createGame);
    (window as unknown as { __game?: Phaser.Game }).__game = game;
    return () => {
      destroyGame();
      delete (window as unknown as { __game?: Phaser.Game }).__game;
    };
  }, []);
  return (
    <div className="game-root">
      <div ref={ref} className="game-canvas" />
      <div id="world-overlay" className="world-overlay" />
    </div>
  );
}
