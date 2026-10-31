import type { BucketItem } from '../logic/bucket';
import { DISHES } from './food';
import { POIS } from './pois';

/** One-off moments the game remembers for the bucket list (see WorldScene.mark). */
export const MARKS = ['yulu', 'car', 'auto', 'ksrtc', 'crows', 'talk', 'rain', 'powercut', 'ipl', 'cheer', 'sparkler', 'kite', 'kasa', 'settings'] as const;
export type Mark = (typeof MARKS)[number];

const HIDDEN = POIS.filter((p) => p.hidden).map((p) => p.id);
const METRO = POIS.filter((p) => p.kind === 'metro').map((p) => p.id);
const has = (ids: readonly string[], want: readonly string[]) => want.every((id) => ids.includes(id));
// Google, Amazon, EY, Microsoft. The ids are older save keys; renaming them would drop saved discoveries.
const TECH_PARK = ['goggle', 'amazoom', 'ewhy', 'microsloth'];
const KORAMANGALA = ['flipkart', 'swiggy', 'razorpay', 'cred', 'infosys', 'wipro', 'accenture', 'ibm'];
const DARSHANA = ['vidhana', 'kerepark', 'lalbagh', 'bulltemple', 'pandal'];

/**
 * The Bengaluru Bucket List: everything there is to try, with a hint for each. It turns the game's
 * small, easy-to-miss features into things to tick off.
 */
