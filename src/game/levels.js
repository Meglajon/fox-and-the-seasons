// Level designs. Coordinates: x in tiles from the left, y in tiles from the BOTTOM (y=2 = standing on default ground).
//  #=ground r=stone ==plank ?=acorn crate L=life crate b=thorns o=acorn G=golden seed
//  f=flower soil v=vine soil ^=mushroom C=lantern E=bell P=start g=grub d=snapdragon z/Z=buzzer
//  K=spring stone J=Juniper s=sign

class B {
  constructor(w, h = 13) {
    this.w = w; this.h = h;
    this.g = Array.from({ length: h }, () => Array(w).fill('.'));
    this.signs = {};
  }
  set(x, y, c) { if (x >= 0 && x < this.w && y >= 0 && y < this.h) this.g[this.h - 1 - y][x] = c; return this; }
  fill(x0, x1, y0, y1, c) { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) this.set(x, y, c); return this; }
  ground(x0, x1, top = 2) { return this.fill(x0, x1, 0, top - 1, '#'); }
  roof(x0, x1, top) { this.fill(x0, x1, 0, top - 2, 'r'); return this.fill(x0, x1, top - 1, top - 1, '#'); }
  pit(x0, x1) { return this.fill(x0, x1, 0, this.h - 1, '.'); }
  plat(x, y, w) { for (let i = 0; i < w; i++) this.set(x + i, y, '='); return this; }
  acorns(x, y, n, step = 1) { for (let i = 0; i < n; i++) this.set(x + i * step, y, 'o'); return this; }
  arc(x, y, n) { for (let i = 0; i < n; i++) this.set(x + i, y + Math.round(Math.sin((Math.PI * i) / (n - 1)) * 2), 'o'); return this; }
  put(x, y, c) { return this.set(x, y, c); }
  sign(x, y, txt) { this.set(x, y, 's'); this.signs[`${x},${this.h - 1 - y}`] = txt; return this; }
  done(meta) { return { ...meta, w: this.w, h: this.h, rows: this.g.map((r) => r.join('')), signs: this.signs }; }
}

function l01() {
  const b = new B(150);
  b.ground(0, 13);
  b.put(2, 2, 'P');
  b.sign(4, 2, 'Walk with ← → (or A and D). Press {jump} to jump, and hold it to jump higher!');
  b.acorns(7, 4, 3);
  b.put(11, 5, '?');
  b.ground(16, 31);
  b.sign(17, 2, 'Grumpy grubs! Land on top of one to send it to sleep.');
  b.put(22, 2, 'g');
  b.plat(24, 4, 3); b.acorns(24, 5, 3);
  b.put(28, 5, '?'); b.put(29, 5, '?');
  b.put(30, 2, 'g');
  b.ground(35, 52);
  b.fill(39, 39, 2, 2, 'r'); b.fill(40, 41, 2, 3, 'r');
  b.put(44, 2, 'g');
  b.sign(46, 2, 'Bouncy mushrooms launch you up high!');
  b.put(48, 2, '^'); b.put(48, 8, 'G');
  b.acorns(47, 6, 1); b.acorns(49, 6, 1);
  b.put(51, 2, 'C');
  b.ground(53, 70);
  b.plat(56, 4, 3); b.plat(60, 6, 3); b.plat(64, 8, 3);
  b.acorns(56, 5, 3); b.acorns(60, 7, 3); b.acorns(64, 9, 2);
  b.put(66, 11, 'G');
  b.put(58, 2, 'g'); b.put(63, 2, 'g');
  b.sign(68, 2, 'Hold {sprint} to sprint. Running jumps go much further!');
  b.ground(75, 98);
  b.put(80, 5, '?'); b.put(81, 5, 'L'); b.put(82, 5, '?');
  b.plat(79, 8, 5); b.acorns(79, 9, 5);
  b.sign(85, 2, 'Sleepy critters can be carried: hold {sprint} as you touch one, then let go to throw it!');
  b.put(88, 2, 'g'); b.put(91, 2, 'g'); b.put(94, 2, 'g'); b.put(96, 2, 'g');
  b.ground(102, 149);
  b.put(104, 2, 'C');
  b.fill(110, 118, 4, 4, 'r');
  b.acorns(111, 2, 3); b.put(116, 2, 'G');
  b.acorns(111, 5, 5);
  b.put(114, 5, 'g');
  b.fill(121, 121, 2, 2, 'r'); b.fill(122, 122, 2, 3, 'r'); b.fill(123, 123, 2, 4, 'r');
  b.arc(125, 5, 5);
  b.put(132, 2, 'g');
  b.put(140, 2, 'E');
  b.fill(149, 149, 2, 12, 'r');
  return b.done({ id: '0-1', name: 'Morning in Foxhollows', theme: 'square' });
}

