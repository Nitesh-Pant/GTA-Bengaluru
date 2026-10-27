import type { Line, LinePools } from '../logic/dialogueDirector';

/**
 * Ambient and reaction lines. Roman-script Kannada / English / Hindi, the way people actually talk.
 * Add lines freely: ids are generated from pool name + index, and the director handles repetition.
 *
 * Quick glossary: maga/guru/anna (dude/boss/brother), swalpa (a little), bega (quick),
 * oota/thindi (meal/snack), male (rain), sakkath (awesome), beda (don't), saaku (enough).
 */
type When = Line['when'];
type Raw = string | [string, When];

const RAW: Record<string, Raw[]> = {
  ambient: [
    'Maga, coffee aaytha?',
    'Ee weather nodu, sakkath alva?',
    'Weekend plan yenu? Mane alli Netflix, bas.',
    'Swalpa adjust maadi, ellaru hogbeku.',
    'Arre yaar, cab cancel aaytu again.',
    'Phone charge 4% ide, pray maadi.',
    'Yen samachara? All good-aa?',
    'Bengaluru weather is the only reason I stay, guru.',
    'Bhai, yahan parking milta hi nahi.',
    'Oota aaytha? Illa andre dose hogona.',
    'Ondu nimisha, ondu nimisha… okay ten minutes.',
    'Namma ooru, namma traffic. Swalpa adjust maadi.',
    'Rent mele matte 15% hike ante, ayyo.',
    'Haudu haudu, naale nodona.',
    ['Rain baro haagide, cab book maadbeku.', { rain: false }],
    ['Umbrella illa, adjust maadkothini.', { rain: true }],
    ['Ee male nodi, office ge late, guaranteed.', { rain: true }],
    ['Indiranagar alli ondu table sigodhu kashta, guru.', { areas: ['indiranagar'] }],
    ['Marathahalli bridge cross maadodhu ondu life lesson.', { areas: ['marathahalli'] }],
    ['Lake side alli walk, BP control.', { areas: ['park'] }],
    ['Illi benne dose try maadi, life change aagutte.', { areas: ['foodlane'] }],
    ['Metro best maga, no traffic tension.', { areas: ['metrohub'] }],
  ],
  techie: [
    'Bro, quick call anta helidru… 45 minutes aaythu.',
    'Standup ge late aagutte maga!',
    'Prod down hai, aur manager bol raha "small fix".',
    'Sprint end aagtide, tension jaasti.',
    'Can you see my screen? Ivaga? Ivaga?',
    'Appraisal discussion next week. Fingers crossed, toes crossed.',
    'Let\'s take this offline… nanna mane offline ide, network illa.',
    'Deploy Friday evening? Beda guru, please beda.',
    'Notice period alli iddini, full chill.',
    'WFH Monday, office Tuesday, crying Wednesday.',
    'Jira ticket close maadidre, two new ones barutte.',
    'Hotfix push maadide. Pray maadi.',
    'Client US alli, naanu illi midnight alli. Global life.',
    'Laptop slow, mind slow, chai fast beku.',
    ['Rain alli WFH approve aagbeku legally.', { rain: true }],
  ],
  aunty: [
    'Yen magu, oota aaytha?',
    'Ee kaalada hudugaru, phone bittu nodalla.',
    'Mallige hoovu thogondu hogbeku, pooja ide.',
    'Tomato bele nodidya? Gold rate thara aagide!',
    'Pakkada mane hudga US ge hogtane ante.',
    'Saaru ge swalpa hunase jaasti haaki, adu secret.',
    'Serial alli villain matte bandlu, ayyo.',
    ['Battegalu ella oddeyaagutte, male nodi!', { rain: true }],
    'Beta, khana khaya? Thin aagbitte!',
  ],
  uncle: [
    'Namma kaaladalli ee road full kere ittu.',
    'Metro barokke munche, naavu nadkondu hogtha idvi.',
    'Ee traffic nodidre BP jaasti aagutte.',
    'Morning walk, evening walk, in between coffee.',
    'Cricket alli ivaga attitude jaasti, talent kammi.',
    'Pension bandide, filter coffee double.',
    '1985 alli ee jaaga ondu sakkath mango thopu ittu.',
    'Paper odide? Ella bad news, ondu sudoku ashte good.',
  ],
  student: [
    'Assignment naale submission, naanu ivaga reel nodtha iddini.',
    'Bro, canteen dose 20 rupees ge, best deal.',
    'Exam ge ondu week ide, so basically zero days.',
    'Internship sigtu! Unpaid, aadre LinkedIn post sigutte.',
    'Hostel food beda, illi thindi best.',
    'Bhai, notes bhej de na yaar.',
  ],
  auto: [
    'Elli hogbeku saar? Meter mele twenty.',
    'Return kaali barbeku, adke extra.',
    'Ee kade one-way, aa kade traffic. Adjust maadi.',
    'Rapido, Ola, ella bandru, aadre auto is king.',
    'Naanu 25 years inda ee road alli, every pothole nange friend.',
    'Saar, short route gothu, full speed hogthini.',
    ['Male bandre double, saar. Rules.', { rain: true }],
  ],
  chaiwala: [
    'Bisi bisi chai, ondu cutting?',
    'Bun maska fresh ide, thogoli!',
    'Sugar kammi beka? Health conscious generation.',
    'Ondu strong chai kodi, anna? Ready!',
    'Chai alli shunti haakidini, throat ge olledu.',
    ['Male time alli chai double sales, sakkath.', { rain: true }],
  ],
  cook: [
    'Dose ready! Benne extra haakla?',
    'Idli soft, chutney fresh, sambar bisi.',
    'Kitchen alli 40 degree, aadre smile maadbeku.',
    'Order ready! Token number 47!',
  ],
  shopkeeper: [
    'Banni banni, fresh stock ide!',
    'Screen guard beka saar? Original, guarantee.',
    'Last price, aadre nimge special discount.',
    'Cash or UPI? QR illi ide.',
    'Sale ide, today only. Naale kooda today only.',
  ],
  kid: [
    'Anna, ball kodi please!',
    'Out alla! Trial ball adhu!',
    'Naanu Virat, neenu bowling maadu!',
    'Amma kooginda munche ondu over aadona!',
    'Wall ge hodre out, gothaitha?',
  ],
  delivery: [
    'Ten minute delivery anta, aadre traffic forty minute.',
    'Location share maadi saar, Google map confused aagide.',
    'Rating five kodi please, mane alli EMI ide.',
    'Order cold aagthide, bega bega!',
  ],
  staff: [
    'QR ticket use maadi, fast aagutte.',
    'Mind the gap, please. Mind the gap.',
    'Next train in three minutes.',
    'Bag scan maadi, please. Safety first.',
  ],
  cop: [
    'Signal nodi hogi saar, signal!',
    'Helmet elli? Tale important alva?',
    'Yellow light andre speed maadu alla, slow maadu.',
    'Wrong side bandre fine, gothalla?',
  ],
  jogger: [
    'Ten thousand steps… currently at two hundred.',
    'Lake ondu round, aamele idli ondu plate.',
    'Running app ge photo hakbeku, illandre walk count aagalla.',
  ],
  hipster: [
    'This cafe was cooler before it got cool.',
    'Cold brew with filter kaapi notes, very artisanal.',
    'Naanu ondu podcast shuru maadthini, idea ide.',
    'Graffiti wall nodidya? Backside alli ide, very underground.',
  ],
  vendor: [
    'Mallige hoovu, ondu maaru hattu rupaayi!',
    'Elneer! Bisilu alli elneer best!',
    'Fresh tomato, kilo ge nalavattu!',
    'Akka, swalpa kammi maadi, regular customer.',
  ],
  guard: [
    'Bag scan maadi sir, rules.',
    'Mall closes at ten. Sale never closes.',
    'Parking full aagide, swalpa adjust maadi.',
  ],
  commuter: [
    'Bus number 500D ge kaaythidini since forever.',
    'Bus bandre seat sigalla, nindre sleep barutte.',
    'Metro card recharge maadbeku, nenapu maadi.',
    'Ivattu bega mane ge hogbeku. Bega andre 9pm.',
  ],

  // ── Reactions
  bump: [
    'Ayyo! Nodkondu nadi, anna!',
    'Arre bhai, dhyaan se!',
    'Swalpa nodi guru!',
    'Phone alli busy na? Swalpa mele nodi.',
    'Oops, sorry… illa, nimdu mistake!',
    'Ayyo, nanna chai chellidre?!',
  ],
  block_ped: [
    'Anna, swalpa side kodi.',
    'Excuse me, daari bidi please.',
    'Bhai, hatt jaao na yaar.',
    'Yen statue thara nintidira? Move maadi!',
    'Footpath ellarigu, swalpa adjust maadi.',
  ],
  block_vehicle: [
    'Oye! Road nimmappandha?',
    'Swalpa side kodi saar!',
    'Arre bhai, beech mein kyun khade ho?',
    'Hello! Horn kelistha? Side kodi!',
    'Guru, zebra crossing alli photo shoot aa?',
  ],
  block_vehicle_long: [
    'Guru, naanu mane ge hogbeku, today itself!',
    'Full jam maadbitri, congratulations!',
    'Ayyo, ivaga three kilometre queue aaytu nodi!',
    'Saar, nimge yaaru fan club start maadidru illi?',
  ],
  queue: [
    'Yen aagthide munde? VIP bandidara?',
    'Signal alla, idu manushya!',
    'Horn ella waste, swalpa adjust maadi.',
    'Ee jam ge ondu podcast episode saaku.',
  ],
  vehicle_near: [
    'Ayyo, slow maadi!',
    'Saar, nidhaana! Jana iddare!',
    'Arre, footpath alli drive maadthira?!',
    'Brake ide alva aa vehicle ge?',
  ],
  bump_vehicle: [
    'Anna, car ge headbutt yaake?',
    'Nodkondu nadi guru, scratch aagutte!',
    'Saar, idu bus stop alla, nanna bonnet!',
  ],
  crash: [
    'Insurance yaaru kodthare?!',
    'Ayyo nanna bumper!',
    'Licence elli thogondri? Online alli?!',
    'Swalpa nodkondu odsi guru!',
  ],
  enter_vehicle: [
    'Wah, driving! Nidhaana hogi.',
    'Licence ide alva? Just asking.',
    'Petrol bele nodi, swalpa slow odsi.',
  ],
  exit_vehicle: [
    'Parking alli ittu hogi, no-parking alli alla!',
    'Vehicle illi bitre tow aagutte, gothalla?',
    'Nadkondu hogodu best, exercise free.',
  ],
  food_visit: [
    'Illi dose sakkath, try maadi!',
    'Coffee strong ide, sugar kammi kelbeku.',
    'Ondu plate idli-vade, life set.',
    'Hotte hasivaagide, oota bega beku.',
    'Bhai, dosa khane chale?',
  ],
  metro: [
    'Token or card? QR use maadi, fast.',
    'Metro alli AC, traffic illa, heaven.',
    'Platform two ge hogi, Hub kade train.',
    'Purple line full aagide, swalpa adjust maadi.',
  ],
  rain_start: [
    'Ayyo, male bantu!',
    'Umbrella mareth bitte!',
    'Ee male yaavaglu office time ge baratte.',
    'Run! Shop shade ge hogona!',
    'Mann vaasane bantu… aadre nanna shoes!',
  ],
  rain_stop: [
    'Male nintu, ivaga traffic jaasti aagutte.',
    'Ah, chill weather. Ondu chai beku.',
    'Road alli swimming pool ready, nodi.',
  ],
  cricket_ball: ['Anna, ball kodi please!', 'Ball! Ball! Road alli hogthide!', 'Uncle, throw maadi please!'],
  cricket_thanks: ['Thank you anna! Neevu next match ge umpire!', 'Sakkath throw! Team ge join aagi!'],
  roadwork: [
    'Ayyo, ee road matte agedu bitru!',
    'Last week ashte road maadidru, ivaga matte dig!',
    'Swalpa adjust maadi, work in progress… forever.',
  ],
};