export const BUCKET: BucketItem[] = [
  // Start here
  { id: 'settings', group: 'Start here', title: 'Open the settings', hint: 'Pause (Esc, or II on phones): switch word meanings, route dots, markers, music, voices and more on or off.', done: (p) => p.marks.includes('settings') },
  // Getting around
  { id: 'yulu', group: 'Get around', title: 'Ride a Yulu e-bike', hint: 'Blue bikes are parked in every area. Walk up and press E.', done: (p) => p.marks.includes('yulu'), show: { guide: 'yulu' } },
  { id: 'car', group: 'Get around', title: "Find your cousin's car and drive it", hint: 'Parked on 12th Main, Indiranagar. Walk up and press E. Full tank illa.', done: (p) => p.marks.includes('car'), show: { guide: 'car' } },
  { id: 'auto', group: 'Get around', title: 'Drive an auto rickshaw', hint: 'Autos wearing a yellow ! can be borrowed. Walk up and pick Just drive.', done: (p) => p.marks.includes('auto'), show: { guide: 'auto' } },
  { id: 'metro', group: 'Get around', title: 'Ride Namma Metro', hint: 'Press E at a metro entrance and pick a station.', done: (p) => p.stats.metroRides >= 1, show: { guide: 'metro' } },
  { id: 'bus', group: 'Get around', title: 'Catch a BMTC bus', hint: 'Stand at a bus stop, press E and choose where to go.', done: (p) => p.stats.busRides >= 1, show: { guide: 'bus' } },
  { id: 'rapido', group: 'Get around', title: 'Book a Rapido', hint: 'Tap Rapido (or press R) and pick a place. The first captain may cancel.', done: (p) => p.stats.rides >= 1 },
  { id: 'ksrtc', group: 'Get around', title: 'Take the KSRTC to Nandi Hills', hint: 'From any bus stop, pick "Nandi Hills Gate".', done: (p) => p.marks.includes('ksrtc'), show: { guide: 'bus' } },
  // Work and earn
  { id: 'fare', group: 'Work and earn', title: 'Earn an auto fare', hint: 'Borrow an auto, choose Earn fares, pick up someone who waves.', done: (p) => p.stats.fares >= 1, show: { job: 'fares' } },
  { id: 'delivery', group: 'Work and earn', title: 'Take a food delivery job', hint: 'Ask a delivery rider (the yellow ! ) for an order and beat the timer.', done: (p) => p.stats.deliveries >= 1, show: { job: 'delivery' } },
  { id: 'quiz', group: 'Work and earn', title: 'Take a tech job interview', hint: 'The recruiter at the walk-in drive, Bagmane Tech Park, asks a quick question.', done: (p) => p.stats.quiz >= 1, show: { job: 'quiz' } },
  // Animals
  { id: 'dog', group: 'Animals', title: 'Pet a street dog and make a friend', hint: 'Walk up to a dog and press E to share a biscuit. It follows you around.', done: (p) => p.stats.dogsFed >= 1, show: { animal: 'dog' } },
  { id: 'crows', group: 'Animals', title: 'Make the birds fly away', hint: 'Crows sit in threes by the maidan, lakes and parks. Walk right up and they scatter.', done: (p) => p.marks.includes('crows'), show: { animal: 'crows' } },
  { id: 'cow', group: 'Animals', title: 'Say hello to Gowri the cow', hint: 'She rests in the middle of Marathahalli Junction. Press E.', done: (p) => p.stats.cow >= 1, show: { poi: 'mjunction' } },
  { id: 'monkey', group: 'Animals', title: 'Lose a snack to a monkey', hint: 'Buy masala corn on the Nandi Hills summit, then walk past a monkey.', done: (p) => p.stats.monkeyTax >= 1, show: { animal: 'monkey' } },
  // Eat
  { id: 'chai', group: 'Eat', title: 'Drink a cutting chai', hint: "Manju's tea cart on 100 Feet Road, or any chai stall.", done: (p) => p.stats.chai >= 1, show: { poi: 'teapoint' } },
  { id: 'dose', group: 'Eat', title: 'Eat a masala dose', hint: 'Rameshwaram Cafe, Thippasandra. Join the queue.', done: (p) => p.tasted.includes('masala_dose'), show: { poi: 'darshini' } },
  { id: 'kaapi', group: 'Eat', title: 'Filter kaapi at Hatti Kaapi', hint: 'Steel tumbler, 100 Feet Road.', done: (p) => p.tasted.includes('filter_coffee'), show: { poi: 'kaapi' } },
  { id: 'maggi', group: 'Eat', title: 'Maggi on top of a hill', hint: 'Hill Top Cafe, Nandi Hills summit.', done: (p) => p.tasted.includes('hill_maggi'), show: { poi: 'hilltop' } },
  { id: 'food5', group: 'Eat', title: 'Try five different dishes', hint: 'Order at food counters all over the city.', done: (p) => p.tasted.length >= 5 },
  // See the city
  { id: 'ulsoor', group: 'See the city', title: 'Walk around Ulsoor Lake', hint: 'Swan pedal boats and morning walkers.', done: (p) => p.discovered.includes('kerepark'), show: { poi: 'kerepark' } },
  { id: 'cubbon', group: 'See the city', title: 'Visit Cubbon Park', hint: 'Lawns, bamboo and the old library, by MG Road.', done: (p) => p.discovered.includes('cubbon'), show: { poi: 'cubbon' } },
  { id: 'vidhana', group: 'See the city', title: 'See Vidhana Soudha', hint: 'The granite legislature, flags flying out front.', done: (p) => p.discovered.includes('vidhana'), show: { poi: 'vidhana' } },
  { id: 'stadium', group: 'See the city', title: 'Visit Chinnaswamy Stadium', hint: 'Ee sala cup namde!', done: (p) => p.discovered.includes('stadium'), show: { poi: 'stadium' } },
  { id: 'silkboard', group: 'See the city', title: 'Survive Silk Board', hint: 'Drive through the junction just outside the city. Bring patience.', done: (p) => p.stats.silkboard >= 1, show: { poi: 'silkboard' } },
  { id: 'ubcity', group: 'See the city', title: 'Window-shop at UB City', hint: 'Across CMH Road from Chinnaswamy Stadium. Look up at the mansion on Kingfisher Towers.', done: (p) => p.discovered.includes('ubcity'), show: { poi: 'ubcity' } },
  { id: 'social', group: 'See the city', title: 'Visit SOCIAL', hint: 'The cafe-bar on 80 Feet Road, Koramangala.', done: (p) => p.discovered.includes('social'), show: { poi: 'social' } },
  { id: 'flipkart', group: 'See the city', title: 'Visit the Flipkart office', hint: 'On 80 Feet Road, Koramangala, with the other startups.', done: (p) => p.discovered.includes('flipkart'), show: { poi: 'flipkart' } },
  { id: 'airport', group: 'See the city', title: 'Reach the airport', hint: 'Drive out on NH 44, or take the Vayu Vajra bus.', done: (p) => p.discovered.includes('airport'), show: { poi: 'airport' } },
  { id: 'secret', group: 'See the city', title: 'Find a secret spot', hint: 'Locals drop tips when you chat with them.', done: (p) => p.discovered.some((id) => HIDDEN.includes(id)) },
  // Nandi Hills
  { id: 'nandi', group: 'Nandi Hills', title: 'Visit Nandi Hills', hint: 'Out on NH 44 and up the hairpin road, or the KSRTC bus from any stop.', done: (p) => p.discovered.includes('tipusdrop') || p.discovered.includes('sunrisepoint'), show: { poi: 'nandigate' } },
  { id: 'sunrise', group: 'Nandi Hills', title: 'Watch the sunrise', hint: 'At Sunrise Point before 7 AM, or press E there to wait for it.', done: (p) => p.stats.sunrises >= 1, show: { poi: 'sunrisepoint' } },
  // Only in Bengaluru
  { id: 'talk', group: 'Only in Bengaluru', title: 'Talk to anyone', hint: 'Walk up to anyone and press E. Most people have something to say.', done: (p) => p.marks.includes('talk') },
  { id: 'cricket', group: 'Only in Bengaluru', title: 'Throw the cricket ball back', hint: 'Gully cricket at the Thippasandra maidan. Press E when the ball rolls out.', done: (p) => p.stats.throws >= 1, show: { poi: 'maidan' } },
  { id: 'kasa', group: 'Only in Bengaluru', title: 'Spot the kasa gaadi', hint: 'The BBMP garbage van drives through now and then, its jingle blaring.', done: (p) => p.marks.includes('kasa') },
  { id: 'rain', group: 'Only in Bengaluru', title: 'Get caught in the rain', hint: 'It comes when it comes, any day. Keep wandering and listen for the thunder.', done: (p) => p.marks.includes('rain') },
  { id: 'powercut', group: 'Only in Bengaluru', title: 'Live through a power cut', hint: 'They happen now and then, mostly at night.', done: (p) => p.marks.includes('powercut') },
  { id: 'ipl', group: 'Only in Bengaluru', title: 'Feel an IPL night', hint: 'Be near Chinnaswamy Stadium on a match evening.', done: (p) => p.marks.includes('ipl'), show: { poi: 'stadium' } },
  // Festivals (each on its own day; the area card's chip says what's on)
  { id: 'f_ugadi', group: 'Festivals', title: 'Taste bevu-bella on Ugadi', hint: 'On Ugadi, Saroja Ajji in Indiranagar hands it out.', done: (p) => p.tasted.includes('bevu_bella'), show: { npc: 'ajji_in' } },
  { id: 'f_ganesha', group: 'Festivals', title: 'Eat kadubu on Ganesha Chaturthi', hint: 'At the Ganesha pandal in Basavanagudi, on the festival day.', done: (p) => p.tasted.includes('kadubu'), show: { npc: 'pd_host' } },
  { id: 'f_rajyotsava', group: 'Festivals', title: 'Shout "Siri gannadam gelge!" on Rajyotsava', hint: 'With the crowd at Vidhana Soudha on Kannada Rajyotsava.', done: (p) => p.marks.includes('cheer'), show: { npc: 'vs_guard' } },
  { id: 'f_deepavali', group: 'Festivals', title: 'Light a sparkler on Deepavali', hint: 'Pinky in Indiranagar has a box of them on Deepavali.', done: (p) => p.marks.includes('sparkler'), show: { npc: 'kid_in' } },
  { id: 'f_sankranti', group: 'Festivals', title: 'Fly a kite on Sankranti', hint: 'Subbaiah uncle in Cubbon Park has kites on Sankranti.', done: (p) => p.marks.includes('kite'), show: { npc: 'cub_uncle' } },
  { id: 'festival', group: 'Only in Bengaluru', title: 'Celebrate a festival', hint: "Festivals come round every few days. Check the area card's chip.", done: (p) => p.stats.festivals >= 1 },
  { id: 'caught', group: 'Only in Bengaluru', title: 'Get caught by the traffic police', hint: 'Speed, jump a red, or ride a rental scooter past a constable.', done: (p) => p.stats.challans >= 1 },
  { id: 'challan', group: 'Only in Bengaluru', title: 'Talk your way out of a challan', hint: 'Speed past a traffic cop, then "Swalpa adjust maadi, sir…"', done: (p) => p.stats.letOff >= 1 },
  { id: 'honk', group: 'Only in Bengaluru', title: 'Honk 20 times', hint: 'Drive anything and press H (or Horn).', done: (p) => p.stats.honks >= 20 },
  { id: 'postcard', group: 'Only in Bengaluru', title: 'Send a postcard', hint: 'Press P (or Photo), frame a shot, take a postcard.', done: (p) => p.stats.postcards >= 1 },
  // Bengaluru Legend: the long game
  { id: 'l_chai', group: 'Bengaluru Legend', title: 'Drink 10 chais', hint: 'Any chai stall or cart counts. Cutting chai is a lifestyle.', done: (p) => p.stats.chai >= 10 },
  { id: 'l_metro', group: 'Bengaluru Legend', title: 'Visit every metro station', hint: 'Indiranagar, Halasuru and KR Puram on the purple line.', done: (p) => has(p.discovered, METRO), show: { guide: 'metro' } },
  { id: 'l_fares', group: 'Bengaluru Legend', title: 'Drop off 5 auto passengers', hint: 'Borrow an auto and choose Earn fares.', done: (p) => p.stats.fares >= 5, show: { job: 'fares' } },
  { id: 'l_delivery', group: 'Bengaluru Legend', title: 'Make 3 food deliveries on time', hint: 'Delivery riders with a yellow ! have orders.', done: (p) => p.stats.deliveries >= 3, show: { job: 'delivery' } },
  { id: 'l_quiz', group: 'Bengaluru Legend', title: 'Answer 5 tech questions', hint: 'The recruiter at the walk-in drive keeps asking.', done: (p) => p.stats.quiz >= 5, show: { job: 'quiz' } },
  { id: 'l_techpark', group: 'Bengaluru Legend', title: 'Find every company in the tech park', hint: 'Google, Amazon, EY and Microsoft at Bagmane Tech Park.', done: (p) => has(p.discovered, TECH_PARK), show: { poi: 'techpark' } },
  { id: 'l_startups', group: 'Bengaluru Legend', title: 'Find every company in Koramangala', hint: 'Flipkart, Swiggy, Razorpay, CRED and the offices behind them.', done: (p) => has(p.discovered, KORAMANGALA), show: { poi: 'flipkart' } },
  { id: 'l_pg', group: 'Bengaluru Legend', title: 'Live the PG life', hint: 'Visit BTM PG Lane and the Andhra Mess.', done: (p) => has(p.discovered, ['pglane', 'andhramess']), show: { poi: 'pglane' } },
  { id: 'l_darshana', group: 'Bengaluru Legend', title: 'Bengaluru Darshana', hint: 'Vidhana Soudha, Ulsoor Lake, Lalbagh, the Bull Temple and the Ganesha pandal.', done: (p) => has(p.discovered, DARSHANA) },
  { id: 'l_festivals', group: 'Bengaluru Legend', title: 'Celebrate three festival days', hint: 'Festivals come round every few game days.', done: (p) => p.stats.festivals >= 3 },
  { id: 'l_food', group: 'Bengaluru Legend', title: 'Fill the whole food book', hint: 'Every dish, from benne dose to festival sweets. See the Food book tab.', done: (p) => has(p.tasted, DISHES.map((d) => d.id)) },
  { id: 'l_secrets', group: 'Bengaluru Legend', title: 'Find every secret spot', hint: 'Locals drop tips. See the Places tab for how many are left.', done: (p) => has(p.discovered, HIDDEN) },
  { id: 'l_half', group: 'Bengaluru Legend', title: 'Discover half the places', hint: 'Just wander. Every place you pass counts.', done: (p) => p.discovered.length >= Math.ceil(POIS.length / 2) },
  { id: 'l_all', group: 'Bengaluru Legend', title: 'Discover every place: Namma Ooru Expert', hint: 'The Places tab shows what you have found.', done: (p) => p.discovered.length >= POIS.length },
];
