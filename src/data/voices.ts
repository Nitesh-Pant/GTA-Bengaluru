/**
 * Recorded voice barks, played under the speech bubble of the matching dialogue pool.
 * A clip only plays for a speaker whose voice matches, so an aunty never speaks in a man's voice.
 * Files live in public/audio/voice/. Missing or undecodable files just stay silent.
 */
export type Voice = 'm' | 'f' | 'kid';

export interface VoiceClip {
  file: string;
  /** Who it sounds like; clips without one (crowds, announcers) fit any speaker. */
  voice?: Voice;
}

const m = (file: string): VoiceClip => ({ file, voice: 'm' });
const f = (file: string): VoiceClip => ({ file, voice: 'f' });
const kid = (file: string): VoiceClip => ({ file, voice: 'kid' });
/** Crowds and announcers: fit any speaker. */
const any = (file: string): VoiceClip => ({ file });

/**
 * Keyed by dialogue pool (see LINE_POOLS), plus `banter` (under chat-group exchanges), `argument`
 * (street arguments), `talk:<conversation>` (when you open that conversation) and `announce:<what>`
 * (one-off moments: the metro announcement, the Rapido captain asking for the OTP).
 */
export const VOICE_POOLS: Record<string, VoiceClip[]> = {
  ambient: [m('friend_greeting_01.mp3')],
  techie: [m('techie_phone_01.mp3'), m('techie_failed_deploy.m4a'), f('techie_call_01.m4a')],
  aunty: [f('aunty_greeting_01.m4a')],
  auto: [m('auto_meter_01.m4a')],
  chaiwala: [m('chai_vendor_01.mp3'), m('chai_seller_01.m4a')],
  delivery: [m('delivery_order_01.m4a')],
  kid: [kid('kid_cricket_01.m4a')],
  cricket_ball: [kid('kid_cricket_01.m4a')],
  cricket_thanks: [kid('kid_thanks_01.m4a')],
  shopkeeper: [m('shopkeeper_01.mp3')],
  vendor: [m('street_vendor.m4a')],
  commuter: [f('bus_passenger_01.mp3')],
  bump: [m('ped_near_miss_01.mp3'), m('ped_near_miss_long.m4a'), m('man_hindi_reaction_01.m4a'), f('woman_bump_01.m4a')],
  vehicle_near: [m('pedestrian_warning_01.mp3'), m('pedestrian_warning_alt_01.mp3')],
  block_ped: [m('frustrated_ped_01.mp3'), f('woman_path_01.m4a')],
  block_vehicle: [m('auto_driver_01.mp3'), m('auto_driver_alt_01.mp3')],
  block_vehicle_long: [m('traffic_stuck_01.mp3'), m('auto_driver_traffic.m4a')],
  queue: [m('traffic_stuck_01.mp3')],
  food_visit: [m('food_customer_01.mp3')],
  rain_start: [f('rain_reaction_01.mp3')],
  fan: [m('cricket_player_01.mp3'), m('cricket_fan.m4a'), any('crowd_cup_01.m4a'), any('crowd_cup_02.m4a'), any('crowd_cup_03.m4a')],
  hawk_veg: [m('market_vendor_01.m4a'), m('street_vendor.m4a')],
  hawk_paper: [m('street_vendor.m4a')],
  hawk_elneer: [m('street_vendor.m4a')],
  argument: [m('parking_argument_01.m4a'), m('parking_argument_02.m4a')],
  'talk:pgaunty': [f('pg_aunty_gate_01.m4a')],
  'talk:rider': [m('delivery_order_01.m4a')],
  'announce:metro': [any('metro_next_station_01.m4a')],
  'announce:rapido': [m('rapido_otp_01.m4a')],
  banter: [m('friends_banter.m4a')],
};

export const VOICE_FILES = [...new Set(Object.values(VOICE_POOLS).flatMap((c) => c.map((v) => v.file)))];

/** Voice from a look preset name (see LOOKS): kids, then women, otherwise men. */
export const voiceOfLook = (look: string): Voice => (/^kid/.test(look) ? 'kid' : /^(aunty|ajji)|_f\d*$/.test(look) ? 'f' : 'm');
