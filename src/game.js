// Central game state: economy, inventory, upgrade levels and win tracking.
export class Game {
  constructor(haystack) {
    this.haystack = haystack;

    this.money = 0;
    this.carried = 0;          // strands currently in the bag
    this.capacity = 30_000;
    this.digPower = 3_000;     // strands per manual dig
    this.sellPrice = 2;        // $ per 1,000 strands
    this.totalDug = 0;
    this.autoRate = 0;         // strands/sec from machines (auto-sold)
    this.detectorLevel = 0;    // 0 none, 1 signal strength, 2 +direction
    this.needleFound = false;
    this.startTime = performance.now();

    this.listeners = new Set();
  }

  onChange(fn) {
    this.listeners.add(fn);
  }

  _emit() {
    for (const fn of this.listeners) fn(this);
  }

  // Manual dig: pulls strands from the pile into the bag.
  // Returns strands actually dug (0 when the bag is full).
  dig() {
    if (this.carried >= this.capacity || this.haystack.isCleared) return 0;
    const room = this.capacity - this.carried;
    const dug = this.haystack.removeStrands(Math.min(this.digPower, room));
    this.carried += dug;
    this.totalDug += dug;
    this._emit();
    return dug;
  }

  // Sell everything carried. Returns money earned.
  sellAll() {
    if (this.carried <= 0) return 0;
    const earned = (this.carried / 1000) * this.sellPrice;
    this.money += earned;
    this.carried = 0;
    this._emit();
    return earned;
  }

  // Machines pull strands straight from the pile and sell them.
  // Returns money earned this tick.
  autoTick(dt) {
    if (this.autoRate <= 0 || this.haystack.isCleared) return 0;
    const dug = this.haystack.removeStrands(this.autoRate * dt);
    this.totalDug += dug;
    const earned = (dug / 1000) * this.sellPrice;
    this.money += earned;
    if (dug > 0) this._emit();
    return earned;
  }

  spend(amount) {
    if (this.money < amount) return false;
    this.money -= amount;
    this._emit();
    return true;
  }

  get elapsedSeconds() {
    return (performance.now() - this.startTime) / 1000;
  }
}

export function formatNumber(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 10_000) return (n / 1000).toFixed(1) + 'K';
  return Math.floor(n).toLocaleString('en-US');
}

export function formatMoney(n) {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}
