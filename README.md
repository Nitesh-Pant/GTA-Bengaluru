# BENGALURU: SWALPA ADJUST MAADI

A top-down, 16-bit-style open-world wander through a compact, fictionalised Bengaluru:
traffic junctions, darshinis, chai stalls, a metro line, gully cricket and a lot of street talk in
Roman-script Kannada, English and Hindi. There are no missions. The city is meant to be worth
wandering on its own.

All places, people and businesses are fictional or loosely *inspired by* Bengaluru (for example,
darshinis such as Vidyarthi Bhavan and Rameshwaram Cafe, military hotels and Iyengar bakeries). Street
layouts are simplified for play and are not a map of the real city.

## Run it

Requires Node 20+.

```bash
npm install
npm run dev          # http://localhost:5173
```

Other commands:

| Command             | What it does                                                                  |
| ------------------- | ----------------------------------------------------------------------------- |
| `npm run build`     | Type-checks and builds to `dist/`                                              |
| `npm run preview`   | Serves the production build                                                    |
| `npm test`          | Unit tests (Vitest) for the game logic and content data                        |
| `npm run typecheck` | TypeScript only                                                                |
| `npm run lint`      | ESLint                                                                         |
| `npm run e2e`       | Browser playtest in your installed Chrome. Start `npm run dev -- --port 5199` first |

> **Folder name note.** The npm scripts call tools as `node ./node_modules/...` because this
> folder's name contains `:`, which is the `PATH` separator and breaks `node_modules/.bin`. Vite also
> refuses to serve any file whose path contains `:`, so `vite.config.ts` turns off `server.fs.strict`
> **only when the project path contains a colon**. Renaming the folder (for example to
> `GTA-Bangalore`) brings back Vite's default strict file serving.

## Controls

| Key                    | On foot                                    | Driving                                        |
| ---------------------- | ------------------------------------------ | ---------------------------------------------- |
| `WASD` / arrow keys    | Walk (diagonals are not faster)            | `W`/`↑` accelerate, `S`/`↓` brake then reverse, `A`/`D` steer |
| `E`                    | Talk, enter a vehicle, use a metro entrance | Get out (only when slow and there's room)     |
| `Space`                | –                                          | Handbrake                                      |
| `H`                    | –                                          | Horn (nearby pedestrians react)                |
| `J`                    | Journal: places, tips, stats, optional markers | same                                       |
| `M`                    | City map (click a place to toggle its marker) | same                                        |
| `Esc`                  | Pause and settings, or close the open panel | same                                          |
| `?` / `F1`             | Show or hide the controls hint             | same                                           |
| `1`–`9`, `↑↓` + `Enter`, mouse | Pick dialogue options and metro destinations | same                               |

While a dialogue, the metro panel, the journal, the map or the pause menu is open, that panel owns the
keyboard and the player doesn't move. When several things are in reach, `E` picks in this order:
get out of a vehicle, then metro, counter, vehicle, object, person, choosing the nearest when two
share a rank.

## What's in the city

- **Indiranagar.** 100 Feet Road cafes, a tea cart, a brewpub, a graffiti gully and a metro station.
- **Marathahalli Junction.** A signalled junction with permanent roadworks, buses squeezing past
  cones, and Gowri the cow resting in the middle of the road.
- **Food & Chai Lane.** A stand-and-eat darshini with a queue, a chai stall, an Iyengar bakery, a
  military hotel, a gully cricket maidan and an old banyan tree.
- **Central Metro Hub.** The station, an auto stand, a bus stop, flower and coconut sellers.
- **ByteWhite Tech Park** and **Kere Park**, a lakeside park, link the four main areas.

Systems:

- **Traffic.** Cars, autos, buses and scooters follow lane routes (left-hand traffic), keep their
  distance, stop at signals and for pedestrians, and squeeze past roadworks. A car stuck behind
  another vehicle for more than 5 seconds is let through, so traffic can't jam permanently. Drivers
  honk at you when you block them, complain if you keep blocking them, and grumble about the queue
  that builds up behind them.
- **Rideables.** Your cousin's hatchback (12th Main), Raju's auto (Hub auto stand) and a rental scooter
  (Tech Park) can be driven. Traffic vehicles can't be taken.
- **Metro.** Two stations on an elevated purple line. Choose a destination and the camera rides the
  train along the viaduct. You can cancel before departure. Trains also run past on their own.
- **People.** 71 NPCs walk, wander, queue, work counters and chat in pairs. Ambient lines are
  triggered by proximity and context (area, rain, what just happened). Repetition is held down by
  cooldowns, a global gap between lines, a cap on simultaneous bubbles, and memory of recent lines.
- **Reactions.** Walking past someone gets no reaction. A bump gets a startled line. Blocking
  someone's path for a while gets a complaint. Rain sends people looking for shelter.
- **Random events** (one at a time, with cooldowns, all ignorable): street gossip, a cricket ball
  rolling into the lane (you can throw it back), food invitations, surprise roadworks, local shortcut
  tips, and monsoon rain.
- **Discovery.** 28 places. Unvisited ones show as `?` on the map. Five hidden spots only appear after
  someone gives you a tip. Optional markers, a journal, and local saves in `localStorage` (versioned and
  sanitised; corrupt or old data falls back safely). You can reset progress from the pause menu, with a
  confirmation step.

## Code layout

```
src/
  data/        Content only: map layout, buildings, props, POIs, NPCs, dialogue, conversations,
               roads/routes, metro stations, rideables, events. Add content here.
  logic/       Pure, engine-free, unit-tested rules: movement, interaction priority, dialogue
               director, reaction engine, traffic, vehicle enter/exit, discovery, saves, events, metro.
  game/
    art/       Procedural pixel-art painters (canvas only). Every sprite is generated at boot.
    scenes/    BootScene (textures, animations) and WorldScene (world orchestration).
    systems/   Npc, Traffic, Vehicle, Talk, Event, Weather and Metro systems, plus the DOM bubble layer.
    audio.ts   Procedural WebAudio: city hum, per-vehicle horns, rain, chimes, engine.
    gameHost.ts / PhaserGame.tsx   A single game instance, created once and never recreated on re-render.
    bridge.ts  Commands from React to the running scene.
  store/       A small external store the scene writes to and React reads with useSyncExternalStore.
  ui/          React HUD, minimap, dialogue, metro, journal, map, pause and settings, main menu.
tests/         Vitest unit tests.
scripts/       Browser checks: playtest.mjs (e2e), events.mjs, tour.mjs (screenshots), perf.mjs.
```

Speech bubbles and prompts are DOM elements that follow world positions each frame, so text stays
sharp at any zoom. Camera zoom is a whole number chosen from the window height, and driving zooms out
by one step.

## Adding content

- **Dialogue lines:** append to a pool in `src/data/dialogue.ts`. You can add `when: { rain, areas, mode }` conditions.
- **NPC-to-NPC exchanges:** add to `EXCHANGES` with a topic. Give NPCs that topic in `src/data/npcs.ts`.
- **An NPC:** add an entry to `NPCS` with an `idle`, `wander`, `route` or `chat` behaviour, a look from
  `src/data/looks.ts`, and optionally a conversation from `src/data/conversations.ts`.
- **A metro station:** add it to `src/data/metro.ts` with two-way `connections`, and put its platform on `METRO_TRACK`.
- **A place:** add it to `src/data/pois.ts`. Set `hidden: true` and a `hint` for secret spots.

`tests/data.test.ts` and `tests/collision.test.ts` catch broken references and NPCs or exits that
start inside walls.
