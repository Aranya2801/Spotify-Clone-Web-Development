/* ============================================
   SPOTIFY CLONE — ADVANCED JS ENGINE
   Aranya2801 | 2025
   ============================================ */

'use strict';

// ══════════════════════════════════════
// DATA — Song Library
// ══════════════════════════════════════
const SONGS = [
  {
    id: 1,
    title: "I Took a Pill in Ibiza (Cover)",
    originalArtist: "Mike Posner",
    artist: "Ishaan Kaushik",
    duration: "3:46",
    durationSec: 226,
    src: "1.mp3",
    emoji: "🎵",
    colors: ["#1a3a2a","#0d1f15"],
    genre: "Acoustic",
    mood: "Chill"
  },
  {
    id: 2,
    title: "Ghar (Cover)",
    originalArtist: "Jasleen Royal",
    artist: "Ishaan Kaushik",
    duration: "3:47",
    durationSec: 227,
    src: "2.mp3",
    emoji: "🏡",
    colors: ["#2a1a3a","#150d1f"],
    genre: "Bollywood",
    mood: "Nostalgic"
  },
  {
    id: 3,
    title: "Kahi To Hogi Woh (Cover)",
    originalArtist: "Bollywood",
    artist: "Ishaan Kaushik",
    duration: "3:40",
    durationSec: 220,
    src: "3.mp3",
    emoji: "✨",
    colors: ["#3a2a1a","#1f150d"],
    genre: "Bollywood",
    mood: "Romantic"
  },
  {
    id: 4,
    title: "Kasoor (Cover)",
    originalArtist: "Prateek Kuhad",
    artist: "Ishaan Kaushik",
    duration: "2:43",
    durationSec: 163,
    src: "4.mp3",
    emoji: "💙",
    colors: ["#1a2a3a","#0d151f"],
    genre: "Indie",
    mood: "Melancholic"
  },
  {
    id: 5,
    title: "Tu Hai Kahan",
    originalArtist: "Original",
    artist: "Ishaan Kaushik",
    duration: "2:59",
    durationSec: 179,
    src: "5.mp3",
    emoji: "🌙",
    colors: ["#0d2e14","#061508"],
    genre: "Indie",
    mood: "Longing"
  },
  {
    id: 6,
    title: "Baarishein (Cover)",
    originalArtist: "Anuv Jain",
    artist: "Ishaan Kaushik",
    duration: "3:15",
    durationSec: 195,
    src: "6.mp3",
    emoji: "🌧️",
    colors: ["#1a1a3a","#0d0d1f"],
    genre: "Indie",
    mood: "Rainy"
  },
  {
    id: 7,
    title: "Waqt Ki Baatein (Cover)",
    originalArtist: "Bollywood",
    artist: "Ishaan Kaushik",
    duration: "2:57",
    durationSec: 177,
    src: "7.mp3",
    emoji: "⏳",
    colors: ["#2a1a1a","#1f0d0d"],
    genre: "Bollywood",
    mood: "Reflective"
  },
  {
    id: 8,
    title: "Lovely ft. Anika Vidyarthi (Cover)",
    originalArtist: "Billie Eilish",
    artist: "Ishaan Kaushik",
    duration: "2:53",
    durationSec: 173,
    src: "8.mp3",
    emoji: "🌸",
    colors: ["#2a1a2a","#1f0d1f"],
    genre: "Pop",
    mood: "Soft"
  },
  {
    id: 9,
    title: "Let Me Down Slowly (Cover)",
    originalArtist: "Alec Benjamin",
    artist: "Ishaan Kaushik",
    duration: "2:55",
    durationSec: 175,
    src: "9.mp3",
    emoji: "🕊️",
    colors: ["#1a2a2a","#0d1f1f"],
    genre: "Pop",
    mood: "Gentle"
  },
  {
    id: 10,
    title: "Jee Le Zara (Cover)",
    originalArtist: "Bollywood",
    artist: "Ishaan Kaushik",
    duration: "2:56",
    durationSec: 176,
    src: "10.mp3",
    emoji: "🎶",
    colors: ["#1a3a1a","#0d1f0d"],
    genre: "Bollywood",
    mood: "Uplifting"
  }
];

