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
  water(x0, x1, top = 2, c = '~') { return this.fill(x0, x1, 0, top - 1, c); }
  mud(x0, x1, top = 2) { return this.fill(x0, x1, 0, top - 1, '%'); }
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
  b.plat(58, 13, 3); b.put(59, 14, 'H');
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
  return b.done({ id: '0-2', name: 'Rooftop Ramble', theme: 'square', secret: 'S0' });
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
  b.plat(32, 8, 6); b.put(33, 9, 'H'); b.acorns(34, 9, 3); b.put(37, 9, 'G');
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
  return b.done({ id: '1-2', name: 'Bumble Bower', theme: 'bloom', secret: 'S1' });
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

// ======================= District 2: Millpond Reach (Winter) =======================
// e=ice beetle h=puffer-frog ~=water w=waterfall O=Captain Puddle K=Winter stone

function l21() {
  const b = new B(170);
  b.ground(0, 18); b.put(2, 2, 'P'); b.put(7, 2, 'O');
  b.sign(10, 2, 'Brr! The water is freezing cold. Jump over the ponds!');
  b.water(19, 20);
  b.ground(21, 34); b.put(28, 2, 'e'); b.acorns(24, 5, 3);
  b.water(35, 37);
  b.ground(38, 52); b.put(43, 2, 'h');
  b.fill(48, 48, 2, 2, 'r'); b.put(48, 3, 'K');
  b.sign(51, 2, 'Switch to Winter with {next}. Water freezes into slippery ice you can walk on!');
  b.water(53, 60); b.acorns(55, 4, 4);
  b.ground(61, 78);
  b.put(63, 2, 'C');
  b.sign(65, 2, 'Critters caught in the cold freeze solid. Stand on them, or kick them across the ice!');
  b.put(68, 2, 'e'); b.put(71, 2, 'e');
  b.sign(73, 2, 'A frozen waterfall makes an icy wall. Wall-jump between it and the rock to climb!');
  b.fill(75, 75, 4, 10, 'r'); b.put(75, 11, 'G');
  b.fill(78, 79, 2, 10, 'w');
  b.fill(80, 95, 0, 9, '#');
  b.put(85, 10, 'h'); b.acorns(82, 11, 4);
  b.ground(96, 121);
  b.water(104, 108); b.put(106, 6, 'G');
  b.put(112, 2, 'C');
  b.put(116, 5, 'L');
  b.water(122, 130); b.fill(124, 128, 5, 5, 'r'); b.put(126, 2, 'G'); b.acorns(123, 3, 2);
  b.ground(131, 169);
  b.put(135, 2, 'e'); b.put(142, 2, 'h');
  b.arc(146, 5, 5);
  b.put(160, 2, 'E');
  b.fill(169, 169, 2, 12, 'r');
  return b.done({ id: '2-1', name: 'Millpond Shore', theme: 'pond', stone: 'winter' });
}

function l22() {
  const b = new B(180);
  b.ground(0, 10); b.put(2, 2, 'P');
  b.sign(5, 2, 'Kick a frozen beetle and it slides a long, long way on the ice!');
  b.water(11, 30);
  b.ground(18, 19); b.put(18, 2, 'e');
  b.ground(24, 25); b.put(24, 2, 'h');
  b.acorns(13, 4, 4); b.acorns(26, 4, 4);
  b.ground(31, 45); b.put(35, 2, 'e'); b.put(38, 2, 'e'); b.put(42, 5, '?');
  b.water(46, 55);
  b.ground(56, 70); b.put(58, 2, 'C'); b.put(64, 2, 'h'); b.acorns(60, 5, 3);
  b.water(71, 90);
  b.ground(78, 79); b.put(78, 2, 'h'); b.plat(79, 5, 2); b.put(79, 6, 'H'); b.put(80, 6, 'G');
  b.ground(85, 85);
  b.ground(91, 110); b.put(93, 2, 'C'); b.put(98, 2, 'e'); b.put(102, 2, 'e'); b.put(105, 5, 'z');
  b.put(108, 2, '^'); b.put(108, 8, 'G');
  b.water(111, 125); b.fill(111, 125, 5, 5, 'r'); b.acorns(113, 3, 10);
  b.ground(126, 150); b.put(130, 2, 'h'); b.put(134, 2, 'e'); b.arc(137, 5, 5);
  b.put(146, 5, 'L');
  b.water(151, 156);
  b.ground(157, 179);
  b.fill(162, 162, 4, 9, 'r'); b.put(162, 10, 'G');
  b.fill(165, 165, 2, 9, 'w');
  b.put(172, 2, 'E');
  b.fill(179, 179, 2, 12, 'r');
  return b.done({ id: '2-2', name: 'Frozen Canals', theme: 'pond', secret: 'S2' });
}

function l23() {
  const b = new B(170, 15);
  b.ground(0, 14); b.put(2, 2, 'P');
  b.sign(4, 2, 'Some puzzles need more than one season. Switch between them with {next} and {prev}!');
  b.put(13, 2, 'f');
  b.fill(15, 24, 0, 7, '#');
  b.water(25, 40);
  b.plat(26, 5, 2); b.plat(31, 5, 2); b.plat(36, 5, 2);
  b.put(33, 3, 'G');
  b.ground(41, 56); b.put(43, 2, 'C'); b.put(46, 2, 'e'); b.put(50, 2, 'h');
  b.fill(52, 52, 5, 12, 'r'); b.put(52, 13, 'G');
  b.fill(55, 56, 2, 12, 'w');
  b.fill(57, 70, 0, 12, '#'); b.acorns(59, 14, 5);
  b.ground(71, 85);
  b.put(76, 2, 'e');
  b.put(80, 2, 'v'); b.plat(81, 8, 4); b.put(83, 11, 'L'); b.acorns(81, 9, 2);
  b.water(86, 92); b.put(89, 2, 'h');
  b.ground(93, 103); b.put(95, 2, 'C');
  b.put(99, 2, 'f'); b.put(99, 9, 'G');
  b.fill(101, 103, 0, 7, '#');
  b.water(104, 112);
  b.ground(113, 169);
  b.put(118, 2, 'e'); b.put(121, 2, 'e'); b.put(128, 2, 'h'); b.put(135, 5, 'z');
  b.arc(140, 5, 5);
  b.put(160, 2, 'E');
  b.fill(169, 169, 2, 14, 'r');
  return b.done({ id: '2-3', name: 'The Old Mill', theme: 'pond' });
}

