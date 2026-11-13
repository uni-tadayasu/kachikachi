import { createAudioController } from './audio.js';
import { mountPlay } from './play.js';

const portableRoot = document.querySelector('meta[name="zettai-site-root"]')?.content;
const siteRoot = new URL(portableRoot || '/', location.href);
function fixPortableLinks(scope, pageUrl) {
  if (!portableRoot) return;
  for (const attribute of ['href', 'src', 'action']) {
    for (const element of scope.querySelectorAll('[' + attribute + ']')) {
      const value = element.getAttribute(attribute);
      if (value && !value.startsWith('#')) element.setAttribute(attribute, new URL(value, pageUrl).href);
    }
  }
}
fixPortableLinks(document, location.href);

const byId = id => document.getElementById(id);
const buttonLabel = (button, text) => {
  const label = button?.querySelector('span');
  if (label && label.textContent !== text) label.textContent = text;
};
const toggle = (button, panel, open) => {
  panel.hidden = !open;
  button.setAttribute('aria-expanded', String(open));
};
const audioButton = byId('audio-toggle');
const audioPanel = byId('audio-box');
const menu = byId('site-nav');
const menuButton = byId('menu-toggle');
const musicButton = byId('music-toggle');
const musicVolume = byId('music-volume');
const rate = byId('read-rate');
const status = byId('audio-status');
let readButtons = [];
let readLabels = new Map();
let readingMap = new Map();
let audioState;
function setMenu(open) {
  menu.classList.toggle('is-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
}
const audio = createAudioController({
  onState(state) {
    audioState = state;
    musicButton.setAttribute('aria-pressed', String(state.music));
    buttonLabel(musicButton, state.music ? 'BGMを停止' : 'BGMを再生');
    if (document.activeElement !== musicVolume) musicVolume.value = Math.round(state.musicVolume * 100);
    rate.value = String(state.rate);
    status.textContent = state.message;
    markReading();
  },
});
audioButton.addEventListener('click', () => {
  setMenu(false);
  toggle(audioButton, audioPanel, audioPanel.hidden);
});
byId('audio-close').addEventListener('click', () => {
  toggle(audioButton, audioPanel, false);
  audioButton.focus();
});
menuButton.addEventListener('click', () => {
  toggle(audioButton, audioPanel, false);
  setMenu(menuButton.getAttribute('aria-expanded') === 'false');
});
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (!audioPanel.hidden) {
    toggle(audioButton, audioPanel, false);
    audioButton.focus();
  } else if (menu.classList.contains('is-open')) {
    setMenu(false);
    menuButton.focus();
  }
});
document.addEventListener('click', event => {
  if (!audioPanel.hidden && !audioPanel.contains(event.target) && !audioButton.contains(event.target)) toggle(audioButton, audioPanel, false);
});
musicButton.addEventListener('click', () => audio.toggleMusic());
musicVolume.addEventListener('input', () => audio.setMusicVolume(musicVolume.valueAsNumber / 100));
rate.addEventListener('change', () => audio.setRate(Number(rate.value)));
function markReading() {
  if (!audioState) return;
  for (const button of readButtons) {
    const active = audioState.readingId === button.dataset.read;
    button.disabled = !audioState.canRead;
    button.setAttribute('aria-pressed', String(active));
    buttonLabel(button, active ? '読み上げを停止' : readLabels.get(button));
  }
}

const favoriteKey = 'zettai-kateru-favorites';
const readFavorites = () => {
  try {
    const favorites = JSON.parse(localStorage.getItem(favoriteKey));
    return new Set(Array.isArray(favorites) ? favorites : []);
  } catch {
    return new Set();
  }
};
const favorites = readFavorites();
let favoriteButtons = [];
let favoriteLabels = new Map();
function markFavorites() {
  favoriteButtons.forEach(button => {
    const active = favorites.has(button.dataset.favorite);
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', favoriteLabels.get(button) + (active ? 'をお気に入りから外す' : 'をお気に入りに追加'));
  });
}
const normalize = text => text.normalize('NFKC').toLowerCase().replace(/[ァ-ヶ]/g, char => String.fromCharCode(char.charCodeAt(0) - 96));
let selected;
let query;
let count;
let empty;
let terms;

function filterResults() {
  if (!query) return;
  const tokens = normalize(query.value.trim()).split(/\s+/).filter(Boolean);
  let shown = 0;
  for (const {item,search} of terms) {
    const category = selected === 'all' || item.dataset.type === selected || selected === 'favorites' && favorites.has(item.dataset.item);
    item.hidden = !category || !tokens.every(token => search.includes(token));
    if (!item.hidden) shown++;
  }
  count.textContent = shown + '件';
  empty.hidden = shown !== 0;
}

