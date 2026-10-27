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
  { id: 'tp1', name: 'Rohit', role: 'Techie', look: 'techie_m2', x: 75.5, y: 11.6, behaviour: { type: 'chat', group: 'break', facing: 'right' }, personality: 'chill', categories: ['techie'], languages: MIX, topics: ['techie', 'traffic'] },
  { id: 'tp2', name: 'Sneha', role: 'Techie', look: 'techie_f2', x: 76.8, y: 11.6, behaviour: { type: 'chat', group: 'break', facing: 'left' }, personality: 'chatty', categories: ['techie'], languages: MIX, topics: ['techie', 'traffic'] },
  { id: 'tp_chai', name: 'Basava', role: 'Chai seller', look: 'chaiwala', x: 78, y: 10.6, behaviour: { type: 'idle', facing: 'down' }, personality: 'cheerful', categories: ['chaiwala'], languages: KEN, reach: 40 },
  { id: 'tp3', name: 'Vinay', role: 'Techie', look: 'techie_m', x: 52, y: 15.3, behaviour: { type: 'route', points: [{ x: 47, y: 15.3 }, { x: 70, y: 15.3, pause: 2 }], loop: false }, personality: 'anxious', categories: ['techie'], languages: MIX },
  { id: 'tp4', name: 'Meera', role: 'Techie', look: 'techie_f', x: 55, y: 15.4, behaviour: { type: 'chat', group: 'lawn', facing: 'right' }, personality: 'chatty', categories: ['techie'], languages: MIX, topics: ['techie', 'food'] },
  { id: 'tp5', name: 'Kiran', role: 'Techie', look: 'techie_m2', x: 56.3, y: 15.4, behaviour: { type: 'chat', group: 'lawn', facing: 'left' }, personality: 'chill', categories: ['techie'], languages: MIX, topics: ['techie', 'food'] },

  // ── Kere Park
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
  { id: 'deliv_mh', name: 'Salman', role: 'Delivery rider', look: 'delivery', x: 107.5, y: 17.2, behaviour: { type: 'idle', facing: 'down' }, personality: 'anxious', categories: ['delivery'], languages: MIX },

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
  { id: 'military', name: 'Khader', role: 'Military Hotel owner', look: 'shopkeeper', x: 5.5, y: 74.25, behaviour: { type: 'idle', facing: 'down' }, personality: 'cheerful', categories: ['cook', 'shopkeeper'], languages: MIX },
  { id: 'ragi', name: 'Gowramma', role: 'Ragi Mudde cook', look: 'aunty2', x: 14.5, y: 74.25, behaviour: { type: 'idle', facing: 'down' }, personality: 'wise', categories: ['cook', 'aunty'], languages: KEN },
  { id: 'paan', name: 'Babu', role: 'Paan shop', look: 'chaiwala', x: 21, y: 74.25, behaviour: { type: 'idle', facing: 'down' }, personality: 'chill', categories: ['shopkeeper'], languages: MIX },
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
];
