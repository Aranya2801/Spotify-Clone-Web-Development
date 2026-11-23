import { TRACKS, byId, subtitle } from './tracks.js';
import { TrackSpace, foldTempo } from './similarity.js';
import { Queue } from './queue.js';
import { store } from './store.js';
import { Spectrum, WaveformSeek, dominantColor } from './visualizer.js';
import { formatTime, esc, clamp } from './utils.js';

const $ = sel => document.querySelector(sel);
const audio = $('#audio');
const viewEl = $('#view');

let space = null; // TrackSpace, null until features.json loads (or if it fails)
let features = {};
const queue = new Queue();
let contexts = new Map(); // ctx key -> { name, ids, href }, rebuilt on every render
let playingCtx = null;
let spectrum = null;
let waveform = null;

const ALL_IDS = TRACKS.map(t => t.id);

// ---------------------------------------------------------------- icons

const ICON = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>',
  heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>',
  more: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>',
  shuffle: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
};
const EQ = '<span class="eq" aria-hidden="true"><i></i><i></i><i></i></span>';

// ---------------------------------------------------------------- helpers

const feat = id => features[id] || null;
const bpm = id => (feat(id) ? Math.round(foldTempo(feat(id).tempo)) : null);

// energy as low / mid / high relative to the rest of the library
function energyLabel(id) {
  if (!feat(id)) return null;
  const sorted = ALL_IDS.map(x => feat(x)?.energy ?? 0).sort((a, b) => a - b);
  const rank = sorted.indexOf(feat(id).energy) / (sorted.length - 1);
  return rank < 0.34 ? 'low energy' : rank > 0.66 ? 'high energy' : 'mid energy';
}

function totalDuration(ids) {
  const s = ids.reduce((acc, id) => acc + (byId.get(id)?.duration || 0), 0);
  const m = Math.round(s / 60);
  return m >= 60 ? `${Math.floor(m / 60)} hr ${m % 60} min` : `${m} min`;
}

let toastTimer;
function toast(msg, action = null) {
  const el = $('#toast');
  el.innerHTML = esc(msg) + (action ? ` <button class="toast-action">${esc(action.label)}</button>` : '');
  if (action) el.querySelector('button').onclick = () => { action.run(); el.classList.remove('show'); };
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), action ? 5000 : 2500);
}

function registerCtx(key, name, ids, href) {
  contexts.set(key, { name, ids, href });
  return key;
}

// ---------------------------------------------------------------- rendering

function cardHTML(t, ctx, extra = '') {
  return `
    <div class="card" data-id="${t.id}">
      <div class="card-art">
        <img src="${t.cover}" alt="" loading="lazy" />
        <button class="card-play" data-play="${t.id}" data-ctx="${ctx}" aria-label="Play ${esc(t.title)}">${ICON.play}</button>
      </div>
      <div class="card-title">${esc(t.title)}</div>
      <div class="card-sub">${extra || esc(t.original ? `cover · ${t.original}` : 'original')}</div>
    </div>`;
}

function rowHTML(t, i, ctx, { score = null, reason = '' } = {}, opts = {}) {
  const liked = store.isLiked(t.id);
  const b = bpm(t.id);
  return `
    <div class="row" data-id="${t.id}" data-play="${t.id}" data-ctx="${ctx}" tabindex="0">
      <span class="row-num"><span class="n">${i + 1}</span>${EQ}</span>
      <img class="row-cover" src="${t.cover}" alt="" loading="lazy" />
      <div class="row-main">
        <div class="row-title">${esc(t.title)}</div>
        <div class="row-sub">${esc(subtitle(t))}</div>
      </div>
      <span class="row-col row-genre muted">${score != null ? `<span class="match" title="${esc(reason)}">${Math.round(score * 100)}% match</span>` : opts.scoreCol ? 'seed' : esc(t.genre)}</span>
      <span class="row-col row-bpm muted mono">${b ? b + ' bpm' : ''}</span>
      <button class="icon-btn row-like ${liked ? 'liked' : ''}" data-action="like" data-id="${t.id}" aria-label="${liked ? 'Remove from' : 'Save to'} Liked Songs" aria-pressed="${liked}">${ICON.heart}</button>
      <span class="row-col row-dur muted mono">${formatTime(t.duration)}</span>
      <button class="icon-btn row-more" data-action="menu" data-id="${t.id}" data-ctx="${ctx}" aria-label="More options for ${esc(t.title)}">${ICON.more}</button>
    </div>`;
}

function listHTML(ids, ctx, opts = {}) {
  if (!ids.length) return `<p class="empty">${opts.empty || 'Nothing here yet.'}</p>`;
  return `
    <div class="list">
      <div class="list-head" aria-hidden="true">
        <span>#</span><span></span><span>Title</span><span>${opts.scoreCol ? 'Match' : 'Genre'}</span><span>Tempo</span><span></span><span>Time</span><span></span>
      </div>
      ${ids.map((id, i) => rowHTML(byId.get(id), i, ctx, opts.meta?.[id], opts)).join('')}
    </div>`;
}