// ══════════════════════════════════════
// STATE
// ══════════════════════════════════════
let currentSong   = -1;       // index in SONGS
let isPlaying     = false;
let isShuffle     = false;
let repeatMode    = 0;         // 0=off 1=all 2=one
let isMuted       = false;
let prevVolume    = 80;
let likedSongs    = new Set(JSON.parse(localStorage.getItem('liked') || '[]'));
let recentSongs   = JSON.parse(localStorage.getItem('recent') || '[]');
let displayedSongs = [...SONGS]; // filtered/sorted view

const audio = document.getElementById('audio-player');

// ══════════════════════════════════════
// INIT
// ══════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  renderSongGrid();
  renderSongList();
  renderQueue();
  spawnParticles();
  setupVisualizer();
  updateLikeButtons();

  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboard);

  // Volume
  setVolume(80);
});

// ══════════════════════════════════════
// RENDER — Song Grid (Home)
// ══════════════════════════════════════
function renderSongGrid() {
  const grid = document.getElementById('song-grid');
  grid.innerHTML = SONGS.map((song, i) => `
    <div class="song-card" id="card-${i}" onclick="playSong(${i})" title="${song.title}">
      <div class="song-card-art">
        <div class="song-card-art-inner" style="--c1:${song.colors[0]};--c2:${song.colors[1]}">
          ${song.emoji}
        </div>
        <div class="play-overlay">
          <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </div>
      </div>
      <div class="song-card-title">${song.title}</div>
      <div class="song-card-meta">${song.artist} · ${song.duration}</div>
    </div>
  `).join('');
}

// ══════════════════════════════════════
// RENDER — Full Song List (Library)
// ══════════════════════════════════════
function renderSongList(songs = SONGS) {
  const list = document.getElementById('song-list-full');
  list.innerHTML = songs.map((song, i) => {
    const globalIdx = SONGS.indexOf(song);
    const isLiked = likedSongs.has(song.id);
    const isCurrent = globalIdx === currentSong;
    return `
      <div class="song-row ${isCurrent ? 'playing' : ''}" id="row-${globalIdx}" onclick="playSong(${globalIdx})">
        <div class="song-num">
          ${isCurrent && isPlaying
            ? `<div class="eq-bars"><div class="eq-bar"></div><div class="eq-bar"></div><div class="eq-bar"></div></div>`
            : i + 1}
        </div>
        <div class="song-row-art" style="--c1:${song.colors[0]};--c2:${song.colors[1]}">${song.emoji}</div>
        <div class="song-row-info">
          <div class="song-row-title">${song.title}</div>
          <div class="song-row-artist">${song.artist}</div>
        </div>
        <button class="song-row-like ${isLiked ? 'liked' : ''}" onclick="event.stopPropagation(); toggleLike(${globalIdx})">
          <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
        </button>
        <div class="song-row-duration">${song.duration}</div>
        <button class="song-row-more" onclick="event.stopPropagation()">
          <svg viewBox="0 0 24 24"><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
        </button>
      </div>
    `;
  }).join('');
}

// ══════════════════════════════════════
// RENDER — Queue
// ══════════════════════════════════════
function renderQueue() {
  const list = document.getElementById('queue-list');
  list.innerHTML = SONGS.map((song, i) => `
    <div class="queue-item ${i === currentSong ? 'current' : ''}" onclick="playSong(${i}); closeQueue();">
      <div class="queue-item-art">${song.emoji}</div>
      <div class="queue-item-info">
        <div class="queue-item-title">${song.title}</div>
        <div class="queue-item-artist">${song.artist} · ${song.duration}</div>
      </div>
    </div>
  `).join('');
}

// ══════════════════════════════════════
// PLAY LOGIC
// ══════════════════════════════════════
function playSong(index) {
  if (index < 0 || index >= SONGS.length) return;

  currentSong = index;
  const song = SONGS[index];

  audio.src = song.src;
  audio.load();
  audio.play().catch(() => showToast('⚠️ Audio file not found — add .mp3 files to play'));

  isPlaying = true;
  updatePlayerUI(song);
  updateAllHighlights();
  addToRecent(index);
  renderQueue();
}

function togglePlay() {
  if (currentSong === -1) { playSong(0); return; }
  if (isPlaying) {
    audio.pause();
    isPlaying = false;
  } else {
    audio.play();
    isPlaying = true;
  }
  updatePlayButtons();
}

function nextSong() {
  if (SONGS.length === 0) return;
  if (isShuffle) {
    let next;
    do { next = Math.floor(Math.random() * SONGS.length); } while (next === currentSong && SONGS.length > 1);
    playSong(next);
  } else {
    playSong((currentSong + 1) % SONGS.length);
  }
}

