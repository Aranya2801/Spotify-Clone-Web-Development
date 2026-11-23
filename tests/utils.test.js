import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatTime, esc, shuffleArray, clamp } from '../js/utils.js';
import { TRACKS, byId } from '../js/tracks.js';
import { features } from './helpers.js';

test('formatTime', () => {
  assert.equal(formatTime(0), '0:00');
  assert.equal(formatTime(65.9), '1:05');
  assert.equal(formatTime(NaN), '0:00');
  assert.equal(formatTime(-3), '0:00');
});

test('esc blocks html in playlist names', () => {
  assert.equal(esc('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
  assert.equal(esc(`"a" & 'b'`), '&quot;a&quot; &amp; &#39;b&#39;');
});

test('shuffleArray does not mutate', () => {
  const a = [1, 2, 3, 4];
  const b = shuffleArray(a);
  assert.deepEqual(a, [1, 2, 3, 4]);
  assert.deepEqual([...b].sort(), a);
});

test('clamp', () => {
  assert.equal(clamp(5, 0, 1), 1);
  assert.equal(clamp(-1, 0, 1), 0);
});

test('every track has features and a sane duration', () => {
  for (const t of TRACKS) {
    assert.ok(features[t.id], `missing features for ${t.id}`);
    assert.ok(Math.abs(features[t.id].duration - t.duration) < 2, `duration mismatch for ${t.id}`);
  }
  assert.equal(byId.size, TRACKS.length);
});
