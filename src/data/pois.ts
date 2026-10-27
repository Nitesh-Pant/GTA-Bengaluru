import { t } from '../game/constants';
import type { PoiDef } from '../logic/discovery';

/**
 * Places to discover. Many are *inspired by* real Bengaluru institutions
 * (darshinis, military hotels, Iyengar bakeries) but none is a faithful recreation.
 */
export const POIS: PoiDef[] = [
  // Indiranagar
  { id: 'feet100', name: '100 Feet Road', district: 'indiranagar', kind: 'landmark', x: t(20), y: t(17), radius: 60, description: 'The road that is famously not always 100 feet wide. Cafes on one side, traffic on the other, opinions everywhere.', inspiredBy: "Indiranagar's 100 Feet Road" },
  { id: 'bunbytes', name: 'Bun & Bytes Cafe', district: 'indiranagar', kind: 'food', x: t(5), y: t(16.5), radius: 44, description: 'Laptops outnumber cups. The Wi-Fi password is "adjustmaadi123".' },
  { id: 'kaapi', name: 'Filter Kaapi Co.', district: 'indiranagar', kind: 'food', x: t(24.5), y: t(16.5), radius: 44, description: 'Steel tumbler, davara, and a pour from shoulder height. The froth is the whole point.' },
  { id: 'brewpub', name: 'Hops & Hoppers', district: 'indiranagar', kind: 'landmark', x: t(34), y: t(16.5), radius: 48, description: "A brewpub where someone is always explaining their startup's pivot." },
  { id: 'teapoint', name: "Manju's Tea Point", district: 'indiranagar', kind: 'food', x: t(29), y: t(16.6), radius: 34, description: 'A tiny cart with a giant kettle. Opinions on cricket served free with every chai.' },
  { id: 'graffiti', name: 'Graffiti Gully', district: 'indiranagar', kind: 'hidden', hidden: true, x: t(26), y: t(45.5), radius: 48, description: 'A quiet back lane whose wall is a rotating gallery of local artists. Today: a giant auto-rickshaw made of jasmine.', hint: 'Behind the mural wall off 12th Main' },
  { id: 'metro_in', name: 'Indiranagar Metro', district: 'indiranagar', kind: 'metro', x: t(32), y: t(56.5), radius: 52, description: 'Purple line station. The escalator is working today, which is news.' },
  // Tech park
  { id: 'techpark', name: 'ByteWhite Tech Park', district: 'techpark', kind: 'landmark', x: t(58), y: t(13), radius: 64, description: 'Glass, lanyards, and the eternal question: "Can you see my screen?"', inspiredBy: "Bengaluru's tech parks" },
  { id: 'breakzone', name: 'Tech Park Break Zone', district: 'techpark', kind: 'food', x: t(78), y: t(13.5), radius: 52, description: 'Where sprints are planned, appraisals decoded, and chai is the only real deliverable.' },
  // Kere Park
  { id: 'kerepark', name: 'Kere Park', district: 'park', kind: 'park', x: t(54), y: t(32), radius: 60, description: 'A lakeside park. Morning uncles walk in loops discussing the 1980s.', inspiredBy: "Bengaluru's lake parks" },
  { id: 'kerebench', name: 'Secret Lake Bench', district: 'park', kind: 'hidden', hidden: true, x: t(80), y: t(52), radius: 34, description: 'A bench behind the bushes with the best view of the lake. Locals guard this secret fiercely.', hint: 'Behind the bushes, south-east of the lake' },
  // Marathahalli
  { id: 'mjunction', name: 'Marathahalli Junction', district: 'marathahalli', kind: 'landmark', x: t(90), y: t(20), radius: 72, description: 'Signals, roadworks, autos, buses and a cow. Every journey here is a character-building exercise.', inspiredBy: 'Marathahalli bridge junction' },
  { id: 'mobile', name: 'Mobile Bazaar', district: 'marathahalli', kind: 'shop', x: t(97.5), y: t(16.5), radius: 40, description: 'Screen guards, chargers, and a man who can fix anything with a hair dryer.' },
  { id: 'mall', name: 'Swalpa Mall', district: 'marathahalli', kind: 'landmark', x: t(100.5), y: t(38), radius: 56, description: 'Air-conditioning, escalators, and a sale that has been "last day" since 2019.' },
  { id: 'market', name: 'Sabzi Market', district: 'marathahalli', kind: 'shop', x: t(118), y: t(44), radius: 60, description: 'Tomato prices here are a better economic indicator than any index.' },
  { id: 'shortcut', name: 'Shortcut Gully', district: 'marathahalli', kind: 'hidden', hidden: true, x: t(101), y: t(48), radius: 36, description: 'A narrow gap between the hardware shop and the tailor. Saves two minutes and one existential crisis.', hint: 'Between the hardware shop and the tailor' },
  // Food lane
  { id: 'darshini', name: 'Sri Udupi Darshini', district: 'foodlane', kind: 'food', x: t(53), y: t(75.5), radius: 52, description: 'Stand-and-eat darshini. Crisp dose, fluffy idli, and coffee that could restart a stalled sprint.', inspiredBy: "Bengaluru's darshinis such as Vidyarthi Bhavan and Rameshwaram Cafe" },
  { id: 'annachai', name: 'Anna Chai Point', district: 'foodlane', kind: 'food', x: t(63), y: t(79), radius: 44, description: 'The chai stall where everyone eventually ends up. Bun maska highly recommended.' },
  { id: 'bakery', name: 'Iyengar Bakery', district: 'foodlane', kind: 'food', x: t(65), y: t(75), radius: 44, description: 'Honey cake, dil pasand, and veg puffs fresh at 4pm sharp.', inspiredBy: "Bengaluru's Iyengar bakeries" },
  { id: 'military', name: 'Military Hotel', district: 'foodlane', kind: 'food', x: t(5.5), y: t(75), radius: 48, description: 'Old-school non-veg meals. The biryani queue starts before the shutter opens.', inspiredBy: "Bengaluru's military hotels" },
  { id: 'ragi', name: 'Ragi Mudde Mane', district: 'foodlane', kind: 'food', x: t(14.5), y: t(75), radius: 40, description: 'Ragi balls and soppu saaru. Swallow, do not chew. Locals will watch to check.' },
  { id: 'maidan', name: 'Gully Cricket Maidan', district: 'foodlane', kind: 'landmark', x: t(12), y: t(86), radius: 72, description: 'The pitch has potholes, the boundary is a wall, and the umpire is somebody\'s grandmother.' },
  { id: 'banyan', name: 'Old Banyan Tree', district: 'foodlane', kind: 'hidden', hidden: true, x: t(33), y: t(93), radius: 44, description: 'A doddamara older than the city\'s first traffic signal. Uncles settle every argument on its katte.', hint: 'South-east corner of the maidan, past the houses' },
  { id: 'temple', name: 'Ganesha Gudi', district: 'foodlane', kind: 'landmark', x: t(67.5), y: t(94.5), radius: 48, description: 'A small neighbourhood temple. The bell rings, the scooters slow down, the coconut seller smiles.' },
  { id: 'bennedose', name: 'Benne Dose Corner', district: 'foodlane', kind: 'hidden', hidden: true, x: t(81), y: t(94.5), radius: 40, description: 'Butter-soaked Davangere-style dose, served on a leaf. Unmarked, unadvertised, unforgettable.', hint: 'Down the little lane past the chai stall' },
  // Metro hub
  { id: 'metro_hub', name: 'Central Metro Hub', district: 'metrohub', kind: 'metro', x: t(107), y: t(73), radius: 60, description: 'The big interchange. Ticket queues, QR codes and a security guard who has seen it all.' },
  { id: 'autostand', name: 'Hub Auto Stand', district: 'metrohub', kind: 'landmark', x: t(104), y: t(81), radius: 56, description: '"Meter haakthira?" "Swalpa extra kodi." The eternal negotiation lives here.' },
  { id: 'foodcourt', name: 'Hub Food Court', district: 'metrohub', kind: 'food', x: t(122.5), y: t(93), radius: 48, description: 'Station snacks: masala puri, cut fruit and very sweet coffee.' },
];

export const POI_IDS = new Set(POIS.map((p) => p.id));
export const poiById = (id: string) => POIS.find((p) => p.id === id);
