// Plays each scene as four steps: the customer's question appears in large
// type and zooms down into the chat, the assistant calls the WBU MCP server,
// WBU answers inside its own card, and the customer acts on it (a hold, an
// RSVP, a booking) with details filled in from their WBU account. The first
// scene shows how the customer connects WBU in the first place. On the tour,
// an overlay then recaps what WBU learned and counts down to the next tool.
// After a scene plays, its result stays clickable.
(function () {
  const W = window.WBU;
  const SCENES = W.scenes;
  const $ = (id) => document.getElementById(id);
  const CANCEL = { cancelled: true };
  const PHASES = ['Customer asks', 'AI calls WBU', 'WBU answers', 'Customer acts'];

  const el = {
    stage: $('demo'),
    rail: $('rail'),
    sceneName: $('scene-name'),
    sceneWhere: $('scene-where'),
    sceneBlurb: $('scene-blurb'),
    phases: $('phases'),
    prev: $('prev'),
    next: $('next'),
    replay: $('replay'),
    tour: $('tour'),
    chat: $('chat'),
    connector: $('connector'),
    connectorState: $('connector-state'),
    messages: $('messages'),
    send: $('send'),
    cursor: $('cursor'),
    mcpNode: $('mcp-node'),
    mcpTool: $('mcp-tool'),
    linkA: $('link-a'),
    linkB: $('link-b'),
    sources: $('sources'),
    request: $('request'),
    requestAuth: $('request-auth'),
    requestCode: $('request-code'),
    requestStatus: $('request-status'),
    note: $('note'),
    captured: $('captured'),
    ask: $('ask'),
    askScrim: $('ask-scrim'),
    askWho: $('ask-who'),
    askText: $('ask-text'),
    upNext: $('up-next'),
    upList: $('up-next-list'),
    upDelta: $('up-next-delta'),
    upIcon: $('up-next-icon'),
    upWhen: $('up-next-when'),
    upName: $('up-next-name'),
    upBlurb: $('up-next-blurb'),
    ledger: { accounts: $('led-accounts'), visits: $('led-visits'), signals: $('led-signals') },
  };

  // Milliseconds, except countdown (seconds). The packet and cursor values
  // match --packet and the cursor transition in styles.css.
  const T = {
    start: 350,
    bigChar: 34,
    afterType: 650,
    zoom: 820,
    packet: 620,
    source: 750,
    word: 28,
    reveal: 130,
    beforeCapture: 1300,
    cursor: 720,
    click: 240,
    field: 30,
    beforeNext: 1400,
    countdown: 7,
  };

  // ?still renders each tool's finished state with no animation, as reduced
  // motion does. Handy for screenshots and printouts.
  const still = new URLSearchParams(location.search).has('still');
  const reduceMotion = still || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const state = {
    index: 0,
    run: null,
    tour: !reduceMotion,
    paused: false,
    offscreen: false,
    instant: reduceMotion,
    counted: new Set(),
    totals: { accounts: 0, visits: 0, signals: 0 },
    seen: new Set(),
  };

  // ---------------------------------------------------------------- timing

  // Resolves after `ms` of unpaused, on-screen time. Rejects if the run is
  // replaced. In instant mode (reduced motion) it resolves at once unless
  // `always` is set, which the tour's countdown between scenes uses.
  function wait(ms, run, always = false) {
    if (run.cancelled) return Promise.reject(CANCEL);
    if ((state.instant && !always) || ms <= 0) return Promise.resolve();
    return new Promise((resolve, reject) => {
      let remaining = ms;
      let last = performance.now();
      const tick = () => {
        if (run.cancelled) return reject(CANCEL);
        const now = performance.now();
        if (!state.paused && !state.offscreen && !document.hidden) remaining -= now - last;
        last = now;
        if (remaining <= 0) resolve();
        else setTimeout(tick, Math.min(remaining, 25));
      };
      setTimeout(tick, Math.min(ms, 25));
    });
  }

  // Web Animations the scene starts, tracked so Pause can freeze them too.
  const live = new Set();

  function motion(node, frames, opts) {
    const a = node.animate(frames, opts);
    live.add(a);
    a.finished.then(
      () => live.delete(a),
      () => live.delete(a),
    );
    if (state.paused || state.offscreen) a.pause();
    return a;
  }

  // ---------------------------------------------------------------- setup

  function setup() {
    document.documentElement.classList.toggle('still', still);
    $('mark-bird').innerHTML = W.bird('cardinal', { size: 34, branch: false, label: '' });
    $('connector-bird').innerHTML = W.bird('cardinal', { size: 20, branch: false, label: '' });
    el.prev.innerHTML = W.icon('prev');
    el.next.innerHTML = W.icon('next');
    el.replay.innerHTML = W.icon('replay');
    el.send.innerHTML = W.icon('send');
    $('up-next-play-label').innerHTML = `${W.icon('play')}<span>Play now</span>`;

    el.rail.innerHTML = SCENES.map(
      (s, i) => `
      <li><button type="button" data-goto="${i}">
        ${W.icon(s.icon)}
        <span><strong>${s.name}</strong><span class="muted">${s.blurb}</span></span>
      </button></li>`,
    ).join('');

    el.sources.innerHTML = W.sources.map((s) => `<li data-src="${s.id}">${W.icon(s.icon)}<span>${s.label}</span></li>`).join('');

    // The table lists the twelve tools; the Connect step isn't one.
    $('toolset').innerHTML = SCENES.map((s, i) => [s, i])
      .filter(([s]) => !s.connect)
      .map(
        ([s, i]) => `
      <tr>
        <th scope="row"><button type="button" class="tool-link" data-goto="${i}" data-scroll>${W.icon(s.icon)}${s.name}</button><code>${s.tool.name}</code></th>
        <td data-label="A customer asks"><span class="muted">${s.who.first} in ${s.who.place.split(',')[0]}:</span> “${s.asks}”</td>
        <td data-label="Only WBU knows">${s.knows}</td>
        <td data-label="WBU gets">${s.captures}</td>
      </tr>`,
      )
      .join('');

    document.addEventListener('click', (e) => {
      const go = e.target.closest('[data-goto]');
      if (!go) return;
      state.paused = false;
      start(Number(go.dataset.goto));
      if (go.hasAttribute('data-scroll')) el.stage.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
    el.prev.addEventListener('click', () => {
      state.paused = false;
      start((state.index - 1 + SCENES.length) % SCENES.length);
    });
    el.next.addEventListener('click', () => {
      state.paused = false;
      start((state.index + 1) % SCENES.length);
    });
    el.replay.addEventListener('click', () => {
      state.paused = false;
      start(state.index);
    });
    el.tour.addEventListener('click', toggleTour);
    el.upNext.addEventListener('click', (e) => {
      if (e.target.closest('[data-stay]')) {
        state.tour = false;
        hideUpNext();
        renderTour();
      } else if (e.target.closest('#up-next-play')) {
        state.paused = false;
        start((state.index + 1) % SCENES.length);
      }
    });

    // The chat, not just the message list, so the sign-in window is covered.
    el.chat.addEventListener('click', onChatClick);
    el.chat.addEventListener('submit', onChatSubmit);
    // Clicking into a finished scene stops the tour so the result can be explored.
    el.messages.addEventListener('pointerdown', () => {
      if (state.run && state.run.done && state.tour) {
        state.tour = false;
        renderTour();
      }
    });

    // Hold the animation while the stage is scrolled out of view.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(
        ([entry]) => {
          state.offscreen = !entry.isIntersecting;
          renderTour();
        },
        { threshold: 0.2 },
      ).observe(el.stage);
    }

    const fromHash = SCENES.findIndex((s) => '#' + s.id === location.hash);
    start(fromHash >= 0 ? fromHash : 0);
  }

  // ---------------------------------------------------------------- tour

  function toggleTour() {
    if (state.tour && !state.paused) {
      state.paused = true;
    } else if (state.tour) {
      state.paused = false;
    } else {
      // Turning the tour back on after a finished scene moves on right away.
      state.paused = false;
      state.tour = true;
      if (!state.run || state.run.done) start((state.index + 1) % SCENES.length);
    }
    renderTour();
  }

  function renderTour() {
    const playing = state.tour && !state.paused;
    const label = playing ? 'Pause' : state.tour ? 'Resume' : 'Play tour';
    el.tour.innerHTML = `${W.icon(playing ? 'pause' : 'play')}<span>${label}</span>`;
    el.tour.setAttribute('aria-pressed', String(playing));
    const frozen = state.paused || state.offscreen;
    el.stage.classList.toggle('is-paused', frozen);
    for (const a of live) {
      if (frozen && a.playState === 'running') a.pause();
      else if (!frozen && a.playState === 'paused') a.play();
    }
  }

  function start(i) {
    if (state.run) state.run.cancelled = true;
    const run = { cancelled: false, done: false, scene: SCENES[i] };
    state.run = run;
    state.index = i;
    renderTour();
    play(run).then(
      () => {
        run.done = true;
        return afterScene(run);
      },
      (err) => {
        if (err !== CANCEL) console.error(err);
      },
    );
  }

  // Netflix-style: recap what WBU learned, then count down to the next tool.
  // "Stay here" (or a click on the dimmed chat) ends the tour instead.
  async function afterScene(run) {
    if (!state.tour) return;
    try {
      await wait(T.beforeNext, run);
      if (!state.tour) return;
      showUpNext(run);
      for (let n = T.countdown; n > 0; n--) {
        el.upWhen.textContent = `Up next in ${n} ${n === 1 ? 'second' : 'seconds'}`;
        await wait(1000, run, true);
        if (!state.tour) return;
      }
    } catch {
      return;
    }
    if (state.tour && state.run === run) start((state.index + 1) % SCENES.length);
  }

  const DELTA = {
    accounts: ['account linked', 'accounts linked'],
    visits: ['planned store visit', 'planned store visits'],
    signals: ['interest', 'interests'],
  };

  function showUpNext(run) {
    const next = SCENES[(state.index + 1) % SCENES.length];
    el.upList.innerHTML = [...el.captured.children]
      .filter((li) => !li.classList.contains('empty'))
      .map((li) => `<li>${li.innerHTML}</li>`)
      .join('');
    el.upDelta.innerHTML = Object.entries(DELTA)
      .filter(([k]) => run.scene.ledger[k])
      .map(([k, [one, many]]) => `<strong>+${run.scene.ledger[k]}</strong> ${run.scene.ledger[k] === 1 ? one : many}`)
      .join(', ');
    el.upIcon.innerHTML = W.icon(next.icon);
    el.upName.textContent = next.name;
    el.upBlurb.textContent = `${next.blurb}, in ${next.who.place.split(',')[0]}`;
    el.upNext.style.setProperty('--countdown', `${T.countdown}s`);
    el.upNext.classList.remove('counting');
    el.upNext.hidden = false;
    void el.upNext.offsetWidth;
    el.upNext.classList.add('counting');
  }

  function hideUpNext() {
    el.upNext.hidden = true;
    el.upNext.classList.remove('counting');
  }

  // ---------------------------------------------------------------- the scene

  async function play(run) {
    const s = run.scene;
    reset(s);

    // 1. The customer asks.
    setPhase(0);
    const bubble = append(`<div class="msg msg-user"><p></p></div>`);
    bubble.querySelector('p').textContent = s.query;
    if (!state.instant) await ask(s.query, bubble, run);

    // 2. The assistant calls the WBU MCP server. Before the customer has
    // connected WBU, it can only find WBU in its connector directory.
    setPhase(1);
    const toolRow = append(`
      <div class="tool-row">
        ${W.bird('cardinal', { size: 18, branch: false, label: '' })}
        ${s.connect ? '<span>Checking connectors</span>' : `<span>Wild Birds Unlimited</span><code>${s.tool.name}</code>`}
        <span class="tool-state"><i class="spinner" aria-hidden="true"></i><span>${s.connect ? 'Searching' : 'Asking WBU'}</span></span>
      </div>`);
    el.request.classList.remove('idle');
    el.requestStatus.classList.remove('ok');
    if (s.connect) {
      el.requestCode.textContent = '// WBU isn’t connected yet. The\n// assistant can suggest it, not call it.';
      el.requestStatus.textContent = 'Checking the connector directory';
      await wait(T.source * 2, run);
      el.requestStatus.textContent = s.result;
    } else {
      el.requestCode.textContent = formatCall(s.tool);
      el.requestStatus.textContent = 'Waiting for WBU';
      await flow(el.linkA, 'down', run);
      await flow(el.linkB, 'down', run);
      lightSources(s.sources);
      await wait(T.source, run);
      await flow(el.linkB, 'up', run);
      await flow(el.linkA, 'up', run);
      el.requestStatus.textContent = `WBU answered in ${s.latency}: ${s.result}`;
      el.requestStatus.classList.add('ok');
    }
    toolRow.querySelector('.tool-state').innerHTML = `${W.icon('check')}<span>${s.result}</span>`;

    // 3. WBU answers, in its own card.
    setPhase(2);
    const msg = append(`<div class="msg msg-assistant"><p class="msg-text"></p></div>`);
    const text = msg.querySelector('.msg-text');
    if (state.instant) text.textContent = s.reply;
    else {
      for (const word of s.reply.split(' ')) {
        text.textContent += (text.textContent ? ' ' : '') + word;
        await wait(T.word, run);
      }
    }
    // A suggested connector is the assistant's own UI; everything after
    // connecting renders inside WBU's card, as MCP Apps do.
    msg.insertAdjacentHTML(
      'beforeend',
      s.connect
        ? '<div class="widget"></div>'
        : `<div class="app-frame">
            <div class="app-head">${W.bird('cardinal', { size: 18, branch: false, label: '' })}<strong>Wild Birds Unlimited</strong><span class="muted">${s.who.store} store</span></div>
            <div class="widget"></div>
          </div>`,
    );
    const widget = msg.querySelector('.widget');
    widget.innerHTML = s.widget();
    for (const item of widget.querySelectorAll('[data-reveal]')) {
      item.classList.add('in');
      scrollToEnd();
      await wait(T.reveal, run);
    }
    el.note.textContent = s.note;
    el.note.classList.remove('write');
    void el.note.offsetWidth;
    el.note.classList.add('write');
    await wait(T.beforeCapture, run);

    // 4. The customer acts on it.
    setPhase(3);
    const cta = widget.querySelector('[data-auto]');
    await pointAt(cta, run);
    const form = activate(s, cta, true);
    if (form) {
      if (el.messages.contains(form)) await ensureVisible(form, run);
      else await wait(450, run);
      for (const input of form.querySelectorAll('input[data-value]')) {
        input.classList.add('focus');
        for (const ch of input.dataset.value) {
          input.value += ch;
          await wait(T.field, run);
        }
        input.classList.remove('focus');
        await wait(140, run);
      }
      for (const a of form.querySelectorAll('.attach')) {
        a.querySelector('span').textContent = a.dataset.value;
        a.classList.add('attached');
        await wait(300, run);
      }
      await pointAt(form.querySelector('[type="submit"]'), run);
      complete(s, form);
    }
    el.cursor.classList.remove('show');
    setPhase(4);
    el.chat.classList.remove('running');
  }

  function reset(s) {
    el.chat.classList.add('running');
    for (const a of live) a.cancel();
    live.clear();
    clearAsk();
    hideUpNext();
    el.messages.innerHTML = '';
    el.chat.querySelectorAll('.oauth').forEach((n) => n.remove());

    el.sceneName.textContent = s.name;
    el.sceneWhere.innerHTML = `${W.icon('pin')}${s.who.place}`;
    el.sceneBlurb.textContent = s.blurb;
    const labels = s.phases || PHASES;
    [...el.phases.children].forEach((li, i) => (li.textContent = labels[i]));
    el.askWho.textContent = `${s.who.first}, near ${s.who.place}, asks an AI assistant`;

    setConnected(!s.connect);
    el.mcpTool.textContent = s.tool.name;
    el.requestAuth.textContent = s.connect ? 'Not signed in' : signedIn(s.who);
    el.request.classList.add('idle');
    el.requestCode.textContent = 'No request yet';
    el.requestStatus.textContent = '';
    lightSources([]);
    el.linkA.className = 'link';
    el.linkB.className = 'link';
    el.note.textContent = '';
    el.note.classList.remove('write');
    el.captured.innerHTML = '<li class="empty">Shows up when the customer takes an action.</li>';

    el.cursor.classList.remove('show');
    el.cursor.classList.add('no-anim');
    el.cursor.style.transform = `translate(${el.chat.clientWidth * 0.72}px, ${el.chat.clientHeight - 60}px)`;
    void el.cursor.offsetWidth;
    el.cursor.classList.remove('no-anim');

    const buttons = el.rail.querySelectorAll('button');
    buttons.forEach((b, i) => b.setAttribute('aria-current', String(i === state.index)));
    const active = buttons[state.index];
    el.rail.scrollTo({ left: active.offsetLeft - (el.rail.clientWidth - active.offsetWidth) / 2, behavior: state.seen.size ? 'smooth' : 'auto' });
    state.seen.add(s.id);

    history.replaceState(null, '', '#' + s.id);
  }

  const signedIn = (who) => `Signed in as ${who.name}, home store ${who.store}`;

  function setConnected(on) {
    el.connector.classList.toggle('is-off', !on);
    el.connectorState.textContent = on ? 'connected' : 'not connected';
    el.mcpNode.classList.toggle('is-off', !on);
  }

  function lightSources(ids) {
    for (const li of el.sources.children) li.classList.toggle('on', ids.includes(li.dataset.src));
  }

  // Types the question in large type over the chat, then shrinks it onto its
  // chat bubble, crossfading the two.
  async function ask(query, bubble, run) {
    const typed = el.askText.querySelector('.typed');
    const rest = el.askText.querySelector('.rest');
    typed.textContent = '';
    rest.textContent = query;
    bubble.style.opacity = '0';
    el.ask.hidden = false;
    el.askText.classList.add('typing');
    motion(el.ask, [{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });
    await wait(T.start, run);
    // The untyped rest of the question is laid out invisibly, so lines wrap
    // where they'll end up and the block doesn't jump as it grows.
    for (let i = 1; i <= query.length; i++) {
      typed.textContent = query.slice(0, i);
      rest.textContent = query.slice(i);
      await wait(T.bigChar, run);
    }
    el.askText.classList.remove('typing');
    await wait(T.afterType, run);

    const box = el.askText.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(typed);
    const from = range.getBoundingClientRect();
    const to = bubble.querySelector('p').getBoundingClientRect();
    const cx = from.left + from.width / 2;
    const cy = from.top + from.height / 2;
    const scale = to.width / from.width;
    const dx = to.left + to.width / 2 - cx;
    const dy = to.top + to.height / 2 - cy;
    el.askText.style.transformOrigin = `${cx - box.left}px ${cy - box.top}px`;
    const fill = { duration: T.zoom, fill: 'forwards' };
    motion(
      el.askText,
      [{ transform: 'none', opacity: 1 }, { opacity: 1, offset: 0.6 }, { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 0 }],
      { ...fill, easing: 'cubic-bezier(0.6, 0, 0.2, 1)' },
    );
    motion(el.askWho, [{ opacity: 1 }, { opacity: 0 }], { ...fill, duration: T.zoom * 0.35 });
    motion(el.askScrim, [{ opacity: 1 }, { opacity: 0 }], { ...fill, easing: 'ease-in' });
    motion(bubble, [{ opacity: 0, transform: 'scale(0.9)' }, { opacity: 0, offset: 0.5 }, { opacity: 1, transform: 'none' }], {
      ...fill,
      easing: 'ease-out',
    });
    await wait(T.zoom, run);
    clearAsk();
    bubble.style.opacity = '';
    bubble.getAnimations().forEach((a) => a.cancel());
  }

  function clearAsk() {
    el.ask.hidden = true;
    el.askText.classList.remove('typing');
    el.askText.style.transformOrigin = '';
    for (const a of el.ask.getAnimations({ subtree: true })) a.cancel();
  }

  function setPhase(p) {
    [...el.phases.children].forEach((li, i) => {
      li.classList.toggle('done', i < p);
      li.classList.toggle('current', i === p);
      if (i === p) li.setAttribute('aria-current', 'step');
      else li.removeAttribute('aria-current');
    });
  }

  // ---------------------------------------------------------------- helpers

  function append(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    const node = t.content.firstElementChild;
    el.messages.appendChild(node);
    scrollToEnd();
    return node;
  }

  function scrollToEnd() {
    el.messages.scrollTo({ top: el.messages.scrollHeight, behavior: state.instant ? 'auto' : 'smooth' });
  }

  // Scrolls the chat (never the page) so `target` is in view.
  function ensureVisible(target, run) {
    if (!el.messages.contains(target)) return Promise.resolve();
    const box = el.messages.getBoundingClientRect();
    const r = target.getBoundingClientRect();
    let delta = 0;
    if (r.bottom > box.bottom - 12) delta = r.bottom - box.bottom + 20;
    if (r.top - delta < box.top + 12) delta = r.top - box.top - 20;
    if (!delta) return Promise.resolve();
    el.messages.scrollBy({ top: delta, behavior: state.instant ? 'auto' : 'smooth' });
    return wait(420, run);
  }

  async function pointAt(target, run) {
    if (state.instant) return;
    await ensureVisible(target, run);
    const c = el.chat.getBoundingClientRect();
    const r = target.getBoundingClientRect();
    const x = r.left - c.left + Math.min(r.width * 0.6, r.width - 12);
    const y = r.top - c.top + r.height * 0.5;
    el.cursor.classList.add('show');
    el.cursor.style.transform = `translate(${x}px, ${y}px)`;
    await wait(T.cursor, run);
    el.cursor.classList.add('click');
    target.classList.add('pressed');
    await wait(T.click, run);
    el.cursor.classList.remove('click');
    target.classList.remove('pressed');
  }

  async function flow(link, dir, run) {
    if (state.instant) return;
    link.className = `link flow-${dir}`;
    await wait(T.packet, run);
    link.className = 'link';
  }

  function formatCall(tool) {
    const args = JSON.stringify(tool.args, null, 2).replace(/"([a-z_]+)":/g, '$1:');
    return `${tool.name}(${args})`;
  }

  const fill = (text, ctx) => text.replaceAll('{context}', ctx);

  // ---------------------------------------------------------------- actions

  // Starts the action behind a button. Returns the form to fill in, or null
  // when the action needs no input (it completes right away).
  function activate(s, trigger, auto) {
    const key = trigger.dataset.cta || 'default';
    const spec = s.forms[key];
    const ctx = trigger.dataset.context || '';
    const host = trigger.closest('.app-frame') || trigger.closest('.msg');
    const meta = { key, ctx, trigger, host };
    if (!spec.fields.length) {
      finish(s, meta, null);
      return null;
    }
    host.querySelector(':scope > form.elicit')?.remove();

    const form = document.createElement('form');
    form.className = 'elicit';
    form.innerHTML = `
      ${spec.modal ? `<div class="oauth-brand">${W.bird('cardinal', { size: 44, branch: false, label: '' })}</div>` : ''}
      <strong class="elicit-title">${fill(spec.title, ctx)}</strong>
      ${spec.fields
        .map((f, i) => {
          if (f.attach) {
            return `<div class="field"><span>${f.label}</span><span class="attach${auto ? '' : ' attached'}" data-value="${f.value}">${W.icon('photo')}<span>${auto ? 'Choose a photo' : f.value}</span></span></div>`;
          }
          const typed = auto && !f.account;
          return `<label class="field${f.account ? ' from-account' : ''}"><span>${f.label}</span><input name="f${i}" type="${f.type || 'text'}" value="${typed ? '' : f.value}" ${typed ? `data-value="${f.value}"` : ''} autocomplete="off" required></label>`;
        })
        .join('')}
      ${spec.fields.some((f) => f.account) ? '<p class="account-note">Filled in from your Wild Birds Unlimited account.</p>' : ''}
      <p class="consent">${fill(spec.consent, ctx)}</p>
      <div class="elicit-actions">
        <button type="button" class="btn btn-quiet" data-cancel>Cancel</button>
        <button type="submit" class="btn btn-capture">${spec.submit}</button>
      </div>`;
    form._meta = meta;

    if (spec.modal) {
      // Signing in happens in the provider's own window, over the chat.
      const win = document.createElement('div');
      win.className = 'oauth';
      win.innerHTML = `<div class="oauth-window"><div class="oauth-bar">${W.icon('lock')}<span>Secure sign-in</span></div></div>`;
      win.firstElementChild.appendChild(form);
      el.chat.appendChild(win);
      form._modal = win;
    } else {
      host.appendChild(form);
    }
    if (!auto) {
      ensureVisible(form, state.run).catch(() => {});
      form.querySelector('input:not([readonly])')?.focus({ preventScroll: true });
    }
    return form;
  }

  function complete(s, form) {
    finish(s, form._meta, form);
  }

  function finish(s, { key, ctx, trigger, host }, form) {
    const spec = s.forms[key];
    const done = document.createElement('div');
    if (spec.reveal) {
      done.className = 'reveal';
      done.innerHTML = spec.after();
    } else {
      done.className = 'confirm';
      done.innerHTML = `<span class="confirm-icon">${W.icon('check')}</span><div><p>${fill(spec.confirm, ctx)}</p>${spec.after ? spec.after() : ''}</div>`;
    }
    if (form && !form._modal) form.replaceWith(done);
    else {
      form?._modal.remove();
      host.appendChild(done);
    }

    trigger.disabled = true;
    trigger.classList.add('is-done');
    trigger.innerHTML = `${W.icon('check')}<span>${fill(spec.done, ctx)}</span>`;

    const empty = el.captured.querySelector('.empty');
    if (empty) empty.remove();
    const have = new Set([...el.captured.children].map((li) => li.dataset.key));
    for (const [label, value] of spec.captured) {
      const v = fill(value, ctx);
      const k = label + '|' + v;
      if (have.has(k)) continue;
      const li = document.createElement('li');
      li.dataset.key = k;
      li.innerHTML = '<span></span><strong></strong>';
      li.firstChild.textContent = label;
      li.lastChild.textContent = v;
      el.captured.appendChild(li);
    }

    if (!state.counted.has(s.id)) {
      state.counted.add(s.id);
      for (const k of Object.keys(state.totals)) {
        if (!s.ledger[k]) continue;
        state.totals[k] += s.ledger[k];
        const n = el.ledger[k];
        n.textContent = state.totals[k];
        n.classList.remove('bump');
        void n.offsetWidth;
        n.classList.add('bump');
      }
    }

    if (s.connect) {
      setConnected(true);
      el.mcpTool.textContent = 'connected';
      lightSources(['accounts']);
      el.requestAuth.textContent = signedIn(s.who);
      el.requestCode.textContent = 'OAuth sign-in\nscopes: stores, holds, bookings, food_bank';
      el.requestStatus.textContent = 'Account linked';
      el.requestStatus.classList.add('ok');
    }
    scrollToEnd();
  }

  // ---------------------------------------------------------------- manual use

  function onChatClick(e) {
    if (el.chat.classList.contains('running')) return;
    const t = e.target.closest('button');
    if (!t || t.disabled) return;
    const s = state.run.scene;

    if (t.hasAttribute('data-cta')) activate(s, t, false);
    else if (t.hasAttribute('data-cancel')) {
      const form = t.closest('form');
      (form._modal || form).remove();
    } else if (t.hasAttribute('data-filter')) {
      const group = t.parentElement;
      group.querySelectorAll('[data-filter]').forEach((c) => c.setAttribute('aria-pressed', String(c === t)));
      const cat = t.dataset.filter;
      t.closest('.widget')
        .querySelectorAll('[data-cat]')
        .forEach((li) => (li.hidden = cat !== 'All' && li.dataset.cat !== cat));
    } else if (t.hasAttribute('data-format')) {
      t.parentElement.querySelectorAll('[data-format]').forEach((c) => c.setAttribute('aria-pressed', String(c === t)));
    } else if (t.hasAttribute('data-toggle')) {
      t.innerHTML = `${W.icon('check')}<span>${t.dataset.toggle}</span>`;
      t.disabled = true;
      t.classList.add('is-done');
    } else if (t.hasAttribute('data-song')) {
      t.classList.toggle('playing');
    }
  }

  function onChatSubmit(e) {
    e.preventDefault();
    if (el.chat.classList.contains('running') || !e.target._meta) return;
    complete(state.run.scene, e.target);
  }

  setup();
})();