function prevSong() {
  if (audio.currentTime > 3) {
    audio.currentTime = 0; return;
  }
  if (currentSong === -1) return;
  playSong((currentSong - 1 + SONGS.length) % SONGS.length);
}

// ══════════════════════════════════════
// CONTROLS
// ══════════════════════════════════════
function toggleShuffle() {
  isShuffle = !isShuffle;
  document.getElementById('shuffle-btn').classList.toggle('active', isShuffle);
  showToast(isShuffle ? '🔀 Shuffle on' : '🔀 Shuffle off');
}

function toggleRepeat() {
  repeatMode = (repeatMode + 1) % 3;
  const btn = document.getElementById('repeat-btn');
  btn.classList.toggle('active', repeatMode > 0);
  const msgs = ['🔁 Repeat off', '🔁 Repeat all', '🔂 Repeat one'];
  showToast(msgs[repeatMode]);
}

function toggleMute() {
  isMuted = !isMuted;
  audio.muted = isMuted;
  const volIcon = document.getElementById('vol-icon');
  if (isMuted) {
    volIcon.innerHTML = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
  } else {
    volIcon.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
  }
}

function setVolume(val) {
  const pct = parseInt(val);
  audio.volume = pct / 100;
  prevVolume = pct;
  document.getElementById('vol-pct').textContent = pct + '%';
  document.getElementById('volume-slider').style.setProperty('--vol', pct + '%');
}

function seekSong(e) {
  if (!audio.duration) return;
  const track = document.getElementById('progress-track');
  const rect = track.getBoundingClientRect();
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  audio.currentTime = pct * audio.duration;
}

// ══════════════════════════════════════
// LIKE SYSTEM
// ══════════════════════════════════════
function toggleLike(idx) {
  if (idx < 0 || idx >= SONGS.length) return;
  const song = SONGS[idx];
  if (likedSongs.has(song.id)) {
    likedSongs.delete(song.id);
    showToast('💔 Removed from Liked Songs');
  } else {
    likedSongs.add(song.id);
    showToast('💚 Added to Liked Songs');
  }
  localStorage.setItem('liked', JSON.stringify([...likedSongs]));
  updateLikeButtons();
  renderSongList();
}

function updateLikeButtons() {
  const liked = currentSong >= 0 && likedSongs.has(SONGS[currentSong].id);
  document.getElementById('like-btn').classList.toggle('liked', liked);
  document.getElementById('hero-like-btn').classList.toggle('liked', liked);
}

// ══════════════════════════════════════
// RECENT SONGS
// ══════════════════════════════════════
function addToRecent(idx) {
  recentSongs = recentSongs.filter(i => i !== idx);
  recentSongs.unshift(idx);
  recentSongs = recentSongs.slice(0, 20);
  localStorage.setItem('recent', JSON.stringify(recentSongs));
}

// ══════════════════════════════════════
// SORT & FILTER
// ══════════════════════════════════════
function filterSongs(query) {
  const q = query.toLowerCase().trim();
  const results = SONGS.filter(s =>
    s.title.toLowerCase().includes(q) ||
    s.artist.toLowerCase().includes(q) ||
    s.genre.toLowerCase().includes(q) ||
    s.mood.toLowerCase().includes(q) ||
    (s.originalArtist && s.originalArtist.toLowerCase().includes(q))
  );

  // Switch to search view
  showView('search');

  const container = document.getElementById('search-results');
  if (!q) {
    container.innerHTML = '<p class="search-hint">Start typing to search songs...</p>';
    return;
  }
  if (results.length === 0) {
    container.innerHTML = '<p class="search-hint">No songs found. Try a different search.</p>';
    return;
  }

  container.innerHTML = results.map(song => {
    const idx = SONGS.indexOf(song);
    return `
      <div class="song-row" onclick="playSong(${idx})">
        <div class="song-num">${idx + 1}</div>
        <div class="song-row-art" style="--c1:${song.colors[0]};--c2:${song.colors[1]}">${song.emoji}</div>
        <div class="song-row-info">
          <div class="song-row-title">${song.title}</div>
          <div class="song-row-artist">${song.artist} · ${song.genre}</div>
        </div>
        <div class="song-row-duration">${song.duration}</div>
      </div>
    `;
  }).join('');
}

