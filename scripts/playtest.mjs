// End-to-end playtest in real Chrome. Drives keyboard input and inspects scene state.
import { chromium } from 'playwright-core';

const URL = process.env.URL ?? 'http://localhost:5199/';
const OUT = 'test-artifacts';
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => { errors.push(`pageerror: ${e.message}`); if (errors.length < 3) console.log('  PAGEERROR', e.stack); });

const world = (fn, arg) => page.evaluate(([src, a]) => {
  const s = window.__game.scene.getScene('world');
  return new Function('s', 'a', `return (${src})(s, a)`)(s, a);
}, [fn.toString(), arg]);
const state = () => world((s) => ({ x: s.player.x, y: s.player.y, mode: s.mode.kind, visible: s.player.visible, clock: s.clock }));
const teleport = (x, y) => world((s, p) => { s.player.body.reset(p.x, p.y); s.player.setPosition(p.x, p.y); s.cameras.main.centerOn(p.x, p.y); }, { x, y });
const hold = async (keys, ms) => { for (const k of keys) await page.keyboard.down(k); await page.waitForTimeout(ms); for (const k of keys) await page.keyboard.up(k); };
const ui = () => page.evaluate(() => ({
  dialogue: !!document.querySelector('.dialogue'),
  metro: !!document.querySelector('.metro'),
  pause: !!document.querySelector('.pause'),
  map: !!document.querySelector('.map-panel'),
  bubbles: [...document.querySelectorAll('.bubble')].map((b) => b.className + ': ' + b.textContent),
}));

await page.goto(URL);
await page.evaluate(() => localStorage.clear() || localStorage.setItem('bsam.tourSeen', '1'));
await page.reload();
await page.getByRole('button', { name: /Start exploring/ }).click();
// Character setup: female, name, saree
await page.getByLabel('Your name').fill('Asha');
await page.getByRole('button', { name: 'Female' }).click();
await page.getByRole('button', { name: 'Saree' }).click();
await page.getByRole('button', { name: "Let's go!" }).click();
await page.waitForFunction(() => window.__game?.scene?.getScene('world')?.player, null, { timeout: 15000 });
await page.waitForTimeout(800);
const profile = await world((s) => s.profile);
check('character setup applied', profile.name === 'Asha' && profile.gender === 'f' && profile.outfit === 1, JSON.stringify(profile));
check('welcome uses the name', (await page.locator('.toast').allTextContents()).some((t) => t.includes('Asha')));
check('single game canvas', (await page.locator('.game-canvas canvas').count()) === 1);

// Walking
await teleport(16 * 26, 16 * 17.2);
let a = await state();
await hold(['ArrowRight'], 1000);
let b = await state();
const straight = b.x - a.x;
check('walks right', straight > 50, `moved ${straight.toFixed(1)}px in 1s`);
a = await state();
await hold(['ArrowLeft', 'ArrowDown'], 1000);
b = await state();
const diag = Math.hypot(b.x - a.x, b.y - a.y);
check('diagonal not faster', diag <= straight * 1.08, `diag ${diag.toFixed(1)} vs straight ${straight.toFixed(1)}`);
// Collision: walk up into the Hatti Kaapi building from the sidewalk
await teleport(16 * 24.5, 16 * 16.6);
await hold(['ArrowUp'], 1500);
b = await state();
check('building blocks player', b.y > 16 * 16 - 2, `y=${b.y.toFixed(1)} (facade bottom ${16 * 16})`);
await page.screenshot({ path: `${OUT}/10-walk.png` });

