/**
 * Bengaluru's festival calendar, squeezed into a two-week game "year" so you meet a few in a
 * session. Each festival dresses the main roads in its colours, gives people things to say, and
 * may change the night (Deepavali) or the weather (monsoon).
 */
export interface Festival {
  id: string;
  name: string;
  /** Toast on the morning it starts. */
  greeting: string;
  /** Bunting colours strung across the main roads (none for monsoon). */
  colours: number[];
  /** Line pool people use now and then (src/data/dialogue.ts). */
  pool: string;
  /** Diyas on every building and crackers after dark. */
  lights?: boolean;
  /** Extra groundnut stalls around Bull Temple. */
  fair?: boolean;
  /** Rain rolls in through the day. */
  rainy?: boolean;
}

export const FESTIVALS: Festival[] = [
  { id: 'ugadi', name: 'Ugadi', greeting: 'Happy Ugadi! Mango-leaf torans on every door, bevu-bella for everyone: bitter and sweet, like the year ahead.', colours: [0x2f9e44, 0x94d82d, 0xfab005], pool: 'fest_ugadi' },
  { id: 'karaga', name: 'Bengaluru Karaga', greeting: "Karaga night! The city's own festival: jasmine everywhere and a procession through the old town after dark.", colours: [0xf8f9fa, 0xffe066, 0xe64980], pool: 'fest_karaga' },
  { id: 'monsoon', name: 'Monsoon', greeting: 'Monsoon has arrived. Carry an umbrella, expect underpasses to become lakes, and enjoy the smell of rain.', colours: [], pool: 'fest_monsoon', rainy: true },
  { id: 'ganesha', name: 'Ganesha Chaturthi', greeting: 'Ganapati Bappa Morya! Pandals in every street, dhol on every corner and kadubu for everyone.', colours: [0xff922b, 0xe64980, 0xfcc419], pool: 'fest_ganesha' },
  { id: 'rajyotsava', name: 'Kannada Rajyotsava', greeting: 'Happy Kannada Rajyotsava! Red and yellow flags on every street. Siri gannadam gelge!', colours: [0xe03131, 0xfcc419], pool: 'fest_rajyotsava' },
  { id: 'deepavali', name: 'Deepavali', greeting: 'Happy Deepavali! Diyas on every balcony and crackers all night. Mind the rockets.', colours: [0xffa94d, 0xffd43b, 0xf03e3e], pool: 'fest_deepavali', lights: true },
  { id: 'kadlekai', name: 'Kadlekai Parishe', greeting: 'Kadlekai Parishe! The groundnut fair at Bull Temple: heaps of fresh groundnuts, balloons and crowds.', colours: [0xb08968, 0xfab005, 0x51cf66], pool: 'fest_kadlekai', fair: true },
  { id: 'sankranti', name: 'Sankranti', greeting: 'Happy Sankranti! Ellu-bella, sugarcane and rangoli. "Ellu bella thindu olle maathaadi."', colours: [0xfcc419, 0x40c057, 0xff6b6b], pool: 'fest_sankranti' },
];

/** Which day of the two-week cycle each festival falls on; the days between are ordinary. */
const CALENDAR: Array<string | null> = ['ugadi', null, 'karaga', null, 'monsoon', 'monsoon', 'ganesha', null, 'rajyotsava', null, 'deepavali', 'kadlekai', null, 'sankranti'];

/** The festival on game day `day` (0 = the day you arrived), if any. */
export function festivalOn(day: number): Festival | null {
  const id = CALENDAR[((day % CALENDAR.length) + CALENDAR.length) % CALENDAR.length];
  return id ? (FESTIVALS.find((f) => f.id === id) ?? null) : null;
}