function collectionHeader({ title, kicker, cover, ids, ctx, actions = '' }) {
  return `
    <header class="collection-head">
      <div class="collection-cover">${cover}</div>
      <div>
        <div class="kicker">${esc(kicker)}</div>
        <h1 class="collection-title">${title}</h1>
        <div class="collection-meta">${ids.length} song${ids.length === 1 ? '' : 's'}${ids.length ? ', ' + totalDuration(ids) : ''}</div>
      </div>
    </header>
    <div class="collection-actions">
      ${ids.length ? `<button class="play-big" data-play="${ids[0]}" data-ctx="${ctx}" aria-label="Play">${ICON.play}</button>
      <button class="icon-btn ctrl big" data-action="shuffle-play" data-ctx="${ctx}" aria-label="Shuffle play" title="Smooth shuffle">${ICON.shuffle}</button>` : ''}
      ${actions}
    </div>`;
}

function heroHTML() {
  const id = queue.current || store.get('last')?.id || ALL_IDS[0];
  const t = byId.get(id);
  const f = feat(id);
  const playing = queue.current === id;
  const chips = f ? [`${bpm(id)} bpm`, f.key, energyLabel(id)] : [t.genre];
  const liked = store.isLiked(id);
  return `
    <section class="hero">
      <div class="hero-bg" style="background-image:url('${t.banner}')"></div>
      <img class="hero-cover" src="${t.cover}" alt="" id="hero-cover" />
      <div class="hero-info">
        <div class="kicker">${playing ? 'Now playing' : 'Pick up where you left off'}</div>
        <h1 class="hero-title">${esc(t.title)}</h1>
        <p class="hero-sub">${esc(subtitle(t))}</p>
        <div class="chips">${chips.map(c => `<span class="chip">${esc(c)}</span>`).join('')}</div>
        <div class="hero-actions">
          <button class="btn-play" data-action="${playing ? 'toggle' : 'hero-play'}" data-id="${id}">
            ${playing && !audio.paused ? ICON.pause + ' Pause' : ICON.play + ' Play'}
          </button>
          <button class="icon-btn like-btn ${liked ? 'liked' : ''}" data-action="like" data-id="${id}" aria-label="Save to Liked Songs" aria-pressed="${liked}">${ICON.heart}</button>
          <a class="text-link" href="#/radio/${id}">Song radio →</a>
        </div>
      </div>
    </section>
    <canvas class="spectrum" id="spectrum" aria-hidden="true"></canvas>`;
}

// buckets for the browse section, derived from the extracted features
function feelBuckets() {
  if (!space) return {};
  const score = id => {
    const f = feat(id);
    return (foldTempo(f.tempo) - 100) / 25 + (f.energy - 0.14) / 0.03;
  };
  const ranked = [...ALL_IDS].sort((a, b) => score(a) - score(b));
  return { calm: ranked.slice(0, 4), upbeat: ranked.slice(-4).reverse() };
}

const BROWSE = [
  { key: 'feel/calm', label: 'Calm & slow', color: '#2d46b9' },
  { key: 'feel/upbeat', label: 'Upbeat', color: '#e8115b' },
  { key: 'genre/Bollywood', label: 'Bollywood', color: '#dc5b1e' },
  { key: 'genre/Indie', label: 'Indie', color: '#148a08' },
  { key: 'genre/Pop', label: 'Pop', color: '#8d67ab' },
];

function renderHome() {
  const seed = queue.current || store.get('last')?.id || ALL_IDS[0];
  registerCtx('all', 'All tracks', ALL_IDS, '#/library');

  let similarBlock = '';
  if (space) {
    const sims = space.similar(seed, 5);
    registerCtx('similar', `Similar to ${byId.get(seed).title}`, [seed, ...sims.map(s => s.id)], `#/radio/${seed}`);
    similarBlock = `
      <section class="shelf">
        <div class="shelf-head">
          <h2>More like ${esc(byId.get(seed).title)}</h2>
          <a class="see-all" href="#/radio/${seed}">Song radio</a>
        </div>
        <div class="grid">
          ${sims.map(s => cardHTML(byId.get(s.id), 'similar',
            `<span class="match" title="${esc(space.explain(seed, s.id).join(', '))}">${Math.round(s.score * 100)}% match</span> · ${esc(space.explain(seed, s.id, 1)[0])}`)).join('')}
        </div>
      </section>`;
  }

  const recent = store.get('recent').filter(id => byId.has(id)).slice(0, 5);
  if (recent.length) registerCtx('recent', 'Recently played', recent, '#/recent');

  viewEl.innerHTML = `
    ${heroHTML()}
    ${similarBlock}
    ${recent.length ? `
      <section class="shelf">
        <div class="shelf-head"><h2>Recently played</h2><a class="see-all" href="#/recent">Show all</a></div>
        <div class="grid">${recent.map(id => cardHTML(byId.get(id), 'recent')).join('')}</div>
      </section>` : ''}
    <section class="shelf">
      <div class="shelf-head"><h2>Acoustic covers</h2><a class="see-all" href="#/library">Show all</a></div>
      <div class="grid">${TRACKS.map(t => cardHTML(t, 'all')).join('')}</div>
    </section>
    <section class="shelf">
      <div class="shelf-head"><h2>Browse</h2></div>
      <div class="browse">
        ${BROWSE.filter(b => space || !b.key.startsWith('feel')).map(b =>
          `<a class="browse-card" href="#/browse/${b.key}" style="--c:${b.color}">${esc(b.label)}</a>`).join('')}
      </div>
    </section>`;

  const canvas = $('#spectrum');
  if (spectrum) spectrum.canvas = canvas;
  else spectrum = new Spectrum(canvas, audio);
  spectrum.start();
  tintFromCover($('#hero-cover'));
}