function l24() {
  const b = new B(190);
  b.water(0, 189, 2, 'R');
  b.ground(0, 8); b.put(3, 2, 'P');
  b.sign(5, 2, 'The ice is breaking up! Keep Winter on and the floes will hold.');
  // Ice floes (row 1 = the water's surface): runs of 3 with small gaps.
  let x = 10;
  const islands = [[58, 61], [118, 121]];
  while (x < 176) {
    const isl = islands.find(([a]) => x >= a - 1 && x <= a + 4);
    if (isl) { x = isl[1] + 3; continue; }
    const len = 2 + ((x * 7) % 3);
    b.fill(x, x + len - 1, 1, 1, 'i');
    x += len + 2 + ((x * 5) % 2);
  }
  for (const [a, c] of islands) { b.ground(a, c); b.put(a + 2, 2, 'C'); }
  b.fill(30, 30, 0, 2, 'r'); b.fill(84, 84, 0, 2, 'r'); b.fill(140, 140, 0, 2, 'r');
  b.put(40, 5, 'G'); b.put(96, 6, 'G'); b.put(150, 5, 'G');
  b.put(60, 2, 'h'); b.put(120, 2, 'h');
  b.arc(66, 5, 4); b.arc(104, 5, 4); b.arc(160, 5, 4);
  b.ground(175, 189); b.put(183, 2, 'E');
  b.fill(189, 189, 2, 12, 'r');
  return b.done({ id: '2-4', name: 'The Thaw', theme: 'pond', autoscroll: 130 });
}

function l2b() {
  const b = new B(26);
  b.ground(0, 6, 3); b.water(7, 18, 3); b.ground(19, 25, 3);
  b.fill(0, 0, 3, 12, 'r'); b.fill(25, 25, 3, 12, 'r');
  b.put(3, 3, 'P');
  return b.done({ id: '2-B', name: 'Old Pike', theme: 'pondboss', boss: 'pike' });
}

// ======================= District 3: Copperleaf Orchard (Autumn) =======================
// q=squirrel m=moth U=gust vent p=leaf pile Y=Mrs. Rook K=Autumn stone

function l31() {
  const b = new B(170);
  b.ground(0, 16); b.put(2, 2, 'P'); b.put(7, 2, 'Y');
  b.plat(13, 5, 3); b.put(14, 6, 'q');
  b.sign(10, 2, 'Squirrels drop acorns from the branches. Keep moving!');
  b.ground(20, 36); b.put(24, 2, 'g'); b.put(28, 5, 'm');
  b.fill(33, 33, 2, 2, 'r'); b.put(33, 3, 'K');
  b.sign(35, 2, 'Switch to Autumn with {next}: falling leaves pile up and fill the gaps!');
  b.fill(37, 42, 0, 1, 'p');
  b.ground(43, 52); b.put(45, 2, 'C');
  b.sign(47, 2, 'Hold {jump} while you fall to glide on a leaf!');
  b.fill(48, 48, 2, 3, 'r'); b.fill(49, 52, 2, 6, '#');
  b.put(58, 9, 'G'); b.arc(54, 7, 7);
  b.ground(63, 80);
  b.sign(65, 2, 'Gust vents blow you up high whenever Autumn is near.');
  b.put(68, 2, 'U'); b.plat(66, 10, 5); b.put(69, 11, 'G');
  b.plat(74, 6, 3); b.put(75, 7, 'q');
  b.fill(81, 84, 0, 1, 'p');
  b.ground(85, 104); b.put(88, 2, 'C'); b.put(95, 5, 'm'); b.put(100, 2, 'g');
  b.put(104, 2, 'U');
  b.arc(106, 8, 7);
  b.ground(115, 123);
  b.fill(124, 128, 0, 1, 'p'); b.put(126, 2, 'G');
  b.ground(129, 169);
  b.put(135, 5, 'L');
  b.plat(140, 6, 3); b.put(141, 7, 'q');
  b.put(150, 2, 'g');
  b.put(160, 2, 'E');
  b.fill(169, 169, 2, 12, 'r');
  return b.done({ id: '3-1', name: 'Orchard Gate', theme: 'orchard', stone: 'autumn' });
}

function l32() {
  const b = new B(180);
  b.ground(0, 10); b.put(2, 2, 'P');
  b.sign(6, 2, 'Ride the gusts, then glide to the next one!');
  b.ground(15, 15); b.put(15, 2, 'U');
  b.ground(23, 23); b.put(23, 2, 'U');
  b.acorns(17, 9, 4);
  b.ground(31, 50); b.put(36, 5, 'm'); b.put(44, 6, 'm'); b.put(47, 2, 'C');
  b.fill(51, 55, 0, 1, 'p');
  b.ground(56, 70); b.plat(60, 6, 3); b.put(61, 7, 'q'); b.put(66, 2, 'g');
  b.put(68, 2, 'U'); b.put(68, 10, 'G');
  b.ground(81, 100); b.put(83, 2, 'C'); b.put(88, 5, 'm'); b.put(94, 2, 'g');
  b.fill(101, 104, 0, 1, 'p'); b.fill(109, 112, 0, 1, 'p');
  b.ground(113, 140);
  b.plat(120, 4, 3); b.plat(124, 7, 4); b.put(126, 8, 'G');
  b.put(130, 5, 'L');
  b.put(135, 2, 'U'); b.plat(136, 10, 6); b.acorns(136, 11, 4); b.put(141, 11, 'H');
  b.put(148, 7, 'G'); b.arc(143, 8, 5);
  b.ground(156, 179);
  b.put(162, 2, 'g');
  b.put(170, 2, 'E');
  b.fill(179, 179, 2, 12, 'r');
  return b.done({ id: '3-2', name: 'Windy Rows', theme: 'orchard', secret: 'S3' });
}

