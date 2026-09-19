# 🌻 Harvest Hollow

A complete **farming simulator** built as a single, self-contained HTML file — no libraries, no external assets, no build step. All art and audio are generated in code. Grow a rundown plot into a thriving homestead across the four seasons.

## Play

Open **`index.html`** in any modern browser. That's it.

Or serve it locally:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Controls

| Key | Action |
| --- | --- |
| `W` `A` `S` `D` / Arrows | Move |
| `Space` / Click | Use selected tool on the tile you face |
| `1`–`5` | Select tool (Hoe · Seeds · Water · Harvest · Collect) |
| `Q` / `E` | Cycle tools |
| `Tab` | Change seed |
| `B` | Open the shop |
| `Enter` | Sleep (ends the day) |
| `H` | Help |
| `Esc` | Pause / menu |

## The loop

1. **Hoe** grass to make soil → 2. **Plant** a seed → 3. **Water** it.
Crops advance one growth stage each night **only if watered that day**. Skip
watering and the crop dries out and dies. **Rain waters everything for free.**
Each crop only grows in its season. **Sleep** to pass the night, restore energy,
and advance the farm. Sell your harvest at the **Shop**, then reinvest in seeds,
tools, animals, and upgrades.

## Systems

- Tile world with player movement and collision
- Hoe / plant / water / harvest / collect tools + stamina
- 9 crops with distinct cost, grow time, value, seasons, and some that regrow
- Day/night cycle with dynamic lighting, four seasons, and weather (clear, cloudy, rain, snow)
- Economy: shop to buy seeds/upgrades and sell produce
- Animals (chickens, cows) producing daily income
- Upgrades: sprinkler can, more energy, more livestock
- `localStorage` save/load (auto-saves each night) + reset

## Tuning

Every balance number lives in the `CONFIG` object and the `CROPS` catalogue at
the top of the `<script>` in `index.html` — grow times, prices, stamina costs,
season length, and player speed are all one edit away.

## Development harness

The `tools/` folder holds a headless-Chromium (Playwright) harness used during
development:

```bash
npm install          # installs playwright (browsers are preinstalled in CI)
node tools/acceptance.mjs   # runs the 5 acceptance tests
node tools/shoot.mjs <tag>  # captures scene screenshots to shots/ for visual review
```

### Acceptance tests

1. Plant → water across sleeps → harvest → sell yields a net gold gain.
2. Skipping watering visibly costs the crop (it wilts).
3. Gold, inventory, and stamina stay consistent after any action.
4. Save → reload the page → load restores the exact farm state.
5. No JavaScript console errors during a full multi-season session.

The game exposes a `window.GAME` test API (used only by the harness) so these
can run deterministically.
