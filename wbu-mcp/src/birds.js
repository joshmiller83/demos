// Field-guide style bird illustrations, drawn as inline SVG from one shared
// side-profile shape and a per-species colour spec.
(function () {
  const W = (window.WBU = window.WBU || {});

  const SPECIES = {
    cardinal: {
      name: 'Northern Cardinal',
      latin: 'Cardinalis cardinalis',
      body: '#c62a2f', belly: '#d8393f', wing: '#a31f25', tail: '#9a1d23', head: '#c62a2f',
      crest: true, mask: '#1e1a1a', beak: '#ee7f3a', beakType: 'cone',
    },
    junco: {
      name: 'Dark-eyed Junco',
      latin: 'Junco hyemalis',
      body: '#56616a', belly: '#f2f1ec', wing: '#4b555d', tail: '#3f484f', head: '#4b555d',
      beak: '#efc9c0', beakType: 'cone',
    },
    houseFinch: {
      name: 'House Finch',
      latin: 'Haemorhous mexicanus',
      body: '#8c7059', belly: '#eee4d6', streaks: '#8c7059', wing: '#7a604b', wingBars: '#eee4d6',
      tail: '#6e5645', head: '#c8363b', bib: '#d2474b', beak: '#a89a8c', beakType: 'cone',
    },
    purpleFinch: {
      name: 'Purple Finch',
      latin: 'Haemorhous purpureus',
      body: '#a45a72', belly: '#f0e4e8', wing: '#8a5264', wingBars: '#e9d3da', tail: '#7a4a5a',
      head: '#b34a6c', bib: '#c05a7a', beak: '#a89a8c', beakType: 'cone',
    },
    hummingbird: {
      name: 'Ruby-throated Hummingbird',
      latin: 'Archilochus colubris',
      body: '#3f8a5a', belly: '#eef0e8', wing: '#5b6b5f', tail: '#3a6e4e', head: '#3f8a5a',
      bib: '#c0213f', beak: '#1c1c1c', beakType: 'needle',
    },
    chickadee: {
      name: 'Black-capped Chickadee',
      latin: 'Poecile atricapillus',
      body: '#a2a6a8', belly: '#efe6d6', wing: '#7e8386', tail: '#7e8386', head: '#f8f8f5',
      cap: '#1b1b1b', bib: '#1b1b1b', beak: '#1b1b1b', beakType: 'thin',
    },
    goldfinch: {
      name: 'American Goldfinch',
      latin: 'Spinus tristis',
      body: '#b7a640', belly: '#e8e0b8', wing: '#3a3a36', wingBars: '#f1efe6', tail: '#3a3a36',
      head: '#c2b04a', beak: '#d9b98a', beakType: 'cone',
    },
    bluebird: {
      name: 'Eastern Bluebird',
      latin: 'Sialia sialis',
      body: '#3f6fb8', belly: '#d5823f', wing: '#3564ae', tail: '#2f5b9e', head: '#3f6fb8',
      beak: '#2a2a2a', beakType: 'thin',
    },
    downy: {
      name: 'Downy Woodpecker',
      latin: 'Dryobates pubescens',
      body: '#232323', belly: '#f3f3ef', wing: '#1f1f1f', wingSpots: '#ffffff', tail: '#1f1f1f',
      head: '#f3f3ef', cap: '#1c1c1c', nape: '#d22b2b', eyeStripe: '#1c1c1c', beak: '#2a2a2a', beakType: 'chisel',
    },
    whiteThroat: {
      name: 'White-throated Sparrow',
      latin: 'Zonotrichia albicollis',
      body: '#8e6c4c', belly: '#c9c7c0', wing: '#7b5b3e', wingBars: '#e9e1d2', tail: '#6e5238',
      head: '#9a9892', cap: '#2a2723', crownStripe: '#f3f1ea', bib: '#f7f6f2', lore: '#e8c33a',
      beak: '#6f6a63', beakType: 'cone',
    },
  };

  const BEAKS = {
    cone: 'M96 34 L111 40 L96 46 Z',
    thin: 'M97 37 L108 40 L97 43 Z',
    needle: 'M97 38.5 L121 40 L97 41.5 Z',
    chisel: 'M96 36 L114 40 L96 43 Z',
  };

  const BODY = 'M28 60 C28 45 44 37 62 38 C80 39 94 47 93 60 C92 73 78 81 60 81 C42 81 28 74 28 60 Z';

  let uid = 0;

  W.species = SPECIES;

  // bird('cardinal', { size: 120, branch: true }) returns an <svg> string.
  W.bird = function bird(key, { size = 120, branch = true, label } = {}) {
    const s = SPECIES[key];
    const id = 'bd' + ++uid;
    const clipB = `url(#${id}b)`;
    const clipH = `url(#${id}h)`;
    const p = [];

    p.push(`<defs><clipPath id="${id}b"><path d="${BODY}"/></clipPath><clipPath id="${id}h"><circle cx="84" cy="40" r="14"/></clipPath></defs>`);
    if (branch) {
      p.push('<path class="branch" d="M4 89 C40 85 80 86 116 91" fill="none" stroke-width="4.5" stroke-linecap="round"/>');
      p.push('<path class="legs" d="M54 79 L52 88 M64 79 L64 88" fill="none" stroke-width="2.2" stroke-linecap="round"/>');
    }
    p.push(`<path d="M36 58 L6 72 L9 79 L38 68 Z" fill="${s.tail}"/>`);
    p.push(`<path d="${BODY}" fill="${s.body}"/>`);
    p.push(`<path clip-path="${clipB}" d="M40 78 C52 84 74 82 86 72 C93 66 95 58 92 50 C86 62 70 72 40 78 Z" fill="${s.belly}"/>`);
    if (s.streaks) {
      p.push(`<path clip-path="${clipB}" d="M58 70 l2 5 M66 68 l2 5 M74 65 l2 5 M82 61 l2 4 M70 74 l1.5 3.5" stroke="${s.streaks}" stroke-width="1.6" stroke-linecap="round" fill="none"/>`);
    }
    p.push(`<path d="M36 52 C50 44 72 46 80 56 C72 68 50 72 30 70 C28 64 30 56 36 52 Z" fill="${s.wing}"/>`);
    if (s.wingBars) {
      p.push(`<path d="M44 58 C54 54 66 55 74 59 M42 63 C52 60 64 61 72 64" stroke="${s.wingBars}" stroke-width="2" stroke-linecap="round" fill="none"/>`);
    }
    if (s.wingSpots) {
      p.push(`<g fill="${s.wingSpots}"><circle cx="46" cy="58" r="1.6"/><circle cx="54" cy="56" r="1.6"/><circle cx="62" cy="57" r="1.6"/><circle cx="50" cy="64" r="1.6"/><circle cx="58" cy="63" r="1.6"/><circle cx="66" cy="63" r="1.6"/></g>`);
    }
    if (s.crest) p.push(`<path d="M74 33 L70 10 L91 27 Z" fill="${s.head}"/>`);
    p.push(`<circle cx="84" cy="40" r="14" fill="${s.head}"/>`);
    if (s.cap) p.push(`<path clip-path="${clipH}" d="M60 20 H110 V35 C98 31 80 31 68 38 L60 40 Z" fill="${s.cap}"/>`);
    if (s.crownStripe) {
      p.push(`<path clip-path="${clipH}" d="M71 32 C78 26 90 25 99 30 M76 36 C82 33 90 33 97 35" stroke="${s.crownStripe}" stroke-width="2.4" stroke-linecap="round" fill="none"/>`);
    }
    if (s.eyeStripe) {
      p.push(`<path clip-path="${clipH}" d="M72 42 C80 38 90 38 99 40 M78 49 C84 47 90 47 96 45" stroke="${s.eyeStripe}" stroke-width="2.6" stroke-linecap="round" fill="none"/>`);
    }
    if (s.nape) p.push(`<path clip-path="${clipH}" d="M68 33 C68 28 72 26 76 27 L76 36 L68 37 Z" fill="${s.nape}"/>`);
    if (s.bib) p.push(`<path d="M84 47 C88 45 95 44 99 43 C99 50 94 55 87 55 C84 53 83 50 84 47 Z" fill="${s.bib}"/>`);
    if (s.mask) p.push(`<path d="M86 36 C90 31 100 32 102 38 C103 45 98 51 91 50 C87 47 85 41 86 36 Z" fill="${s.mask}"/>`);
    p.push(`<path d="${BEAKS[s.beakType]}" fill="${s.beak}"/>`);
    if (s.beakType === 'cone') p.push('<path d="M96 40 L109 40" stroke="rgba(0,0,0,.28)" stroke-width=".8"/>');
    if (s.lore) p.push(`<circle cx="95" cy="34" r="2" fill="${s.lore}"/>`);
    p.push('<circle cx="89" cy="37" r="2.4" fill="#141414"/><circle cx="89.8" cy="36.2" r=".8" fill="#fff"/>');

    const h = Math.round((size * 100) / 120);
    return `<svg class="bird" viewBox="0 0 120 100" width="${size}" height="${h}" role="img" aria-label="${label || s.name}">${p.join('')}</svg>`;
  };
})();
