// Visual tour: teleports to each area and screenshots it.
import { chromium } from 'playwright-core';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(process.env.URL ?? 'http://localhost:5199/');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.getByRole('button', { name: /Start exploring/ }).click();
await page.waitForFunction(() => window.__game?.scene?.getScene('world')?.player);
const go = (tx, ty) => page.evaluate(([x, y]) => { const s = window.__game.scene.getScene('world'); s.player.body.reset(x * 16, y * 16); s.cameras.main.centerOn(x * 16, y * 16); }, [tx, ty]);
const spots = (process.env.SPOTS ?? 'food:56,77;chai:63,80.6;maidan:14,86;banyan:30,92;lake:70,52;market:117,47;gully:26,46;autostand:104,84;tech:78,15;darshini:53,76.6').split(';').map((s) => { const [n, xy] = s.split(':'); const [x, y] = xy.split(',').map(Number); return { n, x, y }; });
for (const s of spots) {
  await go(s.x, s.y);
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `test-artifacts/tour-${s.n}.png` });
}
if (process.env.TALK) {
  await page.keyboard.press('e');
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-artifacts/tour-talk.png' });
}
console.log(errors.length ? errors.join('\n') : 'no page errors');
await browser.close();
