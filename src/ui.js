// DOM-based HUD: crosshair, stats bar, contextual hints, lock overlay.
// Shop overlay and detector readout are added by later features.
import { formatNumber, formatMoney } from './game.js';
import { TOTAL_STRANDS } from './haystack.js';
import { UPGRADES } from './upgrades.js';

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
      <div id="detector" style="display:none">
        <span class="det-label">探测器</span>
        <span id="det-signal">0%</span>
        <span id="det-dir"></span>
      </div>
      <div id="win" style="display:none">
        <div class="win-panel">
          <h1>找到了!</h1>
          <p class="win-sub">大海捞针 — 你真的做到了。</p>
          <div id="win-stats"></div>
          <button id="win-restart">再来一次</button>
        </div>
      </div>
      <div id="shop" style="display:none">
        <div class="shop-panel">
          <h2>设备商店</h2>
          <p class="shop-sub">一切皆有现货 — 唯一的限制是你的钱包。(B 关闭)</p>
          <div id="shop-items"></div>
        </div>
      </div>
    `;
    document.body.appendChild(this.root);

    this.elShop = document.getElementById('shop');
    this.elShopItems = document.getElementById('shop-items');
    this.elDetector = document.getElementById('detector');
    this.elDetSignal = document.getElementById('det-signal');
    this.elDetDir = document.getElementById('det-dir');
    this.elWin = document.getElementById('win');
    this.elWinStats = document.getElementById('win-stats');
    document.getElementById('win-restart').addEventListener('click', () => location.reload());
    this.upgradeState = null; // injected by main
    this.shopOpen = false;

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

  toggleShop(force) {
    this.shopOpen = force !== undefined ? force : !this.shopOpen;
    this.elShop.style.display = this.shopOpen ? 'flex' : 'none';
    if (this.shopOpen) {
      document.exitPointerLock();
      this.renderShop();
    }
    return this.shopOpen;
  }

  renderShop() {
    const g = this.game;
    this.elShopItems.innerHTML = '';
    for (const def of UPGRADES) {
      const next = this.upgradeState.nextLevel(def.id);
      const owned = this.upgradeState.owned[def.id];
      const row = document.createElement('div');
      row.className = 'shop-item';
      const pips = def.levels
        .map((_, i) => `<span class="pip ${i < owned ? 'owned' : ''}"></span>`)
        .join('');
      row.innerHTML = `
        <div class="info">
          <div class="name">${def.name} <span class="pips">${pips}</span></div>
          <div class="desc">${def.desc}</div>
        </div>
        <button class="buy"></button>
      `;
      const btn = row.querySelector('.buy');
      if (!next) {
        btn.textContent = '已满级';
        btn.disabled = true;
      } else {
        btn.textContent = formatMoney(next.level.cost);
        btn.disabled = g.money < next.level.cost;
        btn.addEventListener('click', () => {
          const result = this.upgradeState.buy(g, def.id);
          if (result === 'ok') {
            this.toast(`已购买:${def.name} Lv.${owned + 1}`);
            this.renderShop();
          }
        });
      }
      this.elShopItems.appendChild(row);
    }
  }

  // progress 0..1 toward the needle's depth; relAngle is the signed angle
  // between the player's facing and the needle (-PI..PI), or null.
  updateDetector(level, progress, relAngle) {
    this.elDetector.style.display = level > 0 ? 'flex' : 'none';
    if (level <= 0) return;
    const pct = Math.floor(progress * 100);
    this.elDetSignal.textContent = `${pct}%`;
    this.elDetSignal.className = pct > 90 ? 'hot' : pct > 60 ? 'warm' : '';
    if (level >= 2 && relAngle !== null) {
      const deg = relAngle * 180 / Math.PI;
      this.elDetDir.textContent = Math.abs(deg) < 12 ? '↑' : deg > 0 ? '→' : '←';
    } else {
      this.elDetDir.textContent = '';
    }
  }

  showWin(game) {
    document.exitPointerLock();
    const mins = Math.floor(game.elapsedSeconds / 60);
    const secs = Math.floor(game.elapsedSeconds % 60);
    this.elWinStats.innerHTML = `
      <div class="win-row"><span>用时</span><b>${mins} 分 ${secs} 秒</b></div>
      <div class="win-row"><span>挖出干草</span><b>${formatNumber(game.totalDug)} 根</b></div>
      <div class="win-row"><span>最终资金</span><b>${formatMoney(game.money)}</b></div>
    `;
    this.elWin.style.display = 'flex';
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
#shop {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  background: rgba(10, 7, 4, 0.66); pointer-events: auto;
}
.shop-panel {
  width: 560px; max-height: 76vh; overflow-y: auto; padding: 26px 30px;
  background: rgba(22, 16, 9, 0.96); border: 1px solid rgba(255, 214, 130, 0.35);
  border-radius: 12px; color: #efe0b8;
}
.shop-panel h2 { color: #ffcf6e; letter-spacing: 3px; font-size: 24px; }
.shop-sub { color: #a8946a; font-size: 13px; margin: 6px 0 18px; }
.shop-item {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 12px 6px; border-top: 1px solid rgba(255, 214, 130, 0.12);
}
.shop-item .name { font-size: 16px; color: #ffe9b0; display: flex; align-items: center; gap: 8px; }
.shop-item .desc { font-size: 13px; color: #b7a678; margin-top: 3px; }
.pips { display: inline-flex; gap: 3px; }
.pip {
  width: 8px; height: 8px; border-radius: 50%;
  border: 1px solid rgba(255, 214, 130, 0.5); display: inline-block;
}
.pip.owned { background: #ffcf6e; }
.buy {
  min-width: 96px; padding: 8px 14px; font-size: 15px; cursor: pointer;
  background: #3a2c12; color: #ffd98a; border: 1px solid rgba(255, 214, 130, 0.5);
  border-radius: 6px;
}
.buy:hover:not(:disabled) { background: #57421c; }
.buy:disabled { opacity: 0.4; cursor: not-allowed; }
#detector {
  position: absolute; top: 14px; right: 14px; display: flex; align-items: center; gap: 10px;
  background: rgba(12, 9, 5, 0.62); border: 1px solid rgba(140, 200, 255, 0.3);
  border-radius: 6px; padding: 8px 14px; color: #cfe6ff; font-size: 15px;
}
.det-label { color: #7fa8cc; font-size: 13px; }
#det-signal { font-weight: 600; min-width: 44px; text-align: right; }
#det-signal.warm { color: #ffd98a; }
#det-signal.hot { color: #ff9a5a; }
#det-dir { font-size: 20px; width: 20px; text-align: center; color: #8fd0ff; }
#win {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  background: rgba(8, 6, 3, 0.8); pointer-events: auto;
}
.win-panel {
  text-align: center; padding: 44px 64px; color: #efe0b8;
  background: rgba(24, 18, 10, 0.97); border: 1px solid rgba(255, 214, 130, 0.5);
  border-radius: 14px;
}
.win-panel h1 { font-size: 40px; color: #ffcf6e; letter-spacing: 6px; margin-bottom: 8px; }
.win-sub { color: #b7a678; margin-bottom: 24px; }
.win-row {
  display: flex; justify-content: space-between; gap: 40px; padding: 8px 4px;
  border-top: 1px solid rgba(255, 214, 130, 0.15); font-size: 16px;
}
.win-row b { color: #ffe9b0; }
#win-restart {
  margin-top: 26px; padding: 10px 30px; font-size: 16px; cursor: pointer;
  background: #3a2c12; color: #ffd98a; border: 1px solid rgba(255, 214, 130, 0.5);
  border-radius: 8px;
}
#win-restart:hover { background: #57421c; }
`;
