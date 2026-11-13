import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { uiIcons } from './ui-icons.mjs';

const origin = (process.argv[2] ?? 'https://portable.example.invalid').replace(/\/$/, '');
const read = name => JSON.parse(readFileSync(new URL('../content/' + name + '.json', import.meta.url), 'utf8'));
const machines = read('machines').sort((a,b) => Number(Boolean(a.upcoming)) - Number(Boolean(b.upcoming)) || b.date.localeCompare(a.date));
const { guides, terms } = read('editorial');
const brand = '絶対勝てる！';
const categories = {pachinko:'パチンコ',slot:'パチスロ',common:'共通'};
const paths = new Map();
const fixedReadings = read('readings');
const readings = new Map(fixedReadings.map(item => [item.id,item.reading]));
for (const m of machines) readings.set('machine-'+m.id,[m.reading,m.summaryReading,m.specsReading].filter(Boolean).join('。'));
for (const g of guides) readings.set('guide-'+g.id,[g.reading,g.summaryReading,...g.sections.flatMap(s=>[s.reading,s.textReading])].join('。'));
for (const t of terms) readings.set('term-'+t.id,[t.reading,t.definitionReading].join('。'));

const icons = {
  search:'<circle cx="10.5" cy="10.5" r="5.8"/><path d="m15 15 4.4 4.4"/>',
  machine:'<rect x="4" y="2.8" width="16" height="18.4" rx="2.3"/><path d="M7.5 6.5h9v8h-9zM8 18h1m3 0h1m3 0h1"/><circle cx="12" cy="10.5" r="1.4"/>',
  slot:'<rect x="3.1" y="4.3" width="17.8" height="15.4" rx="2.3"/><path d="M6.1 8.3h11.8v6H6.1zM10 8.3v6m4-6v6m-6 3h1m6 0h1"/>',
  book:'<path d="M12 6c-2.8-2.1-5.9-2.5-9-1.5v14c3.1-1 6.2-.6 9 1.5 2.8-2.1 5.9-2.5 9-1.5v-14c-3.1-1-6.2-.6-9 1.5v14"/>',
  glossary:'<path d="M5 4.5h14v15H5zM8 8h8M8 12h8m-8 4h4M2.8 8h2.2m-2.2 4h2.2m-2.2 4h2.2"/>',
  sound:'<path d="M4 9v6h4l4 3.2V5.8L8 9H4m11-.1a4.4 4.4 0 0 1 0 6.2m2.7-8.9a8.2 8.2 0 0 1 0 11.6"/>',
  note:'<path d="M9 18V6l11-2.5v11M9 8l11-2.5"/><ellipse cx="6.3" cy="18" rx="2.7" ry="1.9"/><ellipse cx="17.3" cy="14.5" rx="2.7" ry="1.9"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  close:'<path d="m6 6 12 12M18 6 6 18"/>',
  arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
  external:'<path d="M14 4h6v6m0-6-9 9m7 0v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/>',
  bookmark:'<path d="M6 4h12v16l-6-4-6 4z"/>',
  info:'<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5m0-8h.01"/>',
  play:'<path d="M5 6.5 12 3l7 3.5v11L12 21l-7-3.5z"/><path d="m10 8 6 4-6 4z"/>',
  ...uiIcons,
  machine:uiIcons.catalog,
  book:uiIcons.guide,
  updates:uiIcons.news
};
const icon = name => '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24">' + icons[name] + '</svg>';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arrows = icon('arrow');
const dateLabel = iso => iso ? iso.replaceAll('-', '.') : '';
const nav = [['/','ホーム',''],['/machines/','機種データ','machine'],['/play/','遊技デモ','play'],['/guides/','遊技ガイド','book'],['/glossary/','用語集','glossary'],['/updates/','新着情報','updates']];
const logo = '<a class="brand" href="/"><img src="/assets/logo.svg" width="40" height="40" alt=""><span><b>' + brand + '</b><small>PACHINKO &amp; PACHISLOT</small></span></a>';
const readButton = (id, label='読み上げ') => `<button type="button" class="read-button" data-read="${esc(id)}" aria-pressed="false">${icon('sound')}<span>${label}</span></button>`;
const external = (url,label) => `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`;

