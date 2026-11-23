import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Queue } from '../js/queue.js';
import { TrackSpace } from '../js/similarity.js';
import { features, seeded } from './helpers.js';

const IDS = ['01', '02', '03', '04', '05'];

test('plays in order and stops at the end with repeat off', () => {
  const q = new Queue();
  q.setContext(IDS, '01');
  assert.deepEqual([q.next(true), q.next(true), q.next(true), q.next(true)], ['02', '03', '04', '05']);
  assert.equal(q.next(true), null);
});

test('manual next wraps around even with repeat off', () => {
  const q = new Queue();
  q.setContext(IDS, '05');
  assert.equal(q.next(), '01');
});

test('repeat all wraps, repeat one sticks (only when auto)', () => {
  const q = new Queue();
  q.setContext(IDS, '05');
  q.repeat = 'all';
  assert.equal(q.next(true), '01');
  q.repeat = 'one';
  assert.equal(q.next(true), '01');
  assert.equal(q.next(false), '02');
});

test('cycleRepeat goes off -> all -> one -> off', () => {
  const q = new Queue();
  assert.deepEqual([q.cycleRepeat(), q.cycleRepeat(), q.cycleRepeat()], ['all', 'one', 'off']);
});

test('play next / add to queue jump ahead of the context', () => {
  const q = new Queue();
  q.setContext(IDS, '01');
  q.addToQueue('05');
  q.playNext('04');
  assert.equal(q.next(), '04');
  assert.equal(q.next(), '05');
  assert.equal(q.next(), '02');
});

test('prev walks back through history', () => {
  const q = new Queue();
  q.setContext(IDS, '01');
  q.next();
  q.next();
  assert.equal(q.current, '03');
  assert.equal(q.prev(), '02');
  assert.equal(q.prev(), '01');
});

test('random shuffle keeps the current song first and loses nothing', () => {
  const q = new Queue({ rand: seeded(7) });
  q.setContext(IDS, '03');
  q.setShuffle('random');
  assert.equal(q.order[0], '03');
  assert.deepEqual([...q.order].sort(), IDS);
});

test('smooth shuffle uses the track space', () => {
  const space = new TrackSpace(features);
  const all = space.ids;
  const q = new Queue({ space, rand: seeded(1) });
  q.setContext(all, '06');
  q.setShuffle('smooth');
  assert.equal(q.order[0], '06');
  assert.equal(q.order.length, all.length);
});

test('upcoming() lists up-next first then the rest', () => {
  const q = new Queue();
  q.setContext(IDS, '02');
  q.addToQueue('05');
  const u = q.upcoming();
  assert.deepEqual(u.upNext, ['05']);
  assert.deepEqual(u.rest, ['03', '04', '05']);
});
