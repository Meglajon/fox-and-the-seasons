// Per-district story data: season, friend, boss intro, memory letter and rewards.
export const DISTRICTS = {
  1: {
    name: 'Bloomwood', season: 'spring', boss: '1-B', npc: 'juniper', theme: 'bloom',
    stoneLines: [
      { who: 'stone', text: 'You found the Spring stone!' },
      { who: 'juniper', text: "It's glowing! Press {next} or {prev} to wake up Spring around you. Any soil nearby will sprout." },
      { who: 'juniper', text: 'Be careful: if something hits you, the stone will fizzle out for a few seconds.' },
    ],
    bossIntro: [
      { who: 'juniper', text: "That pumpkin has grown HUGE! It's sitting right on top of Bloomwood's heart." },
      { who: 'juniper', text: "Its stalk is the weak spot, but it's far too high to jump to. Use Spring on the soil and bounce up there!" },
      { who: 'pumpkin', text: 'GRRRUMBLE!' },
    ],
    letterKey: 'spring',
    letter:
      'Dear Marigold,\n' +
      'The spring I first wound the Season Clock, you planted sweet peas all along the square. By June they had climbed right up the clock tower, and you laughed and said the old clock was wearing a scarf.\n' +
      'I wished that spring could last forever. Perhaps that is a silly thing for a clockkeeper to wish.',
    awakeTitle: 'Bloomwood is awake!',
    rewards: { hat: 'crown', furniture: 'pumpkin_lamp', tracks: ['bloom', 'boss'] },
    rewardLines: ['New hat: Flower crown', 'New furniture: Pumpkin lamp', 'New record: Grumpy Critters'],
  },
  2: {
    name: 'Millpond Reach', season: 'winter', boss: '2-B', npc: 'puddle', theme: 'pond',
    stoneLines: [
      { who: 'stone', text: 'You found the Winter stone!' },
      { who: 'puddle', text: "Shiver me whiskers! Switch to Winter with {next} or {prev} and the pond will freeze solid under your paws." },
      { who: 'puddle', text: "Mind your footing, though. Ice is slippery, and anything caught in the cold freezes into a nice kickable block!" },
    ],
    bossIntro: [
      { who: 'puddle', text: "That's Old Pike! He's been leaping out of the millpond and scaring off every boat in the Reach." },
      { who: 'puddle', text: 'Freeze the water before he surfaces. He will bonk right into the ice and get stuck. Then give him a bop!' },
      { who: 'pike', text: 'BLUB. BLUBBERING BLUB!' },
    ],
    letterKey: 'winter',
    letter:
      'Dear Marigold,\n' +
      'The winter the millpond froze solid, you pulled me out onto the ice in your red mittens. I was so afraid of falling that I forgot to be afraid of anything else.\n' +
      'You told me a clockkeeper ought to know better than anyone: everything thaws in time. I wrote it down so I would not forget. I think I have been trying to forget ever since.',
    awakeTitle: 'Millpond Reach has thawed!',
    rewards: { hat: 'earmuffs', furniture: 'pike_bench', tracks: ['pond'] },
    rewardLines: ['New hat: Earmuffs', 'New furniture: Frozen Pike bench', 'New record: Millpond Under Glass'],
  },
  3: {
    name: 'Copperleaf Orchard', season: 'autumn', boss: '3-B', npc: 'rook', theme: 'orchard',
    stoneLines: [
      { who: 'stone', text: 'You found the Autumn stone!' },
      { who: 'rook', text: 'Caw! With Autumn about you, leaves pile up where they fall, and the old gust vents blow again.' },
      { who: 'rook', text: 'And hold {jump} as you fall, little fox. A leaf will carry you like a feather. Caw-caw!' },
    ],
    bossIntro: [
      { who: 'rook', text: 'That is my Prize Scarecrow. It won first place at the harvest fair, and now it simply will not stop SPINNING.' },
      { who: 'rook', text: 'Ride the gust vents up, glide over those sweeping arms, and knock its hat down. Three good bops should calm it.' },
      { who: 'rook', text: 'My crows will try to help. They are, sadly, not very good at helping.' },
    ],
    letterKey: 'autumn',
    letter:
      'Dear Marigold,\n' +
      'It has been a whole year since you left. Tomorrow the clock would have turned to winter again, and every turn takes me further from the last day I saw you.\n' +
      'So tonight I took the four stones out of the Season Clock and hid them in the places where we were happy. If the year never turns, perhaps you never really left.\n' +
      'I am sorry, Foxhollows. I am sorry, little apprentice.',
    awakeTitle: 'Copperleaf Orchard is awake!',
    rewards: { hat: 'beret', furniture: 'scarecrow_stand', tracks: ['orchard'] },
    rewardLines: ['New hat: Leaf beret', 'New furniture: Scarecrow coat-stand', 'New record: Copperleaf Drift'],
  },
  4: {
    name: 'Sunglass Greenhouse', season: 'summer', boss: '4-B', npc: 'basil', theme: 'green',
    stoneLines: [
      { who: 'stone', text: 'You found the Summer stone!' },
      { who: 'basil', text: "Ohh, warm. Lovely. Switch to Summer with {next} or {prev} and you'll bake that sticky mud hard as a plant pot." },
      { who: 'basil', text: 'It melts ice walls, lights up the dark corners, and the old heat grates will puff you right up into the rafters.' },
    ],
    bossIntro: [
      { who: 'basil', text: "That's the Sunlamp Moth. It used to sleep on the big lamp... until it got cold and grew itself a shell of ice." },
      { who: 'basil', text: "It can't resist a bit of light. Switch to Summer and it'll come swooping. Dodge it, keep it in your warmth, and the ice will melt." },
      { who: 'basil', text: "Once it's dizzy and shell-less, give it a gentle bop. Three should do. Mind the frost flakes." },
    ],
    letterKey: 'summer',
    letter:
      'Dear Marigold,\n' +
      'The summer we built the greenhouse, you said the best gardens are planted by people who will never sit in their shade. I did not understand you then.\n' +
      'The apprentice is so like you. If I let the year turn, the clock will need a new keeper, and I think that is what I have truly been afraid of.\n' +
      'I will be waiting in the Hollow Oak, at the far end of the Almanac Trail.',
    awakeTitle: 'The Greenhouse is in bloom!',
    rewards: { hat: 'sunhat', furniture: 'sunlamp', tracks: ['glass'] },
    rewardLines: ['New hat: Sun hat', 'New furniture: Sunlamp Moth lamp', 'New record: Greenhouse Noon', 'The Almanac Trail is open!'],
  },
};