function l33() {
  const b = new B(180, 14);
  b.ground(0, 12); b.put(2, 2, 'P');
  b.sign(4, 2, 'Spring, Winter and Autumn: this orchard needs all three!');
  b.put(12, 2, 'f'); b.fill(14, 18, 0, 7, '#');
  b.water(19, 28);
  b.ground(29, 40); b.put(31, 2, 'C'); b.put(36, 2, 'g');
  b.fill(41, 46, 0, 1, 'p');
  b.ground(47, 61); b.put(52, 5, 'm'); b.plat(55, 6, 3); b.put(56, 7, 'q');
  b.put(60, 2, 'U');
  b.fill(62, 66, 0, 10, '#'); b.put(64, 11, 'G');
  b.ground(67, 88);
  b.water(72, 78); b.put(75, 2, 'h');
  b.fill(84, 84, 4, 11, 'r'); b.put(84, 12, 'G');
  b.fill(87, 88, 2, 11, 'w');
  b.fill(89, 95, 0, 10, '#');
  b.ground(96, 109); b.put(98, 2, 'C');
  b.put(104, 2, 'f'); b.put(104, 9, 'G');
  b.fill(110, 115, 0, 1, 'p');
  b.ground(116, 117);
  b.water(118, 124);
  b.ground(125, 179);
  b.put(128, 2, 'U'); b.plat(126, 10, 4); b.put(128, 13, 'L');
  b.put(140, 5, 'm'); b.put(145, 2, 'g');
  b.plat(150, 6, 3); b.put(151, 7, 'q');
  b.arc(156, 5, 5);
  b.put(170, 2, 'E');
  b.fill(179, 179, 2, 13, 'r');
  return b.done({ id: '3-3', name: 'Cider Press', theme: 'orchard' });
}

function l34() {
  // A vertical climb up through the leaf storm.
  const b = new B(22, 60);
  b.ground(0, 21);
  b.fill(0, 0, 2, 59, 'r'); b.fill(21, 21, 2, 59, 'r');
  b.put(3, 2, 'P');
  b.sign(9, 2, 'Climb the storm! Ride each gust up, then glide to the next ledge.');
  b.put(6, 2, 'U');
  b.plat(2, 10, 6); b.put(3, 11, 'C'); b.acorns(5, 11, 2);
  b.plat(10, 13, 8); b.put(16, 14, 'U');
  b.put(9, 19, 'm');
  b.plat(13, 21, 8); b.put(14, 22, 'C'); b.put(20, 22, 'G');
  b.plat(4, 24, 7); b.put(5, 25, 'U');
  b.plat(1, 27, 2); b.put(1, 28, 'G');
  b.fill(8, 12, 32, 32, 'p'); b.acorns(9, 33, 3);
  b.plat(15, 35, 5); b.put(18, 36, 'U');
  b.plat(19, 39, 2); b.put(19, 40, 'G');
  b.plat(12, 44, 5); b.put(13, 45, 'C');
  b.put(4, 40, 'm');
  b.plat(7, 47, 4); b.put(7, 48, 'U');
  b.fill(8, 20, 56, 56, '#');
  b.put(14, 57, 'E');
  return b.done({ id: '3-4', name: 'Leaf Storm', theme: 'orchard' });
}

function l3b() {
  const b = new B(24, 14);
  b.ground(0, 23);
  b.fill(0, 0, 2, 13, 'r'); b.fill(23, 23, 2, 13, 'r');
  b.put(3, 2, 'P');
  b.put(7, 2, 'U'); b.put(16, 2, 'U');
  return b.done({ id: '3-B', name: 'The Prize Scarecrow', theme: 'orchardboss', boss: 'scarecrow' });
}


// ======================= District 4: Sunglass Greenhouse (Summer) =======================
// %=mud j=ice wall V=heat grate c=cactus hedgehog n=shadow slug B=Basil K=Summer stone

