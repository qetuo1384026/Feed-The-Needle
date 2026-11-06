// Entry point — bootstraps renderer, scene and the frame loop.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildWarehouse } from './warehouse.js';
import { Haystack } from './haystack.js';

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
camera.position.set(18, 7, 18);

// Temporary orbit rig for scene review — replaced by the FPS controller
// in the player-controls feature branch.
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 3.5, 0);
controls.maxPolarAngle = Math.PI / 2 - 0.05;
controls.enableDamping = true;

const warehouse = buildWarehouse(scene);
const haystack = new Haystack(scene);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  controls.update();
  warehouse.update(dt, t);
  renderer.render(scene, camera);
});
