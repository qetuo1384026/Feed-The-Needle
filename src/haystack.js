// The giant haystack: a noise-displaced mound whose size tracks remaining strands.
import * as THREE from 'three';
import { strawTexture } from './textures.js';

export const TOTAL_STRANDS = 6_000_000;
const BASE_RADIUS = 13;
const BASE_HEIGHT = 8.5;
const MIN_SCALE = 0.06;

function hash(x, y, z) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}

function buildMoundGeometry() {
  const geo = new THREE.SphereGeometry(BASE_RADIUS, 64, 40, 0, Math.PI * 2, 0, Math.PI / 2);
  geo.scale(1, BASE_HEIGHT / BASE_RADIUS, 1);

  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const n =
      hash(Math.round(v.x * 0.8), Math.round(v.y * 0.8), Math.round(v.z * 0.8)) * 0.55 +
      hash(Math.round(v.x * 2.3), Math.round(v.y * 2.3), Math.round(v.z * 2.3)) * 0.3;
    const bulge = 1 + (n - 0.4) * 0.16;
    v.x *= bulge;
    v.z *= bulge;
    v.y *= 1 + (n - 0.4) * 0.1;
    if (v.y < 0.05) v.y = 0;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

export class Haystack {
  constructor(scene) {
    this.remaining = TOTAL_STRANDS;

    const tex = strawTexture();
    tex.repeat.set(6, 4);
    this.material = new THREE.MeshStandardMaterial({
      map: tex,
      color: '#d8b04a',
      roughness: 0.95,
      metalness: 0.0,
    });

    this.mesh = new THREE.Mesh(buildMoundGeometry(), this.material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.name = 'haystack';
    scene.add(this.mesh);

    // Skirt of loose straw around the base for silhouette breakup.
    const skirtGeo = new THREE.TorusGeometry(BASE_RADIUS * 0.98, 1.1, 8, 48);
    const skirt = new THREE.Mesh(skirtGeo, this.material);
    skirt.rotation.x = Math.PI / 2;
    skirt.position.y = 0.35;
    skirt.scale.z = 0.45;
    skirt.receiveShadow = true;
    this.mesh.add(skirt);
    this.skirt = skirt;

    this._updateScale();
  }

  // Remove strands; returns actual amount removed.
  removeStrands(n) {
    const removed = Math.min(n, this.remaining);
    this.remaining -= removed;
    this._updateScale();
    return removed;
  }

  get fraction() {
    return this.remaining / TOTAL_STRANDS;
  }

  get isCleared() {
    return this.remaining <= 0;
  }

  // Mound volume ~ scale^3, so uniform scale follows the cube root of the
  // remaining fraction. Floor at MIN_SCALE so the last strands stay visible.
  _updateScale() {
    const s = Math.max(MIN_SCALE, Math.cbrt(this.fraction));
    this.mesh.scale.setScalar(s);
  }

  // Approximate surface height at a horizontal distance from the center,
  // used to place the needle inside the pile and machines on the ground.
  surfaceRadiusAt() {
    return BASE_RADIUS * this.mesh.scale.x;
  }
}
