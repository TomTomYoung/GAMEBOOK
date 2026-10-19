(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GBMusic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // One audio element for the whole reader. Old play() rejections must not
  // disable a newer track or a later ON click after an intentional pause.
  function createPlayer({ createAudio = () => new Audio(), onChange = () => {}, onError = () => {} } = {}) {
    let audio = null, track = null, source = '', enabled = false, suspended = false;
    let revision = 0, pending = null;
    function stop() {
      revision++;
      pending = null;
      if (audio) audio.pause();
    }
    function sync() {
      if (!enabled || suspended || !track) { stop(); return; }
      if (!audio) {
        audio = createAudio();
        audio.preload = 'none';
      }
      if (source !== track.src) {
        stop();
        audio.src = track.src;
        source = track.src;
      }
      audio.loop = track.loop;
      audio.volume = track.volume;
      if (pending !== null || !audio.paused) return;
      const ticket = ++revision;
      pending = ticket;
      function failed(error) {
        if (ticket !== revision) return;
        pending = null;
        enabled = false;
        stop();
        onChange();
        onError(error);
      }
      try {
        Promise.resolve(audio.play()).then(() => {
          if (ticket === revision) pending = null;
        }, failed);
      } catch (error) { failed(error); }
    }
    return {
      get enabled() { return enabled; },
      setTrack(value) { track = value; sync(); },
      setEnabled(value) { enabled = Boolean(value); sync(); onChange(); },
      setSuspended(value) { suspended = Boolean(value); sync(); }
    };
  }
  return { createPlayer };
});
