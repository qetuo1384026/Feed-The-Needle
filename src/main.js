// Entry point — bootstraps renderer, scene and the frame loop.
import * as THREE from 'three';
import { buildWarehouse } from './warehouse.js';
import { Haystack } from './haystack.js';
import { Player } from './player.js';
import { Game } from './game.js';
import { Digging } from './digging.js';
import { UI } from './ui.js';

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

scene.add(camera); // camera holds the shovel view-model

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
  warehouse.update(dt, t);

  // Contextual hint: what the crosshair is pointing at.
  if (player.locked) {
    if (game.carried >= game.capacity) {
      ui.setHint('袋子满了 — 运到售卖带出售(后续版本解锁)');
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