// Talk to Manju (tea cart)
await teleport(16 * 28.5, 16 * 16.7);
await page.waitForTimeout(300);
await page.keyboard.press('e');
await page.waitForTimeout(300);
let u = await ui();
check('E opens conversation', u.dialogue);
await page.screenshot({ path: `${OUT}/11-dialogue.png` });
a = await state();
await hold(['ArrowRight'], 400);
b = await state();
check('player frozen during dialogue', Math.abs(b.x - a.x) < 1);
await page.keyboard.press('2');
await page.waitForTimeout(300);
const hinted = await world((s) => s.hinted);
check('conversation gives hint', hinted.includes('graffiti'), JSON.stringify(hinted));
await page.keyboard.press('1');
await page.waitForTimeout(200);
u = await ui();
check('dialogue closes', !u.dialogue);
a = await state();
await hold(['ArrowLeft'], 400);
b = await state();
check('movement resumes after dialogue', a.x - b.x > 10);

// Driving the hatchback
await teleport(16 * 19 + 18, 16 * 30);
await page.waitForTimeout(300);
await page.keyboard.press('e');
await page.waitForTimeout(400);
let st = await state();
check('enter vehicle', st.mode === 'drive' && !st.visible, st.mode);
const carStart = await world((s) => ({ x: s.vehicles.byId('hatchback').sprite.x, y: s.vehicles.byId('hatchback').sprite.y }));
await hold(['ArrowUp'], 1800);
const carEnd = await world((s) => ({ x: s.vehicles.byId('hatchback').sprite.x, y: s.vehicles.byId('hatchback').sprite.y, speed: s.vehicles.byId('hatchback').speed }));
check('car drives', Math.hypot(carEnd.x - carStart.x, carEnd.y - carStart.y) > 60, `moved ${Math.hypot(carEnd.x - carStart.x, carEnd.y - carStart.y).toFixed(0)}px`);
await page.screenshot({ path: `${OUT}/12-drive.png` });
await page.keyboard.press('e');
await page.waitForTimeout(200);
st = await state();
check('cannot exit at speed', st.mode === 'drive' || Math.abs(carEnd.speed) < 25, `speed ${carEnd.speed.toFixed(0)}`);
await hold(['Space'], 1500);
await page.keyboard.press('e');
await page.waitForTimeout(400);
st = await state();
const players = await page.evaluate(() => window.__game.scene.getScene('world').children.list.filter((o) => o.texture?.key === 'char_player').length);
check('exit vehicle', st.mode === 'walk' && st.visible && players === 1, `mode=${st.mode} playerSprites=${players}`);
// Enter/exit repeatedly
let cycles = 0;
for (let i = 0; i < 3; i++) {
  const v = await world((s) => ({ x: s.vehicles.byId('hatchback').sprite.x, y: s.vehicles.byId('hatchback').sprite.y }));
  await teleport(v.x + 16, v.y + 2);
  await page.waitForTimeout(150);
  await page.keyboard.press('e');
  await page.waitForTimeout(200);
  const m1 = (await state()).mode;
  await page.keyboard.press('e');
  await page.waitForTimeout(200);
  const m2 = (await state()).mode;
  if (m1 === 'drive' && m2 === 'walk') cycles++;
}
check('repeat enter/exit', cycles === 3, `${cycles}/3`);

