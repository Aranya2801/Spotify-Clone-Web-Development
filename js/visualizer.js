// Frequency bars under the hero + the waveform seek bar in the player.

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function fitCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

export class Spectrum {
  constructor(canvas, audio) {
    this.canvas = canvas;
    this.audio = audio;
    this.ctx = null;
    this.analyser = null;
    this.data = null;
    this.raf = 0;
    this.accent = [29, 185, 84];
  }

  // AudioContext has to be created after a user gesture, otherwise Chrome
  // starts it suspended and you get silence
  async attach() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      const src = this.ctx.createMediaElementSource(this.audio);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      src.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
      this.data = new Uint8Array(this.analyser.frequencyBinCount);
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume();
  }

  setAccent(rgb) {
    this.accent = rgb;
  }

  start() {
    cancelAnimationFrame(this.raf);
    if (reducedMotion) return this.drawFrame(false);
    const loop = () => {
      this.drawFrame(!this.audio.paused && this.analyser);
      this.raf = requestAnimationFrame(loop);
    };
    loop();
  }

  drawFrame(live) {
    const { ctx, w, h } = fitCanvas(this.canvas);
    ctx.clearRect(0, 0, w, h);

    // only use the lower ~70% of bins, the top end is almost always empty
    const bins = live ? Math.floor(this.data.length * 0.7) : 64;
    if (live) this.analyser.getByteFrequencyData(this.data);

    const gap = 2;
    const bw = Math.max(1, w / bins - gap);
    const [r, g, b] = this.accent;
    const t = performance.now() / 1000;

    for (let i = 0; i < bins; i++) {
      const v = live ? this.data[i] / 255 : 0.06 + 0.04 * Math.sin(t * 1.5 + i * 0.35);
      const bh = Math.max(3, v * h);
      ctx.fillStyle = `rgba(${r},${g},${b},${0.25 + v * 0.75})`;
      const x = i * (bw + gap);
      const y = (h - bh) / 2;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(x, y, bw, bh, 2);
        ctx.fill();
      } else {
        ctx.fillRect(x, y, bw, bh);
      }
    }
  }
}

export class WaveformSeek {
  constructor(canvas, { onSeek }) {
    this.canvas = canvas;
    this.peaks = null;
    this.progress = 0;
    this.hover = -1;
    this.onSeek = onSeek;
    this.dragging = false;

    // pointer events so it works with touch as well as mouse
    canvas.addEventListener('pointerdown', e => {
      this.dragging = true;
      canvas.setPointerCapture(e.pointerId);
      this._seekFromEvent(e);
    });
    canvas.addEventListener('pointermove', e => {
      this.hover = this._ratio(e);
      if (this.dragging) this._seekFromEvent(e);
      else this.draw();
    });
    canvas.addEventListener('pointerup', () => (this.dragging = false));
    canvas.addEventListener('pointerleave', () => {
      this.hover = -1;
      this.draw();
    });
    new ResizeObserver(() => this.draw()).observe(canvas);
  }

  _ratio(e) {
    const r = this.canvas.getBoundingClientRect();
    return Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  }

  _seekFromEvent(e) {
    const p = this._ratio(e);
    this.progress = p;
    this.draw();
    this.onSeek(p);
  }

  setPeaks(peaks) {
    this.peaks = peaks;
    this.draw();
  }

  setProgress(p) {
    if (this.dragging) return;
    this.progress = p;
    this.draw();
  }

  draw() {
    const { ctx, w, h } = fitCanvas(this.canvas);
    ctx.clearRect(0, 0, w, h);
    const peaks = this.peaks || Array(120).fill(0.15);
    const n = peaks.length;
    const step = w / n;
    const bw = Math.max(1, step * 0.6);

    for (let i = 0; i < n; i++) {
      const x = i * step;
      const ratio = i / n;
      const bh = Math.max(2, peaks[i] * h * 0.9);
      if (ratio < this.progress) ctx.fillStyle = '#1db954';
      else if (this.hover >= 0 && ratio < this.hover) ctx.fillStyle = '#8a8a8a';
      else ctx.fillStyle = '#4d4d4d';
      ctx.fillRect(x, (h - bh) / 2, bw, bh);
    }
  }
}

// average colour of an image, used to tint the hero. Same-origin images only.
export function dominantColor(img) {
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 24;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, 24, 24);
    const d = ctx.getImageData(0, 0, 24, 24).data;
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) {
      // skip near-black and near-white pixels, they wash out the result
      const lum = d[i] + d[i + 1] + d[i + 2];
      if (lum < 60 || lum > 700) continue;
      r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
    }
    if (!n) return [40, 40, 40];
    return [r / n, g / n, b / n].map(Math.round);
  } catch {
    return [40, 40, 40];
  }
}