function l41() {
  const b = new B(170);
  b.ground(0, 18); b.put(2, 2, 'P'); b.put(7, 2, 'B');
  b.sign(10, 2, 'Cactus hedgehogs are far too prickly to jump on! Hop over them, or kick a sleepy critter at them.');
  b.put(15, 2, 'c');
  b.mud(19, 20);
  b.ground(21, 40); b.put(25, 2, 'g'); b.put(30, 2, 'c'); b.acorns(24, 5, 3);
  b.fill(34, 34, 2, 2, 'r'); b.put(34, 3, 'K');
  b.sign(37, 2, 'Switch to Summer with {next}: sticky mud bakes solid, and ice walls melt away!');
  b.mud(41, 48); b.acorns(42, 4, 6);
  b.ground(49, 74); b.put(51, 2, 'C');
  b.fill(56, 56, 2, 7, 'j');
  b.put(60, 2, 'c');
  b.sign(63, 2, 'Heat grates puff warm air when Summer is near. Ride them up!');
  b.put(66, 2, 'V'); b.plat(64, 9, 5); b.put(66, 10, 'G'); b.acorns(64, 10, 2); b.acorns(67, 10, 2);
  b.put(71, 5, 'L');
  b.mud(75, 80);
  b.ground(81, 104); b.put(84, 2, 'g'); b.put(88, 2, 'c'); b.put(92, 2, 'c');
  b.fill(99, 99, 2, 4, 'j'); b.fill(101, 101, 2, 4, 'j'); b.fill(99, 101, 5, 5, 'j'); b.put(100, 2, 'G');
  b.put(103, 2, 'C');
  b.mud(105, 112); b.ground(108, 108);
  b.ground(113, 169);
  b.put(118, 2, 'c'); b.put(122, 2, 'g');
  b.put(126, 2, 'V'); b.plat(124, 9, 4); b.acorns(124, 10, 4);
  b.fill(136, 136, 2, 12, 'j');
  b.put(144, 2, 'V'); b.plat(142, 8, 4); b.put(144, 9, 'G');
  b.put(150, 2, 'c');
  b.arc(152, 5, 4);
  b.put(160, 2, 'E');
  b.fill(169, 169, 2, 12, 'r');
  return b.done({ id: '4-1', name: 'Greenhouse Gate', theme: 'green', stone: 'summer' });
}

function l42() {
  // Dark potting sheds: lanterns, glowing lamps, shadow slugs. Summer lights the way.
  const b = new B(180, 14);
  b.ground(0, 14); b.put(2, 2, 'P');
  b.sign(5, 2, "It's dark in the potting sheds! Summer lights the way, and shadow slugs can't hide from it.");
  b.put(11, 2, 'n');
  b.mud(15, 18);
  b.ground(19, 40); b.put(24, 2, 'n'); b.put(30, 2, 'c');
  b.fill(34, 34, 2, 7, 'j'); b.put(37, 2, 'C');
  b.ground(44, 63); b.plat(46, 5, 3); b.put(47, 6, 'G');
  b.put(52, 2, 'V'); b.plat(50, 10, 5); b.put(51, 11, 'H'); b.acorns(53, 11, 2);
  b.put(58, 2, 'n');
  b.mud(64, 68);
  b.ground(69, 95); b.put(71, 2, 'C');
  b.fill(74, 84, 6, 13, 'r'); b.put(79, 2, 'n'); b.put(81, 3, 'G'); b.fill(84, 84, 2, 5, 'j');
  b.put(90, 2, 'c');
  b.ground(99, 117); b.put(101, 2, 'C');
  b.put(106, 2, 'V'); b.plat(104, 9, 4); b.acorns(104, 10, 4);
  b.put(112, 2, 'n');
  b.mud(118, 122);
  b.ground(123, 179);
  b.put(126, 5, 'L'); b.put(130, 2, 'n'); b.put(134, 2, 'n');
  b.fill(140, 140, 2, 13, 'j');
  b.put(146, 2, 'V'); b.plat(148, 8, 4); b.put(150, 9, 'G');
  b.put(160, 2, 'c');
  b.put(168, 2, 'E');
  b.fill(179, 179, 2, 13, 'r');
  return b.done({ id: '4-2', name: 'Potting Sheds', theme: 'green', secret: 'S4', dark: true, glows: [[20, 9, 110], [60, 9, 110], [110, 8, 110], [156, 9, 110]] });
}

function l43() {
  // Every season, one after another.
  const b = new B(190, 15);
  b.ground(0, 12); b.put(2, 2, 'P');
  b.sign(4, 2, 'This greenhouse needs every season. Switch quickly with {next} and {prev}!');
  b.put(10, 2, 'f'); b.fill(12, 20, 0, 7, '#');
  b.water(21, 32);
  b.ground(33, 48); b.put(35, 2, 'C'); b.put(40, 2, 'c');
  // Freeze the waterfall, climb it, melt the ice wall at the top, then glide away.
  b.fill(44, 44, 5, 12, 'r'); b.fill(47, 48, 2, 12, 'w');
  b.fill(49, 62, 0, 12, '#'); b.fill(50, 62, 14, 14, 'r'); b.fill(54, 54, 13, 13, 'j');
  b.acorns(57, 13, 4);
  b.water(63, 78); b.put(70, 8, 'G'); b.arc(66, 9, 7);
  b.ground(79, 99); b.put(81, 2, 'C');
  b.put(86, 2, 'U'); b.plat(84, 10, 4); b.put(85, 11, 'G');
  b.put(92, 2, 'g');
  b.put(97, 2, 'f');
  b.fill(100, 110, 0, 7, '#'); b.fill(106, 106, 8, 14, 'j'); b.acorns(101, 9, 3);
  b.fill(111, 118, 0, 1, 'p');
  b.ground(119, 140); b.put(121, 2, 'C'); b.put(126, 2, 'c'); b.put(130, 2, 'c'); b.put(134, 2, 'h');
  b.mud(141, 150);
  b.ground(151, 189);
  b.put(156, 2, 'V'); b.plat(154, 10, 4); b.put(155, 11, 'G'); b.put(157, 11, 'L');
  b.arc(162, 5, 5);
  b.put(178, 2, 'E');
  b.fill(189, 189, 2, 14, 'r');
  return b.done({ id: '4-3', name: 'Four-Season House', theme: 'green' });
}