function header(active) {
  return `<a href="#main" class="skip">本文へ移動</a><header class="header"><div class="wrap header-inner">${logo}<nav id="site-nav" class="nav" aria-label="主なメニュー">${nav.map(([path,label]) => `<a href="${path}"${path===active?' aria-current="page"':''}>${label}</a>`).join('')}</nav><div class="header-actions"><button type="button" id="audio-toggle" class="audio-toggle" aria-expanded="false" aria-controls="audio-box">${icon('sound')} 音声設定</button><button type="button" class="icon-button menu-toggle" id="menu-toggle" aria-controls="site-nav" aria-expanded="false" aria-label="メニュー">${icon('menu')}</button></div></div><div id="audio-box" class="audio-box" hidden><div class="audio-heading"><strong>音声設定</strong><button id="audio-close" class="icon-button" type="button" aria-label="閉じる">${icon('close')}</button></div><div class="audio-row"><span>Hear your voice</span><button id="music-toggle" class="button" type="button" aria-pressed="false">${icon('note')}<span>BGMを再生</span></button></div><div class="audio-row"><label for="music-volume">BGM音量</label><input id="music-volume" type="range" min="0" max="100" value="25"></div><div class="audio-row"><label for="read-rate">読み上げ速度</label><select id="read-rate" class="filter"><option value="0.7">0.7倍</option><option value="0.85">0.85倍</option><option value="1" selected>1.0倍</option><option value="1.15">1.15倍</option><option value="1.3">1.3倍</option><option value="1.5">1.5倍</option></select></div><small>再生ボタンを押すと音が出ます。出力先は端末の音声設定に従います。</small><p id="audio-status" role="status" aria-live="polite"></p></div></header>`;
}
const footer = `<aside class="notice"><div class="wrap">${icon('info')}<p>遊技の結果を確実にする方法はありません。パチンコ・パチスロホールへの入場は18歳以上です。</p></div></aside><footer class="footer"><div class="wrap">${logo}<p>読み上げ音声 © MMDAgent Project Team, 名古屋工業大学<br>Open JTalk / HTS Voice “Mei” · ${external('https://creativecommons.org/licenses/by/3.0/','CC BY 3.0')}</p></div></footer>`;

function page({path,title,desc,active=path,body,type='website'}) {
  const fullTitle = path==='/' ? brand+'｜パチンコ・パチスロ機種情報と遊技ガイド' : title+'｜'+brand;
  const url = origin+path;
  const json = JSON.stringify({'@context':'https://schema.org','@type':type==='article'?'Article':path==='/'?'WebSite':'WebPage',name:title,description:desc,url,inLanguage:'ja-JP',...(type==='article'?{headline:title,publisher:{'@type':'Organization',name:brand}}:{})}).replace(/</g,'\\u003c');
  const activeReadings = {};
  for (const match of body.matchAll(/data-read="([^"]+)"/g)) activeReadings[match[1]] = readings.get(match[1]);
  const readingData = JSON.stringify(activeReadings).replace(/</g,'\\u003c');
  const output = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#0b0c0e"><title>${esc(fullTitle)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${url}"><meta property="og:site_name" content="${brand}"><meta property="og:title" content="${esc(fullTitle)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:type" content="${type}"><meta property="og:locale" content="ja_JP"><meta property="og:url" content="${url}"><meta property="og:image" content="${origin}/assets/ogp.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="金の勝の紋章と絶対勝てる！のサイト名"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/assets/favicon.ico" sizes="any"><link rel="icon" href="/assets/logo.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest"><link rel="stylesheet" href="/assets/site.css?v=6"><link rel="stylesheet" href="/assets/play.css?v=1"><script type="application/ld+json">${json}</script><script type="application/json" id="page-readings">${readingData}</script><script type="module" src="/assets/site.js?v=5"></script></head><body>${header(active)}<main id="main">${body}</main>${footer}</body></html>`;
  const file = join('dist', path, 'index.html');
  mkdirSync(dirname(file), {recursive:true});
  writeFileSync(file, output);
  paths.set(path, url);
}

