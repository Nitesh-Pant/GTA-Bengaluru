// Forces each random event to start in a suitable spot and checks it runs and cleans up.
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.stack));
await page.goto(process.env.URL ?? 'http://localhost:5199/');
await page.evaluate(() => localStorage.clear() || localStorage.setItem('bsam.tourSeen', '1'));
await page.reload();
await page.getByRole('button', { name: /Start exploring/ }).click();
await page.getByRole('button', { name: "Let's go!" }).click();

await page.waitForFunction(() => window.__game?.scene?.getScene('world')?.player);
const cases = [
  ['gossip', 24, 17],
  ['cricket_ball', 12, 78],
  ['food_invite', 58, 76],
  ['roadwork', 60, 17],
  ['shortcut_tip', 58, 76],
  ['rain', 60, 17],
];
for (const [id, x, y] of cases) {
  const started = await page.evaluate(([id, x, y]) => {
    const s = window.__game.scene.getScene('world');
    s.player.body.reset(x * 16, y * 16);
    s.district = { id: 'x' };
    const ev = s.worldEvents;
    const def = ev.scheduler.defs.find((d) => d.id === id);
    if (ev.active) ev.finish();
    ev.scheduler.active = { id, endsAt: s.clock + def.durationMs };
    ev.begin(def, s.clock);
    return !!ev.active;
  }, [id, x, y]);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `test-artifacts/event-${id}.png` });
  if (id === 'cricket_ball') {
    // Walk to the ball and throw it back.
    await page.evaluate(() => { const s = window.__game.scene.getScene('world'); const b = s.worldEvents.ball.sprite; s.player.body.reset(b.x + 6, b.y + 4); });
    await page.waitForTimeout(300);
    await page.keyboard.press('e');
    await page.waitForTimeout(1500);
  }
  const dur = await page.evaluate((id) => window.__game.scene.getScene('world').worldEvents.scheduler.defs.find((d) => d.id === id).durationMs, id);
  await page.waitForFunction(() => !window.__game.scene.getScene('world').worldEvents.active, null, { timeout: dur + 8000 }).catch(() => {});
  const ended = await page.evaluate(() => !window.__game.scene.getScene('world').worldEvents.active);
  const leftovers = await page.evaluate(() => { const s = window.__game.scene.getScene('world'); return { eventNpcs: s.npcs.npcs.filter((n) => n.state === 'event' || n.state === 'goto').map((n) => n.id), statics: s.traffic.statics.filter((o) => o.id.startsWith('rw_')).length, raining: s.weather.raining }; });
  console.log(`${started && ended && !leftovers.eventNpcs.length && !leftovers.statics && !leftovers.raining ? 'PASS' : 'FAIL'}  ${id}: started=${started} ended=${ended} leftovers=${JSON.stringify(leftovers)}`);
}
console.log(errors.length ? errors.join('\n') : 'no page errors');
await browser.close();