const SORTS = {
  default: null,
  title: (a, b) => byId.get(a).title.localeCompare(byId.get(b).title),
  duration: (a, b) => byId.get(a).duration - byId.get(b).duration,
  tempo: (a, b) => (bpm(a) ?? 0) - (bpm(b) ?? 0),
  energy: (a, b) => (feat(b)?.energy ?? 0) - (feat(a)?.energy ?? 0),
};

function renderLibrary(sort = 'default') {
  const ids = SORTS[sort] ? [...ALL_IDS].sort(SORTS[sort]) : ALL_IDS;
  registerCtx('library', 'Your Library', ids, '#/library');
  viewEl.innerHTML = `
    ${collectionHeader({
      title: 'Acoustic Covers',
      kicker: 'Album',
      cover: `<div class="mosaic">${['01', '04', '06', '08'].map(id => `<img src="${byId.get(id).cover}" alt="" />`).join('')}</div>`,
      ids,
      ctx: 'library',
      actions: `<label class="sort">Sort by
        <select id="sort-select">
          ${Object.keys(SORTS).map(k => `<option value="${k}" ${k === sort ? 'selected' : ''}>${k === 'default' ? 'track number' : k}</option>`).join('')}
        </select></label>`,
    })}
    ${listHTML(ids, 'library')}`;
  $('#sort-select').onchange = e => renderLibrary(e.target.value);
}

function gradientCover(a, b, glyph) {
  return `<div class="grad-cover" style="--a:${a};--b:${b}">${glyph}</div>`;
}

function renderLiked() {
  const ids = store.get('liked').filter(id => byId.has(id));
  registerCtx('liked', 'Liked Songs', ids, '#/liked');
  viewEl.innerHTML = collectionHeader({
    title: 'Liked Songs', kicker: 'Playlist', ids, ctx: 'liked',
    cover: gradientCover('#450af5', '#8e8ee5', ICON.heart),
  }) + listHTML(ids, 'liked', { empty: 'Songs you like will show up here. Hit the heart on any track.' });
}

function renderRecent() {
  const ids = store.get('recent').filter(id => byId.has(id));
  registerCtx('recent', 'Recently played', ids, '#/recent');
  viewEl.innerHTML = collectionHeader({
    title: 'Recently played', kicker: 'History', ids, ctx: 'recent',
    cover: gradientCover('#0d7377', '#14ffec', '⟲'),
  }) + listHTML(ids, 'recent', { empty: 'Nothing played yet.' });
}

function renderPlaylist(pid) {
  const p = store.playlist(pid);
  if (!p) return (location.hash = '#/');
  const ids = p.tracks.filter(id => byId.has(id));
  const ctx = registerCtx(`pl:${pid}`, p.name, ids, `#/playlist/${pid}`);
  const cover = ids.length
    ? `<div class="mosaic">${[0, 1, 2, 3].map(i => `<img src="${byId.get(ids[i % ids.length]).cover}" alt="" />`).join('')}</div>`
    : gradientCover('#333', '#555', '♪');
  viewEl.innerHTML = collectionHeader({
    title: `<span class="editable" id="pl-name" contenteditable="plaintext-only" spellcheck="false">${esc(p.name)}</span>`,
    kicker: 'Playlist', ids, ctx, cover,
    actions: `<button class="btn-ghost" data-action="delete-playlist" data-pid="${pid}">Delete playlist</button>`,
  }) + listHTML(ids, ctx, { empty: 'Empty playlist. Use the ··· menu on any song to add it here.' });

  const nameEl = $('#pl-name');
  nameEl.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); nameEl.blur(); } });
  nameEl.addEventListener('blur', () => {
    store.renamePlaylist(pid, nameEl.textContent);
    nameEl.textContent = store.playlist(pid).name;
    renderSidebar();
  });
}

function renderRadio(id) {
  const t = byId.get(id);
  if (!t) return (location.hash = '#/');
  if (!space) {
    viewEl.innerHTML = `<p class="empty">Song radio needs data/features.json, which didn't load.</p>`;
    return;
  }
  const sims = space.similar(id, ALL_IDS.length - 1);
  const ids = [id, ...sims.map(s => s.id)];
  const meta = Object.fromEntries(sims.map(s => [s.id, { score: s.score, reason: space.explain(id, s.id).join(', ') }]));
  registerCtx(`radio:${id}`, `${t.title} radio`, ids, `#/radio/${id}`);
  viewEl.innerHTML = collectionHeader({
    title: `${esc(t.title)} Radio`, kicker: 'Based on how this song sounds',
    cover: `<img src="${t.cover}" alt="" />`, ids, ctx: `radio:${id}`,
  }) + `<p class="note">Ranked by audio similarity: tempo, key, energy and timbre. Hover a match score to see why.</p>`
    + listHTML(ids, `radio:${id}`, { meta, scoreCol: true });
}

