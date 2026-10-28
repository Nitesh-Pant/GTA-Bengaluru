import type { DirInput } from '../logic/movement';

/** On-screen controls write here; the world reads it alongside the keyboard each frame. */
export const touch: DirInput & { brake: boolean } = { up: false, down: false, left: false, right: false, brake: false };

/** Phones and tablets: a coarse pointer and no hover. */
export const isTouchDevice = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches === true;