// Metro
await teleport(16 * 32, 16 * 56.6);
await page.waitForTimeout(300);
await page.keyboard.press('e');
await page.waitForTimeout(300);
u = await ui();
check('metro panel opens', u.metro);
await page.screenshot({ path: `${OUT}/13-metro.png` });
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
u = await ui();
check('metro cancel', !u.metro && (await state()).mode === 'walk');
await page.keyboard.press('e');
await page.waitForTimeout(300);
await page.keyboard.press('2'); // 1 is Halasuru, 2 is KR Puram
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/14-metro-ride.png` });
await page.waitForFunction(() => window.__game.scene.getScene('world').mode.kind === 'walk', null, { timeout: 15000 });
await page.waitForTimeout(600);
st = await state();
check('arrive at hub exit', Math.hypot(st.x - 16 * 105, st.y - 16 * 73.4) < 4 && st.visible, `(${st.x.toFixed(0)}, ${st.y.toFixed(0)})`);
await page.screenshot({ path: `${OUT}/15-hub.png` });
// Ride back
await teleport(16 * 107, 16 * 72.6);
await page.waitForTimeout(300);
await page.keyboard.press('e');
await page.waitForTimeout(300);
await page.keyboard.press('Enter');
await page.waitForFunction(() => window.__game.scene.getScene('world').mode.kind === 'metro', null, { timeout: 3000 });
await page.waitForFunction(() => window.__game.scene.getScene('world').mode.kind === 'walk', null, { timeout: 15000 });
await page.waitForTimeout(500);
st = await state();
check('ride back to Indiranagar', Math.hypot(st.x - 16 * 33.6, st.y - 16 * 57.2) < 4, `(${st.x.toFixed(0)}, ${st.y.toFixed(0)})`);
a = await state();
await hold(['ArrowRight'], 500);
b = await state();
check('movement after metro', b.x - a.x > 20, `dx=${(b.x - a.x).toFixed(1)} locked=${await world((s) => s.locked)} mode=${b.mode}`);

// Traffic health over 25 seconds
await teleport(16 * 86, 16 * 23.2);
const snap = () => world((s) => s.traffic.cars.map((c) => ({ id: c.spawn.id, x: c.sprite.x, y: c.sprite.y, active: c.active, why: c.logic.blockedBy ? `${c.logic.blockedBy.kind}:${c.logic.blockedBy.id}@${Math.round(c.logic.blockedBy.x)},${Math.round(c.logic.blockedBy.y)}` : 'none', bt: c.logic.blockTime.toFixed(1) })));
const travelled = new Map();
let prev = await snap();
for (let i = 0; i < 25; i++) {
  await page.waitForTimeout(1000);
  if (i === 12) await page.screenshot({ path: `${OUT}/16-junction.png` });
  const cur = await snap();
  cur.forEach((c, k) => {
    const p = prev[k];
    const d = c.active && p.active ? Math.hypot(c.x - p.x, c.y - p.y) : 100; // respawn counts as moving
    travelled.set(c.id, (travelled.get(c.id) ?? 0) + Math.min(d, 100));
  });
  prev = cur;
}
const frozen = prev.filter((c) => travelled.get(c.id) < 5);
check('no frozen traffic (25s)', frozen.length === 0, frozen.map((c) => `${c.id}(${Math.round(c.x)},${Math.round(c.y)}) ${c.why} bt=${c.bt}`).join('; ') || 'all moving');

// Blocking traffic: stand in the eastbound lane of 100 Feet Road
await teleport(16 * 60, 16 * 19);
let blocked = null;
for (let i = 0; i < 30 && !blocked; i++) {
  await page.waitForTimeout(500);
  blocked = await world((s) => s.traffic.cars.find((c) => c.logic.blockedBy?.kind === 'player')?.spawn.id ?? null);
}
check('car stops for player', !!blocked, blocked ?? 'none');
let reacted = false;
for (let i = 0; i < 16 && !reacted; i++) {
  await page.waitForTimeout(500);
  u = await ui();
  reacted = u.bubbles.some((x) => x.includes('bubble-driver'));
}
check('driver complains when blocked', reacted, (await ui()).bubbles.join(' | '));
await page.screenshot({ path: `${OUT}/17-blocking.png` });
await teleport(16 * 60, 16 * 16.8);

// Rain
await world((s) => s.weather.start(8000, s.clock));
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/18-rain.png` });

// Pause / journal / map
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
u = await ui();
const clockA = (await state()).clock;
await page.waitForTimeout(500);
const clockB = (await state()).clock;
check('pause menu + world paused', u.pause && clockA === clockB);
await page.screenshot({ path: `${OUT}/19-pause.png` });
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
check('resume', !(await ui()).pause);
await page.keyboard.press('b');
await page.waitForTimeout(200);
check('bucket list opens', await page.locator('.bucket').isVisible());
await page.getByRole('tab', { name: /Food book/ }).click();
await page.getByRole('tab', { name: /Places/ }).click();
check('bucket list has food book and places', (await page.locator('.bucket-item').count()) > 10);
await page.screenshot({ path: `${OUT}/20-bucket.png` });
await page.keyboard.press('b');
await page.keyboard.press('m');
await page.waitForTimeout(300);
check('map opens', (await ui()).map);
await page.screenshot({ path: `${OUT}/21-map.png` });
await page.keyboard.press('Escape');

