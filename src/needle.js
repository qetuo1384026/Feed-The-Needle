// The needle: hidden at a random depth inside the pile. When enough straw
// is cleared it glints into view on the mound slope; walk up and pull it
// out to win. The metal detector reads the dig progress toward the needle.
import * as THREE from 'three';
import { TOTAL_STRANDS } from './haystack.js';

const PICKUP_RANGE = 3.0;

export class Needle {
  constructor(scene, haystack, game) {
    this.scene = scene;
    this.haystack = haystack;
    this.game = game;

    // Depth is decided at spawn: the needle sits under 82–95% of the pile.
    this.threshold = TOTAL_STRANDS * (0.05 + Math.random() * 0.13);
    this.azimuth = Math.random() * Math.PI * 2;
    this.revealed = false;
    this.collected = false;

    this.group = this._buildNeedle();
    this.group.visible = false;
    scene.add(this.group);
  }

  _buildNeedle() {
    const group = new THREE.Group();
    const silver = new THREE.MeshStandardMaterial({
      color: '#d6dde6',
      roughness: 0.15,
      metalness: 1.0,
      emissive: '#88aacc',
      emissiveIntensity: 0.25,
    });

    // shaft with a point
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.15, 10), silver);
    shaft.position.y = 0.575;
    group.add(shaft);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.18, 10), silver);
    tip.position.y = 1.24;
    group.add(tip);
    // the eye
    const eye = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.028, 8, 18), silver);
    eye.position.y = 0.08;
    group.add(eye);

    // glint light so it reads from across the warehouse
    const glint = new THREE.PointLight('#bcd6ff', 8, 9, 1.8);
    glint.position.y = 1.0;
    group.add(glint);

    group.rotation.z = 0.28; // stuck into the slope at a jaunty angle
    return group;
  }

  // Fraction of the dig between the start and the needle's depth.
  get signalProgress() {
    const digNeeded = TOTAL_STRANDS - this.threshold;
    const dug = TOTAL_STRANDS - this.haystack.remaining;
    return Math.min(1, digNeeded > 0 ? dug / digNeeded : 1);
  }

  get position() {
    return this.group.position;
  }

  update(dt, t) {
    if (this.collected) return;

    if (!this.revealed && this.haystack.remaining <= this.threshold) {
      this.revealed = true;
      this._placeOnMound();
      this.group.visible = true;
    }

    if (this.revealed) {
      // slow twinkle rotation + breathing glint
      this.group.rotation.y = t * 0.6;
      const light = this.group.children.find((c) => c.isPointLight);
      if (light) light.intensity = 6 + Math.sin(t * 3.5) * 3;
    }
  }

  // Sit on the mound's slope at the pre-chosen azimuth.
  _placeOnMound() {
    const s = this.haystack.mesh.scale.x;
    const Rs = 13 * s;
    const d = 0.5 * Rs;
    const y = 8.5 * s * Math.sqrt(Math.max(0.05, 1 - 0.25));
    this.group.position.set(Math.cos(this.azimuth) * d, Math.max(0.4, y - 0.5), Math.sin(this.azimuth) * d);
  }

  canPickUp(playerPos) {
    return this.revealed && !this.collected && playerPos.distanceTo(this.group.position) <= PICKUP_RANGE;
  }

  collect() {
    this.collected = true;
    this.game.needleFound = true;
    this.scene.remove(this.group);
  }
}