function l02() {
  const b = new B(160, 15);
  b.roof(0, 16, 4); b.put(2, 4, 'P');
  b.put(7, 7, '?'); b.put(8, 7, '?');
  b.put(12, 4, 'g');
  b.roof(20, 32, 5);
  b.fill(27, 27, 5, 6, 'r');
  b.acorns(23, 7, 3);
  b.put(30, 5, 'g');
  b.roof(37, 60, 4);
  b.plat(42, 7, 4); b.acorns(42, 8, 4);
  b.put(45, 4, 'g'); b.put(48, 4, 'g');
  b.put(51, 4, 'C');
  b.sign(54, 4, 'Jump into a wall, then press {jump} again to wall-jump. Bounce between the walls to climb!');
  b.fill(57, 57, 6, 11, 'r');
  b.put(57, 12, 'G');
  b.roof(61, 76, 11);
  b.acorns(64, 12, 4);
  b.put(67, 11, 'g'); b.put(72, 11, 'g');
  b.roof(77, 80, 9); b.roof(81, 84, 7); b.roof(85, 104, 4);
  b.put(89, 7, '?'); b.put(90, 7, 'L'); b.put(91, 7, '?');
  b.put(94, 4, 'g');
  b.put(97, 4, '^'); b.put(97, 10, 'G');
  b.put(100, 4, 'g');
  b.put(103, 4, 'C');
  b.plat(106, 5, 1);
  b.roof(109, 126, 5);
  b.fill(114, 114, 5, 6, 'r');
  b.plat(119, 8, 3);
  b.fill(124, 124, 5, 9, 'r'); b.put(124, 10, 'G');
  b.put(116, 5, 'g'); b.put(121, 5, 'g');
  b.arc(127, 7, 3);
  b.roof(130, 159, 4);
  b.put(136, 4, 'g'); b.put(141, 4, 'g');
  b.put(150, 4, 'E');
  b.fill(159, 159, 4, 14, 'r');
  return b.done({ id: '0-2', name: 'Rooftop Ramble', theme: 'square' });
}

function l11() {
  const b = new B(170);
  b.ground(0, 20); b.put(2, 2, 'P'); b.put(7, 2, 'J');
  b.put(13, 2, 'b'); b.put(14, 2, 'b');
  b.acorns(12, 5, 4);
  b.put(18, 2, 'd');
  b.ground(24, 42);
  b.put(29, 2, 'g');
  b.put(32, 2, 'd');
  b.fill(36, 36, 2, 2, 'r'); b.put(36, 3, 'K');
  b.sign(39, 2, 'Soil patch! With Spring active, it sprouts a bounce-flower.');
  b.put(41, 2, 'f');
  b.fill(43, 56, 0, 6, '#');
  b.sign(46, 7, 'Vine soil grows a climbing vine. Press {up} to grab it and climb!');
  b.put(50, 7, 'v'); b.put(50, 11, 'G');
  b.put(54, 7, 'g');
  b.ground(57, 64);
  b.put(60, 2, 'C');
  b.put(64, 2, 'f');
  b.arc(66, 7, 4);
  b.ground(71, 120);
  b.put(75, 2, 'd'); b.put(79, 2, 'g');
  b.put(81, 2, 'f');
  b.fill(83, 83, 2, 6, 'b');
  b.put(87, 2, 'f'); b.put(87, 8, 'G');
  b.put(92, 2, 'd');
  b.put(94, 2, 'f');
  b.fill(96, 96, 2, 6, 'r');
  b.put(100, 2, 'C');
  b.put(104, 2, 'g'); b.put(108, 2, 'd');
  b.put(112, 2, 'v');
  b.plat(113, 8, 4); b.acorns(113, 9, 3); b.put(116, 9, 'G');
  b.ground(124, 169);
  b.put(128, 2, 'g'); b.put(132, 2, 'g'); b.put(135, 2, 'd');
  b.fill(140, 142, 2, 2, 'b');
  b.acorns(139, 5, 5);
  b.put(147, 5, '?'); b.put(148, 5, '?');
  b.put(158, 2, 'E');
  b.fill(169, 169, 2, 12, 'r');
  return b.done({ id: '1-1', name: 'Bloomwood Gate', theme: 'bloom' });
}

