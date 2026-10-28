import type { DirInput } from '../logic/movement';

/**
 * On-screen controls write here; the world reads it alongside the keyboard each frame.
 * `stick` is the raw thumb offset (-1..1 each way) used for point-to-steer driving.
 */
export const touch: DirInput & { brake: boolean; stick: { x: number; y: number } } = {
  up: false,
  down: false,
  left: false,
  right: false,
  brake: false,
  stick: { x: 0, y: 0 },
};

/** Phones and tablets: a coarse pointer and no hover. */
export const isTouchDevice = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true;
