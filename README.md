# GTE-Bengaluru

### **G**aadi · **T**hindi · **E**njoy — *Swalpa Adjust Maadi*

**Play now: [gte-bengaluru.pages.dev](https://gte-bengaluru.pages.dev)** (free, in the browser, on desktop or phone)

A top-down, 16-bit-style open-world game set in Bengaluru. Walk 100 Feet Road with a filter coffee,
get stuck at Marathahalli Junction behind Gowri the cow, ride the purple line, book a Rapido (and get
cancelled on), drive an auto for fares, eat your way through a 21-dish food book, and watch MG Road turn
red and gold on IPL nights.

There are **no missions**. The city is meant to be worth wandering on its own: people talk to each
other and to you in Kannada, Hindi, English and every mix in between, traffic jams at rush hour, the
power goes out at night, and there is always roadwork somewhere.

It runs in the browser on desktop and phones, can be installed as an app, and works offline after the
first visit.

---

## Contents

- [Play it](#play-it)
- [Controls](#controls)
- [Your first minutes](#your-first-minutes)
- [The city](#the-city)
- [Getting around](#getting-around)
- [Things to do](#things-to-do)
- [A living city](#a-living-city)
- [People, languages and voices](#people-languages-and-voices)
- [Your character](#your-character)
- [Settings, saving and sound](#settings-saving-and-sound)
- [Phones, tablets and offline play](#phones-tablets-and-offline-play)
- [What's in the box](#whats-in-the-box)
- [Development](#development)
- [Project structure](#project-structure)
- [How it works](#how-it-works)
- [Adding content](#adding-content)
- [Testing](#testing)
- [Building and deploying](#building-and-deploying)
- [Names, places and credits](#names-places-and-credits)

---

## Play it

The live game is at **https://gte-bengaluru.pages.dev**. To run it locally you need **Node 20 or newer**:

```bash
npm install
npm run dev          # then open http://localhost:5173
```

On the title screen choose **Start exploring**, pick your character and press **Let's go!**. A short
guided tour starts the first time; skip it or follow along.

---

## Controls

### Keyboard

| Key | On foot | Driving |
| --- | --- | --- |
| `W A S D` / arrow keys | Walk (diagonals are not faster) | `W`/`↑` accelerate, `S`/`↓` brake then reverse, `A`/`D` steer |
| `E` | Talk, order food, feed a dog, get in a vehicle, use a metro entrance or bus stop | Get out (only when slow and there is room) |
| `Space` | – | Handbrake |
| `H` | – | Horn (pedestrians react, dogs bark) |
| `F` | Find a ride: nearest bike, auto, bus stop, metro or car, with an arrow to it | same |
| `R` | Book a Rapido bike taxi | – |
| `M` | City map: zoom, drag, search, mark places, ride there | same |
| `J` | Journal: places, food book, achievements | same |
| `Esc` | Pause and settings, or close whatever is open | same |
| `?` / `F1` | Show or hide the controls hint | same |
| `1`–`9`, `↑ ↓` + `Enter`, mouse | Pick dialogue options and destinations | same |

When several things are in reach, `E` picks in this order: get out of a vehicle, then metro or bus
stop, counter, vehicle, object (dog, cow, ball), person; the nearest wins a tie. While a dialogue,
panel or menu is open it owns the keyboard and the player stands still.

### Touch (phones and tablets)

On-screen controls appear automatically on touch devices:

- **Left side:** touch anywhere in the lower left and the pad appears under your thumb. Drag to walk.
- **Driving is point-to-steer:** drag the way you want to go on screen and the vehicle turns and drives
  there. Push further to go faster; point back from a stop to reverse. On phones vehicles top out a
  little slower, since less of the road ahead fits on screen, and the camera leads in the direction
  you're driving.
- **E:** talk, use, get in. While driving: a big hold-to-**Brake** under the right thumb, **Horn**
  beside it, and a small **Get out** above, out of the thumb's way.
- **Find ride** (yellow), **Map**, **Journal** and **II** (pause) buttons.
- Every panel, dialogue option and list is tappable. Portrait and landscape both work.

### Side bar

Always on the left of the screen (icon-only on phones):

| Button | What it does |
| --- | --- |
| **Find a ride** | Nearest bike, auto, bus stop, metro and car with walking time; pick one for an arrow to it (on phones this is the yellow **Find ride** button) |
| **Character** | Change your name, boy/girl and outfit at any time |
| **Morning → Afternoon** | Jump the time of day (morning, afternoon, evening, night) |
| **Sound on / off** | Mute or unmute everything |
| **Hints** | Replay the guided tour |
| **Ride** | Book a Rapido (when on foot) |

---

## Your first minutes

1. **Character screen.** Boy or girl side by side, then your name (pre-filled as **Darshan** or
   **Rashmi**), then an outfit: casual, office, lungi or kurta for him; casual, saree, salwar or office
   for her. People greet you by name, and address you as *akka / madam / didi* or *anna / saar / bhai*.
2. **Guided tour.** Popups spotlight each part of the screen (area card, minimap, side bar) and explain
   how to get around. The *Getting around* page has **Show me** buttons that put a marker on the
   nearest bike, bus stop, metro, auto or car (the same as **Find a ride**). Bring it back any time with **Hints**, or **How to play**
   in the pause menu.
3. **You start on 100 Feet Road**, Indiranagar, at 8 AM, beside Hatti Kaapi and Manju's tea cart.
   Walk up to people and press `E`.

---

## The city

The map is 128 × 168 tiles (16 px each), a simplified east-and-central Bengaluru. Real place names,
not real distances.

```
             cols 0-39           40-43    44-87                 88-91    92-127
 rows 0-15    Indiranagar shops  CMH Rd   Bagmane Tech Park     Old      Marathahalli shops
 rows 18-21   ═══════════════════════════ 100 Feet Road ═══════ Airport ═══════════════════
 rows 24-55   Indiranagar homes  │        Ulsoor Lake           Road     Mall + market
 rows 58-61   ════════════════════ Outer Ring Road + metro viaduct ═══════════════════════
 rows 64-95   Thippasandra food street + maidan                 │        KR Puram hub
 rows 96-105  MG Road shops      │        Koramangala startups  │        BTM PG lane
 rows 108-111 ═══════ MG Road / 80 Feet Road / 16th Main Road ═════════════════════════════
 rows 114-143 Cubbon Park + Chinnaswamy   Koramangala offices   │        PGs + BTM Lake
 rows 144-161 Vidhana Soudha              Bull Temple + pandal  │        Lalbagh
 rows 164-167 ═══════ Ambedkar Veedhi / Bull Temple Road / Lalbagh Road ═══════════════════
```

| Area | Highlights |
| --- | --- |
| **Indiranagar** | 100 Feet Road: Third Wave Coffee, Hatti Kaapi, Toit (with its pub crowd), Manju's tea cart, PUMA, WeWork, cult.fit, a graffiti gully (secret), 12th Main, Indiranagar Metro |
| **Bagmane Tech Park** | Google, Amazon, EY and Microsoft offices, the break-zone chai cart, a walk-in interview drive with a queue of candidates |
| **Marathahalli Junction** | Signals, permanent roadworks with a road crew, Gowri the cow resting in the junction, Phoenix Marketcity, Mobile Bazaar, the market, a shortcut gully (secret) |
| **Ulsoor Lake** | Swan pedal boats, a running club on the lake loop, a secret bench, Halasuru Metro |
| **Thippasandra** | Rameshwaram Cafe and its queue, Anna Chai Point, Iyengar Bakery, Shivaji Military Hotel, Ragi Mudde Mane, Sri Krishna Sweets, juice and paan shops, a building site, a gully cricket maidan, an old banyan tree and Benne Dose Corner (secrets), Ganesha Gudi |
| **KR Puram** | Purple and Blue line interchange, auto stand (Raju's auto), bus stop, flower and coconut sellers, food court |
| **MG Road** | Higginbothams, Koshy's, Blossom Book House, Pecos |
| **Cubbon Park** | Running track, State Central Library, lawns and bamboo |
| **Chinnaswamy Stadium** | Ticket counter, fans chanting "Ee sala cup namde!", IPL nights |
| **Koramangala** | 80 Feet Road: Flipkart, Swiggy, Razorpay, CRED, SOCIAL; behind it Infosys, Wipro, Accenture, IBM, Truffles, Nexus Mall and Startup Street (Zerodha, Zepto, 91springboard) |
| **BTM Layout** | Gents PG, Ladies PG, Comfort PG and more, a strict PG aunty, the Andhra Mess, BTM Lake |
| **Vidhana Soudha** | The granite legislature with *"Government Work is God's Work"*, floodlit at night |
| **Basavanagudi** | Dodda Basavana Gudi (Bull Temple), a groundnut seller, and a **Ganesha pandal** with a dhol, lights and prasada |
| **Lalbagh** | The Glass House, flower beds and morning walkers |

Green road-name boards stand on every main road, and the big map labels areas, roads and lakes.

---

## Getting around

| How | Where | Notes |
| --- | --- | --- |
| **Walk** | Everywhere | `WASD` or the touch pad |
| **Yulu e-bike** | 16 spots, at least one in every area | Walk up and press `E`. Slow and polite |
| **Cousin's hatchback** | 12th Main, Indiranagar | "Full tank illa, adjust maadi" |
| **Autos** | Raju's (KR Puram auto stand), Manju's (Indiranagar), Shivanna's (MG Road), Venki's (Koramangala), Basavaraj's (BTM) | Borrow one and earn auto fares |
| **Rental scooter** | Tech park and KR Puram | Battery 64%, helmet optimistic |
| **Rapido bike taxi** | Anywhere on foot: `R`, the side bar, or **Ride** on a map search result | The captain picks you up from the nearest main road and drops you on the pavement near your destination. About a third of the time the first captain cancels ("Traffic jaasti, saar") |
| **BMTC bus** | 7 stops: Indiranagar 100 Ft Rd, Marathahalli Bridge, Thippasandra, KR Puram, MG Road, Koramangala (Sony Signal), BTM (Udupi Garden) | Stand at the stop, press `E`, choose where. Miss it and "BMTC never waits" |
| **Namma Metro** | Indiranagar, Halasuru and KR Puram on the elevated purple line | `E` at the entrance, pick a station, ride the viaduct. A recorded announcer calls the next station |

Not sure where any of these are? **Find a ride** (`F`, or the yellow button on phones) lists the
nearest of each with the walking time and puts an arrow on the screen edge pointing the way.

Traffic vehicles (cars, autos, buses, scooters, the police car and the ambulance) can't be taken.

---

## Things to do

### Jobs (all optional)

- **Auto fares.** Drive any of the autos and people wave you down. Slow down beside them, drop them at the
  marker and collect the meter, rounded down ("change illa"). Earnings show in the journal.
- **Food delivery.** Ask a delivery rider (Imran in Thippasandra, or Mallesh outside Swiggy) for an
  order. Pick it up at a restaurant and drop it at an office, PG or landmark before the timer runs out.
  Any way of travelling counts. The ✕ on the HUD chip hands the order back.
- **Tech questions.** The recruiter at the tech park's walk-in drive, the Amazon intern, and most
  techies, founders and job candidates will quiz you (20 questions).

Jobs show as chips on the HUD with their own guide markers, so they never overwrite the place you
marked yourself.

### Food book

21 dishes, each ordered from someone at a counter: masala dose and idli-vade at Rameshwaram Cafe,
filter kaapi at Hatti Kaapi, cutting chai and bun maska at Anna Chai Point, ginger chai at Manju's,
honey cake and veg puffs at the Iyengar bakery, donne biryani at Shivaji Military Hotel, ragi mudde,
meetha paan, kabbina haalu, Mysore pak at Sri Krishna Sweets, masala puri, avocado toast at Third Wave,
campus chai, appam and stew at Koshy's, a Truffles burger, Andhra meals in BTM, benne dose (secret), and
kesari bath prasada at the Ganesha pandal. The journal's **Food book** tab shows what you've tried and
where to find the rest.

### Discovery

62 places. Unvisited ones show as `?` on the map; 5 are secret and only appear after someone gives
you a tip. Mark any place from the journal or the map to get a marker and an edge-of-screen arrow.

### Small kindnesses and moments

Throw the cricket ball back to the kids, give a street dog a biscuit (it follows you for a while), say
hello to Gowri and the other cows, take prasada at the pandal, chat at the walk-in drive, and stand
outside the stadium on an IPL night.

### Achievements

28 local ones, all unlocked just by playing: *Ondu Chai*, *Cutting Chai Connoisseur*, *Horn OK Please*,
*Right of Way*, *OTP Heli, Saar*, *Meter Haaki*, *Auto Anna*, *BMTC Pass*, *Five Star Partner*,
*Biscuit Friend*, *Walk-in Selected*, *Ee Sala Cup Namde*, *Startup Safari*, *PG Life*,
*Bengaluru Darshana*, *Full Meals*, *Namma Ooru Expert* and more.

---

## A living city

### Day, night and rush hour

- A full day takes **16 real minutes**. New games start at 8 AM; the time is saved.
- Dawn and dusk are golden. At night streetlamps, shopfronts and headlights light up, Vidhana Soudha is
  floodlit and the pandal glows in colour.
- **Rush hour** (8:30–10:30 and 17:30–20:00) puts every vehicle on the road; late at night only about
  40% are out.
- Some lines only come up in the morning, evening or at night.
- The HUD shows the time and a red *Rush hour* chip. Jump the time from the side bar or the pause menu.

### IPL nights

Every other in-game evening, 6:30–11 PM, RCB play at Chinnaswamy against a random side:

- Floodlights come on over the stadium.
- Fans in red and gold pack the forecourt and MG Road, chanting.
- Roars carry across town, sometimes with a "SIX!".
- People talk about the score.
- The result is announced at the end.

The HUD shows an *IPL · RCB vs …* chip while the match is on.

### Street events

One at a time, with cooldowns, all ignorable:

| Event | What happens |
| --- | --- |
| **Gossip** | Two people stop and chat about the area |
| **Street argument** | Two people argue (parking, queues, meters, scrapes); onlookers gather; someone makes peace |
| **Accident and road rage** | A car and a scooter collide; both stop, traffic queues and honks, the drivers shout, a crowd gathers, the police siren starts, and it ends with "insurance alli nodkolona" |
| **Power cut** | After dark only: lamps and shops go out, inverters hum, everyone blames BESCOM |
| **BBMP garbage van** | Drives down the nearest main road playing its jingle; neighbours run out |
| **Surprise roadworks** | Barriers and cones appear with a worker; traffic squeezes past |
| **Cricket ball** | Rolls out of the maidan; throw it back |
| **Food invitation** | Someone insists you try a place |
| **Local tip** | Someone points you to a secret spot |
| **Monsoon rain** | Rain sound and streaks; people run for shelter; autos ask double |

### Traffic

Cars, autos, buses and scooters follow left-hand lanes, stop at signals and for pedestrians, squeeze
past roadworks and cows, and queue behind accidents. A vehicle stuck too long is let through, so traffic
can never jam forever. Drivers honk and complain if you block them. A **police car** and an
**ambulance** drive with flashing light bars; the ambulance always runs its siren, the police only
sometimes, and people nearby react.

### Animals

Six named street dogs (Kalu, Tommy, Rani, Brownie, Jimmy, Raja) that bark at passing traffic, crows that
scatter with a caw when you walk up, and cows wandering the maidan and BTM Lake.

### Construction

A five-floor building site in Thippasandra (scaffolding, green net, sand and bricks, workers in helmets,
and a site engineer who promises "six months"), a road crew at the Marathahalli roadworks, and a worker
minding every surprise roadworks.

### Ambience

A city hum, distant honks, birds near parks and lakes, crickets at night, temple bells, a dhol at the
pandal, and soft background music (a tanpura-like drone with notes in raga Mohanam), all mixed well
under people's voices.

---

## People, languages and voices

- **146 people** walk, wander, queue, work counters, chat in groups, jog, push carts and run clubs.
- **395 lines** in 55 pools, **53 two-person exchanges** and **38 conversations**, in Roman-script
  Kannada, Hindi, English and the mix of all three you hear on the street. Small talk includes the
  classic *"Weather accha hai, na?" / "Haan… aur?" / "…"*.
- Lines are picked by context (area, rain, time of day, walking or driving, your gender) with
  cooldowns, a gap between lines, a cap on bubbles on screen and memory of recent lines, so the city
  doesn't repeat itself.
- **40 recorded voice clips** (men, women, kids, a stadium crowd, the metro announcer, a Rapido
  captain) play under some speech bubbles. A clip only plays for a speaker whose voice matches (a man's
  clip is never used for a woman or a kid), quieter and panned with distance, one at a time.
- **Reactions.** Walking past someone gets no reaction; bumping into them, blocking their path or
  driving close does. Rain sends people looking for shelter.

---

## Your character

Boy or girl, a name, and four outfits each (casual, office, lungi or kurta for him; casual, saree with
jasmine and bindi, salwar or office for her). Your name floats above your head. Change everything at
any time from the side bar, the pause menu, or **Change character & continue** on the title screen.

---

## Settings, saving and sound

The pause menu (`Esc` or **II**) has:

- Resume, Journal, Map and How to play
- Character and time of day
- Mute all sound, plus sliders for master, sound effects, city ambience, voices and music
- Street chatter (low, normal, high), destination markers, screen shake
- Save and quit to the title, and Reset progress (with confirmation)

**Saving** is automatic and local to the browser (`localStorage`, key `bsam.save`): discoveries, tips,
food book, achievements, stats, settings, your character, the time of day and your last safe position.
Saves are versioned and sanitised: corrupt or older data falls back safely, and unknown ids are
dropped.

---

## Phones, tablets and offline play

- Touch controls, a compact side bar and tappable panels on phones and tablets, in portrait or landscape.
- The menu loads first (about 120 KB gzipped) while the game engine downloads in the background.
- The production build is a **Progressive Web App**: it can be installed (*Add to Home Screen*), and
  after one visit it works offline.
- **Phone visitors are offered the app** the first time they open the site: *Get the app* opens the
  browser's install dialog straight away on Android (Chrome, Edge, Samsung Internet) and shows the
  *Add to Home Screen* steps on iPhone; *Play in browser* just carries on in the tab. It asks once,
  and the menu keeps a *Get the app* button ([`src/install.ts`](src/install.ts),
  [`src/ui/InstallPrompt.tsx`](src/ui/InstallPrompt.tsx)).

---

## What's in the box

| Content | Count |
| --- | --- |
| Areas | 14 |
| Places to discover | 62 (5 secret) |
| People | 146 |
| Dialogue lines / exchanges / conversations | 395 / 53 / 38 |
| Dishes | 21 |
| Achievements | 28 |
| Tech questions | 20 |
| Street events | 10 |
| Metro stations / bus stops | 3 / 7 |
| Rideable vehicles | 24 (1 car, 5 autos, 2 scooters, 16 Yulu) |
| Traffic vehicles | 32 on 19 routes (including the police car and ambulance) |
| Buildings | 82 |
| Voice clips | 40 |

Everything visual is painted in code at startup: there are no image files besides the app icons.

---

## Development

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server with hot reload at http://localhost:5173 |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build (with the offline service worker) |
| `npm test` | Unit tests (Vitest) for game logic and content data |
| `npm run typecheck` | TypeScript only |
| `npm run lint` | ESLint |
| `npm run e2e` | Browser playtest in your installed Chrome. Start `npm run dev -- --port 5199` first |

Stack: **TypeScript**, **React 19** (UI), **Phaser 3** (world, physics, rendering), **Vite** (build),
**Vitest** (tests) and **Playwright** (browser checks). There is no backend.

> **Folder-name note.** The npm scripts call tools as `node ./node_modules/...` because a folder name
> containing `:` breaks `node_modules/.bin` on the `PATH`. Vite also refuses to serve files whose path
> contains `:`, so `vite.config.ts` relaxes `server.fs.strict` only in that case.

---

## Project structure

```
public/
  audio/voice/        40 voice clips (MP3 / AAC .m4a)
  icons/              App icons (192 and 512 px)
  manifest.webmanifest, sw.js   Installable app and offline cache
src/
  main.tsx, App.tsx, session.ts   Entry, top-level UI, starting and quitting a game, loading saves
  data/               Content only (add things here)
    map.ts            Ground, buildings, props, districts, road and lake labels
    npcs.ts           Every person: look, behaviour (idle, wander, route, chat), lines, conversation
    dialogue.ts       Line pools and two-person exchanges
    conversations.ts  Conversations opened with E (food orders, tips, quizzes, jobs)
    pois.ts           Places to discover
    food.ts, achievements.ts, techQuiz.ts
    roads.ts          Lanes, junctions, traffic routes and spawns
    metro.ts, transit.ts (bus stops, auto hail spots), rides.ts (Rapido destinations)
    vehicles.ts       Rideables (car, auto, scooter, Yulu) and parked vehicles
    animals.ts, looks.ts, player.ts (outfits), voices.ts, events.ts
  logic/              Pure, engine-free, unit-tested rules
    movement, interaction, traffic, vehicleState, metro, bikeRide, delivery,
    dialogueDirector, voiceDirector, reactionEngine, eventScheduler,
    dayClock, discovery, achievements, player, save, geometry, rng
  game/
    PhaserGame.tsx, gameHost.ts, loadGame.ts   One game instance, loaded lazily
    bridge.ts         Commands from React to the running world
    touch.ts          Shared state for on-screen controls
    audio.ts          WebAudio: procedural sound and music, voice clip playback
    art/              Procedural painters: characters, buildings, props, vehicles, animals, ground
    scenes/           BootScene (paints textures) and WorldScene (the world)
    systems/          Npc, Traffic, Vehicle, Talk, Event, Weather, DayNight, Metro, Ride (Rapido),
                      Bus, Fare (auto), Delivery, Animal, Match (IPL), and the DOM BubbleLayer
  store/uiStore.ts    Tiny external store: the world writes, React reads
  ui/                 HUD, side bar, touch controls, tour, panels (dialogue, metro/bus/Rapido picker,
                      journal, map, pause, character), main menu, footer
tests/                Vitest unit and data tests
scripts/              Browser checks: playtest.mjs, events.mjs, tour.mjs (screenshots), perf.mjs
```

---

## How it works

- **React owns the UI, Phaser owns the world.** React renders the menu, HUD and panels. Phaser runs the
  world in one game instance (`gameHost.ts`) that is created once and never recreated on re-render.
- **One-way data flow.** The world writes to `uiStore` (area, time, jobs, toasts, panels and so on), and
  React subscribes with `useSyncExternalStore`. React sends commands back through `bridge.api` (choose
  an option, book a ride, set the time).
- **Systems.** `WorldScene` creates the systems and calls their `update` each frame. Each system owns
  one concern (traffic, people, talk, events, lighting, rides…) and reaches the others through the scene.
- **Pure logic.** Rules that can be tested without a browser live in `src/logic/` (traffic stepping,
  dialogue choice, reactions, event scheduling, saves, the day clock, route planning) and are covered
  by unit tests.
- **Procedural art.** `BootScene` paints every texture on a canvas at startup from the data (looks,
  buildings, props, vehicles), so new content needs no image files.
- **Sharp text.** Speech bubbles, prompts and the name tag are DOM elements positioned over the canvas
  each frame, so text stays crisp at any zoom.
- **Performance.** Per-frame work is kept small:
  - Only things already in reach are considered for `E`.
  - Animals and lights off screen are skipped.
  - Scares, barks and glow culling run a few times a second, not every frame.
  - Lighting only updates when the light changes.
  - Background sound loops stop on the title screen and do nothing while muted.

---

## Adding content

Most content is plain data, and tests catch broken references.

| To add… | Do this |
| --- | --- |
| **A line** | Append to a pool in `src/data/dialogue.ts`. Optional conditions: `{ rain, areas, mode, player: 'm' \| 'f', time: ['morning' \| 'day' \| 'evening' \| 'night'] }` |
| **An exchange** | Add to `EXCHANGES` with a topic, and give NPCs that topic |
| **A person** | Add to `NPCS` (`src/data/npcs.ts`) with a look, a behaviour and line pools; optionally a `conversation` |
| **A conversation** | Add to `src/data/conversations.ts`. Effects: `hint`, `destination`, `stat`, `taste` (a dish), `job` (a delivery). `next: QUIZ` asks a tech question |
| **A place** | Add to `src/data/pois.ts`; `hidden: true` plus a `hint` makes it a secret |
| **A building** | Add to `BUILDINGS` in `src/data/map.ts` (styles include shop, cafe, pub, office, mall, apartment, house, temple, heritage, stadium and construction) |
| **A dish** | Add to `src/data/food.ts`, plus a `taste` effect on an order in a conversation |
| **An achievement** | Add to `src/data/achievements.ts` with a `done(progress)` check |
| **A tech question** | Add to `src/data/techQuiz.ts` |
| **A voice clip** | Put the file in `public/audio/voice/` and add it to a pool in `src/data/voices.ts` with its voice (`m`, `f`, `kid`, or none for crowds). Convert WAV takes with `afconvert -f m4af -d aac -b 64000 in.wav out.m4a` |
| **A metro station** | Add to `src/data/metro.ts` with two-way `connections`, plus a metro building in `map.ts` |
| **A bus stop** | Add to `BUS_STOPS` in `src/data/transit.ts`, plus a `busStop` prop for the shelter |
| **A rideable** | Add to `RIDEABLES` in `src/data/vehicles.ts` |
| **A street event** | Add a definition in `src/data/events.ts` and a handler in `EventSystem` |

`tests/data.test.ts` and `tests/collision.test.ts` check ids, references and conversation links. They
also check that people, exits, stops and rideables aren't inside walls, that lanes and parked rides
stay off walking routes, and that every area has something to ride within a short walk.

---

## Testing

```bash
npm test                          # unit and data tests
npm run typecheck && npm run lint
npm run dev -- --port 5199        # in one terminal
npm run e2e                       # in another: drives the real game in Chrome (37 checks)
```

The playtest walks, talks, drives, rides the metro, and checks collisions, the character screen, saves,
settings and reset; it fails on any console error. `scripts/tour.mjs` takes screenshots around the
city, `scripts/events.mjs` triggers street events and `scripts/perf.mjs` measures frame time.

---

## Building and deploying

```bash
npm run build      # outputs dist/
npm run preview    # check the production build locally
```

`dist/` is a static site: host it anywhere (GitHub Pages, Netlify, Vercel, itch.io or any web server).
The service worker caches the app for offline play; change `CACHE` in `public/sw.js` when you want
every player to drop old cached files.

### Live site (Cloudflare Pages)

The game is hosted for free on Cloudflare Pages as the project `gte-bengaluru`. Every push to `main`
runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml): it installs, typechecks, lints,
runs the unit tests, builds, and uploads `dist/` to Cloudflare. If any check fails, nothing is
deployed and the live site stays as it was. Pull requests run the same checks without deploying.
You can also start a deploy by hand from the repo's **Actions** tab (*Deploy* → *Run workflow*).

It needs one repository secret, `CLOUDFLARE_API_TOKEN` (a Cloudflare API token with the
*Account › Cloudflare Pages › Edit* permission), under **Settings → Secrets and variables → Actions**.

To deploy by hand without GitHub, run Wrangler from a folder **outside** the project (inside it,
Wrangler tries to rewrite the Vite config):

```bash
npm run build
DIST="$PWD/dist" && cd .. && npx wrangler@4 pages deploy "$DIST" --project-name gte-bengaluru --branch main
```

---

## Names, places and credits

- **Real names, simplified city.** Places, roads, lakes, metro stations, companies and shops use their
  real Bengaluru names, but the layout is simplified and not to scale, and which company sits where is
  not accurate. People, conversations and events are fictional. No business, organisation or team named
  in the game is affiliated with it or endorses it.
- **Not affiliated with Rockstar Games.** GTE-Bengaluru (Gaadi, Thindi, Enjoy) is a fan-made, non-commercial project with no
  connection to Rockstar Games or the *Grand Theft Auto* series.
- **Voices** recorded and generated for the project by Nitesh.
- **Fonts:** [Pixelify Sans](https://fonts.google.com/specimen/Pixelify+Sans) and
  [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) (SIL Open Font License).
- **Engine:** [Phaser 3](https://phaser.io) (MIT).

<p align="center"><b>Made with ♥ by Nitesh</b><br/><i>Swalpa adjust maadi.</i></p>
