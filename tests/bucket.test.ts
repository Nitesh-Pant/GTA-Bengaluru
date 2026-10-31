import { describe, expect, it } from 'vitest';
import { BUCKET, MARKS } from '../src/data/bucket';
import { POI_IDS } from '../src/data/pois';
import { bucketDone, newlyDone, type BucketProgress } from '../src/logic/bucket';
import { defaultStats } from '../src/logic/save';

const fresh = (): BucketProgress => ({ stats: defaultStats(), discovered: [], tasted: [], marks: [] });

describe('bucket list', () => {
  it('has unique ids, a hint for everything, and real places to show', () => {
    expect(new Set(BUCKET.map((b) => b.id)).size).toBe(BUCKET.length);
    for (const b of BUCKET) {
      expect(b.hint.length, b.id).toBeGreaterThan(5);
      if (b.show && 'poi' in b.show) expect(POI_IDS.has(b.show.poi), b.id).toBe(true);
    }
  });
  it('starts empty and ticks things off as you play', () => {
    expect(bucketDone(BUCKET, fresh())).toEqual([]);
    const p = fresh();
    p.stats.metroRides = 1;
    p.marks = ['yulu', 'crows'];
    p.discovered = ['airport'];
    expect(bucketDone(BUCKET, p)).toEqual(expect.arrayContaining(['metro', 'yulu', 'crows', 'airport']));
    expect(newlyDone(BUCKET, p, ['metro', 'yulu']).map((b) => b.id)).toEqual(['crows', 'airport']);
  });
  it('every recorded moment belongs to some item', () => {
    for (const m of MARKS) {
      const p = fresh();
      p.marks = [m];
      expect(bucketDone(BUCKET, p).length, m).toBeGreaterThan(0);
    }
  });
});
