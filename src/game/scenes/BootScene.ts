import Phaser from 'phaser';
import { LOOKS, type Look } from '../../data/looks';
import { YULU_VARIANT } from '../../data/vehicles';
import { playerLook } from '../../data/player';
import { uiStore } from '../../store/uiStore';
import { BUILDINGS, buildGround, PROPS, type PropKind } from '../../data/map';
import { CHAR_DIRS, CHAR_FRAMES, CHAR_H, CHAR_W, paintCharacterSheet } from '../art/characters';
import { drawText, ellipse, makeCanvas, outline, rect } from '../art/pixel';
import { paintBuilding } from '../art/buildings';
import { paintGround } from '../art/ground';
import { paintProp, paintSignal, paintViaduct, propKey, TEXT_PROPS } from '../art/props';
import { AMBULANCE_VARIANT, paintBoat, paintCow, paintEmergency, paintTrain, paintVehicle, paintYulu, POLICE_VARIANT } from '../art/vehicles';
import { CROW_H, CROW_W, DOG_H, DOG_W, paintCrow, paintDog, paintGarbageVan } from '../art/animals';

/** Adds `char_<id>` (3 frames x 4 directions) and its `<id>_walk_<dir>` animations. */
export function addCharacter(scene: Phaser.Scene, id: string, look: Look) {
  const key = `char_${id}`;
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.addCanvas(key, paintCharacterSheet(look))!;
  for (let row = 0; row < CHAR_DIRS.length; row++)
    for (let f = 0; f < CHAR_FRAMES; f++) tex.add(row * CHAR_FRAMES + f, 0, f * CHAR_W, row * CHAR_H, CHAR_W, CHAR_H);
  CHAR_DIRS.forEach((dir, row) => {
    const animKey = `${id}_walk_${dir}`;
    // Rebuilt textures (the player changing outfit) need fresh animations pointing at the new frames.
    if (scene.anims.exists(animKey)) scene.anims.remove(animKey);
    scene.anims.create({
      key: animKey,
      frames: [1, 0, 2, 0].map((f) => ({ key, frame: row * CHAR_FRAMES + f })),
      frameRate: 8,
      repeat: -1,
    });
  });
}

/** Paints every texture procedurally (no external assets), then starts the world. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  private addCanvas(key: string, canvas: HTMLCanvasElement) {
    if (this.textures.exists(key)) this.textures.remove(key);
    return this.textures.addCanvas(key, canvas)!;
  }

  create() {
    // Characters: 3 frames x 4 directions, plus walk animations.
    const looks = { ...LOOKS, player: playerLook(uiStore.get().player) };
    for (const [id, look] of Object.entries(looks)) addCharacter(this, id, look);
    // Vehicles
    for (let v = 0; v < 8; v++) this.addCanvas(`veh_car_${v}`, paintVehicle('car', v));
    for (const [v, kind] of [
      [POLICE_VARIANT, 'police'],
      [AMBULANCE_VARIANT, 'ambulance'],
    ] as const) {
      this.addCanvas(`veh_car_${v}`, paintEmergency(kind, 0));
      this.addCanvas(`veh_car_${v}b`, paintEmergency(kind, 1));
    }
    for (let v = 0; v < 4; v++) this.addCanvas(`veh_auto_${v}`, paintVehicle('auto', v));
    for (let v = 0; v < 2; v++) this.addCanvas(`veh_bus_${v}`, paintVehicle('bus', v));
    for (let v = 0; v < 4; v++) this.addCanvas(`veh_scooter_${v}`, paintVehicle('scooter', v));
    this.addCanvas(`veh_scooter_${YULU_VARIANT}`, paintYulu());
    this.addCanvas('train', paintTrain());
    this.addCanvas('cow', paintCow());
    this.addCanvas('groundTex', paintGround(buildGround()));
    // Buildings and props
    for (const b of BUILDINGS) this.addCanvas(`bld_${b.id}`, paintBuilding(b));
    const kinds = new Set<PropKind>(PROPS.map((p) => p.kind));
    for (const k of ['cone', 'barrier'] as PropKind[]) kinds.add(k);
    for (const k of kinds) if (!TEXT_PROPS.has(k)) this.addCanvas(`prop_${k}`, paintProp(k));
    for (const p of PROPS) if (TEXT_PROPS.has(p.kind)) this.addCanvas(propKey(p), paintProp(p.kind, p.text));
    for (const l of ['red', 'yellow', 'green'] as const) this.addCanvas(`signal_${l}`, paintSignal(l));
    this.addCanvas('viaduct', paintViaduct());
    this.addCanvas('platform', paintPlatform());
    this.addCanvas('ball', paintBall());
    this.addCanvas('marker', paintMarker());
    this.addCanvas('glow', paintGlow());
    for (let v = 0; v < 3; v++) {
      const dog = this.addCanvas(`dog_${v}`, paintDog(v));
      dog.add(0, 0, 0, 0, DOG_W, DOG_H);
      dog.add(1, 0, DOG_W, 0, DOG_W, DOG_H);
    }
    const crow = this.addCanvas('crow', paintCrow());
    crow.add(0, 0, 0, 0, CROW_W, CROW_H);
    crow.add(1, 0, CROW_W, 0, CROW_W, CROW_H);
    this.addCanvas('bbmp_van', paintGarbageVan());
    for (let v = 0; v < 2; v++) this.addCanvas(`boat_${v}`, paintBoat(v));
    this.scene.start('world');
  }
}

function paintBall() {
  const [c, ctx] = makeCanvas(6, 6);
  ellipse(ctx, 3, 3, 2.2, 2.2, '#e03131');
  rect(ctx, 2, 2, 1, 1, '#ffa8a8');
  outline(ctx, 0, 0, 6, 6);
  return c;
}

function paintMarker() {
  const [c, ctx] = makeCanvas(14, 18);
  rect(ctx, 3, 1, 8, 8, '#ffd43b');
  rect(ctx, 4, 9, 6, 2, '#ffd43b');
  rect(ctx, 5, 11, 4, 2, '#ffd43b');
  rect(ctx, 6, 13, 2, 2, '#ffd43b');
  rect(ctx, 5, 3, 4, 4, '#e8590c');
  outline(ctx, 0, 0, 14, 18);
  return c;
}

/** Station canopy that sits on the viaduct above a platform. */
function paintPlatform() {
  const [c, ctx] = makeCanvas(160, 34);
  rect(ctx, 0, 4, 160, 26, '#cfc9d9');
  rect(ctx, 0, 4, 160, 2, '#ece8f2');
  for (let x = 4; x < 156; x += 12) rect(ctx, x, 7, 8, 20, '#7048e8');
  rect(ctx, 0, 14, 160, 6, '#5f3dc4');
  drawText(ctx, 'PURPLE LINE', 58, 15, '#f8f9fa');
  rect(ctx, 0, 28, 160, 2, '#8a8494');
  outline(ctx, 0, 0, 160, 34);
  return c;
}

/** Soft white light, tinted and added on top of the night tint for lamps, shopfronts and headlights. */
function paintGlow() {
  const [c, ctx] = makeCanvas(64, 64);
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return c;
}
