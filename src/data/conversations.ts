/**
 * Short optional conversations opened with E. Most are 1–3 steps and always easy to leave.
 */
export type Effect =
  | { type: 'hint'; poi: string }
  | { type: 'stat'; stat: 'chai' | 'dosa' }
  | { type: 'world'; event: 'food_visit' }
  | { type: 'taste'; dish: string }
  | { type: 'job' }
  | { type: 'destination'; poi: string }
  | { type: 'challan'; action: 'pay' | 'adjust' | 'plead' }
  | { type: 'fest'; act: 'sparkler' | 'kite' | 'cheer' };

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

/** A traffic stop: pay, try "swalpa adjust maadi", or plead you're new. PoliceSystem decides how it ends. */
const challan = (id: string, text: string, fine: number): Conversation => ({
  id,
  start: 'a',
  nodes: {
    a: {
      text,
      options: [
        { label: `Pay the challan (₹${fine})`, next: 'paid', effects: [{ type: 'challan', action: 'pay' }] },
        { label: 'Swalpa adjust maadi, sir…', next: 'verdict', effects: [{ type: 'challan', action: 'adjust' }] },
        { label: "Sir, I'm new to Bengaluru…", next: 'verdict', effects: [{ type: 'challan', action: 'plead' }] },
      ],
    },
    paid: { text: 'Receipt thogoli. Next time jaagrathe, saar. Bengaluru roads are not a racetrack.', options: [{ label: 'Sorry, sir.' }] },
    verdict: { text: '*The constable strokes his moustache and looks at you for a long, long moment…*', options: [{ label: '(Wait)' }] },
  },
});
/** An option with `next: QUIZ` asks a random tech question (see src/data/techQuiz.ts). */
export const QUIZ = 'quiz';
const EAT: Effect = { type: 'world', event: 'food_visit' };
const taste = (dish: string): Effect => ({ type: 'taste', dish });