function renderBrowse(kind, value) {
  let ids = [];
  let title = value;
  if (kind === 'genre') ids = ALL_IDS.filter(id => byId.get(id).genre === value);
  if (kind === 'feel') {
    ids = feelBuckets()[value] || [];
    title = value === 'calm' ? 'Calm & slow' : 'Upbeat';
  }
  const b = BROWSE.find(x => x.key === `${kind}/${value}`);
  const ctx = registerCtx(`browse:${kind}:${value}`, title, ids, `#/browse/${kind}/${value}`);
  viewEl.innerHTML = collectionHeader({
    title: esc(title), kicker: kind === 'feel' ? 'Picked from audio features' : 'Genre',
    cover: gradientCover(b?.color || '#333', '#111', ''), ids, ctx,
  }) + listHTML(ids, ctx);
}

function renderSearch(q) {
  const input = $('#search-input');
  if (document.activeElement !== input) input.value = q;
  const needle = q.toLowerCase().trim();

  if (!needle) {
    viewEl.innerHTML = `
      <h1 class="page-title">Search</h1>
      <p class="note">Try a title, the original artist, a genre, a mood, or a key like "minor".</p>
      <div class="browse">
        ${BROWSE.map(b => `<a class="browse-card" href="#/browse/${b.key}" style="--c:${b.color}">${esc(b.label)}</a>`).join('')}
      </div>`;
    return;
  }

  const ids = ALL_IDS.filter(id => {
    const t = byId.get(id);
    const hay = [t.title, t.artist, t.original, t.genre, t.mood, feat(id)?.key].join(' ').toLowerCase();
    return needle.split(/\s+/).every(w => hay.includes(w));
  });
  registerCtx('search', `Search: ${q}`, ids, `#/search?q=${encodeURIComponent(q)}`);
  viewEl.innerHTML = `<h1 class="page-title">Results for “${esc(q)}”</h1>`
    + listHTML(ids, 'search', { empty: `No songs match “${esc(q)}”.` });
}

function renderSidebar() {
  const route = location.hash;
  const items = [
    { href: '#/liked', label: 'Liked Songs', sub: `${store.get('liked').length} songs`, cover: gradientCover('#450af5', '#8e8ee5', ICON.heart) },
    { href: '#/recent', label: 'Recently played', sub: 'History', cover: gradientCover('#0d7377', '#14ffec', '⟲') },
    ...store.get('playlists').map(p => ({
      href: `#/playlist/${p.id}`,
      label: p.name,
      sub: `Playlist · ${p.tracks.length}`,
      cover: p.tracks[0] ? `<img src="${byId.get(p.tracks[0])?.cover}" alt="" />` : gradientCover('#333', '#555', '♪'),
    })),
  ];
  $('#playlist-list').innerHTML = items.map(it => `
    <li><a class="pl-item ${route === it.href ? 'active' : ''}" href="${it.href}">
      <span class="pl-cover">${it.cover}</span>
      <span class="pl-text"><span class="pl-name">${esc(it.label)}</span><span class="pl-sub">${esc(it.sub)}</span></span>
    </a></li>`).join('');
}

// ---------------------------------------------------------------- routing

function route() {
  contexts = new Map(playingCtx ? [[playingCtx.key, playingCtx]] : []);
  const hash = location.hash.slice(1) || '/';
  const [path, qs] = hash.split('?');
  const parts = path.split('/').filter(Boolean);
  const nav = parts[0] || 'home';

  document.querySelectorAll('.nav-item').forEach(a =>
    a.classList.toggle('active', a.dataset.nav === nav || (nav === 'home' && a.dataset.nav === 'home')));

  switch (parts[0]) {
    case undefined: renderHome(); break;
    case 'search': renderSearch(new URLSearchParams(qs).get('q') || ''); break;
    case 'library': renderLibrary(); break;
    case 'liked': renderLiked(); break;
    case 'recent': renderRecent(); break;
    case 'playlist': renderPlaylist(parts[1]); break;
    case 'radio': renderRadio(parts[1]); break;
    case 'browse': renderBrowse(parts[1], decodeURIComponent(parts[2] || '')); break;
    default: location.hash = '#/';
  }
  if (!parts[0]) spectrum?.start();
  else cancelAnimationFrame(spectrum?.raf);

  renderSidebar();
  markPlaying();
  $('.main-content').scrollTop = 0;
}

// ---------------------------------------------------------------- playback