let disposePlay;
function bindPage() {
  disposePlay?.();
  disposePlay = undefined;
  const play = document.querySelector('[data-play-id]');
  if (play) disposePlay = mountPlay(play, {
    id:play.dataset.playId, title:play.dataset.playTitle, type:play.dataset.playType,
  });
  const remote = document.querySelector('[data-remote-play]');
  const requested = new URLSearchParams(location.search).get('feed');
  if (remote && requested) loadRemotePlay(remote, requested);
  readButtons = [...document.querySelectorAll('[data-read]')];
  readLabels = new Map(readButtons.map(button => [button, button.querySelector('span').textContent]));
  readingMap = new Map(Object.entries(JSON.parse(byId('page-readings')?.textContent || '{}')));
  readButtons.forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.read;
    audio.toggleReading({id, reading: readingMap.get(id)});
  }));
  markReading();

  favoriteButtons = [...document.querySelectorAll('[data-favorite]')];
  favoriteLabels = new Map(favoriteButtons.map(button => [button, button.getAttribute('aria-label').replace(/をお気に入りに追加$/, '')]));
  selected = 'all';
  query = document.querySelector('[data-query]');
  count = document.querySelector('[data-result-count]');
  empty = document.querySelector('[data-empty]');
  terms = [...document.querySelectorAll('[data-result]')].map(item => ({item,search:normalize(item.dataset.search)}));
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  if (query) {
    query.value = new URLSearchParams(location.search).get('q') || '';
    query.addEventListener('input', filterResults);
    filterButtons.forEach(button => button.addEventListener('click', () => {
      selected = button.dataset.filter;
      filterButtons.forEach(entry => entry.setAttribute('aria-pressed', String(entry === button)));
      filterResults();
    }));
    filterResults();
  }
  markFavorites();
  favoriteButtons.forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.favorite;
    if (favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    try { localStorage.setItem(favoriteKey, JSON.stringify([...favorites])); } catch { /* In-memory session remains usable. */ }
    markFavorites();
    filterResults();
  }));
  const feed = document.querySelector('[data-feed]');
  if (feed) loadFeed(feed);
}

function make(tag, text, className) {
  const element = document.createElement(tag);
  if (text) element.textContent = text;
  if (className) element.className = className;
  return element;
}
function sourceLink(url, label) {
  const source = new URL(url);
  if (source.protocol !== 'https:') throw new Error('Unsupported source protocol');
  const a = make('a', label);
  a.href = source.href;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  return a;
}
async function requestFeed() {
  if (!portableRoot) {
    const response = await fetch(new URL('api/catalog-updates',siteRoot)).catch(() => null);
    const payload = response?.ok ? await response.json().catch(() => null) : null;
    if (payload?.items?.length) return {payload,bundled:false};
  }
  const fallback = await fetch(new URL('assets/feed-snapshot.json',siteRoot));
  if (!fallback.ok) throw new Error('Feed unavailable');
  return {payload:await fallback.json(),bundled:true};
}
async function loadRemotePlay(root, id) {
  root.hidden = false;
  root.append(make('p','デモを読み込んでいます。'));
  try {
    const {payload} = await requestFeed();
    if (!root.isConnected) return;
    const item = payload.items?.find(entry => entry.id === id);
    if (!item || !['pachinko','slot'].includes(item.type)) throw new Error('Machine unavailable');
    const host = make('div');
    const link = sourceLink(item.url,'メーカー公式情報 ↗');
    link.className = 'text-link';
    root.replaceChildren(make('h2',item.title),host,link);
    disposePlay = mountPlay(host,item);
    if (location.hash === '#play') root.scrollIntoView({block:'start'});
  } catch {
    if (root.isConnected) root.replaceChildren(make('p','この機種のデモは現在表示できません。下の一覧から遊ぶ機種を選べます。'));
  }
}
async function loadFeed(feed) {
  const message = feed.querySelector('[data-feed-status]');
  try {
    const {payload,bundled} = await requestFeed();
    const {updatedAt,items,sources,stale} = payload;
    if (!Array.isArray(items) || !Array.isArray(sources)) throw new Error('Invalid feed');
    const list = feed.querySelector('[data-feed-list]');
    const typeNames = {pachinko:'パチンコ',slot:'パチスロ'};
    for (const item of items) {
      const li = make('li');
      const a = sourceLink(item.url);
      a.className = 'feed-entry';
      const copy = make('span');
      copy.append(make('strong', item.title), make('small', [item.maker,typeNames[item.type],item.dateLabel].filter(Boolean).join(' ／ ')));
      const arrow = make('span','↗','text-link');
      arrow.setAttribute('aria-hidden','true');
      a.append(copy,arrow);
      const listen = make('button',undefined,'read-button');
      listen.type = 'button';
      listen.dataset.read = 'feed-' + item.id;
      listen.setAttribute('aria-label',item.title + 'を端末の音声で読み上げ');
      listen.append(make('span','読み上げ'));
      listen.addEventListener('click',() => audio.toggleReading({id:listen.dataset.read,text:item.title}));
      if (feed.isConnected) {
        readButtons.push(listen);
        readLabels.set(listen,'読み上げ');
      }
      const play = make('a','遊ぶ','text-link feed-play');
      const demoUrl = new URL('play/',siteRoot);
      demoUrl.searchParams.set('feed',item.id);
      demoUrl.hash = 'play';
      play.href = demoUrl.href;
      play.setAttribute('aria-label',item.title + 'の遊技デモ');
      const actions = make('div',undefined,'feed-actions');
      actions.append(play,listen);
      li.append(a,actions);
      list.append(li);
    }
    if (feed.isConnected) markReading();
    if (sources.length) {
      const sourceList = make('ul',undefined,'source-list');
      for (const source of sources) {
        const li = make('li');
        li.append(sourceLink(source.url, source.name));
        sourceList.append(li);
      }
      feed.querySelector('[data-feed-sources]').append(sourceList);
    }
    if (!items.length) {
      message.textContent = '公式の新着情報は取得できませんでした。下の掲載済み機種をご覧ください。';
      return;
    }
    const when = updatedAt ? new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',dateStyle:'medium',timeStyle:'short'}).format(new Date(updatedAt)) : '';
    message.textContent = (when ? '取得日時 ' + when + ' ／ ' : '') + items.length + '件' + (bundled ? ' ／ 保存済みの公式情報' : stale ? ' ／ 一部の情報は前回取得分です' : '');
  } catch {
    message.textContent = '公式の新着情報は取得できませんでした。下の掲載済み機種をご覧ください。';
  }
}
bindPage();