function subhead({title,desc,kicker,crumb,readId,extra=''}) {
  return `<div class="page-head"><div class="wrap"><div class="crumbs"><a href="/">ホーム</a><span aria-hidden="true">/</span>${crumb?`<a href="${crumb[0]}">${crumb[1]}</a><span aria-hidden="true">/</span>`:''}<span>${esc(title)}</span></div><div class="kicker">${kicker}</div><h1>${esc(title)}</h1>${desc?`<p>${esc(desc)}</p>`:''}${readId?readButton(readId, 'このページを読み上げ'):''}${extra}</div></div>`;
}
function machineCard(m, demoFirst = false) {
  const search = [m.title,m.reading,m.maker,m.summary].join(' ');
  return `<article class="machine-card" data-result data-type="${m.type}" data-search="${esc(search)}" data-item="${m.id}"><div class="machine-art ${m.type}">${icon(m.type==='slot'?'slot':'pachinko')}<span class="card-category">${categories[m.type]}</span><button class="icon-button card-favorite" type="button" data-favorite="${m.id}" aria-pressed="false" aria-label="${esc(m.title)}をお気に入りに追加">${icon('bookmark')}</button></div><div class="machine-body"><div class="machine-meta"><span>${esc(m.maker)}</span>${m.date?`<span>${m.upcoming?'導入予定 ':''}${dateLabel(m.date)}</span>`:''}</div><h3><a href="/machines/${m.id}/">${esc(m.title)}</a></h3><p>${esc(m.summary)}</p><a class="text-link" href="/machines/${m.id}/" aria-label="${esc(m.title)}の詳細を見る">機種詳細 ${arrows}</a><a class="text-link play-link${demoFirst?' play-prominent':''}" href="/machines/${m.id}/#play" aria-label="${esc(m.title)}の遊技デモ">${icon('play')} 遊ぶ</a></div></article>`;
}
const guideCards = guides.map(g => `<a class="guide-card art-guide" href="/guides/${g.id}/"><span class="quick-symbol">${icon('book')}</span><div><h3>${esc(g.title)}</h3><p>${esc(g.summary)}</p></div>${arrows}</a>`).join('');
const quick = [['/machines/','machine','機種データ','新機種・定番機種を検索'],['/guides/','book','遊技ガイド','遊技の基本と設定差'],['/glossary/','glossary','用語集','用語の意味を音声でも'],['/play/','play','遊技デモ','パチンコ・パチスロを体験']].map(([href,key,title,text])=>`<a class="quick-link art-${key}" href="${href}"><span class="quick-symbol">${icon(key)}</span><span class="quick-copy"><strong>${title}</strong><small>${text}</small></span>${arrows}</a>`).join('');
const homeDescription = 'メーカー公式情報をもとに、パチンコ・パチスロの機種スペック、設定差、遊技の仕組みを解説。機種検索、遊技デモ、音声付きガイド・用語集を掲載。';
page({path:'/',title:brand,desc:homeDescription,body:`<section class="hero"><img class="hero-art" src="/assets/hero.webp" alt="" width="1600" height="800" fetchpriority="high"><div class="wrap"><div class="hero-content"><div class="kicker">PACHINKO &amp; PACHISLOT GUIDE</div><h1>${brand}</h1><p class="hero-lede">パチンコ・パチスロの機種情報と遊技ガイド</p><p class="hero-description">メーカー公式の情報をもとに、機種スペック、設定差、遊技の仕組みを解説します。</p><form class="hero-search" action="/machines/" role="search">${icon('search')}<input type="search" name="q" aria-label="機種名・メーカー名" placeholder="機種名・メーカー名で検索"><button class="button primary" type="submit">検索</button></form><div class="hero-links"><a class="text-link hero-play" href="/play/">${icon('play')} 遊技デモで遊ぶ</a><a class="text-link" href="/updates/">メーカー新着情報 ${arrows}</a>${readButton('home','サイト案内を聞く')}</div></div></div></section><div class="wrap quick">${quick}</div><section class="section"><div class="wrap"><div class="section-head"><div><div class="kicker">MACHINE DATABASE</div><h2>注目の新機種</h2></div><a href="/machines/" class="text-link">すべての機種 ${arrows}</a></div><div class="card-grid">${[machines[0], machines.find(m=>m.type==='slot'), machines.find(m=>m.id==='toaru-index-3')].filter(Boolean).map(m=>machineCard(m)).join('')}</div></div></section><section class="section"><div class="wrap"><div class="section-head"><div><div class="kicker">PLAY GUIDE</div><h2>遊技ガイド</h2></div></div><div class="guide-grid">${guideCards}</div></div></section>`});

