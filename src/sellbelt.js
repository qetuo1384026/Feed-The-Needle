// Sell belt: a conveyor against the wall where carried hay is cashed out.
// Includes the belt model, hazard-striped floor zone and proximity check.
import * as THREE from 'three';

export const BELT_POS = new THREE.Vector3(20, 0, 14);
export const SELL_RADIUS = 3.2;

function beltTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#26262a';
  ctx.fillRect(0, 0, 64, 256);
  ctx.fillStyle = '#3d3d44';
  for (let y = 0; y < 256; y += 32) ctx.fillRect(0, y, 64, 12);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 3);
  return tex;
}

function hazardTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#b99a1f';
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = '#1c1c1c';
  for (let i = -128; i < 256; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 16, 0);
    ctx.lineTo(i + 128 + 16, 128);
    ctx.lineTo(i + 128, 128);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

export class SellBelt {
  constructor(scene) {
    const group = new THREE.Group();
    group.position.copy(BELT_POS);
    group.rotation.y = Math.PI / 4; // face the warehouse center

    const frameMat = new THREE.MeshStandardMaterial({ color: '#4b4f55', roughness: 0.5, metalness: 0.7 });
    this.beltTex = beltTexture();
    const beltMat = new THREE.MeshStandardMaterial({ map: this.beltTex, roughness: 0.85 });

    // belt bed
    const bed = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.18, 5.5), beltMat);
    bed.position.y = 0.85;
    bed.castShadow = true;
    group.add(bed);

    // side rails + legs
    for (const sx of [-0.85, 0.85]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 5.5), frameMat);
      rail.position.set(sx, 1.02, 0);
      group.add(rail);
    }
    for (const [sx, sz] of [[-0.7, -2.4], [0.7, -2.4], [-0.7, 2.4], [0.7, 2.4]]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.85, 0.1), frameMat);
      leg.position.set(sx, 0.42, sz);
      group.add(leg);
    }

    // rollers
    for (const sz of [-2.7, 2.7]) {
      const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.6, 12), frameMat);
      roller.rotation.z = Math.PI / 2;
      roller.position.set(0, 0.85, sz);
      group.add(roller);
    }

    // cash register beacon at the end
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.6, 0.35), frameMat);
    post.position.set(0, 0.8, -3.2);
    post.castShadow = true;
    group.add(post);
    const lampMat = new THREE.MeshStandardMaterial({ color: '#2c4a2c', emissive: '#39d353', emissiveIntensity: 1.6 });
    this.beacon = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), lampMat);
    this.beacon.position.set(0, 1.75, -3.2);
    group.add(this.beacon);

    // hazard zone on the floor
    const zone = new THREE.Mesh(
      new THREE.CircleGeometry(SELL_RADIUS, 32),
      new THREE.MeshBasicMaterial({ map: hazardTexture(), transparent: true, opacity: 0.28, depthWrite: false })
    );
    zone.rotation.x = -Math.PI / 2;
    zone.position.y = 0.02;
    group.add(zone);

    scene.add(group);
    this.group = group;
  }

  isPlayerInRange(pos) {
    return pos.distanceTo(BELT_POS) <= SELL_RADIUS + 0.4;
  }

  update(dt) {
    // scroll the belt so it reads as running
    this.beltTex.offset.y -= dt * 1.4;
  }

  flashSold() {
    this.beacon.material.emissiveIntensity = 5;
    setTimeout(() => { this.beacon.material.emissiveIntensity = 1.6; }, 260);
  }
}
