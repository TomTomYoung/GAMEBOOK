(function () {
  'use strict';
  const E = globalThis.GBEngine;
  const S = globalThis.GBStorage;
  const stories = globalThis.GB_STORIES;
  const editions = globalThis.GB_EDITIONS || [];
  const allStories = [...(stories || []), ...editions.map(edition => edition.story)];
  const selectedEditions = {};
  const assets = globalThis.GB_ASSETS;
  const $ = id => document.getElementById(id);
  const STORAGE_KEY = 'gamebook.shelf.v1';
  const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
  const tones = ['#9eb8b3','#c4b896','#a8b7c4','#c0b196','#afbea5','#c5a999','#b0adc0','#a7b7ab','#d0b986','#b9b8a0','#92b4bd','#b4c0bb','#bdcbd0','#b7ad8b','#a7b3af','#bfb298','#aeb6b5','#b9b0b8','#99b2b3','#b1bba0'];
  let shelf, active = null, shelfPage = 0, shelfCapacity = 8;
  let paragraphs = [], textPages = [], textPage = 0, textSignature = '', measuredSize = '';
  let choices = [], choicePages = [], choicePage = 0;
  let inTransition = false, framePending = false, toastTimer, saveTimer;
  let rawRecovery = null, storageError = null, storageWarned = false, externalConflict = false;
  let music = null;
  let isImportPending = false;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function button(text, className, handler) {
    const node = el('button', className, text);
    node.type = 'button';
    node.addEventListener('click', handler);
    return node;
  }
  function notify(message) {
    clearTimeout(toastTimer);
    $('toast').textContent = message;
    $('toast').hidden = false;
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4300);
  }
  function reportError(error) {
    console.error(error);
    notify(error instanceof Error ? error.message : '操作を完了できませんでした。');
  }
  function status(text, warning = false) {
    if (warning) clearTimeout(saveTimer);
    $('save-status').textContent = text;
    $('save-status').classList.toggle('warning', warning);
    $('save-button').title = `セーブの管理 — ${text}`;
  }
  function readShelf(input) {
    const id = 'GB01-V2';
    const revised = allStories.find(story => story.id === id);
    if (revised?.revision !== 3 || input?.sessions?.[id]?.contentRevision !== 2) {
      return S.validateShelf(allStories, input);
    }
    // Revision 2 of this edition was an exact copy of the preserved first
    // edition. Validate against that original before replaying the same choices.
    const legacy = { ...stories.find(story => story.id === 'GB01'), id };
    const checked = S.validateShelf(allStories.map(story => story.id === id ? legacy : story), input);
    checked.sessions[id] = E.replay(revised, checked.sessions[id].trail);
    // The prose and its pagination changed; resume at the section's beginning.
    if (checked.bookmarks[id]) checked.bookmarks[id].page = 0;
    return S.validateShelf(allStories, checked);
  }
  function loadShelf() {
    shelf = S.createShelf();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== null) {
        try {
          if (raw.length > MAX_IMPORT_BYTES) throw new Error('保存データが大きすぎます。');
          shelf = readShelf(JSON.parse(raw));
        } catch (error) {
          rawRecovery = raw;
          storageError = error.message;
          status('保存データの確認が必要です', true);
          setTimeout(() => notify('以前の保存データを読み込めませんでした。「セーブ」で原本を取り出せます。新しい進行はまだ上書きしません。'), 300);
        }
      }
    } catch (error) {
      storageError = error.message;
      status('ファイル保存をご利用ください', true);
    }
  }
  function persist(quiet = false) {
    if (rawRecovery !== null) { status('保存データの確認が必要です', true); return false; }
    if (externalConflict) { status('別の画面に新しい栞があります', true); return false; }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shelf));
      storageError = null;
      status(quiet ? 'この端末に自動保存' : '栞を保存しました');
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => status('この端末に自動保存'), 1800);
      return true;
    } catch (error) {
      storageError = error.message;
      status('ファイル保存をご利用ください', true);
      if (!storageWarned) {
        notify('この環境では自動保存できません。閉じる前に「セーブ」からファイルを保存してください。');
        storageWarned = true;
      }
      return false;
    }
  }
  function preferences() {
    document.body.dataset.theme = shelf.preferences.theme;
    document.documentElement.style.setProperty('--reader-font', `${shelf.preferences.fontSize}px`);
    document.querySelector('meta[name="theme-color"]').content = shelf.preferences.theme === 'night' ? '#112123' : '#172d30';
  }
  function currentStory() { return allStories.find(story => story.id === active); }
  function baseIdFor(id) { return editions.find(edition => edition.story.id === id)?.baseId || id; }
  function currentSession() { return shelf.sessions[active]; }
  function bookmark() { return shelf.bookmarks[active]; }
  function endingCount(story) { return Object.keys(shelf.endingTrails[story.id] || {}).length; }
  function endingsTotal(story) { return story.nodes.filter(node => node.ending).length; }
  function rememberPage() {
    if (active && bookmark()) bookmark().page = textPage;
  }
  function coverFor(story) { return assets.stories[baseIdFor(story.id)]?.image || null; }
  function sceneFor(story, nodeId, intro) {
    const entry = assets.stories[baseIdFor(story.id)] || {};
    const scene = intro ? null : entry.scenes?.[nodeId];
    return { image: scene?.image || entry.image || null, music: scene?.music || entry.music || null };
  }
  function addImage(container, imageEntry) {
    const image = el('img');
    image.src = imageEntry.src;
    image.alt = imageEntry.alt;
    image.style.objectPosition = imageEntry.position;
    image.addEventListener('error', () => {
      container.classList.remove('has-image');
      image.remove();
    }, { once: true });
    container.classList.add('has-image');
    container.append(image);
  }
  function renderMusicButton() {
    $('music-button').textContent = music.enabled ? '音楽 ON' : '音楽 OFF';
    $('music-button').setAttribute('aria-pressed', String(music.enabled));
  }
  function updateMusic() {
    const track = active ? sceneFor(currentStory(), currentSession().nodeId, bookmark().intro).music : assets.library.music;
    $('music-button').hidden = !track;
    $('music-button').title = track ? track.title : '';
    music.setTrack(track);
    renderMusicButton();
  }

  function capacityForShelf() {
    const width = window.innerWidth, height = window.innerHeight;
    if (height <= 510 && width >= 600) return 4;
    return width <= 760 ? 4 : 8;
  }
  function filteredStories() {
    const query = $('search-input').value.trim().toLocaleLowerCase('ja');
    return stories.filter(story => `${story.id} ${story.title} ${story.genre} ${story.hook}`.toLocaleLowerCase('ja').includes(query));
  }
  function renderLibrary() {
    shelfCapacity = capacityForShelf();
    const filtered = filteredStories();
    const pageCount = Math.max(1, Math.ceil(filtered.length / shelfCapacity));
    shelfPage = Math.min(shelfPage, pageCount - 1);
    const grid = $('book-grid');
    const libraryArt = $('library-art');
    libraryArt.hidden = !assets.library.image;
    if (assets.library.image && !libraryArt.firstChild) addImage(libraryArt, assets.library.image);
    grid.replaceChildren();
    for (const baseStory of filtered.slice(shelfPage * shelfCapacity, (shelfPage + 1) * shelfCapacity)) {
      const story = allStories.find(item => item.id === selectedEditions[baseStory.id]) || baseStory;
      const saved = shelf.sessions[story.id];
      const ended = saved && E.getNode(story, saved).ending;
      const card = button('', 'book-card', () => openStory(story.id));
      card.dataset.storyId = baseStory.id;
      card.style.setProperty('--book-tone', tones[story.number - 1]);
      const art = el('div', 'book-art');
      art.setAttribute('aria-hidden', 'true');
      art.append(el('span', 'book-no', String(story.number).padStart(2, '0')));
      if (coverFor(story)) addImage(art, coverFor(story));
      card.append(art, el('p', 'book-genre', story.genre), el('h2', 'book-title', story.title), el('p', 'book-description', story.hook));
      const bottom = el('div', 'book-card-bottom');
      bottom.append(el('span', '', `結末 ${endingCount(story)} / ${endingsTotal(story)}`), el('strong', '', `${ended ? '結末を開く' : saved ? 'つづきから' : 'この本を開く'}  ↗`));
      card.append(bottom);
      card.setAttribute('aria-label', `${story.number}. ${story.title}。${story.genre}。${saved ? '保存した栞を開く' : '新しく始める'}。結末 ${endingCount(story)} / ${endingsTotal(story)}`);
      grid.append(card);
    }
    if (!filtered.length) {
      const empty = el('div', 'empty-shelf');
      empty.append(el('h2', '', 'その言葉の本は、まだ見つかりません。'), el('p', '', '題名やジャンルの一部で探してみてください。'));
      grid.append(empty);
    }
    $('shelf-page').textContent = `${shelfPage + 1} / ${pageCount}`;
    $('shelf-prev').disabled = shelfPage === 0;
    $('shelf-next').disabled = shelfPage === pageCount - 1;
    $('shelf-summary').textContent = filtered.length === stories.length ? '全20作 · 76の結末' : `${filtered.length}作が見つかりました`;
  }
  function showLibrary() {
    rememberPage();
    active = null;
    shelf.activeStoryId = null;
    $('library-view').hidden = false;
    $('reader-view').hidden = true;
    $('app').classList.remove('is-reading');
    document.title = '二十の分岐 — GAMEBOOK';
    renderLibrary();
    updateMusic();
    persist(true);
  }
  function collectEnding(story, session) {
    const ending = E.getNode(story, session).ending;
    if (!ending) return;
    if (!shelf.endingTrails[story.id]) shelf.endingTrails[story.id] = {};
    if (!shelf.endingTrails[story.id][ending.id]) shelf.endingTrails[story.id][ending.id] = [...session.trail];
  }
  function openStory(id, fresh = false) {
    const story = allStories.find(item => item.id === id);
    if (!story) return;
    rememberPage();
    active = id;
    selectedEditions[baseIdFor(id)] = id;
    shelf.activeStoryId = id;
    if (fresh || !shelf.sessions[id]) {
      shelf.sessions[id] = E.createSession(story);
      shelf.bookmarks[id] = { intro: true, page: 0, nodeId: '01', trailLength: 0 };
    }
    if (!shelf.bookmarks[id]) shelf.bookmarks[id] = { intro: false, page: 0, nodeId: shelf.sessions[id].nodeId, trailLength: shelf.sessions[id].trail.length };
    textPage = bookmark().page;
    textSignature = '';
    measuredSize = '';
    choicePage = 0;
    collectEnding(story, currentSession());
    $('library-view').hidden = true;
    $('reader-view').hidden = false;
    $('app').classList.add('is-reading');
    document.title = `${story.title} — 二十の分岐`;
    renderReader(true);
    persist(true);
  }
  function beginStory() {
    bookmark().intro = false;
    bookmark().page = 0;
    textPage = 0;
    choicePage = 0;
    renderReader(true);
    persist();
  }
  function renderReader(focus = false) {
    if (!active) return;
    const story = currentStory(), session = currentSession(), node = E.getNode(story, session);
    const intro = bookmark().intro;
    const baseId = baseIdFor(story.id);
    $('book-number').textContent = baseId;
    $('book-title').textContent = story.title;
    const versions = editions.filter(edition => edition.baseId === baseId);
    const selector = $('edition-select');
    selector.hidden = versions.length === 0;
    selector.replaceChildren();
    if (versions.length) {
      const first = el('option', '', '初版');
      first.value = baseId;
      selector.append(first);
      versions.forEach(edition => {
        const option = el('option', '', `第${edition.edition}版`);
        option.value = edition.story.id;
        selector.append(option);
      });
      selector.value = story.id;
    }
    $('paper').style.setProperty('--book-tone', tones[story.number - 1]);
    $('chapter-kicker').textContent = intro ? 'PROLOGUE / 物語の前に' : node.ending ? `ENDING ${node.ending.id.slice(1)} / 結末` : `SECTION ${node.id} / 第${Number(node.id)}節`;
    $('chapter-title').textContent = intro ? story.title : node.title;
    $('chapter-subtitle').textContent = intro ? story.genre : node.ending ? node.ending.name : '';
    const art = $('scene-art');
    art.className = 'scene-art';
    art.replaceChildren(el('span', 'scene-number', intro ? String(story.number).padStart(2, '0') : node.id), el('span', 'scene-lines'));
    const imageEntry = sceneFor(story, node.id, intro).image;
    if (imageEntry) addImage(art, imageEntry);
    const fullText = intro ? `あなたの役目\n${story.setup}\nこの物語のルール\n${story.rules.map((rule, index) => `${index + 1}. ${rule}`).join('\n')}` : E.getText(story, session);
    const signature = `${story.id}/${intro}/${session.trail.length}/${session.nodeId}/${fullText}`;
    if (signature !== textSignature) {
      textSignature = signature;
      paragraphs = fullText.split(/\n+/).filter(part => part.length);
      textPages = [];
      measuredSize = '';
    }
    $('reader-text').dataset.fullText = fullText;
    renderRecords();
    $('journey-label').textContent = intro ? `${story.nodes.length}の節 · ${endingsTotal(story)}の結末` : `${session.trail.length}回の選択 · 結末 ${endingCount(story)} / ${endingsTotal(story)}`;
    $('restart-button').hidden = intro;
    $('choice-heading').textContent = intro ? '旅の支度' : node.ending ? 'この物語を閉じる前に' : '次の一手';
    choices = intro ? [{ special: 'begin', label: '物語を始める', detail: '前提とルールはいつでも読み直せます。', primary: true }]
      : node.ending ? [
        { special: 'shelf', label: '本棚へ戻る', detail: 'ほかの物語を開く', primary: true },
        { special: 'endings', label: '集めた結末', detail: `${endingCount(story)} / ${endingsTotal(story)} の結末を読みました。` },
        { special: 'restart', label: 'もう一度、最初から', detail: '結末の記録を残して、新しく始めます。' }
      ] : E.availableChoices(story, session);
    document.querySelector('.reading-layout').dataset.choices = String(choices.length);
    choicePage = 0;
    $('choice-hint').textContent = intro ? 'まず、あなたの役目とルールを。' : node.ending ? 'この結末は本棚に記録されました。' : '選ぶと物語と記録が進みます。';
    updateMusic();
    layoutReader();
    if (focus) $('chapter-title').focus({ preventScroll: true });
  }
  function formatValue(value) {
    if (typeof value === 'boolean') return value ? '記録あり' : '記録なし';
    return String(value);
  }
  function renderRecords() {
    const story = currentStory(), session = currentSession();
    const list = $('state-list');
    list.replaceChildren();
    if (!story.state.length) {
      list.append(el('p', 'state-empty', 'この物語は、足あとだけを記録します。'));
      return;
    }
    for (const field of story.state) {
      const value = session.state[field.id];
      const row = el('div', 'state-row');
      row.dataset.stateId = field.id;
      row.title = `${field.label}：${formatValue(value)}\n${field.meaning}`;
      const valueNode = el('span', `state-value${typeof value === 'boolean' ? value ? ' bool-yes' : ' bool-no' : ''}`, typeof value === 'boolean' ? value ? '✓ 記録あり' : '— 記録なし' : String(value));
      row.append(el('span', 'state-name', field.label), valueNode);
      list.append(row);
    }
  }

  function textNodes(parts, parent) {
    parent.replaceChildren(...parts.map(part => el('p', '', part)));
  }
  function paginate(parts, width, height) {
    const measure = el('div', 'reader-text measure-text');
    measure.style.width = `${Math.floor(width)}px`;
    document.body.append(measure);
    const pages = [];
    let current = [];
    const fits = candidate => {
      textNodes(candidate, measure);
      return measure.getBoundingClientRect().height <= Math.max(1, height - 3);
    };
    const flush = () => { if (current.length) { pages.push(current); current = []; } };
    for (const paragraph of parts) {
      if (fits([...current, paragraph])) { current.push(paragraph); continue; }
      let rest = Array.from(paragraph);
      while (rest.length) {
        let lo = 0, hi = rest.length;
        while (lo < hi) {
          const middle = Math.ceil((lo + hi) / 2);
          if (fits([...current, rest.slice(0, middle).join('')])) lo = middle;
          else hi = middle - 1;
        }
        if (!lo && current.length) { flush(); continue; }
        if (!lo) lo = 1; // Extremely short viewports still permit forward progress.
        let split = lo;
        if (split < rest.length) {
          const minimum = Math.floor(split * .72);
          for (let i = split - 1; i >= minimum; i--) {
            if (/[。！？]/.test(rest[i])) { split = i + 1; break; }
          }
          while (split > 1 && /[「『（〈《【]/.test(rest[split - 1])) split--;
        }
        current.push(rest.slice(0, split).join(''));
        rest = rest.slice(split);
        if (rest.length) flush();
      }
    }
    flush();
    measure.remove();
    return pages.length ? pages : [['']];
  }
  function layoutReader() {
    if (!active || $('reader-view').hidden) return;
    const frame = $('reader-text-frame').getBoundingClientRect();
    if (frame.width < 10 || frame.height < 1) { scheduleLayout(); return; }
    const size = `${Math.floor(frame.width)}:${Math.floor(frame.height)}:${shelf.preferences.fontSize}`;
    if (size !== measuredSize || !textPages.length) {
      const previousOffset = textPages.slice(0, textPage).flat().join('').length;
      const hadPages = textPages.length > 0;
      textPages = paginate(paragraphs, frame.width, frame.height);
      if (hadPages) {
        let offset = 0;
        textPage = 0;
        for (let page = 0; page < textPages.length; page++) {
          if (offset <= previousOffset) textPage = page;
          offset += textPages[page].join('').length;
        }
      }
      textPage = Math.min(Math.max(0, textPage), textPages.length - 1);
      measuredSize = size;
      rememberPage();
    }
    renderTextPage();
    layoutChoices();
  }
  function renderTextPage() {
    textNodes(textPages[textPage] || [], $('reader-text'));
    $('text-page').textContent = `${textPage + 1} / ${textPages.length}`;
    $('text-prev').disabled = textPage === 0;
    $('text-next').disabled = textPage >= textPages.length - 1;
    $('reading-hint').textContent = textPage < textPages.length - 1 ? '右の矢印で、本文のつづきへ' : '読む時間では進みません';
    if (bookmark()?.intro && choices[0]) {
      const more = textPage < textPages.length - 1;
      choices[0].label = more ? '前提を続きを読む' : '物語を始める';
      choices[0].detail = more ? `本文 ${textPage + 1} / ${textPages.length} ページ` : 'あなたの選択で、物語を進めます。';
    }
  }
  function turnText(delta) {
    const next = Math.max(0, Math.min(textPage + delta, textPages.length - 1));
    if (next === textPage) return;
    textPage = next;
    renderTextPage();
    layoutChoices();
    rememberPage();
    persist(true);
  }
  function effectText(choice) {
    if (choice.special) return choice.detail;
    const story = currentStory(), session = currentSession();
    const changed = {};
    for (const effect of choice.effects) {
      const old = Object.hasOwn(changed, effect.var) ? changed[effect.var] : session.state[effect.var];
      changed[effect.var] = effect.op === 'set' ? effect.value : old + effect.value;
    }
    return Object.entries(changed).map(([id, value]) => {
      const field = story.state.find(item => item.id === id);
      const before = session.state[id];
      if (before === value) return '';
      if (typeof value === 'boolean') return `${field.label}：${value ? '記録' : '解除'}`;
      return `${field.label} ${before} → ${value}`;
    }).filter(Boolean).join(' / ');
  }
  function makeChoice(choice, index) {
    const node = button('', `choice-button${choice.primary ? ' primary' : ''}`, () => select(choice));
    if (choice.id) node.dataset.choiceId = choice.id;
    if (choice.special) node.dataset.action = choice.special;
    node.append(el('span', 'choice-index', String(index + 1).padStart(2, '0')));
    const copy = el('span', 'choice-copy');
    copy.append(el('span', 'choice-label', choice.label));
    const effects = effectText(choice);
    if (effects) copy.append(el('span', 'choice-effects', effects));
    node.append(copy, el('span', 'choice-arrow', '→'));
    return node;
  }
  function renderChoiceSet(indices) {
    $('choice-list').classList.toggle('single-choice', indices.length === 1);
    $('choice-list').replaceChildren(...indices.map(index => makeChoice(choices[index], index)));
  }
  function choiceFits() {
    const list = $('choice-list');
    const box = list.getBoundingClientRect();
    if (list.scrollHeight > list.clientHeight + 1) return false;
    return Array.from(list.children).every(node => {
      const rect = node.getBoundingClientRect();
      const copy = node.querySelector('.choice-copy').getBoundingClientRect();
      return rect.bottom <= box.bottom + 1 && node.scrollHeight <= node.clientHeight + 1 && copy.top >= rect.top && copy.bottom <= rect.bottom - 3;
    });
  }
  function layoutChoices() {
    if (!active) return;
    const pager = $('choice-pagination');
    pager.hidden = true;
    $('choice-count').classList.remove('with-pagination');
    $('choice-count').textContent = bookmark().intro ? '' : `${choices.length}つの選択`;
    let indices = choices.map((_, index) => index);
    renderChoiceSet(indices);
    if (choiceFits()) choicePages = [indices];
    else {
      pager.hidden = false;
      $('choice-count').classList.add('with-pagination');
      choicePages = [];
      while (indices.length) {
        let count = indices.length;
        while (count > 1) {
          renderChoiceSet(indices.slice(0, count));
          if (choiceFits()) break;
          count--;
        }
        choicePages.push(indices.slice(0, count));
        indices = indices.slice(count);
      }
    }
    choicePage = Math.min(choicePage, choicePages.length - 1);
    renderChoiceSet(choicePages[choicePage] || []);
    pager.hidden = choicePages.length <= 1;
    $('choice-count').classList.toggle('with-pagination', choicePages.length > 1);
    $('choice-page').textContent = `${choicePage + 1} / ${choicePages.length}`;
    $('choice-prev').disabled = choicePage === 0;
    $('choice-next').disabled = choicePage >= choicePages.length - 1;
  }
  function select(choice) {
    if (inTransition || isImportPending) return;
    if (choice.special) {
      if (choice.special === 'begin') {
        if (textPage < textPages.length - 1) turnText(1);
        else {
          inTransition = true;
          beginStory();
          setTimeout(() => { inTransition = false; }, 320);
        }
      } else if (choice.special === 'shelf') showLibrary();
      else if (choice.special === 'restart') confirmRestart();
      else if (choice.special === 'endings') showEndings();
      return;
    }
    inTransition = true;
    try {
      const story = currentStory();
      const next = E.choose(story, currentSession(), choice.id);
      shelf.sessions[active] = next;
      shelf.bookmarks[active] = { intro: false, page: 0, nodeId: next.nodeId, trailLength: next.trail.length };
      collectEnding(story, next);
      textPage = 0;
      choicePage = 0;
      persist();
      renderReader(true);
    } catch (error) { reportError(error); }
    // Lock through a human double-click; page turns do not use this lock.
    setTimeout(() => { inTransition = false; }, 320);
  }
  function scheduleLayout() {
    if (framePending) return;
    framePending = true;
    requestAnimationFrame(() => {
      framePending = false;
      if (active) layoutReader();
      else if (shelfCapacity !== capacityForShelf()) renderLibrary();
    });
  }

  function modal(title, kicker = 'GAMEBOOK') {
    $('modal-title').textContent = title;
    $('modal-kicker').textContent = kicker;
    $('modal-content').replaceChildren();
    $('modal-footer').replaceChildren();
    $('modal-footer').hidden = true;
    $('modal-content').scrollTop = 0;
    if (!$('modal').open) $('modal').showModal();
    return $('modal-content');
  }
  function closeModal() { $('modal').close(); }
  function modalActions(actions) {
    $('modal-footer').hidden = false;
    $('modal-footer').replaceChildren(...actions.map(action => button(action.label, `action-button${action.secondary ? ' secondary' : ''}${action.danger ? ' danger' : ''}`, action.run)));
  }
  function confirmRestart() {
    if (!active) return;
    const id = active;
    const content = modal('新しい選択で、もう一度。', 'NEW JOURNEY');
    content.append(el('p', '', `『${currentStory().title}』の現在の栞を、物語のはじめに戻します。集めた結末は残ります。`), el('p', 'note', '現在の進行も残したい場合は、先に「セーブ」でファイルを書き出してください。'));
    modalActions([{ label: 'つづきを読む', secondary: true, run: closeModal }, { label: '最初から始める', run: () => { closeModal(); openStory(id, true); } }]);
  }
  function showGuide() {
    const content = modal('本を開いたら、選んで進む。', 'HOW TO PLAY');
    const ol = el('ol');
    [
      '本棚から一作を選び、はじめに「あなたの役目」と作品ごとのルールを読みます。',
      '本文の左右の矢印でページを送ります。キーボードの ← / → でも本文を送れます。',
      '「次の一手」から行動を選ぶと、物語が次の節へ進みます。選べる行動は、その時点の記録によって変わります。',
      '本文の再読、ページ送り、ルールや足あとの閲覧では、時間や所持品は変わりません。足あとは読み返すための記録です。',
      '一度選ぶと、その行動は実行されます。別の選択を試すときは「最初から」で新しいプレイを始めます。集めた結末は本棚に残ります。'
    ].forEach(text => ol.append(el('li', '', text)));
    content.append(ol, el('h3', '', '栞を持ち歩く'), el('p', '', '進行は作品ごとに、このブラウザへ自動保存します。「セーブ」からファイルにも保存できます。別の端末や別のブラウザへ移るときは、そのファイルを読み込んでください。'), el('p', 'note', 'ブラウザのデータを消した場合や、保存が許可されない環境では自動保存を利用できません。大切な栞はファイルでも残してください。'));
  }
  function showRules() {
    if (!active) return;
    const story = currentStory();
    const content = modal('前提とルール', `${story.id} / ${story.title}`);
    content.append(el('h3', '', 'あなたの役目'), el('p', '', story.setup), el('h3', '', 'この物語のルール'));
    const ol = el('ol');
    story.rules.forEach(rule => ol.append(el('li', '', rule)));
    content.append(ol, el('p', 'note', 'ここを読み直しても、進行中の記録は変わりません。'));
  }
  function showRecords() {
    if (!active) return;
    const story = currentStory(), session = currentSession();
    const content = modal('手元の記録', `${story.id} / 現在の節 ${session.nodeId}`);
    if (!story.state.length) content.append(el('p', '', 'この物語には別に管理する数値や品物の記録はありません。現在の節と通った経路に、進行に必要な情報が含まれます。'));
    for (const field of story.state) {
      const row = el('div', 'record-detail');
      row.append(el('span', 'record-now', formatValue(session.state[field.id])), el('strong', '', field.label), el('p', '', field.meaning));
      content.append(row);
    }
    content.append(el('p', 'note', 'この欄の値は、選択した行動の結果です。記録のない事実を、ほかのプレイで読んだ内容から追加することはありません。'));
  }
  function showHistory() {
    if (!active) return;
    const story = currentStory(), session = currentSession();
    const content = modal('ここまでの足あと', `${story.id} / ${session.trail.length}回の選択`);
    content.append(el('p', 'callout', '通った節を読み返せます。いまの栞や記録は動きません。'));
    for (let index = 0; index <= session.trail.length; index++) {
      const past = E.replay(story, session.trail.slice(0, index));
      const node = E.getNode(story, past);
      const action = index < session.trail.length ? node.choices.find(choice => choice.id === session.trail[index]) : null;
      const item = el('div', 'history-item');
      const heading = button('', '', () => {
        const existing = item.querySelector('.history-detail');
        if (existing) { existing.remove(); heading.setAttribute('aria-expanded', 'false'); }
        else { item.append(el('div', 'history-detail', E.getText(story, past))); heading.setAttribute('aria-expanded', 'true'); }
      });
      heading.setAttribute('aria-expanded', 'false');
      const text = el('span', '', `${String(index + 1).padStart(2, '0')}　${node.title}`);
      text.append(el('small', '', action ? `選択：${action.label}` : bookmark().intro ? '物語はまだ始まっていません' : 'いま読んでいる節'));
      heading.append(text, el('span', '', '＋'));
      item.append(heading);
      content.append(item);
    }
  }
  function showEndings() {
    if (!active) return;
    const story = currentStory();
    const content = modal('集めた結末', `${story.id} / ${endingCount(story)} OF ${endingsTotal(story)}`);
    for (const node of story.nodes.filter(item => item.ending)) {
      const trail = shelf.endingTrails[active]?.[node.ending.id];
      const item = el('div', 'collection-item');
      if (trail) {
        const heading = button(`${node.ending.id}　${node.ending.name}　＋`, 'text-button', () => {
          const existing = item.querySelector('.history-detail');
          if (existing) { existing.remove(); heading.setAttribute('aria-expanded', 'false'); }
          else { item.append(el('div', 'history-detail', E.getText(story, E.replay(story, trail)))); heading.setAttribute('aria-expanded', 'true'); }
        });
        heading.setAttribute('aria-expanded', 'false');
        item.append(heading);
      } else item.append(el('span', 'locked', `${node.ending.id}　まだ出会っていない結末`));
      content.append(item);
    }
  }
  function showSettings() {
    const content = modal('読みやすいかたちに。', 'READING SETTINGS');
    const fontRow = el('div', 'setting-row');
    fontRow.append(el('span', 'setting-label', '本文の文字'));
    const fonts = el('div', 'segmented');
    [18, 20, 22, 24].forEach((size, index) => {
      const control = button(['小', '標準', '大', '特大'][index], '', () => {
        shelf.preferences.fontSize = size;
        preferences();
        fonts.querySelectorAll('button').forEach(node => node.setAttribute('aria-pressed', String(node === control)));
        scheduleLayout();
        persist(true);
      });
      control.setAttribute('aria-pressed', String(shelf.preferences.fontSize === size));
      fonts.append(control);
    });
    fontRow.append(fonts);
    const themeRow = el('div', 'setting-row');
    themeRow.append(el('span', 'setting-label', '紙の色'));
    const themes = el('div', 'segmented');
    [['day', '昼'], ['night', '夜']].forEach(([theme, label]) => {
      const control = button(label, '', () => {
        shelf.preferences.theme = theme;
        preferences();
        themes.querySelectorAll('button').forEach(node => node.setAttribute('aria-pressed', String(node === control)));
        persist(true);
      });
      control.setAttribute('aria-pressed', String(shelf.preferences.theme === theme));
      themes.append(control);
    });
    themeRow.append(themes);
    content.append(fontRow, themeRow, el('h3', '', '一画面で、ゆっくり読む'), el('p', '', '本文は画面の広さと文字の大きさに合わせてページに分けます。文字を大きくしたときも、本文の矢印で最後まで読めます。'), el('p', 'note', '選択肢が一度に収まらないときは、選択肢にも専用のページ送りが現れます。'));
  }
  function downloadText(text, filename) {
    const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = el('a');
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function exportSave() {
    rememberPage();
    const valid = S.validateShelf(allStories, shelf);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    downloadText(JSON.stringify(valid, null, 2), `gamebook-save-${stamp}.json`);
    notify('栞のファイルを書き出しました。');
  }
  function showSaves() {
    const content = modal('栞を残す、持ち歩く。', 'SAVE & RESTORE');
    const count = Object.keys(shelf.sessions).length;
    const endings = Object.values(shelf.endingTrails).reduce((sum, item) => sum + Object.keys(item).length, 0);
    content.append(el('p', 'callout', `現在の本棚：${count}件の栞 / ${endings}の結末`), el('p', '', '作品ごとの進行、集めた結末、表示設定を一つのファイルに保存します。別の端末で続きを開くときにも使えます。'));
    const actions = el('div', 'button-row');
    actions.append(button('ファイルに保存', 'action-button', () => { try { exportSave(); } catch (error) { reportError(error); } }), button('ファイルを読み込む', 'action-button secondary', () => { $('import-input').value = ''; $('import-input').click(); }));
    content.append(actions, el('p', 'note', '読み込みは、現在の本棚全体を置き換えます。内容を確認する画面で確定するまでは、進行を変更しません。'));
    if (rawRecovery !== null) {
      content.append(el('h3', '', '以前の保存データを保護しています'), el('p', '', '以前のデータを読み込めなかったため、自動で上書きしていません。原本をファイルに取り出してから、必要に応じて現在の進行で保存を再開できます。'), el('p', 'note', storageError));
      const recovery = el('div', 'button-row');
      recovery.append(button('以前の原本を保存', 'action-button secondary', () => downloadText(rawRecovery, 'gamebook-recovery-original.json')), button('現在の進行で保存を再開', 'action-button secondary', () => {
        const body = modal('以前のデータを置き換えますか。', 'RECOVER SAVE');
        body.append(el('p', '', '読めなかった以前のデータを、いま遊んでいる本棚の進行で置き換えます。必要な場合は、先に原本をファイルへ保存してください。'));
        modalActions([{ label: '戻る', secondary: true, run: showSaves }, { label: '置き換えて保存', run: () => { rawRecovery = null; persist(); showSaves(); } }]);
      }));
      content.append(recovery);
    } else if (externalConflict) {
      content.append(el('h3', '', '別の画面に新しい栞があります'), el('p', '', '開いている別の画面で保存が更新されたため、この画面からの上書きを止めています。まず現在の栞をファイルに残し、どちらを続けるか選んでください。'));
      const conflict = el('div', 'button-row');
      conflict.append(button('別の画面の栞を読み込む', 'action-button secondary', () => {
        try { importFile(new File([localStorage.getItem(STORAGE_KEY) || JSON.stringify(S.createShelf())], 'other-window.json', { type: 'application/json' })); }
        catch (error) { reportError(error); }
      }), button('この画面の栞で保存する', 'action-button secondary', () => {
        const body = modal('この画面の栞で置き換えますか。', 'CHOOSE YOUR SAVE');
        body.append(el('p', '', '別の画面で保存された栞を、この画面の進行で置き換えます。別の画面は閉じてから続けてください。'));
        modalActions([{ label: '戻る', secondary: true, run: showSaves }, { label: 'この栞で保存する', run: () => { externalConflict = false; persist(); showSaves(); } }]);
      }));
      content.append(conflict);
    } else if (storageError) content.append(el('h3', '', '自動保存が使えません'), el('p', '', '現在の進行は画面を開いている間だけ保持しています。閉じる前に、上の「ファイルに保存」をお使いください。'));
  }
  async function importFile(file) {
    if (!file) return;
    isImportPending = true;
    try {
      if (file.size > MAX_IMPORT_BYTES) throw new Error('セーブファイルは2 MB以下を指定してください。');
      const next = readShelf(JSON.parse(await file.text()));
      const count = Object.keys(next.sessions).length;
      const endings = Object.values(next.endingTrails).reduce((sum, item) => sum + Object.keys(item).length, 0);
      const content = modal('この栞を読み込みますか。', 'RESTORE SAVE');
      content.append(el('p', 'callout', `${count}件の栞 / ${endings}の結末`), el('p', '', '現在の本棚を、このファイルの内容で置き換えます。現在の進行を残す場合は、先にファイルへ保存してください。'));
      const exportRow = el('div', 'button-row');
      exportRow.append(button('現在の栞を先に保存', 'action-button secondary', exportSave));
      content.append(exportRow);
      modalActions([{ label: 'キャンセル', secondary: true, run: closeModal }, { label: '置き換えて読み込む', run: () => {
        shelf = next;
        active = null; // Prevent a prior reader page from being copied into the imported bookmark.
        textPages = [];
        rawRecovery = null;
        externalConflict = false;
        preferences();
        closeModal();
        if (shelf.activeStoryId) openStory(shelf.activeStoryId);
        else showLibrary();
        persist();
        notify('栞を読み込みました。');
      } }]);
    } catch (error) {
      const content = modal('このファイルは読み込めません。', 'SAVE CHECK');
      content.append(el('p', '', error instanceof SyntaxError ? 'JSON形式のセーブファイルを選んでください。' : error.message), el('p', 'note', '現在の進行と保存データは変更していません。'));
      modalActions([{ label: 'セーブの管理に戻る', run: showSaves }]);
    } finally { isImportPending = false; }
  }

  try {
    if (!E || !S || !globalThis.GBMusic || !Array.isArray(stories) || stories.length !== 20 || !Array.isArray(globalThis.GB_EDITIONS) || !assets) throw new Error('ゲームのファイルが揃っていません。フォルダ全体を展開し、index.htmlを開いてください。');
    music = globalThis.GBMusic.createPlayer({
      onChange: renderMusicButton,
      onError: () => notify('音楽を再生できませんでした。音楽ボタンからもう一度お試しください。')
    });
    music.setSuspended(document.hidden);
    loadShelf();
    preferences();
    $('brand-button').addEventListener('click', showLibrary);
    $('shelf-button').addEventListener('click', showLibrary);
    $('edition-select').addEventListener('change', event => {
      openStory(event.target.value);
      $('edition-select').focus();
    });
    $('search-input').addEventListener('input', () => { shelfPage = 0; renderLibrary(); });
    $('shelf-prev').addEventListener('click', () => { shelfPage--; renderLibrary(); });
    $('shelf-next').addEventListener('click', () => { shelfPage++; renderLibrary(); });
    $('text-prev').addEventListener('click', () => turnText(-1));
    $('text-next').addEventListener('click', () => turnText(1));
    $('choice-prev').addEventListener('click', () => { choicePage--; layoutChoices(); });
    $('choice-next').addEventListener('click', () => { choicePage++; layoutChoices(); });
    $('settings-button').addEventListener('click', showSettings);
    $('guide-button').addEventListener('click', showGuide);
    $('rules-button').addEventListener('click', showRules);
    $('record-button').addEventListener('click', showRecords);
    $('history-button').addEventListener('click', showHistory);
    $('restart-button').addEventListener('click', confirmRestart);
    $('save-button').addEventListener('click', showSaves);
    $('modal-close').addEventListener('click', closeModal);
    $('modal').addEventListener('click', event => {
      if (event.target !== $('modal')) return;
      const rect = $('modal').getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeModal();
    });
    $('music-button').addEventListener('click', () => music.setEnabled(!music.enabled));
    $('import-input').addEventListener('change', event => importFile(event.target.files[0]));
    document.addEventListener('keydown', event => {
      if (!active || $('modal').open || /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault();
        turnText(event.key === 'ArrowRight' ? 1 : -1);
      }
    });
    window.addEventListener('resize', scheduleLayout);
    if (typeof ResizeObserver === 'function') {
      const observer = new ResizeObserver(scheduleLayout);
      observer.observe($('reader-text-frame'));
      observer.observe($('choice-list'));
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { rememberPage(); persist(true); }
      music.setSuspended(document.hidden);
    });
    window.addEventListener('pagehide', () => { rememberPage(); persist(true); music.setSuspended(true); });
    window.addEventListener('pageshow', () => music.setSuspended(document.hidden));
    // Cross-tab writes are explicit: an already open book never silently jumps.
    window.addEventListener('storage', event => {
      if (event.key === STORAGE_KEY && event.newValue !== JSON.stringify(shelf)) {
        externalConflict = true;
        status('別の画面に新しい栞があります', true);
        notify('別の画面で栞が更新されました。この画面からの自動保存を止めました。「セーブ」で続きを選べます。');
      }
    });
    if (shelf.activeStoryId) openStory(shelf.activeStoryId);
    else { renderLibrary(); updateMusic(); }
    document.documentElement.dataset.gamebookReady = 'true';
  } catch (error) {
    console.error(error);
    $('library-view').replaceChildren(el('div', 'error-panel', error.message));
    status('起動できませんでした', true);
  }
})();