let activeNavigation;
let currentPage = location.pathname + location.search;
async function navigate(url, push) {
  activeNavigation?.abort();
  const controller = new AbortController();
  activeNavigation = controller;
  try {
    const response = await fetch(url.pathname + url.search, {signal:controller.signal});
    if (!response.ok) throw new Error('Page unavailable');
    const next = new DOMParser().parseFromString(await response.text(),'text/html');
    const nextMain = next.getElementById('main');
    if (!nextMain || controller.signal.aborted) return;
    audio.stopReading();
    const finalUrl = new URL(response.url || url.href);
    fixPortableLinks(next,finalUrl);
    if (push) history.pushState(null,'',finalUrl.pathname + finalUrl.search + url.hash);
    currentPage = finalUrl.pathname + finalUrl.search;
    document.title = next.title;
    byId('main').replaceWith(nextMain);
    byId('page-readings').textContent = next.getElementById('page-readings')?.textContent || '{}';
    const activeHref = next.querySelector('#site-nav [aria-current="page"]')?.getAttribute('href');
    for (const link of menu.querySelectorAll('a')) {
      if (link.getAttribute('href') === activeHref) link.setAttribute('aria-current','page');
      else link.removeAttribute('aria-current');
    }
    setMenu(false);
    bindPage();
    const destination = url.hash && byId(url.hash.slice(1));
    if (destination) destination.scrollIntoView();
    else window.scrollTo({top:0,behavior:'instant'});
    nextMain.setAttribute('tabindex','-1');
    nextMain.focus({preventScroll:true});
  } catch {
    if (!controller.signal.aborted) location.assign(url.href);
  }
}
document.addEventListener('click', event => {
  const link = event.target.closest('a[href]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return;
  const url = new URL(link.href);
  if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
  if (!url.pathname.startsWith(siteRoot.pathname)) return;
  const route = url.pathname.slice(siteRoot.pathname.length);
  if (route && route !== 'index.html' && !/^(machines|guides|glossary|updates|play)\//.test(route)) return;
  event.preventDefault();
  navigate(url,true);
});
document.addEventListener('submit', event => {
  if (!event.target.matches('.hero-search')) return;
  event.preventDefault();
  const url = new URL(event.target.action);
  url.search = new URLSearchParams(new FormData(event.target)).toString();
  navigate(url,true);
});
window.addEventListener('popstate', () => {
  if (location.pathname + location.search !== currentPage) navigate(new URL(location.href),false);
});