function l44() {
  // Heatwave: sunbeams sweep across. Hide under the awnings until they pass.
  const b = new B(200);
  b.ground(0, 199); b.put(2, 2, 'P'); b.plat(0, 5, 5);
  b.sign(4, 2, 'Heatwave! When a sunbeam sweeps past, hide under something. Winter keeps you a little cooler.');
  for (const x of [12, 23, 35, 47, 58, 70, 82, 94, 106, 118, 130, 142, 154, 166, 178]) b.plat(x, 5, 3);
  b.mud(28, 31); b.mud(64, 67); b.mud(124, 128); b.mud(160, 163);
  for (const x of [20, 43, 76, 100, 137, 171]) b.put(x, 2, 'c');
  b.fill(40, 40, 2, 3, 'r');
  b.put(60, 2, 'C'); b.put(120, 2, 'C');
  b.put(48, 6, 'G'); b.put(95, 2, '^'); b.put(95, 9, 'G'); b.put(155, 6, 'G');
  b.acorns(13, 6, 2); b.acorns(71, 6, 2); b.acorns(131, 6, 2);
  b.put(113, 5, 'L');
  b.put(192, 2, 'E');
  b.fill(199, 199, 2, 12, 'r');
  return b.done({ id: '4-4', name: 'Heatwave', theme: 'green', heatwave: { speed: -120, gap: 1100, width: 220, burn: 0.6, start: 1000 } });
}

function l4b() {
  const b = new B(24, 13);
  b.ground(0, 23);
  b.fill(0, 0, 2, 12, 'r'); b.fill(23, 23, 2, 12, 'r');
  b.put(3, 2, 'P');
  b.plat(3, 6, 3); b.plat(18, 6, 3);
  return b.done({ id: '4-B', name: 'The Sunlamp Moth', theme: 'greenboss', boss: 'sunmoth', dark: true });
}


// ======================= Secret burrows (one-screen puzzles with a Starbloom) =======================
// X = the way back out, * = Starbloom (invincible for 10 seconds back in the level)
function room(theme) {
  const b = new B(20, 12);
  b.fill(0, 0, 2, 11, 'r'); b.fill(19, 19, 2, 11, 'r');
  b.put(2, 2, 'X'); b.put(4, 2, 'P');
  return b;
}
function s0() {
  // Rooftop Ramble: wall-jump up a narrow chimney to the top of the stack.
  const b = room(); b.ground(0, 19);
  b.acorns(5, 5, 3); b.put(8, 5, '?');
  b.fill(11, 11, 4, 10, 'r'); b.fill(14, 18, 0, 7, '#');
  b.put(16, 8, '*'); b.acorns(15, 10, 3);
  return b.done({ id: 'S0', name: 'Secret: Chimney Cubby', theme: 'square' });
}
function s1() {
  // Bumble Bower: a chain of bounce-flowers over a floor of thorns (Spring).
  const b = room(); b.ground(0, 18);
  b.fill(7, 16, 2, 2, 'b');
  b.put(6, 2, 'f'); b.put(11, 2, 'f'); b.put(16, 2, 'f');
  b.fill(17, 18, 0, 5, '#'); b.put(18, 6, '*');
  b.arc(8, 7, 7);
  return b.done({ id: 'S1', name: 'Secret: Petal Hollow', theme: 'bloom' });
}
function s2() {
  // Frozen Canals: freeze the pool to stand in the shaft, then wall-jump up the frozen waterfall (Winter).
  const b = room(); b.ground(0, 4); b.water(5, 16);
  b.fill(12, 12, 4, 9, 'r'); b.fill(15, 16, 2, 9, 'w');
  b.fill(17, 18, 0, 8, '#'); b.put(18, 9, '*');
  b.acorns(6, 4, 4);
  return b.done({ id: 'S2', name: 'Secret: Icy Grotto', theme: 'pond' });
}
function s3() {
  // Windy Rows: leaf piles, then a gust vent and a glide to the high ledge (Autumn).
  const b = room(); b.ground(0, 4);
  b.fill(5, 8, 0, 1, 'p');
  b.ground(10, 10); b.put(10, 2, 'U');
  b.plat(13, 9, 4); b.put(15, 10, '*');
  b.ground(18, 19);
  b.arc(12, 6, 5);
  return b.done({ id: 'S3', name: 'Secret: Gusty Burrow', theme: 'orchard' });
}

function s4() {
  // Potting Sheds: bake the mud, melt the ice wall, then ride the heat grate up (Summer).
  const b = room(); b.ground(0, 4); b.mud(5, 10); b.ground(11, 19);
  b.fill(13, 13, 2, 11, 'j');
  b.put(16, 2, 'V'); b.plat(15, 9, 4); b.put(17, 10, '*');
  b.acorns(6, 4, 4);
  return b.done({ id: 'S4', name: 'Secret: Sunny Nook', theme: 'green' });
}

