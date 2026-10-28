import { t } from '../game/constants';
import type { PoiDef } from '../logic/discovery';

/**
 * Places to discover, under their real Bengaluru names. The layout is simplified and not to scale,
 * and the people and stories around them are fictional.
 */
export const POIS: PoiDef[] = [
  // Indiranagar
  { id: 'feet100', name: '100 Feet Road', district: 'indiranagar', kind: 'landmark', x: t(20), y: t(17), radius: 60, description: 'The road that is famously not always 100 feet wide. Cafes on one side, traffic on the other, opinions everywhere.' },
  { id: 'bunbytes', name: 'Third Wave Coffee', district: 'indiranagar', kind: 'food', x: t(5), y: t(16.5), radius: 44, description: 'Laptops outnumber cups. The Wi-Fi password is "adjustmaadi123".' },
  { id: 'kaapi', name: 'Hatti Kaapi', district: 'indiranagar', kind: 'food', x: t(24.5), y: t(16.5), radius: 44, description: 'Steel tumbler, davara, and a pour from shoulder height. The froth is the whole point.' },
  { id: 'brewpub', name: 'Toit', district: 'indiranagar', kind: 'landmark', x: t(34), y: t(16.5), radius: 48, description: "A brewpub where someone is always explaining their startup's pivot." },
  { id: 'teapoint', name: "Manju's Tea Point", district: 'indiranagar', kind: 'food', x: t(29), y: t(16.6), radius: 34, description: 'A tiny cart with a giant kettle. Opinions on cricket served free with every chai.' },
  { id: 'graffiti', name: 'Graffiti Gully', district: 'indiranagar', kind: 'hidden', hidden: true, x: t(26), y: t(45.5), radius: 48, description: 'A quiet back lane whose wall is a rotating gallery of local artists. Today: a giant auto-rickshaw made of jasmine.', hint: 'Behind the mural wall off 12th Main' },
  { id: 'metro_in', name: 'Indiranagar Metro', district: 'indiranagar', kind: 'metro', x: t(32), y: t(56.5), radius: 52, description: 'Purple line station. The escalator is working today, which is news.' },
  // Tech park
  { id: 'techpark', name: 'Bagmane Tech Park', district: 'techpark', kind: 'landmark', x: t(58), y: t(13), radius: 64, description: 'Glass, lanyards, and the eternal question: "Can you see my screen?"' },
  { id: 'goggle', name: 'Google', district: 'techpark', kind: 'landmark', x: t(50.5), y: t(12.6), radius: 28, description: 'The colourful sign, the lanyards, and someone drawing a system design on a napkin over lunch.' },
  { id: 'amazoom', name: 'Amazon', district: 'techpark', kind: 'landmark', x: t(58.5), y: t(12.6), radius: 28, description: 'A "Day 1" banner, a rack of laptop bags, and a parcel that reaches the gate before you finish ordering.' },
  { id: 'ewhy', name: 'EY', district: 'techpark', kind: 'landmark', x: t(66.5), y: t(12.6), radius: 28, description: 'Blazers in Bengaluru heat. Every answer is a slide deck, every deck is "v7_final_FINAL".' },
  { id: 'microsloth', name: 'Microsoft', district: 'techpark', kind: 'landmark', x: t(78.5), y: t(8.6), radius: 30, description: 'A Teams call has been running since 9am. Nobody remembers who started it.' },
  { id: 'breakzone', name: 'Tech Park Break Zone', district: 'techpark', kind: 'food', x: t(78), y: t(13.5), radius: 52, description: 'Where sprints are planned, appraisals decoded, and chai is the only real deliverable.' },
  // Ulsoor Lake
  { id: 'kerepark', name: 'Ulsoor Lake', district: 'park', kind: 'park', x: t(54), y: t(32), radius: 60, description: 'Ulsoor Lake: pedal boats on the water, a walking track around it, and morning uncles walking in loops discussing the 1980s.' },
  { id: 'metro_kp', name: 'Halasuru Metro', district: 'park', kind: 'metro', x: t(59.5), y: t(56.5), radius: 48, description: 'Purple line station right by Ulsoor Lake. The lift works, the escalator is "under maintenance", the lake view is free.' },
  { id: 'kerebench', name: 'Secret Lake Bench', district: 'park', kind: 'hidden', hidden: true, x: t(80), y: t(52), radius: 34, description: 'A bench behind the bushes with the best view of the lake. Locals guard this secret fiercely.', hint: 'Behind the bushes, south-east of the lake' },
  // Marathahalli
  { id: 'mjunction', name: 'Marathahalli Junction', district: 'marathahalli', kind: 'landmark', x: t(90), y: t(20), radius: 72, description: 'Signals, roadworks, autos, buses and a cow. Every journey here is a character-building exercise.', inspiredBy: 'Marathahalli bridge junction' },
  { id: 'mobile', name: 'Mobile Bazaar', district: 'marathahalli', kind: 'shop', x: t(97.5), y: t(16.5), radius: 40, description: 'Screen guards, chargers, and a man who can fix anything with a hair dryer.' },
  { id: 'mall', name: 'Phoenix Marketcity', district: 'marathahalli', kind: 'landmark', x: t(100.5), y: t(38), radius: 56, description: 'Air-conditioning, escalators, a food court the size of a small town, and a weekend crowd to match.' },
  { id: 'market', name: 'Marathahalli Market', district: 'marathahalli', kind: 'shop', x: t(118), y: t(44), radius: 60, description: 'Tomato prices here are a better economic indicator than any index.' },
  { id: 'shortcut', name: 'Shortcut Gully', district: 'marathahalli', kind: 'hidden', hidden: true, x: t(101), y: t(48), radius: 36, description: 'A narrow gap between the hardware shop and the tailor. Saves two minutes and one existential crisis.', hint: 'Between the hardware shop and the tailor' },
  // Food lane
  { id: 'darshini', name: 'Rameshwaram Cafe', district: 'foodlane', kind: 'food', x: t(53), y: t(75.5), radius: 52, description: 'Stand-and-eat darshini with a famous queue. Crisp dose, fluffy idli, and coffee that could restart a stalled sprint.' },
  { id: 'annachai', name: 'Anna Chai Point', district: 'foodlane', kind: 'food', x: t(63), y: t(79), radius: 44, description: 'The chai stall where everyone eventually ends up. Bun maska highly recommended.' },
  { id: 'bakery', name: 'Iyengar Bakery', district: 'foodlane', kind: 'food', x: t(65), y: t(75), radius: 44, description: 'Honey cake, dil pasand, and veg puffs fresh at 4pm sharp.', inspiredBy: "Bengaluru's Iyengar bakeries" },
  { id: 'military', name: 'Shivaji Military Hotel', district: 'foodlane', kind: 'food', x: t(5.5), y: t(75), radius: 48, description: 'Old-school non-veg meals. The donne biryani queue starts before the shutter opens.' },
  { id: 'ragi', name: 'Ragi Mudde Mane', district: 'foodlane', kind: 'food', x: t(14.5), y: t(75), radius: 40, description: 'Ragi balls and soppu saaru. Swallow, do not chew. Locals will watch to check.' },
  { id: 'maidan', name: 'Gully Cricket Maidan', district: 'foodlane', kind: 'landmark', x: t(12), y: t(86), radius: 72, description: 'The pitch has potholes, the boundary is a wall, and the umpire is somebody\'s grandmother.' },
  { id: 'banyan', name: 'Old Banyan Tree', district: 'foodlane', kind: 'hidden', hidden: true, x: t(33), y: t(93), radius: 44, description: 'A doddamara older than the city\'s first traffic signal. Uncles settle every argument on its katte.', hint: 'South-east corner of the maidan, past the houses' },
  { id: 'site', name: 'Building Site', district: 'foodlane', kind: 'landmark', x: t(51), y: t(93.6), radius: 44, description: 'Five floors, "ready in six months". Bamboo scaffolding, a green net, and a cement mixer that starts at 7 am sharp.' },
  { id: 'temple', name: 'Ganesha Gudi', district: 'foodlane', kind: 'landmark', x: t(67.5), y: t(94.5), radius: 48, description: 'A small neighbourhood temple. The bell rings, the scooters slow down, the coconut seller smiles.' },
  { id: 'bennedose', name: 'Benne Dose Corner', district: 'foodlane', kind: 'hidden', hidden: true, x: t(81), y: t(94.5), radius: 40, description: 'Butter-soaked Davangere-style dose, served on a leaf. Unmarked, unadvertised, unforgettable.', hint: 'Down the little lane past the chai stall' },
  // Metro hub
  { id: 'metro_hub', name: 'KR Puram Metro', district: 'metrohub', kind: 'metro', x: t(107), y: t(73), radius: 60, description: 'Purple and Blue line interchange. Ticket queues, QR codes and a security guard who has seen it all.' },
  { id: 'autostand', name: 'KR Puram Auto Stand', district: 'metrohub', kind: 'landmark', x: t(104), y: t(81), radius: 56, description: '"Meter haakthira?" "Swalpa extra kodi." The eternal negotiation lives here.' },
  { id: 'foodcourt', name: 'KR Puram Food Court', district: 'metrohub', kind: 'food', x: t(122.5), y: t(93), radius: 48, description: 'Station snacks: masala puri, cut fruit and very sweet coffee.' },
  { id: 'walkin', name: 'Walk-in Drive', district: 'techpark', kind: 'landmark', x: t(83.5), y: t(12), radius: 44, description: 'A queue of freshers with five printed resumes each, and one recruiter with one table. Bring water.' },
  // MG Road
  { id: 'mgroad', name: 'MG Road', district: 'mgroad', kind: 'landmark', x: t(20), y: t(107), radius: 64, description: 'The boulevard: old bookshops, older pubs, and the metro gliding overhead in real life.' },
  { id: 'higginbothams', name: 'Higginbothams', district: 'mgroad', kind: 'shop', x: t(5), y: t(106.5), radius: 34, description: 'One of the oldest bookshops in the country, still smelling of paper and monsoon.' },
  { id: 'koshys', name: "Koshy's", district: 'mgroad', kind: 'food', x: t(13.5), y: t(106.5), radius: 34, description: 'Ceiling fans, old waiters, appam and stew, and a table of uncles solving the world since breakfast.' },
  { id: 'blossom', name: 'Blossom Book House', district: 'mgroad', kind: 'shop', x: t(22), y: t(106.5), radius: 34, description: 'Second-hand books stacked to the ceiling. You came for one book; you leave with six.' },
  { id: 'pecos', name: 'Pecos', district: 'mgroad', kind: 'landmark', x: t(31.5), y: t(106.5), radius: 36, description: 'Classic rock, cheap pitchers and walls covered in album art.' },
  // Cubbon Park and the stadium
  { id: 'cubbon', name: 'Cubbon Park', district: 'cubbon', kind: 'park', x: t(11), y: t(118), radius: 60, description: 'Bamboo groves, giant trees and the running track. The lungs of the city.' },
  { id: 'library', name: 'State Central Library', district: 'cubbon', kind: 'landmark', x: t(11), y: t(132.6), radius: 40, description: 'The red heritage library in the middle of the park. Silence, ceiling fans and exam aspirants.' },
  { id: 'stadium', name: 'M. Chinnaswamy Stadium', district: 'stadium', kind: 'landmark', x: t(30.5), y: t(132), radius: 60, description: 'Match day turns the whole neighbourhood red and gold. Ee sala cup namde!' },
  // Koramangala
  { id: 'flipkart', name: 'Flipkart', district: 'koramangala', kind: 'landmark', x: t(50.5), y: t(106.6), radius: 30, description: 'Big blue sign, bigger sale days. Somewhere inside, a team is preparing for the next one.' },
  { id: 'swiggy', name: 'Swiggy', district: 'koramangala', kind: 'landmark', x: t(59), y: t(106.6), radius: 28, description: 'Orange office, orange jackets outside, and the smell of somebody\'s lunch arriving.' },
  { id: 'razorpay', name: 'Razorpay', district: 'koramangala', kind: 'landmark', x: t(66), y: t(106.6), radius: 28, description: 'Payments people, payment jokes. Someone is explaining UPI to their visiting uncle.' },
  { id: 'cred', name: 'CRED', district: 'koramangala', kind: 'landmark', x: t(72.5), y: t(106.6), radius: 26, description: 'Very black, very minimal, very well designed. Even the door handle has a design system.' },
  { id: 'social', name: 'SOCIAL', district: 'koramangala', kind: 'food', x: t(81), y: t(106.6), radius: 36, description: 'Half office, half pub. Laptops by day, loud music by night, and the same people at both.' },
  { id: 'infosys', name: 'Infosys', district: 'koramangala', kind: 'landmark', x: t(51), y: t(126), radius: 32, description: 'Glass, lawns and an employee badge that opens everything except the weekend.' },
  { id: 'wipro', name: 'Wipro', district: 'koramangala', kind: 'landmark', x: t(61), y: t(126), radius: 28, description: 'A tidy campus building. The shuttle bus outside has been "leaving in five minutes" for twenty.' },
  { id: 'accenture', name: 'Accenture', district: 'koramangala', kind: 'landmark', x: t(71), y: t(126), radius: 32, description: 'Consultants, clients and a whiteboard that has not been fully erased since 2016.' },
  { id: 'ibm', name: 'IBM', district: 'koramangala', kind: 'landmark', x: t(81.5), y: t(126), radius: 28, description: 'Blue sign, old-school campus calm, and a canteen with surprisingly good curd rice.' },
  { id: 'truffles', name: 'Truffles', district: 'koramangala', kind: 'food', x: t(50), y: t(137.6), radius: 34, description: 'Burgers, steaks and a waiting list that moves faster than the 80 Feet Road signal.' },
  { id: 'nexus', name: 'Nexus Mall Koramangala', district: 'koramangala', kind: 'landmark', x: t(71), y: t(140.6), radius: 44, description: 'Movies, food court, and a parking basement that is its own small city.' },
  { id: 'startupst', name: 'Startup Street', district: 'koramangala', kind: 'landmark', x: t(82), y: t(134.8), radius: 40, description: 'Zerodha, Zepto and 91springboard on one corner. Every chai here comes with a pitch deck.' },
  // Vidhana Soudha, Basavanagudi, Lalbagh
  { id: 'vidhana', name: 'Vidhana Soudha', district: 'vidhana', kind: 'landmark', x: t(20), y: t(161), radius: 70, description: 'The state legislature in granite, with "Government Work is God\'s Work" carved over the door. Lit up on Sunday evenings.' },
  { id: 'bulltemple', name: 'Dodda Basavana Gudi', district: 'basavanagudi', kind: 'landmark', x: t(52), y: t(161.4), radius: 44, description: 'The Bull Temple: a giant Nandi carved from a single rock. Groundnut sellers outside, bells inside.' },
  { id: 'pandal', name: 'Ganesha Pandal', district: 'basavanagudi', kind: 'landmark', x: t(69), y: t(161.4), radius: 50, description: 'Marigolds, coloured lights, a dhol that never stops, and prasada for everyone.' },
  { id: 'lalbagh', name: 'Lalbagh Glass House', district: 'lalbagh', kind: 'park', x: t(108), y: t(159.6), radius: 56, description: 'The iron-and-glass hall of the botanical garden. Flower shows, morning walkers and very old trees.' },
  // BTM Layout
  { id: 'pglane', name: 'BTM PG Lane', district: 'btm', kind: 'landmark', x: t(106), y: t(106.6), radius: 56, description: 'Gents PG, Ladies PG, Comfort PG. Gates close at 10:30, the Andhra mess never does.' },
  { id: 'andhramess', name: 'Andhra Mess', district: 'btm', kind: 'food', x: t(115), y: t(106.6), radius: 30, description: 'Unlimited rice, gunpowder podi and a pickle that files a complaint against your tongue.' },
  { id: 'btmlake', name: 'BTM Lake', district: 'btm', kind: 'park', x: t(111), y: t(127.6), radius: 50, description: 'Evening walkers, PG residents on phone calls home, and ducks with strong opinions.' },
  // Devanahalli Highway (NH 44)
  { id: 'tollplaza', name: 'Devanahalli Toll Plaza', district: 'highway', kind: 'landmark', x: t(137.5), y: t(57), radius: 56, description: 'FASTag beeps, the boom lifts, and a man sells groundnuts to every car in the queue.' },
  { id: 'dhaba', name: 'Highway Dhaba', district: 'highway', kind: 'food', x: t(157), y: t(74), radius: 48, description: 'Plastic chairs, steel plates and the strongest chai between Bengaluru and the airport. Open all night for the sunrise crowd.' },
  { id: 'silkboard', name: 'Silk Board Junction', district: 'silkboard', kind: 'landmark', x: t(132), y: t(106.8), radius: 70, description: 'The most famous traffic jam in India. Signals change, seasons change, the queue does not. The metro flyover above has been "almost done" for years.' },
  { id: 'airport', name: 'Kempegowda International Airport', district: 'airport', kind: 'landmark', x: t(186), y: t(55.4), radius: 64, description: 'Departures upstairs, arrivals downstairs, and a cab queue that has its own weather. Planes take off over the vineyards.' },
  { id: 'planespot', name: 'Plane Spotting Fence', district: 'airport', kind: 'hidden', hidden: true, x: t(170), y: t(76), radius: 34, description: 'A gap in the fence at the end of the runway. Every take-off roars right over your head.', hint: 'South of the runway, at its western end' },
  // Nandi Hills
  { id: 'nandigate', name: 'Nandi Hills Gate', district: 'nandi', kind: 'landmark', x: t(149), y: t(55), radius: 44, description: 'The forest department gate. Ticket, plastic check, and a monkey watching your snacks very closely.' },
  { id: 'hairpins', name: 'Hairpin Bends', district: 'nandi', kind: 'landmark', x: t(164), y: t(47), radius: 64, description: 'The road folds back on itself again and again. Bikers lean into every bend; buses take three attempts.' },
  { id: 'hilltop', name: 'Hill Top Cafe', district: 'nandi', kind: 'food', x: t(154), y: t(33.5), radius: 40, description: 'Hot maggi, masala chai and a view of the fog. On a good day, a view of the view.' },
  { id: 'nanditemple', name: 'Yoga Nandeeshwara Temple', district: 'nandi', kind: 'landmark', x: t(167), y: t(33.5), radius: 44, description: 'An old stone temple on the summit, bells ringing into the clouds.' },
  { id: 'tipusdrop', name: "Tipu's Drop", district: 'nandi', kind: 'landmark', x: t(158), y: t(28.4), radius: 44, description: 'A sheer granite drop on the north face, railed off these days. The whole plain spreads out below.' },
  { id: 'sunrisepoint', name: 'Sunrise Point', district: 'nandi', kind: 'park', x: t(173.5), y: t(31.5), radius: 40, description: 'Everyone comes here before six with a shawl and a flask. Some days the sun, some days only fog. Both get photographed.' },
  { id: 'secretboulder', name: 'Secret Boulder View', district: 'nandi', kind: 'hidden', hidden: true, x: t(185), y: t(40), radius: 36, description: 'A flat boulder past the second hairpin with the whole valley to yourself.', hint: 'Past Hairpin 2, keep going east' },
];

export const POI_IDS = new Set(POIS.map((p) => p.id));
export const poiById = (id: string) => POIS.find((p) => p.id === id);