function l12() {
  const b = new B(180);
  b.ground(0, 14); b.put(2, 2, 'P');
  b.sign(5, 2, 'Bumble-buzzers fly in loops. Bop them from above for a big bounce!');
  b.put(10, 5, 'z');
  b.put(14, 2, 'f');
  b.put(16, 6, 'z');
  b.ground(19, 40);
  b.put(25, 2, 'g'); b.put(28, 2, 'g');
  b.put(31, 2, 'v');
  b.plat(32, 8, 6); b.acorns(32, 9, 4); b.put(37, 9, 'G');
  b.put(35, 2, 'd');
  b.ground(43, 43); b.put(43, 2, 'f');
  b.ground(47, 60);
  b.put(50, 2, 'C');
  b.put(54, 4, 'Z');
  b.put(58, 2, 'g');
  b.put(60, 2, 'v');
  b.fill(61, 66, 0, 8, '#');
  b.acorns(62, 9, 4);
  b.ground(67, 90);
  b.put(70, 2, 'd'); b.put(74, 2, 'd');
  b.put(78, 6, 'z'); b.put(83, 6, 'z');
  b.acorns(77, 4, 7);
  b.ground(91, 104);
  b.fill(92, 103, 2, 2, 'b');
  b.put(91, 2, 'f'); b.put(96, 2, 'f'); b.put(101, 2, 'f');
  b.put(98, 7, 'G');
  b.ground(105, 129);
  b.put(108, 2, 'C');
  b.put(112, 2, 'g'); b.put(115, 2, 'g'); b.put(118, 5, 'z');
  b.put(120, 2, 'v'); b.plat(121, 9, 3); b.put(123, 10, 'G');
  b.put(126, 5, 'L');
  b.put(129, 2, 'f');
  b.ground(136, 179);
  b.put(140, 2, 'd'); b.put(144, 2, 'g'); b.put(148, 5, 'z'); b.put(152, 2, 'g');
  b.arc(155, 5, 5);
  b.put(168, 2, 'E');
  b.fill(179, 179, 2, 12, 'r');
  return b.done({ id: '1-2', name: 'Bumble Bower', theme: 'bloom' });
}

function l13() {
  const b = new B(170, 14);
  b.ground(0, 30); b.put(2, 2, 'P');
  b.sign(4, 2, 'Thorns ahead! Hold {jump} as you land on a flower to bounce even higher.');
  b.fill(10, 11, 2, 2, 'b');
  b.put(14, 2, 'f'); b.fill(16, 16, 2, 4, 'b');
  b.put(20, 2, 'd'); b.put(24, 2, 'g');
  b.ground(27, 40);
  b.fill(27, 40, 7, 8, '#'); b.fill(27, 40, 6, 6, 'b');
  b.pit(31, 32); b.fill(31, 32, 6, 8, '#'); b.fill(31, 32, 6, 6, 'b');
  b.pit(36, 37); b.fill(36, 37, 6, 8, '#'); b.fill(36, 37, 6, 6, 'b');
  b.put(34, 2, 'g');
  b.acorns(28, 3, 2); b.acorns(38, 3, 2);
  b.ground(41, 50);
  b.put(43, 2, 'C');
  b.fill(47, 47, 5, 11, 'r');
  b.put(47, 12, 'G');
  b.fill(51, 70, 0, 9, '#');
  b.put(56, 10, 'g'); b.put(59, 10, 'b'); b.put(63, 10, 'g');
  b.acorns(60, 12, 3);
  b.ground(71, 81);
  b.put(74, 2, 'd'); b.put(78, 2, 'd');
  b.put(81, 2, 'f');
  b.ground(85, 85); b.put(85, 2, 'f');
  b.ground(88, 88); b.put(88, 2, 'f');
  b.put(86, 8, 'G');
  b.ground(91, 120);
  b.put(93, 2, 'C');
  b.put(97, 2, 'g'); b.put(100, 2, 'g'); b.put(103, 2, 'd');
  b.put(108, 2, 'v'); b.plat(109, 8, 4); b.acorns(109, 9, 3); b.put(111, 11, 'L');
  b.fill(115, 116, 2, 2, 'b');
  b.ground(124, 169);
  b.fill(130, 130, 2, 3, 'b'); b.put(132, 2, 'f'); b.fill(134, 134, 2, 4, 'b');
  b.put(138, 2, 'd'); b.put(141, 2, 'g');
  b.put(147, 2, 'f'); b.fill(150, 150, 2, 7, 'b'); b.put(150, 10, 'G');
  b.put(160, 2, 'E');
  b.fill(169, 169, 2, 13, 'r');
  return b.done({ id: '1-3', name: 'Thorny Hollow', theme: 'bloom' });
}

