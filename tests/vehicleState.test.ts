import { describe, expect, it } from 'vitest';
import { canEnter, enterVehicle, exitVehicle, type RideableInfo } from '../src/logic/vehicleState';

const v: RideableInfo = { id: 'car', occupied: false, x: 100, y: 100, heading: 0, speed: 0, halfLen: 14, halfWidth: 7 };

describe('entering and exiting vehicles', () => {
  it('can only enter when walking and close by', () => {
    expect(canEnter({ kind: 'walk' }, v, 110, 110)).toBe(true);
    expect(canEnter({ kind: 'walk' }, v, 200, 200)).toBe(false);
    expect(canEnter({ kind: 'drive', vehicleId: 'other' }, v, 110, 110)).toBe(false);
    expect(canEnter({ kind: 'walk' }, { ...v, occupied: true }, 110, 110)).toBe(false);
  });
  it('switches to driving that exact vehicle', () => {
    expect(enterVehicle({ kind: 'walk' }, v, 110, 100)).toEqual({ kind: 'drive', vehicleId: 'car' });
  });
  it('refuses to exit while moving', () => {
    const r = exitVehicle({ kind: 'drive', vehicleId: 'car' }, { ...v, speed: 120 }, () => true);
    expect(r).toEqual({ ok: false, reason: 'moving' });
  });
  it('exits beside the vehicle, trying the other side if one is blocked', () => {
    const r = exitVehicle({ kind: 'drive', vehicleId: 'car' }, v, (_x, y) => y > 100);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.mode).toEqual({ kind: 'walk' });
      expect(r.y).toBeGreaterThan(100);
      expect(Math.hypot(r.x - v.x, r.y - v.y)).toBeLessThan(40);
    }
  });
  it('reports blocked when there is no room at all', () => {
    expect(exitVehicle({ kind: 'drive', vehicleId: 'car' }, v, () => false)).toEqual({ ok: false, reason: 'blocked' });
  });
  it('rejects exiting a vehicle you are not in', () => {
    expect(exitVehicle({ kind: 'walk' }, v, () => true)).toEqual({ ok: false, reason: 'not-driving' });
  });
});