function filters(kind, labels, placeholder) {
  return `<div class="control-panel" data-controls="${kind}"><label class="searchline">${icon('search')}<input type="search" aria-label="${placeholder}" placeholder="${placeholder}" data-query></label><div class="filters" aria-label="カテゴリー">${labels.map(([value,label])=>`<button class="filter" type="button" data-filter="${value}" aria-pressed="${value==='all'}">${label}</button>`).join('')}</div></div><p class="results-note" data-result-count role="status"></p>`;
}
const catalogTitle = '機種データベース';
const catalogDesc = 'メーカーの公式情報から、パチンコ・パチスロの機種スペックと導入時期を確認できます。';
page({path:'/machines/',title:catalogTitle,desc:catalogDesc,body:`${subhead({title:catalogTitle,desc:catalogDesc,kicker:'Machine database',readId:'catalog'})}<div class="wrap page-content">${filters('machine',[['all','すべて'],['pachinko','パチンコ'],['slot','パチスロ'],['favorites','お気に入り']],'機種名・メーカー名で検索')}<div class="card-grid">${machines.map(m=>machineCard(m)).join('')}</div><p class="empty" data-empty hidden>条件に一致する機種はありません。</p></div>`});
for (const m of machines) {
  const title=m.title;
  const specs=m.specs.map(s=>`<div><dt>${esc(s.label)}</dt><dd>${esc(s.value)}</dd></div>`).join('');
  const meta=[m.maker,categories[m.type],m.date?(m.upcoming?'導入予定 ':'導入 ')+dateLabel(m.date):''].filter(Boolean).join(' ／ ');
  const related=terms.filter(t=>m.summary.includes(t.title)||m.specs.some(s=>s.label.includes(t.title))).slice(0,5);
  page({path:'/machines/'+m.id+'/',title,desc:m.summary,active:'/machines/',type:'article',body:`${subhead({title,desc:meta,kicker:'Machine data',crumb:['/machines/','機種データ'],readId:'machine-'+m.id,extra:`<a href="#play" class="button demo-jump">${icon('play')} 無料で遊ぶ</a>`})}<div class="wrap page-content machine-detail"><section id="play" class="demo-section" aria-labelledby="demo-title"><div class="section-head"><div><h2 id="demo-title">遊技デモ</h2><p>ブラウザで遊べる無料の体験版です。</p></div>${readButton('play-'+m.type,'遊び方を聞く')}</div><div data-play data-play-id="${m.id}" data-play-title="${esc(title)}" data-play-type="${m.type}"><p role="status">デモを読み込んでいます。</p></div><noscript>遊技デモにはJavaScriptが必要です。</noscript></section><div class="prose"><section><h2>機種の特徴</h2><p>${esc(m.summary)}</p></section><section><h2>公表スペック</h2><dl class="specs">${specs}</dl></section>${related.length?`<section><h2>関連用語</h2><ul class="source-list">${related.map(t=>`<li><a href="/glossary/#${t.id}">${esc(t.title)}</a></li>`).join('')}</ul></section>`:''}<section><h2>出典</h2><ul class="source-list"><li>${external(m.url,m.maker+'公式 機種情報')}</li>${m.additionalSource?`<li>${external(typeof m.additionalSource==='string'?m.additionalSource:m.additionalSource.url,'メーカー公式の補足情報')}</li>`:''}</ul></section></div></div>`});
}
const playTitle='遊技デモ';
const playDesc='パチンコの打ち出しとパチスロのリール操作を、機種ごとの無料デモで体験できます。';
page({path:'/play/',title:playTitle,desc:playDesc,body:`${subhead({title:playTitle,desc:playDesc,kicker:'Free play',readId:'play'})}<div class="wrap page-content"><section id="play" class="demo-section remote-demo" data-remote-play hidden aria-label="遊技デモ"></section>${filters('machine',[['all','すべて'],['pachinko','パチンコ'],['slot','パチスロ']],'遊ぶ機種を検索')}<div class="card-grid">${machines.map(m=>machineCard(m,true)).join('')}</div><p class="empty" data-empty hidden>条件に一致する機種はありません。</p></div>`});
const guidesTitle='遊技ガイド';
const guidesDesc='遊技の基本、設定差、試行回数、予算・収支を、機種を問わず使える考え方から解説します。';
page({path:'/guides/',title:guidesTitle,desc:guidesDesc,body:`${subhead({title:guidesTitle,desc:guidesDesc,kicker:'Play guide',readId:'guides'})}<div class="wrap page-content"><div class="guide-grid">${guideCards}</div></div>`});
function addTermLinks(value) {
  const lookup = new Map(terms.map(t=>[t.title,t]));
  const pattern = [...lookup.keys()].sort((a,b)=>b.length-a.length).map(value=>value.replace(/[.*+?^$${}()|[\]\\]/g,'\\$&')).join('|');
  if (!pattern) return esc(value);
  return value.split(new RegExp('('+pattern+')','g')).map(piece=>lookup.has(piece)?`<a class="term-link" href="/glossary/#${lookup.get(piece).id}">${esc(piece)}</a>`:esc(piece)).join('');
}
for (const g of guides) {
  const sections=g.sections.map(s=>`<section><h2>${esc(s.title)}</h2><p>${addTermLinks(s.text)}</p></section>`).join('');
  page({path:'/guides/'+g.id+'/',title:g.title,desc:g.summary,active:'/guides/',type:'article',body:`${subhead({title:g.title,desc:g.summary,kicker:'Play guide',crumb:['/guides/','遊技ガイド'],readId:'guide-'+g.id})}<article class="wrap page-content prose">${sections}<section><h2>参考資料</h2><ul class="source-list">${g.sources.map(s=>`<li>${external(s.url,s.label)}</li>`).join('')}</ul></section></article>`});
}
const glossaryTitle='遊技用語集';
const glossaryDesc='パチンコ・パチスロの用語を検索できます。意味は文字と音声の両方で確認できます。';
page({path:'/glossary/',title:glossaryTitle,desc:glossaryDesc,body:`${subhead({title:glossaryTitle,desc:glossaryDesc,kicker:'Glossary',readId:'glossary'})}<div class="wrap page-content">${filters('term',[['all','すべて'],['pachinko','パチンコ'],['slot','パチスロ'],['common','共通']],'用語・よみで検索')}<div class="term-list">${terms.map(t=>`<article class="term-card" data-result data-type="${t.category}" data-search="${esc(t.title+' '+t.reading+' '+t.definition)}" id="${t.id}"><div class="term-category">${categories[t.category]}</div><h2><ruby>${esc(t.title)}<rt>${esc(t.reading)}</rt></ruby></h2><p>${esc(t.definition)}</p>${readButton('term-'+t.id)}</article>`).join('')}</div><p class="empty" data-empty hidden>条件に一致する用語はありません。</p></div>`});
const updatesTitle='メーカー新着情報';
const updatesDesc='対応メーカーの公式製品一覧から取得した機種情報です。導入時期や仕様の詳細は各メーカーでご確認ください。';
page({path:'/updates/',title:updatesTitle,desc:updatesDesc,body:`${subhead({title:updatesTitle,desc:updatesDesc,kicker:'Manufacturer updates',readId:'updates'})}<div class="wrap page-content"><div class="feed" data-feed><h2>公式製品一覧</h2><p class="results-note" data-feed-status role="status">公式情報を確認しています。</p><ul class="feed-list" data-feed-list></ul><div data-feed-sources></div></div><section class="feed"><h2>掲載済みの新機種・導入予定</h2><div class="card-grid">${machines.filter((m,i)=>i<3||m.upcoming).map(m=>machineCard(m)).join('')}</div></section></div>`});
writeFileSync('dist/robots.txt','User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: '+origin+'/sitemap.xml\n');
writeFileSync('dist/sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+[...paths.values()].map(url=>'<url><loc>'+url+'</loc></url>').join('')+'</urlset>\n');
writeFileSync('dist/site.webmanifest', JSON.stringify({name:brand,short_name:brand,start_url:'/',display:'standalone',lang:'ja',theme_color:'#0b0c0e',background_color:'#0b0c0e',icons:[{src:'/assets/icon-192.png',sizes:'192x192',type:'image/png'}]}));
console.log('Rendered '+paths.size+' HTML pages.');
