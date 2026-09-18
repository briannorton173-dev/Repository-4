import { launch, sleep } from './lib.mjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'shots');

const scenes = [
  { name: 'title', setup: async (p) => { await p.evaluate(() => window.GAME.goToTitle()); } },
  { name: 'summer-day', setup: async (p) => { await p.evaluate(() => window.GAME.demoFarm({ season: 'Summer', weather: 'clear', phase: 0.32 })); } },
  { name: 'spring-morning', setup: async (p) => { await p.evaluate(() => window.GAME.demoFarm({ season: 'Spring', weather: 'clear', phase: 0.05 })); } },
  { name: 'fall-rain', setup: async (p) => { await p.evaluate(() => window.GAME.demoFarm({ season: 'Fall', weather: 'rain', phase: 0.4 })); } },
  { name: 'summer-dusk', setup: async (p) => { await p.evaluate(() => window.GAME.demoFarm({ season: 'Summer', weather: 'clear', phase: 0.75 })); } },
  { name: 'summer-night', setup: async (p) => { await p.evaluate(() => window.GAME.demoFarm({ season: 'Summer', weather: 'clear', phase: 0.95 })); await p.evaluate(() => window.GAME.centerOn(24, 5)); } },
  { name: 'winter-snow', setup: async (p) => { await p.evaluate(() => window.GAME.demoFarm({ season: 'Winter', weather: 'snow', phase: 0.3 })); } },
  { name: 'shop', setup: async (p) => { await p.evaluate(() => { window.GAME.demoFarm({ season: 'Summer' }); window.GAME.openShop(); }); } },
];

const tag = process.argv[2] || 'v';
const { browser, page, errors } = await launch({ width: 1280, height: 800 });

for (const s of scenes) {
  await s.setup(page);
  await sleep(500); // let a few frames render (particles, animation)
  const file = path.join(OUT, `${tag}__${s.name}.png`);
  await page.screenshot({ path: file });
  console.log('shot', file);
}
await browser.close();
if (errors.length) { console.log('CONSOLE ERRORS:', errors.slice(0, 5)); }
console.log('done', scenes.length, 'scenes');
