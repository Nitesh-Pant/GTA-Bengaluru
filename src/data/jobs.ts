/** Jobs the city offers. Givers wear a bouncing "!" and pitch the job when you come close. */
export type JobKind = 'delivery' | 'fares' | 'quiz';

export const JOB_INFO: Record<JobKind, { name: string; pitch: string; cta: string; find: string }> = {
  delivery: {
    name: 'Food delivery',
    pitch: 'Pick up an order at a restaurant and drop it before the timer runs out. Any way of travelling counts.',
    cta: 'Take an order',
    find: 'deliver food before the timer',
  },
  fares: {
    name: 'Auto fares',
    pitch: 'Borrow the auto. Earn fares (people wave you down: pick them up, drop them at the marker, collect the meter), or just drive around.',
    cta: 'Earn fares',
    find: 'pick up passengers, earn the meter',
  },
  quiz: {
    name: 'Tech quiz',
    pitch: "Walk-in drive at the tech park! Answer quick tech questions at the recruiter's table.",
    cta: 'Take the quiz',
    find: 'walk-in drive questions',
  },
};

/** People who hand out jobs. Every borrowable auto offers fares on its own. */
export const JOB_GIVERS: Array<{ npc: string; kind: JobKind }> = [
  { npc: 'imran', kind: 'delivery' },
  { npc: 'swiggy_rider', kind: 'delivery' },
  { npc: 'deliv_mh', kind: 'delivery' },
  { npc: 'btm_rider', kind: 'delivery' },
  { npc: 'recruiter', kind: 'quiz' },
];
