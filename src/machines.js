// Automation machines: digging rigs ring the pile and balers sit by the
// sell belt. Machines materialize as their upgrade levels are purchased,
// each with a looping work animation.
import * as THREE from 'three';

const RIG_SPOTS = [
  { angle: 2.2, dist: 17.5 },
  { angle: 3.6, dist: 18.5 },
  { angle: 4.9, dist: 17.5 },
  { angle: 5.9, dist: 18.0 },
];
const BALER_SPOTS = [
  { x: 16.5, z: 17.5 },
  { x: 13.5, z: 19.5 },
];

function metalMat(color) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.7 });
}

function buildRig() {
  const rig = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.5, 1.7), metalMat('#5a5148'));
  base.position.y = 0.25;
  base.castShadow = true;
  rig.add(base);

  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 1.1), metalMat('#7a6a4a'));
  cab.position.y = 0.95;
  cab.castShadow = true;
  rig.add(cab);

  const lampMat = new THREE.MeshStandardMaterial({ color: '#222', emissive: '#39d353', emissiveIntensity: 2 });
  const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), lampMat);
  lamp.position.set(0.45, 1.5, 0.45);
  rig.add(lamp);

  // pivoting arm with scoop — animated in update()
  const armPivot = new THREE.Group();
  armPivot.position.set(0, 1.3, 0);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 2.6), metalMat('#8a7a55'));
  arm.position.z = -1.3;
  arm.castShadow = true;
  armPivot.add(arm);
  const scoop = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.5), metalMat('#9aa2ab'));
  scoop.position.set(0, -0.15, -2.6);
  scoop.castShadow = true;
  armPivot.add(scoop);
  rig.add(armPivot);

  rig.userData.armPivot = armPivot;
  rig.userData.lamp = lampMat;
  return rig;
}

function buildBaler() {
  const baler = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.0, 1.6), metalMat('#4a5a6a'));
  body.position.y = 1.0;
  body.castShadow = true;
  baler.add(body);

  const chute = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 1.4), metalMat('#3a4654'));
  chute.position.set(0, 1.5, 1.3);
  chute.rotation.x = 0.35;
  baler.add(chute);

  // hydraulic press plate — animated in update()
  const press = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.3, 1.2), metalMat('#9aa2ab'));
  press.position.set(0, 1.9, 0);
  baler.add(press);

  const lampMat = new THREE.MeshStandardMaterial({ color: '#222', emissive: '#ffb020', emissiveIntensity: 2 });
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), lampMat);
  lamp.position.set(0.9, 2.15, 0);
  baler.add(lamp);

  baler.userData.press = press;
  baler.userData.lamp = lampMat;
  return baler;
}

export class MachinePark {
  constructor(scene, upgradeState) {
    this.scene = scene;
    this.upgradeState = upgradeState;
    this.rigs = [];
    this.balers = [];
    this._phase = 0;
  }

  // Reconcile placed machines with purchased upgrade levels.
  sync() {
    const wantRigs = this.upgradeState.owned.digger;
    while (this.rigs.length < wantRigCount(wantRigs)) {
      const spot = RIG_SPOTS[this.rigs.length % RIG_SPOTS.length];
      const rig = buildRig();
      rig.position.set(Math.cos(spot.angle) * spot.dist, 0, Math.sin(spot.angle) * spot.dist);
      rig.rotation.y = -spot.angle + Math.PI / 2; // face the pile
      rig.userData.phase = Math.random() * Math.PI * 2;
      this.scene.add(rig);
      this.rigs.push(rig);
    }

    const wantBalers = this.upgradeState.owned.baler;
    while (this.balers.length < wantBalers) {
      const spot = BALER_SPOTS[this.balers.length % BALER_SPOTS.length];
      const baler = buildBaler();
      baler.position.set(spot.x, 0, spot.z);
      baler.rotation.y = Math.PI * 0.75;
      baler.userData.phase = Math.random() * Math.PI * 2;
      this.scene.add(baler);
      this.balers.push(baler);
    }
  }

  update(dt, t, running) {
    this.sync();
    for (const rig of this.rigs) {
      const p = t * 1.6 + rig.userData.phase;
      // arm dips into the pile and lifts, looping while powered
      rig.userData.armPivot.rotation.x = running ? Math.sin(p) * 0.38 - 0.12 : -0.12;
      rig.userData.lamp.emissiveIntensity = running ? 1.6 + Math.sin(t * 6 + rig.userData.phase) : 0.4;
    }
    for (const baler of this.balers) {
      const p = t * 2.2 + baler.userData.phase;
      baler.userData.press.position.y = running ? 1.9 - Math.max(0, Math.sin(p)) * 0.7 : 1.9;
      baler.userData.lamp.emissiveIntensity = running ? 1.6 + Math.sin(t * 4 + baler.userData.phase) : 0.4;
    }
  }
}

function wantRigCount(levels) {
  return Math.min(levels, RIG_SPOTS.length);
}
