import type { Gender, PlayerProfile } from '../logic/player';
import { LOOKS, type Look } from './looks';

export interface Outfit {
  name: string;
  /** Colour shown on its button. */
  swatch: string;
  look: Partial<Look>;
}

/** Outfits on the character screen, four per gender (the save stores the index). */
export const OUTFITS: Record<Gender, Outfit[]> = {
  m: [
    { name: 'Casual', swatch: '#e03c31', look: { top: '#e03c31', topStyle: 'tshirt', bottom: '#2b3a67', bottomStyle: 'pants', accent: '#3b3b3b', extras: ['bag'] } },
    { name: 'Office', swatch: '#8fb8de', look: { top: '#8fb8de', topStyle: 'shirt', bottom: '#3a3f4a', bottomStyle: 'pants', accent: '#2b4a7a', extras: ['backpack', 'lanyard', 'checks'] } },
    { name: 'Lungi', swatch: '#2f9e44', look: { top: '#f8f9fa', topStyle: 'shirt', bottom: '#2f9e44', bottomStyle: 'lungi', accent: '#1b6e30', shoes: '#6b4226', extras: [] } },
    { name: 'Kurta', swatch: '#f4a261', look: { top: '#f4a261', topStyle: 'kurta', bottom: '#f1e9da', bottomStyle: 'pants', accent: '#9c4d38', shoes: '#6b4226', extras: ['bag'] } },
  ],
  f: [
    { name: 'Casual', swatch: '#ef476f', look: { top: '#ef476f', topStyle: 'tshirt', bottom: '#355070', bottomStyle: 'pants', accent: '#3b3b3b', extras: ['bag'] } },
    { name: 'Saree', swatch: '#c2185b', look: { top: '#c2185b', topStyle: 'saree', bottom: '#c2185b', bottomStyle: 'saree', accent: '#f6c344', shoes: '#6b4226', extras: ['jasmine', 'bindi'] } },
    { name: 'Salwar', swatch: '#2a9d8f', look: { top: '#2a9d8f', topStyle: 'kurta', bottom: '#f1e9da', bottomStyle: 'pants', accent: '#e9c46a', shoes: '#6b4226', extras: ['bag'] } },
    { name: 'Office', swatch: '#b8c0ff', look: { top: '#b8c0ff', topStyle: 'shirt', bottom: '#2b2d42', bottomStyle: 'pants', accent: '#3d4a5c', extras: ['backpack', 'lanyard'] } },
  ],
};

/** The player's sprite: the base player look with the gender's hair and the chosen outfit. */
export function playerLook(p: PlayerProfile): Look {
  const outfits = OUTFITS[p.gender];
  const outfit = outfits[p.outfit] ?? outfits[0];
  return { ...LOOKS.player, hairStyle: p.gender === 'f' ? 'long' : 'short', ...outfit.look };
}