export const SEASON_DISTRICT = { spring: 1, winter: 2, autumn: 3, summer: 4 };

// Pip the caterpillar's races. You have to beat Pip to the bell to clear the level.
export const RACE_LOST = [{ who: 'pip', text: 'Ding-ding! I got to the bell first. Want another go? Best of... lots!' }];
export const RACES = {
  race1: [
    { who: 'pip', text: "Oh, hello! I'm Pip, the fastest caterpillar in all of Copperleaf. Fancy a race to the bell?" },
    { who: 'pip', text: "I'll crawl over everything, and I can climb straight up walls. You'll have to be quick AND clever. Ready?" },
  ],
  race2: [
    { who: 'pip', text: 'You again! I have been training on the potting benches. Race you to the bell!' },
    { who: 'pip', text: 'Swing, hop, and ride the pots. No dawdling!' },
  ],
  race3: [
    { who: 'pip', text: 'The Almanac Trail! I know every shortcut through every season. One more race?' },
  ],
  race4: [
    { who: 'pip', text: 'The roots of the Hollow Oak! This is my last and greatest race. Catch me if you can!' },
  ],
};

// The Hollow Oak: meeting Thimble, winding the Season Clock, and the ending.
export const FINALE = {
  intro: [
    { who: 'thimble', text: '{name}. You came all this way. Of course you did.' },
    { who: 'thimble', text: 'I am sorry. I hid the stones because a turning year meant leaving Marigold further behind... and, one day, handing the clock to someone else.' },
    { who: 'thimble', text: 'But you carried every season back through Foxhollows. The whole town is waking up. I think I am, too.' },
    { who: 'thimble', text: 'The Season Clock is at the top of this chamber. It only winds to the music of the year, so listen: the blocks come and go on the beat.' },
    { who: 'thimble', text: 'Find the four gears, one for each season, then climb the year to the clock. I will be right behind you.' },
  ],
  wound: [
    { who: 'thimble', text: 'Listen... it is ticking. The year is turning again.' },
  ],
  ending: [
    { who: 'thimble', text: 'Marigold always said the best gardens are planted by people who will never sit in their shade. I think I finally understand her.' },
    { who: 'thimble', text: 'This is the clock key. It belongs to the keeper of the Season Clock.' },
    { who: null, text: '{name} received the Clock Key!' },
    { who: 'thimble', text: 'Do not look so worried. I will still be about. Somebody has to run the shop.' },
    { who: 'thimble', text: 'Now, then, Keeper. Shall we go and watch the year go round?' },
  ],
};

