// First-person controller: pointer-lock mouse look, WASD movement with
// acceleration damping, and collision against warehouse walls, crates
// and the haystack mound.
import * as THREE from 'three';
import { WAREHOUSE } from './warehouse.js';

const EYE_HEIGHT = 1.7;
const WALK_SPEED = 5.2;
const SPRINT_MULT = 1.7;
const ACCEL = 14;
const PLAYER_RADIUS = 0.45;

export class Player {
  constructor(camera, domElement) {
    this.camera = camera;
    this.dom = domElement;

    this.yaw = 0;            // spawn at +z looking toward the pile at origin
    this.pitch = 0;
    this.position = new THREE.Vector3(0, EYE_HEIGHT, 17);
    this.velocity = new THREE.Vector3();
    this.keys = new Set();
    this.locked = false;

    // Static circle colliders: { x, z, r } — crates plus invisible wall margin.
    this.colliders = [
      { x: -26, z: -16, r: 1.9 }, { x: -23.6, z: -16.4, r: 1.4 },
      { x: 26, z: 14, r: 2.1 }, { x: 24.5, z: 11.5, r: 1.5 },
      { x: 27, z: -17, r: 1.7 }, { x: -27, z: 12, r: 1.2 },
      { x: -24.5, z: 14.5, r: 1.9 },
    ];
    this.haystack = null; // injected after construction

    this._bind();
  }

  _bind() {
    this.dom.addEventListener('click', () => {
      if (!this.locked) this.dom.requestPointerLock();
    });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.dom;
      document.body.classList.toggle('locked', this.locked);
    });
    document.addEventListener('mousemove', (e) => {
      if (!this.locked) return;
      this.yaw -= e.movementX * 0.0022;
      this.pitch -= e.movementY * 0.0022;
      this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch));
    });
    window.addEventListener('keydown', (e) => this.keys.add(e.code));
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
  }

  update(dt) {
    const input = new THREE.Vector3();
    if (this.locked) {
      if (this.keys.has('KeyW')) input.z -= 1;
      if (this.keys.has('KeyS')) input.z += 1;
      if (this.keys.has('KeyA')) input.x -= 1;
      if (this.keys.has('KeyD')) input.x += 1;
    }

    const speed = WALK_SPEED * (this.keys.has('ShiftLeft') ? SPRINT_MULT : 1);
    const target = new THREE.Vector3();
    if (input.lengthSq() > 0) {
      input.normalize();
      // Rotate camera-space input into world space: R_y(yaw) * input,
      // so W moves toward the look direction.
      target.set(
        input.x * Math.cos(this.yaw) + input.z * Math.sin(this.yaw),
        0,
        -input.x * Math.sin(this.yaw) + input.z * Math.cos(this.yaw)
      );
      target.multiplyScalar(speed);
    }

    this.velocity.lerp(target, 1 - Math.exp(-ACCEL * dt));
    this.position.addScaledVector(this.velocity, dt);

    this._collide();

    this.camera.position.copy(this.position);
    this.camera.quaternion.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
  }

  _collide() {
    const p = this.position;
    const hw = WAREHOUSE.width / 2 - PLAYER_RADIUS - 0.2;
    const hd = WAREHOUSE.depth / 2 - PLAYER_RADIUS - 0.2;
    p.x = Math.max(-hw, Math.min(hw, p.x));
    p.z = Math.max(-hd, Math.min(hd, p.z));

    for (const c of this.colliders) {
      const dx = p.x - c.x;
      const dz = p.z - c.z;
      const dist = Math.hypot(dx, dz);
      const min = c.r + PLAYER_RADIUS;
      if (dist < min && dist > 1e-4) {
        const push = (min - dist) / dist;
        p.x += dx * push;
        p.z += dz * push;
      }
    }

    // Keep the player out of the mound (approximate as a circle that
    // shrinks with the pile).
    if (this.haystack) {
      const r = this.haystack.surfaceRadiusAt() * 0.82 + PLAYER_RADIUS;
      const dist = Math.hypot(p.x, p.z);
      if (dist < r && dist > 1e-4) {
        p.x *= r / dist;
        p.z *= r / dist;
      }
    }
  }
}
