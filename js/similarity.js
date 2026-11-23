// Content-based similarity between tracks, using the features computed by
// tools/extract_features.py. No listening history needed, so it works
// from the very first play.
//
// Each track becomes a vector split into four groups (rhythm, harmony,
// dynamics, timbre). Every feature is z-scored across the library and each
// group is averaged, so the 12 MFCCs don't drown out the single tempo value.

const PITCHES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// position on the circle of fifths. minor keys are mapped to their relative
// major (A minor -> C) which is roughly what DJs do with the Camelot wheel
export function fifthsPosition(key) {
  if (!key) return 0;
  const [note, mode] = key.split(' ');
  let pc = PITCHES.indexOf(note);
  if (pc < 0) return 0;
  if (mode === 'minor') pc = (pc + 3) % 12;
  return (pc * 7) % 12;
}

// beat trackers often lock onto half or double time, so fold everything
// into a single octave before comparing
export function foldTempo(bpm, lo = 70) {
  if (!(bpm > 0)) return lo;
  let t = bpm;
  while (t >= lo * 2) t /= 2;
  while (t < lo) t *= 2;
  return t;
}

const GROUPS = {
  rhythm: { weight: 1.0, label: 'tempo & groove' },
  harmony: { weight: 0.6, label: 'key' },
  dynamics: { weight: 1.0, label: 'energy' },
  timbre: { weight: 0.8, label: 'sound & texture' },
};

function rawFeatures(f) {
  const angle = (fifthsPosition(f.key) / 12) * 2 * Math.PI;
  return {
    rhythm: [Math.log2(foldTempo(f.tempo)), f.onsetRate, f.beatRegularity],
    harmony: [Math.cos(angle), Math.sin(angle)],
    dynamics: [f.energy, f.energyStd],
    // mfcc[0] is basically loudness, which dynamics already covers
    timbre: [f.brightness, f.rolloff, f.zcr, ...f.mfcc.slice(1)],
  };
}

function zscore(rows) {
  const n = rows.length;
  const dims = rows[0].length;
  const mean = Array(dims).fill(0);
  const std = Array(dims).fill(0);
  for (const r of rows) r.forEach((v, i) => (mean[i] += v / n));
  for (const r of rows) r.forEach((v, i) => (std[i] += (v - mean[i]) ** 2 / n));
  for (let i = 0; i < dims; i++) std[i] = Math.sqrt(std[i]) || 1;
  return rows.map(r => r.map((v, i) => (v - mean[i]) / std[i]));
}

export class TrackSpace {
  constructor(features) {
    this.ids = Object.keys(features).sort();
    this.raw = features;
    this.vec = {};
    this.ids.forEach(id => (this.vec[id] = {}));

    // harmony is already on the unit circle, so don't rescale it
    for (const g of Object.keys(GROUPS)) {
      const rows = this.ids.map(id => rawFeatures(features[id])[g]);
      const norm = g === 'harmony' ? rows : zscore(rows);
      this.ids.forEach((id, i) => (this.vec[id][g] = norm[i]));
    }

    this._cache = new Map();

    // median pairwise distance, used to turn distances into a % that means
    // something: 50% = about as alike as a typical pair in this library
    const all = [];
    for (let i = 0; i < this.ids.length; i++)
      for (let j = i + 1; j < this.ids.length; j++) all.push(this.distance(this.ids[i], this.ids[j]));
    all.sort((a, b) => a - b);
    this.medianDist = all.length ? all[Math.floor(all.length / 2)] : 1;
  }

  groupDistances(a, b) {
    const out = {};
    for (const g of Object.keys(GROUPS)) {
      const va = this.vec[a][g];
      const vb = this.vec[b][g];
      let s = 0;
      for (let i = 0; i < va.length; i++) s += (va[i] - vb[i]) ** 2;
      out[g] = Math.sqrt(s / va.length);
    }
    return out;
  }

  distance(a, b) {
    if (a === b) return 0;
    const key = a < b ? a + b : b + a;
    if (this._cache.has(key)) return this._cache.get(key);
    const gd = this.groupDistances(a, b);
    let total = 0;
    let wsum = 0;
    for (const [g, { weight }] of Object.entries(GROUPS)) {
      total += weight * gd[g] ** 2;
      wsum += weight;
    }
    const d = Math.sqrt(total / wsum);
    this._cache.set(key, d);
    return d;
  }

  // 0..1, mostly for display
  similarity(a, b) {
    const r = this.distance(a, b) / this.medianDist;
    return 2 ** -(r * r);
  }

  similar(id, k = 4) {
    return this.ids
      .filter(other => other !== id)
      .map(other => ({ id: other, score: this.similarity(id, other) }))
      .sort((x, y) => y.score - x.score)
      .slice(0, k);
  }

  // short reasons for the "why this?" hint, closest group first
  explain(a, b, n = 2) {
    const gd = this.groupDistances(a, b);
    const fa = this.raw[a];
    const fb = this.raw[b];
    return Object.entries(gd)
      .sort((x, y) => x[1] - y[1])
      .slice(0, n)
      .map(([g]) => {
        if (g === 'rhythm') return `similar tempo (${Math.round(foldTempo(fa.tempo))} vs ${Math.round(foldTempo(fb.tempo))} bpm)`;
        if (g === 'harmony') return fa.key === fb.key ? `same key (${fa.key})` : `related keys (${fa.key} / ${fb.key})`;
        return `similar ${GROUPS[g].label}`;
      });
  }

  pathCost(order) {
    let c = 0;
    for (let i = 1; i < order.length; i++) c += this.distance(order[i - 1], order[i]);
    return c;
  }

  // "Smooth shuffle": an ordering where each song flows into the next.
  // This is an open travelling-salesman path, so: randomised nearest
  // neighbour to get a different start each time, then 2-opt to clean it up.
  // For a few hundred tracks this is still instant.
  smoothOrder(ids = this.ids, startId = null, rand = Math.random) {
    const pool = ids.filter(id => this.vec[id]);
    if (pool.length < 3) return [...pool];

    const start = startId && pool.includes(startId)
      ? startId
      : pool[Math.floor(rand() * pool.length)];

    const order = [start];
    const left = new Set(pool.filter(id => id !== start));
    while (left.size) {
      const last = order[order.length - 1];
      const ranked = [...left].sort((x, y) => this.distance(last, x) - this.distance(last, y));
      // pick from the two nearest so repeated shuffles don't all look the same
      const pick = ranked.length > 1 && rand() < 0.3 ? ranked[1] : ranked[0];
      order.push(pick);
      left.delete(pick);
    }

    return this.twoOpt(order);
  }

  twoOpt(order) {
    const o = [...order];
    const d = (x, y) => this.distance(x, y);
    let improved = true;
    let guard = 0;
    while (improved && guard++ < 100) {
      improved = false;
      // i starts at 1 so the first track (the one playing) stays put
      for (let i = 1; i < o.length - 1; i++) {
        for (let j = i + 1; j < o.length; j++) {
          const before = d(o[i - 1], o[i]) + (j + 1 < o.length ? d(o[j], o[j + 1]) : 0);
          const after = d(o[i - 1], o[j]) + (j + 1 < o.length ? d(o[i], o[j + 1]) : 0);
          if (after < before - 1e-9) {
            o.splice(i, j - i + 1, ...o.slice(i, j + 1).reverse());
            improved = true;
          }
        }
      }
    }
    return o;
  }
}
