// The demo's scenes: one setup step (connecting WBU to an assistant) and twelve
// MCP tools, each shown through a different customer at a different store
// across the US and Canada. Every store, person, price, event and sighting
// here is sample data.
//
// Realism rules the scenes follow:
// - The customer signs in once, when they connect WBU. Forms after that are
//   filled from their WBU account and live inside WBU's own card, the way
//   MCP Apps render in Claude and ChatGPT.
// - Tool inputs name a store, never a city or coordinates.
// - Every action is something the customer asked for: no coupons for emails,
//   no newsletters, no gift cards.
(function () {
  const W = (window.WBU = window.WBU || {});

  const ICONS = {
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    calendarCheck: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4M9 15l2 2 4-4"/>',
    box: '<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    bird: '<path d="M16 7h.01"/><path d="M3.5 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.3-2.3L2 20"/><path d="M20 7l2 .5-2 .5M10 18v3M14 17.7V21"/>',
    arrows: '<path d="M4 8h14l-3.5-3.5M20 16H6l3.5 3.5"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.6v.4M12 17h.01"/>',
    map: '<path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6z"/><path d="M9 4v14M15 6v14"/>',
    cloudSun: '<path d="M10 2.5v1.5M3.8 5.3l1 1M16.2 5.3l-1 1M2.5 11.5H4"/><path d="M6.5 11a3.6 3.6 0 0 1 6.8-1.8"/><path d="M8.5 20.5h8.5a3.5 3.5 0 0 0 0-7 5 5 0 0 0-9.4 1.3 2.9 2.9 0 0 0 .9 5.7z"/>',
    cloud: '<path d="M7 19h10a4 4 0 0 0 .6-8 6 6 0 0 0-11.5 1.6A3.3 3.3 0 0 0 7 19z"/>',
    bag: '<path d="M7 8h10l1.4 12a1 1 0 0 1-1 1.1H6.6a1 1 0 0 1-1-1.1z"/><path d="M8 8 6.5 3.5h11L16 8"/><path d="M9.5 13.5c1.3-1.3 3.7-1.3 5 0M9.5 17c1.3-1.3 3.7-1.3 5 0"/>',
    person: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7"/>',
    personCheck: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"/><path d="M16 11l2 2 4-4"/>',
    gift: '<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12"/><path d="M12 8C10.5 4 7 4 7 6s3 2 5 2c2 0 5 0 5-2s-3.5-2-5 2"/>',
    binoculars: '<circle cx="7" cy="16" r="3.5"/><circle cx="17" cy="16" r="3.5"/><path d="M10.5 16h3M4.5 13.5 7 5h3v8M19.5 13.5 17 5h-3v8"/>',
    book: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    play: '<path d="M7 4.5v15l12.5-7.5z" fill="currentColor" stroke="none"/>',
    pause: '<path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" stroke="none"/>',
    replay: '<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5"/><path d="M4 3.5v5h5"/>',
    prev: '<path d="M15 5l-7 7 7 7"/>',
    next: '<path d="M9 5l7 7-7 7"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    send: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    sound: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
    photo: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10.5" r="1.8"/><path d="M21 16l-5-5-9 8"/>',
  };

  W.icon = (name, cls = 'icon') =>
    `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

  // Systems behind the MCP server. Each scene lights the ones it reads.
  W.sources = [
    { id: 'hours', label: 'Store hours', icon: 'clock' },
    { id: 'inventory', label: 'Shelf counts', icon: 'box' },
    { id: 'events', label: 'Events', icon: 'calendar' },
    { id: 'field', label: 'Staff sightings', icon: 'binoculars' },
    { id: 'accounts', label: 'Customer accounts', icon: 'person' },
    { id: 'bookings', label: 'Staff calendars', icon: 'calendarCheck' },
    { id: 'catalog', label: 'Product guide', icon: 'book' },
    { id: 'weather', label: 'Local weather', icon: 'cloud' },
  ];

  // One customer per scene, each already signed in to their WBU account
  // (except in the Connect scene, which shows that sign-in).
  const person = (name, place, store, email, phone) => ({ name, first: name.split(' ')[0], place, store, email, phone });
  const P = {
    jamie: person('Jamie R.', 'Carmel, Indiana', 'Carmel', 'jamie.r@example.com', '(317) 555-0142'),
    maria: person('Maria G.', 'Tucson, Arizona', 'Tucson', 'maria.g@example.com', '(520) 555-0134'),
    priya: person('Priya S.', 'Ottawa, Ontario', 'Ottawa West', 'priya.s@example.com', '(613) 555-0187'),
    luis: person('Luis M.', 'Sarasota, Florida', 'Sarasota', 'luis.m@example.com', '(941) 555-0120'),
    sam: person('Sam K.', 'Portland, Oregon', 'Portland', 'sam.k@example.com', '(503) 555-0166'),
    morgan: person('Morgan D.', 'Halifax, Nova Scotia', 'Halifax', 'morgan.d@example.com', '(902) 555-0112'),
    chris: person('Chris P.', 'Las Vegas, Nevada', 'Las Vegas', 'chris.p@example.com', '(702) 555-0158'),
    taylor: person('Taylor B.', 'Raleigh, North Carolina', 'Raleigh', 'taylor.b@example.com', '(919) 555-0173'),
    jordan: person('Jordan L.', 'Minneapolis, Minnesota', 'Minneapolis', 'jordan.l@example.com', '(612) 555-0149'),
    pat: person('Pat W.', 'Columbus, Ohio', 'Columbus', 'pat.w@example.com', '(614) 555-0191'),
    robin: person('Robin H.', 'Naperville, Illinois', 'Naperville', 'robin.h@example.com', '(630) 555-0127'),
    casey: person('Casey N.', 'Austin, Texas', 'Austin', 'casey.n@example.com', '(512) 555-0138'),
  };

  // Form fields. `account` fields come prefilled from the customer's WBU
  // account; the others are typed in.
  const acct = (label, value) => ({ label, value, account: true });
  const ask = (label, value, type) => ({ label, value, type });

  const bird = (k, o) => W.bird(k, o);
  const btn = (label, { form = 'default', context = '', auto = false, primary = auto, disabled = false, cls = '' } = {}) =>
    `<button type="button" class="btn${primary ? ' btn-primary' : ''}${cls ? ' ' + cls : ''}" data-cta="${form}"${context ? ` data-context="${context}"` : ''}${auto ? ' data-auto' : ''}${disabled ? ' disabled' : ''}>${label}</button>`;
  // A button that just changes state, with no form and nothing captured.
  const toggle = (label, done) => `<button type="button" class="btn" data-toggle="${done}">${label}</button>`;
  const spark = (values, tone) => {
    const max = Math.max(...values) || 1;
    const bars = values
      .map((v, i) => {
        const h = Math.max(1.5, (v / max) * 22);
        return `<rect x="${i * 6}" y="${24 - h}" width="4" height="${h}" rx="1"/>`;
      })
      .join('');
    return `<svg class="spark spark-${tone}" viewBox="0 0 82 24" width="82" height="24" aria-hidden="true">${bars}</svg>`;
  };
  const meter = (have, of) =>
    `<span class="meter" role="img" aria-label="${have} of ${of}">${Array.from({ length: of }, (_, i) => `<i${i < have ? ' class="on"' : ''}></i>`).join('')}</span>`;

  W.scenes = [
    {
      id: 'connect',
      connect: true,
      who: P.jamie,
      name: 'Connect',
      blurb: 'Suggested in chat, one sign-in',
      icon: 'link',
      phases: ['Customer asks', 'AI finds WBU', 'AI suggests it', 'Customer signs in'],
      query: 'Where can I get good bird seed near me today?',
      tool: { name: 'not connected' },
      sources: ['accounts'],
      result: 'Suggested: Wild Birds Unlimited',
      reply:
        'I can search the web, but Wild Birds Unlimited can check live hours and shelf stock at the stores near you. Want to connect it?',
      widget: () => `
        <div class="suggest" data-reveal>
          <span class="suggest-mark">${bird('cardinal', { size: 40, branch: false, label: '' })}</span>
          <div>
            <strong>Wild Birds Unlimited</strong>
            <span class="muted">Live hours, shelf stock, events and your Bird Food Bank, from stores across the US and Canada.</span>
          </div>
          ${btn('Connect', { auto: true })}
        </div>`,
      forms: {
        default: {
          modal: true,
          title: 'Sign in to Wild Birds Unlimited',
          fields: [ask('Email', P.jamie.email, 'email'), ask('Password', 'birdseed22', 'password')],
          consent: 'Your AI assistant will be able to see your home store and Bird Food Bank, and place holds, RSVPs and bookings when you confirm them. Disconnect anytime.',
          submit: 'Sign in and connect',
          done: 'Connected',
          confirm: `Connected as ${P.jamie.email}. Your home store is Carmel, so answers will start there.`,
          captured: [['Account', `${P.jamie.email}, verified`], ['Home store', 'Carmel'], ['Linked to', 'AI assistant']],
        },
      },
      ledger: { accounts: 1 },
      note: 'Claude and ChatGPT suggest connectors from their directories when a question fits. The customer signs in once.',
    },

    {
      id: 'open-now',
      who: P.jamie,
      name: 'Open now',
      blurb: 'Live hours, closures and curbside',
      icon: 'clock',
      query: 'Is the Carmel store open right now? I need seed before the weekend.',
      tool: { name: 'find_stores', args: { open_now: true, include: ['closures', 'curbside'] } },
      sources: ['hours', 'accounts'],
      result: '3 stores, 1 closure today',
      latency: '142 ms',
      reply:
        'Yes. Carmel is open until 6 pm and has curbside pickup until 5:30. One thing to know: Indianapolis North is closed today for inventory, even though map listings show it open.',
      widget: () => `
        <ul class="stores">
          ${[
            { name: 'Carmel', dist: '2.1 mi', open: true, status: 'Open until 6:00 pm', extra: 'Curbside until 5:30 pm', weekend: 'Sat 9 to 5, Sun 12 to 4', cta: btn('Set up curbside', { context: 'Carmel', auto: true }) },
            { name: 'Fishers', dist: '7.8 mi', open: true, status: 'Open until 7:00 pm', extra: 'No curbside on Mondays', weekend: 'Sat 9 to 6, Sun 11 to 5', cta: btn('Order for pickup', { context: 'Fishers', form: 'pickup' }) },
            { name: 'Indianapolis North', dist: '9.4 mi', open: false, status: 'Closed today for inventory', extra: 'Reopens Tuesday at 10:00 am', weekend: 'Sat 9 to 5, Sun closed', cta: '' },
          ]
            .map(
              (s) => `
            <li class="store" data-reveal>
              <div class="store-name"><strong>${s.name}</strong> <span class="muted">${s.dist}</span></div>
              <div class="status ${s.open ? 'is-open' : 'is-closed'}"><i></i>${s.status}</div>
              <div class="store-meta">${s.extra}. Weekend: ${s.weekend}.</div>
              <div class="store-action">${s.cta}</div>
            </li>`,
            )
            .join('')}
        </ul>`,
      forms: {
        default: {
          title: 'Curbside pickup at {context}',
          fields: [acct('Order', 'Seed blend, 20 lb (your usual)'), ask('Pickup', 'Today, 5:00 pm'), acct('Text updates to', P.jamie.phone)],
          consent: 'Pay when you pick it up. The store texts you when it’s ready.',
          submit: 'Place order',
          done: 'Ordered',
          confirm: 'Ordered. Your seed will be at {context} curbside at 5:00 pm. Pay at pickup.',
          captured: [['Pickup', 'Curbside today, 5:00 pm'], ['Order', 'Seed blend, 20 lb'], ['Store', '{context}']],
        },
        pickup: {
          title: 'In-store pickup at {context}',
          fields: [acct('Order', 'Seed blend, 20 lb (your usual)'), ask('Pickup', 'Today, 6:30 pm')],
          consent: 'Pay when you pick it up.',
          submit: 'Place order',
          done: 'Ordered',
          confirm: 'Ordered. Your seed will be at the {context} counter at 6:30 pm.',
          captured: [['Pickup', 'In store today, 6:30 pm'], ['Order', 'Seed blend, 20 lb']],
        },
      },
      ledger: { visits: 1, signals: 1 },
      note: 'Each franchise sets its own hours, holiday closures and curbside windows. Map listings lag by days.',
      asks: 'Is the Carmel store open right now?',
      knows: 'Today’s hours, one-off closures and curbside windows for every store',
      captures: 'A curbside order, and a store visit',
    },

    {
      id: 'events',
      who: P.maria,
      name: 'Events',
      blurb: 'Walks, classes and spots left',
      icon: 'calendar',
      query: 'Are there any bird walks or kids’ events near me in October?',
      tool: { name: 'list_events', args: { store: 'tucson', month: '2026-10' } },
      sources: ['events'],
      result: '5 events with live spot counts',
      latency: '96 ms',
      reply: 'The Tucson store has five events in October, including a hummingbird banding demo. The kids’ birdhouse build fills up fast and has 4 spots left.',
      widget: () => `
        <div class="chips" role="group" aria-label="Filter events" data-reveal>
          ${['All', 'Walks', 'Kids', 'Classes', 'Sales']
            .map((c, i) => `<button type="button" class="chip" data-filter="${c}" aria-pressed="${i === 0}">${c}</button>`)
            .join('')}
        </div>
        <ul class="events">
          ${[
            { m: 'Oct', d: '3', day: 'Sat', time: '7:00 am', title: 'Bird walk at Sweetwater Wetlands', cat: 'Walks', spots: '8 of 15 spots left', price: 'Free' },
            { m: 'Oct', d: '10', day: 'Sat', time: '8:00 am', title: 'Hummingbird banding demo, with a licensed bander', cat: 'Classes', spots: '12 seats left', price: '$5' },
            { m: 'Oct', d: '16', day: 'Fri', time: 'Through Oct 18', title: 'Fall Seed Sale', cat: 'Sales', spots: 'Bird Food Bank members shop Thursday night', price: '', sale: true },
            { m: 'Oct', d: '17', day: 'Sat', time: '10:30 am', title: 'Kids build a birdhouse', cat: 'Kids', spots: '4 of 12 spots left', price: 'Free, ages 5 to 12', auto: true },
            { m: 'Oct', d: '22', day: 'Thu', time: '6:30 pm', title: 'Owls of the Sonoran Desert', cat: 'Classes', spots: '18 seats left', price: '$5' },
          ]
            .map(
              (e) => `
            <li class="event" data-cat="${e.cat}" data-reveal>
              <div class="datebox"><span>${e.m}</span><strong>${e.d}</strong><span>${e.day}</span></div>
              <div class="event-body">
                <strong>${e.title}</strong>
                <span class="muted">${e.time}${e.price ? `. ${e.price}` : ''}</span>
                <span class="spots">${e.spots}</span>
              </div>
              ${e.sale ? toggle('Add to calendar', 'Added') : btn('Save a spot', { context: e.title, auto: e.auto })}
            </li>`,
            )
            .join('')}
        </ul>`,
      forms: {
        default: {
          title: 'Save a spot: {context}',
          fields: [acct('Name', P.maria.name), acct('Email', P.maria.email), ask('People coming', '2 kids, 1 adult')],
          consent: 'The Tucson store emails a reminder the day before, and nothing else.',
          submit: 'Save spot',
          done: 'Spot saved',
          confirm: 'You’re in for {context}. A reminder email goes out the day before.',
          captured: [['RSVP', '{context}'], ['Household', '2 kids'], ['Interest', 'Family events']],
        },
      },
      ledger: { visits: 1, signals: 2 },
      note: 'Events live in store newsletters and social posts. Spot counts change by the hour.',
      asks: 'Any bird walks or kids’ events near me?',
      knows: 'Every store’s walks, classes and sales, with live spot counts',
      captures: 'RSVPs, household size and event interests',
    },

    {
      id: 'shelf-check',
      who: P.priya,
      name: 'Shelf check',
      blurb: 'In stock nearby, held for you',
      icon: 'box',
      query: 'Does any store near me have a squirrel-proof feeder in stock? I want it today.',
      tool: { name: 'check_inventory', args: { category: 'squirrel-proof feeders', pickup: 'today' } },
      sources: ['inventory', 'hours'],
      result: 'live counts from 3 registers',
      latency: '188 ms',
      reply: 'Yes. Ottawa West has 3 of the large squirrel-proof tube feeder on the shelf, and it’s open until 6. Want me to hold one?',
      widget: () => `
        <div class="product" data-reveal>
          <svg class="product-art" viewBox="0 0 64 80" width="56" height="70" aria-hidden="true">
            <path d="M32 2v8" stroke="currentColor" stroke-width="2" fill="none"/>
            <rect x="18" y="10" width="28" height="8" rx="3" fill="#1d5a4a"/>
            <rect x="21" y="18" width="22" height="48" rx="4" fill="#e8dcc4" stroke="#1d5a4a" stroke-width="2"/>
            <path d="M24 30h16M24 42h16M24 54h16" stroke="#b98e5d" stroke-width="2"/>
            <path d="M12 38h10M42 50h10" stroke="#1d5a4a" stroke-width="3" stroke-linecap="round"/>
            <rect x="18" y="66" width="28" height="6" rx="2" fill="#1d5a4a"/>
          </svg>
          <div>
            <strong>Squirrel-proof tube feeder, large</strong>
            <span class="muted">$119.99 CAD. The perches close when a squirrel climbs on.</span>
          </div>
        </div>
        <ul class="stock">
          <li data-reveal><span class="stock-store"><strong>Ottawa West</strong> <span class="muted">3.4 km</span></span>${meter(3, 6)}<span>3 on the shelf</span>${btn('Hold one', { context: 'Ottawa West', auto: true })}</li>
          <li data-reveal><span class="stock-store"><strong>Kanata</strong> <span class="muted">14 km</span></span>${meter(1, 6)}<span>1 left</span>${btn('Hold one', { context: 'Kanata' })}</li>
          <li data-reveal><span class="stock-store"><strong>Orléans</strong> <span class="muted">19 km</span></span>${meter(0, 6)}<span>6 arrive Thursday</span>${btn('Tell me when', { context: 'Orléans', form: 'notify' })}</li>
        </ul>`,
      forms: {
        default: {
          title: 'Hold a feeder at {context}',
          fields: [acct('Name', P.priya.name), acct('Text updates to', P.priya.phone)],
          consent: 'Held until close tomorrow. Pay at pickup.',
          submit: 'Hold it',
          done: 'Held',
          confirm: 'Held at {context} until 6 pm tomorrow. Hold number C-2291.',
          captured: [['Hold', 'C-2291 at {context}'], ['Wants', 'Squirrel-proof feeder, $119.99 CAD']],
        },
        notify: {
          title: 'Restock text from {context}',
          fields: [acct('Text to', P.priya.phone)],
          consent: 'One text when the delivery is on the shelf.',
          submit: 'Text me',
          done: 'Text set',
          confirm: 'Set. We’ll text you Thursday when {context} has it on the shelf.',
          captured: [['Restock text', '{context}, Thursday'], ['Wants', 'Squirrel-proof feeder, $119.99 CAD']],
        },
      },
      ledger: { visits: 1, signals: 1 },
      note: 'Shelf counts come straight from each store’s register, in Canada and the US alike.',
      asks: 'Who has a squirrel-proof feeder in stock today?',
      knows: 'Live shelf counts at each store',
      captures: 'Holds for same-day pickup',
    },

    {
      id: 'bird-of-the-day',
      who: P.luis,
      name: 'Bird of the day',
      blurb: 'From your store’s own feeder',
      icon: 'bird',
      query: 'What’s the bird of the day at my store?',
      tool: { name: 'bird_of_the_day', args: { store: 'sarasota' } },
      sources: ['field'],
      result: 'picked by Sarasota staff at 8:10 am',
      latency: '64 ms',
      reply: 'It’s a Painted Bunting, the first one back at the Sarasota store’s feeders since spring. They spend the winter in Florida.',
      widget: () => `
        <article class="botd">
          <div class="botd-art" data-reveal>${bird('paintedBunting', { size: 170 })}</div>
          <div class="botd-text">
            <h4 data-reveal>Painted Bunting <em>Passerina ciris</em></h4>
            <blockquote data-reveal>“A male on the millet feeder at 8:10. First one back since April!” <cite>Ana, Sarasota store</cite></blockquote>
            <p data-reveal>They nest from Texas to the coastal Carolinas and spend the winter in Florida.</p>
            <p data-reveal><strong>Feed it:</strong> white millet in a caged feeder, so bigger birds can’t crowd it out.</p>
            <div class="row-actions" data-reveal>
              <button type="button" class="btn" data-song>${W.icon('sound')}<span>Play its song</span><span class="wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span></button>
              ${btn('I saw one too', { auto: true })}
            </div>
          </div>
        </article>`,
      forms: {
        default: {
          title: 'Add your sighting',
          fields: [ask('What you saw', '1 male'), ask('When', 'This morning')],
          consent: 'Your sighting joins the Sarasota store’s local count, shown without your name.',
          submit: 'Add sighting',
          done: 'Sighting added',
          confirm: 'Added. Yours is the 4th Painted Bunting report near Sarasota this fall.',
          captured: [['Sighting', '1 Painted Bunting, this morning'], ['Backyard list', 'Painted Bunting added']],
        },
      },
      ledger: { signals: 1 },
      note: 'Picked by staff from their own feeder window, so it’s different in every town, every day.',
      asks: 'What’s the bird of the day at my store?',
      knows: 'What store staff saw at the feeder this morning',
      captures: 'Customer sightings for the local count',
    },

    {
      id: 'migration',
      who: P.sam,
      name: 'Migration watch',
      blurb: 'Who’s arriving, who’s leaving',
      icon: 'arrows',
      query: 'Have the hummingbirds left yet around here? Should I take my feeder down?',
      tool: { name: 'recent_sightings', args: { store: 'portland', days: 14 } },
      sources: ['field', 'accounts'],
      result: '187 reports from staff and customers',
      latency: '121 ms',
      reply: 'Keep it up. Rufous Hummingbirds left in August, but Anna’s Hummingbirds stay in Portland all winter, and they’ll count on your feeder when it’s cold.',
      widget: () => `
        <ul class="sightings">
          ${[
            { k: 'annas', trend: 'Here all winter', tone: 'flat', meta: 'At feeders daily', v: [5, 6, 5, 6, 6, 5, 6, 6, 5, 6, 6, 6, 5, 6] },
            { k: 'rufous', trend: 'Gone south', tone: 'down', meta: 'Last seen Aug 28', v: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
            { k: 'oregonJunco', trend: 'Arriving', tone: 'up', meta: 'First report Sep 24', v: [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 3, 4, 6] },
            { k: 'goldenCrowned', trend: 'Arriving', tone: 'up', meta: '11 reports this week', v: [0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 4, 4, 5] },
          ]
            .map(
              (r) => `
            <li data-reveal>
              ${bird(r.k, { size: 52, branch: false })}
              <div class="sighting-name"><strong>${W.species[r.k].name}</strong><span class="trend trend-${r.tone}">${r.trend}</span></div>
              ${spark(r.v, r.tone)}
              <span class="muted small">${r.meta}</span>
            </li>`,
            )
            .join('')}
        </ul>
        <div class="row-actions" data-reveal>${btn('Text me before freezing nights', { auto: true })}</div>`,
      forms: {
        default: {
          title: 'Freezing-night texts',
          fields: [acct('Text to', P.sam.phone)],
          consent: 'A text the evening before a night below freezing, so you can bring the nectar in. Through February, and nothing else.',
          submit: 'Turn on texts',
          done: 'Texts on',
          confirm: 'Done. We’ll text you before freezing nights so your Anna’s always have nectar.',
          captured: [['Opted in', 'Freezing-night texts'], ['Interest', 'Anna’s Hummingbirds']],
        },
      },
      ledger: { signals: 2 },
      note: 'Built from sightings logged by store staff and customers. That’s first-party data no one else has.',
      asks: 'Have the hummingbirds left yet?',
      knows: 'Local arrivals and departures, from staff and customer reports',
      captures: 'Text opt-ins the customer asked for, and species interests',
    },

    {
      id: 'bird-id',
      who: P.morgan,
      name: 'Bird ID',
      blurb: 'Ranked by local sightings',
      icon: 'search',
      query: 'Small brown bird at my feeder with a streaky chest and a red head. What is it?',
      tool: {
        name: 'identify_bird',
        args: { description: 'small, brown, streaky chest, red head', store: 'halifax', date: '2026-09-28' },
      },
      sources: ['field', 'catalog'],
      result: '2 matches, ranked by local reports',
      latency: '233 ms',
      reply: 'Around Halifax it could be either finch. Purple Finches are about as common as House Finches here this month, so check its sides: brown streaks mean House Finch.',
      widget: () => `
        <div class="matches">
          <article class="match" data-reveal>
            ${bird('houseFinch', { size: 120 })}
            <h4>House Finch <em>Haemorhous mexicanus</em></h4>
            <div class="confidence"><span style="width:55%"></span></div>
            <p><strong>55% match.</strong> 26 reports near Halifax this month. Brown streaks down the sides, red on the head and chest.</p>
          </article>
          <article class="match" data-reveal>
            ${bird('purpleFinch', { size: 120 })}
            <h4>Purple Finch <em>Haemorhous purpureus</em></h4>
            <div class="confidence"><span style="width:43%"></span></div>
            <p><strong>43% match.</strong> 22 reports this month. Raspberry red over the head and back, with no brown streaks on the belly.</p>
          </article>
        </div>
        <p class="widget-foot" data-reveal><strong>Feed them:</strong> sunflower chips in a tube feeder. Still not sure? A store expert can look at a photo.</p>
        <div class="row-actions" data-reveal>${btn('Send a photo to the Halifax store', { auto: true })}</div>`,
      forms: {
        default: {
          title: 'Ask the Halifax store',
          fields: [{ label: 'Photo', value: 'feeder-bird.jpg', attach: true }, acct('Reply to', P.morgan.email)],
          consent: 'Ben at the Halifax store replies by email.',
          submit: 'Send photo',
          done: 'Photo sent',
          confirm: 'Sent to Ben at the Halifax store. Expect a reply by email this afternoon.',
          captured: [['Question', 'Photo ID, sent to Halifax store'], ['Interest', 'Finches']],
        },
      },
      ledger: { signals: 1 },
      note: 'Ranks look-alikes by what’s showing up at feeders near the store this week. In Halifax, that changes the answer.',
      asks: 'What’s this streaky bird with a red head?',
      knows: 'Which look-alikes are actually around this week, store by store',
      captures: 'A question for a store expert',
    },

    {
      id: 'no-birds',
      who: P.chris,
      name: 'Why no birds?',
      blurb: 'Diagnosed with this week’s data',
      icon: 'help',
      query: 'The birds suddenly stopped coming to my feeder this week. What am I doing wrong?',
      tool: { name: 'diagnose_feeder', args: { store: 'las-vegas', symptom: 'sudden drop in visits', since: '2026-09-22' } },
      sources: ['field', 'weather'],
      result: '3 likely causes',
      latency: '157 ms',
      reply: 'Probably nothing you did. Here’s what’s happening around Las Vegas this week, most likely first.',
      widget: () => `
        <ol class="diagnosis">
          <li data-reveal>
            <span class="likely likely-high">Likely</span>
            <div><strong>It’s still over 100°F.</strong> Birds feed at dawn and rest through the heat. Check your feeder between 6 and 8 am.</div>
          </li>
          <li data-reveal>
            <span class="likely likely-high">Likely</span>
            <div><strong>A hawk is hunting nearby.</strong> Staff logged a Cooper’s hawk near the store 3 times this week. Songbirds lie low for a few days. A feeder near a shrub gives them cover.</div>
          </li>
          <li data-reveal>
            <span class="likely">Check</span>
            <div><strong>They may want water more than seed.</strong> In this heat, a shallow bird bath brings in more birds than any feeder.</div>
          </li>
        </ol>
        <div class="row-actions" data-reveal>${btn('Show me a water setup for the heat', { auto: true })}</div>`,
      forms: {
        default: {
          reveal: true,
          fields: [],
          done: 'Shown below',
          after: () => `
            <strong>A bird bath that works in desert heat</strong>
            <ol class="steps">
              <li>Use a basin no deeper than 2 inches.</li>
              <li>Put it in shade, within a few feet of a shrub.</li>
              <li>Rinse and refill it every morning.</li>
              <li>Add a dripper. Moving water draws birds from farther away.</li>
            </ol>`,
          captured: [['Question', 'Birds stopped visiting'], ['Local causes', 'Heat and a hawk nearby']],
        },
      },
      ledger: { signals: 1 },
      note: 'Local heat, hawk reports and store advice turn a generic FAQ into an answer about this week.',
      asks: 'Why did birds stop coming to my feeder?',
      knows: 'Local heat, hawk reports and what wild food is in season',
      captures: 'What problems customers have, store by store',
    },

    {
      id: 'yard-plan',
      who: P.taylor,
      name: 'Yard plan',
      blurb: 'A setup you can buy today',
      icon: 'map',
      query: 'I want cardinals and bluebirds on my small patio, but squirrels are a problem. What should I set up?',
      tool: {
        name: 'build_feeding_plan',
        args: { goals: ['Northern Cardinal', 'Eastern Bluebird'], space: 'patio', problems: ['squirrels'], store: 'raleigh' },
      },
      sources: ['catalog', 'inventory'],
      result: '4 items, all in stock at Raleigh',
      latency: '204 ms',
      reply: 'Here’s a setup that works on a small patio and keeps squirrels off. Everything is in stock at the Raleigh store.',
      widget: () => `
        <div class="plan">
          <svg class="plan-art" viewBox="0 0 260 170" role="img" aria-label="Patio plan: pole with squirrel baffle 10 feet from the house and 8 feet from a shrub" data-reveal>
            <rect x="8" y="8" width="244" height="22" rx="3" class="plan-house"/>
            <text x="130" y="23" class="plan-label" text-anchor="middle">house</text>
            <rect x="24" y="42" width="212" height="116" rx="6" class="plan-patio"/>
            <circle cx="52" cy="128" r="20" class="plan-shrub"/><circle cx="74" cy="140" r="14" class="plan-shrub"/>
            <text x="44" y="100" class="plan-label">shrub</text>
            <circle cx="160" cy="112" r="17" class="plan-baffle"/>
            <circle cx="160" cy="112" r="4" class="plan-pole"/>
            <rect x="170" y="94" width="14" height="12" rx="2" class="plan-feeder"/>
            <circle cx="142" cy="97" r="6" class="plan-dish"/>
            <path d="M160 32v62" class="plan-dim"/><text x="166" y="66" class="plan-label">10 ft</text>
            <path d="M88 124h52" class="plan-dim"/><text x="98" y="118" class="plan-label">8 ft</text>
            <text x="160" y="148" class="plan-label" text-anchor="middle">pole + baffle</text>
          </svg>
          <ul class="plan-items">
            <li data-reveal><span>Pole system with squirrel baffle</span><span>$74.99</span></li>
            <li data-reveal><span>Hopper feeder</span><span>$44.99</span></li>
            <li data-reveal><span>Safflower seed, 10 lb. Cardinals love it, squirrels don’t.</span><span>$18.99</span></li>
            <li data-reveal><span>Mealworm dish for bluebirds</span><span>$24.99</span></li>
            <li class="plan-total" data-reveal><span>All in stock at Raleigh</span><span>$163.96</span></li>
          </ul>
        </div>
        <div class="row-actions" data-reveal>
          <span class="plan-birds">${bird('cardinal', { size: 48, branch: false })}${bird('bluebird', { size: 48, branch: false })}</span>
          ${toggle('Save plan to my account', 'Saved to your account')}
          ${btn('Hold everything at Raleigh', { auto: true })}
        </div>`,
      forms: {
        default: {
          title: 'Hold the patio plan at Raleigh',
          fields: [acct('Name', P.taylor.name), acct('Text updates to', P.taylor.phone)],
          consent: 'We’ll bag it and hold it for two days. Pay at pickup.',
          submit: 'Hold everything',
          done: 'Held at Raleigh',
          confirm: 'Held. All four items are waiting at the Raleigh counter under Taylor B.',
          captured: [['Hold', '4 items, $163.96'], ['Yard', 'Small patio, squirrels'], ['Wants', 'Cardinals, bluebirds']],
        },
      },
      ledger: { visits: 1, signals: 2 },
      note: 'The store’s own advice plus its own stock means the plan is buyable today.',
      asks: 'What should I set up for cardinals on a small patio?',
      knows: 'Which products solve which problems, and what’s on the local shelf',
      captures: 'A hold, a yard profile and basket value',
    },

    {
      id: 'forecast',
      who: P.jordan,
      name: 'Feeding forecast',
      blurb: 'Weather matched to the shelf',
      icon: 'cloudSun',
      query: 'It’s getting cold. How should I change what I put out this week?',
      tool: { name: 'feeding_forecast', args: { store: 'minneapolis', days: 5 } },
      sources: ['weather', 'inventory', 'field'],
      result: '5-day plan, stock checked',
      latency: '175 ms',
      reply: 'A cold front comes through Wednesday, with the first hard freeze Thursday morning. Here’s what to put out and when.',
      widget: () => `
        <ol class="days" data-reveal>
          ${[
            { d: 'Mon', hi: 62, lo: 45, w: 'sun' },
            { d: 'Tue', hi: 57, lo: 41, w: 'part' },
            { d: 'Wed', hi: 48, lo: 33, w: 'rain' },
            { d: 'Thu', hi: 41, lo: 26, w: 'frost', hot: true },
            { d: 'Fri', hi: 50, lo: 32, w: 'sun' },
          ]
            .map(
              (x) => `
            <li class="${x.hot ? 'is-frost' : ''}">
              <span class="day">${x.d}</span>
              ${weatherGlyph(x.w)}
              <span class="temps"><strong>${x.hi}°</strong> <span class="muted">${x.lo}°</span></span>
            </li>`,
            )
            .join('')}
        </ol>
        <ul class="tips">
          <li data-reveal><strong>Wednesday night: put out suet.</strong> Birds burn fat to get through a freezing night. The Minneapolis store has 14 suet cakes in stock.</li>
          <li data-reveal><strong>Thursday: scatter seed on the ground</strong> for the juncos arriving this week.</li>
          <li data-reveal><strong>This weekend: switch to a heated birdbath</strong> before the water starts freezing overnight.</li>
        </ul>
        <div class="row-actions" data-reveal>${btn('Hold 6 suet cakes for Wednesday', { auto: true })}</div>`,
      forms: {
        default: {
          title: 'Hold suet at Minneapolis',
          fields: [ask('Pickup', 'Wednesday after 4 pm'), acct('Name', P.jordan.name)],
          consent: 'Held through Thursday. Pay at pickup.',
          submit: 'Hold suet',
          done: 'Held',
          confirm: 'Held. Six suet cakes are waiting at the Minneapolis store for Wednesday.',
          captured: [['Hold', '6 suet cakes, Wednesday'], ['Interest', 'Winter feeding']],
        },
      },
      ledger: { visits: 1, signals: 1 },
      note: 'The weather is public. Pairing it with what’s on the store shelf isn’t.',
      asks: 'How should I change what I put out this week?',
      knows: 'Weather matched to local stock and staff advice',
      captures: 'A hold timed to the weather',
    },

    {
      id: 'food-bank',
      who: P.pat,
      name: 'Bird Food Bank',
      blurb: 'Your prepaid seed balance',
      icon: 'bag',
      query: 'How much seed do I have left in my Bird Food Bank?',
      tool: { name: 'get_bird_food_bank', args: {} },
      sources: ['accounts'],
      result: 'balance for Pat W. at Columbus',
      latency: '58 ms',
      reply: 'You have 34 of your 80 pounds left at the Columbus store. At your usual pace, that lasts until about Nov 30.',
      widget: () => `
        <ul class="balance">
          <li data-reveal><span>Seed blend</span>${meter(4, 10)}<strong>34 of 80 lb left</strong></li>
          <li data-reveal><span>Suet cakes</span>${meter(2, 6)}<strong>2 of 6 left</strong></li>
          <li data-reveal><span>Saved this year</span><span></span><strong>$41.20</strong></li>
        </ul>
        <div class="row-actions" data-reveal>${btn('Reserve 20 lb for Saturday pickup', { auto: true })}</div>`,
      forms: {
        default: {
          title: 'Reserve seed from your Bird Food Bank',
          fields: [ask('Pickup', 'Saturday, 10:00 am, curbside'), acct('Text updates to', P.pat.phone)],
          consent: 'Drawn from your prepaid balance, so there’s nothing to pay.',
          submit: 'Reserve seed',
          done: 'Reserved',
          confirm: 'Reserved. 20 lb will be at Columbus curbside Saturday at 10:00 am, leaving 14 lb in your balance.',
          captured: [['Pickup', '20 lb, Saturday 10 am'], ['Balance after', '14 lb']],
        },
      },
      ledger: { visits: 1 },
      note: 'Private account data. The assistant reaches it only because Pat linked their account.',
      asks: 'How much seed is left in my Bird Food Bank?',
      knows: 'Prepaid seed balances, usage and savings',
      captures: 'Repeat pickups from prepaid seed',
    },

    {
      id: 'expert',
      who: P.robin,
      name: 'Book an expert',
      blurb: 'Free yard consults',
      icon: 'personCheck',
      query: 'Can someone from the store help me get my yard ready for winter birds? I’m free Saturday.',
      tool: { name: 'find_expert_slots', args: { store: 'naperville', topic: 'winter yard setup', date: '2026-10-03' } },
      sources: ['bookings'],
      result: '4 open slots Saturday',
      latency: '112 ms',
      reply: 'Marcus at the Naperville store does free 30-minute yard consults, in the store or by video. He has four openings Saturday.',
      widget: () => `
        <div class="expert" data-reveal>
          <span class="avatar" aria-hidden="true">M</span>
          <div>
            <strong>Marcus, bird feeding specialist</strong>
            <span class="muted">Naperville store. 12 years helping people plan their yards.</span>
          </div>
        </div>
        <div class="chips" role="group" aria-label="Meeting format" data-reveal>
          <button type="button" class="chip" data-format aria-pressed="true">In the store</button>
          <button type="button" class="chip" data-format aria-pressed="false">Video call</button>
        </div>
        <div class="slots" data-reveal>
          <span class="slots-day">Saturday, Oct 3</span>
          ${[
            ['9:30 am', true],
            ['11:00 am', false, true],
            ['12:30 pm', true],
            ['1:30 pm', false],
            ['3:00 pm', false],
            ['4:00 pm', false],
          ]
            .map(([t, taken, auto]) => btn(t, { context: t, auto, primary: false, disabled: taken, cls: 'slot' }))
            .join('')}
        </div>`,
      forms: {
        default: {
          title: 'Book Marcus, Saturday at {context}',
          fields: [acct('Name', P.robin.name), acct('Email', P.robin.email)],
          consent: 'Free. You’ll get a calendar invite and a reminder the day before.',
          submit: 'Book consult',
          done: 'Booked {context}',
          confirm: 'Booked. Marcus will see you Saturday at {context}. A calendar invite is on its way.',
          captured: [['Visit', 'Sat {context}, Naperville'], ['Topic', 'Winter yard setup']],
        },
      },
      ledger: { visits: 1, signals: 1 },
      note: 'Staff calendars are internal. Booking here turns a chat into a store visit with an expert.',
      asks: 'Can someone help me get my yard ready for winter?',
      knows: 'Which experts are free, and when',
      captures: 'A booked store visit',
    },

    {
      id: 'gifts',
      who: P.casey,
      name: 'Gift finder',
      blurb: 'Picks from the local shelf',
      icon: 'gift',
      query: 'Gift ideas under $50 for my dad? He’s obsessed with woodpeckers.',
      tool: { name: 'suggest_gifts', args: { budget: 50, interests: ['woodpeckers'], store: 'austin' } },
      sources: ['catalog', 'inventory'],
      result: '3 picks in stock, gift wrap open',
      latency: '167 ms',
      reply: 'Here are three woodpecker picks under $50, all on the shelf at the Austin store, which wraps gifts for free.',
      widget: () => `
        <div class="gifts">
          <article class="gift" data-reveal>
            ${bird('downy', { size: 110 })}
            <strong>Tail-prop suet feeder</strong>
            <span class="muted">Woodpeckers brace on the prop like they do on a tree.</span>
            <span class="gift-price">$34.99 <span class="muted">5 in stock</span></span>
          </article>
          <article class="gift" data-reveal>
            <svg viewBox="0 0 120 100" width="110" height="92" aria-hidden="true">
              <rect x="38" y="22" width="44" height="12" rx="3" fill="#1d5a4a"/>
              <path d="M36 34h48v44a8 8 0 0 1-8 8H44a8 8 0 0 1-8-8z" fill="#c9a273"/>
              <rect x="42" y="48" width="36" height="22" rx="3" fill="#f4ecdc"/>
              <path d="M48 56h24M48 62h16" stroke="#1d5a4a" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
            <strong>Spreadable suet starter kit</strong>
            <span class="muted">Smear it right on the bark. Comes with a spreader.</span>
            <span class="gift-price">$29.99 <span class="muted">8 in stock</span></span>
          </article>
          <article class="gift" data-reveal>
            <svg viewBox="0 0 120 100" width="110" height="92" aria-hidden="true">
              <path d="M30 20h54a6 6 0 0 1 6 6v58H36a6 6 0 0 1-6-6z" fill="#1d5a4a"/>
              <path d="M30 78a6 6 0 0 1 6-6h54" stroke="#f4ecdc" stroke-width="3" fill="none"/>
              <path d="M46 38h30M46 46h22" stroke="#f4ecdc" stroke-width="3" stroke-linecap="round"/>
            </svg>
            <strong>Woodpeckers of North America</strong>
            <span class="muted">Field guide to all 23 species.</span>
            <span class="gift-price">$24.95 <span class="muted">2 in stock</span></span>
          </article>
        </div>
        <div class="row-actions" data-reveal>
          ${btn('Hold just the feeder', { form: 'one' })}
          ${btn('Hold all three, gift-wrapped', { auto: true })}
        </div>`,
      forms: {
        default: {
          title: 'Hold three gifts at Austin',
          fields: [ask('Pick up by', 'Saturday'), acct('Name', P.casey.name)],
          consent: 'Wrapped for free. Pay at pickup.',
          submit: 'Hold gifts',
          done: 'Held',
          confirm: 'Held and gift-wrapped at the Austin store. Pick them up by Saturday.',
          captured: [['Hold', '3 gifts, $89.93, wrapped'], ['Occasion', 'Gift for a woodpecker fan']],
        },
        one: {
          title: 'Hold the suet feeder at Austin',
          fields: [ask('Pick up by', 'Saturday'), acct('Name', P.casey.name)],
          consent: 'Wrapped for free. Pay at pickup.',
          submit: 'Hold feeder',
          done: 'Held',
          confirm: 'Held and gift-wrapped at the Austin store. Pick it up by Saturday.',
          captured: [['Hold', 'Tail-prop suet feeder, $34.99'], ['Occasion', 'Gift for a woodpecker fan']],
        },
      },
      ledger: { visits: 1, signals: 1 },
      note: 'Picks come from what the local store actually has, with its own gift-wrap service.',
      asks: 'Gift ideas under $50 for a woodpecker fan?',
      knows: 'Local giftable stock and holiday services',
      captures: 'A gift hold, and a second birder in the family',
    },
  ];

  function weatherGlyph(kind) {
    const glyphs = {
      sun: '<circle cx="16" cy="16" r="6" fill="#e4b21f"/><path d="M16 3v4M16 25v4M3 16h4M25 16h4M6.8 6.8l2.8 2.8M22.4 22.4l2.8 2.8M6.8 25.2l2.8-2.8M22.4 9.6l2.8-2.8" stroke="#e4b21f" stroke-width="2" stroke-linecap="round"/>',
      part: '<circle cx="12" cy="12" r="5" fill="#e4b21f"/><path d="M11 26h12a5 5 0 0 0 0-10 7 7 0 0 0-13 2 4 4 0 0 0 1 8z" fill="#aab7bd"/>',
      rain: '<path d="M9 19h14a5 5 0 0 0 0-10 7 7 0 0 0-13 2 4 4 0 0 0-1 8z" fill="#8c9aa1"/><path d="M11 23l-1.5 4M17 23l-1.5 4M23 23l-1.5 4" stroke="#3f6fb8" stroke-width="2" stroke-linecap="round"/>',
      frost: '<path d="M16 4v24M5.6 10l20.8 12M5.6 22l20.8-12M13 6l3 3 3-3M13 26l3-3 3 3" stroke="#3f6fb8" stroke-width="2" stroke-linecap="round" fill="none"/>',
    };
    return `<svg class="wx" viewBox="0 0 32 32" width="32" height="32" aria-label="${kind === 'part' ? 'partly cloudy' : kind}" role="img">${glyphs[kind]}</svg>`;
  }
})();