const BUILDERS_TRAIL = {};
// ======================= The Almanac Trail: 20 tricky levels that mix all four seasons =======================
// Each level is a run of hand-made "set pieces" joined by short stretches of ground. Every set piece
// starts and ends at ground level, so they can be combined freely (tools/trailtest.js plays each one).
// seed = where a golden seed goes when the level asks for one there ([x offset, row]).
export const PIECES = {
  // --- one season ---
  pond: { w: (o) => o.n || 8, build(b, x, o) { b.water(x, x + (o.n || 8) - 1); }, seed: (o) => [Math.floor((o.n || 8) / 2), 5] },
  mud: { w: (o) => o.n || 8, build(b, x, o) { b.mud(x, x + (o.n || 8) - 1); }, seed: (o) => [Math.floor((o.n || 8) / 2), 4] },
  piles: { w: (o) => o.n || 8, build(b, x, o) { b.fill(x, x + (o.n || 8) - 1, 0, 1, 'p'); }, seed: (o) => [Math.floor((o.n || 8) / 2), 6] },
  icewall: { w: () => 3, build(b, x) { b.ground(x, x + 2); b.fill(x + 1, x + 1, 2, 14, 'j'); }, seed: () => [2, 5] },
  flowerwall: {
    w: () => 9,
    build(b, x) { b.ground(x, x + 3); b.put(x + 1, 2, 'f'); b.fill(x + 4, x + 7, 0, 7, '#'); b.ground(x + 8, x + 8); },
    seed: () => [5, 11],
  },
  vine: {
    w: () => 8,
    build(b, x) { b.ground(x, x + 2); b.put(x + 2, 2, 'v'); b.fill(x + 3, x + 6, 0, 7, '#'); b.ground(x + 7, x + 7); },
    seed: () => [5, 9],
  },
  thornflower: {
    w: () => 12,
    build(b, x) { b.ground(x, x + 11); b.put(x + 1, 2, 'f'); b.fill(x + 3, x + 9, 2, 2, 'b'); },
    seed: () => [6, 8],
  },
  falls: {
    // Freeze the waterfall, wall-jump up between it and the rock, then take the steps down.
    w: () => 17,
    build(b, x) {
      b.ground(x, x + 5); b.fill(x + 1, x + 1, 5, 12, 'r'); b.fill(x + 4, x + 5, 2, 12, 'w');
      b.fill(x + 6, x + 12, 0, 12, '#'); b.fill(x + 13, x + 14, 0, 8, '#'); b.fill(x + 15, x + 16, 0, 4, '#');
    },
    seed: () => [9, 13],
  },
  ventglide: {
    // A gust vent (Autumn) lifts you high; glide over the pit.
    w: (o) => 4 + (o.n || 12),
    build(b, x, o) { b.ground(x, x + 3); b.put(x + 2, 2, 'U'); b.pit(x + 4, x + 3 + (o.n || 12)); },
    seed: (o) => [4 + Math.floor((o.n || 12) / 2), 7],
  },
  heatwall: {
    // A heat grate (Summer) puffs you up and over a tall wall.
    w: () => 9,
    build(b, x) { b.ground(x, x + 4); b.put(x + 3, 2, 'V'); b.fill(x + 5, x + 7, 0, 8, '#'); b.ground(x + 8, x + 8); },
    seed: () => [6, 10],
  },
  cactustunnel: {
    // A low tunnel full of cactus hedgehogs: freeze them (Winter) and kick them out of the way.
    w: () => 13,
    build(b, x) { b.ground(x, x + 12); b.fill(x + 1, x + 11, 4, 14, 'r'); for (const k of [4, 7, 10]) b.put(x + k, 2, 'c'); },
    seed: () => [6, 3],
  },
  floes: {
    // Rushing water with ice floes that crack, unless Winter keeps them frozen.
    w: (o) => o.n || 12,
    build(b, x, o) {
      const n = o.n || 12;
      b.water(x, x + n - 1, 2, 'R');
      for (let k = 1; k < n - 1; k += 3) b.fill(x + k, Math.min(x + k + 1, x + n - 2), 1, 1, 'i');
    },
    seed: (o) => [Math.floor((o.n || 12) / 2), 5],
  },
  // --- several seasons ---
  meltglide: {
    // Winter: climb the frozen falls. Summer: melt the ice wall in the tunnel. Autumn: glide over the water.
    w: () => 36,
    build(b, x) {
      b.ground(x, x + 5); b.fill(x + 1, x + 1, 5, 12, 'r'); b.fill(x + 4, x + 5, 2, 12, 'w');
      b.fill(x + 6, x + 19, 0, 12, '#'); b.fill(x + 7, x + 19, 14, 14, 'r'); b.fill(x + 11, x + 11, 13, 13, 'j');
      b.water(x + 20, x + 35);
    },
    seed: () => [26, 9],
  },
  iceonice: {
    // Winter: freeze the pond. Summer: melt the ice wall standing in it. Winter again before the ice thaws!
    w: (o) => o.n || 12,
    build(b, x, o) { const n = o.n || 12; b.water(x, x + n - 1); b.fill(x + Math.floor(n / 2) - 1, x + Math.floor(n / 2) - 1, 2, 14, 'j'); },
    seed: (o) => [Math.floor((o.n || 12) / 2) + 2, 4],
  },
  mudflower: {
    // Summer: bake the mud. Spring: bounce over the wall.
    w: () => 14,
    build(b, x) { b.mud(x, x + 5); b.ground(x + 6, x + 8); b.put(x + 6, 2, 'f'); b.fill(x + 9, x + 12, 0, 7, '#'); b.ground(x + 13, x + 13); },
    seed: () => [10, 11],
  },
  pilevent: {
    // Autumn: leaves fill the pit. Summer: ride the heat grate over the wall.
    w: () => 15,
    build(b, x) { b.fill(x, x + 5, 0, 1, 'p'); b.ground(x + 6, x + 10); b.put(x + 9, 2, 'V'); b.fill(x + 11, x + 13, 0, 8, '#'); b.ground(x + 14, x + 14); },
    seed: () => [3, 6],
  },
  quickmix: {
    // Water, a leaf pit and mud, one after another: Winter, Autumn, Summer ({next} each time).
    w: () => 14,
    build(b, x) { b.water(x, x + 3); b.ground(x + 4, x + 4); b.fill(x + 5, x + 8, 0, 1, 'p'); b.ground(x + 9, x + 9); b.mud(x + 10, x + 13); },
    seed: () => [7, 5],
  },
  cliffmeltglide: {
    // Spring: bounce up the cliff. Summer: melt the ice at the edge. Autumn: glide across the gap.
    w: () => 24,
    build(b, x) {
      b.ground(x, x + 3); b.put(x + 1, 2, 'f'); b.fill(x + 4, x + 9, 0, 8, '#'); b.fill(x + 8, x + 8, 9, 14, 'j');
      b.pit(x + 10, x + 21); b.ground(x + 22, x + 23);
    },
    seed: () => [15, 7],
  },
  vineice: {
    // Spring: climb the vine. Summer: melt the ice on top.
    w: () => 9,
    build(b, x) { b.ground(x, x + 2); b.put(x + 2, 2, 'v'); b.fill(x + 3, x + 7, 0, 7, '#'); b.fill(x + 5, x + 5, 8, 14, 'j'); b.ground(x + 8, x + 8); },
    seed: () => [6, 9],
  },
};

