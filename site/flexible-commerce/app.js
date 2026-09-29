/* Flexible Drupal Commerce demo.
   Five short stories that play out what the write-up describes, plus the
   fitted index and the credits filter. Nothing here talks to Drupal: the
   products, prices, stores, people and exchange rates are invented. Each
   model ends with a note on how Drupal does the same thing. */
(() => {
  'use strict';

  const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const now = () => performance.now();
  const pause = (ms) => new Promise((resolve) => window.setTimeout(resolve, calm() ? 0 : ms));

  const formatters = {};
  function money(cents, currency = 'USD') {
    formatters[currency] ??= new Intl.NumberFormat('en-US', { style: 'currency', currency });
    return formatters[currency].format(cents / 100);
  }

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const plural = (n, one, many = `${one}s`) => `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;
  const secs = (ms) => `${(ms / 1000).toFixed(1)} s`;
  const flag = (on, attr) => (on ? ` ${attr}` : '');

  // Line icons drawn like the plates' key lines. Parts marked "m" take a
  // material tint; "h" is a hole.
  const ICONS = {
    bolt: '<path class="m" d="M7 3h10v5H7z"/><path class="m" d="M10 8h4v13h-4z"/><path d="M10 12l4-1.5M10 15.5l4-1.5M10 19l4-1.5"/>',
    nut: '<path class="m" d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9z"/><circle class="h" cx="12" cy="12" r="3.5"/>',
    washer: '<circle class="m" cx="12" cy="12" r="8.5"/><circle class="h" cx="12" cy="12" r="3.5"/>',
    cart: '<path d="M3 4h2.5l2.2 10.5h10.3L20 7H6.4"/><circle cx="9" cy="19" r="1.6"/><circle cx="17" cy="19" r="1.6"/>',
    lock: '<rect class="m" x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    open: '<rect class="m" x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 7.8-1.2"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    cross: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    box: '<path class="m" d="M4 8l8-4 8 4v8.5l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v8.5"/>',
    download: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14"/>',
    card: '<rect class="m" x="3" y="6" width="18" height="12.5" rx="2"/><path d="M3 10h18M7 15h4"/>',
    bell: '<path class="m" d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    user: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.8-3.8 3.6-5.5 7-5.5s6.2 1.7 7 5.5"/>',
    clock: '<circle class="m" cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  };
  const icon = (name, cls = '') => `<svg class="icon${cls ? ` ${cls}` : ''}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;
  const drupalNote = (html) => `<details class="under"><summary>How Drupal does this</summary>${html}</details>`;

  const title = (head, scenario, reset = true) => `
    <div class="bench-top">
      <div><p class="bench-title">${head}</p><p class="scenario">${scenario}</p></div>
      ${reset ? '<button type="button" class="btn quiet" data-act="reset" data-key="reset">Start over</button>' : ''}
    </div>`;

  // Buttons that act like a one-of-several choice.
  const chips = (label, act, current, options) => `
    <div class="chips" role="group" aria-label="${esc(label)}"><span class="chips-label" aria-hidden="true">${label}</span>
      ${options
        .map(
          ([value, text]) =>
            `<button type="button" class="chip" data-act="${act}" data-v="${value}" data-key="${act}-${value}" aria-pressed="${String(value) === String(current)}">${text}</button>`,
        )
        .join('')}
    </div>`;

  // Radio cards: a bold label and a line of explanation each.
  const choices = (legend, name, current, options) => `
    <fieldset class="choices"><legend class="sr-only">${legend}</legend>
      ${options
        .map(
          (o) => `<label class="choice"><input type="radio" name="${name}" value="${o.value}" data-change="${name}" data-key="${name}-${o.value}"${flag(o.value === current, 'checked')}>
            <span><strong>${o.label}</strong><span class="note">${o.note}</span></span></label>`,
        )
        .join('')}
    </fieldset>`;

  // A model owns one element. It renders from state, keeps focus and scroll
  // positions across renders, and announces changes through a live region
  // that is never re-rendered. Numbers that change while a slider moves are
  // marked data-bind and updated in place, so the slider isn't rebuilt.
  function mount(root, { state, render, binds, actions = {}, footer = '' }) {
    root.textContent = '';
    const body = document.createElement('div');
    body.className = 'bench-body';
    body.tabIndex = -1;
    const live = document.createElement('p');
    live.className = 'sr-only';
    live.setAttribute('role', 'status');
    root.append(body);
    if (footer) root.insertAdjacentHTML('beforeend', footer);
    root.append(live);

    const model = {
      root,
      body,
      state,
      set(patch) {
        Object.assign(model.state, typeof patch === 'function' ? patch(model.state) : patch);
        model.paint();
      },
      nudge(patch) {
        Object.assign(model.state, patch);
        if (!binds) return;
        const values = binds(model.state);
        body.querySelectorAll('[data-bind]').forEach((node) => {
          const v = values[node.dataset.bind];
          if (v !== undefined) node.innerHTML = v;
        });
      },
      say(text) {
        live.textContent = '';
        window.setTimeout(() => (live.textContent = text), 30);
      },
      paint() {
        const active = document.activeElement;
        const key = active && body.contains(active) ? active.dataset.key : null;
        const scrolls = {};
        body.querySelectorAll('[data-scroll]').forEach((el) => (scrolls[el.dataset.scroll] = el.scrollTop));
        body.innerHTML = render(model.state, binds ? binds(model.state) : {});
        body.querySelectorAll('[data-scroll]').forEach((el) => {
          if (el.dataset.scroll in scrolls) el.scrollTop = scrolls[el.dataset.scroll];
        });
        if (key) {
          const next = body.querySelector(`[data-key="${CSS.escape(key)}"]`);
          if (next && !next.disabled) next.focus({ preventScroll: true });
          else body.focus({ preventScroll: true });
        }
      },
    };

    const handle = (attr) => (event) => {
      const el = event.target.closest(`[${attr}]`);
      if (el && body.contains(el)) actions[el.getAttribute(attr)]?.(el, model, event);
    };
    body.addEventListener('click', handle('data-act'));
    body.addEventListener('change', handle('data-change'));
    body.addEventListener('input', handle('data-input'));
    model.paint();
    return model;
  }

  /* ------------------------------------------------------------------------
     Taxonomy: find one bolt in a long list, sort the catalog with one small
     rule per category, then find it again by category. */

  function taxonomy(root) {
    const families = [
      {
        term: 'Bolts',
        type: 'Bolt',
        icon: 'bolt',
        price: 1400,
        items: {
          metric: ['Hex bolt|M6 × 20 mm', 'Hex bolt|M8 × 30 mm', 'Carriage bolt|M10 × 50 mm'],
          inch: ['Hex bolt|1/4″-20 × 1″', 'Hex bolt|3/8″-16 × 2″', 'Carriage bolt|5/16″-18 × 1-1/2″'],
        },
      },
      {
        term: 'Nuts',
        type: 'Nut',
        icon: 'nut',
        price: 600,
        items: {
          metric: ['Hex nut|M6', 'Nylon-insert lock nut|M8', 'Flange nut|M10'],
          inch: ['Hex nut|1/4″-20', 'Nylon-insert lock nut|3/8″-16', 'Wing nut|5/16″-18'],
        },
      },
      {
        term: 'Washers',
        type: 'Washer',
        icon: 'washer',
        price: 400,
        items: {
          metric: ['Flat washer|M6', 'Split lock washer|M8', 'Fender washer|M10'],
          inch: ['Flat washer|1/4″', 'Split lock washer|3/8″', 'Fender washer|5/16″'],
        },
      },
    ];
    const materials = [
      { key: 'stainless', term: 'Stainless Steel', short: 'Stainless', finish: '18-8 stainless', factor: 1.6 },
      { key: 'zinc', term: 'Zinc-Plated Steel', short: 'Zinc-plated', finish: 'zinc-plated', factor: 1 },
    ];
    const threads = [
      { key: 'metric', term: 'Metric' },
      { key: 'inch', term: 'Inch' },
    ];

    const terms = new Map();
    const roots = [];
    const leaves = [];
    const products = [];
    let nextTid = 1;
    const addTerm = (name, parent, extra = {}) => {
      const term = { tid: nextTid++, name, parent, children: [], ...extra };
      terms.set(term.tid, term);
      (parent ? terms.get(parent).children : roots).push(term.tid);
      return term.tid;
    };

    for (const f of families) {
      const t1 = addTerm(f.term, null, { icon: f.icon });
      for (const m of materials) {
        const t2 = addTerm(`${m.term} ${f.term}`, t1, { icon: f.icon, material: m.key });
        for (const th of threads) {
          const t3 = addTerm(`${th.term} ${m.term} ${f.term}`, t2, { icon: f.icon, material: m.key });
          leaves.push({ tid: t3, family: f, material: m, thread: th });
          f.items[th.key].forEach((item, i) => {
            const [kind, size] = item.split('|');
            products.push({
              id: products.length + 1,
              kind,
              size,
              title: `${kind}, ${m.finish}, ${size}`,
              icon: f.icon,
              type: f.type,
              material: m.key,
              thread: th.key,
              leaf: t3,
              price: Math.round((f.price * m.factor * (1 + 0.4 * i)) / 5) * 5,
            });
          });
        }
      }
    }

    const target = products.find((p) => p.kind === 'Hex bolt' && p.material === 'stainless' && p.size === 'M8 × 30 mm');
    const name = (tid) => terms.get(tid).name;
    const isUnder = (tid, ancestor) => {
      for (let t = tid; t; t = terms.get(t).parent) if (t === ancestor) return true;
      return false;
    };
    const leafIndex = new Map(leaves.map((l, i) => [l.tid, i]));
    const isTagged = (s, p) => leafIndex.get(p.leaf) < s.sorted;
    const countUnder = (s, tid) => products.filter((p) => isTagged(s, p) && isUnder(p.leaf, tid)).length;
    const shuffle = (list) => {
      const a = [...list];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
    // Why a wrong pick isn't the one the customer asked for.
    const reason = (p) => {
      const why = [];
      if (p.type !== 'Bolt') why.push(`it's a ${p.type.toLowerCase()}`);
      else if (p.kind !== 'Hex bolt') why.push(`it's a ${p.kind.toLowerCase()}`);
      if (p.material !== 'stainless') why.push("it's zinc-plated");
      if (p.thread !== 'metric') why.push("it's an inch size");
      else if (!p.size.startsWith('M8')) why.push(`it's ${p.size.split(' ')[0]}`);
      return `Not that one: ${why.slice(0, 2).join(' and ')}.`;
    };

    const ALL = leaves.length;
    let stopwatch = 0;
    let sorter = 0;
    const fresh = () => ({ order: shuffle(products), list: null, sorted: 0, sorting: false, browse: null, at: null, miss: '', missId: 0 });
    const stage = (s) => {
      if (!s.list || (s.list.time == null && !s.list.skipped)) return 1;
      if (s.sorting || s.sorted < ALL) return 2;
      if (!s.browse || s.browse.time == null) return 3;
      return 4;
    };
    const running = (s) => (s.browse && s.browse.time == null ? s.browse : s.list && s.list.time == null && !s.list.skipped ? s.list : null);

    function startStopwatch(m) {
      window.clearInterval(stopwatch);
      stopwatch = window.setInterval(() => {
        const run = running(m.state);
        if (!run) return window.clearInterval(stopwatch);
        const el = m.body.querySelector('[data-timer]');
        if (el) el.textContent = secs(now() - run.start);
      }, 100);
    }

    const wanted = (compact) => `
      <div class="wanted${compact ? ' compact' : ''}">${icon('bolt', 'stainless big')}
        <p><span class="hint">The customer wants</span><strong>${target.title}</strong></p>
      </div>`;

    const pickTile = (s, p) => `
      <li><button type="button" class="pick${s.missId === p.id ? ' wrong' : ''}" data-act="pick" data-id="${p.id}" data-key="pick-${p.id}">
        ${icon(p.icon, p.material)}<span><b>${p.kind}</b><span class="sub">${p.material === 'stainless' ? '18-8 stainless' : 'Zinc-plated'}, ${p.size}</span></span>
      </button></li>`;

    function storeScene(s, st) {
      const run = running(s);
      const clock = run ? `<span class="timer" role="timer" data-timer>${secs(now() - run.start)}</span>` : '';
      const miss = s.miss ? `<p class="miss" role="alert">${s.miss}</p>` : '';

      if (st === 1 && !s.list) {
        return `
          ${wanted()}
          <p>Every product sits in one long, unsorted list. How fast can you spot the bolt?</p>
          <div class="row">
            <button type="button" class="btn primary" data-act="listStart" data-key="listStart">Start the clock</button>
            <button type="button" class="btn quiet" data-act="skip" data-key="skip">Skip to sorting</button>
          </div>`;
      }
      if (st === 1) {
        return `
          <div class="row">${wanted(true)}<span class="spacer"></span>${clock}</div>
          ${miss}
          <ul class="picks">${s.order.map((p) => pickTile(s, p)).join('')}</ul>`;
      }
      if (st === 3 && !s.browse) {
        return `
          ${s.list.time != null ? `<p class="success">${icon('check')} Found in ${secs(s.list.time)} in one long list of ${products.length}.</p>` : ''}
          ${wanted()}
          <p>Same customer, same bolt. This time the shop has categories.</p>
          <div class="row"><button type="button" class="btn primary" data-act="browseStart" data-key="browseStart">Start the clock</button></div>`;
      }
      if (st === 3) {
        const trail = [];
        for (let t = s.at; t; t = terms.get(t).parent) trail.unshift(t);
        const crumbs = [
          s.at ? '<li><button type="button" class="link" data-act="go" data-tid="" data-key="crumb-0">All products</button></li>' : '<li><span aria-current="page">All products</span></li>',
          ...trail.map((t, i) =>
            i === trail.length - 1
              ? `<li><span aria-current="page">${esc(name(t))}</span></li>`
              : `<li><button type="button" class="link" data-act="go" data-tid="${t}" data-key="crumb-${t}">${esc(name(t))}</button></li>`,
          ),
        ].join('');
        const kids = s.at ? terms.get(s.at).children : roots;
        const tiles = kids.length
          ? kids
              .map((t) => {
                const term = terms.get(t);
                return `<li><button type="button" class="pick" data-act="go" data-tid="${t}" data-key="tile-${t}">
                  ${icon(term.icon, term.material || '')}<span><b>${esc(term.name)}</b><span class="sub">${plural(countUnder(s, t), 'product')}</span></span></button></li>`;
              })
              .join('')
          : products
              .filter((p) => p.leaf === s.at)
              .map((p) => pickTile(s, p))
              .join('');
        return `
          <div class="row">${wanted(true)}<span class="spacer"></span>${clock}</div>
          <ol class="crumbs" aria-label="Breadcrumb">${crumbs}</ol>
          ${miss}
          <ul class="picks">${tiles}</ul>`;
      }
      // Stage 4: the comparison.
      const listT = s.list.time;
      const catT = s.browse.time;
      const most = Math.max(listT ?? 0, catT);
      const bar = (label, t, extra = '') =>
        `<div class="bar-row"><span>${label}</span><span class="bar" style="--w:${((t / most) * 100).toFixed(1)}%"></span><b>${secs(t)}</b>${extra}</div>`;
      return `
        <p class="success">${icon('check')} Found by category in ${secs(catT)}, with ${plural(s.browse.clicks, 'click')}.</p>
        <div class="compare">
          ${listT != null ? bar('One long list', listT) : ''}
          ${bar('By category', catT)}
        </div>
        <p>The real shop had close to 40,000 products, over 1,000 times this list. By category, the bolt is still four clicks away:
          type, category, sub-category, product.</p>
        <div class="row"><button type="button" class="btn" data-act="reset" data-key="again">Try it again</button></div>`;
    }

    function counterScene(s) {
      const tagged = products.filter((p) => isTagged(s, p)).length;
      const rule = (l, i) => {
        const state = i < s.sorted ? 'done' : i === s.sorted && s.sorting ? 'now' : '';
        return `<li class="rule-chip ${state}"><span>${l.thread.term}, ${l.material.short.toLowerCase()}</span><span>${i < s.sorted ? '✓ 3' : ''}</span></li>`;
      };
      return `
        <p>One small rule per category. Each one finds the products that match it and files them there.</p>
        <div class="rulebook">
          ${families
            .map(
              (f) => `<div><h4>${icon(f.icon)} ${f.term}</h4><ul>${leaves
                .map((l, i) => [l, i])
                .filter(([l]) => l.family === f)
                .map(([l, i]) => rule(l, i))
                .join('')}</ul></div>`,
            )
            .join('')}
        </div>
        <div class="meter" aria-hidden="true"><span style="--w:${((tagged / products.length) * 100).toFixed(1)}%"></span></div>
        <div class="row">
          <button type="button" class="btn primary" data-act="sort" data-key="sort"${flag(s.sorting, 'disabled')}>Run all ${ALL} rules</button>
          <span class="hint">${tagged} of ${products.length} products sorted</span>
        </div>`;
    }

    mount(root, {
      state: fresh(),
      render(s) {
        const st = stage(s);
        const results = [
          s.list?.time != null ? secs(s.list.time) : s.list?.skipped ? 'Skipped' : '',
          s.sorted === ALL && !s.sorting ? `${products.length} sorted` : '',
          s.browse?.time != null ? secs(s.browse.time) : '',
        ];
        const stages = ['Find it in one long list', 'Sort the catalog', 'Find it by category']
          .map((label, i) => `<li class="${i + 1 < st ? 'done' : i + 1 === st ? 'now' : ''}"><span class="label">${label}</span><span class="result">${results[i]}</span></li>`)
          .join('');
        return `
          ${title('Find the bolt', 'A contractor needs one particular bolt. Time how long it takes to find it, before and after the catalog has categories.')}
          <ol class="stages">${stages}</ol>
          ${
            st === 2
              ? `<div class="pane admin"><p class="pane-label">Behind the counter: sorting rules</p>${counterScene(s)}</div>`
              : `<div class="pane store"><p class="pane-label">In the store${st >= 3 ? ': the same shop, with categories' : ': one long list'}</p>${storeScene(s, st)}</div>`
          }`;
      },
      actions: {
        listStart: (el, m) => {
          m.set({ list: { start: now(), time: null }, miss: '', missId: 0 });
          startStopwatch(m);
        },
        skip: (el, m) => m.set({ list: { skipped: true } }),
        browseStart: (el, m) => {
          m.set({ browse: { start: now(), time: null, clicks: 0 }, at: null, miss: '', missId: 0 });
          startStopwatch(m);
        },
        go: (el, m) => {
          const s = m.state;
          if (s.browse) s.browse.clicks += 1;
          m.set({ at: el.dataset.tid ? Number(el.dataset.tid) : null, miss: '', missId: 0 });
        },
        pick: (el, m) => {
          const s = m.state;
          const p = products.find((x) => x.id === Number(el.dataset.id));
          const run = running(s);
          if (!run) return;
          if (run === s.browse) run.clicks += 1;
          if (p !== target) {
            m.set({ miss: reason(p), missId: p.id });
            return;
          }
          run.time = now() - run.start;
          window.clearInterval(stopwatch);
          m.set({ miss: '', missId: 0 });
          m.say(`Found it in ${secs(run.time)}.`);
        },
        sort: (el, m) => {
          window.clearInterval(sorter);
          if (calm()) {
            m.set({ sorted: ALL, sorting: false });
            m.say(`All ${products.length} products sorted.`);
            return;
          }
          m.set({ sorting: true, sorted: 0 });
          sorter = window.setInterval(() => {
            if (m.state.sorted + 1 >= ALL) {
              window.clearInterval(sorter);
              m.set({ sorted: ALL });
              window.setTimeout(() => {
                if (m.state.sorted !== ALL) return;
                m.set({ sorting: false });
                m.say(`All ${products.length} products sorted.`);
              }, 700);
            } else m.set({ sorted: m.state.sorted + 1 });
          }, 170);
        },
        reset: (el, m) => {
          window.clearInterval(stopwatch);
          window.clearInterval(sorter);
          m.set(fresh());
        },
      },
      footer: drupalNote(`
        <p>The categories are one hierarchical taxonomy vocabulary on the products. Each sorting rule is a small Rules component that adds
        one term, run in bulk from a Views Bulk Operations view that selects the matching products.</p>
        <p>The category pages are a single View with the term in its path. While the term has child terms, it lists them; at the bottom of
        the tree, it lists the products.</p>`),
    });
  }

  /* ------------------------------------------------------------------------
     Pricing: three tabs. A bulk discount two stores record differently; a
     coupon taken off before or after tax; a price change while a cart
     holds its prices. */

  function pricing(root) {
    const tabs = [
      { id: 'bulk', label: 'Bulk discount', mount: bulkModel },
      { id: 'coupon', label: 'Coupon and tax', mount: couponModel },
      { id: 'change', label: 'Price change', mount: changeModel },
    ];
    root.innerHTML = `
      <div class="tabs" role="tablist" aria-label="Pricing stories">
        ${tabs
          .map(
            (t, i) =>
              `<button type="button" class="tab" role="tab" id="pt-${t.id}" aria-controls="pp-${t.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">${t.label}</button>`,
          )
          .join('')}
      </div>
      ${tabs.map((t, i) => `<div class="tabpanel" role="tabpanel" id="pp-${t.id}" aria-labelledby="pt-${t.id}"${flag(i > 0, 'hidden')}></div>`).join('')}
      ${drupalNote(`
        <p><strong>Bulk discount.</strong> Store A is how Commerce Quantity Pricing works in Commerce 2.x: the tier discount is an adjustment
        on the order item. Store B is the older approach, which rewrote the price in a presave hook. The module also falls back to the
        product's own price when no tier is set.</p>
        <p><strong>Coupon and tax.</strong> A fixed-amount-off promotion, applied before or after tax. On a QuickBooks Online integration, the
        store re-pulled tax rates from QuickBooks so the two systems agreed.</p>
        <p><strong>Price change.</strong> Commerce 1.x's shopping cart refresh settings. By default a cart's prices are recalculated at most
        every 15 seconds; you can force a refresh on every page load, and choose whether carts refresh for their owner only or for
        administrators too. The same release added Apply pricing rules and Simulate checkout completion for orders staff key in.</p>`)}`;

    const buttons = [...root.querySelectorAll('[role="tab"]')];
    const select = (i, focus) => {
      buttons.forEach((b, j) => {
        b.setAttribute('aria-selected', String(i === j));
        b.tabIndex = i === j ? 0 : -1;
        root.querySelector(`#${b.getAttribute('aria-controls')}`).hidden = i !== j;
      });
      if (focus) buttons[i].focus();
    };
    buttons.forEach((b, i) => {
      b.addEventListener('click', () => select(i));
      b.addEventListener('keydown', (e) => {
        const n = buttons.length;
        const to = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
        if (to !== undefined) {
          e.preventDefault();
          select(to, true);
        }
      });
    });
    tabs.forEach((t) => t.mount(root.querySelector(`#pp-${t.id}`)));
  }

  function bulkModel(root) {
    const BASE = 2400;
    const TIERS = [
      { min: 1, price: 2400, label: '1 to 9 boxes' },
      { min: 10, price: 2150, label: '10 to 49 boxes' },
      { min: 50, price: 1900, label: '50 or more' },
    ];
    const tierFor = (q) => [...TIERS].reverse().find((t) => q >= t.min);

    mount(root, {
      state: { qty: 12 },
      binds(s) {
        const t = tierFor(s.qty);
        const next = TIERS.find((x) => x.min > s.qty);
        const full = BASE * s.qty;
        const off = (BASE - t.price) * s.qty;
        const pay = full - off;
        return {
          qty: String(s.qty),
          ladder: TIERS.map((x) => `<li class="${x === t ? 'on' : ''}"><span>${x.label}</span><b>${money(x.price)} a box</b></li>`).join(''),
          nudge: next
            ? `Add ${plural(next.min - s.qty, 'more box', 'more boxes')} and every box drops to ${money(next.price)}.`
            : `Dana's getting the best price: ${money(t.price)} a box.`,
          aLine: `${s.qty} × ${money(BASE)}`,
          aFull: money(full),
          aOffLabel: off ? `Bulk discount, ${t.label.toLowerCase()}` : 'No bulk discount yet',
          aOff: money(off ? -off : 0),
          bLine: `${s.qty} × ${money(t.price)}`,
          bFull: money(t.price * s.qty),
          pay: money(pay),
          salesA: money(full),
          salesB: money(pay),
          discA: money(off ? -off : 0),
          discB: money(0),
          aha: off
            ? `Dana pays ${money(pay)} at both stores. Store A's books show the ${money(off)} discount. Store B's books say it sold boxes at ${money(t.price)} and gave nothing away, so tax and sales reports never see the discount.`
            : 'Under 10 boxes there is no discount, so both stores’ books match. Drag past 10.',
        };
      },
      render(s, b) {
        return `
          ${title('Dana buys bolts by the box', 'The more boxes, the lower the price. Two stores charge Dana the same total. Only one of them remembers giving a discount.', false)}
          <div class="pane store">
            <p class="pane-label">In the store: Dana's cart</p>
            <div class="item-row">${icon('box', 'stainless')}<strong>Hex bolts, box of 100</strong><span class="spacer"></span><span class="hint">${money(BASE)} a box</span></div>
            <label class="slider"><span class="sr-only">Boxes</span>
              <input type="range" min="1" max="80" value="${s.qty}" data-input="qty" data-key="qty">
              <output><span data-bind="qty">${b.qty}</span> boxes</output>
            </label>
            <ol class="ladder" data-bind="ladder">${b.ladder}</ol>
            <p class="nudge" data-bind="nudge">${b.nudge}</p>
            <div class="receipts">
              <figure class="receipt">
                <figcaption><strong>Store A</strong>Shows the discount on its own line</figcaption>
                <table class="grid-table">
                  <tbody>
                    <tr><th scope="row">Hex bolts <span class="was" data-bind="aLine">${b.aLine}</span></th><td class="num" data-bind="aFull">${b.aFull}</td></tr>
                    <tr><th scope="row" data-bind="aOffLabel">${b.aOffLabel}</th><td class="num minus" data-bind="aOff">${b.aOff}</td></tr>
                  </tbody>
                  <tfoot><tr><th scope="row">Dana pays</th><td class="num" data-bind="pay">${b.pay}</td></tr></tfoot>
                </table>
              </figure>
              <figure class="receipt">
                <figcaption><strong>Store B</strong>Quietly lowers the price instead</figcaption>
                <table class="grid-table">
                  <tbody>
                    <tr><th scope="row">Hex bolts <span class="was" data-bind="bLine">${b.bLine}</span></th><td class="num" data-bind="bFull">${b.bFull}</td></tr>
                  </tbody>
                  <tfoot><tr><th scope="row">Dana pays</th><td class="num" data-bind="pay">${b.pay}</td></tr></tfoot>
                </table>
              </figure>
            </div>
          </div>
          <div class="pane admin">
            <p class="pane-label">Behind the counter: the month-end sales report</p>
            <table class="grid-table">
              <thead><tr><th><span class="sr-only">Line</span></th><th class="num">Store A</th><th class="num">Store B</th></tr></thead>
              <tbody>
                <tr><th scope="row">Sales</th><td class="num" data-bind="salesA">${b.salesA}</td><td class="num" data-bind="salesB">${b.salesB}</td></tr>
                <tr><th scope="row">Discounts given</th><td class="num minus" data-bind="discA">${b.discA}</td><td class="num" data-bind="discB">${b.discB}</td></tr>
              </tbody>
              <tfoot><tr><th scope="row">Net</th><td class="num" data-bind="pay">${b.pay}</td><td class="num" data-bind="pay">${b.pay}</td></tr></tfoot>
            </table>
            <p data-bind="aha">${b.aha}</p>
          </div>`;
      },
      actions: {
        qty: (el, m) => m.nudge({ qty: Number(el.value) }),
      },
    });
  }

  function couponModel(root) {
    const QTY = 5;
    const UNIT = 2400;
    const pct = (cents, bp) => Math.round((cents * bp) / 10000);

    mount(root, {
      state: { off: 1000, bp: 825, orders: 1000 },
      render(s) {
        const rate = `${s.bp / 100}%`;
        const sub = QTY * UNIT;
        const taxBefore = pct(sub - s.off, s.bp);
        const before = sub - s.off + taxBefore;
        const taxAfter = pct(sub, s.bp);
        const after = sub + taxAfter - s.off;
        const gap = after - before;
        const exact = (s.off * s.bp) % 10000 === 0;
        const receipt = (head, rows, total) => `
          <figure class="receipt">
            <figcaption><strong>${head}</strong></figcaption>
            <table class="grid-table">
              <tbody>${rows.map(([k, v, cls = '']) => `<tr><th scope="row">${k}</th><td class="num ${cls}">${v}</td></tr>`).join('')}</tbody>
              <tfoot><tr><th scope="row">Dana pays</th><td class="num">${money(total)}</td></tr></tfoot>
            </table>
          </figure>`;
        return `
          ${title('Dana has a coupon', 'Take it off before the sales tax, or after? Either sounds reasonable. They don’t give the same total.', false)}
          <div class="pane store">
            <p class="pane-label">In the store: Dana's receipt, both ways</p>
            ${chips('Coupon', 'off', s.off, [500, 1000, 2000].map((v) => [v, `${money(v)} off`]))}
            ${chips('Sales tax', 'bp', s.bp, [600, 825, 1300].map((v) => [v, `${v / 100}%`]))}
            <div class="receipts">
              ${receipt('Coupon before tax', [
                [`${QTY} boxes of hex bolts`, money(sub)],
                ['Coupon', money(-s.off), 'minus'],
                [`Tax, ${rate} of ${money(sub - s.off)}`, money(taxBefore)],
              ], before)}
              ${receipt('Coupon after tax', [
                [`${QTY} boxes of hex bolts`, money(sub)],
                [`Tax, ${rate} of ${money(sub)}`, money(taxAfter)],
                ['Coupon', money(-s.off), 'minus'],
              ], after)}
            </div>
            <p class="nudge">${money(gap)} apart on one order: ${exact ? '' : 'roughly '}the coupon times the tax rate.</p>
          </div>
          <div class="pane admin">
            <p class="pane-label">Behind the counter: a month of orders</p>
            ${chips('Orders a month', 'orders', s.orders, [100, 1000, 10000].map((v) => [v, v.toLocaleString('en-US')]))}
            <p class="big-figure">${money(gap * s.orders)}<small>a month</small></p>
            <p>If the store takes coupons off before tax and the accounting system does it after, their books drift this far apart every
            month. Someone has to pick one and make both systems agree.</p>
          </div>`;
      },
      actions: {
        off: (el, m) => m.set({ off: Number(el.dataset.v) }),
        bp: (el, m) => m.set({ bp: Number(el.dataset.v) }),
        orders: (el, m) => m.set({ orders: Number(el.dataset.v) }),
      },
    });
  }

  function changeModel(root) {
    const HOLD = 15000;
    const LOW = 2400;
    const HIGH = 2600;

    const model = mount(root, {
      state: { catalog: LOW, shown: LOW, every: false, last: now(), msg: '', changed: false },
      render(s) {
        return `
          ${title('You change a price mid-shop', 'Sam has hex bolts in the cart. You raise the price behind the counter. When does Sam see it?', false)}
          <div class="pane admin">
            <p class="pane-label">Behind the counter</p>
            <div class="item-row">${icon('box', 'stainless')}<span><strong>Hex bolts, box of 100</strong><span class="hint"> now ${money(s.catalog)}</span></span>
              <span class="spacer"></span>
              <button type="button" class="btn" data-act="price" data-key="price">${s.catalog === LOW ? `Raise to ${money(HIGH)}` : `Lower to ${money(LOW)}`}</button>
            </div>
            ${choices('How often carts check their prices', 'every', s.every ? 'every' : 'hold', [
              { value: 'hold', label: 'Hold cart prices for 15 seconds', note: 'The default. Quick, and prices don’t jump around while Sam checks out.' },
              { value: 'every', label: 'Check prices on every page load', note: 'Always current, but every page does more work.' },
            ])}
          </div>
          <div class="pane store">
            <p class="pane-label">In the store: Sam's cart</p>
            <div class="item-row">${icon('cart')}<span>5 boxes of hex bolts at</span><strong class="price-now">${money(s.shown)}</strong><span>a box</span></div>
            <div class="ring-row">
              <svg class="ring" viewBox="0 0 36 36" aria-hidden="true"${flag(s.every, 'hidden')}>
                <circle class="track" cx="18" cy="18" r="15" pathLength="100" />
                <circle class="arc" cx="18" cy="18" r="15" pathLength="100" stroke-dasharray="100" stroke-dashoffset="100" data-ring />
              </svg>
              <span data-left>${s.every ? 'Every reload checks the price.' : ''}</span>
            </div>
            <div class="row"><button type="button" class="btn primary" data-act="reload" data-key="reload">Sam reloads the page</button></div>
            ${s.msg ? `<p class="status${s.changed ? ' good' : ''}">${s.msg}</p>` : ''}
          </div>`;
      },
      actions: {
        price: (el, m) => {
          const catalog = m.state.catalog === LOW ? HIGH : LOW;
          const msg =
            catalog === m.state.shown
              ? `You set the price back to ${money(catalog)}.`
              : `You changed the price to ${money(catalog)}. Sam's cart still says ${money(m.state.shown)} until it checks again.`;
          m.set({ catalog, msg, changed: false });
        },
        every: (el, m) => m.set({ every: el.value === 'every', msg: '' }),
        reload: (el, m) => {
          const s = m.state;
          const t = now();
          const since = t - s.last;
          let msg;
          let changed = false;
          if (s.every || since >= HOLD) {
            changed = s.shown !== s.catalog;
            msg = changed ? `Sam now sees ${money(s.catalog)}. The cart checked the price and caught your change.` : `Still ${money(s.catalog)}. The cart checked, and nothing had changed.`;
            m.set({ shown: s.catalog, last: t, msg, changed });
          } else {
            msg = `Still ${money(s.shown)}. The cart checked ${since < 1000 ? 'just now' : `${Math.round(since / 1000)} s ago`}, so it holds its prices for ${Math.ceil((HOLD - since) / 1000)} s more.`;
            m.set({ msg, changed });
          }
          m.say(msg);
        },
      },
    });

    window.setInterval(() => {
      if (document.hidden || root.closest('[hidden]') || model.state.every) return;
      const left = Math.max(0, HOLD - (now() - model.state.last));
      const ring = root.querySelector('[data-ring]');
      const text = root.querySelector('[data-left]');
      if (ring) ring.setAttribute('stroke-dashoffset', String(100 - (left / HOLD) * 100));
      if (text) text.textContent = left ? `Prices held for ${Math.ceil(left / 1000)} more s` : 'The next reload checks the price';
    }, 200);
  }

  /* ------------------------------------------------------------------------
     Currency: show dollar prices in euros with a fixed rate, then see which
     currency a mixed cart's total lands in. */

  function currency(root) {
    const lines = [
      { title: 'Hex bolts, box of 100', icon: 'bolt', mat: 'stainless', amount: 2400, currency: 'USD' },
      { title: 'Lock nuts, box of 100', icon: 'nut', mat: 'zinc', amount: 1150, currency: 'USD' },
      { title: 'Deck screws, box of 100', icon: 'bolt', mat: 'zinc', amount: 1890, currency: 'CAD', from: 'Priced by a Canadian supplier' },
      { title: 'Fender washers, box of 50', icon: 'washer', mat: 'stainless', amount: 780, currency: 'USD' },
    ];
    const names = { USD: 'US dollars', EUR: 'euros', CAD: 'Canadian dollars' };
    // Made-up rates for converting line items into the cart's currency.
    const perUSD = { USD: 1, EUR: 0.76, CAD: 1.36 };
    const convert = (cents, from, to) => Math.round((cents / perUSD[from]) * perUSD[to]);
    const priceOf = (s, l) => (s.on && l.currency === 'USD' ? { amount: Math.round(l.amount * s.rate), cur: 'EUR' } : { amount: l.amount, cur: l.currency });

    mount(root, {
      state: { on: false, rate: 0.76, def: 'USD', order: [0, 1, 2, 3] },
      binds(s) {
        const priced = s.order.map((i) => ({ i, ...priceOf(s, lines[i]) }));
        const hasDefault = priced.some((p) => p.cur === s.def);
        const target = hasDefault ? s.def : priced[0].cur;
        const out = { rate: s.rate.toFixed(2), target: names[target] };
        let total = 0;
        for (const p of priced) {
          const c = convert(p.amount, p.cur, target);
          total += c;
          out[`p${p.i}`] = money(p.amount, p.cur);
          out[`c${p.i}`] = money(c, target);
        }
        out.total = money(total, target);
        out.why = hasDefault
          ? `The store's main currency, ${names[s.def]}, is in this cart, so the total is in ${names[s.def]}.`
          : `The store's main currency, ${names[s.def]}, isn't in this cart, so the total uses the first item's currency: ${names[target]}.`;
        out.hint = !hasDefault && priced[0].cur !== 'CAD' ? ' Move the deck screws to the top and watch the total.' : '';
        return out;
      },
      render(s, b) {
        const rows = s.order
          .map(
            (i, n) => `<tr>
              <td>${n ? `<button type="button" class="btn move" data-act="up" data-i="${i}" data-key="up-${i}" aria-label="Move ${esc(lines[i].title)} up">↑</button>` : ''}</td>
              <th scope="row"><span class="line-title">${icon(lines[i].icon, lines[i].mat)}<span>${lines[i].title}
                <span class="was">${lines[i].from ? `${lines[i].from}, ` : 'Catalog price '}${money(lines[i].amount, lines[i].currency)}</span></span></span></th>
              <td class="num money" data-bind="p${i}">${b[`p${i}`]}</td>
              <td class="num" data-bind="c${i}">${b[`c${i}`]}</td>
            </tr>`,
          )
          .join('');
        return `
          ${title('Sell your dollar catalog in euros', 'Your prices are in US dollars. Switch on euros and drag the exchange rate. Then see which currency the cart total lands in.', false)}
          <div class="pane admin">
            <p class="pane-label">Behind the counter</p>
            <label class="switch"><input type="checkbox" role="switch" data-change="on" data-key="on"${flag(s.on, 'checked')}> Show US-dollar prices in euros</label>
            <label class="slider${s.on ? '' : ' off'}"><span>1 US dollar =</span>
              <input type="range" min="0.5" max="1.2" step="0.01" value="${s.rate}" data-input="rate" data-key="rate"${flag(!s.on, 'disabled')} aria-label="Euros per US dollar">
              <output>€<span data-bind="rate">${b.rate}</span></output>
            </label>
            <p class="hint">The catalog keeps every price in the currency it was entered in. Only the cart and product pages show euros.</p>
            ${chips("Store's main currency", 'def', s.def, ['USD', 'EUR', 'CAD'].map((c) => [c, c]))}
          </div>
          <div class="pane store">
            <p class="pane-label">In the store: the cart</p>
            <div class="table-wrap">
              <table class="grid-table">
                <thead><tr><th><span class="sr-only">Move</span></th><th>Item</th><th class="num">Price</th><th class="num">In <span data-bind="target">${b.target}</span></th></tr></thead>
                <tbody>${rows}</tbody>
                <tfoot><tr><td></td><th scope="row">Total</th><td></td><td class="num" data-bind="total">${b.total}</td></tr></tfoot>
              </table>
            </div>
            <p><span data-bind="why">${b.why}</span><strong data-bind="hint">${b.hint}</strong></p>
            <p class="hint">Converting between currencies uses made-up rates: 1 US dollar = 0.76 euros = 1.36 Canadian dollars.</p>
          </div>`;
      },
      actions: {
        on: (el, m) => {
          m.set({ on: el.checked });
          m.say(el.checked ? 'Prices now show in euros.' : 'Prices show in their catalog currency.');
        },
        rate: (el, m) => m.nudge({ rate: Number(el.value) }),
        def: (el, m) => m.set({ def: el.dataset.v }),
        up: (el, m) => {
          const order = [...m.state.order];
          const at = order.indexOf(Number(el.dataset.i));
          [order[at - 1], order[at]] = [order[at], order[at - 1]];
          m.set({ order });
          m.say(`Moved ${lines[order[at - 1]].title} up.`);
        },
      },
      footer: drupalNote(`
        <p>This is the Commerce 1.x recipe from the user guide: a product pricing rule on “Calculating the sell price of a product,” with a
        condition that the unit price is in USD and two actions, “Multiply the unit price by some amount” (0.76) and “Convert the unit price
        to a different currency” (EUR). The product's stored price never changes.</p>
        <p>For a cart with mixed currencies, core converts line items to the site's default currency, or to the first line item's currency
        when the default isn't on the order. For live exchange rates, the guide points to Commerce Multicurrency.</p>`),
    });
  }

  /* ------------------------------------------------------------------------
     Multiple carts: Sam fills a cart, signs out, shops as a guest and signs
     back in. Commerce hands the guest's cart to Sam's account. What happens
     next depends on the store's choice. */

  function carts(root) {
    const stores = { north: 'Northside Hardware', harbor: 'Harbor Marine Supply' };
    const products = [
      { id: 1, name: 'Hex bolts, box of 100', short: 'hex bolts', icon: 'bolt', mat: 'stainless', store: 'north', type: 'shipped', price: 2400 },
      { id: 2, name: 'Lock nuts, box of 100', short: 'lock nuts', icon: 'nut', mat: 'zinc', store: 'north', type: 'shipped', price: 1150 },
      { id: 3, name: 'Marine deck screws, box of 100', short: 'deck screws', icon: 'bolt', mat: 'stainless', store: 'harbor', type: 'shipped', price: 1890 },
      { id: 4, name: 'Torque chart, PDF download', short: 'a torque chart', icon: 'download', mat: '', store: 'north', type: 'digital', price: 400 },
    ];
    const modes = [
      { value: 'core', label: 'Keep every cart', note: 'Commerce’s default. Nothing is thrown away, and a marketplace can keep one cart per seller. Sam may check out more than once.' },
      { value: 'combine', label: 'Merge them into one', note: 'What Commerce Combine Carts does when Sam signs in. Simple for a one-seller shop.' },
      { value: 'advanced', label: 'Show one cart, list the rest', note: 'What Commerce Cart Advanced does. One cart per seller is up front; the others wait below it.' },
    ];
    const steps = ['Sam signs in and adds hex bolts', 'Sam signs out', 'A guest adds lock nuts', 'Sam signs back in'];

    let playing = 0;
    const fresh = (mode = 'core') => ({ user: false, carts: [], next: 101, mode, orders: [], step: 0, msg: '', playing: false });
    const owner = (s) => (s.user ? 'sam' : 'guest');
    const product = (id) => products.find((p) => p.id === id);
    const total = (c) => c.items.reduce((sum, it) => sum + product(it.id).price * it.qty, 0);
    const count = (c) => c.items.reduce((n, it) => n + it.qty, 0);
    const mine = (s) => s.carts.filter((c) => c.owner === owner(s)).sort((a, b) => a.id - b.id);
    const clone = (list) => list.map((c) => ({ ...c, items: c.items.map((it) => ({ ...it })) }));

    function add(s, id) {
      const p = product(id);
      const o = owner(s);
      const carts = clone(s.carts);
      const theirs = carts.filter((c) => c.owner === o);
      // Commerce keeps a cart per customer, seller and kind of order, and uses the newest one.
      let cart = theirs.filter((c) => c.store === p.store && c.type === p.type).sort((a, b) => b.id - a.id)[0];
      let next = s.next;
      let why = '';
      if (!cart) {
        if (theirs.some((c) => c.store !== p.store)) why = ' They went into a new cart, because each seller gets its own.';
        else if (theirs.some((c) => c.type !== p.type)) why = ' It went into a new cart, because downloads check out differently from things that ship.';
        cart = { id: next++, owner: o, store: p.store, type: p.type, items: [] };
        carts.push(cart);
      }
      const line = cart.items.find((it) => it.id === id);
      if (line) line.qty += 1;
      else cart.items.push({ id, qty: 1 });
      return { carts, next, msg: `${o === 'sam' ? 'Sam' : 'The guest'} added ${p.short}.${why}` };
    }

    function signIn(s) {
      let carts = clone(s.carts).map((c) => (c.owner === 'guest' ? { ...c, owner: 'sam' } : c));
      const moved = s.carts.filter((c) => c.owner === 'guest').length;
      let msg = 'Sam signed in.';
      if (moved) msg += ` The guest's ${moved === 1 ? 'cart moved' : 'carts moved'} onto Sam's account.`;
      if (s.mode === 'combine') {
        // Combine Carts merges carts of the same kind of order, whatever the seller.
        const gone = [];
        for (const type of ['shipped', 'digital']) {
          const same = carts.filter((c) => c.owner === 'sam' && c.type === type).sort((a, b) => b.id - a.id);
          if (same.length < 2) continue;
          const main = same[same.length - 1];
          for (const other of same.slice(0, -1)) {
            for (const it of other.items) {
              const line = main.items.find((x) => x.id === it.id);
              if (line) line.qty += it.qty;
              else main.items.push({ ...it });
            }
            gone.push(other.id);
          }
        }
        if (gone.length) msg += ' Then the carts were merged into one.';
        carts = carts.filter((c) => !gone.includes(c.id));
      }
      const n = carts.filter((c) => c.owner === 'sam').length;
      msg += ` Sam has ${plural(n, 'cart')}.`;
      return { user: true, carts, msg };
    }

    const signOut = (s) => ({ user: false, carts: s.carts.filter((c) => c.owner === 'sam'), msg: 'Sam signed out. Sam’s cart stays with the account.' });

    // Each step first puts Sam in the right state, in case the visitor
    // signed in or out by hand between steps.
    const stepPatch = [
      (s) => {
        const signed = s.user ? s : { ...s, ...signIn(s) };
        const added = add(signed, 1);
        return { ...signed, ...added, msg: 'Sam signed in and added hex bolts.' };
      },
      (s) => (s.user ? signOut(s) : { msg: 'Already signed out.' }),
      (s) => {
        const out = s.user ? { ...s, ...signOut(s) } : s;
        return { ...out, ...add(out, 2) };
      },
      (s) => (s.user ? { msg: 'Already signed in.' } : signIn(s)),
    ];
    const runStep = (m, i) => {
      const patch = stepPatch[i](m.state);
      m.set({ ...patch, step: i + 1 });
      m.say(patch.msg);
    };

    async function play(m) {
      const token = ++playing;
      m.set({ ...fresh(m.state.mode), playing: true });
      for (let i = 0; i < steps.length; i++) {
        await pause(i ? 1100 : 400);
        if (token !== playing) return;
        runStep(m, i);
      }
      m.set({ playing: false });
    }

    function cartCard(c, current) {
      const foreign = [...new Set(c.items.filter((it) => product(it.id).store !== c.store).map((it) => stores[product(it.id).store]))];
      return `<article class="cart">
        <h4>${icon(c.type === 'digital' ? 'download' : 'cart')} ${current ? 'Current cart: ' : ''}${stores[c.store]}</h4>
        <p class="meta">Cart ${c.id}${c.type === 'digital' ? ', downloads' : ''}</p>
        ${foreign.length ? `<p class="warn">This is ${stores[c.store]}'s cart, but it now holds ${foreign.join(' and ')}'s items too.</p>` : ''}
        <ul>${c.items.map((it) => `<li><span>${it.qty} × ${esc(product(it.id).name)}</span><span>${money(product(it.id).price * it.qty)}</span></li>`).join('')}</ul>
        <div class="row"><strong>${money(total(c))}</strong><span class="spacer"></span>
          <button type="button" class="btn primary" data-act="checkout" data-id="${c.id}" data-key="checkout-${c.id}">Check out</button></div>
      </article>`;
    }

    function cartPage(s) {
      const list = mine(s);
      if (!list.length) return '<p class="cart-empty">No carts yet.</p>';
      if (s.mode !== 'advanced') return `<div class="cart-list">${list.map((c) => cartCard(c, false)).join('')}</div>`;
      const current = new Set(Object.keys(stores).map((store) => list.filter((c) => c.store === store).sort((a, b) => b.id - a.id)[0]?.id));
      const others = list.filter((c) => !current.has(c.id));
      return `<div class="cart-list">${list
        .filter((c) => current.has(c.id))
        .map((c) => cartCard(c, true))
        .join('')}</div>
        ${
          others.length
            ? `<p class="hint">Also saved</p><ul class="teasers">${others
                .map((c) => `<li>Cart ${c.id}, ${stores[c.store]}: ${plural(count(c), 'item')}, ${money(total(c))}</li>`)
                .join('')}</ul>`
            : ''
        }`;
    }

    function callouts(s) {
      if (!s.user) return '';
      const list = mine(s);
      const out = [];
      const sameSeller = Object.keys(stores).some((store) => list.filter((c) => c.store === store && c.type === 'shipped').length > 1);
      if (sameSeller && s.mode === 'core') out.push('There’s the second cart. Commerce won’t delete a cart someone filled, so Sam keeps both.');
      if (new Set(list.map((c) => c.store)).size > 1 && s.mode !== 'combine')
        out.push('One cart per seller: each seller ships its own order and gets paid for it. That’s the marketplace case.');
      return out.map((t) => `<p class="callout">${t}</p>`).join('');
    }

    mount(root, {
      state: fresh(),
      render(s) {
        const waiting = s.user ? 0 : s.carts.filter((c) => c.owner === 'sam').length;
        const busy = flag(s.playing, 'disabled');
        return `
          ${title('Sam’s second cart', 'Sam fills a cart, signs out, shops as a guest, then signs back in. Play it, or click through the steps yourself.')}
          <div class="pane store">
            <p class="pane-label">In the store</p>
            <div class="user-row">
              <span class="badge">${icon('user')} ${s.user ? 'Sam, signed in' : 'A guest'}</span>
              <span class="spacer"></span>
              <button type="button" class="btn" data-act="toggle" data-key="toggle"${busy}>${s.user ? 'Sign out' : 'Sign in as Sam'}</button>
              <button type="button" class="btn primary" data-act="play" data-key="play"${busy}>${s.step ? 'Play it again' : 'Play the four steps'}</button>
            </div>
            <ol class="steps">${steps
              .map(
                (label, i) => `<li class="${i < s.step ? 'done' : i === s.step ? 'next' : ''}">
                <button type="button" class="btn" data-act="step" data-n="${i}" data-key="step-${i}"${flag(s.playing || i !== s.step, 'disabled')}>${label}</button></li>`,
              )
              .join('')}</ol>
            <ul class="shelf">${products
              .map(
                (p) => `<li>${icon(p.icon, p.mat)}<span><span class="name">${p.name}</span><span class="seller">${stores[p.store]}</span></span>
                  <strong>${money(p.price)}</strong>
                  <button type="button" class="btn" data-act="add" data-id="${p.id}" data-key="add-${p.id}"${busy} aria-label="Add ${esc(p.name)}">Add</button></li>`,
              )
              .join('')}</ul>
          </div>

          <div class="pane store">
            <p class="pane-label">In the store: ${s.user ? 'Sam’s carts' : 'the guest’s cart'}</p>
            ${s.msg ? `<p class="status good">${esc(s.msg)}</p>` : ''}
            ${callouts(s)}
            ${waiting ? `<p class="hint">Sam has ${plural(waiting, 'cart')} saved on the account.</p>` : ''}
            ${cartPage(s)}
          </div>

          <div class="pane admin">
            <p class="pane-label">Behind the counter: what should happen when Sam signs in?</p>
            ${choices('What should happen when Sam signs in?', 'mode', s.mode, modes)}
          </div>

          ${
            s.orders.length
              ? `<div class="pane admin">
                  <p class="pane-label">Behind the counter: orders, ${plural(s.orders.length, 'checkout')} so far</p>
                  <ul class="log">${s.orders.map((o) => `<li>${o}</li>`).join('')}</ul>
                </div>`
              : ''
          }`;
      },
      actions: {
        mode: (el, m) => {
          m.state.mode = el.value;
          m.say(`${modes.find((x) => x.value === el.value).label}. Playing the four steps.`);
          play(m);
        },
        play: (el, m) => play(m),
        step: (el, m) => runStep(m, Number(el.dataset.n)),
        add: (el, m) => {
          const patch = add(m.state, Number(el.dataset.id));
          m.set(patch);
          m.say(patch.msg);
        },
        toggle: (el, m) => {
          const patch = m.state.user ? signOut(m.state) : signIn(m.state);
          m.set(patch);
          m.say(patch.msg);
        },
        checkout: (el, m) => {
          const s = m.state;
          const c = s.carts.find((x) => x.id === Number(el.dataset.id));
          const left = mine(s).length - 1;
          const order = `${icon(c.type === 'digital' ? 'download' : 'box')} Order ${c.id}: ${stores[c.store]} ${c.type === 'digital' ? 'sends the download' : 'ships it'}, ${money(total(c))}`;
          const msg = `${s.user ? 'Sam' : 'The guest'} checked out cart ${c.id}.${left ? ` ${plural(left, 'cart')} still to check out.` : ''}`;
          m.set({ carts: s.carts.filter((x) => x.id !== c.id), orders: [...s.orders, order], msg });
          m.say(msg);
        },
        reset: (el, m) => {
          playing += 1;
          m.set(fresh(m.state.mode));
        },
      },
      footer: drupalNote(`
        <p>Commerce 2.x keeps one active cart per order type and store. When someone signs in, carts from their guest session are assigned
        to their account, and none are deleted, so a second cart appears.</p>
        <p>Commerce Combine Carts merges a user's carts of the same order type at sign-in, without looking at the store, which is why merged
        carts can mix sellers. Commerce Cart Advanced marks one cart per store as current and lists the others as non-current.</p>`),
    });
  }

  /* ------------------------------------------------------------------------
     Organic Groups: selling a class membership. The original rule runs when
     the order is paid in full; the commenter's fix waits for checkout to
     finish, creates the account first, and checks that nothing is owed. */

  function groups(root) {
    let playing = 0;

    function story(s) {
      const guest = s.who === 'guest';
      const out = [['card', 'info', 'Pat pays $49.00. Nothing is owed.']];
      let member = false;
      if (s.setup === 'original') {
        out.push(['bell', 'event', 'The store announces “paid in full,” and the rule tries to add the buyer to the class group.']);
        if (guest) out.push(['cross', 'fail', 'There’s no one to add. A guest doesn’t have an account until checkout finishes.']);
        else {
          member = true;
          out.push(['check', 'ok', 'Pat is added to the class group.']);
        }
        out.push(['bell', 'event', 'Checkout finishes.']);
        out.push(guest ? ['user', 'info', 'The store creates Pat’s account.'] : ['user', 'skip', 'Pat already has an account.']);
      } else {
        out.push(['bell', 'skip', 'The store announces “paid in full.” Nothing listens for it anymore.']);
        out.push(['bell', 'event', 'Checkout finishes.']);
        out.push(guest ? ['user', 'info', 'First, the store creates Pat’s account.'] : ['user', 'skip', 'Pat already has an account.']);
        member = true;
        out.push(['check', 'ok', 'Then the rule checks that nothing is owed, and adds Pat to the class group.']);
      }
      return { lines: out, member };
    }

    mount(root, {
      state: { who: 'guest', setup: 'original', shown: 0, run: null },
      render(s) {
        const done = s.run && s.shown >= s.run.lines.length;
        return `
          ${title('Pat buys a course', 'Buying Woodworking 101 should let Pat into the members-only class group. Does it?', false)}
          <div class="pane admin">
            <p class="pane-label">Behind the counter: how the store is set up</p>
            ${choices('How the store is set up', 'setup', s.setup, [
              { value: 'original', label: 'The 2013 recipe', note: 'Add the buyer to the class as soon as the order is paid in full.' },
              { value: 'fix', label: 'A commenter’s fix', note: 'Wait for checkout to finish, create the account first, then add the buyer if nothing is owed.' },
            ])}
          </div>
          <div class="pane store">
            <p class="pane-label">In the store: Pat's checkout</p>
            ${chips('Pat checks out', 'who', s.who, [
              ['guest', 'As a guest'],
              ['member', 'Signed in'],
            ])}
            <div class="row">
              <span class="item-row">${icon('lock')}<span><strong>Woodworking 101</strong><span class="hint"> class membership, ${money(4900)}</span></span></span>
              <span class="spacer"></span>
              <button type="button" class="btn primary" data-act="buy" data-key="buy">${s.run ? 'Buy it again' : 'Buy the course'}</button>
            </div>
          </div>
          ${
            s.run
              ? `<div class="pane admin">
                  <p class="pane-label">Behind the counter: what happens</p>
                  <ol class="timeline">${s.run.lines
                    .slice(0, s.shown)
                    .map(([ic, kind, text], i) => `<li class="${kind}${i === s.shown - 1 && !done ? ' enter' : ''}">${icon(ic)}<span>${text}</span></li>`)
                    .join('')}</ol>
                </div>`
              : ''
          }
          ${
            done
              ? `<div class="pane store">
                  <p class="pane-label">In the store: Pat opens the class</p>
                  <div class="classcard ${s.run.member ? 'open' : 'locked'}">
                    <div class="classcard-head">${icon(s.run.member ? 'open' : 'lock')}<div><strong>Woodworking 101</strong><span>Members-only class group</span></div></div>
                    <p>${
                      s.run.member
                        ? 'Welcome, Pat. Lesson 1: measure twice, cut once.'
                        : 'Locked. Pat paid $49.00, signs in with the new account, and can’t get into the class. Expect a support email.'
                    }</p>
                  </div>
                </div>`
              : ''
          }`;
      },
      actions: {
        setup: (el, m) => {
          playing += 1;
          m.set({ setup: el.value, run: null, shown: 0 });
        },
        who: (el, m) => {
          playing += 1;
          m.set({ who: el.dataset.v, run: null, shown: 0 });
        },
        buy: async (el, m) => {
          const token = ++playing;
          const run = story(m.state);
          m.set({ run, shown: 0 });
          for (let i = 1; i <= run.lines.length; i++) {
            await pause(i === 1 ? 200 : 800);
            if (token !== playing) return;
            m.set({ shown: i });
          }
          m.say(run.member ? 'Pat is in the class.' : 'Pat paid but can’t get into the class.');
        },
      },
      footer: drupalNote(`
        <p>No custom module, just site building. The group content type gets a product reference field, and each group points at its
        product. A rule on “After an order is first paid in full” loops over the order's line items. One Rules component finds the product
        display that references each product; a second checks whether that display is an Organic Group and adds the customer as a member.</p>
        <p>The commenter's fix moves the rule to “Completing the checkout process,” adds a condition that the order balance is zero, and
        orders the rules so Commerce's “Create a new account for an anonymous order” runs first.</p>`),
    });
  }

  /* ------------------------------------------------------------------------
     The index: fit every name to the same measure. One font size for all,
     and each name stretched along Archivo's width axis until it fills the
     column. Section headings reuse each name's stretch. */

  function fitIndex() {
    const words = [...document.querySelectorAll('[data-fit]')];
    if (!words.length) return;
    const measure = words[0].parentElement.clientWidth;
    if (!measure) return;

    const widthAt = (el, size, stretch) => {
      el.style.fontSize = `${size}px`;
      el.style.fontStretch = `${stretch}%`;
      return el.getBoundingClientRect().width;
    };
    const MIN = 62;
    const MAX = 125;
    // The largest size at which the longest name still fits fully condensed.
    let high = Infinity;
    for (const el of words) high = Math.min(high, (100 * measure) / widthAt(el, 100, MIN));
    const size = Math.max(40, Math.min(high * 0.99, 150));

    for (const el of words) {
      let a = MIN;
      let b = MAX;
      for (let i = 0; i < 14; i++) {
        const mid = (a + b) / 2;
        if (widthAt(el, size, mid) > measure) b = mid;
        else a = mid;
      }
      const stretch = Math.round(a * 10) / 10;
      // A short name that can't fill the measure fully expanded grows a little instead.
      const full = widthAt(el, size, stretch);
      const grow = full < measure * 0.99 ? Math.min(1.3, (measure * 0.99) / full) : 1;
      el.style.fontSize = `${Math.round(size * grow * 10) / 10}px`;
      el.style.fontStretch = `${stretch}%`;
      document.getElementById(el.dataset.fit)?.style.setProperty('--stretch', `${stretch}%`);
    }
  }

  /* ------------------------------------------------------------------------
     Credits: filter the table by area. */

  function creditFilter() {
    const table = document.querySelector('[data-credits]');
    const bar = document.querySelector('[data-credit-filter]');
    if (!table || !bar) return;
    const rows = [...table.tBodies[0].rows];
    const areas = [...new Set(rows.map((r) => r.dataset.area))];
    const counts = Object.fromEntries(areas.map((a) => [a, rows.filter((r) => r.dataset.area === a).length]));
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Show credits by area');
    bar.innerHTML = [['All', rows.length], ...areas.map((a) => [a, counts[a]])]
      .map(([a, n], i) => `<button type="button" data-area="${a}" aria-pressed="${i === 0}">${a} <span class="n">${n}</span></button>`)
      .join('');
    bar.hidden = false;
    bar.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const area = btn.dataset.area;
      bar.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      rows.forEach((r) => (r.hidden = area !== 'All' && r.dataset.area !== area));
    });
  }

  /* ------------------------------------------------------------------------ */

  const models = { taxonomy, pricing, currency, carts, groups };
  document.querySelectorAll('[data-bench]').forEach((el) => models[el.dataset.bench]?.(el));
  creditFilter();

  const refit = () => window.requestAnimationFrame(fitIndex);
  (document.fonts?.ready ?? Promise.resolve()).then(refit);
  let lastWidth = 0;
  new ResizeObserver(([entry]) => {
    const w = Math.round(entry.contentRect.width);
    if (w !== lastWidth) {
      lastWidth = w;
      refit();
    }
  }).observe(document.querySelector('.index') ?? document.body);
})();