function sortSongs(by) {
  let sorted = [...SONGS];
  if (by === 'title') sorted.sort((a, b) => a.title.localeCompare(b.title));
  else if (by === 'duration') sorted.sort((a, b) => a.durationSec - b.durationSec);
  renderSongList(sorted);
}

// ══════════════════════════════════════
// PLAYLIST LOAD (stub — expandable)
// ══════════════════════════════════════
function loadPlaylist(type) {
  document.querySelectorAll('.playlist-item').forEach(el => el.classList.remove('active'));
  event.target.classList.add('active');
  showView('library');

  if (type === 'liked') {
    const liked = SONGS.filter(s => likedSongs.has(s.id));
    renderSongList(liked.length ? liked : []);
    if (!liked.length) showToast('❤️ No liked songs yet! Heart some tracks.');
  } else if (type === 'recent') {
    const recent = recentSongs.map(i => SONGS[i]).filter(Boolean);
    renderSongList(recent.length ? recent : SONGS);
  } else {
    renderSongList(SONGS);
  }
}

function createPlaylist() {
  showToast('✨ Playlist feature coming soon!');
}

// ══════════════════════════════════════
// UI UPDATE
// ══════════════════════════════════════
function updatePlayerUI(song) {
  document.getElementById('player-title').textContent  = song.title;
  document.getElementById('player-artist').textContent = song.artist;
  document.getElementById('hero-title').textContent    = song.title;
  document.getElementById('hero-artist').textContent   = song.artist;

  // Disc animation
  document.getElementById('thumb-disc').classList.add('playing');
  document.getElementById('hero-disc').classList.remove('paused');

  updatePlayButtons();
  updateLikeButtons();

  // Update hero background color
  document.querySelector('.hero-bg').style.background =
    `linear-gradient(135deg, ${song.colors[0]} 0%, #061508 100%)`;
}

function updatePlayButtons() {
  const playIcon  = document.getElementById('play-icon');
  const pauseIcon = document.getElementById('pause-icon');
  const heroBtn   = document.getElementById('hero-play-btn');
  const disc      = document.getElementById('thumb-disc');
  const heroDisc  = document.getElementById('hero-disc');

  if (isPlaying) {
    playIcon.style.display  = 'none';
    pauseIcon.style.display = '';
    heroBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> Pause';
    disc.classList.add('playing');
    heroDisc.classList.remove('paused');
  } else {
    playIcon.style.display  = '';
    pauseIcon.style.display = 'none';
    heroBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Play';
    disc.classList.remove('playing');
    heroDisc.classList.add('paused');
  }
}

function updateAllHighlights() {
  // Grid cards
  document.querySelectorAll('.song-card').forEach((card, i) => {
    card.classList.toggle('playing', i === currentSong);
  });
  // List rows
  renderSongList();
  renderQueue();
}

// ══════════════════════════════════════
// PROGRESS UPDATE
// ══════════════════════════════════════
audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-thumb').style.left = pct + '%';
  document.getElementById('time-current').textContent  = formatTime(audio.currentTime);
  document.getElementById('time-total').textContent    = formatTime(audio.duration);
});

audio.addEventListener('ended', () => {
  if (repeatMode === 2) {
    audio.currentTime = 0; audio.play();
  } else {
    nextSong();
  }
});

audio.addEventListener('play',  () => { isPlaying = true;  updatePlayButtons(); });
audio.addEventListener('pause', () => { isPlaying = false; updatePlayButtons(); });

function formatTime(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ══════════════════════════════════════
// AUDIO VISUALIZER (Canvas)
// ══════════════════════════════════════
let analyser, dataArray, animFrame;
let audioCtx;

function setupVisualizer() {
  const canvas = document.getElementById('visualizer');
  const ctx    = canvas.getContext('2d');

  function drawIdle() {
    canvas.width = canvas.offsetWidth;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const bars = 80;
    const barW = canvas.width / bars - 1;
    for (let i = 0; i < bars; i++) {
      const h = 4 + Math.sin(Date.now() / 1000 + i * 0.3) * 8;
      ctx.fillStyle = `rgba(29,185,84,${0.15 + Math.sin(i * 0.2) * 0.05})`;
      ctx.fillRect(i * (barW + 1), canvas.height / 2 - h / 2, barW, h);
    }
    animFrame = requestAnimationFrame(drawIdle);
  }

  drawIdle();

  audio.addEventListener('play', () => {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      analyser.fftSize = 256;
      dataArray = new Uint8Array(analyser.frequencyBinCount);
    }
    cancelAnimationFrame(animFrame);
    drawVisualizer(canvas, ctx);
  });

  audio.addEventListener('pause', () => {
    cancelAnimationFrame(animFrame);
    drawIdle();
  });
}

