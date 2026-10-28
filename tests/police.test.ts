import { describe, expect, it } from 'vitest';
import { challanOutcome, FINES } from '../src/logic/police';

const always = (v: number) => () => v;

describe('challans', () => {
  it('paying costs exactly the fine', () => {
    expect(challanOutcome('pay', FINES.helmet, 3, always(0))).toEqual({ letOff: false, fine: 500 });
  });
  it('"swalpa adjust maadi" either works or costs extra', () => {
    expect(challanOutcome('adjust', 500, 0, always(0.1))).toEqual({ letOff: true, fine: 0 });
    expect(challanOutcome('adjust', 500, 0, always(0.9))).toEqual({ letOff: false, fine: 700 });
  });
  it('"new to Bengaluru" works the first time, rarely after', () => {
    expect(challanOutcome('plead', 1000, 0, always(0.99)).letOff).toBe(true);
    expect(challanOutcome('plead', 1000, 2, always(0.9))).toEqual({ letOff: false, fine: 1000 });
    expect(challanOutcome('plead', 1000, 2, always(0.1)).letOff).toBe(true);
  });
});