export const CONVERSATIONS: Record<string, Conversation> = {
  // ── Festival hosts (see FESTIVALS[].host): these replace the host's usual chat on the day.
  fest_ugadi: {
    id: 'fest_ugadi',
    start: 'a',
    nodes: {
      a: {
        text: 'Ugadi habbada shubhashayagalu, {name}! Bevu-bella thogo: kahi bevu, sihi bella. Varsha poorti eradoo barutte, magu.',
        options: [{ label: 'Thank you, ajji! (Take bevu-bella)', next: 'eat', effects: [EAT, taste('bevu_bella')] }, BYE],
      },
      eat: { speaker: '', text: 'Bitter neem flowers, then sweet jaggery. Ajji watches you make a face and laughs. "That\'s life, magu."', options: [{ label: 'Hosa varshada shubhashayagalu!' }] },
    },
  },
  fest_ganesha: {
    id: 'fest_ganesha',
    start: 'a',
    nodes: {
      a: {
        text: 'Ganapati Bappa Morya! Ivattu Chaturthi, kadubu maadidivi. Ganesha ge first, aamele nimge!',
        options: [
          { label: 'Kadubu kodi, please', next: 'kadubu', effects: [EAT, taste('kadubu')] },
          { label: 'Prasada (kesari bath)', next: 'kesari', effects: [EAT, taste('kesari_prasada')] },
          BYE,
        ],
      },
      kadubu: { speaker: '', text: 'A warm kadubu, sweet coconut and jaggery inside. The dhol speeds up; somebody starts dancing.', options: [{ label: 'Ganapati Bappa Morya!' }] },
      kesari: { speaker: '', text: 'Kesari bath in a leaf cup, glistening with ghee. A marigold for your ear, too.', options: [{ label: 'Morya re!' }] },
    },
  },
  fest_rajyotsava: {
    id: 'fest_rajyotsava',
    start: 'a',
    nodes: {
      a: {
        text: 'Kannada Rajyotsavada shubhashayagalu! Ellaru ottige heli, joraagi…',
        options: [{ label: '"Siri gannadam gelge!"', next: 'cheer', effects: [{ type: 'fest', act: 'cheer' }] }, BYE],
      },
      cheer: { speaker: '', text: 'The whole crowd outside Vidhana Soudha roars it back. Flags wave, someone starts "Huttidare Kannada naadalli huttabeku" and everyone joins in.', options: [{ label: 'Jai Karnataka!' }] },
    },
  },
  fest_deepavali: {
    id: 'fest_deepavali',
    start: 'a',
    nodes: {
      a: {
        text: 'Happy Deepavali! Amma kotta sparkler box ide, ondu hacchona? Kaju katli kooda ide!',
        options: [
          { label: 'Light a sparkler', next: 'sparkler', effects: [{ type: 'fest', act: 'sparkler' }] },
          { label: 'Kaju katli, please', next: 'sweet', effects: [EAT, taste('kaju_katli')] },
          BYE,
        ],
      },
      sparkler: { speaker: '', text: 'Pinky lights it from her diya. It fizzes and spits golden sparks; you draw circles in the air.', options: [{ label: 'Happy Deepavali!' }] },
      sweet: { speaker: '', text: 'A diamond of kaju katli with a sliver of silver. Pinky watches to make sure you finish it.', options: [{ label: 'Sakkath!' }] },
    },
  },
  fest_sankranti: {
    id: 'fest_sankranti',
    start: 'a',
    nodes: {
      a: {
        text: 'Sankranti shubhashayagalu! Ellu-bella thindu olle maathaadi. Gaalipata haaradsona? Cubbon Park alli gaali sakkath ide.',
        options: [
          { label: 'Ellu-bella, please', next: 'ellu', effects: [EAT, taste('ellu_bella')] },
          { label: 'Fly a kite', next: 'kite', effects: [{ type: 'fest', act: 'kite' }] },
          BYE,
        ],
      },
      ellu: { speaker: '', text: 'Sesame, jaggery, dry coconut and a sugar figure shaped like a little parrot. Uncle insists you take two.', options: [{ label: 'Thank you, uncle!' }] },
      kite: { speaker: '', text: 'Uncle hands you a red and yellow kite and the string. A gust takes it straight up over the trees.', options: [{ label: 'Wheee!' }] },
    },
  },
  challan_red: challan('challan_red', '*Whistle!* Saar, red signal kaanistha illva? Signal jump maadidri. Licence, RC thogondu banni.', 500),
  challan_speed: challan('challan_speed', '*Whistle!* Yenu racing-aa? Speed nodi saar, illi school ide, market ide, cow ide!', 1000),
  challan_helmet: challan('challan_helmet', '*Whistle!* Helmet elli, saar? "Helmet optimistic" anta scooter mele bareditte, adu helmet alla!', 500),
  teapoint: {
    id: 'teapoint',
    start: 'a',
    nodes: {
      a: {
        text: 'Banni banni, {name}! Ondu chai? Ginger haakidini, fresh.',
        options: [
          { label: 'Ondu strong chai kodi, anna.', next: 'chai', effects: [{ type: 'stat', stat: 'chai' }, EAT, taste('ginger_chai')] },
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
      cafe: { text: 'Hatti Kaapi — steel tumbler, no nonsense. Third Wave ge laptop thogondu hogi, ellaru coding maadtidare.', options: [{ label: 'Noted!' }] },
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
          { label: 'Ondu masala dose, please', next: 'dose', effects: [{ type: 'stat', stat: 'dosa' }, EAT, taste('masala_dose')] },
          { label: 'Idli-vade mattu coffee', next: 'idli', effects: [EAT, taste('idli_vade')] },
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
        text: 'Banni {name}! Chai? Bun maska? Osmania biscuit? Yenu beku, heli.',
        options: [
          { label: 'Ondu cutting chai', next: 'chai', effects: [{ type: 'stat', stat: 'chai' }, EAT, taste('cutting_chai')] },
          { label: 'Bun maska!', next: 'bun', effects: [EAT, taste('bun_maska')] },
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
        text: 'Yen magu, oota aaytha? Illi Shivaji Military Hotel alli biryani, Ragi Mudde Mane alli mudde. Yaavudhu beku?',
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
      local: { text: 'Haha thanks bhai! Mess food beda, Nagarjuna Andhra meals best. Spice level: emotional.', options: [{ label: 'Haha!' }] },
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
          { label: 'Naanu ondu order deliver maadla?', next: 'job', effects: [{ type: 'job' }] },
          BYE,
        ],
      },
      job: { text: 'Nija? Sakkath! Order details phone ge kalsidini. Marker follow maadi, time mele reach aagi. Customer ge "five star" kelodu marebedi!', options: [{ label: 'On it!' }] },
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
      stations: { text: 'Indiranagar, Halasuru, mattu KR Puram. Innu stations "coming soon". Coming soon andre… coming soon.', options: [{ label: 'Haha, okay.' }] },
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
          { label: 'Ondu honey cake', next: 'cake', effects: [EAT, taste('honey_cake')] },
          { label: 'Veg puff ready na?', next: 'puff', effects: [EAT, taste('veg_puff')] },
          BYE,
        ],
      },
      cake: { text: 'Idho. Sticky, sweet, pink. Fifty years inda same recipe. Change maadidre customers riot maadtare.', options: [{ label: 'Perfect.' }] },
      puff: { text: 'Oven inda eega bantu. Bisi ide, ondu nimisha wait maadi… illa? Sari, nimma naalige, nimma risk.', options: [{ label: 'Ssss… worth it.' }] },
    },
  },
  guard: {
    id: 'guard',
    start: 'a',
    nodes: {
      a: {
        text: 'Mall ge hogtira? Bag scan. Weekend andre crowd nodi, parking ge ondu ghante.',
        options: [{ label: 'Ondu ghante?!', next: 'since' }, BYE],
      },
      since: { text: 'Weekend alli, haudu. Naanu six years inda illi. Nanna salary hike kooda "coming soon".', options: [{ label: 'Ayyo.' }] },
    },
  },
  // ── Food counters (each order stamps the food book)
  kaapi: {
    id: 'kaapi',
    start: 'a',
    nodes: {
      a: {
        text: 'Banni! Filter kaapi, strong or light? Sugar kammi beka andre eega heli, amele complaint illa.',
        options: [
          { label: 'Ondu strong filter kaapi', next: 'coffee', effects: [EAT, taste('filter_coffee')] },
          { label: 'Cold brew ideya?', next: 'cold' },
          BYE,
        ],
      },
      coffee: { speaker: '', text: 'He pours from shoulder height, tumbler to davara and back, without spilling a drop. The froth stands up like it has opinions. You burn your tongue. Worth it.', options: [{ label: 'Sakkath kaapi!' }] },
      cold: { text: 'Cold brew? Swami, idu filter kaapi angadi. Cold aagi beku andre ee kaapi ondu hour ittu kudiri.', options: [{ label: 'Haha, fair.' }] },
    },
  },
  bunbytes: {
    id: 'bunbytes',
    start: 'a',
    nodes: {
      a: {
        text: 'Hey! Welcome to Third Wave. Cold brew, pour-over, and today\'s special: avocado toast. Wi-Fi password is on the cup.',
        options: [
          { label: 'Ondu avocado toast, I guess', next: 'toast', effects: [EAT, taste('avocado_toast')] },
          { label: 'Toast? Dose sigalva?', next: 'price' },
          BYE,
        ],
      },
      toast: { speaker: '', text: 'It arrives on a wooden plank, photographed by three people before you touch it. Smashed avocado, seeds, chilli flakes. Surprisingly good.', options: [{ label: 'Story ge post maadtini.' }] },
      price: { text: 'Dose beku andre Rameshwaram Cafe hogi, sir. Illi charging point, AC mattu ondu cold brew. Eradu beku, ellaru eradu kade hogtare.', options: [{ label: 'Point.' }] },
    },
  },
  military: {
    id: 'military',
    start: 'a',
    nodes: {
      a: {
        text: 'Assalamu alaikum, banni! Donne biryani ready, chicken fry kooda ide. Late aadre ella khaali, aamele nanna dosh beda.',
        options: [
          { label: 'Ondu donne biryani!', next: 'biryani', effects: [EAT, taste('donne_biryani')] },
          { label: 'Yaake ishtu famous?', next: 'why' },
          BYE,
        ],
      },
      biryani: { speaker: '', text: 'Jeera samba rice, green masala, tender meat, all in a leaf cup. A raita that is mostly onion. The man next to you closes his eyes after every bite. You understand why.', options: [{ label: 'Next week matte bartini.' }] },
      why: { text: 'Donne biryani, old-school style. Recipe same, firewood same, queue kooda same. Swalpa adjust maadi, line alli nilli.', options: [{ label: 'Respect.' }] },
    },
  },
  ragi: {
    id: 'ragi',
    start: 'a',
    nodes: {
      a: {
        text: 'Banni magu. Ragi mudde, soppu saaru, swalpa palya. Oota maadi, shakti barutte.',
        options: [
          { label: 'Ondu mudde kodi, amma', next: 'mudde', effects: [EAT, taste('ragi_mudde')] },
          { label: 'Hege thinnodu?', next: 'how' },
          BYE,
        ],
      },
      mudde: { speaker: '', text: 'A smooth dark ball in a pool of green saaru. You pinch a piece, dip, and… chew. Gowramma watches you. "Agiyabedi, nungi!" You swallow. Somewhere, a farmer nods.', options: [{ label: 'Sorry amma, next time nungtini.' }] },
      how: { text: 'Ondu chikka piece, saaru alli addi, nungi. Agiyabaardu! Hallu illada ajji kooda thinnabahudu, adu namma oota.', options: [{ label: 'Nungodu. Got it.' }] },
    },
  },
  paan: {
    id: 'paan',
    start: 'a',
    nodes: {
      a: {
        text: 'Meetha paan, saada paan, fire paan? Fire paan beda, nimma face nodidre first-timer.',
        options: [
          { label: 'Meetha paan, please', next: 'paan', effects: [EAT, taste('meetha_paan')] },
          { label: 'Fire paan! Naanu ready.', next: 'fire' },
          BYE,
        ],
      },
      paan: { speaker: '', text: 'Gulkand, coconut, fennel, a glossy cherry, folded into a neat leaf triangle. It is sweet, cool and gone in four chews. Babu says it helps digestion. You choose to believe him.', options: [{ label: 'Sakkath, Babu anna.' }] },
      fire: { text: 'Hahaha! Illa sir, insurance illa nange. Meetha thogoli, naale fire nodona.', options: [{ label: 'Sari sari.' }] },
    },
  },
  campuschai: {
    id: 'campuschai',
    start: 'a',
    nodes: {
      a: {
        text: 'Chai, sir? Sprint planning aytha? Mukha nodidre aytu antha anistide.',
        options: [
          { label: 'Ondu chai, strong', next: 'chai', effects: [{ type: 'stat', stat: 'chai' }, EAT, taste('campus_chai')] },
          { label: 'Ee companies alli yaaru best?', next: 'gossip' },
          BYE,
        ],
      },
      chai: { text: 'Idho. Ee campus alli deadline miss aagutte, release miss aagutte, aadre nanna chai on time. Always.', options: [{ label: 'Only thing that ships.' }] },
      gossip: {
        text: 'Google alli free oota, adakke ellaru alli interview kodtare. Amazon alli ellaru ota, ota. EY alli blazer haakondu sweat maadtare. Microsoft alli call mugiyolla. Naanu? Nanna startup: chai.',
        options: [{ label: 'Best company, anna.' }],
      },
    },
  },
  bennedose: {
    id: 'bennedose',
    start: 'a',
    nodes: {
      a: {
        text: 'Shhh, board illa, app illa. Yaaru helidru? …Paravagilla. Ondu benne dose?',
        options: [
          { label: 'Haudu, ondu benne dose!', next: 'dose', effects: [{ type: 'stat', stat: 'dosa' }, EAT, taste('benne_dose')] },
          BYE,
        ],
      },
      dose: { speaker: '', text: 'A thick Davangere-style dose, shining with a generous scoop of benne, served on a leaf with coconut chutney. Crisp outside, soft inside, butter everywhere. You now understand the secrecy.', options: [{ label: 'Yaarigu helalla. Promise.' }] },
    },
  },
  juice: {
    id: 'juice',
    start: 'a',
    nodes: {
      a: {
        text: 'Kabbina haalu, fresh! Shunti, nimbe haaki kodtini. Bisilu alli idu amrutha.',
        options: [
          { label: 'Ondu glass kodi', next: 'juice', effects: [EAT, taste('kabbu_juice')] },
          BYE,
        ],
      },
      juice: { speaker: '', text: 'The big crusher rattles, the bells on it jingle, and green-gold juice foams into a glass with ginger and lime. Cold, sweet and gone in one go.', options: [{ label: 'Innond glass? …Illa, saaku.' }] },
    },
  },
  mysorepak: {
    id: 'mysorepak',
    start: 'a',
    nodes: {
      a: {
        text: 'Mysore pak, fresh batch! Soft beka, hard beka? Namma soft one bayalli karagutte.',
        options: [
          { label: 'Soft Mysore pak, please', next: 'pak', effects: [EAT, taste('mysore_pak')] },
          { label: 'Mysore alli invent aaythu, alva?', next: 'story' },
          BYE,
        ],
      },
      pak: { speaker: '', text: 'A golden, porous square that is mostly ghee and partly magic. It melts before you finish saying "one more". You buy a box "for home". It will not reach home.', options: [{ label: 'Box khaali aagutte.' }] },
      story: { text: 'Haudu, Mysore palace kitchen alli. Cook ge hesaru kelidru, "pak" antha helidru. Ivattu kooda adu best answer.', options: [{ label: 'Nice story!' }] },
    },
  },
  foodcourt: {
    id: 'foodcourt',
    start: 'a',
    nodes: {
      a: {
        text: 'Train ge late aagtideya? Masala puri five minutes alli ready. Cut fruit kooda ide.',
        options: [
          { label: 'Ondu masala puri', next: 'puri', effects: [EAT, taste('masala_puri')] },
          BYE,
        ],
      },
      puri: { speaker: '', text: 'Crushed puris drowned in hot peas masala, topped with onion, sev and green chutney. The plate bends. Your shirt is in danger. Delicious.', options: [{ label: 'Shirt is fine. Mostly.' }] },
    },
  },
  // ── Tech park
  campusguard: {
    id: 'campusguard',
    start: 'a',
    nodes: {
      a: {
        text: 'ID card? Illa? Visitor pass beku. Form fill maadi, photo kodi, host ge call maadi… or chai kudiyoke bandidra? Adu free entry.',
        options: [
          { label: 'Ee companies yenu maadtave?', next: 'what' },
          { label: 'Just looking around', next: 'look' },
          BYE,
        ],
      },
      what: {
        text: 'Google: search maadtare. Amazon: box kalistare. EY: slide maadtare. Microsoft: meeting maadtare. Ellaru "AI" anta heltare. Naanu gate open maadtini, adu real AI: Actual Involvement.',
        options: [{ label: 'Hahaha.' }],
      },
      look: { text: 'Sari, lawn alli nadeyiri. Benches mele kootkobedi, adu "collaboration zone". Collaborate maadbeku.', options: [{ label: 'Collaborate maadtini.' }] },
    },
  },
  intern: {
    id: 'intern',
    start: 'a',
    nodes: {
      a: {
        text: 'Hi! First week at Amazon. They gave me a laptop, a hoodie and fourteen onboarding videos. I am on video three.',
        options: [
          { label: 'Hege ide kelsa?', next: 'work' },
          { label: 'Any tips for the area?', next: 'tip' },
          { label: 'Quiz me on tech!', next: QUIZ },
          BYE,
        ],
      },
      work: { text: 'My manager said "move fast". The shuttle bus did not hear that. Marathahalli bridge took 40 minutes this morning. I learnt "swalpa adjust maadi" on day one.', options: [{ label: 'Welcome to Bengaluru!' }] },
      tip: {
        text: 'Seniors told me: chai at the break zone, dose at the darshini across the ring road, and take the metro from Halasuru. That is the whole onboarding, honestly.',
        effects: [{ type: 'destination', poi: 'metro_kp' }],
        options: [{ label: 'Thanks! Marked it.' }],
      },
    },
  },
  // ── New districts
  koshys: {
    id: 'koshys',
    start: 'a',
    nodes: {
      a: {
        text: 'Banni! Appam-stew, mutton cutlet, or just coffee and newspaper like the uncles?',
        options: [
          { label: 'Appam and stew, please', next: 'appam', effects: [EAT, taste('appam_stew')] },
          { label: 'Uncles yaaru?', next: 'uncles' },
          BYE,
        ],
      },
      appam: { speaker: '', text: 'Lacy, crisp-edged appam with a bowl of coconut stew. The fan creaks overhead. A waiter who has seen four decades of MG Road brings it without writing anything down.', options: [{ label: 'Perfect.' }] },
      uncles: { text: 'Table four? Fifty years, same table. Cricket, politics, the metro: ellaa solve maadidaare. Yaaru kelalla, aadre avaru solve maadtaane irtaare.', options: [{ label: 'Respect.' }] },
    },
  },
  truffles: {
    id: 'truffles',
    start: 'a',
    nodes: {
      a: {
        text: 'Table ge twenty minutes wait, takeaway ge five. Burger?',
        options: [{ label: 'One burger, takeaway!', next: 'burger', effects: [EAT, taste('truffles_burger')] }, BYE],
      },
      burger: { speaker: '', text: 'A tall, dripping burger in paper. You lose a fight with it on the first bite and win on the second. Koramangala nods.', options: [{ label: 'Worth it.' }] },
    },
  },
  andhramess: {
    id: 'andhramess',
    start: 'a',
    nodes: {
      a: {
        text: 'Banni! Unlimited meals: rice, podi, ghee, pappu, pickle. Spice level: normal or Andhra?',
        options: [
          { label: 'Normal, please', next: 'normal', effects: [EAT, taste('andhra_meals')] },
          { label: 'Andhra! Full spice!', next: 'andhra', effects: [EAT, taste('andhra_meals')] },
          BYE,
        ],
      },
      normal: { speaker: '', text: 'Normal here is Andhra anywhere else. Gunpowder podi, a pool of ghee, and a pickle that files a complaint against your tongue. The rice keeps coming.', options: [{ label: 'Water, please!' }] },
      andhra: { text: 'Respect. Neeru table mele ide. Prayer optional.', options: [{ label: 'Ssssss…' }] },
    },
  },
  tickets: {
    id: 'tickets',
    start: 'a',
    nodes: {
      a: {
        text: 'Match tickets? Online two minutes alli sold out, maga. Ee sala cup namde, aadre ticket nimde alla!',
        options: [{ label: 'Ee sala cup namde!', next: 'chant' }, BYE],
      },
      chant: { text: 'EE SALA CUP NAMDE! …Nodi, adu spirit. Gate hathra nintu chant maadi, vibe ge ticket beda.', options: [{ label: 'RCB! RCB!' }] },
    },
  },
  library: {
    id: 'library',
    start: 'a',
    nodes: {
      a: {
        text: 'Shhh! Library olage silence. Membership card ideya?',
        options: [{ label: 'Just looking around', next: 'look' }, BYE],
      },
      look: { text: 'Sari. Exam aspirants ge disturb maadbedi, avaru UPSC ge sleep kooda bittidare. Hora park alli running club ide, alli shout maadi.', options: [{ label: 'Shhh. Okay.' }] },
    },
  },
  pgaunty: {
    id: 'pgaunty',
    start: 'a',
    nodes: {
      a: {
        text: 'Room beka? Rules: gate 10:30 ge close, room alli cooking illa, guests lobby alli maatra. WiFi password: first rent kodi.',
        options: [
          { label: 'Food hege, aunty?', next: 'food' },
          { label: 'Rent eshtu?', next: 'rent' },
          BYE,
        ],
      },
      food: { text: 'Monday to Sunday: healthy. Dal is very healthy. Sunday special: dal with extra dal.', options: [{ label: 'Haha, sari aunty.' }] },
      rent: { text: 'Twelve thousand, food included. Food andre dal included. Electricity separate, AC andre separate-separate.', options: [{ label: 'Bengaluru rates…' }] },
    },
  },
  corn: {
    id: 'corn',
    start: 'a',
    nodes: {
      a: {
        text: 'Bisi bisi jola, {name}! Nimbe, uppu, khara haaki kodthini. Chai kooda ide.',
        options: [
          { label: 'Ondu masala corn, please', next: 'corn', effects: [EAT, taste('masala_corn')] },
          { label: 'Ondu chai', next: 'chai', effects: [{ type: 'stat', stat: 'chai' }, EAT] },
          BYE,
        ],
      },
      corn: { text: '*hands over a smoky corn* Thogoli. Aadre monkeys nodi, avu professional kallaru!', options: [{ label: 'Haha, thanks!' }] },
      chai: { text: 'Bisi chai, chali ge best. Sunrise nodkondu kudi.', options: [{ label: 'Sakkath.' }] },
    },
  },
  hilltop: {
    id: 'hilltop',
    start: 'a',
    nodes: {
      a: {
        text: 'Welcome to Hill Top Cafe! Maggi, chai, coffee. Fog is complimentary.',
        options: [
          { label: 'One plate Maggi', next: 'maggi', effects: [EAT, taste('hill_maggi')] },
          { label: 'Ondu filter coffee', next: 'coffee', effects: [EAT] },
          BYE,
        ],
      },
      maggi: { text: '*steaming bowl* Two-minute Maggi, ten-minute wait. Mountain rules, saar.', options: [{ label: 'Worth it.' }] },
      coffee: { text: 'Bisi coffee. Hold the cup with both hands, warm aagutte.', options: [{ label: 'Thanks!' }] },
    },
  },
  dhaba: {
    id: 'dhaba',
    start: 'a',
    nodes: {
      a: {
        text: 'Aao ji, baitho! Garma garam aloo paratha, makhan ke saath. Chai bhi kadak hai.',
        options: [
          { label: 'Ek aloo paratha, paaji!', next: 'paratha', effects: [EAT, taste('dhaba_paratha')] },
          { label: 'Kadak chai', next: 'chai', effects: [{ type: 'stat', stat: 'chai' }, EAT] },
          { label: 'Nandi Hills kitna door hai?', next: 'nandi' },
          BYE,
        ],
      },
      paratha: { text: '*a paratha with a slab of butter* Le lo! Sunrise dekhne ja rahe ho? Pehle pet bharo.', options: [{ label: 'Sakkath, paaji!' }] },
      chai: { text: 'Kadak chai, ekdum highway style. Neend gayab.', options: [{ label: 'Thanks!' }] },
      nandi: { text: 'Bas thoda aage, gate se hairpin shuru. Monkeys se khana bacha ke rakhna, haan!', options: [{ label: 'Got it.' }] },
    },
  },
  biker: {
    id: 'biker',
    start: 'a',
    nodes: {
      a: {
        text: 'Hey {name}! Bike alli bandra? Hairpins sakkath alva? Sunrise ge bandre, best spot gothu nange.',
        options: [{ label: 'Best spot? Tell me!', next: 'spot' }, { label: 'How do I catch the sunrise?', next: 'sunrise' }, BYE],
      },
      spot: {
        text: 'Hairpin 2 dati east kade hogi. Ondu flat boulder ide, crowd illa, full valley view. Secret, okay?',
        effects: [{ type: 'hint', poi: 'secretboulder' }],
        options: [{ label: 'Set it as my destination', effects: [{ type: 'destination', poi: 'secretboulder' }] }, { label: 'Thanks, Rohan!' }],
      },
      sunrise: {
        text: 'Sunrise Point ge hogi before six. Late aadre? Bench mele kootkoli, chai kudi, wait maadi. Sun barutte, guaranteed. Fog kooda guaranteed, swalpa.',
        options: [{ label: 'Got it, thanks!' }],
      },
    },
  },
  recruiter: {
    id: 'recruiter',
    start: 'a',
    nodes: {
      a: {
        text: 'Walk-in drive! Token thogoli. Quick technical round: one question at a time, answer and move on. Ready?',
        options: [
          { label: 'Ready! Ask me.', next: QUIZ },
          { label: 'What is the role?', next: 'role' },
          BYE,
        ],
      },
      role: { text: 'Software engineer. Requirements: five years experience in a framework that came out last year, and "team player". Salary: "as per industry standards".', options: [{ label: 'Classic. Ask me a question.', next: QUIZ }, BYE] },
    },
  },
  rider: {
    id: 'rider',
    start: 'a',
    nodes: {
      a: {
        text: 'Orders ella pile aagide, bro. Rain bandre innu double. Ondu help maadtira?',
        options: [
          { label: 'Haudu, ondu order kodi!', next: 'job', effects: [{ type: 'job' }] },
          { label: 'Hege ide delivery life?', next: 'life' },
          BYE,
        ],
      },
      job: { text: 'Sakkath! Restaurant inda pick up, customer ge drop. Timer ide, marker follow maadi. Rapido, metro, scooter, yaavdu beku adu.', options: [{ label: 'Let\'s go!' }] },
      life: { text: 'Ten minute delivery anta app heltu. Road heltu forty. Naanu madhyadalli, smile maadtha.', options: [{ label: 'Respect, anna.' }] },
    },
  },
  siteengineer: {
    id: 'siteengineer',
    start: 'a',
    nodes: {
      a: {
        text: 'Helmet illade olage barbedi! …Oh, just looking? Sari. Five-floor building, "ready in six months".',
        options: [
          { label: 'Which six months?', next: 'when' },
          { label: 'Yenu kelsa nadeetide?', next: 'work' },
          BYE,
        ],
      },
      when: { text: 'Adu kelbedi. Rain, cement shortage, permission, muhurtha. Six months is a feeling, not a date.', options: [{ label: 'Classic Bengaluru.' }] },
      work: { text: 'Third floor slab ivattu. Cement mixer bartide, swalpa side alli nilli. Hanumanthu, bricks illi tandu haaku!', options: [{ label: 'All the best!' }] },
    },
  },
  vidhana: {
    id: 'vidhana',
    start: 'a',
    nodes: {
      a: {
        text: 'Photo gate inda maatra, saar. Olage Assembly nadeetide. Sunday sanje banni, poora building lights alli hollutte.',
        options: [
          { label: 'What does the sign say?', next: 'motto' },
          BYE,
        ],
      },
      motto: { text: '"Government Work is God\'s Work." Adakke ellaa files devaru thara: yaavaga barutte anta yaarigu gothilla.', options: [{ label: 'Hahaha.' }] },
    },
  },
  pandal: {
    id: 'pandal',
    start: 'a',
    nodes: {
      a: {
        text: 'Banni banni! Ganesha darshana maadi, prasada thogoli. Raatri orchestra ide, miss maadbedi!',
        options: [
          { label: 'Prasada kodi, please', next: 'prasada', effects: [EAT, taste('kesari_prasada')] },
          { label: 'Chanda kodla?', next: 'chanda' },
          BYE,
        ],
      },
      prasada: { speaker: '', text: 'A warm spoonful of kesari bath in a leaf cup, glistening with ghee. The dhol picks up speed. Somebody hands you a marigold too.', options: [{ label: 'Ganapati Bappa Morya!' }] },
      chanda: { text: 'Chanda receipt book ready! Eshtu kodtira? …Joke, joke. Bhakti saaku, prasada thogoli.', options: [{ label: 'Haha, sari.', next: 'prasada', effects: [EAT, taste('kesari_prasada')] }] },
    },
  },
};
