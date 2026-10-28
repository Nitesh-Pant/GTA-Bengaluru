import type { AchievementDef } from '../logic/achievements';
import { DISHES } from './food';
import { POIS } from './pois';

const has = (ids: readonly string[], want: readonly string[]) => want.every((id) => ids.includes(id));
const HIDDEN = POIS.filter((p) => p.hidden).map((p) => p.id);
const METRO = POIS.filter((p) => p.kind === 'metro').map((p) => p.id);
// Google, Amazon, EY, Microsoft. The ids are older save keys; renaming them would drop saved discoveries.
const COMPANIES = ['goggle', 'amazoom', 'ewhy', 'microsloth'];
const KORAMANGALA = ['flipkart', 'swiggy', 'razorpay', 'cred', 'infosys', 'wipro', 'accenture', 'ibm'];

/** Local-flavour achievements. All optional, all unlock while just wandering. */
export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_chai', title: 'Ondu Chai', description: 'Drink your first chai.', done: (p) => p.stats.chai >= 1 },
  { id: 'chai_10', title: 'Cutting Chai Connoisseur', description: 'Drink 10 chais.', done: (p) => p.stats.chai >= 10 },
  { id: 'dosa_5', title: 'Dose Devotee', description: 'Eat 5 dosas.', done: (p) => p.stats.dosa >= 5 },
  { id: 'taste_5', title: 'Thindi Pothi', description: 'Stamp 5 dishes in the food book.', done: (p) => p.tasted.length >= 5 },
  { id: 'taste_all', title: 'Full Meals', description: 'Stamp every dish in the food book.', done: (p) => has(p.tasted, DISHES.map((d) => d.id)) },
  { id: 'metro_1', title: 'Namma Metro', description: 'Take your first metro ride.', done: (p) => p.stats.metroRides >= 1 },
  { id: 'metro_10', title: 'Purple Line Regular', description: 'Take 10 metro rides.', done: (p) => p.stats.metroRides >= 10 },
  { id: 'stations', title: 'Station Hopper', description: 'Visit every metro station.', done: (p) => has(p.discovered, METRO) },
  { id: 'drive_1', title: 'Swalpa Adjust Driving', description: 'Drive one of the borrowed vehicles.', done: (p) => p.stats.drives >= 1 },
  { id: 'honk_50', title: 'Horn OK Please', description: 'Honk 50 times. Bengaluru approves.', done: (p) => p.stats.honks >= 50 },
  { id: 'cow', title: 'Right of Way', description: 'Say hello to Gowri the cow.', done: (p) => p.stats.cow >= 1 },
  { id: 'cricket', title: 'Sakkath Fielding', description: 'Throw the cricket ball back to the kids.', done: (p) => p.stats.throws >= 1 },
  { id: 'nandi_top', title: 'Above the Clouds', description: 'Reach the top of Nandi Hills.', done: (p) => p.discovered.includes('sunrisepoint') || p.discovered.includes('tipusdrop') },
  { id: 'nandi_sunrise', title: 'Sunrise Chaser', description: 'Watch the sunrise from Nandi Hills.', done: (p) => p.stats.sunrises >= 1 },
  { id: 'dog_friend', title: 'Biscuit Friend', description: 'Give a street dog a biscuit.', done: (p) => p.stats.dogsFed >= 1 },
  { id: 'fare_1', title: 'Meter Haaki', description: 'Drop off your first auto passenger.', done: (p) => p.stats.fares >= 1 },
  { id: 'fare_5', title: 'Auto Anna', description: 'Drop off 5 auto passengers.', done: (p) => p.stats.fares >= 5 },
  { id: 'bus_1', title: 'BMTC Pass', description: 'Ride a BMTC bus.', done: (p) => p.stats.busRides >= 1 },
  { id: 'rapido', title: 'OTP Heli, Saar', description: 'Take a Rapido bike taxi.', done: (p) => p.stats.rides >= 1 },
  { id: 'delivery_3', title: 'Five Star Partner', description: 'Complete 3 food deliveries on time.', done: (p) => p.stats.deliveries >= 3 },
  { id: 'quiz_1', title: 'Shortlisted', description: 'Answer a tech question correctly.', done: (p) => p.stats.quiz >= 1 },
  { id: 'quiz_5', title: 'Walk-in Selected', description: 'Answer 5 tech questions correctly.', done: (p) => p.stats.quiz >= 5 },
  { id: 'cup_namde', title: 'Ee Sala Cup Namde', description: 'Visit Chinnaswamy Stadium.', done: (p) => p.discovered.includes('stadium') },
  { id: 'startups', title: 'Startup Safari', description: 'Find every company in Koramangala.', done: (p) => has(p.discovered, KORAMANGALA) },
  { id: 'pg_life', title: 'PG Life', description: 'Visit BTM PG Lane and the Andhra Mess.', done: (p) => has(p.discovered, ['pglane', 'andhramess']) },
  { id: 'darshana', title: 'Bengaluru Darshana', description: 'Visit Vidhana Soudha, Ulsoor Lake, Lalbagh, the Bull Temple and the Ganesha pandal.', done: (p) => has(p.discovered, ['vidhana', 'kerepark', 'lalbagh', 'bulltemple', 'pandal']) },
  { id: 'campus', title: 'Campus Tourist', description: 'Find every company in the tech park.', done: (p) => has(p.discovered, COMPANIES) },
  { id: 'local', title: 'Swalpa Local', description: 'Discover half the places in the city.', done: (p) => p.discovered.length >= Math.ceil(POIS.length / 2) },
  { id: 'insider', title: 'Psst… Insider', description: 'Find every hidden spot.', done: (p) => has(p.discovered, HIDDEN) },
  { id: 'all_places', title: 'Namma Ooru Expert', description: 'Discover every place in the city.', done: (p) => p.discovered.length >= POIS.length },
];

export const ACHIEVEMENT_IDS = new Set(ACHIEVEMENTS.map((a) => a.id));
