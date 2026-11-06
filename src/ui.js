// DOM-based HUD: crosshair, stats bar, contextual hints, lock overlay.
// Shop overlay and detector readout are added by later features.
import { formatNumber, formatMoney } from './game.js';
import { TOTAL_STRANDS } from './haystack.js';

export class UI {
  constructor(game) {
    this.game = game;

    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    this.root = document.createElement('div');
    this.root.id = 'hud';
    this.root.innerHTML = `
      <div id="crosshair">·</div>
      <div id="stats">
        <div class="stat"><span class="label">资金</span><span id="stat-money">$0</span></div>
        <div class="stat"><span class="label">背负</span><span id="stat-bag">0 / 30K</span></div>
        <div class="stat"><span class="label">剩余干草</span><span id="stat-hay">6.00M</span></div>
      </div>
      <div id="hint"></div>
      <div id="overlay">
        <div class="panel">
          <h1>FEED THE NEEDLE</h1>
          <p>你被困在一间仓库里。面前是约 600 万根草。</p>
          <p>某个地方……藏着一根针。</p>
          <p class="keys">左键挖掘 · E 出售 · B 商店 · Shift 疾跑</p>
          <p class="start">点击进入</p>
        </div>
      </div>
      <div id="toast"></div>
    `;
    document.body.appendChild(this.root);

    this.elMoney = document.getElementById('stat-money');
    this.elBag = document.getElementById('stat-bag');
    this.elHay = document.getElementById('stat-hay');
    this.elHint = document.getElementById('hint');
    this.elOverlay = document.getElementById('overlay');
    this.elToast = document.getElementById('toast');

    document.addEventListener('pointerlockchange', () => {
      const locked = !!document.pointerLockElement;
      this.elOverlay.style.display = locked ? 'none' : 'flex';
    });

    game.onChange(() => this.refresh());
    this.refresh();
  }

  refresh() {
    const g = this.game;
    this.elMoney.textContent = formatMoney(g.money);
    this.elBag.textContent = `${formatNumber(g.carried)} / ${formatNumber(g.capacity)}`;
    this.elHay.textContent = formatNumber(g.haystack.remaining);
    const pct = (g.haystack.remaining / TOTAL_STRANDS) * 100;
    this.elHay.title = `${pct.toFixed(2)}%`;
  }

  setHint(text) {
    if (this._hint === text) return;
    this._hint = text;
    this.elHint.textContent = text;
  }

  toast(text) {
    this.elToast.textContent = text;
    this.elToast.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => this.elToast.classList.remove('show'), 2200);
  }
}

const CSS = `
#hud { position: fixed; inset: 0; pointer-events: none; font-family: 'Segoe UI', system-ui, sans-serif; z-index: 10; }
#crosshair {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -52%);
  color: #ffe9b0; font-size: 34px; text-shadow: 0 0 6px rgba(0,0,0,0.9); opacity: 0.9;
}
#stats {
  position: absolute; top: 14px; left: 14px; display: flex; flex-direction: column; gap: 6px;
}
.stat {
  background: rgba(12, 9, 5, 0.62); border: 1px solid rgba(255, 214, 130, 0.25);
  border-radius: 6px; padding: 6px 12px; color: #f2e3bb; font-size: 15px;
  min-width: 170px; display: flex; justify-content: space-between; gap: 14px;
  backdrop-filter: blur(2px);
}
.stat .label { color: #b7a678; }
#hint {
  position: absolute; bottom: 96px; left: 50%; transform: translateX(-50%);
  color: #ffe9b0; font-size: 16px; text-shadow: 0 1px 4px #000; white-space: nowrap;
}
#overlay {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  background: rgba(10, 7, 4, 0.72); pointer-events: none;
}
#overlay .panel {
  text-align: center; color: #efe0b8; padding: 40px 60px;
  border: 1px solid rgba(255, 214, 130, 0.3); border-radius: 12px;
  background: rgba(20, 14, 8, 0.85); max-width: 520px;
}
#overlay h1 { font-size: 34px; letter-spacing: 4px; color: #ffcf6e; margin-bottom: 18px; }
#overlay p { margin: 8px 0; font-size: 16px; line-height: 1.5; }
#overlay .keys { color: #a8946a; font-size: 14px; margin-top: 16px; }
#overlay .start { color: #ffd98a; font-size: 18px; margin-top: 20px; animation: pulse 1.6s infinite; }
@keyframes pulse { 0%,100% { opacity: 0.55; } 50% { opacity: 1; } }
#toast {
  position: absolute; top: 18%; left: 50%; transform: translateX(-50%) translateY(-8px);
  background: rgba(30, 22, 10, 0.9); color: #ffd98a; border: 1px solid rgba(255, 214, 130, 0.4);
  padding: 10px 22px; border-radius: 8px; font-size: 16px; opacity: 0; transition: all 0.25s;
}
#toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
`;
