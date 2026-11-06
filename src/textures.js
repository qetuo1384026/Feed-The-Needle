// Procedural canvas textures — all generated at runtime, no external assets.
import * as THREE from 'three';

function makeCanvas(size) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  return [canvas, canvas.getContext('2d')];
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

// Loose-straw texture for the haystack: layered strokes in amber/gold tones.
export function strawTexture(size = 512) {
  const [canvas, ctx] = makeCanvas(size);
  ctx.fillStyle = '#8f6b1e';
  ctx.fillRect(0, 0, size, size);

  const palette = ['#c9a227', '#b8901f', '#d9b23a', '#a37d18', '#e3c254', '#7d5c14'];
  for (let i = 0; i < 5200; i++) {
    ctx.strokeStyle = palette[(Math.random() * palette.length) | 0];
    ctx.globalAlpha = rand(0.25, 0.8);
    ctx.lineWidth = rand(0.6, 2.0);
    const x = rand(-20, size + 20);
    const y = rand(-20, size + 20);
    const len = rand(8, 34);
    const ang = rand(0, Math.PI * 2);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// Polished concrete floor with stains and expansion joints.
export function concreteTexture(size = 512) {
  const [canvas, ctx] = makeCanvas(size);
  ctx.fillStyle = '#5c5a55';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 9000; i++) {
    const v = rand(-18, 18) | 0;
    ctx.fillStyle = `rgb(${92 + v}, ${90 + v}, ${84 + v})`;
    ctx.globalAlpha = rand(0.1, 0.5);
    ctx.fillRect(rand(0, size), rand(0, size), rand(1, 3), rand(1, 3));
  }
  // stains
  for (let i = 0; i < 14; i++) {
    ctx.globalAlpha = rand(0.05, 0.16);
    ctx.fillStyle = Math.random() > 0.5 ? '#3f3d38' : '#6d6a62';
    ctx.beginPath();
    ctx.ellipse(rand(0, size), rand(0, size), rand(20, 90), rand(15, 60), rand(0, 3), 0, Math.PI * 2);
    ctx.fill();
  }
  // expansion joints
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = '#2e2c28';
  ctx.lineWidth = 3;
  for (let i = 0; i <= 2; i++) {
    const p = (size / 2) * i;
    ctx.beginPath(); ctx.moveTo(p, 0); ctx.lineTo(p, size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, p); ctx.lineTo(size, p); ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// Corrugated metal wall panels.
export function corrugatedTexture(size = 512) {
  const [canvas, ctx] = makeCanvas(size);
  const grad = ctx.createLinearGradient(0, 0, size, 0);
  grad.addColorStop(0, '#4a4d52');
  grad.addColorStop(1, '#42454a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // vertical corrugation ribs
  const rib = 16;
  for (let x = 0; x < size; x += rib) {
    const g = ctx.createLinearGradient(x, 0, x + rib, 0);
    g.addColorStop(0, '#33363b');
    g.addColorStop(0.35, '#5a5e64');
    g.addColorStop(0.65, '#565a60');
    g.addColorStop(1, '#2f3236');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, rib, size);
  }
  // rust streaks
  for (let i = 0; i < 26; i++) {
    ctx.globalAlpha = rand(0.04, 0.12);
    ctx.fillStyle = '#6e4a2a';
    const x = rand(0, size);
    ctx.fillRect(x, rand(0, size * 0.4), rand(2, 6), rand(30, size * 0.6));
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// Wooden planks for crates.
export function crateTexture(size = 256) {
  const [canvas, ctx] = makeCanvas(size);
  ctx.fillStyle = '#7a5a34';
  ctx.fillRect(0, 0, size, size);

  const plank = size / 4;
  for (let i = 0; i < 4; i++) {
    const v = rand(-14, 14) | 0;
    ctx.fillStyle = `rgb(${122 + v}, ${90 + v}, ${52 + v})`;
    ctx.fillRect(0, i * plank + 1, size, plank - 2);
    ctx.strokeStyle = 'rgba(40,26,12,0.7)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, i * plank + 1, size, plank - 2);
    // grain
    for (let g = 0; g < 26; g++) {
      ctx.strokeStyle = 'rgba(60,40,18,0.25)';
      ctx.lineWidth = 1;
      const y = i * plank + rand(4, plank - 4);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(size * 0.3, y + rand(-3, 3), size * 0.7, y + rand(-3, 3), size, y);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
