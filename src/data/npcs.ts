import type { Rect } from '../logic/geometry';
import type { Facing } from '../logic/movement';
import type { Exchange } from './dialogue';

export type Personality = 'cheerful' | 'grumpy' | 'chill' | 'anxious' | 'chatty' | 'wise';

/** A waypoint in tiles; `cross` makes the walker wait for a safe gap before the next leg. */
export interface Waypoint {
  x: number;
  y: number;
  /** `junctionId:axis` waits for that axis' signal to be red; `gap` waits for no nearby traffic. */
  cross?: string;
  pause?: number;
}

export type Behaviour =
  | { type: 'idle'; facing: Facing }
  | { type: 'wander'; zone: Rect }
  | { type: 'route'; points: Waypoint[]; loop: boolean }
  | { type: 'chat'; group: string; facing: Facing };

export interface NpcDef {
  id: string;
  name: string;
  /** Character type shown when the name isn't known. */
  role: string;
  look: string;
  x: number;
  y: number;
  behaviour: Behaviour;
  personality: Personality;
  /** Dialogue pools for ambient lines, in order of preference. */
  categories: string[];
  /** Kannada / English / Hindi blend, informational for writers. */
  languages: Array<'kn' | 'en' | 'hi'>;
  conversation?: string;
  /** Exchange topics for chat groups. */
  topics?: Exchange['topic'][];
  speed?: number;
  /** Interaction reach in px for NPCs behind counters. */
  reach?: number;
  interactable?: boolean;
}

const KEN: NpcDef['languages'] = ['kn', 'en'];
const MIX: NpcDef['languages'] = ['kn', 'en', 'hi'];

/** A ring of `n` points around an ellipse (tiles), used as a running track. */
const ellipseLoop = (cx: number, cy: number, rx: number, ry: number, n: number): Waypoint[] =>
  Array.from({ length: n }, (_, i) => ({ x: +(cx + rx * Math.cos((i / n) * Math.PI * 2)).toFixed(2), y: +(cy + ry * Math.sin((i / n) * Math.PI * 2)).toFixed(2) }));
const KERE_LOOP = ellipseLoop(68.5, 44.5, 9.5, 6.5, 12);
const CUBBON_LOOP: Waypoint[] = [
  { x: 3, y: 117 },
  { x: 11, y: 117 },
  { x: 19, y: 117 },
  { x: 19, y: 128.5 },
  { x: 19, y: 140 },
  { x: 11, y: 140 },
  { x: 3, y: 140 },
  { x: 3, y: 128.5 },
];

/** A running-club member starting at point `start` of `loop`, heading for the next point. */
const runner = (id: string, name: string, look: string, loop: Waypoint[], start: number, speed: number): NpcDef => ({
  id,
  name,
  role: 'Running club',
  look,
  ...loop[start],
  behaviour: { type: 'route', points: [...loop.slice(start + 1), ...loop.slice(0, start + 1)], loop: true },
  personality: 'cheerful',
  categories: ['jogger'],
  languages: MIX,
  speed,
});

const sidewalkH1N = (x0: number, x1: number): Waypoint[] => [
  { x: x0, y: 16.9 },
  { x: x1, y: 16.9 },
];

