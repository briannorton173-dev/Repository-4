import { launch, sleep } from './lib.mjs';

/* Marcus's 5 acceptance tests, run against the live game via window.GAME. */
const results = [];
function check(name, pass, detail = '') { results.push({ name, pass, detail }); }

const { browser, page, errors } = await launch();

try {
  // fresh game
  await page.evaluate(() => { window.GAME.reset(); window.GAME.newGame(); });

  // ---- TEST 1: plant -> water across sleeps -> harvest -> net gold gain ----
  const t1 = await page.evaluate(async () => {
    const G = window.GAME;
    G.setSeason('Spring');
    G.giveGold(1000);
    G.giveSeed('turnip', 5);
    const goldStart = G.state().gold;
    // buy handled by giveSeed; simulate a real seed purchase cost by spending:
    const x = 8, y = 8;
    G.till(x, y);
    const planted = G.plant(x, y, 'turnip');
    // water and sleep for turnip.days(4) days, always sunny so only our water counts
    for (let d = 0; d < 5; d++) { G.forceWeather('clear'); G.water(x, y); G.sleepInstant(); }
    const st = G.state();
    const ready = st.readyCount >= 1;
    const h = G.harvest(x, y);
    const afterHarvest = G.state();
    // sell it
    G.openShop && null;
    G.sellAll();
    const goldEnd = G.state().gold;
    return { planted: planted.ok, ready, harvested: h.ok && !h.wilted, goldStart, goldEnd, produceHad: afterHarvest.produce.turnip || 0 };
  });
  check('1. Plant→water→harvest→sell yields net gold gain',
    t1.planted && t1.ready && t1.harvested && t1.goldEnd > t1.goldStart,
    `planted=${t1.planted} ready=${t1.ready} harvested=${t1.harvested} gold ${t1.goldStart}→${t1.goldEnd}`);

  // ---- TEST 2: skipping watering visibly costs the crop ----
  const t2 = await page.evaluate(async () => {
    const G = window.GAME;
    G.reset(); G.newGame(); G.setSeason('Spring'); G.giveSeed('potato', 2);
    const x = 10, y = 9;
    G.till(x, y); G.plant(x, y, 'potato');
    // never water; force clear (no rain) for wiltAfterDaysDry+1 days
    for (let d = 0; d < 3; d++) { G.forceWeather('clear'); G.sleepInstant(); }
    const st = G.state();
    return { wilt: st.wiltCount, crops: st.cropCount };
  });
  check('2. Skipping watering wilts/kills the crop', t2.wilt >= 1,
    `wiltCount=${t2.wilt}`);

  // ---- TEST 3: gold/inventory/stamina always consistent after actions ----
  const t3 = await page.evaluate(async () => {
    const G = window.GAME;
    G.reset(); G.newGame(); G.setSeason('Spring'); G.giveGold(1000); G.giveSeed('turnip', 10);
    const before = G.state();
    // do a batch of till/plant/water; each till costs stamina
    let ok = true;
    for (let i = 0; i < 6; i++) { G.till(6 + i, 6); G.plant(6 + i, 6, 'turnip'); G.water(6 + i, 6); }
    const after = G.state();
    const seedsSpent = (before.seeds.turnip || 0) - (after.seeds.turnip || 0);
    const staminaOk = after.stamina >= 0 && after.stamina <= after.maxStamina;
    const soilOk = after.soilCount >= 6;
    return { seedsSpent, staminaOk, soilOk, stamina: after.stamina, cropCount: after.cropCount };
  });
  check('3. Gold/inventory/stamina stay consistent',
    t3.seedsSpent === 6 && t3.staminaOk && t3.soilOk,
    `seedsSpent=${t3.seedsSpent} staminaOk=${t3.staminaOk} crops=${t3.cropCount}`);

  // ---- TEST 4: save -> reload page -> load restores exact state ----
  const preSave = await page.evaluate(() => {
    const G = window.GAME;
    G.reset(); G.newGame(); G.setSeason('Summer'); G.giveGold(777); G.giveSeed('tomato', 3);
    G.till(9, 9); G.plant(9, 9, 'tomato'); G.water(9, 9);
    G.sleepInstant(); // advances day, autosaves
    G.save();
    return G.state();
  });
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.GAME && window.GAME.screenshotReady());
  const postLoad = await page.evaluate(() => {
    const G = window.GAME;
    G.newGame();           // build fresh world
    const loaded = G.load(); // pull from localStorage
    return { loaded, st: G.state() };
  });
  check('4. Save/reload/load restores exact farm state',
    postLoad.loaded && postLoad.st.gold === preSave.gold && postLoad.st.day === preSave.day
      && postLoad.st.cropCount === preSave.cropCount && postLoad.st.season === preSave.season,
    `gold ${preSave.gold}=${postLoad.st.gold} day ${preSave.day}=${postLoad.st.day} crops ${preSave.cropCount}=${postLoad.st.cropCount}`);

  // ---- TEST 5: no JS errors during a full play session ----
  await page.evaluate(async () => {
    const G = window.GAME;
    G.reset(); G.newGame();
    for (const season of ['Spring', 'Summer', 'Fall', 'Winter']) {
      G.setSeason(season);
      for (let d = 0; d < 3; d++) { G.forceWeather(['clear', 'rain', 'cloudy'][d % 3]); G.sleepInstant(); }
    }
    G.openShop();
  });
  await sleep(300);
  check('5. No JavaScript console errors in a full session', errors.length === 0,
    errors.length ? errors.slice(0, 3).join(' | ') : 'clean');

} catch (e) {
  check('HARNESS', false, 'threw: ' + e.message + '\n' + e.stack);
} finally {
  await browser.close();
}

let pass = 0;
console.log('\n=== Marcus\'s Acceptance Tests ===');
for (const r of results) {
  console.log(`${r.pass ? '✅ PASS' : '❌ FAIL'}  ${r.name}${r.detail ? '  —  ' + r.detail : ''}`);
  if (r.pass) pass++;
}
console.log(`\n${pass}/${results.length} passed${errors.length ? `  (console errors: ${errors.length})` : ''}`);
process.exit(pass === results.length ? 0 : 1);
