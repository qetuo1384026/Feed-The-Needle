// Entry point — bootstraps renderer, scene and the frame loop.
import * as THREE from 'three';
import { buildWarehouse } from './warehouse.js';
import { Haystack } from './haystack.js';
import { Player } from './player.js';
import { Game, formatMoney, formatNumber } from './game.js';
import { Digging } from './digging.js';
import { UI } from './ui.js';
import { SellBelt } from './sellbelt.js';
import { UpgradeState } from './upgrades.js';
import { MachinePark } from './machines.js';
import { Needle } from './needle.js';

const app = document.getElementById('app');

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);

const warehouse = buildWarehouse(scene);
const haystack = new Haystack(scene);
const player = new Player(camera, renderer.domElement);
player.haystack = haystack;
const game = new Game(haystack);
const digging = new Digging(scene, camera, haystack, game, player);
const ui = new UI(game);
const sellBelt = new SellBelt(scene);
const upgradeState = new UpgradeState();
ui.upgradeState = upgradeState;
const machines = new MachinePark(scene, upgradeState);
const needle = new Needle(scene, haystack, game);

scene.add(camera); // camera holds the shovel view-model

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyB') {
    ui.toggleShop();
  } else if (e.code === 'KeyE' && player.locked) {
    if (needle.canPickUp(player.position)) {
      needle.collect();
      ui.showWin(game);
    } else if (sellBelt.isPlayerInRange(player.position)) {
      const earned = game.sellAll();
      if (earned > 0) {
        sellBelt.flashSold();
        ui.toast(`售出干草 +${formatMoney(earned)}`);
      }
    }
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  player.update(dt);
  digging.update(dt);
  sellBelt.update(dt);
  game.autoTick(dt);
  machines.update(dt, t, game.autoRate > 0 && !haystack.isCleared);
  needle.update(dt, t);
  warehouse.update(dt, t);

  // Metal detector readout: signal strength always; direction at level 2.
  let relAngle = null;
  if (game.detectorLevel >= 2) {
    const dx = needle.revealed ? needle.position.x - player.position.x : needle.azimuth;
    if (needle.revealed) {
      const dz = needle.position.z - player.position.z;
      const target = Math.atan2(-dx, -dz); // world angle matching yaw convention
      relAngle = Math.atan2(Math.sin(player.yaw - target), Math.cos(player.yaw - target));
    } else {
      // pre-reveal the detector only senses a vague region
      relAngle = Math.sin(t * 0.4) * 1.2;
    }
  }
  ui.updateDetector(game.detectorLevel, needle.signalProgress, relAngle);

  // Contextual hint: needle pickup > sell belt > digging.
  if (player.locked && !ui.shopOpen && !game.needleFound) {
    const nearBelt = sellBelt.isPlayerInRange(player.position);
    if (needle.canPickUp(player.position)) {
      ui.setHint('E — 拔出那根针!');
    } else if (nearBelt && game.carried > 0) {
      ui.setHint(`E — 出售 ${formatNumber(game.carried)} 根干草`);
    } else if (nearBelt) {
      ui.setHint('售卖带 — 先去挖些干草');
    } else if (game.carried >= game.capacity) {
      ui.setHint('袋子满了 — 去售卖带出售(E)');
    } else if (digging.aimAtPile()) {
      ui.setHint('左键 — 挖掘');
    } else {
      ui.setHint('');
    }
  } else {
    ui.setHint('');
  }

  renderer.render(scene, camera);
});
