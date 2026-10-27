export type HairStyle = 'short' | 'long' | 'bun' | 'bald' | 'ponytail' | 'cap' | 'helmet' | 'whitecap' | 'beanie' | 'messy';
export type TopStyle = 'shirt' | 'tshirt' | 'kurta' | 'vest' | 'jacket' | 'uniform' | 'saree';
export type BottomStyle = 'pants' | 'lungi' | 'veshti' | 'saree' | 'shorts';
export type Extra = 'backpack' | 'lanyard' | 'mustache' | 'glasses' | 'jasmine' | 'bindi' | 'towel' | 'apron' | 'bag' | 'headband' | 'checks';

export interface Look {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  top: string;
  topStyle: TopStyle;
  accent?: string;
  bottom: string;
  bottomStyle: BottomStyle;
  shoes: string;
  extras?: Extra[];
  small?: boolean;
}

const SKIN = ['#c68642', '#a0663a', '#8d5524', '#d9a066', '#b5793f', '#7a4a26'];

/** Character presets. Each becomes a generated 4-direction walking spritesheet. */
export const LOOKS: Record<string, Look> = {
  player: { skin: SKIN[0], hair: '#1b1410', hairStyle: 'short', top: '#e03c31', topStyle: 'tshirt', bottom: '#2b3a67', bottomStyle: 'pants', shoes: '#f1f1f1', extras: ['bag'], accent: '#3b3b3b' },
  techie_m: { skin: SKIN[3], hair: '#16120f', hairStyle: 'short', top: '#8fb8de', topStyle: 'shirt', bottom: '#2f3e55', bottomStyle: 'pants', shoes: '#3a2a20', extras: ['backpack', 'lanyard', 'checks'], accent: '#3d4a5c' },
  techie_m2: { skin: SKIN[2], hair: '#120e0b', hairStyle: 'messy', top: '#52525b', topStyle: 'tshirt', bottom: '#1f2a44', bottomStyle: 'pants', shoes: '#ececec', extras: ['backpack', 'glasses'], accent: '#7a2e2e' },
  techie_f: { skin: SKIN[3], hair: '#14100d', hairStyle: 'ponytail', top: '#2a9d8f', topStyle: 'kurta', bottom: '#f1e9da', bottomStyle: 'pants', shoes: '#7a4e2d', extras: ['lanyard', 'bag'], accent: '#e9c46a' },
  techie_f2: { skin: SKIN[4], hair: '#1a1411', hairStyle: 'long', top: '#f4a261', topStyle: 'shirt', bottom: '#264653', bottomStyle: 'pants', shoes: '#222', extras: ['backpack', 'glasses'], accent: '#555' },
  aunty: { skin: SKIN[1], hair: '#16120f', hairStyle: 'bun', top: '#c2185b', topStyle: 'saree', accent: '#f6c344', bottom: '#c2185b', bottomStyle: 'saree', shoes: '#5a3a22', extras: ['jasmine', 'bindi'] },
  aunty2: { skin: SKIN[0], hair: '#1b1512', hairStyle: 'bun', top: '#2e7d32', topStyle: 'saree', accent: '#ffd54f', bottom: '#2e7d32', bottomStyle: 'saree', shoes: '#5a3a22', extras: ['bindi', 'bag'] },
  ajji: { skin: SKIN[1], hair: '#c9c9c9', hairStyle: 'bun', top: '#f3e5ab', topStyle: 'saree', accent: '#8d6e63', bottom: '#f3e5ab', bottomStyle: 'saree', shoes: '#5a3a22', extras: ['bindi'] },
  uncle: { skin: SKIN[2], hair: '#8a8a8a', hairStyle: 'bald', top: '#f5f5f5', topStyle: 'shirt', bottom: '#6b6b6b', bottomStyle: 'pants', shoes: '#3a2a20', extras: ['mustache', 'glasses'] },
  uncle_veshti: { skin: SKIN[5], hair: '#2a2a2a', hairStyle: 'short', top: '#fafafa', topStyle: 'shirt', bottom: '#fbfbf2', bottomStyle: 'veshti', accent: '#d4a017', shoes: '#4a3020', extras: ['mustache'] },
  student: { skin: SKIN[4], hair: '#130f0c', hairStyle: 'messy', top: '#e63946', topStyle: 'tshirt', bottom: '#3d5a80', bottomStyle: 'pants', shoes: '#f1f1f1', extras: ['backpack'], accent: '#1d3557' },
  student_f: { skin: SKIN[3], hair: '#1a1411', hairStyle: 'long', top: '#ffd166', topStyle: 'tshirt', bottom: '#355070', bottomStyle: 'pants', shoes: '#f1f1f1', extras: ['bag'], accent: '#6d597a' },
  auto: { skin: SKIN[2], hair: '#151110', hairStyle: 'short', top: '#c8a165', topStyle: 'uniform', bottom: '#b08d57', bottomStyle: 'pants', shoes: '#3a2a20', extras: ['mustache'] },
  chaiwala: { skin: SKIN[5], hair: '#151110', hairStyle: 'short', top: '#f0f0f0', topStyle: 'vest', bottom: '#3a6ea5', bottomStyle: 'lungi', accent: '#1d3557', shoes: '#4a3020', extras: ['towel', 'mustache'] },
  cook: { skin: SKIN[1], hair: '#151110', hairStyle: 'whitecap', top: '#fafafa', topStyle: 'shirt', bottom: '#4a4a4a', bottomStyle: 'pants', shoes: '#333', extras: ['apron', 'mustache'] },
  shopkeeper: { skin: SKIN[0], hair: '#151110', hairStyle: 'short', top: '#d8c7a0', topStyle: 'shirt', bottom: '#5b4636', bottomStyle: 'pants', shoes: '#3a2a20', extras: ['mustache'] },
  kid: { skin: SKIN[3], hair: '#151110', hairStyle: 'messy', top: '#4cc9f0', topStyle: 'tshirt', bottom: '#2b2d42', bottomStyle: 'shorts', shoes: '#f1f1f1', small: true },
  kid2: { skin: SKIN[2], hair: '#151110', hairStyle: 'short', top: '#ffbe0b', topStyle: 'tshirt', bottom: '#3a5a40', bottomStyle: 'shorts', shoes: '#e63946', small: true },
  kid3: { skin: SKIN[4], hair: '#151110', hairStyle: 'ponytail', top: '#ff70a6', topStyle: 'tshirt', bottom: '#3d405b', bottomStyle: 'shorts', shoes: '#f1f1f1', small: true },
  delivery: { skin: SKIN[2], hair: '#151110', hairStyle: 'helmet', top: '#e8590c', topStyle: 'jacket', accent: '#fab005', bottom: '#2b2b2b', bottomStyle: 'pants', shoes: '#222', extras: ['backpack'] },
  staff: { skin: SKIN[0], hair: '#151110', hairStyle: 'cap', top: '#5f3dc4', topStyle: 'uniform', accent: '#5f3dc4', bottom: '#1f2041', bottomStyle: 'pants', shoes: '#111' },
  cop: { skin: SKIN[2], hair: '#151110', hairStyle: 'cap', top: '#b9935a', topStyle: 'uniform', accent: '#3b2f1c', bottom: '#a8844c', bottomStyle: 'pants', shoes: '#111', extras: ['mustache'] },
  jogger: { skin: SKIN[4], hair: '#151110', hairStyle: 'short', top: '#06d6a0', topStyle: 'tshirt', bottom: '#073b4c', bottomStyle: 'shorts', shoes: '#ff006e', extras: ['headband'] },
  hipster: { skin: SKIN[3], hair: '#2a1d14', hairStyle: 'beanie', top: '#e9c46a', topStyle: 'shirt', accent: '#b5651d', bottom: '#2a2a2a', bottomStyle: 'pants', shoes: '#f1f1f1', extras: ['glasses', 'bag'] },
  vendor_f: { skin: SKIN[5], hair: '#151110', hairStyle: 'bun', top: '#f77f00', topStyle: 'saree', accent: '#d62828', bottom: '#f77f00', bottomStyle: 'saree', shoes: '#4a3020', extras: ['jasmine', 'bindi'] },
  guard: { skin: SKIN[1], hair: '#151110', hairStyle: 'cap', top: '#6c757d', topStyle: 'uniform', accent: '#343a40', bottom: '#343a40', bottomStyle: 'pants', shoes: '#111', extras: ['mustache'] },
  commuter: { skin: SKIN[0], hair: '#151110', hairStyle: 'short', top: '#7b2cbf', topStyle: 'shirt', bottom: '#3c3c3c', bottomStyle: 'pants', shoes: '#3a2a20', extras: ['bag'], accent: '#5a189a' },
  commuter_f: { skin: SKIN[4], hair: '#151110', hairStyle: 'long', top: '#ef476f', topStyle: 'kurta', accent: '#ffd166', bottom: '#073b4c', bottomStyle: 'pants', shoes: '#3a2a20', extras: ['bag', 'bindi'] },
};