async function play(id, ctxKey = null, { autoplay = true, startAt = 0 } = {}) {
  const t = byId.get(id);
  if (!t) return;

  if (ctxKey && contexts.has(ctxKey)) {
    const ctx = contexts.get(ctxKey);
    playingCtx = { key: ctxKey, ...ctx };
    queue.setContext(ctx.ids, id);
  } else if (!queue.context.includes(id)) {
    playingCtx = { key: 'all', name: 'All tracks', ids: ALL_IDS, href: '#/library' };
    queue.setContext(ALL_IDS, id);
  } else {
    queue.jumpTo(id);
  }
  load(id, { autoplay, startAt });
}

function load(id, { autoplay = true, startAt = 0 } = {}) {
  const t = byId.get(id);
  audio.src = t.src;
  if (startAt) audio.addEventListener('loadedmetadata', () => (audio.currentTime = startAt), { once: true });

  if (autoplay) {
    spectrum?.attach().catch(() => {});
    audio.play().catch(err => {
      // NotAllowedError just means no user gesture yet, not worth a toast
      if (err.name !== 'NotAllowedError' && err.name !== 'AbortError') toast(`Couldn't play ${t.title}`);
    });
    store.pushRecent(id);
  }

  waveform.setPeaks(feat(id)?.waveform || null);
  waveform.setProgress(0);
  updateNowPlaying(t);
  store.set('last', { id, time: startAt });
}

function updateNowPlaying(t) {
  $('#player-cover').src = t.cover;
  $('#player-title').textContent = t.title;
  $('#player-title').href = `#/radio/${t.id}`;
  $('#player-artist').textContent = subtitle(t);
  $('#time-total').textContent = formatTime(t.duration);
  document.title = `${t.title} · ${t.artist}`;
  updateLikes();
  markPlaying();
  renderQueue();

  if (location.hash === '' || location.hash === '#/') {
    // re-render the hero + similar shelf for the new song, keep scroll position
    const top = $('.main-content').scrollTop;
    renderHome();
    $('.main-content').scrollTop = top;
  }

  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: t.title,
      artist: t.artist,
      album: t.original ? `Cover of ${t.original}` : 'Acoustic Covers',
      artwork: [{ src: new URL(t.cover, location.href).href, sizes: '512x512' }],
    });
  }
}

function next(auto = false) {
  const id = queue.next(auto);
  if (!id) {
    audio.pause();
    audio.currentTime = 0;
    return;
  }
  load(id);
}

function prev() {
  // same as every player: first press restarts the song
  if (audio.currentTime > 3 || !queue.history.length) {
    audio.currentTime = 0;
    return;
  }
  load(queue.prev());
}

function togglePlay() {
  if (!queue.current) {
    const last = store.get('last');
    return play(last?.id || ALL_IDS[0], null, { startAt: last?.time || 0 });
  }
  if (!audio.src) return load(queue.current);
  if (audio.paused) {
    spectrum?.attach().catch(() => {});
    audio.play().catch(() => {});
  } else {
    audio.pause();
  }
}

function seekBy(sec) {
  if (!audio.duration) return;
  audio.currentTime = clamp(audio.currentTime + sec, 0, audio.duration);
}

const SHUFFLE_MODES = ['off', 'random', 'smooth'];
function cycleShuffle() {
  let mode = SHUFFLE_MODES[(SHUFFLE_MODES.indexOf(queue.shuffle) + 1) % 3];
  if (mode === 'smooth' && !space) mode = 'off';
  setShuffle(mode, true);
}

function setShuffle(mode, announce = false) {
  queue.setShuffle(mode);
  store.set('shuffle', mode);
  const btn = $('#shuffle-btn');
  btn.classList.toggle('active', mode !== 'off');
  btn.dataset.mode = mode;
  btn.setAttribute('aria-label', `Shuffle: ${mode}`);
  btn.title = { off: 'Shuffle', random: 'Shuffle: random', smooth: 'Shuffle: smooth (by sound)' }[mode];
  $('#shuffle-label').textContent = mode === 'smooth' ? '~' : '';
  if (announce) {
    toast({ off: 'Shuffle off', random: 'Shuffle on', smooth: 'Smooth shuffle: songs ordered so each one flows into the next' }[mode]);
  }
  renderQueue();
}

function setRepeat(mode) {
  queue.repeat = mode;
  store.set('repeat', mode);
  const btn = $('#repeat-btn');
  btn.classList.toggle('active', mode !== 'off');
  btn.setAttribute('aria-label', `Repeat: ${mode}`);
  btn.title = `Repeat: ${mode}`;
  $('#repeat-label').textContent = mode === 'one' ? '1' : '';
  renderQueue();
}

function setVolume(v) {
  v = clamp(v, 0, 1);
  audio.volume = v;
  audio.muted = v === 0;
  $('#volume').value = Math.round(v * 100);
  $('#volume').style.setProperty('--fill', `${v * 100}%`);
  store.set('volume', v);
  updateVolumeIcon();
}