function drawVisualizer(canvas, ctx) {
  canvas.width = canvas.offsetWidth;
  analyser.getByteFrequencyData(dataArray);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const bars = dataArray.length;
  const barW = canvas.width / bars - 1;

  for (let i = 0; i < bars; i++) {
    const val = dataArray[i] / 255;
    const h   = Math.max(4, val * canvas.height);
    const alpha = 0.4 + val * 0.6;
    const green = Math.floor(185 * val + 80);
    ctx.fillStyle = `rgba(29,${green},84,${alpha})`;
    ctx.beginPath();
    ctx.roundRect?.(
      i * (barW + 1), canvas.height / 2 - h / 2, barW, h, [2]
    ) || ctx.rect(i * (barW + 1), canvas.height / 2 - h / 2, barW, h);
    ctx.fill();
  }

  animFrame = requestAnimationFrame(() => drawVisualizer(canvas, ctx));
}

// ══════════════════════════════════════
// PARTICLES
// ══════════════════════════════════════
function spawnParticles() {
  const container = document.getElementById('particles');
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = 4 + Math.random() * 12;
    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${Math.random() * 100}%;
      bottom: -${size}px;
      animation-duration: ${6 + Math.random() * 8}s;
      animation-delay: ${Math.random() * 8}s;
    `;
    container.appendChild(p);
  }
}

// ══════════════════════════════════════
// VIEWS
// ══════════════════════════════════════
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${name}`)?.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.view === name);
  });
}

// ══════════════════════════════════════
// QUEUE
// ══════════════════════════════════════
function openQueue()  { document.getElementById('queue-panel').classList.add('open'); }
function closeQueue() { document.getElementById('queue-panel').classList.remove('open'); }

// ══════════════════════════════════════
// TOAST
// ══════════════════════════════════════
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

// ══════════════════════════════════════
// KEYBOARD SHORTCUTS
// ══════════════════════════════════════
function handleKeyboard(e) {
  const tag = document.activeElement.tagName;
  if (tag === 'INPUT') return;

  switch (e.code) {
    case 'Space':       e.preventDefault(); togglePlay(); break;
    case 'ArrowRight':
      if (e.shiftKey) nextSong();
      else if (audio.duration) audio.currentTime = Math.min(audio.currentTime + 5, audio.duration);
      break;
    case 'ArrowLeft':
      if (e.shiftKey) prevSong();
      else if (audio.duration) audio.currentTime = Math.max(audio.currentTime - 5, 0);
      break;
    case 'ArrowUp': {
      const slider = document.getElementById('volume-slider');
      const newVal = Math.min(100, parseInt(slider.value) + 5);
      slider.value = newVal; setVolume(newVal); break;
    }
    case 'ArrowDown': {
      const slider = document.getElementById('volume-slider');
      const newVal = Math.max(0, parseInt(slider.value) - 5);
      slider.value = newVal; setVolume(newVal); break;
    }
    case 'KeyS': toggleShuffle(); break;
    case 'KeyR': toggleRepeat();  break;
    case 'KeyM': toggleMute();    break;
    case 'KeyL': if (currentSong >= 0) toggleLike(currentSong); break;
    case 'Digit1': case 'Digit2': case 'Digit3': case 'Digit4': case 'Digit5':
    case 'Digit6': case 'Digit7': case 'Digit8': case 'Digit9':
      playSong(parseInt(e.code.replace('Digit', '')) - 1);
      break;
    case 'Digit0': playSong(9); break;
  }
}

// ══════════════════════════════════════
// PROGRESS BAR DRAG
// ══════════════════════════════════════
let isDragging = false;
const progressTrack = document.getElementById('progress-track');

progressTrack.addEventListener('mousedown', (e) => {
  isDragging = true;
  seekSong(e);
});

document.addEventListener('mousemove', (e) => {
  if (isDragging) seekSong(e);
});

document.addEventListener('mouseup', () => { isDragging = false; });

// ══════════════════════════════════════
// RESIZE: keep canvas width synced
// ══════════════════════════════════════
window.addEventListener('resize', () => {
  const canvas = document.getElementById('visualizer');
  canvas.width = canvas.offsetWidth;
});
