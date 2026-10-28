import { useEffect, useState } from 'react';
import { bridge, type GuideKind } from '../game/bridge';
import { isTouchDevice } from '../game/touch';
import { addressOf } from '../logic/player';
import { uiStore, useUi } from '../store/uiStore';

interface Step {
  title: string;
  body: React.ReactNode;
  /** CSS selector of the thing being explained; the tour spotlights it. */
  target?: string;
  /** "Show me" buttons that mark the nearest one on the map. */
  showMe?: Array<{ kind: GuideKind; label: string }>;
}

function steps(name: string, touch: boolean): Step[] {
  const press = (key: string, tap: string) => (touch ? <b>{tap}</b> : <kbd>{key}</kbd>);
  return [
    {
      title: `Namaskara, ${name}!`,
      body: (
        <>
          Welcome to Bengaluru. There are no missions here: wander, eat, talk, ride and explore at your own pace. This quick tour shows what you
          can do. You can see it again any time from the <b>Hints</b> button.
        </>
      ),
    },
    {
      title: 'Walking around',
      body: touch ? (
        <>Drag the round pad at the bottom left to walk (or steer when driving). The big green <b>E</b> button does everything else.</>
      ) : (
        <>
          Walk with <kbd>W</kbd>
          <kbd>A</kbd>
          <kbd>S</kbd>
          <kbd>D</kbd> or the arrow keys. In a vehicle the same keys drive, <kbd>Space</kbd> is the handbrake and <kbd>H</kbd> honks.
        </>
      ),
    },
    {
      title: 'Do things with E',
      body: (
        <>
          Walk up to something and a prompt appears. Press {press('E', 'E')} to talk to people, order food at counters, feed a street dog, say hello
          to a cow, get into a vehicle, or use a metro entrance or bus stop.
        </>
      ),
    },
    {
      title: 'Where you are',
      target: '.area-card',
      body: <>Your area, the time of day, rush hour, rain, live events (power cuts, accidents, arguments) and your jobs with their timers show here.</>,
    },
    {
      title: 'Minimap and city map',
      target: '.minimap',
      body: (
        <>
          Your surroundings. Press {press('M', 'Map')} for the full city map: drag to move, scroll or pinch to zoom, and search any place to mark it
          or book a ride there.
        </>
      ),
    },
    {
      title: 'Quick buttons',
      target: '.quickbar',
      body: (
        <>
          <b>Find</b> shows the nearest bike, auto, bus stop, metro and job, with red dots leading there{touch ? '' : <> (or press <kbd>F</kbd>)</>}.
          The others change your character, switch the time of day, mute the sound, book a Rapido and open these hints again.
        </>
      ),
    },
    {
      title: 'Getting around',
      body: (
        <ul className="tour-list">
          <li>
            <b>Bikes</b>: blue Yulu e-bikes and rental scooters in every area. Walk up and press {press('E', 'E')}.
          </li>
          <li>
            <b>Autos</b> parked around the city (borrow one and pick up fares) and your <b>cousin's car</b> on 12th Main.
          </li>
          <li>
            <b>Rapido bike taxi</b>: press {press('R', 'Rapido')} and pick a place. The first captain may cancel!
          </li>
          <li>
            <b>BMTC bus</b>: stand at a bus stop, press {press('E', 'E')} and choose a stop.
          </li>
          <li>
            <b>Namma Metro</b>: three stations on the purple line. Use the entrance with {press('E', 'E')}.
          </li>
        </ul>
      ),
      showMe: [
        { kind: 'yulu', label: 'Nearest bike' },
        { kind: 'bus', label: 'Nearest bus stop' },
        { kind: 'metro', label: 'Nearest metro' },
        { kind: 'auto', label: 'Nearest auto' },
        { kind: 'car', label: "Cousin's car" },
      ],
    },
    {
      title: 'Earn and help',
      body: (
        <ul className="tour-list">
          <li>
            A bouncing <b>!</b> means someone has a job for you. Walk up and they'll tell you about it.
          </li>
          <li>
            <b>Auto fares</b>: drive any auto, slow down beside people who wave, drop them at the marker, collect the meter.
          </li>
          <li>
            <b>Food delivery</b>: ask a delivery rider (Imran, or Mallesh outside Swiggy) for an order and beat the timer.
          </li>
          <li>
            <b>Tech questions</b>: the recruiter at the Walk-in Drive, and most techies, will quiz you.
          </li>
          <li>Throw the cricket ball back to the kids, feed the dogs, and try every dish in the food book.</li>
        </ul>
      ),
    },
    {
      title: 'Settings',
      body: (
        <>
          {press('Esc', 'II')} pauses: volume, mute, character, time of day, word meanings, and save &amp; quit. Switch on <b>Show Journal</b>{' '}
          there to keep a journal of places found, the food book and achievements. Progress saves by itself.
        </>
      ),
    },
    {
      title: "That's it!",
      body: <>Swalpa adjust maadi and enjoy the city. The Hints button on the side brings this tour back any time.</>,
    },
  ];
}

/** Where the spotlight sits, re-measured when the step changes and as the layout moves. */
function useTargetRect(selector: string | undefined) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    const measure = () => setRect(selector ? (document.querySelector(selector)?.getBoundingClientRect() ?? null) : null);
    const raf = requestAnimationFrame(measure);
    const id = window.setInterval(measure, 400);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, [selector]);
  return selector ? rect : null;
}

/** First-time guided tour (also from the Hints button): spotlights each part of the screen and explains it. */
export function Tour() {
  const panel = useUi((s) => s.panel);
  const player = useUi((s) => s.player);
  const [i, setI] = useState(0);
  const open = panel === 'tour';
  const list = steps(addressOf(player), isTouchDevice());
  const step = list[Math.min(i, list.length - 1)];
  const rect = useTargetRect(open ? step.target : undefined);
  if (!open) return null;
  const close = () => {
    setI(0);
    uiStore.set({ panel: null });
  };
  const last = i >= list.length - 1;
  // Card beside the highlighted element when there's room, otherwise centred.
  const card: React.CSSProperties = {};
  if (rect) {
    const w = Math.min(340, window.innerWidth - 32);
    if (rect.right + 16 + w < window.innerWidth) card.left = rect.right + 16;
    else if (rect.left - 16 - w > 0) card.left = rect.left - 16 - w;
    else card.left = Math.max(16, (window.innerWidth - w) / 2);
    card.top = Math.max(16, Math.min(rect.top, window.innerHeight - 320));
  }
  return (
    <div className="tour" role="dialog" aria-label="Tour">
      {rect ? (
        <div className="tour-spot" style={{ left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12 }} />
      ) : (
        <div className="tour-dim" />
      )}
      <div className={rect ? 'tour-card panel' : 'tour-card tour-centre panel'} style={card}>
        <div className="tour-step muted">
          {i + 1} / {list.length}
        </div>
        <h3>{step.title}</h3>
        <div className="tour-body">{step.body}</div>
        {step.showMe && (
          <div className="tour-showme">
            {step.showMe.map((s) => (
              <button key={s.kind} className="btn" onClick={() => bridge.api?.showNearest(s.kind)}>
                Show me: {s.label}
              </button>
            ))}
          </div>
        )}
        <div className="tour-actions">
          <button className="btn" onClick={close}>
            Skip tour
          </button>
          <span className="tour-nav">
            {i > 0 && (
              <button className="btn" onClick={() => setI(i - 1)}>
                Back
              </button>
            )}
            <button className="btn btn-primary" autoFocus onClick={() => (last ? close() : setI(i + 1))}>
              {last ? "Let's explore!" : 'Next'}
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