function updateVolumeIcon() {
  const muted = audio.muted || audio.volume === 0;
  $('#vol-path').setAttribute('d', muted
    ? 'M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z'
    : 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z');
  $('#mute-btn').setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
}

function toggleMute() {
  if (audio.volume === 0) return setVolume(0.5);
  audio.muted = !audio.muted;
  updateVolumeIcon();
}

function toggleLike(id) {
  if (!id) return;
  const nowLiked = store.toggleLike(id);
  toast(nowLiked ? 'Added to Liked Songs' : 'Removed from Liked Songs');
  updateLikes();
  renderSidebar();
  if (location.hash === '#/liked') renderLiked();
}

function updateLikes() {
  document.querySelectorAll('[data-action="like"]').forEach(b => {
    const liked = store.isLiked(b.dataset.id);
    b.classList.toggle('liked', liked);
    b.setAttribute('aria-pressed', liked);
  });
  const cur = queue.current;
  const liked = cur && store.isLiked(cur);
  $('#like-btn').classList.toggle('liked', !!liked);
  $('#like-btn').setAttribute('aria-pressed', !!liked);
}

function markPlaying() {
  const cur = queue.current;
  document.querySelectorAll('[data-id]').forEach(el => {
    if (el.classList.contains('row') || el.classList.contains('card')) {
      el.classList.toggle('playing', el.dataset.id === cur);
    }
  });
  document.body.classList.toggle('is-playing', !audio.paused);
}

function syncPlayButtons() {
  const playing = !audio.paused;
  document.body.classList.toggle('is-playing', playing);
  $('#play-btn').setAttribute('aria-label', playing ? 'Pause' : 'Play');
  const heroBtn = document.querySelector('.hero .btn-play');
  if (heroBtn && heroBtn.dataset.id === queue.current) {
    heroBtn.dataset.action = 'toggle';
    heroBtn.innerHTML = playing ? ICON.pause + ' Pause' : ICON.play + ' Play';
  }
  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = playing ? 'playing' : 'paused';
}

// ---------------------------------------------------------------- queue panel

function renderQueue() {
  const body = $('#queue-body');
  if ($('#queue-panel').hidden) return;
  const cur = queue.current ? byId.get(queue.current) : null;
  const { upNext, rest } = queue.upcoming(30);

  const item = (id, i = 0, removable = false, cls = '') => {
    const t = byId.get(id);
    return `
      <div class="q-item ${cls}" data-play="${id}" data-ctx="${playingCtx?.key || ''}">
        <img src="${t.cover}" alt="" loading="lazy" />
        <div class="q-main"><div class="q-title">${esc(t.title)}</div><div class="q-sub">${esc(t.original || 'Original')}</div></div>
        ${removable ? `<button class="icon-btn" data-action="unqueue" data-index="${i}" aria-label="Remove from queue">${ICON.close}</button>` : ''}
      </div>`;
  };

  body.innerHTML = `
    ${cur ? `<h3>Now playing</h3>${item(cur.id, 0, false, 'current')}` : '<p class="empty">Nothing playing.</p>'}
    ${upNext.length ? `<h3>Next in queue</h3>${upNext.map((id, i) => item(id, i, true)).join('')}` : ''}
    ${rest.length ? `<h3>Next from: ${esc(playingCtx?.name || 'All tracks')}
      ${queue.shuffle === 'smooth' && space ? `<span class="flow-cost" title="Sum of distances between consecutive songs. Lower = smoother.">flow ${space.pathCost([queue.current, ...rest]).toFixed(1)}</span>` : ''}</h3>
      ${rest.map(id => item(id)).join('')}` : ''}`;
}

function toggleQueue(force) {
  const panel = $('#queue-panel');
  const open = force ?? panel.hidden;
  panel.hidden = !open;
  $('#queue-btn').classList.toggle('active', open);
  $('#queue-btn').setAttribute('aria-expanded', open);
  if (open) renderQueue();
}

// ---------------------------------------------------------------- context menu

let menuFor = null;

function openMenu(btn) {
  const id = btn.dataset.id;
  const ctx = btn.dataset.ctx || '';
  const menu = $('#menu');
  const pls = store.get('playlists');
  const inPlaylist = ctx.startsWith('pl:') ? ctx.slice(3) : null;
  menuFor = id;

  menu.innerHTML = `
    <button role="menuitem" data-action="m-next">Play next</button>
    <button role="menuitem" data-action="m-queue">Add to queue</button>
    ${space ? `<a role="menuitem" href="#/radio/${id}">Go to song radio</a>` : ''}
    <hr />
    <div class="menu-label">Add to playlist</div>
    ${pls.map(p => `<button role="menuitem" data-action="m-add" data-pid="${p.id}">${esc(p.name)}</button>`).join('')}
    <button role="menuitem" data-action="m-add-new">+ New playlist</button>
    ${inPlaylist ? `<hr /><button role="menuitem" data-action="m-remove" data-pid="${inPlaylist}">Remove from this playlist</button>` : ''}`;

  menu.hidden = false;
  const r = btn.getBoundingClientRect();
  const mh = menu.offsetHeight;
  const mw = menu.offsetWidth;
  menu.style.top = `${Math.min(r.bottom + 4, window.innerHeight - mh - 100)}px`;
  menu.style.left = `${Math.max(8, r.right - mw)}px`;
  menu.querySelector('button')?.focus();
}

function closeMenu() {
  $('#menu').hidden = true;
  menuFor = null;
}

// ---------------------------------------------------------------- playlists

function showNewPlaylistForm(addAfter = null) {
  const form = $('#new-playlist-form');
  form.hidden = false;
  form.dataset.add = addAfter || '';
  form.name.value = '';
  form.name.placeholder = `My playlist #${store.get('playlists').length + 1}`;
  form.name.focus();
}

$('#new-playlist-form').addEventListener('submit', e => {
  e.preventDefault();
  const form = e.target;
  const p = store.createPlaylist(form.name.value || form.name.placeholder);
  if (form.dataset.add) store.addToPlaylist(p.id, form.dataset.add);
  form.hidden = true;
  renderSidebar();
  location.hash = `#/playlist/${p.id}`;
});
$('#new-playlist-form input').addEventListener('blur', e => {
  // let a click on another element go through before hiding
  setTimeout(() => (e.target.form.hidden = true), 150);
});

function deletePlaylist(pid) {
  const snapshot = structuredClone(store.playlist(pid));
  const idx = store.get('playlists').findIndex(p => p.id === pid);
  store.deletePlaylist(pid);
  location.hash = '#/library';
  renderSidebar();
  toast(`Deleted “${snapshot.name}”`, {
    label: 'Undo',
    run() {
      const list = store.get('playlists');
      list.splice(idx, 0, snapshot);
      store.set('playlists', list);
      renderSidebar();
      location.hash = `#/playlist/${pid}`;
    },
  });
}

// ---------------------------------------------------------------- events

document.addEventListener('click', e => {
  const menu = $('#menu');
  if (!menu.hidden && !menu.contains(e.target) && !e.target.closest('[data-action="menu"]')) closeMenu();

  const el = e.target.closest('[data-action], [data-play]');
  if (!el) return;
  const action = el.dataset.action;

  if (!action && el.dataset.play) {
    if (el.closest('.q-item')) {
      if (!el.classList.contains('current')) load(queue.jumpTo(el.dataset.play));
    }
    else if (queue.current === el.dataset.play && el.dataset.ctx === playingCtx?.key) togglePlay();
    else play(el.dataset.play, el.dataset.ctx);
    return;
  }

  switch (action) {
    case 'toggle': togglePlay(); break;
    case 'hero-play': play(el.dataset.id, null, { startAt: store.get('last')?.id === el.dataset.id ? store.get('last').time : 0 }); break;
    case 'next': next(); break;
    case 'prev': prev(); break;
    case 'shuffle': cycleShuffle(); break;
    case 'repeat': setRepeat(queue.cycleRepeat()); break;
    case 'mute': toggleMute(); break;
    case 'queue': toggleQueue(); break;
    case 'like': e.stopPropagation(); toggleLike(el.dataset.id); break;
    case 'like-current': toggleLike(queue.current); break;
    case 'back': history.back(); break;
    case 'forward': history.forward(); break;
    case 'new-playlist': showNewPlaylistForm(); break;
    case 'delete-playlist': deletePlaylist(el.dataset.pid); break;
    case 'shortcuts': $('#shortcuts').showModal(); break;
    case 'unqueue': e.stopPropagation(); queue.removeFromUpNext(+el.dataset.index); renderQueue(); break;
    case 'menu':
      e.stopPropagation();
      if (menuFor === el.dataset.id && !menu.hidden) closeMenu();
      else openMenu(el);
      break;
    case 'shuffle-play': {
      const ctx = contexts.get(el.dataset.ctx);
      if (!ctx?.ids.length) break;
      setShuffle(space ? 'smooth' : 'random');
      const start = ctx.ids[Math.floor(Math.random() * ctx.ids.length)];
      play(start, el.dataset.ctx);
      break;
    }
    case 'm-next': queue.playNext(menuFor); toast('Playing next'); renderQueue(); closeMenu(); break;
    case 'm-queue': queue.addToQueue(menuFor); toast('Added to queue'); renderQueue(); closeMenu(); break;
    case 'm-add': {
      const ok = store.addToPlaylist(el.dataset.pid, menuFor);
      toast(ok ? `Added to ${store.playlist(el.dataset.pid).name}` : 'Already in that playlist');
      renderSidebar();
      closeMenu();
      break;
    }
    case 'm-add-new': { const id = menuFor; closeMenu(); showNewPlaylistForm(id); break; }
    case 'm-remove':
      store.removeFromPlaylist(el.dataset.pid, menuFor);
      closeMenu();
      renderPlaylist(el.dataset.pid);
      renderSidebar();
      break;
  }
});

// rows are focusable, so Enter should play them
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.classList?.contains('row')) e.target.click();
});

