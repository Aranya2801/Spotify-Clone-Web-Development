import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TrackSpace, foldTempo, fifthsPosition } from '../js/similarity.js';
import { shuffleArray } from '../js/utils.js';
import { features, seeded } from './helpers.js';

const space = new TrackSpace(features);

test('foldTempo puts half/double time in the same octave', () => {
  assert.equal(foldTempo(152), 76);
  assert.equal(foldTempo(76), 76);
  assert.equal(foldTempo(35), 70);
  assert.ok(foldTempo(139) < 140);
});

test('relative minor sits on the same spot as its major', () => {
  assert.equal(fifthsPosition('A minor'), fifthsPosition('C major'));
  assert.equal(fifthsPosition('E minor'), fifthsPosition('G major'));
  // G is one step round the circle from C
  assert.equal(fifthsPosition('G major'), 1);
});

test('distance is a proper-ish metric', () => {
  for (const a of space.ids) {
    assert.equal(space.distance(a, a), 0);
    for (const b of space.ids) {
      assert.ok(space.distance(a, b) >= 0);
      assert.equal(space.distance(a, b), space.distance(b, a));
    }
  }
});

test('similar() excludes the seed and is sorted', () => {
  const res = space.similar('04', 9);
  assert.equal(res.length, 9);
  assert.ok(!res.some(r => r.id === '04'));
  for (let i = 1; i < res.length; i++) assert.ok(res[i - 1].score >= res[i].score);
});

test('explain() gives readable reasons', () => {
  const reasons = space.explain('04', '05');
  assert.equal(reasons.length, 2);
  reasons.forEach(r => assert.equal(typeof r, 'string'));
});

test('smoothOrder keeps the start track first and visits everything once', () => {
  const order = space.smoothOrder(space.ids, '07', seeded(3));
  assert.equal(order[0], '07');
  assert.deepEqual([...order].sort(), [...space.ids].sort());
});

test('smooth shuffle beats random shuffle on transition cost', () => {
  const rand = seeded(42);
  let smooth = 0;
  let random = 0;
  const runs = 200;
  for (let i = 0; i < runs; i++) {
    const start = space.ids[i % space.ids.length];
    smooth += space.pathCost(space.smoothOrder(space.ids, start, rand));
    const rest = shuffleArray(space.ids.filter(x => x !== start), rand);
    random += space.pathCost([start, ...rest]);
  }
  assert.ok(smooth / runs < (random / runs) * 0.85, `smooth ${smooth / runs} vs random ${random / runs}`);
});

test('2-opt never makes a path worse', () => {
  const rand = seeded(9);
  for (let i = 0; i < 50; i++) {
    const p = shuffleArray(space.ids, rand);
    assert.ok(space.pathCost(space.twoOpt(p)) <= space.pathCost(p) + 1e-9);
  }
});

test('match score is calibrated around the library median', () => {
  const scores = [];
  for (const a of space.ids) for (const b of space.ids) if (a < b) scores.push(space.similarity(a, b));
  scores.sort((x, y) => x - y);
  const median = scores[Math.floor(scores.length / 2)];
  assert.ok(Math.abs(median - 0.5) < 0.05, `median score ${median}`);
});