const TRAIL_CRITTERS = ['g', 'e', 'h', 'c', 'q', 'g', 'c', 'e'];
function trail(id, name, pieces, meta = {}) {
  const gap = meta.gap || 5;
  let w = 10 + 16;
  for (const [k, o = {}] of pieces) w += PIECES[k].w(o) + gap;
  const b = new B(w, 15);
  b.ground(0, 9); b.put(2, 2, 'P');
  if (meta.sign) b.sign(5, 2, meta.sign);
  if (meta.heatwave) b.plat(0, 5, 6);
  let x = 10;
  const at = [];
  const seeds = meta.seeds || [0, Math.floor(pieces.length / 2), pieces.length - 1];
  const lanterns = [Math.floor(pieces.length / 3), Math.floor((pieces.length * 2) / 3)];
  pieces.forEach(([k, o = {}], i) => {
    // A short stretch of ground first (with a critter, a lantern, or shade in a heatwave).
    b.ground(x, x + gap - 1);
    if (meta.heatwave) b.plat(x, 5, Math.min(gap, 3));
    const cr = (meta.critters || TRAIL_CRITTERS)[(i + id.length) % (meta.critters || TRAIL_CRITTERS).length];
    if (lanterns.includes(i) && i > 0) b.put(x + 1, 2, 'C');
    else if (cr && i > 0 && gap >= 4 && !meta.noCritters) b.put(x + gap - 2, 2, cr);
    if (i % 2 === 0) b.acorns(x + 1, 4, 2);
    x += gap;
    const P = PIECES[k];
    P.build(b, x, o);
    if (seeds.includes(i)) { const [sx, sy] = P.seed(o); b.put(x + sx, sy, 'G'); }
    at.push([k, x, o]);
    x += P.w(o);
  });
  b.ground(x, w - 1);
  if (meta.heatwave) for (let k = x; k < w - 6; k += 6) b.plat(k, 5, 3);
  b.arc(x + 2, 5, 5);
  b.put(x + 10, 2, 'E');
  b.fill(w - 1, w - 1, 2, 14, 'r');
  return b.done({ id, name, theme: 'almanac', pieces: at, ...meta });
}

const HW = { speed: -110, gap: 1250, width: 200, burn: 0.85, start: 1100 };
const TRAIL = [
  ['A-1', 'First Frost Path', [['pond', { n: 6 }], ['mud', { n: 6 }], ['piles', { n: 6 }], ['flowerwall'], ['icewall']],
    { sign: 'The Almanac Trail! Every season, in any order. Switch with {next} and {prev}.' }],
  ['A-2', 'Puddle Hop', [['quickmix'], ['pond', { n: 10 }], ['vine'], ['mud', { n: 8 }]],
    { sign: 'Water, leaves, then mud: Winter, Autumn, Summer. Each one is just a press of {next}!' }],
  ['A-3', 'Mill Run', [['falls'], ['piles', { n: 8 }], ['heatwall'], ['pond', { n: 8 }]]],
  ['A-4', 'Bramble & Bake', [['thornflower'], ['mudflower'], ['ventglide', { n: 10 }], ['icewall']]],
  ['A-5', 'Lantern Lane', [['mud', { n: 6 }], ['flowerwall'], ['pond', { n: 8 }], ['heatwall'], ['cactustunnel']],
    { dark: true, critters: ['n', 'g', 'n', 'c'], sign: 'Dark again! Summer lights the way, but you might need the other seasons too.' }],
  ['A-6', 'Meltwater', [['meltglide'], ['quickmix'], ['floes', { n: 10 }]]],
  ['A-7', 'Upside Orchard', [['ventglide', { n: 12 }], ['pilevent'], ['vineice'], ['pond', { n: 10 }]]],
  ['A-8', 'The Long Thaw', [['pond', { n: 8 }], ['mud', { n: 6 }], ['piles', { n: 6 }], ['floes', { n: 10 }], ['quickmix'], ['pond', { n: 10 }]],
    { autoscroll: 115, gap: 4, noCritters: true }],
  ['A-9', 'Sun & Snow', [['iceonice'], ['mudflower'], ['falls']],
    { sign: 'An ice wall in the pond! Freeze, melt, then freeze again before the ice thaws.' }],
  ['A-10', 'Night Garden', [['vine'], ['cactustunnel'], ['quickmix'], ['heatwall'], ['mud', { n: 10 }]],
    { dark: true, critters: ['n', 'n', 'g', 'n'] }],
  ['A-11', 'Heat Shimmer', [['mud', { n: 8 }], ['icewall'], ['pond', { n: 10 }], ['piles', { n: 8 }], ['quickmix']],
    { heatwave: HW, critters: ['c', null, 'g'] }],
  ['A-12', 'Cliffside', [['cliffmeltglide'], ['falls'], ['ventglide', { n: 12 }]]],
  ['A-13', 'Floe Fields', [['floes', { n: 14 }], ['iceonice'], ['floes', { n: 12 }], ['quickmix']]],
  ['A-14', 'Four Corners', [['flowerwall'], ['meltglide'], ['pilevent'], ['mudflower']]],
  ['A-15', 'Dark Mill', [['falls'], ['iceonice'], ['cactustunnel'], ['vineice']],
    { dark: true, critters: ['n', 'c', 'n'] }],
  ['A-16', 'Hurry, Seasons!', [['quickmix'], ['pond', { n: 10 }], ['mud', { n: 10 }], ['piles', { n: 10 }], ['quickmix'], ['floes', { n: 12 }]],
    { autoscroll: 130, gap: 4, noCritters: true }],
  ['A-17', 'Thawing Heights', [['meltglide'], ['cliffmeltglide'], ['vineice'], ['iceonice', { n: 14 }]]],
  ['A-18', 'High Noon', [['mudflower'], ['quickmix'], ['iceonice'], ['piles', { n: 10 }], ['mud', { n: 10 }]],
    { heatwave: { ...HW, speed: -130, burn: 0.75 }, critters: ['c', 'g', null] }],
  ['A-19', 'Midnight Almanac', [['meltglide'], ['quickmix'], ['pilevent'], ['floes', { n: 12 }]],
    { dark: true, critters: ['n', 'c', 'n'], glowsEvery: 12 }],
  ['A-20', "The Year's End", [['cliffmeltglide'], ['iceonice', { n: 14 }], ['meltglide'], ['quickmix'], ['falls'], ['ventglide', { n: 14 }]],
    { sign: 'The last stretch before the Hollow Oak. Good luck, little fox!' }],
];
for (const [id, name, pieces, meta] of TRAIL) BUILDERS_TRAIL[id] = () => {
  const lv = trail(id, name, pieces, meta);
  // Dim little lamps along dark levels so there's always something to aim for.
  if (meta?.dark) { lv.glows = []; for (let gx = 14; gx < lv.w; gx += meta.glowsEvery || 16) lv.glows.push([gx, 10, 90]); }
  return lv;
};
export const ALMANAC_ORDER = TRAIL.map((t) => t[0]);
export const ALMANAC_INFO = Object.fromEntries(TRAIL.map(([id, name]) => [id, { name, district: 5, music: 'almanac', seeds: 3 }]));

