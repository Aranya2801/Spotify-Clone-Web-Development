import { shuffleArray } from './utils.js';

// Playback order. Kept free of DOM/audio stuff so it can be unit tested.
//
// context  = the list you started playing from (album, liked, a playlist...)
// order    = context in the order it will actually play (shuffled or not)
// upNext   = songs added with "play next" / "add to queue"; these always
//            go before the rest of the order, like on Spotify

export class Queue {
  constructor({ space = null, rand = Math.random } = {}) {
    this.space = space;
    this.rand = rand;
    this.context = [];
    this.order = [];
    this.pos = -1;
    this.upNext = [];
    this.shuffle = 'off'; // off | random | smooth
    this.repeat = 'off'; // off | all | one
    this.history = [];
  }

  get current() {
    return this._current ?? null;
  }

  setContext(ids, startId = ids[0]) {
    this.context = [...ids];
    this._current = startId;
    this._reorder();
    return this.current;
  }

  _reorder() {
    const cur = this._current;
    if (this.shuffle === 'off') {
      this.order = [...this.context];
    } else if (this.shuffle === 'smooth' && this.space) {
      this.order = this.space.smoothOrder(this.context, cur, this.rand);
    } else {
      const rest = shuffleArray(this.context.filter(id => id !== cur), this.rand);
      this.order = this.context.includes(cur) ? [cur, ...rest] : rest;
    }
    this.pos = this.order.indexOf(cur);
  }

  setShuffle(mode) {
    this.shuffle = mode;
    if (this.context.length) this._reorder();
  }

  cycleRepeat() {
    const modes = ['off', 'all', 'one'];
    this.repeat = modes[(modes.indexOf(this.repeat) + 1) % 3];
    return this.repeat;
  }

  // jump straight to a song inside the current context
  jumpTo(id) {
    if (!this.context.includes(id)) return this.setContext([id], id);
    this._push(id);
    this.pos = this.order.indexOf(id);
    return id;
  }

  _push(id) {
    if (this._current && this._current !== id) {
      this.history.push(this._current);
      if (this.history.length > 50) this.history.shift();
    }
    this._current = id;
  }

  // auto = true when called because a song ended (repeat-one only applies then)
  next(auto = false) {
    if (auto && this.repeat === 'one' && this._current) return this._current;

    if (this.upNext.length) {
      const id = this.upNext.shift();
      this._push(id);
      return id;
    }
    if (!this.order.length) return null;

    let p = this.pos + 1;
    if (p >= this.order.length) {
      if (this.repeat === 'off' && auto) return null;
      // reshuffle when wrapping around so the second lap isn't identical
      if (this.shuffle !== 'off') {
        const was = this._current;
        this._current = null;
        this._reorder();
        this._current = was;
      }
      p = 0;
    }
    this.pos = p;
    this._push(this.order[p]);
    return this._current;
  }

  prev() {
    const id = this.history.pop();
    if (!id) return this._current;
    this._current = id;
    const p = this.order.indexOf(id);
    if (p >= 0) this.pos = p;
    return id;
  }

  playNext(id) {
    this.upNext.unshift(id);
  }

  addToQueue(id) {
    this.upNext.push(id);
  }

  removeFromUpNext(index) {
    this.upNext.splice(index, 1);
  }

  upcoming(n = 20) {
    const rest = this.order.slice(this.pos + 1);
    if (this.repeat === 'all') rest.push(...this.order.slice(0, this.pos + 1));
    return { upNext: [...this.upNext], rest: rest.slice(0, n) };
  }
}
