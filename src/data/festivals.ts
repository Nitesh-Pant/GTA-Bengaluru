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
  /** Decorations put up around town for the day (see FestivalSystem). */
  decor?: Array<'torans' | 'rangoli' | 'lanterns' | 'flags' | 'idols' | 'sugarcane' | 'kites'>;
  /** A local who hosts the festival: a marker over them, and this conversation instead of their usual one. */
  host?: { npc: string; conversation: string; todo: string };
}

export const FESTIVALS: Festival[] = [
  { id: 'ugadi', name: 'Ugadi', greeting: 'Happy Ugadi! Mango-leaf torans on every door, bevu-bella for everyone: bitter and sweet, like the year ahead.', colours: [0x2f9e44, 0x94d82d, 0xfab005], pool: 'fest_ugadi', decor: ['torans', 'rangoli'], host: { npc: 'ajji_in', conversation: 'fest_ugadi', todo: 'Saroja Ajji in Indiranagar is handing out bevu-bella.' } },
  { id: 'karaga', name: 'Bengaluru Karaga', greeting: "Karaga night! The city's own festival: jasmine everywhere and a procession through the old town after dark.", colours: [0xf8f9fa, 0xffe066, 0xe64980], pool: 'fest_karaga' },
  { id: 'monsoon', name: 'Monsoon', greeting: 'Monsoon has arrived. Carry an umbrella, expect underpasses to become lakes, and enjoy the smell of rain.', colours: [], pool: 'fest_monsoon', rainy: true },
  { id: 'ganesha', name: 'Ganesha Chaturthi', greeting: 'Ganapati Bappa Morya! Pandals in every street, dhol on every corner and kadubu for everyone.', colours: [0xff922b, 0xe64980, 0xfcc419], pool: 'fest_ganesha', decor: ['idols'], host: { npc: 'pd_host', conversation: 'fest_ganesha', todo: 'Kadubu at the Ganesha pandal in Basavanagudi, from Ganesh the organiser.' } },
  { id: 'rajyotsava', name: 'Kannada Rajyotsava', greeting: 'Happy Kannada Rajyotsava! Red and yellow flags on every street. Siri gannadam gelge!', colours: [0xe03131, 0xfcc419], pool: 'fest_rajyotsava', decor: ['flags'], host: { npc: 'vs_guard', conversation: 'fest_rajyotsava', todo: 'Join the crowd at Vidhana Soudha: Nagesh leads the cheer.' } },
  { id: 'deepavali', name: 'Deepavali', greeting: 'Happy Deepavali! Diyas on every balcony and crackers all night. Mind the rockets.', colours: [0xffa94d, 0xffd43b, 0xf03e3e], pool: 'fest_deepavali', lights: true, decor: ['lanterns'], host: { npc: 'kid_in', conversation: 'fest_deepavali', todo: 'Pinky in Indiranagar has sparklers and kaju katli.' } },
  { id: 'kadlekai', name: 'Kadlekai Parishe', greeting: 'Kadlekai Parishe! The groundnut fair at Bull Temple: heaps of fresh groundnuts, balloons and crowds.', colours: [0xb08968, 0xfab005, 0x51cf66], pool: 'fest_kadlekai', fair: true },
  { id: 'sankranti', name: 'Sankranti', greeting: 'Happy Sankranti! Ellu-bella, sugarcane and rangoli. "Ellu bella thindu olle maathaadi."', colours: [0xfcc419, 0x40c057, 0xff6b6b], pool: 'fest_sankranti', decor: ['sugarcane', 'rangoli', 'kites'], host: { npc: 'cub_uncle', conversation: 'fest_sankranti', todo: 'Subbaiah uncle in Cubbon Park has ellu-bella and a kite for you.' } },
];

/** Which day of the two-week cycle each festival falls on; the days between are ordinary. */
const CALENDAR: Array<string | null> = ['ugadi', null, 'karaga', null, 'monsoon', 'monsoon', 'ganesha', null, 'rajyotsava', null, 'deepavali', 'kadlekai', null, 'sankranti'];

/**
 * For trying a festival out: `?festival=deepavali` in the page address makes every day that festival.
 * Returns undefined when the address doesn't ask for one.
 */
export function festivalFromUrl(search: string): Festival | undefined {
  const id = new URLSearchParams(search).get('festival');
  return id ? FESTIVALS.find((f) => f.id === id) : undefined;
}

/** The festival on game day `day` (0 = the day you arrived), if any. */
export function festivalOn(day: number): Festival | null {
  const id = CALENDAR[((day % CALENDAR.length) + CALENDAR.length) % CALENDAR.length];
  return id ? (FESTIVALS.find((f) => f.id === id) ?? null) : null;
}

