/**
 * Short optional conversations opened with E. Most are 1–3 steps and always easy to leave.
 */
export type Effect =
  | { type: 'hint'; poi: string }
  | { type: 'stat'; stat: 'chai' | 'dosa' }
  | { type: 'world'; event: 'food_visit' }
  | { type: 'destination'; poi: string };

export interface ConvOption {
  label: string;
  next?: string;
  effects?: Effect[];
}

export interface ConvNode {
  text: string;
  /** Overrides the NPC name, e.g. for narration. */
  speaker?: string;
  options?: ConvOption[];
  effects?: Effect[];
}

export interface Conversation {
  id: string;
  start: string;
  nodes: Record<string, ConvNode>;
}

const BYE: ConvOption = { label: 'Sari, bartini! (Leave)' };

export const CONVERSATIONS: Record<string, Conversation> = {
  teapoint: {
    id: 'teapoint',
    start: 'a',
    nodes: {
      a: {
        text: 'Banni banni! Ondu chai? Ginger haakidini, fresh.',
        options: [
          { label: 'Ondu strong chai kodi, anna.', next: 'chai', effects: [{ type: 'stat', stat: 'chai' }, { type: 'world', event: 'food_visit' }] },
          { label: 'Yenu news, anna?', next: 'news' },
          BYE,
        ],
      },
      chai: { text: '*steaming glass of chai* Bisi bisi. Cricket score nodidra? Namma team gelthide!', options: [{ label: 'Sakkath! Thanks anna.' }] },
      news: {
        text: 'Marathahalli alli matte road agedu bittidare. Metro hidkondu hogi, olledu. Mattu… 12th Main hinde ondu wall ide, artists ella alli paint maadtare.',
        effects: [{ type: 'hint', poi: 'graffiti' }],
        options: [{ label: 'Interesting! Nodtini.' }],
      },
    },
  },
  priya: {
    id: 'priya',
    start: 'a',
    nodes: {
      a: {
        text: 'Sorry, one sec — "Yes, I can hear you. Can you hear me? …Hello?" — Ugh. Hi. Release week.',
        options: [
          { label: 'Release hege hogtide?', next: 'release' },
          { label: 'Chai break thogoli!', next: 'break' },
          BYE,
        ],
      },
      release: { text: 'Manager "low risk, small change" anta helidru. Three hundred files change aagide. Pray for me.', options: [{ label: 'All the best!' }] },
      break: { text: 'Chai break? Tech park Break Zone alli best chai ide. Calendar alli "focus time" haaki, oodi hogi.', effects: [{ type: 'hint', poi: 'breakzone' }], options: [{ label: 'Smart.' }] },
    },
  },
  kavya: {
    id: 'kavya',
    start: 'a',
    nodes: {
      a: {
        text: 'Hey! Neevu illi new aa? Indiranagar is basically cafes connected by traffic.',
        options: [
          { label: 'Yaavudhu best cafe?', next: 'cafe' },
          { label: 'Something off the usual map?', next: 'secret' },
          BYE,
        ],
      },
      cafe: { text: 'Filter Kaapi Co. — steel tumbler, no nonsense. Bun & Bytes ge laptop thogondu hogi, ellaru coding maadtidare.', options: [{ label: 'Noted!' }] },
      secret: {
        text: 'Okay don\'t tell anyone: 12th Main lane alli mural wall hinde ondu gully ide. Artists paint there every month. Very underground.',
        effects: [{ type: 'hint', poi: 'graffiti' }],
        options: [{ label: 'Set it as my destination', effects: [{ type: 'destination', poi: 'graffiti' }] }, { label: 'Cool, thanks.' }],
      },
    },
  },
  raju: {
    id: 'raju',
    start: 'a',
    nodes: {
      a: {
        text: 'Namaskara saar! Naanu Raju. Ee auto nanna jeevana. Lunch break ide, swalpa ottu nimge ondu round kodtini.',
        options: [
          { label: 'Nijavaagi? Thank you anna!', next: 'yes' },
          { label: 'Meter haakthira?', next: 'meter' },
          { label: 'Traffic hege ide?', next: 'traffic' },
          BYE,
        ],
      },
      yes: { text: 'Auto pakka hogi, E press maadi. Ondu round ashte, scratch maadbedi. Marathahalli junction alli cow ide, respect kodi.', options: [{ label: 'Promise!' }] },
      meter: { text: 'Meter? Haha! Saar, meter haakidre nanna family ge oota yaaru kodthare? Joke joke. Metro station inda short ride, fair price.', options: [{ label: 'Fair enough.' }] },
      traffic: { text: 'Outer Ring Road alli ivattu okay. Marathahalli alli matte roadwork. Shortcut beka? Hardware shop mattu tailor madhye ondu gully ide.', effects: [{ type: 'hint', poi: 'shortcut' }], options: [{ label: 'Thanks, anna!' }] },
    },
  },
  shetty: {
    id: 'shetty',
    start: 'a',
    nodes: {
      a: {
        text: 'Banni! Token thogoli. Menu: masala dose, benne dose, idli-vade, kesari bath, filter coffee.',
        options: [
          { label: 'Ondu masala dose, please', next: 'dose', effects: [{ type: 'stat', stat: 'dosa' }, { type: 'world', event: 'food_visit' }] },
          { label: 'Idli-vade mattu coffee', next: 'idli', effects: [{ type: 'world', event: 'food_visit' }] },
          { label: 'Queue yaake ishtu doddadu?', next: 'queue' },
          { label: 'Just looking (Leave)' },
        ],
      },
      dose: { speaker: '', text: 'You stand at the steel counter. The dose is golden, crisp at the edges, soft where the potato palya hides. The chutney is suspiciously perfect. 10/10.', options: [{ label: 'Sakkath!' }] },
      idli: { speaker: '', text: 'Two idlis, one vade, a pool of sambar. The coffee arrives in a steel davara, frothed from shoulder height. A man next to you nods approvingly.', options: [{ label: 'Bliss.' }] },
      queue: {
        text: 'Instagram alli video bantu, eega ellaru illi. Original benne dose beka andre — chai stall pakka chikka daari alli hogi, south side. Yaarigu helbedi.',
        effects: [{ type: 'hint', poi: 'bennedose' }],
        options: [{ label: 'Secret safe with me.' }],
      },
    },
  },
  annachai: {
    id: 'annachai',
    start: 'a',
    nodes: {
      a: {
        text: 'Chai? Bun maska? Osmania biscuit? Yenu beku, heli.',
        options: [
          { label: 'Ondu cutting chai', next: 'chai', effects: [{ type: 'stat', stat: 'chai' }, { type: 'world', event: 'food_visit' }] },
          { label: 'Bun maska!', next: 'bun', effects: [{ type: 'world', event: 'food_visit' }] },
          { label: 'Gossip yenu, anna?', next: 'gossip' },
          BYE,
        ],
      },
      chai: { text: 'Idho, cutting. Glass vaapas kodi, aa glass namma family member.', options: [{ label: 'Haha, sure.' }] },
      bun: { text: 'Bun maska with extra benne. Diet naale inda, okay?', options: [{ label: 'Naale inda. Promise.' }] },
      gossip: {
        text: 'Maidan pakka ondu hale aalada mara ide — doddamara. Uncles ella alli kootkondu politics maathadtare. Sunset alli sakkath kaanutte.',
        effects: [{ type: 'hint', poi: 'banyan' }],
        options: [{ label: 'Hogi nodtini.' }],
      },
    },
  },
  shantamma: {
    id: 'shantamma',
    start: 'a',
    nodes: {
      a: {
        text: 'Yen magu, oota aaytha? Illi Military Hotel alli biryani, Ragi Mudde Mane alli mudde. Yaavudhu beku?',
        options: [
          { label: 'Ragi mudde hege thinodu?', next: 'mudde' },
          { label: 'Ee area alli special jaaga?', next: 'banyan' },
          BYE,
        ],
      },
      mudde: { text: 'Agiyabaardu! Swallow maadu, saaru jothe. Nanna ajji haage helthidru. Strong aagthiya.', options: [{ label: 'Okay aunty!' }] },
      banyan: {
        text: 'Maidan pakka doddamara ide. Nanna maduve aadaga kooda adu alli ittu. Katte mele kootkondu gaali thogo.',
        effects: [{ type: 'hint', poi: 'banyan' }],
        options: [{ label: 'Set it as my destination', effects: [{ type: 'destination', poi: 'banyan' }] }, { label: 'Thank you aunty.' }],
      },
    },
  },
  ramesh: {
    id: 'ramesh',
    start: 'a',
    nodes: {
      a: {
        text: 'Good morning! Naanu ivattu seven rounds. Doctor three helidru, aadre motivation jaasti.',
        options: [
          { label: 'Park alli best spot yaavudhu?', next: 'bench' },
          { label: 'Ee lake hale kaala hege ittu?', next: 'history' },
          BYE,
        ],
      },
      bench: {
        text: 'Lake south-east side alli bushes hinde ondu bench ide. Yaarigu gothilla. Sunrise alli swarga.',
        effects: [{ type: 'hint', poi: 'kerebench' }],
        options: [{ label: 'Set it as my destination', effects: [{ type: 'destination', poi: 'kerebench' }] }, { label: 'Thanks, uncle!' }],
      },
      history: { text: 'Namma kaaladalli ee lake doddadu, Marathahalli thanka neeru. Ivaga apartments. Aadre birds innu barthave, adu khushi.', options: [{ label: 'Beautiful.' }] },
    },
  },
  gowda: {
    id: 'gowda',
    start: 'a',
    nodes: {
      a: {
        text: 'Signal nodi hogi! …Oh, neevu nadkondu barthidira. Good. Zebra crossing use maadi, adu decoration alla.',
        options: [
          { label: 'Ee junction yaavaglu ishtu busy-aa?', next: 'busy' },
          { label: 'Aa cow yaaradu?', next: 'cow' },
          BYE,
        ],
      },
      busy: { text: 'Morning nine, evening six — war zone. Madhyana — just busy. Roadwork bere. Swalpa adjust maadi, ellaru mane ge hogthare.', options: [{ label: 'Respect, sir.' }] },
      cow: { text: 'Avalu Gowri. Junction ge nanaginta senior. Avalige signal rules apply aagalla.', options: [{ label: 'Fair.' }] },
    },
  },
  rakesh: {
    id: 'rakesh',
    start: 'a',
    nodes: {
      a: {
        text: 'Bro, naanu PG alli irthini, Bihar inda. Kannada swalpa swalpa kalthidini. "Swalpa adjust maadi" — correct-aa?',
        options: [
          { label: 'Perfect! Neevu local ivaga.', next: 'local' },
          { label: 'Shortcuts gothideya?', next: 'shortcut' },
          BYE,
        ],
      },
      local: { text: 'Haha thanks bhai! Mess food beda, Andhra Meals best. Spice level: emotional.', options: [{ label: 'Haha!' }] },
      shortcut: {
        text: 'Haan bhai! Hardware shop aur tailor ke beech ek gully hai — main road skip karke market pahunch jaate ho. Life saver.',
        effects: [{ type: 'hint', poi: 'shortcut' }],
        options: [{ label: 'Set it as my destination', effects: [{ type: 'destination', poi: 'shortcut' }] }, { label: 'Thanks, bhai.' }],
      },
    },
  },
  imran: {
    id: 'imran',
    start: 'a',
    nodes: {
      a: {
        text: 'Order wait maadtha iddini. Restaurant "two minutes" antu, twenty aaytu.',
        options: [
          { label: 'Best food yelli sigutte illi?', next: 'food' },
          BYE,
        ],
      },
      food: {
        text: 'Delivery boy secret: Benne Dose Corner. Chai stall pakka chikka lane, south. No app, no rating, only taste.',
        effects: [{ type: 'hint', poi: 'bennedose' }],
        options: [{ label: 'Set it as my destination', effects: [{ type: 'destination', poi: 'bennedose' }] }, { label: 'Thanks, Imran!' }],
      },
    },
  },
  metrostaff: {
    id: 'metrostaff',
    start: 'a',
    nodes: {
      a: {
        text: 'Namaskara! Entrance hathra hogi E press maadi, destination select maadi. QR ticket automatic.',
        options: [
          { label: 'Yaava stations ide?', next: 'stations' },
          BYE,
        ],
      },
      stations: { text: 'Ivaga Indiranagar mattu Central Metro Hub. Hosa stations "coming soon". Coming soon andre… coming soon.', options: [{ label: 'Haha, okay.' }] },
    },
  },
  chintu: {
    id: 'chintu',
    start: 'a',
    nodes: {
      a: {
        text: 'Anna, neevu bowling maadthira? Naavu one player short!',
        options: [
          { label: 'Ondu ball haakthini!', next: 'bowl' },
          { label: 'Next time, Chintu.' },
        ],
      },
      bowl: { speaker: '', text: 'You bowl a gentle off-spinner. Chintu smashes it into the wall. "SIX!" "WALL ANDRE OUT!" A heated debate follows. Everyone is happy.', options: [{ label: 'Classic.' }] },
    },
  },
  iyengar: {
    id: 'iyengar',
    start: 'a',
    nodes: {
      a: {
        text: 'Honey cake fresh ide! Veg puff four o\'clock ge. Dil pasand beka?',
        options: [
          { label: 'Ondu honey cake', next: 'cake', effects: [{ type: 'world', event: 'food_visit' }] },
          BYE,
        ],
      },
      cake: { text: 'Idho. Sticky, sweet, pink. Fifty years inda same recipe. Change maadidre customers riot maadtare.', options: [{ label: 'Perfect.' }] },
    },
  },
  guard: {
    id: 'guard',
    start: 'a',
    nodes: {
      a: {
        text: 'Mall ge hogtira? Bag scan. Sale nodi, "Flat 70%". Adu yaavaglu ide.',
        options: [{ label: 'Since when?', next: 'since' }, BYE],
      },
      since: { text: 'Naanu join aadaga inda. Six years. Nanna salary hike kooda "coming soon".', options: [{ label: 'Ayyo.' }] },
    },
  },
};
