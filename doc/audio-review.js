/* Authoring-only listening notebook. Never reads or writes the game's saves. */
'use strict';
(() => {
  const tracks = window.GB_AUDIO_REVIEW_TRACKS;
  const $ = id => document.getElementById(id);
  const audio = $('audio');
  const key = 'gamebook.audio-review.v1';
  const checkNames = ['tone', 'level', 'seam', 'threeLoops'];
  const blank = () => ({ checks: Object.fromEntries(checkNames.map(k => [k, false])), verdict: 'pending', notes: '', updatedAt: null });
  let notebook = { format: 'gamebook-audio-review', version: 1, environment: '', entries: {}, archive: [] };
  let index = 0, completed = 0, lastTime = 0, mode = 'continuous', playRequest = 0;
  const track = () => tracks[index];
  const record = () => notebook.entries[track().id];
  const time = value => Number.isFinite(value) ? `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}` : '—';
  const message = (id, text, error = false) => { $(id).textContent = text; $(id).classList.toggle('error', error); };

  function validate(value) {
    if (!value || value.format !== 'gamebook-audio-review' || value.version !== 1 ||
        typeof value.environment !== 'string' || value.environment.length > 500 ||
        !value.entries || typeof value.entries !== 'object' || Array.isArray(value.entries)) throw new Error('対応する試聴記録ではありません。');
    const result = { format: value.format, version: 1, environment: value.environment, entries: {}, archive: [] };
    const validRecord = r => r && r.checks && checkNames.every(k => typeof r.checks[k] === 'boolean') &&
      ['pending', 'ok', 'fix'].includes(r.verdict) && typeof r.notes === 'string' && r.notes.length <= 10000 &&
      (r.updatedAt === null || typeof r.updatedAt === 'string') && typeof r.sha256 === 'string' && /^[a-f0-9]{64}$/.test(r.sha256);
    const copyRecord = r => ({ checks: Object.fromEntries(checkNames.map(k => [k, r.checks[k]])), verdict: r.verdict, notes: r.notes, updatedAt: r.updatedAt, sha256: r.sha256 });
    if (value.archive !== undefined) {
      if (!Array.isArray(value.archive) || value.archive.some(r => !validRecord(r) || !tracks.some(t => t.id === r.id))) throw new Error('過去の音源の記録形式が正しくありません。');
      result.archive = value.archive.map(r => ({ id: r.id, ...copyRecord(r) }));
    }
    let outdated = 0;
    for (const item of tracks) {
      const r = Object.hasOwn(value.entries, item.id) ? value.entries[item.id] : null;
      if (!r) continue;
      if (!validRecord(r)) throw new Error('確認欄やメモの形式が正しくありません。');
      if (r.sha256 !== item.sha256) { outdated++; result.archive.push({ id: item.id, ...copyRecord(r) }); continue; }
      if (r.verdict === 'ok' && !checkNames.every(k => r.checks[k])) throw new Error('「問題なし」の記録には全項目の確認が必要です。');
      result.entries[item.id] = { ...copyRecord(r), src: item.src, title: item.title };
    }
    return { result, outdated };
  }

  function fillMissing() {
    for (const item of tracks) if (!notebook.entries[item.id]) notebook.entries[item.id] = { ...blank(), sha256: item.sha256, src: item.src, title: item.title };
  }

  function persist() {
    try { localStorage.setItem(key, JSON.stringify(notebook)); message('save-message', '確認記録をこのブラウザに保存しました。JSONでも持ち出せます。'); }
    catch (_) { message('save-message', 'ブラウザに保存できません。閉じる前に「記録をJSONで保存」を押してください。', true); }
    renderCount();
  }

  function renderCount() {
    const done = tracks.filter(t => notebook.entries[t.id].verdict !== 'pending').length;
    $('review-count').textContent = `判定済み ${done} / ${tracks.length}`;
    [...$('track').options].forEach((option, i) => {
      const t = tracks[i], verdict = notebook.entries[t.id].verdict;
      option.textContent = `${i + 1}. ${t.title}${verdict === 'ok' ? ' ✓' : verdict === 'fix' ? '（要修正）' : ''}`;
    });
  }

  function renderRecord() {
    const r = record();
    document.querySelectorAll('[data-check]').forEach(input => { input.checked = r.checks[input.dataset.check]; });
    $('verdict').value = r.verdict;
    $('notes').value = r.notes;
    $('environment').value = notebook.environment;
    renderCount();
  }

  function updateRecord() {
    const r = record();
    document.querySelectorAll('[data-check]').forEach(input => { r.checks[input.dataset.check] = input.checked; });
    const verdict = $('verdict').value;
    r.verdict = verdict === 'ok' && !checkNames.every(k => r.checks[k]) ? 'pending' : verdict;
    $('verdict').value = r.verdict;
    r.notes = $('notes').value;
    r.updatedAt = new Date().toISOString();
    notebook.environment = $('environment').value;
    persist();
    if (verdict === 'ok' && r.verdict !== 'ok') message('save-message', '「問題なし」にするには、聴いて確認した4項目にチェックしてください。', true);
  }

  function tick() {
    const now = audio.currentTime;
    if (Number.isFinite(audio.duration) && lastTime > audio.duration - 1 && now < 1 && now + 1 < lastTime) {
      completed++;
      // Keep the first two native loop transitions seamless. Let the third
      // pass end normally instead of racing pause() against an automatic seek
      // back to the start (which can restart playback in WebKit).
      if (mode === 'three' && completed === 2) audio.loop = false;
    }
    lastTime = now;
    $('progress').max = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 1;
    $('progress').value = now;
    $('time').textContent = `${time(now)} / ${time(audio.duration)}`;
    $('rounds').textContent = mode === 'three' ? `${completed} / 3周 再生済み` : mode === 'finished' ? '3 / 3周 再生済み' : mode === 'seam' ? '継ぎ目の確認中' : '連続再生';
    $('play').textContent = audio.paused ? '再生' : '一時停止';
  }

  async function play() {
    const request = ++playRequest;
    message('play-message', '');
    try { await audio.play(); }
    catch (_) { if (request === playRequest) message('play-message', '再生できません。曲のファイルとブラウザの音声対応を確認してください。', true); }
    if (request === playRequest) tick();
  }

  function resetPlayback(nextMode, position = 0) {
    mode = nextMode; completed = 0; lastTime = position;
    audio.loop = true;
    audio.currentTime = position;
    tick();
  }

  function selectTrack(nextIndex) {
    ++playRequest; audio.pause(); index = nextIndex;
    mode = 'continuous'; completed = 0; lastTime = 0;
    audio.loop = true;
    $('track').value = String(index);
    $('track-title').textContent = track().title;
    $('story-title').textContent = track().storyTitle;
    $('previous').disabled = index === 0;
    $('next').disabled = index === tracks.length - 1;
    $('seam').disabled = true;
    audio.src = '../' + track().src;
    audio.volume = track().volume;
    $('volume').value = String(Math.round(audio.volume * 100));
    $('volume-value').textContent = $('volume').value + '%';
    message('play-message', '');
    renderRecord(); tick();
  }

  for (const [i, t] of tracks.entries()) $('track').add(new Option(t.title, String(i)));
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = validate(JSON.parse(saved)); notebook = parsed.result;
      message('save-message', parsed.outdated ? `音源が変わった${parsed.outdated}曲を未確認に戻しました。以前の記録もJSONのarchive欄へ保持します。` : '前回の確認記録を復元しました。');
    } else message('save-message', '確認欄とメモは自動保存されます。');
  } catch (_) { message('save-message', '前回の記録を復元できません。保存済みJSONがあれば読み込んでください。', true); }
  fillMissing();
  $('track').addEventListener('change', () => selectTrack(Number($('track').value)));
  $('previous').addEventListener('click', () => selectTrack(index - 1));
  $('next').addEventListener('click', () => selectTrack(index + 1));
  $('play').addEventListener('click', () => {
    if (!audio.paused) { ++playRequest; audio.pause(); tick(); }
    else { if (mode === 'finished') resetPlayback('continuous'); play(); }
  });
  $('three').addEventListener('click', () => { resetPlayback('three'); play(); });
  $('seam').addEventListener('click', () => { resetPlayback('seam', Math.max(0, audio.duration - 5)); play(); });
  $('volume').addEventListener('input', () => { audio.volume = Number($('volume').value) / 100; $('volume-value').textContent = $('volume').value + '%'; });
  $('default-volume').addEventListener('click', () => { audio.volume = track().volume; $('volume').value = String(Math.round(audio.volume * 100)); $('volume-value').textContent = $('volume').value + '%'; });
  audio.addEventListener('loadedmetadata', () => { $('seam').disabled = !Number.isFinite(audio.duration); tick(); });
  audio.addEventListener('ended', () => {
    if (mode !== 'three' || completed !== 2) return;
    ++playRequest;
    completed = 3; mode = 'finished';
    audio.pause();
    tick();
    message('play-message', '3周の再生が終了しました。聴いた結果を下に記録してください。');
  });
  for (const event of ['timeupdate', 'seeked', 'play', 'pause']) audio.addEventListener(event, tick);
  audio.addEventListener('error', () => message('play-message', '音源を読み込めません。フォルダ全体を展開し直すか、別のブラウザで開いてください。', true));
  document.querySelectorAll('[data-check]').forEach(input => input.addEventListener('change', updateRecord));
  $('verdict').addEventListener('change', updateRecord);
  $('notes').addEventListener('input', updateRecord);
  $('environment').addEventListener('input', updateRecord);
  $('timestamp').addEventListener('click', () => { const field = $('notes'); field.value = (field.value + (field.value ? '\n' : '') + `[${time(audio.currentTime)}] `).slice(0, 10000); updateRecord(); field.focus(); });
  $('export').addEventListener('click', () => {
    const payload = { ...notebook, exportedAt: new Date().toISOString(), userAgent: navigator.userAgent };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2) + '\n'], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = `gamebook-audio-review-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  $('import').addEventListener('change', async () => {
    const file = $('import').files[0]; if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error('確認記録が大きすぎます。');
      const parsed = validate(JSON.parse(await file.text()));
      // Merge only supplied records with the current audio fingerprint.
      notebook.entries = { ...notebook.entries, ...parsed.result.entries };
      const history = [...notebook.archive, ...parsed.result.archive];
      notebook.archive = [...new Map(history.map(r => [JSON.stringify(r), r])).values()];
      notebook.environment = parsed.result.environment;
      renderRecord(); persist();
      message('save-message', `${Object.keys(parsed.result.entries).length}曲の記録を読み込みました。${parsed.outdated ? `音源が異なる${parsed.outdated}曲は過去の記録として保持しました。` : ''}`);
    } catch (error) { message('save-message', `読み込めませんでした。${error.message}`, true); }
    $('import').value = '';
  });
  selectTrack(0);
  document.documentElement.dataset.audioReviewReady = 'true';
})();
