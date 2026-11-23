// Everything that survives a reload lives here. localStorage can throw
// (Safari private mode, storage full) so every access is guarded.

const KEY = 'am:v2';

const defaults = () => ({
  liked: [],
  recent: [],
  playlists: [],
  volume: 0.8,
  shuffle: 'off',
  repeat: 'off',
  last: null, // { id, time }
});

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...defaults(), ...JSON.parse(raw) };

    // v1 stored liked/recent as numeric ids / array indexes
    const oldLiked = JSON.parse(localStorage.getItem('liked') || '[]');
    const oldRecent = JSON.parse(localStorage.getItem('recent') || '[]');
    const pad = n => String(n).padStart(2, '0');
    return {
      ...defaults(),
      liked: oldLiked.map(pad),
      recent: oldRecent.map(i => pad(i + 1)),
    };
  } catch {
    return defaults();
  }
}

const state = load();
let saveTimer = null;

function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* not much we can do */
    }
  }, 150);
}

export const store = {
  get: k => state[k],
  set(k, v) {
    state[k] = v;
    save();
  },

  isLiked: id => state.liked.includes(id),
  toggleLike(id) {
    const i = state.liked.indexOf(id);
    if (i >= 0) state.liked.splice(i, 1);
    else state.liked.unshift(id);
    save();
    return i < 0;
  },

  pushRecent(id) {
    state.recent = [id, ...state.recent.filter(x => x !== id)].slice(0, 30);
    save();
  },

  playlist: pid => state.playlists.find(p => p.id === pid),

  createPlaylist(name) {
    const p = { id: Date.now().toString(36), name: name.trim().slice(0, 60) || 'My playlist', tracks: [] };
    state.playlists.push(p);
    save();
    return p;
  },
  renamePlaylist(pid, name) {
    const p = store.playlist(pid);
    if (p && name.trim()) {
      p.name = name.trim().slice(0, 60);
      save();
    }
  },
  deletePlaylist(pid) {
    state.playlists = state.playlists.filter(p => p.id !== pid);
    save();
  },
  addToPlaylist(pid, id) {
    const p = store.playlist(pid);
    if (!p || p.tracks.includes(id)) return false;
    p.tracks.push(id);
    save();
    return true;
  },
  removeFromPlaylist(pid, id) {
    const p = store.playlist(pid);
    if (!p) return;
    p.tracks = p.tracks.filter(x => x !== id);
    save();
  },
};
