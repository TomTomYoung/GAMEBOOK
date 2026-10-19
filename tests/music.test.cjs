'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createPlayer } = require('../js/music.js');
const a = { src: 'a.ogg', loop: true, volume: .35 };
const b = { ...a, src: 'b.ogg' };
const flush = () => new Promise(resolve => setImmediate(resolve));

function fixture() {
  const calls = [], errors = [];
  const audio = { paused: true, currentTime: 0, pause() { this.paused = true; }, play() {
    this.paused = false;
    return new Promise((resolve, reject) => calls.push({ resolve, reject, src: this.src }));
  } };
  let creations = 0;
  const player = createPlayer({ createAudio() { creations++; return audio; }, onError: e => errors.push(e) });
  return { player, audio, calls, errors, get creations() { return creations; } };
}

test('music stays silent until opted in; repeated rendering preserves time and one player', async () => {
  const f = fixture(); f.player.setTrack(a);
  assert.equal(f.creations, 0);
  f.player.setEnabled(true); f.audio.currentTime = 12;
  f.player.setTrack(a); f.player.setTrack({ ...a });
  assert.equal(f.calls.length, 1); f.calls[0].resolve(); await flush();
  f.player.setTrack(a);
  assert.equal(f.calls.length, 1); assert.equal(f.audio.currentTime, 12);
  assert.equal(f.audio.loop, true); assert.equal(f.audio.volume, .35);
});

test('a cancelled old track cannot turn a newly selected track off', async () => {
  const f = fixture(); f.player.setTrack(a); f.player.setEnabled(true); f.player.setTrack(b);
  f.calls[0].reject(new Error('interrupted by new source')); await flush();
  assert.equal(f.player.enabled, true); assert.equal(f.audio.src, b.src); assert.deepEqual(f.errors, []);
  f.calls[1].resolve(); await flush();
});

test('rapid OFF then ON ignores the cancelled earlier request', async () => {
  const f = fixture(); f.player.setTrack(a); f.player.setEnabled(true);
  f.player.setEnabled(false); f.player.setEnabled(true);
  f.calls[0].reject(new Error('pause')); f.calls[1].resolve(); await flush();
  assert.equal(f.player.enabled, true); assert.equal(f.audio.paused, false); assert.deepEqual(f.errors, []);
});

test('silent stories and hidden documents pause without losing the user preference', async () => {
  const f = fixture(); f.player.setTrack(a); f.player.setEnabled(true); f.calls[0].resolve(); await flush();
  f.player.setTrack(null); assert.equal(f.audio.paused, true); assert.equal(f.player.enabled, true);
  f.player.setSuspended(true); f.player.setTrack(b); assert.equal(f.calls.length, 1);
  f.player.setSuspended(false); assert.equal(f.calls.length, 2); assert.equal(f.audio.src, b.src);
  f.player.setSuspended(true); f.calls[1].reject(new Error('hidden')); await flush();
  assert.equal(f.player.enabled, true); assert.deepEqual(f.errors, []);
});

test('a current playback failure turns music OFF and can be retried', async () => {
  const f = fixture(); f.player.setTrack(a); f.player.setEnabled(true);
  f.calls[0].reject(new Error('decode error')); await flush();
  assert.equal(f.player.enabled, false); assert.equal(f.audio.paused, true); assert.equal(f.errors.length, 1);
  f.player.setEnabled(true); f.calls[1].resolve(); await flush();
  assert.equal(f.player.enabled, true); assert.equal(f.audio.paused, false);
});
