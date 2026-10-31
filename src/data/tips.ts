/**
 * "Did you know?" nudges, each shown once, the first time you're near the thing (see TipSystem).
 * They point out the small features that are easy to walk past.
 */
export const TIPS = {
  dog: 'Street dogs love a biscuit. Walk up and press E: the dog will follow you around.',
  crows: 'Crows! Walk right up to them and watch them scatter.',
  yulu: 'That blue Yulu e-bike is free to ride. Walk up and press E.',
  auto: 'Autos wearing a yellow ! can be borrowed: just drive around, or earn fares.',
  metro: 'Namma Metro! Press E at the entrance to ride the purple line.',
  bus: 'A bus stop. Press E and pick where the next bus should take you.',
  cow: "That's Gowri, the junction cow. Press E to say hello.",
  cricket: 'Gully cricket! If the ball rolls onto the road, press E to throw it back.',
  monkey: "Careful: the monkeys here snatch any food you've just bought.",
  cop: 'Traffic police. Speed or jump a red light near them and you get a challan.',
  photo: 'Nice view! Press P (or Photo) to turn it into a postcard.',
  bucket: 'Not sure what to do next? Tap the Bucket list on the area card: dozens of things to try.',
} as const;

export type TipId = keyof typeof TIPS;
export const TIP_IDS = Object.keys(TIPS) as TipId[];
