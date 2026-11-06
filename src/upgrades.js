// Upgrade catalog: layered tech tree from manual tools to automation.
// Each entry applies its effect to the shared game state.
export const UPGRADES = [
  {
    id: 'shovel',
    name: '铲斗强化',
    desc: '每次挖掘的干草量 ×2',
    levels: [
      { cost: 60, apply: (g) => { g.digPower *= 2; } },
      { cost: 240, apply: (g) => { g.digPower *= 2; } },
      { cost: 900, apply: (g) => { g.digPower *= 2; } },
      { cost: 3200, apply: (g) => { g.digPower *= 2; } },
    ],
  },
  {
    id: 'bag',
    name: '背负袋扩容',
    desc: '干草容量 ×3',
    levels: [
      { cost: 45, apply: (g) => { g.capacity *= 3; } },
      { cost: 180, apply: (g) => { g.capacity *= 3; } },
      { cost: 700, apply: (g) => { g.capacity *= 3; } },
    ],
  },
  {
    id: 'detector',
    name: '金属探测器',
    desc: '显示针的信号强度;二级追加方向指引',
    levels: [
      { cost: 150, apply: (g) => { g.detectorLevel = 1; } },
      { cost: 600, apply: (g) => { g.detectorLevel = 2; } },
    ],
  },
  {
    id: 'digger',
    name: '自动挖掘机',
    desc: '机器持续挖取并自动出售干草',
    levels: [
      { cost: 400, apply: (g) => { g.autoRate += 1_500; } },
      { cost: 1_500, apply: (g) => { g.autoRate += 6_000; } },
      { cost: 6_000, apply: (g) => { g.autoRate += 25_000; } },
      { cost: 20_000, apply: (g) => { g.autoRate += 100_000; } },
    ],
  },
  {
    id: 'baler',
    name: '打包压捆机',
    desc: '干草压缩打包,售价 +50%',
    levels: [
      { cost: 800, apply: (g) => { g.sellPrice *= 1.5; } },
      { cost: 2_500, apply: (g) => { g.sellPrice *= 1.5; } },
    ],
  },
];

// Tracks how many levels of each upgrade have been purchased.
export class UpgradeState {
  constructor() {
    this.owned = Object.fromEntries(UPGRADES.map((u) => [u.id, 0]));
  }

  nextLevel(id) {
    const def = UPGRADES.find((u) => u.id === id);
    const lvl = this.owned[id];
    return lvl < def.levels.length ? { def, level: def.levels[lvl], index: lvl } : null;
  }

  buy(game, id) {
    const next = this.nextLevel(id);
    if (!next) return 'maxed';
    if (!game.spend(next.level.cost)) return 'poor';
    next.level.apply(game);
    this.owned[id]++;
    game._emit();
    return 'ok';
  }
}
