// Locked-warehouse interior: floor, walls, ceiling, hanging lamps, crates,
// light shafts and floating dust. Warm dim industrial atmosphere.
import * as THREE from 'three';
import { concreteTexture, corrugatedTexture, crateTexture } from './textures.js';

export const WAREHOUSE = {
  width: 64,   // x
  depth: 44,   // z
  height: 13,  // y
};

export function buildWarehouse(scene) {
  const { width, depth, height } = WAREHOUSE;
  const group = new THREE.Group();
  group.name = 'warehouse';

  // --- Floor ---
  const floorTex = concreteTexture();
  floorTex.repeat.set(8, 6);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.9, metalness: 0.05 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.name = 'floor';
  group.add(floor);

  // --- Walls ---
  const wallTex = corrugatedTexture();
  wallTex.repeat.set(10, 2);
  const wallMat = new THREE.MeshStandardMaterial({
    map: wallTex,
    roughness: 0.75,
    metalness: 0.35,
  });

  const wallDefs = [
    { w: width, pos: [0, height / 2, -depth / 2], rotY: 0 },
    { w: width, pos: [0, height / 2, depth / 2], rotY: Math.PI },
    { w: depth, pos: [-width / 2, height / 2, 0], rotY: Math.PI / 2 },
    { w: depth, pos: [width / 2, height / 2, 0], rotY: -Math.PI / 2 },
  ];
  for (const def of wallDefs) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(def.w, height), wallMat);
    wall.position.set(...def.pos);
    wall.rotation.y = def.rotY;
    wall.receiveShadow = true;
    group.add(wall);
  }

  // --- Ceiling with exposed beams ---
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshStandardMaterial({ color: '#2a2b2e', roughness: 0.95 })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = height;
  group.add(ceiling);

  const beamMat = new THREE.MeshStandardMaterial({ color: '#3a2e22', roughness: 0.85 });
  for (let i = -3; i <= 3; i++) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(width, 0.5, 0.6), beamMat);
    beam.position.set(0, height - 0.3, (i * depth) / 8);
    group.add(beam);
  }

  // --- High windows (emissive only — the light source illusion) ---
  const winMat = new THREE.MeshStandardMaterial({
    color: '#1c2530',
    emissive: '#8fb4d8',
    emissiveIntensity: 0.55,
    roughness: 0.4,
  });
  for (let i = -2; i <= 2; i++) {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), winMat);
    win.position.set(i * 10, height - 3, -depth / 2 + 0.05);
    group.add(win);
  }

  // --- Hanging industrial lamps ---
  const lampGroup = new THREE.Group();
  const shadeMat = new THREE.MeshStandardMaterial({ color: '#24303a', roughness: 0.5, metalness: 0.6, side: THREE.DoubleSide });
  const bulbMat = new THREE.MeshStandardMaterial({ color: '#fff2cf', emissive: '#ffd98a', emissiveIntensity: 2.2 });
  const lampPositions = [
    [-14, -10], [0, -10], [14, -10],
    [-14, 8], [0, 8], [14, 8],
  ];
  for (const [x, z] of lampPositions) {
    const lamp = new THREE.Group();
    const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2), shadeMat);
    cord.position.y = height - 1.1;
    lamp.add(cord);

    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.7, 24, 1, true), shadeMat);
    shade.position.y = height - 2.4;
    lamp.add(shade);

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), bulbMat);
    bulb.position.y = height - 2.65;
    lamp.add(bulb);

    const light = new THREE.PointLight('#ffca7a', 30, 26, 1.8);
    light.position.y = height - 2.8;
    lamp.add(light);

    lamp.position.set(x, 0, z);
    lampGroup.add(lamp);
  }
  group.add(lampGroup);

  // --- Key light with shadows over the pile ---
  const key = new THREE.SpotLight('#ffe1a8', 260, 40, Math.PI / 4.4, 0.45, 1.6);
  key.position.set(0, height - 2.2, 0);
  key.target.position.set(0, 0, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0004;
  group.add(key, key.target);

  // Cool fill from the windows side, warm ambient base.
  group.add(new THREE.HemisphereLight('#33404f', '#1f1710', 0.5));
  const fill = new THREE.DirectionalLight('#7f9cc0', 0.35);
  fill.position.set(-10, height - 2, -depth / 2 + 2);
  group.add(fill);

  // --- Crates and pallets around the walls ---
  const crateTex = crateTexture();
  const crateMat = new THREE.MeshStandardMaterial({ map: crateTex, roughness: 0.85 });
  const crateDefs = [
    { s: [2.2, 2.2, 2.2], p: [-26, 1.1, -16], r: 0.2 },
    { s: [1.6, 1.6, 1.6], p: [-23.6, 0.8, -16.4], r: -0.3 },
    { s: [1.6, 1.6, 1.6], p: [-25.4, 3.0, -16.2], r: 0.5 },
    { s: [2.6, 1.4, 2.0], p: [26, 0.7, 14], r: 0.1 },
    { s: [1.8, 1.8, 1.8], p: [24.5, 0.9, 11.5], r: 0.7 },
    { s: [2.0, 2.0, 2.0], p: [27, 1.0, -17], r: -0.15 },
    { s: [1.4, 1.4, 1.4], p: [-27, 0.7, 12], r: 0.9 },
    { s: [2.4, 1.8, 1.8], p: [-24.5, 0.9, 14.5], r: -0.4 },
  ];
  for (const c of crateDefs) {
    const crate = new THREE.Mesh(new THREE.BoxGeometry(...c.s), crateMat);
    crate.position.set(...c.p);
    crate.rotation.y = c.r;
    crate.castShadow = true;
    crate.receiveShadow = true;
    group.add(crate);
  }

  // --- Floating dust motes ---
  const dustCount = 900;
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * width * 0.9;
    dustPos[i * 3 + 1] = Math.random() * height * 0.85 + 0.5;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * depth * 0.9;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({
      color: '#e8d9b0',
      size: 0.045,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  dust.name = 'dust';
  group.add(dust);

  scene.add(group);

  // Warm haze so the far walls fall off into shadow.
  scene.fog = new THREE.FogExp2('#1c1712', 0.016);
  scene.background = new THREE.Color('#16120d');

  return {
    group,
    // Slow drift for the dust, called once per frame.
    update(dt, t) {
      dust.rotation.y = t * 0.005;
      dust.position.y = Math.sin(t * 0.12) * 0.25;
    },
  };
}