const BUILDERS = {
  '0-1': l01, '0-2': l02, '1-1': l11, '1-2': l12, '1-3': l13, '1-4': l14, '1-B': l1b,
  '2-1': l21, '2-2': l22, '2-3': l23, '2-4': l24, '2-B': l2b,
  '3-1': l31, '3-2': l32, '3-3': l33, '3-4': l34, '3-B': l3b,
  '4-1': l41, '4-2': l42, '4-3': l43, '4-4': l44, '4-B': l4b,
  S0: s0, S1: s1, S2: s2, S3: s3, S4: s4,
};
Object.assign(BUILDERS, BUILDERS_TRAIL);
export const LEVEL_ORDER = ['0-1', '0-2', '1-1', '1-2', '1-3', '1-4', '1-B', '2-1', '2-2', '2-3', '2-4', '2-B', '3-1', '3-2', '3-3', '3-4', '3-B', '4-1', '4-2', '4-3', '4-4', '4-B'];
export const LEVEL_INFO = {
  '0-1': { name: 'Morning in Foxhollows', district: 0, music: 'map', seeds: 3 },
  '0-2': { name: 'Rooftop Ramble', district: 0, music: 'map', seeds: 3 },
  '1-1': { name: 'Bloomwood Gate', district: 1, music: 'bloom', seeds: 3 },
  '1-2': { name: 'Bumble Bower', district: 1, music: 'bloom', seeds: 3 },
  '1-3': { name: 'Thorny Hollow', district: 1, music: 'bloom', seeds: 3 },
  '1-4': { name: 'Bramble Rush', district: 1, music: 'bloom', seeds: 3 },
  '1-B': { name: 'The Pumpkin Patch', district: 1, music: 'boss', seeds: 0 },
  '2-1': { name: 'Millpond Shore', district: 2, music: 'pond', seeds: 3 },
  '2-2': { name: 'Frozen Canals', district: 2, music: 'pond', seeds: 3 },
  '2-3': { name: 'The Old Mill', district: 2, music: 'pond', seeds: 3 },
  '2-4': { name: 'The Thaw', district: 2, music: 'pond', seeds: 3 },
  '2-B': { name: 'Old Pike', district: 2, music: 'boss', seeds: 0 },
  '3-1': { name: 'Orchard Gate', district: 3, music: 'orchard', seeds: 3 },
  '3-2': { name: 'Windy Rows', district: 3, music: 'orchard', seeds: 3 },
  '3-3': { name: 'Cider Press', district: 3, music: 'orchard', seeds: 3 },
  '3-4': { name: 'Leaf Storm', district: 3, music: 'orchard', seeds: 3 },
  '3-B': { name: 'The Prize Scarecrow', district: 3, music: 'boss', seeds: 0 },
  '4-1': { name: 'Greenhouse Gate', district: 4, music: 'glass', seeds: 3 },
  '4-2': { name: 'Potting Sheds', district: 4, music: 'glass', seeds: 3 },
  '4-3': { name: 'Four-Season House', district: 4, music: 'glass', seeds: 3 },
  '4-4': { name: 'Heatwave', district: 4, music: 'glass', seeds: 3 },
  '4-B': { name: 'The Sunlamp Moth', district: 4, music: 'boss', seeds: 0 },
  S0: { name: 'Secret: Chimney Cubby', district: 0, music: 'map', seeds: 0, secret: true },
  S1: { name: 'Secret: Petal Hollow', district: 1, music: 'bloom', seeds: 0, secret: true },
  S2: { name: 'Secret: Icy Grotto', district: 2, music: 'pond', seeds: 0, secret: true },
  S3: { name: 'Secret: Gusty Burrow', district: 3, music: 'orchard', seeds: 0, secret: true },
  S4: { name: 'Secret: Sunny Nook', district: 4, music: 'glass', seeds: 0, secret: true },
};
Object.assign(LEVEL_INFO, ALMANAC_INFO);
const built = {};
export function getLevel(id) { return built[id] || (built[id] = BUILDERS[id]()); }