// What friends say when you walk up to them.
export function npcLines(who, d, talks) {
  if (who === 'juniper') {
    if (d.stones.spring) return [{ who, text: 'Spring suits you! There are three golden seeds hidden in every level. Can you find them all?' }];
    return talks === 1 ? [
      { who, text: "Oh! A fox! You must be Thimble's apprentice, {name}." },
      { who, text: 'Bloomwood has been stuck in spring for months. Everything grows and grows, but nothing ever properly blooms.' },
      { who, text: 'I saw something glowing pink up ahead, past the snapdragons. Maybe it is what you are looking for?' },
    ] : [{ who, text: 'The glowing thing was just past the snapdragons. Mind their seeds!' }];
  }
  if (who === 'puddle') {
    if (d.stones.winter) return [{ who, text: 'A fox on ice! Kick those frozen beetles about, they slide for miles.' }];
    return talks === 1 ? [
      { who, text: "Ahoy there! Captain Puddle, ferry-otter of Millpond Reach. Or I was, before my ferry got stuck." },
      { who, text: 'The Reach is stuck in a grey, slushy half-winter. Never cold enough to freeze, never warm enough to melt.' },
      { who, text: "Something icy-blue has been glinting past the big pond. Fetch it and we'll get this water behaving!" },
    ] : [{ who, text: 'The glinting thing is just past the big pond. Careful not to fall in, it is mighty cold!' }];
  }
  if (who === 'rook') {
    if (d.stones.autumn) return [{ who, text: 'Caw! Glide, little fox, glide! The wind is on your side now.' }];
    return talks === 1 ? [
      { who, text: "Caw! A visitor! I am Mrs. Rook, and this is Copperleaf Orchard. The leaves here fall and fall, but never land." },
      { who, text: 'It makes a terrible mess of the air and no mess at all on the ground, which is somehow worse.' },
      { who, text: 'My crows saw something shining orange near the old cider barrels. Go and see!' },
    ] : [{ who, text: 'The shiny orange thing is past the first pits. My crows are rarely wrong about shiny things.' }];
  }
  if (who === 'basil') {
    if (d.stones.summer) return [{ who, text: 'Mmm, sunshine. Did you know the shadow slugs hate being looked at? Light them up and they freeze right on the spot. Well, nearly.' }];
    return talks === 1 ? [
      { who, text: '...zzz... Oh! A visitor. Basil. I keep the greenhouse. Or I did, before it got so terribly, endlessly hot.' },
      { who, text: "It's stuck in summer, but a wrong sort of summer. Muddy, steamy, and the lamps have all gone dark." },
      { who, text: 'Something golden fell into the big flowerpot up ahead. Fetch it, would you? I need a little lie-down.' },
    ] : [{ who, text: '...the golden thing is in the big flowerpot, just past the cactus hedgehogs. Do not jump on them. Ouch.' }];
  }
  if (who === 'thimble') {
    return talks === 1
      ? [{ who, text: 'Listen for the tick and the tock. Once you hear the rhythm, your paws will find it too.' }]
      : [{ who, text: 'Four gears, one for each season. Then up the steps to the clock. I believe in you, {name}.' }];
  }
  return [];
}

export const INTROS = { thimble: FINALE.intro, ...RACES };
