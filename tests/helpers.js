import { readFileSync } from 'node:fs';

export const features = JSON.parse(
  readFileSync(new URL('../data/features.json', import.meta.url)),
).tracks;

// small seeded PRNG (mulberry32) so shuffle tests are repeatable
export function seeded(seed = 1) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