let searchTimer;
$('#search-input').addEventListener('input', e => {
  clearTimeout(searchTimer);
  const q = e.target.value;
  searchTimer = setTimeout(() => {
    const target = `#/search${q ? '?q=' + encodeURIComponent(q) : ''}`;
    // replace instead of push so typing doesn't fill up the back button
    if (location.hash.startsWith('#/search')) history.replaceState(null, '', target);
    else history.pushState(null, '', target);
    route();
  }, 120);
});

$('#volume').addEventListener('input', e => setVolume(e.target.value / 100));

audio.addEventListener('timeupdate', () => {
  const d = audio.duration || byId.get(queue.current)?.duration || 0;
  if (!d) return;
  const p = audio.currentTime / d;
  waveform.setProgress(p);
  $('#time-current').textContent = formatTime(audio.currentTime);
  $('#waveform').setAttribute('aria-valuenow', Math.round(p * 100));
  // remember position, but don't hammer localStorage on every tick
  if (Math.floor(audio.currentTime) % 5 === 0) store.set('last', { id: queue.current, time: audio.currentTime });
});
audio.addEventListener('loadedmetadata', () => ($('#time-total').textContent = formatTime(audio.duration)));
audio.addEventListener('ended', () => next(true));
audio.addEventListener('play', () => { syncPlayButtons(); markPlaying(); });
audio.addEventListener('pause', () => { syncPlayButtons(); markPlaying(); });
audio.addEventListener('error', () => {
  if (audio.src) toast(`Couldn't load ${byId.get(queue.current)?.title || 'track'}`);
});