// Persistence across reload
const discoveredBefore = await world((s) => s.discovered.length);
await world((s) => s.persist());
await page.reload();
await page.getByRole('button', { name: /Continue wandering/ }).click();
await page.waitForFunction(() => window.__game?.scene?.getScene('world')?.player, null, { timeout: 15000 });
await page.waitForTimeout(500);
const discoveredAfter = await world((s) => s.discovered.length);
check('discoveries persist', discoveredAfter === discoveredBefore && discoveredAfter > 0, `${discoveredBefore} -> ${discoveredAfter}`);

// NPCs address her as akka/madam, and the profile is saved
await teleport(16 * 28.5, 16 * 16.7);
await world((s) => s.talk.say(s.npcs.byId('manju'), 'Anna, swalpa side kodi. Saar, bega!', s.clock));
await page.waitForTimeout(300);
const said = (await ui()).bubbles.join(' | ');
check('NPCs address a woman as akka/madam', said.includes('Akka, swalpa side kodi. Madam, bega!'), said.slice(0, 160));
await world((s) => s.persist());
const savedPlayer = await page.evaluate(() => JSON.parse(localStorage.getItem('bsam.save')).player);
check('profile saved', savedPlayer?.name === 'Asha' && savedPlayer?.gender === 'f', JSON.stringify(savedPlayer));

// Corrupt save falls back safely
await page.evaluate(() => localStorage.setItem('bsam.save', '{not json'));
await page.reload();
const btn = await page.getByRole('button', { name: /Continue wandering|Start exploring/ });
await btn.click();
await page.waitForFunction(() => window.__game?.scene?.getScene('world')?.player, null, { timeout: 15000 });
check('corrupt save loads with defaults', (await world((s) => s.discovered.length)) >= 0 && errors.filter((e) => e.includes('pageerror')).length === 0);

// Settings persist, then reset clears everything (with confirmation)
await page.waitForTimeout(500);
await page.keyboard.press('Escape');
await page.waitForSelector('.pause');
await page.selectOption('.pause select', 'high');
await page.waitForTimeout(200);
const savedChatter = await page.evaluate(() => JSON.parse(localStorage.getItem('bsam.save')).settings.chatter);
check('settings saved', savedChatter === 'high', savedChatter);
await page.getByRole('button', { name: 'Reset progress…' }).click();
check('reset asks for confirmation', await page.getByRole('button', { name: 'Yes, reset' }).isVisible());
await page.getByRole('button', { name: 'Yes, reset' }).click();
await page.waitForTimeout(600);
const afterReset = await page.evaluate(() => ({ save: localStorage.getItem('bsam.save'), canvases: document.querySelectorAll('.game-canvas canvas').length, game: !!window.__game }));
check('reset clears save and returns to title', afterReset.save === null && afterReset.canvases === 0 && !afterReset.game && (await page.getByRole('button', { name: /Start exploring/ }).isVisible()), JSON.stringify(afterReset));
await page.getByRole('button', { name: /Start exploring/ }).click();
await page.getByRole('button', { name: "Let's go!" }).click();
await page.waitForFunction(() => window.__game?.scene?.getScene('world')?.player, null, { timeout: 15000 });
const freshDiscovered = await world((s) => s.discovered);
// The spawn point is beside Hatti Kaapi, which is discovered on arrival.
check('fresh start after reset', freshDiscovered.every((id) => id === 'kaapi') && (await page.locator('.game-canvas canvas').count()) === 1, JSON.stringify(freshDiscovered));

check('no console errors', errors.length === 0, errors.slice(0, 5).join(' | '));
await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