export const LINE_POOLS: LinePools = Object.fromEntries(
  Object.entries(RAW).map(([pool, lines]) => [
    pool,
    lines.map((l, i): Line => (typeof l === 'string' ? { id: `${pool}.${i}`, text: l } : { id: `${pool}.${i}`, text: l[0], when: l[1] })),
  ]),
);

/** Two-person exchanges NPCs have with each other. `who` 0/1 = first/second participant. */
export interface Exchange {
  id: string;
  topic: 'techie' | 'traffic' | 'food' | 'gossip' | 'park' | 'cricket' | 'metro' | 'rain' | 'general';
  lines: Array<{ who: 0 | 1; text: string }>;
}

const ex = (id: string, topic: Exchange['topic'], ...lines: string[]): Exchange => ({
  id,
  topic,
  lines: lines.map((text, i) => ({ who: (i % 2) as 0 | 1, text })),
});

export const EXCHANGES: Exchange[] = [
  ex('quick_call', 'techie', 'Quick sync anta helidru, 45 minutes aaytu.', 'Adu "quick" alla maga, adu lifestyle.', 'Next call "quick alignment" ante.', 'Hogi, chai kudi, survive maadi.'),
  ex('release', 'techie', 'Release Friday ge plan aagide.', 'Friday? Weekend cancel, guaranteed.', 'Manager "low risk" anta helidru.', 'Adu thumba high risk, maga.'),
  ex('startup', 'techie', 'Naanu startup shuru maadthini.', 'Yaava idea?', 'Chai delivery in four minutes.', 'Anna cart thirty seconds alli kodthare, guru.'),
  ex('wfh', 'techie', 'Office ge three days barbeku ante.', 'Matte traffic ge three days donate maadbeku.', 'Hybrid andre half traffic, half meetings.', 'Full stress, anyway.'),
  ex('bridge', 'traffic', 'Marathahalli bridge alli ondu ghante stuck aagidde.', 'Bari ondu ghante? Lucky maga.', 'Next time cycle alli barthini.', 'Cycle ge kooda signal ide, guru.'),
  ex('silkboard', 'traffic', 'Google map "15 min" antu.', 'Google ge Bengaluru gothilla.', 'Ninety minutes aaytu.', 'Adke naavu podcast kelodu.'),
  ex('auto_meter', 'traffic', 'Auto meter haakidra?', 'Meter? Adu museum piece, guru.', 'Next time metro, final.', 'Haage helthiya prathi sala.'),
  ex('benne', 'food', 'Benne dose or masala dose?', 'Yaake choose maadbeku? Eradu thogo.', 'Diet?', 'Diet Monday inda. Yaava Monday anta gottilla.'),
  ex('hindi_kannada', 'food', 'Bhai, yahan ka khana kaisa hai?', 'Sakkath! Ek baar khao, roz aaoge.', 'Menu Kannada mein hai?', 'Swalpa Kannada kalthko, beautiful language.'),
  ex('coffee', 'food', 'Filter coffee or cappuccino?', 'Filter coffee. Cappuccino andre 300 rupees foam.', 'Steel tumbler alli?', 'Bere hege kudiyodu?'),
  ex('neighbour', 'gossip', 'Pakkada mane hudga US ge hogtane ante.', 'Ayyo, alli sambar yaaru maadtare?', 'Amma ready-mix kalsthare ante.', 'Sakkath idea. Customs alli catch aagutte.'),
  ex('rent', 'gossip', 'Owner rent fifteen percent hike maadidru.', 'Salary hike three percent. Bengaluru math.', 'PG ge shift aagla?', 'PG alli WiFi illa, life illa.'),
  ex('serial', 'gossip', 'Ninne serial nodidra?', 'Howdu, villain matte bandlu!', 'Twelve years inda ade story.', 'Adke addiction, swalpa.'),
  ex('kere', 'park', 'Namma kaaladalli ee jaaga full kere.', 'Howdu, ivaga kere pakka mall.', 'Mall alli fountain ide, adu kere thara.', 'Haage aadru nodkobahudu, atleast.'),
  ex('walk', 'park', 'Ivattu five rounds aaytu.', 'Naanu two, aadre fast.', 'Aamele idli?', 'Obviously. Walk is for idli.'),
  ex('lastover', 'cricket', 'Last over, six runs beku!', 'Wall ge hodre out, gothaitha?', 'Aunty window ge hodre?', 'Adu match cancel, ellaru oodi hogbeku!'),
  ex('umpire', 'cricket', 'Adu out! Clear out!', 'Illa, adu no-ball!', 'Umpire yaaru?', 'Nanna ajji. Avaru mane olage, so no-ball.'),
  ex('purple', 'metro', 'Metro line extend aagide ante, finally.', 'Finally? Naanu college alli iddaga inda kaythidini.', 'Ivaga ninge job ide, at least.', 'Job ide, aadre office far, adke metro beku.'),
  ex('qr', 'metro', 'QR ticket or card?', 'QR. Card mane alli mareth bitte.', 'Phone charge?', 'Three percent. Pray maadi.'),
  ex('rainjoke', 'rain', 'Cab three x surge!', 'Nadkondu hogona, ten minutes ashte.', 'Male alli?', 'Free shower, guru.'),
  ex('rainroad', 'rain', 'Road alli neeru nodu!', 'Venice of the South, maga.', 'Boat beku.', 'Auto ne boat, swalpa adjust.'),
  ex('weather', 'general', 'Ee weather nodu, sakkath alva?', 'Bengaluru weather is the only reason naavu illi idivi.', 'And dose.', 'And dose. Correct.'),
  ex('kannada', 'general', 'Kannada class join aagidini!', 'Super! Yenu kalthidya?', '"Swalpa adjust maadi."', 'Ashte saaku, ninge citizenship sigutte.'),
];
