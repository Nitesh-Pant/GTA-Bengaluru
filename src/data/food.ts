/**
 * The food book: every dish you can order somewhere in the city.
 * Ordering one in a conversation (a `taste` effect) stamps it; the journal shows the book.
 */
export interface Dish {
  id: string;
  name: string;
  /** Where to find it, shown in the journal once you know the dish. */
  where: string;
  blurb: string;
}

export const DISHES: Dish[] = [
  { id: 'masala_dose', name: 'Masala Dose', where: 'Rameshwaram Cafe', blurb: 'Crisp, golden, potato palya hiding inside. The benchmark.' },
  { id: 'idli_vade', name: 'Idli-Vade', where: 'Rameshwaram Cafe', blurb: 'Two idlis, one vade, a pool of sambar. Breakfast of champions.' },
  { id: 'filter_coffee', name: 'Filter Kaapi', where: 'Hatti Kaapi', blurb: 'Steel tumbler, davara, a pour from shoulder height. The froth is the point.' },
  { id: 'cutting_chai', name: 'Cutting Chai', where: 'Anna Chai Point', blurb: 'Half a glass, full opinions.' },
  { id: 'ginger_chai', name: 'Ginger Chai', where: "Manju's Tea Point", blurb: 'Fresh ginger, a giant kettle and a cricket score.' },
  { id: 'bun_maska', name: 'Bun Maska', where: 'Anna Chai Point', blurb: 'Soft bun, extra benne. Diet starts tomorrow.' },
  { id: 'honey_cake', name: 'Honey Cake', where: 'Iyengar Bakery', blurb: 'Sticky, sweet, pink. Fifty years, same recipe.' },
  { id: 'veg_puff', name: 'Veg Puff', where: 'Iyengar Bakery', blurb: 'Flaky, spicy, fresh at four o\'clock sharp.' },
  { id: 'benne_dose', name: 'Benne Dose', where: 'Benne Dose Corner', blurb: 'Butter-soaked, Davangere style, served on a leaf.' },
  { id: 'ragi_mudde', name: 'Ragi Mudde', where: 'Ragi Mudde Mane', blurb: 'Swallow, do not chew. With soppu saaru.' },
  { id: 'donne_biryani', name: 'Donne Biryani', where: 'Shivaji Military Hotel', blurb: 'Jeera samba rice in a leaf cup. Worth the queue.' },
  { id: 'meetha_paan', name: 'Meetha Paan', where: 'Paan shop, Thippasandra', blurb: 'Gulkand, coconut, a cherry on top. Digestion, apparently.' },
  { id: 'kabbu_juice', name: 'Kabbina Haalu', where: 'Juice Junction', blurb: 'Sugarcane juice with ginger and lime, crushed in front of you.' },
  { id: 'mysore_pak', name: 'Mysore Pak', where: 'Sri Krishna Sweets', blurb: 'Ghee, gram flour, sugar. Melts before you finish the sentence.' },
  { id: 'masala_puri', name: 'Masala Puri', where: 'KR Puram Food Court', blurb: 'Crushed puri drowned in hot peas masala. Messy, perfect.' },
  { id: 'avocado_toast', name: 'Avocado Toast', where: 'Third Wave Coffee', blurb: 'Smashed, seeded, photographed. Pairs well with a laptop.' },
  { id: 'appam_stew', name: 'Appam & Stew', where: "Koshy's, MG Road", blurb: 'Lacy appam, coconut stew, ceiling fans and uncles arguing about 1983.' },
  { id: 'truffles_burger', name: 'Truffles Burger', where: 'Truffles, Koramangala', blurb: 'Thick, messy and worth the twenty-minute wait.' },
  { id: 'andhra_meals', name: 'Andhra Meals', where: 'Andhra Mess, BTM Layout', blurb: 'Unlimited rice, gunpowder podi, ghee. Tears are normal.' },
  { id: 'kesari_prasada', name: 'Kesari Bath Prasada', where: 'Ganesha pandal, Basavanagudi', blurb: 'Warm, ghee-rich and handed over in a leaf cup. Eaten standing, with gratitude.' },
  { id: 'campus_chai', name: 'Campus Chai', where: 'Tech Park Break Zone', blurb: 'The only thing that actually ships on time.' },
];

export const DISH_IDS = new Set(DISHES.map((d) => d.id));
export const dishById = (id: string) => DISHES.find((d) => d.id === id);
