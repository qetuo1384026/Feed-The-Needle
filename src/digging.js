// Digging interaction: raycast from the crosshair at the haystack,
// straw particle bursts, and a simple shovel view-model that swings.
import * as THREE from 'three';

const DIG_RANGE = 5.0;

export class Digging {
  constructor(scene, camera, haystack, game, player) {
    this.scene = scene;
    this.camera = camera;
    this.haystack = haystack;
    this.game = game;
    this.player = player;

    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = DIG_RANGE;
    this.swingTime = 0;
    this.cooldown = 0;

    this._buildShovel();
    this._buildParticles();

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0 && this.player.locked) this.tryDig();
    });
  }

  // Low-poly shovel held bottom-right of the camera.
  _buildShovel() {
    const group = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: '#8a6238', roughness: 0.8 });
    const steelMat = new THREE.MeshStandardMaterial({ color: '#9aa2ab', roughness: 0.35, metalness: 0.85 });

    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.85, 8), woodMat);
    handle.rotation.x = Math.PI / 5;
    group.add(handle);

    const grip = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.018, 8, 16), woodMat);
    grip.position.set(0, 0.4 * Math.cos(Math.PI / 5), -0.4 * Math.sin(Math.PI / 5));
    grip.rotation.x = Math.PI / 5;
    group.add(grip);

    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.24, 0.02), steelMat);
    blade.position.set(0, -0.44 * Math.cos(Math.PI / 5), 0.44 * Math.sin(Math.PI / 5));
    blade.rotation.x = Math.PI / 5;
    group.add(blade);

    group.position.set(0.34, -0.32, -0.55);
    this.shovel = group;
    this.camera.add(group);
  }

  _buildParticles() {
    const max = 240;
    this.particleData = [];
    const geo = new THREE.BufferGeometry();
    this.particlePos = new Float32Array(max * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(this.particlePos, 3));
    this.particles = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        color: '#e0b94e',
        size: 0.07,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
      })
    );
    this.particles.frustumCulled = false;
    this.scene.add(this.particles);
  }

  // Crosshair ray against the mound; returns hit point or null.
  aimAtPile() {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const hits = this.raycaster.intersectObject(this.haystack.mesh, false);
    return hits.length ? hits[0] : null;
  }

  tryDig() {
    if (this.cooldown > 0) return;
    const hit = this.aimAtPile();
    if (!hit) return;

    const dug = this.game.dig();
    if (dug <= 0) return; // bag full — HUD shows the hint

    this.cooldown = 0.38;
    this.swingTime = 1;
    this._burst(hit.point);
  }

  _burst(point) {
    for (let i = 0; i < 22; i++) {
      if (this.particleData.length >= 240) this.particleData.shift();
      this.particleData.push({
        x: point.x, y: point.y, z: point.z,
        vx: (Math.random() - 0.5) * 3.2,
        vy: Math.random() * 3.4 + 1.2,
        vz: (Math.random() - 0.5) * 3.2,
        life: 1,
      });
    }
  }

  update(dt) {
    this.cooldown = Math.max(0, this.cooldown - dt);

    // Shovel swing: quick dip then ease back.
    if (this.swingTime > 0) {
      this.swingTime = Math.max(0, this.swingTime - dt * 3.2);
      const s = Math.sin((1 - this.swingTime) * Math.PI);
      this.shovel.rotation.x = -s * 0.9;
      this.shovel.position.z = -0.55 - s * 0.16;
    }

    // Straw particles with gravity.
    let alive = 0;
    for (const p of this.particleData) {
      p.life -= dt * 1.4;
      if (p.life <= 0) continue;
      p.vy -= 9.8 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      if (p.y < 0.03) { p.y = 0.03; p.vy = 0; }
      this.particlePos[alive * 3] = p.x;
      this.particlePos[alive * 3 + 1] = p.y;
      this.particlePos[alive * 3 + 2] = p.z;
      alive++;
    }
    this.particleData = this.particleData.filter((p) => p.life > 0);
    this.particles.geometry.setDrawRange(0, alive);
    this.particles.geometry.attributes.position.needsUpdate = true;
  }
}
