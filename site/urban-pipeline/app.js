// Player for the Urban Pipeline demo. Plays scenes.js like a video: a clock
// advances while playing, beats fire as the clock passes them, and seeking
// rebuilds the scene and replays its beats instantly.

(function () {
  const { scenes } = window.FILM;
  const params = new URLSearchParams(location.search);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // ?still shows each scene's finished state with every caption, no clock.
  // Reduced motion gets the same view unless ?play asks for the animation.
  const still = params.has('still') || (reduced && !params.has('play'));

  const $ = (id) => document.getElementById(id);
  const stage = $('stage');
  const sceneEl = $('scene');
  const capText = $('caption-text');
  const capCode = $('caption-code');
  const poster = $('poster');
  const outro = $('outro');
  const playBtn = $('play');
  const scrub = $('scrub');
  const timeEl = $('time');
  const chapters = $('chapters');

  const starts = [];
  const total = scenes.reduce((sum, s) => (starts.push(sum), sum + s.dur), 0);

  let cur = 0;
  let t = 0;
  let beat = 0;
  let playing = false;
  let last = 0;
  let cursor = null;

  const fmt = (ms) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  // Helpers handed to beats.
  const ctx = {
    point(sel) {
      const target = sceneEl.querySelector(sel);
      if (!target || !cursor) return;
      const box = sceneEl.getBoundingClientRect();
      const r = target.getBoundingClientRect();
      const x = r.left - box.left + Math.min(r.width * 0.5, 60);
      const y = r.top - box.top + r.height * 0.55;
      cursor.style.transform = `translate(${x}px, ${y}px)`;
      cursor.classList.add('on');
    },
    click() {
      if (!cursor) return;
      cursor.classList.remove('click');
      void cursor.offsetWidth;
      cursor.classList.add('click');
    },
    // Draws a curve from a source card to its destination card.
    thread(key, order, cls = '') {
      const svg = sceneEl.querySelector('.threads');
      const a = sceneEl.querySelector(`.src[data-k="${key}"]`);
      const b = sceneEl.querySelector(`.dst[data-k="${key}"]`);
      if (!svg || !a || !b) return;
      const box = svg.getBoundingClientRect();
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      const x1 = ra.right - box.left;
      const y1 = ra.top + ra.height / 2 - box.top;
      const x2 = rb.left - box.left;
      const y2 = rb.top + rb.height / 2 - box.top;
      const mid = (x1 + x2) / 2;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`);
      path.setAttribute('pathLength', '1');
      path.setAttribute('class', `thread ${cls}`);
      path.style.animationDelay = `${order * 160}ms`;
      svg.appendChild(path);
      a.classList.add('matched');
      b.classList.add('matched');
    },
  };

  function setCaption(text, code) {
    capText.textContent = text;
    capCode.textContent = code || '';
    capCode.hidden = !code;
  }

  function build(i) {
    cur = i;
    t = 0;
    beat = 0;
    sceneEl.innerHTML = '';
    sceneEl.className = `scene scene-${i + 1}`;
    scenes[i].render(sceneEl);
    cursor = document.createElement('div');
    cursor.className = 'cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<svg viewBox="0 0 24 24"><path d="M5 3l14 8-6.2 1.6L10 19z" /></svg>';
    sceneEl.appendChild(cursor);
    $('scene-num').textContent = `${i + 1} of ${scenes.length}`;
    $('scene-title').textContent = scenes[i].title;
    [...chapters.children].forEach((li, n) => {
      const b = li.firstElementChild;
      if (n === i) b.setAttribute('aria-current', 'step');
      else b.removeAttribute('aria-current');
    });
    setCaption('', '');
    // Flush styles so beats at 0 ms still transition in.
    void sceneEl.offsetWidth;
    if (!still) {
      sceneEl.classList.add('enter');
    }
  }

  function applyTo(time) {
    const beats = scenes[cur].beats;
    while (beat < beats.length && beats[beat].at <= time) {
      const b = beats[beat++];
      if (b.run) b.run(sceneEl, ctx);
      if (b.cap) setCaption(b.cap, b.code);
      else if (b.code) {
        capCode.textContent = b.code;
        capCode.hidden = false;
      }
    }
  }

  function settle() {
    sceneEl.getAnimations({ subtree: true }).forEach((a) => a.finish());
  }

  function seek(i, time) {
    build(i);
    t = Math.max(0, Math.min(time, scenes[i].dur));
    applyTo(t);
    settle();
    if (!playing) pauseAnimations();
    progress();
  }

  // The scene's fade-in always completes, so pausing never freezes it half-visible.
  function pauseAnimations() {
    sceneEl.getAnimations({ subtree: true }).forEach((a) => {
      if (a.playState !== 'running') return;
      if (a.effect && a.effect.target === sceneEl) a.finish();
      else a.pause();
    });
  }

  function resumeAnimations() {
    sceneEl.getAnimations({ subtree: true }).forEach((a) => a.playState === 'paused' && a.play());
  }

  function tick(now) {
    if (!playing) return;
    t += Math.min(now - last, 100);
    last = now;
    applyTo(t);
    if (t >= scenes[cur].dur) {
      if (cur < scenes.length - 1) {
        build(cur + 1);
        applyTo(0);
      } else {
        t = scenes[cur].dur;
        setPlaying(false);
        outro.hidden = false;
        $('replay').focus();
      }
    }
    progress();
    if (playing) requestAnimationFrame(tick);
  }

  function setPlaying(on) {
    playing = on;
    stage.classList.toggle('paused', !on);
    playBtn.classList.toggle('is-playing', on);
    playBtn.setAttribute('aria-label', on ? 'Pause' : 'Play');
    if (on) {
      poster.hidden = true;
      outro.hidden = true;
      resumeAnimations();
      last = performance.now();
      requestAnimationFrame(tick);
    } else {
      pauseAnimations();
    }
  }

  function toggle() {
    if (!playing && cur === scenes.length - 1 && t >= scenes[cur].dur) {
      seek(0, 0);
    }
    setPlaying(!playing);
  }

  function go(i) {
    const n = Math.max(0, Math.min(scenes.length - 1, i));
    outro.hidden = true;
    poster.hidden = true;
    if (still) {
      showStill(n);
      return;
    }
    seek(n, 0);
    if (playing) resumeAnimations();
  }

  function progress() {
    const g = starts[cur] + t;
    [...scrub.children].forEach((seg, n) => {
      const fill = n < cur ? 1 : n > cur ? 0 : t / scenes[n].dur;
      seg.firstElementChild.style.transform = `scaleX(${fill})`;
    });
    timeEl.textContent = `${fmt(g)} / ${fmt(total)}`;
    scrub.setAttribute('aria-valuenow', String(Math.round(g / 1000)));
    scrub.setAttribute('aria-valuetext', `Scene ${cur + 1} of ${scenes.length}, ${fmt(g)}`);
  }

  function seekGlobal(ms) {
    const g = Math.max(0, Math.min(total - 1, ms));
    let i = scenes.length - 1;
    while (i > 0 && starts[i] > g) i--;
    outro.hidden = true;
    poster.hidden = true;
    seek(i, g - starts[i]);
    if (playing) resumeAnimations();
  }

  // Still mode: finished state plus every caption for the scene.
  function showStill(i) {
    build(i);
    applyTo(Infinity);
    settle();
    capText.innerHTML = '';
    capCode.hidden = true;
    const list = document.createElement('ol');
    list.className = 'still-caps';
    scenes[i].beats
      .filter((b) => b.cap)
      .forEach((b) => {
        const li = document.createElement('li');
        li.textContent = b.cap;
        if (b.code) {
          const c = document.createElement('code');
          c.textContent = b.code;
          li.append(' ', c);
        }
        list.appendChild(li);
      });
    capText.appendChild(list);
    $('prev').disabled = i === 0;
    $('next').disabled = i === scenes.length - 1;
    timeEl.textContent = `Scene ${i + 1} of ${scenes.length}`;
  }

  function setup() {
    document.documentElement.classList.toggle('still', still);
    $('poster-length').textContent = `(${fmt(total)})`;
    scrub.setAttribute('aria-valuemax', String(Math.round(total / 1000)));

    scenes.forEach((s, i) => {
      const seg = document.createElement('span');
      seg.className = 'seg';
      seg.style.flexGrow = String(s.dur);
      seg.title = s.title;
      seg.appendChild(document.createElement('i'));
      scrub.appendChild(seg);

      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = `<span class="ch-num">${i + 1}</span><span class="ch-title"></span>`;
      b.lastElementChild.textContent = s.title;
      b.addEventListener('click', () => go(i));
      li.appendChild(b);
      chapters.appendChild(li);
    });

    const modeLink = $('mode-link');
    if (still) {
      modeLink.textContent = 'Watch the animated version';
      modeLink.href = '?play';
      poster.hidden = true;
      showStill(0);
    } else {
      seek(0, 0);
      stage.classList.add('paused');
    }

    $('play-big').addEventListener('click', () => {
      seek(0, 0);
      setPlaying(true);
    });
    $('replay').addEventListener('click', () => {
      seek(0, 0);
      setPlaying(true);
    });
    playBtn.addEventListener('click', toggle);
    $('prev').addEventListener('click', () => go(!still && t > 2500 ? cur : cur - 1));
    $('next').addEventListener('click', () => go(cur + 1));

    sceneEl.addEventListener('click', () => {
      if (!still) toggle();
    });

    scrub.addEventListener('pointerdown', (e) => {
      const move = (ev) => {
        const r = scrub.getBoundingClientRect();
        seekGlobal(((ev.clientX - r.left) / r.width) * total);
      };
      move(e);
      scrub.setPointerCapture(e.pointerId);
      scrub.addEventListener('pointermove', move);
      scrub.addEventListener('pointerup', () => scrub.removeEventListener('pointermove', move), { once: true });
    });
    scrub.addEventListener('keydown', (e) => {
      const g = starts[cur] + t;
      const step = { ArrowLeft: -5000, ArrowRight: 5000, PageDown: -15000, PageUp: 15000 }[e.key];
      if (step) seekGlobal(g + step);
      else if (e.key === 'Home') seekGlobal(0);
      else if (e.key === 'End') seekGlobal(total - 1);
      else return;
      e.preventDefault();
      e.stopPropagation();
    });

    document.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if ((e.key === ' ' || e.key === 'k') && !still) {
        if (tag === 'BUTTON' || tag === 'A') return;
        e.preventDefault();
        toggle();
      } else if (e.key === 'ArrowRight') {
        go(cur + 1);
      } else if (e.key === 'ArrowLeft') {
        go(cur - 1);
      }
    });

    // Layout-dependent beats (cursor, threads) are recomputed on resize.
    let width = sceneEl.clientWidth;
    let timer = 0;
    new ResizeObserver(() => {
      if (sceneEl.clientWidth === width) return;
      width = sceneEl.clientWidth;
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (still) showStill(cur);
        else {
          seek(cur, t);
          if (playing) resumeAnimations();
        }
      }, 150);
    }).observe(sceneEl);
  }

  setup();
})();