export const NPCS: NpcDef[] = [
  // ── Indiranagar
  { id: 'manju', name: 'Manju', role: 'Tea seller', look: 'chaiwala', x: 28.5, y: 14.3, behaviour: { type: 'idle', facing: 'down' }, personality: 'chatty', categories: ['chaiwala', 'ambient'], languages: KEN, conversation: 'teapoint', reach: 46 },
  { id: 'priya', name: 'Priya', role: 'Techie on a call', look: 'techie_f', x: 21.6, y: 16.9, behaviour: { type: 'chat', group: 'call', facing: 'right' }, personality: 'anxious', categories: ['techie'], languages: MIX, conversation: 'priya', topics: ['techie'] },
  { id: 'arjun', name: 'Arjun', role: 'Techie', look: 'techie_m', x: 22.9, y: 16.9, behaviour: { type: 'chat', group: 'call', facing: 'left' }, personality: 'chill', categories: ['techie'], languages: MIX, topics: ['techie'] },
  { id: 'kavya', name: 'Kavya', role: 'Cafe regular', look: 'hipster', x: 6, y: 16.8, behaviour: { type: 'wander', zone: { x: 1, y: 16.6, w: 16, h: 1.2 } }, personality: 'cheerful', categories: ['hipster', 'ambient'], languages: KEN, conversation: 'kavya' },
  { id: 'w_in1', name: 'Suresh', role: 'Office-goer', look: 'commuter', x: 2, y: 16.9, behaviour: { type: 'route', points: sidewalkH1N(1.5, 37), loop: false }, personality: 'grumpy', categories: ['commuter', 'ambient'], languages: KEN, speed: 34 },
  {
    id: 'w_in2',
    name: 'Deepa',
    role: 'Student',
    look: 'student_f',
    x: 30,
    y: 17.1,
    behaviour: {
      type: 'route',
      loop: false,
      points: [
        { x: 30, y: 17.1 },
        { x: 37.4, y: 17.1, cross: 'cmh_100ft:ns' },
        { x: 44.9, y: 17.1, cross: 'cmh_100ft:ew' },
        { x: 44.9, y: 22.6 },
        { x: 60, y: 22.6, pause: 2 },
      ],
    },
    personality: 'cheerful',
    categories: ['student', 'ambient'],
    languages: MIX,
  },
  { id: 'w_in3', name: 'Harish', role: 'Uncle on a walk', look: 'uncle', x: 12, y: 23, behaviour: { type: 'route', points: [{ x: 1.5, y: 23 }, { x: 37, y: 23 }], loop: false }, personality: 'wise', categories: ['uncle', 'ambient'], languages: KEN, speed: 26 },
  { id: 'ajji_in', name: 'Saroja', role: 'Grandmother', look: 'ajji', x: 4, y: 37, behaviour: { type: 'wander', zone: { x: 1, y: 36.4, w: 17, h: 3.2 } }, personality: 'wise', categories: ['aunty'], languages: KEN, speed: 20 },
  { id: 'kid_in', name: 'Pinky', role: 'Kid', look: 'kid3', x: 19, y: 44, behaviour: { type: 'wander', zone: { x: 18.2, y: 26, w: 1.6, h: 28 } }, personality: 'cheerful', categories: ['kid'], languages: KEN, speed: 44 },
  { id: 'artist', name: 'Zoya', role: 'Muralist', look: 'student_f', x: 25, y: 44.6, behaviour: { type: 'idle', facing: 'up' }, personality: 'chill', categories: ['hipster'], languages: MIX },
  { id: 'staff_in', name: 'Lokesh', role: 'Metro staff', look: 'staff', x: 35, y: 56.5, behaviour: { type: 'idle', facing: 'left' }, personality: 'cheerful', categories: ['staff', 'metro'], languages: MIX, conversation: 'metrostaff' },
  { id: 'w_in4', name: 'Anitha', role: 'Commuter', look: 'commuter_f', x: 20, y: 57, behaviour: { type: 'route', points: [{ x: 2, y: 57 }, { x: 37, y: 57, pause: 3 }], loop: false }, personality: 'anxious', categories: ['commuter', 'metro'], languages: MIX },

  // ── Tech park
  { id: 'tp1', name: 'Rohit', role: 'Techie', look: 'techie_laptop', x: 75.5, y: 11.6, behaviour: { type: 'chat', group: 'break', facing: 'right' }, personality: 'chill', categories: ['techie'], languages: MIX, topics: ['techie', 'traffic'] },
  { id: 'tp2', name: 'Sneha', role: 'Techie', look: 'techie_f2', x: 76.8, y: 11.6, behaviour: { type: 'chat', group: 'break', facing: 'left' }, personality: 'chatty', categories: ['techie'], languages: MIX, topics: ['techie', 'traffic'] },
  { id: 'tp_chai', name: 'Basava', role: 'Chai seller', look: 'chaiwala', x: 78, y: 10.6, behaviour: { type: 'idle', facing: 'down' }, personality: 'cheerful', categories: ['chaiwala'], languages: KEN, reach: 40, conversation: 'campuschai' },
  { id: 'tp3', name: 'Vinay', role: 'Techie', look: 'techie_m', x: 52, y: 15.3, behaviour: { type: 'route', points: [{ x: 47, y: 15.3 }, { x: 70, y: 15.3, pause: 2 }], loop: false }, personality: 'anxious', categories: ['techie'], languages: MIX },
  { id: 'tp4', name: 'Meera', role: 'Techie', look: 'techie_laptop_f', x: 55, y: 15.4, behaviour: { type: 'chat', group: 'lawn', facing: 'right' }, personality: 'chatty', categories: ['techie'], languages: MIX, topics: ['techie', 'food'] },
  { id: 'tp5', name: 'Kiran', role: 'Techie', look: 'techie_laptop', x: 56.3, y: 15.4, behaviour: { type: 'chat', group: 'lawn', facing: 'left' }, personality: 'chill', categories: ['techie'], languages: MIX, topics: ['techie', 'food'] },

  // ── Ulsoor Lake
  {
    id: 'ramesh',
    name: 'Ramesh Uncle',
    role: 'Morning walker',
    look: 'uncle_veshti',
    x: 68.5,
    y: 37.6,
    behaviour: {
      type: 'route',
      loop: true,
      points: [
        { x: 68.5, y: 37.6 },
        { x: 75.5, y: 38.8 },
        { x: 78.3, y: 44.5 },
        { x: 75.5, y: 50.2 },
        { x: 68.5, y: 51.4 },
        { x: 61.5, y: 50.2 },
        { x: 58.7, y: 44.5 },
        { x: 61.5, y: 38.8 },
      ],
    },
    personality: 'wise',
    categories: ['uncle', 'ambient'],
    languages: KEN,
    conversation: 'ramesh',
    speed: 26,
  },
  {
    id: 'jogger',
    name: 'Nikhil',
    role: 'Jogger',
    look: 'jogger',
    x: 78.3,
    y: 44.5,
    behaviour: {
      type: 'route',
      loop: true,
      points: [
        { x: 78.3, y: 44.5 },
        { x: 75.5, y: 38.8 },
        { x: 68.5, y: 37.6 },
        { x: 61.5, y: 38.8 },
        { x: 58.7, y: 44.5 },
        { x: 61.5, y: 50.2 },
        { x: 68.5, y: 51.4 },
        { x: 75.5, y: 50.2 },
      ],
    },
    personality: 'cheerful',
    categories: ['jogger'],
    languages: KEN,
    speed: 62,
  },
  { id: 'pk1', name: 'Prakash', role: 'Retired uncle', look: 'uncle', x: 49.6, y: 32, behaviour: { type: 'chat', group: 'uncles', facing: 'right' }, personality: 'wise', categories: ['uncle'], languages: KEN, topics: ['park', 'traffic'] },
  { id: 'pk2', name: 'Nagaraj', role: 'Retired uncle', look: 'uncle_veshti', x: 50.9, y: 32, behaviour: { type: 'chat', group: 'uncles', facing: 'left' }, personality: 'grumpy', categories: ['uncle'], languages: KEN, topics: ['park', 'traffic'] },
  { id: 'pk3', name: 'Ananya', role: 'Student', look: 'student_f', x: 65.4, y: 54.2, behaviour: { type: 'chat', group: 'bench', facing: 'right' }, personality: 'chatty', categories: ['student'], languages: MIX, topics: ['general', 'food', 'metro'] },
  { id: 'pk4', name: 'Rahul', role: 'Student', look: 'student', x: 66.7, y: 54.2, behaviour: { type: 'chat', group: 'bench', facing: 'left' }, personality: 'chill', categories: ['student'], languages: MIX, topics: ['general', 'food', 'metro'] },
  { id: 'pk5', name: 'Kamala', role: 'Walker', look: 'aunty2', x: 47, y: 40, behaviour: { type: 'route', points: [{ x: 52.6, y: 25 }, { x: 52.6, y: 55 }], loop: false }, personality: 'chatty', categories: ['aunty'], languages: KEN, speed: 24 },

  // ── Marathahalli
  { id: 'gowda', name: 'Constable Gowda', role: 'Traffic constable', look: 'cop', x: 86.8, y: 23.1, behaviour: { type: 'idle', facing: 'right' }, personality: 'grumpy', categories: ['cop'], languages: KEN, conversation: 'gowda' },
  { id: 'rakesh', name: 'Rakesh', role: 'PG resident', look: 'student', x: 114, y: 16.8, behaviour: { type: 'wander', zone: { x: 110, y: 16.6, w: 16, h: 1.2 } }, personality: 'cheerful', categories: ['student', 'ambient'], languages: MIX, conversation: 'rakesh' },
  { id: 'venky', name: 'Venkatesh', role: 'Mobile shop owner', look: 'shopkeeper', x: 97.5, y: 16.3, behaviour: { type: 'idle', facing: 'down' }, personality: 'chatty', categories: ['shopkeeper'], languages: MIX },
  { id: 'guard', name: 'Basappa', role: 'Mall security', look: 'guard', x: 100.5, y: 37.4, behaviour: { type: 'idle', facing: 'down' }, personality: 'chill', categories: ['guard'], languages: KEN, conversation: 'guard' },
  { id: 'veg1', name: 'Lakshmamma', role: 'Vegetable seller', look: 'vendor_f', x: 113, y: 41.95, behaviour: { type: 'idle', facing: 'down' }, personality: 'chatty', categories: ['vendor'], languages: KEN, reach: 40 },
  { id: 'veg2', name: 'Thimmaiah', role: 'Vegetable seller', look: 'shopkeeper', x: 123, y: 41.95, behaviour: { type: 'idle', facing: 'down' }, personality: 'grumpy', categories: ['vendor'], languages: KEN, reach: 40 },
  { id: 'mk1', name: 'Shwetha', role: 'Shopper', look: 'aunty', x: 116, y: 44, behaviour: { type: 'wander', zone: { x: 110.5, y: 43.4, w: 16, h: 1.6 } }, personality: 'chatty', categories: ['aunty', 'vendor'], languages: KEN, speed: 24 },
  { id: 'mk2', name: 'Girish', role: 'Shopper', look: 'uncle', x: 120, y: 46.8, behaviour: { type: 'wander', zone: { x: 110.5, y: 46.4, w: 16, h: 1 } }, personality: 'grumpy', categories: ['uncle'], languages: KEN, speed: 24 },
  {
    id: 'w_mh1',
    name: 'Manoj',
    role: 'Office-goer',
    look: 'techie_m',
    x: 120,
    y: 23,
    behaviour: {
      type: 'route',
      loop: false,
      points: [
        { x: 126, y: 23 },
        { x: 101.5, y: 23 },
        { x: 101.5, y: 24.5 },
        { x: 93, y: 24.5 },
        { x: 93, y: 30 },
      ],
    },
    personality: 'grumpy',
    categories: ['techie', 'commuter'],
    languages: MIX,
  },
  { id: 'w_mh2', name: 'Divya', role: 'Commuter', look: 'commuter_f', x: 105, y: 16.9, behaviour: { type: 'route', points: sidewalkH1N(93.5, 126), loop: false }, personality: 'chill', categories: ['commuter', 'ambient'], languages: MIX },
  { id: 'deliv_mh', name: 'Salman', role: 'Delivery rider', look: 'delivery', x: 107.5, y: 17.2, behaviour: { type: 'idle', facing: 'down' }, personality: 'anxious', categories: ['delivery'], languages: MIX, conversation: 'rider' },

  // ── Food & chai lane
  { id: 'shetty', name: 'Shetty', role: 'Darshini cashier', look: 'cook', x: 53, y: 74.15, behaviour: { type: 'idle', facing: 'down' }, personality: 'cheerful', categories: ['cook'], languages: KEN, conversation: 'shetty', reach: 44 },
  { id: 'q1', name: 'Arun', role: 'Hungry techie', look: 'techie_m', x: 53, y: 75.9, behaviour: { type: 'idle', facing: 'up' }, personality: 'anxious', categories: ['food_visit', 'techie'], languages: MIX },
  { id: 'q2', name: 'Pooja', role: 'Student', look: 'student_f', x: 53, y: 77.1, behaviour: { type: 'idle', facing: 'up' }, personality: 'chatty', categories: ['food_visit', 'student'], languages: MIX },
  { id: 'q3', name: 'Ravi', role: 'Uncle', look: 'uncle', x: 53.1, y: 78.3, behaviour: { type: 'idle', facing: 'up' }, personality: 'grumpy', categories: ['food_visit', 'uncle'], languages: KEN },
  { id: 'annachai', name: 'Anna', role: 'Chai stall owner', look: 'chaiwala', x: 63, y: 77.5, behaviour: { type: 'idle', facing: 'down' }, personality: 'chatty', categories: ['chaiwala'], languages: MIX, conversation: 'annachai', reach: 52 },
  { id: 'ch1', name: 'Naveen', role: 'Chai regular', look: 'auto', x: 61.4, y: 79.8, behaviour: { type: 'chat', group: 'chai', facing: 'right' }, personality: 'chatty', categories: ['auto', 'ambient'], languages: MIX, topics: ['traffic', 'gossip', 'rain'] },
  { id: 'ch2', name: 'Prasad', role: 'Chai regular', look: 'shopkeeper', x: 62.7, y: 79.8, behaviour: { type: 'chat', group: 'chai', facing: 'left' }, personality: 'grumpy', categories: ['ambient'], languages: MIX, topics: ['traffic', 'gossip', 'rain'] },
  { id: 'tb1', name: 'Sahana', role: 'Diner', look: 'techie_f2', x: 51.4, y: 81.3, behaviour: { type: 'chat', group: 'table', facing: 'right' }, personality: 'cheerful', categories: ['food_visit'], languages: MIX, topics: ['food', 'general'] },
  { id: 'tb2', name: 'Imtiaz', role: 'Diner', look: 'commuter', x: 52.8, y: 81.3, behaviour: { type: 'chat', group: 'table', facing: 'left' }, personality: 'chatty', categories: ['food_visit'], languages: MIX, topics: ['food', 'general'] },
  { id: 'shantamma', name: 'Shantamma', role: 'Neighbourhood aunty', look: 'aunty', x: 20, y: 75.5, behaviour: { type: 'wander', zone: { x: 1, y: 74.3, w: 36, h: 2.4 } }, personality: 'chatty', categories: ['aunty', 'ambient'], languages: KEN, conversation: 'shantamma', speed: 22 },
  { id: 'imran', name: 'Imran', role: 'Delivery rider', look: 'delivery', x: 77.4, y: 78.3, behaviour: { type: 'idle', facing: 'left' }, personality: 'anxious', categories: ['delivery'], languages: MIX, conversation: 'imran' },
  { id: 'iyengar', name: 'Iyengar Sir', role: 'Baker', look: 'cook', x: 65, y: 74.2, behaviour: { type: 'idle', facing: 'down' }, personality: 'wise', categories: ['cook', 'shopkeeper'], languages: KEN, conversation: 'iyengar', reach: 40 },
  { id: 'military', name: 'Khader', role: 'Military Hotel server', look: 'shopkeeper', x: 5.5, y: 74.25, behaviour: { type: 'idle', facing: 'down' }, personality: 'cheerful', categories: ['cook', 'shopkeeper'], languages: MIX, conversation: 'military' },
  { id: 'ragi', name: 'Gowramma', role: 'Ragi Mudde cook', look: 'aunty2', x: 14.5, y: 74.25, behaviour: { type: 'idle', facing: 'down' }, personality: 'wise', categories: ['cook', 'aunty'], languages: KEN, conversation: 'ragi' },
  { id: 'paan', name: 'Babu', role: 'Paan shop', look: 'chaiwala', x: 21, y: 74.25, behaviour: { type: 'idle', facing: 'down' }, personality: 'chill', categories: ['shopkeeper'], languages: MIX, conversation: 'paan' },
  { id: 'chintu', name: 'Chintu', role: 'Gully cricketer', look: 'kid', x: 12, y: 83.5, behaviour: { type: 'wander', zone: { x: 9, y: 82.5, w: 6, h: 3 } }, personality: 'cheerful', categories: ['kid'], languages: KEN, conversation: 'chintu', speed: 50 },
  { id: 'kid2', name: 'Munna', role: 'Gully cricketer', look: 'kid2', x: 12, y: 89.5, behaviour: { type: 'wander', zone: { x: 9, y: 88, w: 6, h: 3 } }, personality: 'cheerful', categories: ['kid'], languages: MIX, speed: 50 },
  { id: 'kid3', name: 'Ammu', role: 'Gully cricketer', look: 'kid3', x: 5, y: 86, behaviour: { type: 'wander', zone: { x: 3, y: 81, w: 5, h: 11 } }, personality: 'cheerful', categories: ['kid'], languages: KEN, speed: 46 },
  { id: 'kid4', name: 'Sonu', role: 'Gully cricketer', look: 'kid', x: 19, y: 86, behaviour: { type: 'wander', zone: { x: 17, y: 81, w: 5, h: 11 } }, personality: 'cheerful', categories: ['kid'], languages: MIX, speed: 46 },
  {
    id: 'w_fl1',
    name: 'Kavitha',
    role: 'Office-goer',
    look: 'commuter_f',
    x: 30,
    y: 75.6,
    behaviour: {
      type: 'route',
      loop: false,
      points: [
        { x: 2, y: 75.6 },
        { x: 39, y: 75.6, cross: 'gap' },
        { x: 45, y: 75.6 },
        { x: 85, y: 75.6, cross: 'gap' },
        { x: 93, y: 75.6 },
        { x: 104, y: 75.6, pause: 3 },
      ],
    },
    personality: 'anxious',
    categories: ['commuter', 'food_visit'],
    languages: MIX,
  },
  { id: 'w_fl2', name: 'Sunil', role: 'Foodie', look: 'techie_m2', x: 60, y: 75.2, behaviour: { type: 'route', points: [{ x: 46.5, y: 75.2 }, { x: 85, y: 75.2, pause: 2 }], loop: false }, personality: 'chill', categories: ['food_visit', 'techie'], languages: MIX },
  { id: 'ajji_fl', name: 'Rukmini Ajji', role: 'Temple-goer', look: 'ajji', x: 67.5, y: 94.6, behaviour: { type: 'idle', facing: 'up' }, personality: 'wise', categories: ['aunty'], languages: KEN },
  { id: 'banyan_uncle', name: 'Ramaiah', role: 'Katte philosopher', look: 'uncle_veshti', x: 31.5, y: 93.6, behaviour: { type: 'chat', group: 'katte', facing: 'right' }, personality: 'wise', categories: ['uncle'], languages: KEN, topics: ['park', 'gossip'] },
  { id: 'banyan_uncle2', name: 'Siddappa', role: 'Katte philosopher', look: 'uncle', x: 34.6, y: 93.6, behaviour: { type: 'chat', group: 'katte', facing: 'left' }, personality: 'grumpy', categories: ['uncle'], languages: KEN, topics: ['park', 'gossip'] },

  // ── Metro hub
  { id: 'raju', name: 'Raju', role: 'Auto driver', look: 'auto', x: 106.8, y: 82.3, behaviour: { type: 'idle', facing: 'left' }, personality: 'chatty', categories: ['auto'], languages: MIX, conversation: 'raju' },
  { id: 'au1', name: 'Manjunath', role: 'Auto driver', look: 'auto', x: 99.3, y: 81, behaviour: { type: 'chat', group: 'autos', facing: 'right' }, personality: 'grumpy', categories: ['auto'], languages: KEN, topics: ['traffic', 'rain'] },
  { id: 'au2', name: 'Shivu', role: 'Auto driver', look: 'auto', x: 100.6, y: 81, behaviour: { type: 'chat', group: 'autos', facing: 'left' }, personality: 'chatty', categories: ['auto'], languages: KEN, topics: ['traffic', 'rain'] },
  { id: 'staff_hub', name: 'Farida', role: 'Metro staff', look: 'staff', x: 109.8, y: 72.6, behaviour: { type: 'idle', facing: 'down' }, personality: 'cheerful', categories: ['staff', 'metro'], languages: MIX, conversation: 'metrostaff' },
  { id: 'bs1', name: 'Mahesh', role: 'Bus commuter', look: 'commuter', x: 120.2, y: 75.6, behaviour: { type: 'chat', group: 'busstop', facing: 'right' }, personality: 'grumpy', categories: ['commuter'], languages: MIX, topics: ['traffic', 'metro', 'rain'] },
  { id: 'bs2', name: 'Nandini', role: 'Bus commuter', look: 'commuter_f', x: 121.5, y: 75.6, behaviour: { type: 'chat', group: 'busstop', facing: 'left' }, personality: 'chatty', categories: ['commuter'], languages: MIX, topics: ['traffic', 'metro', 'rain'] },
  { id: 'flower_hub', name: 'Mallamma', role: 'Flower seller', look: 'vendor_f', x: 97.7, y: 74.5, behaviour: { type: 'idle', facing: 'left' }, personality: 'chatty', categories: ['vendor'], languages: KEN, reach: 40 },
  { id: 'coconut_hub', name: 'Eregowda', role: 'Coconut seller', look: 'shopkeeper', x: 114.7, y: 76.1, behaviour: { type: 'idle', facing: 'left' }, personality: 'cheerful', categories: ['vendor'], languages: KEN, reach: 40 },
  { id: 'hub1', name: 'Sameer', role: 'Traveller', look: 'student', x: 104, y: 86, behaviour: { type: 'wander', zone: { x: 95, y: 84, w: 20, h: 4 } }, personality: 'chill', categories: ['commuter', 'metro'], languages: MIX },
  { id: 'hub2', name: 'Bhavana', role: 'Techie', look: 'techie_f', x: 110, y: 78, behaviour: { type: 'wander', zone: { x: 100, y: 73.4, w: 16, h: 2 } }, personality: 'anxious', categories: ['techie', 'metro'], languages: MIX },
  { id: 'hub3', name: 'Gopal', role: 'Retired uncle', look: 'uncle_veshti', x: 120, y: 93, behaviour: { type: 'wander', zone: { x: 115, y: 92.4, w: 12, h: 2.4 } }, personality: 'wise', categories: ['uncle', 'metro'], languages: KEN, speed: 22 },
  // Food counters and tech park regulars
  { id: 'kaapi_server', name: 'Ravi', role: 'Kaapi master', look: 'chaiwala', x: 25.5, y: 16.35, behaviour: { type: 'idle', facing: 'down' }, personality: 'cheerful', categories: ['chaiwala'], languages: KEN, conversation: 'kaapi', reach: 34 },
  { id: 'barista', name: 'Ishaan', role: 'Barista', look: 'student', x: 7.5, y: 16.35, behaviour: { type: 'idle', facing: 'down' }, personality: 'chill', categories: ['hipster'], languages: ['en', 'hi'], conversation: 'bunbytes', reach: 34 },
  { id: 'bennedose_cook', name: 'Mahadevappa', role: 'Benne dose cook', look: 'cook', x: 80.5, y: 94.4, behaviour: { type: 'idle', facing: 'down' }, personality: 'wise', categories: ['cook'], languages: KEN, conversation: 'bennedose', reach: 34 },
  { id: 'juice_seller', name: 'Salim', role: 'Juice seller', look: 'shopkeeper', x: 74, y: 74.25, behaviour: { type: 'idle', facing: 'down' }, personality: 'chatty', categories: ['vendor', 'shopkeeper'], languages: MIX, conversation: 'juice', reach: 36 },
  { id: 'mysorepak_seller', name: 'Lakshmamma', role: 'Sweet shop', look: 'aunty', x: 82.5, y: 74.25, behaviour: { type: 'idle', facing: 'down' }, personality: 'cheerful', categories: ['shopkeeper'], languages: KEN, conversation: 'mysorepak', reach: 36 },
  { id: 'foodcourt_staff', name: 'Pooja', role: 'Food court counter', look: 'commuter_f', x: 124.5, y: 92.3, behaviour: { type: 'idle', facing: 'down' }, personality: 'cheerful', categories: ['shopkeeper'], languages: MIX, conversation: 'foodcourt', reach: 36 },
  { id: 'campus_guard', name: 'Venkatesh', role: 'Campus security', look: 'guard', x: 52.3, y: 12.7, behaviour: { type: 'idle', facing: 'down' }, personality: 'chill', categories: ['guard'], languages: KEN, conversation: 'campusguard' },
  { id: 'intern', name: 'Tanvi', role: 'Amazon intern', look: 'techie_f', x: 60.6, y: 12.7, behaviour: { type: 'idle', facing: 'down' }, personality: 'anxious', categories: ['techie'], languages: ['en', 'hi', 'kn'], conversation: 'intern' },
  // Running clubs: around Ulsoor Lake and the Cubbon Park track
  runner('run_kere1', 'Arvind', 'runner', KERE_LOOP, 0, 70),
  runner('run_kere2', 'Nisha', 'runner_f', KERE_LOOP, 4, 66),
  runner('run_kere3', 'Joseph', 'jogger', KERE_LOOP, 8, 62),
  runner('run_cub1', 'Kiran', 'runner', CUBBON_LOOP, 0, 70),
  runner('run_cub2', 'Pallavi', 'runner_f', CUBBON_LOOP, 2, 68),
  runner('run_cub3', 'Faiz', 'jogger', CUBBON_LOOP, 4, 64),
  runner('run_cub4', 'Deepa', 'runner_f', CUBBON_LOOP, 6, 72),
  // Walk-in drive at the tech park: one recruiter, one table, a queue
  { id: 'recruiter', name: 'Shalini', role: 'Recruiter', look: 'techie_f2', x: 83.5, y: 8.75, behaviour: { type: 'idle', facing: 'down' }, personality: 'chatty', categories: ['recruiter'], languages: MIX, conversation: 'recruiter', reach: 40 },
  { id: 'cand1', name: 'Vikram', role: 'Job candidate', look: 'student', x: 85.4, y: 10.9, behaviour: { type: 'idle', facing: 'up' }, personality: 'anxious', categories: ['candidate'], languages: MIX },
  { id: 'cand2', name: 'Pooja', role: 'Job candidate', look: 'student_f', x: 85.4, y: 11.9, behaviour: { type: 'idle', facing: 'up' }, personality: 'anxious', categories: ['candidate'], languages: MIX },
  { id: 'cand3', name: 'Aditya', role: 'Job candidate', look: 'techie_m', x: 85.4, y: 12.9, behaviour: { type: 'idle', facing: 'up' }, personality: 'chill', categories: ['candidate'], languages: MIX },
  { id: 'cand4', name: 'Sana', role: 'Job candidate', look: 'techie_f', x: 85.4, y: 13.9, behaviour: { type: 'idle', facing: 'up' }, personality: 'cheerful', categories: ['candidate'], languages: MIX },
  // Evening crowd outside Toit
  { id: 'toit1', name: 'Rhea', role: 'Pub regular', look: 'hipster', x: 34.6, y: 16.6, behaviour: { type: 'chat', group: 'toit', facing: 'right' }, personality: 'chatty', categories: ['hipster'], languages: MIX, topics: ['pub'] },
  { id: 'toit2', name: 'Karthik', role: 'Pub regular', look: 'techie_m2', x: 35.8, y: 16.6, behaviour: { type: 'chat', group: 'toit', facing: 'left' }, personality: 'chill', categories: ['techie'], languages: MIX, topics: ['pub'] },
  // MG Road
  { id: 'koshys_server', name: 'Thomas', role: 'Koshy\'s waiter', look: 'cook', x: 13.5, y: 106.35, behaviour: { type: 'idle', facing: 'down' }, personality: 'wise', categories: ['cook'], languages: MIX, conversation: 'koshys', reach: 34 },
  { id: 'mg_reader', name: 'Ishita', role: 'Book lover', look: 'student_f', x: 22, y: 106.4, behaviour: { type: 'idle', facing: 'down' }, personality: 'chill', categories: ['student'], languages: MIX },
  { id: 'pecos1', name: 'Neil', role: 'Pecos regular', look: 'hipster', x: 30.6, y: 106.6, behaviour: { type: 'chat', group: 'pecos', facing: 'right' }, personality: 'chatty', categories: ['hipster'], languages: MIX, topics: ['pub'] },
  { id: 'pecos2', name: 'Ramesh K', role: 'Pecos regular', look: 'commuter', x: 31.9, y: 106.6, behaviour: { type: 'chat', group: 'pecos', facing: 'left' }, personality: 'grumpy', categories: ['ambient'], languages: MIX, topics: ['pub', 'cricket'] },
  { id: 'mg_walker', name: 'Mr. D\'Souza', role: 'MG Road regular', look: 'uncle', x: 1.5, y: 107.1, behaviour: { type: 'route', points: [{ x: 1.5, y: 107.1 }, { x: 37, y: 107.1, pause: 2 }], loop: false }, personality: 'wise', categories: ['uncle'], languages: MIX },
  // Cubbon Park
  { id: 'lib_guard', name: 'Nanjappa', role: 'Library guard', look: 'guard', x: 11, y: 132.4, behaviour: { type: 'idle', facing: 'down' }, personality: 'wise', categories: ['guard'], languages: KEN, conversation: 'library' },
  { id: 'cub_uncle', name: 'Subbaiah', role: 'Morning walker', look: 'uncle_veshti', x: 8, y: 134, behaviour: { type: 'wander', zone: { x: 5, y: 133.5, w: 11, h: 1.3 } }, personality: 'wise', categories: ['uncle'], languages: KEN, speed: 24 },
  { id: 'cub_a', name: 'Meghana', role: 'Student', look: 'student_f', x: 7.6, y: 119.4, behaviour: { type: 'chat', group: 'cubbon', facing: 'right' }, personality: 'chatty', categories: ['student'], languages: MIX, topics: ['park', 'general'] },
  { id: 'cub_b', name: 'Rohan', role: 'Student', look: 'student', x: 8.9, y: 119.4, behaviour: { type: 'chat', group: 'cubbon', facing: 'left' }, personality: 'chill', categories: ['student'], languages: MIX, topics: ['park', 'general'] },
  // Chinnaswamy Stadium: fans and the ticket counter
  { id: 'tickets', name: 'Raghu', role: 'Ticket counter', look: 'fan2', x: 26, y: 139.35, behaviour: { type: 'idle', facing: 'down' }, personality: 'cheerful', categories: ['fan'], languages: KEN, conversation: 'tickets', reach: 36 },
  { id: 'fan1', name: 'Santosh', role: 'RCB fan', look: 'fan', x: 29.6, y: 133.2, behaviour: { type: 'chat', group: 'fans', facing: 'right' }, personality: 'cheerful', categories: ['fan'], languages: MIX, topics: ['cricket'] },
  { id: 'fan2', name: 'Bhoomika', role: 'RCB fan', look: 'fan_f', x: 30.9, y: 133.2, behaviour: { type: 'chat', group: 'fans', facing: 'left' }, personality: 'chatty', categories: ['fan'], languages: MIX, topics: ['cricket'] },
  { id: 'fan3', name: 'Manoj', role: 'RCB fan', look: 'fan2', x: 33.4, y: 137.2, behaviour: { type: 'chat', group: 'fans2', facing: 'right' }, personality: 'chatty', categories: ['fan'], languages: MIX, topics: ['cricket'] },
  { id: 'fan4', name: 'Chetan', role: 'RCB fan', look: 'fan', x: 34.7, y: 137.2, behaviour: { type: 'chat', group: 'fans2', facing: 'left' }, personality: 'cheerful', categories: ['fan'], languages: MIX, topics: ['cricket'] },
  { id: 'fan5', name: 'Ananya R', role: 'RCB fan', look: 'fan_f', x: 30, y: 140.6, behaviour: { type: 'wander', zone: { x: 23, y: 140, w: 14, h: 1.4 } }, personality: 'cheerful', categories: ['fan'], languages: MIX },
  // Koramangala
  { id: 'founder', name: 'Varun', role: 'Startup founder', look: 'hipster', x: 50, y: 107.3, behaviour: { type: 'wander', zone: { x: 46, y: 107, w: 39, h: 0.6 } }, personality: 'chatty', categories: ['founder'], languages: ['en', 'hi'] },
  { id: 'social1', name: 'Tara', role: 'SOCIAL regular', look: 'techie_laptop_f', x: 79.4, y: 106.6, behaviour: { type: 'chat', group: 'social', facing: 'right' }, personality: 'chatty', categories: ['techie'], languages: MIX, topics: ['pub', 'startup'] },
  { id: 'social2', name: 'Abhi', role: 'SOCIAL regular', look: 'student', x: 80.7, y: 106.6, behaviour: { type: 'chat', group: 'social', facing: 'left' }, personality: 'chill', categories: ['student'], languages: MIX, topics: ['pub', 'startup'] },
  { id: 'social3', name: 'Zubin', role: 'SOCIAL regular', look: 'techie_m', x: 82, y: 106.6, behaviour: { type: 'chat', group: 'social', facing: 'left' }, personality: 'cheerful', categories: ['founder'], languages: MIX, topics: ['pub', 'startup'] },
  { id: 'swiggy_rider', name: 'Mallesh', role: 'Delivery rider', look: 'delivery', x: 60.6, y: 106.5, behaviour: { type: 'idle', facing: 'down' }, personality: 'anxious', categories: ['delivery'], languages: KEN, conversation: 'rider' },
  { id: 'truffles_server', name: 'Sneha T', role: 'Truffles counter', look: 'cook', x: 50, y: 137.35, behaviour: { type: 'idle', facing: 'down' }, personality: 'cheerful', categories: ['cook'], languages: MIX, conversation: 'truffles', reach: 36 },
  { id: 'startup1', name: 'Neha', role: 'Startup founder', look: 'hipster', x: 58.4, y: 137.6, behaviour: { type: 'chat', group: 'startup', facing: 'right' }, personality: 'chatty', categories: ['founder'], languages: ['en', 'hi'], topics: ['startup'] },
  { id: 'startup2', name: 'Ravi S', role: 'Startup founder', look: 'techie_laptop_f', x: 59.7, y: 137.6, behaviour: { type: 'chat', group: 'startup', facing: 'left' }, personality: 'anxious', categories: ['founder'], languages: ['en', 'hi'], topics: ['startup'] },
  { id: 'kora_techie', name: 'Prateek', role: 'Techie', look: 'techie_laptop', x: 60, y: 113, behaviour: { type: 'wander', zone: { x: 46, y: 112.6, w: 39, h: 0.8 } }, personality: 'anxious', categories: ['techie'], languages: MIX },
  // BTM Layout
  { id: 'pg_aunty', name: 'Saraswathi', role: 'PG owner', look: 'aunty2', x: 98.5, y: 106.4, behaviour: { type: 'idle', facing: 'down' }, personality: 'grumpy', categories: ['aunty'], languages: KEN, conversation: 'pgaunty' },
  { id: 'pg1', name: 'Sunny', role: 'PG resident', look: 'student', x: 104.6, y: 106.6, behaviour: { type: 'chat', group: 'pgmates', facing: 'right' }, personality: 'chill', categories: ['pg'], languages: MIX, topics: ['pg', 'food'] },
  { id: 'pg2', name: 'Harsh', role: 'PG resident', look: 'techie_m2', x: 105.9, y: 106.6, behaviour: { type: 'chat', group: 'pgmates', facing: 'left' }, personality: 'anxious', categories: ['pg'], languages: MIX, topics: ['pg', 'food'] },
  { id: 'mess_server', name: 'Venkat Rao', role: 'Andhra Mess', look: 'cook', x: 115, y: 106.35, behaviour: { type: 'idle', facing: 'down' }, personality: 'cheerful', categories: ['cook'], languages: MIX, conversation: 'andhramess', reach: 34 },
  { id: 'pg3', name: 'Aishwarya', role: 'PG resident', look: 'student_f', x: 121.6, y: 106.6, behaviour: { type: 'chat', group: 'pggirls', facing: 'right' }, personality: 'chatty', categories: ['pg'], languages: MIX, topics: ['pg', 'general'] },
  { id: 'pg4', name: 'Riya', role: 'PG resident', look: 'techie_f', x: 122.9, y: 106.6, behaviour: { type: 'chat', group: 'pggirls', facing: 'left' }, personality: 'cheerful', categories: ['pg'], languages: MIX, topics: ['pg', 'general'] },
  { id: 'btm_walker', name: 'Lokesh', role: 'Lake walker', look: 'uncle', x: 110, y: 141.6, behaviour: { type: 'wander', zone: { x: 100, y: 141, w: 20, h: 1 } }, personality: 'wise', categories: ['uncle'], languages: KEN, speed: 26 },
  { id: 'btm_rider', name: 'Imtiyaz', role: 'Delivery rider', look: 'delivery', x: 101.5, y: 113.2, behaviour: { type: 'idle', facing: 'down' }, personality: 'anxious', categories: ['delivery'], languages: MIX, conversation: 'rider' },
  // Pushcart hawkers who call out as they go
  { id: 'hawk_tomato', name: 'Thimmappa', role: 'Vegetable cart', look: 'shopkeeper', x: 3, y: 76.2, behaviour: { type: 'route', points: [{ x: 3, y: 76.2 }, { x: 36, y: 76.2, pause: 3 }], loop: false }, personality: 'cheerful', categories: ['hawk_veg'], languages: KEN, speed: 22 },
  { id: 'hawk_soppu', name: 'Sarojamma', role: 'Greens seller', look: 'vendor_f', x: 95, y: 78.6, behaviour: { type: 'route', points: [{ x: 95, y: 78.6 }, { x: 126, y: 78.6, pause: 3 }], loop: false }, personality: 'chatty', categories: ['hawk_soppu'], languages: KEN, speed: 20 },
  { id: 'hawk_paper', name: 'Pasha', role: 'Raddi collector', look: 'commuter', x: 95, y: 107.1, behaviour: { type: 'route', points: [{ x: 95, y: 107.1 }, { x: 126, y: 107.1, pause: 3 }], loop: false }, personality: 'cheerful', categories: ['hawk_paper'], languages: MIX, speed: 24 },
  { id: 'hawk_elneer', name: 'Eshwar', role: 'Tender coconut cart', look: 'chaiwala', x: 2, y: 112.9, behaviour: { type: 'route', points: [{ x: 2, y: 112.9 }, { x: 37, y: 112.9, pause: 3 }], loop: false }, personality: 'cheerful', categories: ['hawk_elneer'], languages: KEN, speed: 22 },
  // Building site (Thippasandra) and the road crew at the Marathahalli roadworks
  { id: 'site_eng', name: 'Ravikumar', role: 'Site engineer', look: 'engineer', x: 52.5, y: 93.5, behaviour: { type: 'idle', facing: 'down' }, personality: 'anxious', categories: ['worker'], languages: MIX, conversation: 'siteengineer' },
  { id: 'site_w1', name: 'Hanumanthu', role: 'Construction worker', look: 'worker', x: 56, y: 87, behaviour: { type: 'wander', zone: { x: 54.6, y: 85.5, w: 3, h: 3 } }, personality: 'cheerful', categories: ['worker'], languages: KEN, speed: 22 },
  { id: 'site_w2', name: 'Bablu', role: 'Construction worker', look: 'worker2', x: 50.5, y: 94.6, behaviour: { type: 'wander', zone: { x: 50, y: 94.2, w: 4, h: 1.2 } }, personality: 'chill', categories: ['worker'], languages: ['hi', 'kn'], speed: 20 },
  { id: 'crew1', name: 'Shankar', role: 'Road crew', look: 'worker', x: 101, y: 22.8, behaviour: { type: 'chat', group: 'roadcrew', facing: 'right' }, personality: 'chatty', categories: ['worker'], languages: KEN, topics: ['construction'] },
  { id: 'crew2', name: 'Ramzan', role: 'Road crew', look: 'worker2', x: 102.3, y: 22.8, behaviour: { type: 'chat', group: 'roadcrew', facing: 'left' }, personality: 'grumpy', categories: ['worker'], languages: MIX, topics: ['construction'] },
  // Vidhana Soudha, Basavanagudi (Bull Temple and the Ganesha pandal), Lalbagh
  { id: 'vs_guard', name: 'Nagesh', role: 'Vidhana Soudha guard', look: 'guard', x: 20, y: 160.6, behaviour: { type: 'idle', facing: 'down' }, personality: 'wise', categories: ['guard'], languages: KEN, conversation: 'vidhana' },
  { id: 'vs_tour1', name: 'Kavitha', role: 'Tourist', look: 'commuter_f', x: 11.4, y: 161.2, behaviour: { type: 'chat', group: 'selfie', facing: 'right' }, personality: 'chatty', categories: ['ambient'], languages: MIX, topics: ['general'] },
  { id: 'vs_tour2', name: 'Harish', role: 'Tourist', look: 'student', x: 12.7, y: 161.2, behaviour: { type: 'chat', group: 'selfie', facing: 'left' }, personality: 'cheerful', categories: ['student'], languages: MIX, topics: ['general'] },
  { id: 'bt_priest', name: 'Shastri', role: 'Temple priest', look: 'uncle_veshti', x: 52, y: 161.4, behaviour: { type: 'idle', facing: 'down' }, personality: 'wise', categories: ['uncle'], languages: KEN },
  { id: 'bt_kadle', name: 'Muniyamma', role: 'Groundnut seller', look: 'vendor_f', x: 58.6, y: 161.4, behaviour: { type: 'idle', facing: 'down' }, personality: 'cheerful', categories: ['hawk_kadle'], languages: KEN, reach: 36 },
  { id: 'pd_host', name: 'Ganesh', role: 'Pandal organiser', look: 'uncle', x: 69, y: 161.4, behaviour: { type: 'idle', facing: 'down' }, personality: 'chatty', categories: ['uncle'], languages: MIX, conversation: 'pandal' },
  { id: 'pd_dev1', name: 'Vasantha', role: 'Devotee', look: 'aunty', x: 64.2, y: 162.7, behaviour: { type: 'chat', group: 'pandal', facing: 'right' }, personality: 'chatty', categories: ['aunty'], languages: KEN, topics: ['gossip'] },
  { id: 'pd_dev2', name: 'Kamala', role: 'Devotee', look: 'aunty2', x: 65.5, y: 162.7, behaviour: { type: 'chat', group: 'pandal', facing: 'left' }, personality: 'cheerful', categories: ['aunty'], languages: KEN, topics: ['gossip'] },
  { id: 'pd_kid', name: 'Pinto', role: 'Dancing kid', look: 'kid2', x: 73, y: 161.9, behaviour: { type: 'wander', zone: { x: 71.5, y: 161.6, w: 4, h: 0.6 } }, personality: 'cheerful', categories: ['kid'], languages: KEN, speed: 60 },
  { id: 'lb_walker', name: 'Seetharam', role: 'Morning walker', look: 'jogger', x: 104, y: 160.6, behaviour: { type: 'wander', zone: { x: 97, y: 160.2, w: 28, h: 1.2 } }, personality: 'wise', categories: ['jogger'], languages: KEN, speed: 34 },
  { id: 'lb_a', name: 'Sneha R', role: 'Visitor', look: 'student_f', x: 119.4, y: 160.4, behaviour: { type: 'chat', group: 'lalbagh', facing: 'right' }, personality: 'chatty', categories: ['student'], languages: MIX, topics: ['park'] },
  { id: 'lb_b', name: 'Akshay', role: 'Visitor', look: 'student', x: 120.7, y: 160.4, behaviour: { type: 'chat', group: 'lalbagh', facing: 'left' }, personality: 'chill', categories: ['student'], languages: MIX, topics: ['park'] },
  // ── Devanahalli Highway and Nandi Hills
  { id: 'tollman', name: 'Venkatesh', role: 'Toll booth operator', look: 'staff', x: 137.5, y: 56.7, behaviour: { type: 'idle', facing: 'down' }, personality: 'grumpy', categories: ['tollman', 'ambient'], languages: MIX },
  { id: 'groundnut', name: 'Shivamma', role: 'Groundnut seller', look: 'vendor_f', x: 140.5, y: 57.3, behaviour: { type: 'wander', zone: { x: 139.5, y: 56.9, w: 4, h: 0.6 } }, personality: 'cheerful', categories: ['vendor', 'ambient'], languages: KEN },
  { id: 'dhaba_owner', name: 'Balwinder', role: 'Dhaba owner', look: 'cook', x: 157, y: 72.6, behaviour: { type: 'idle', facing: 'down' }, personality: 'chatty', categories: ['dhaba', 'cook'], languages: MIX, reach: 40, conversation: 'dhaba' },
  { id: 'trucker', name: 'Murugan', role: 'Truck driver', look: 'uncle', x: 153.5, y: 75.6, behaviour: { type: 'idle', facing: 'up' }, personality: 'chill', categories: ['dhaba', 'ambient'], languages: MIX },
  { id: 'forest_guard', name: 'Hanumanthappa', role: 'Forest guard', look: 'guard', x: 151, y: 55.4, behaviour: { type: 'idle', facing: 'left' }, personality: 'wise', categories: ['forest_guard', 'guard'], languages: KEN },
  { id: 'biker_rohan', name: 'Rohan', role: 'Weekend biker', look: 'runner', x: 157, y: 34.3, behaviour: { type: 'wander', zone: { x: 155.5, y: 34, w: 4, h: 0.8 } }, personality: 'cheerful', categories: ['biker', 'hills'], languages: MIX, conversation: 'biker' },
  { id: 'biker_nisha', name: 'Nisha', role: 'Weekend biker', look: 'runner_f', x: 162, y: 36.2, behaviour: { type: 'wander', zone: { x: 161.5, y: 36, w: 4, h: 0.8 } }, personality: 'chill', categories: ['biker', 'hills'], languages: MIX },
  { id: 'couple_a', name: 'Arvind', role: 'Selfie seeker', look: 'techie_m', x: 159.3, y: 28.6, behaviour: { type: 'chat', group: 'nandi_couple', facing: 'right' }, personality: 'cheerful', categories: ['hills'], languages: MIX, topics: ['hills'] },
  { id: 'couple_b', name: 'Divya', role: 'Selfie seeker', look: 'techie_f2', x: 160.7, y: 28.6, behaviour: { type: 'chat', group: 'nandi_couple', facing: 'left' }, personality: 'chatty', categories: ['hills'], languages: MIX, topics: ['hills'] },
  { id: 'photographer', name: 'Kiran', role: 'Photographer', look: 'hipster', x: 171.5, y: 32.6, behaviour: { type: 'idle', facing: 'up' }, personality: 'chill', categories: ['photographer', 'hills'], languages: MIX },
  { id: 'fog_techie', name: 'Pradeep', role: 'Disappointed techie', look: 'techie_m2', x: 175.5, y: 32.6, behaviour: { type: 'idle', facing: 'left' }, personality: 'grumpy', categories: ['hills', 'techie'], languages: MIX },
  { id: 'corn_vendor', name: 'Lakshmamma', role: 'Corn and chai seller', look: 'vendor_f', x: 161.6, y: 35.3, behaviour: { type: 'idle', facing: 'left' }, personality: 'cheerful', categories: ['hills_vendor', 'vendor'], languages: KEN, conversation: 'corn' },
  { id: 'hilltop_server', name: 'Ravi', role: 'Hill Top Cafe', look: 'cook', x: 154, y: 33.6, behaviour: { type: 'idle', facing: 'down' }, personality: 'cheerful', categories: ['cook', 'hills'], languages: MIX, conversation: 'hilltop' },
  { id: 'temple_priest', name: 'Shastri', role: 'Temple priest', look: 'uncle_veshti', x: 167, y: 33.6, behaviour: { type: 'idle', facing: 'down' }, personality: 'wise', categories: ['priest', 'uncle'], languages: KEN },
  // ── Silk Board junction
  { id: 'sb_cop', name: 'Constable Gowda', role: 'Traffic police', look: 'cop', x: 129, y: 107.4, behaviour: { type: 'idle', facing: 'right' }, personality: 'grumpy', categories: ['cop', 'silkboard'], languages: MIX },
  { id: 'sb_hawker', name: 'Mahesh', role: 'Signal hawker', look: 'vendor_f', x: 137, y: 113.2, behaviour: { type: 'wander', zone: { x: 136, y: 112.9, w: 8, h: 0.5 } }, personality: 'cheerful', categories: ['sb_hawker', 'vendor'], languages: MIX },
  { id: 'sb_commuter', name: 'Sneha', role: 'Stuck commuter', look: 'commuter_f', x: 122, y: 106.8, behaviour: { type: 'idle', facing: 'right' }, personality: 'anxious', categories: ['silkboard', 'commuter'], languages: MIX },
  // ── Kempegowda Airport
  { id: 'ap_cabbie', name: 'Naveen', role: 'Airport cab driver', look: 'auto', x: 179.5, y: 56.6, behaviour: { type: 'idle', facing: 'right' }, personality: 'chatty', categories: ['airport_cab', 'auto'], languages: MIX },
  { id: 'ap_nri', name: 'Ramesh uncle', role: 'Visiting from New Jersey', look: 'uncle', x: 184, y: 55.2, behaviour: { type: 'wander', zone: { x: 182.5, y: 54.6, w: 5, h: 1 } }, personality: 'chatty', categories: ['airport', 'uncle'], languages: MIX },
  { id: 'ap_traveller', name: 'Ananya', role: 'Traveller', look: 'commuter_f', x: 188, y: 55.4, behaviour: { type: 'idle', facing: 'left' }, personality: 'anxious', categories: ['airport', 'commuter'], languages: MIX },
  { id: 'ap_techie', name: 'Siddharth', role: 'Flight delayed', look: 'techie_laptop', x: 190, y: 54.8, behaviour: { type: 'idle', facing: 'left' }, personality: 'grumpy', categories: ['airport', 'techie'], languages: MIX },
  { id: 'ap_guard', name: 'Prakash', role: 'CISF guard', look: 'guard', x: 186.5, y: 54.4, behaviour: { type: 'idle', facing: 'down' }, personality: 'wise', categories: ['guard'], languages: MIX },
];