function l14() {
  const b = new B(200);
  b.ground(0, 199); b.put(4, 2, 'P');
  b.fill(14, 14, 2, 3, 'r');
  b.pit(20, 22);
  b.put(27, 2, 'g');
  b.put(31, 2, 'f'); b.fill(33, 33, 2, 6, 'r');
  b.pit(38, 41);
  b.fill(45, 46, 2, 2, 'b');
  b.put(50, 2, 'd');
  b.plat(54, 4, 4); b.fill(55, 57, 2, 2, 'b'); b.acorns(54, 5, 4);
  b.pit(62, 64);
  b.put(68, 2, 'C');
  b.put(72, 2, 'f'); b.fill(74, 76, 0, 7, '#'); b.acorns(74, 8, 3);
  b.put(80, 5, 'z');
  b.put(83, 2, 'f'); b.pit(84, 88); b.arc(84, 6, 5);
  b.fill(92, 92, 2, 3, 'b'); b.fill(96, 96, 2, 3, 'b');
  b.put(100, 2, 'g'); b.put(103, 2, 'g');
  b.put(107, 2, 'f'); b.fill(109, 111, 2, 6, 'r'); b.put(110, 7, 'G');
  b.pit(115, 118);
  b.put(121, 2, 'C');
  b.put(125, 2, 'v'); b.plat(126, 8, 5); b.acorns(126, 9, 5);
  b.fill(128, 131, 2, 2, 'b');
  b.put(134, 5, 'z'); b.put(137, 2, 'd');
  b.put(139, 2, 'f'); b.put(140, 8, 'G'); b.fill(142, 142, 2, 5, 'r');
  b.pit(146, 149);
  b.put(152, 2, 'g'); b.put(155, 2, 'g');
  b.fill(158, 159, 2, 2, 'b');
  b.plat(162, 4, 5); b.put(165, 5, 'G');
  b.pit(170, 172);
  b.arc(176, 5, 6);
  b.put(190, 2, 'E');
  b.fill(199, 199, 2, 12, 'r');
  return b.done({ id: '1-4', name: 'Bramble Rush', theme: 'bloom', autoscroll: 150 });
}

function l1b() {
  const b = new B(22);
  b.ground(0, 21);
  b.fill(0, 0, 2, 12, 'r'); b.fill(21, 21, 2, 12, 'r');
  b.put(3, 2, 'P');
  b.put(5, 2, 'f'); b.put(16, 2, 'f');
  return b.done({ id: '1-B', name: 'The Pumpkin Patch', theme: 'boss', boss: 'pumpkin' });
}

const BUILDERS = { '0-1': l01, '0-2': l02, '1-1': l11, '1-2': l12, '1-3': l13, '1-4': l14, '1-B': l1b };
export const LEVEL_ORDER = ['0-1', '0-2', '1-1', '1-2', '1-3', '1-4', '1-B'];
export const LEVEL_INFO = {
  '0-1': { name: 'Morning in Foxhollows', district: 0, music: 'map', seeds: 3 },
  '0-2': { name: 'Rooftop Ramble', district: 0, music: 'map', seeds: 3 },
  '1-1': { name: 'Bloomwood Gate', district: 1, music: 'bloom', seeds: 3 },
  '1-2': { name: 'Bumble Bower', district: 1, music: 'bloom', seeds: 3 },
  '1-3': { name: 'Thorny Hollow', district: 1, music: 'bloom', seeds: 3 },
  '1-4': { name: 'Bramble Rush', district: 1, music: 'bloom', seeds: 3 },
  '1-B': { name: 'The Pumpkin Patch', district: 1, music: 'boss', seeds: 0 },
};
const built = {};
export function getLevel(id) { return built[id] || (built[id] = BUILDERS[id]()); }