const KEYS = {
  Space: () => togglePlay(),
  ArrowRight: e => (e.shiftKey ? next() : seekBy(5)),
  ArrowLeft: e => (e.shiftKey ? prev() : seekBy(-5)),
  ArrowUp: () => setVolume(audio.volume + 0.05),
  ArrowDown: () => setVolume(audio.volume - 0.05),
  KeyS: () => cycleShuffle(),
  KeyR: () => setRepeat(queue.cycleRepeat()),
  KeyM: () => toggleMute(),
  KeyL: () => toggleLike(queue.current),
  KeyQ: () => toggleQueue(),
  Slash: () => $('#search-input').focus(),
};

document.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA' || e.target.isContentEditable) {
    if (e.key === 'Escape') e.target.blur();
    return;
  }
  if ($('#shortcuts').open) return;
  if (e.key === 'Escape') { closeMenu(); toggleQueue(false); return; }
  if (e.key === '?') { $('#shortcuts').showModal(); return; }
  // let Space/Enter activate whatever button has focus
  if (e.code === 'Space' && (tag === 'BUTTON' || tag === 'A')) return;

  const digit = e.code.match(/^Digit(\d)$/);
  if (digit) {
    const n = digit[1] === '0' ? 10 : +digit[1];
    if (TRACKS[n - 1]) play(TRACKS[n - 1].id, 'all');
    return;
  }
  const fn = KEYS[e.code];
  if (fn) {
    e.preventDefault();
    fn(e);
  }
});

if ('mediaSession' in navigator) {
  const ms = navigator.mediaSession;
  ms.setActionHandler('play', () => togglePlay());
  ms.setActionHandler('pause', () => audio.pause());
  ms.setActionHandler('previoustrack', () => prev());
  ms.setActionHandler('nexttrack', () => next());
  try {
    ms.setActionHandler('seekto', d => (audio.currentTime = d.seekTime));
  } catch { /* older browsers */ }
}

window.addEventListener('hashchange', route);
window.addEventListener('resize', closeMenu);

// ---------------------------------------------------------------- tint

function tintFromCover(img) {
  if (!img) return;
  const apply = () => {
    const [r, g, b] = dominantColor(img);
    document.documentElement.style.setProperty('--tint', `rgb(${r} ${g} ${b})`);
    // keep the spectrum readable: brighten dark colours a bit
    const boost = Math.max(1, 160 / Math.max(r, g, b, 1));
    spectrum?.setAccent([r, g, b].map(c => Math.min(255, Math.round(c * boost))));
  };
  if (img.complete && img.naturalWidth) apply();
  else img.addEventListener('load', apply, { once: true });
}

// ---------------------------------------------------------------- init

async function loadFeatures() {
  try {
    const res = await fetch('data/features.json');
    if (!res.ok) throw new Error(res.status);
    const json = await res.json();
    features = json.tracks;
    space = new TrackSpace(features);
    queue.space = space;
  } catch (err) {
    console.warn('features.json not loaded, recommendations disabled', err);
  }
}

async function init() {
  waveform = new WaveformSeek($('#waveform'), {
    onSeek: p => {
      const d = audio.duration || byId.get(queue.current)?.duration;
      if (d && audio.src) audio.currentTime = p * d;
    },
  });

  await loadFeatures();

  setVolume(store.get('volume'));
  const savedShuffle = store.get('shuffle');
  setShuffle(savedShuffle === 'smooth' && !space ? 'random' : savedShuffle);
  setRepeat(store.get('repeat'));

  // restore the last song without autoplaying (browsers block that anyway)
  const last = store.get('last');
  if (last && byId.has(last.id)) {
    playingCtx = { key: 'all', name: 'All tracks', ids: ALL_IDS, href: '#/library' };
    queue.setContext(ALL_IDS, last.id);
    load(last.id, { autoplay: false, startAt: last.time });
    $('#time-current').textContent = formatTime(last.time);
    waveform.setProgress(last.time / byId.get(last.id).duration);
  }

  route();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(err => console.warn('sw registration failed', err));
  }
}

init();
