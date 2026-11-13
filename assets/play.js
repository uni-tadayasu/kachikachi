const themes = {
  'yokai-watch': ['紫苑', '#ba9ae8', 53, 28],
  'hane-bastard': ['紅蓮', '#ed927f', 67, 34],
  'godzilla-eva-2': ['紫雷', '#c3a0ef', 108, 1],
  'toaru-index-3': ['蒼光', '#8fcaf1', 61, 34],
  'kamen-rider-black-light': ['黒曜', '#df947f', 49, 24],
  'saint-seiya-ougon': ['黄金', '#edc579', 122, 2],
  'gun-gale-online': ['薄紅', '#efa7cc', 99, 3],
  'juuou-shishi': ['琥珀', '#e9a565', 69, 29],
  'kanokari-slot': ['花明かり', '#f0abd2', 142, 4],
  'hokuto-smart-slot': ['朱火', '#ed8b83', 106, 0],
  'eva-mirai': ['紫電', '#b89be9', 57, 26],
  'im-juggler-ex': ['祝彩', '#eeb981', 135, 1],
  'kaiun-japan-bt': ['若竹', '#a8d2ad', 118, 2],
  'valkyrie-dodeka': ['白銀', '#b4cdec', 63, 28],
};

const motifs = [
  ['星', '<path d="m12 2.8 2.6 5.8 6.4.7-4.7 4.3 1.2 6.3-5.5-3.2-5.5 3.2 1.2-6.3L3 9.3l6.4-.7z"/>'],
  ['宝石', '<path d="M12 2.8 20 8l-1.6 8.8L12 21.2l-6.4-4.4L4 8z"/><path d="M4 8h16M9 8l3 13 3-13-3-5.2z"/>'],
  ['三日月', '<path d="M20.3 15.2A8.8 8.8 0 1 1 9 3.8a8.8 8.8 0 0 0 11.3 11.4Z"/><path d="M17 4v5m-2.5-2.5h5"/>'],
  ['炎', '<path d="M12 2.8c1 5.1 5.7 5.1 5.7 10.4 0 3.9-2.5 6.5-5.7 6.5s-5.7-2.6-5.7-6.5c0-2.3 1-4.6 2.7-6 .1 2 .7 3.4 1.7 4.3 1.5-2.2 1.5-5.6 1.3-8.7Z"/><path d="M10 16.3c0-1.4 1.1-2.1 2-3.7.9 1.6 2 2.3 2 3.7a2 2 0 1 1-4 0Z"/>'],
  ['花', '<path d="M12 6.2c2.8-5.1 8.2-2.5 6.2 2.1 5.6.1 5.1 6.7-.4 7.1 1.6 4.7-3.9 6.8-5.8 2.2-1.9 4.6-7.4 2.5-5.8-2.2-5.5-.4-6-7 .4-7.1-2-4.6 3.4-7.2 5.4-2.1Z"/><circle cx="12" cy="12" r="2.2"/>'],
];

const buttonIcons = {
  launch: '<path d="M5 18 18 5M9 5h9v9"/>',
  spin: '<path d="M19.5 10A7.7 7.7 0 0 0 6 6.3L4 8m0-4v4h4m-3.5 6A7.7 7.7 0 0 0 18 17.7l2-1.7m0 4v-4h-4"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="1.5"/>',
  reset: '<path d="M4 10a8 8 0 1 1 2 7.1M4 4v6h6"/>',
};
const svg = paths => '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>';
const control = (name, label, extra = '') => '<button type="button" class="play-action ' + extra + '" data-play="' + name + '">' + svg(buttonIcons[name.split('-')[0]]) + '<span>' + label + '</span></button>';
const stats = (first, second) => '<dl class="play-stats"><div><dt>' + first + '</dt><dd data-play="total">0</dd></div><div><dt>' + second + '</dt><dd data-play="matches">0</dd></div></dl>';
const pressLabels = ['左リール', '中リール', '右リール'];

function pegMarkup() {
  const rows = [
    [93,125,157,189,221,253,285,317,349],
    [110,142,174,206,238,270,302,334],
    [94,126,158,190,222,254,286,318,350],
    [112,144,176,208,240,272,304,336],
    [124,156,188,220,252,284,316],
  ];
  return rows.map((row,i) => row.map(x => '<circle cx="' + x + '" cy="' + (51 + i * 22) + '" r="2.8"/>').join('')).join('');
}

function pachinkoMarkup() {
  const lanes = [0,1,2,3,4].map((_,i) => '<span data-play-pocket="' + i + '"' + (i === 2 ? ' class="play-target"' : '') + '>' + (i === 2 ? '入賞口' : '・') + '</span>').join('');
  return '<div class="play-board" aria-hidden="true"><svg class="play-pin-board" viewBox="0 0 440 210" preserveAspectRatio="none"><path d="M38 190 38 83Q38 16 103 16H333Q401 16 401 82v106M65 184l12-100Q85 34 125 34h180q51 0 63 50l9 100" class="play-track" fill="none"/><g class="play-pegs">' + pegMarkup() + '</g><path d="m200 160 20 13 20-13m-20 7v14" class="play-gate" fill="none"/></svg><div class="play-pockets">' + lanes + '</div><span class="play-ball" data-play="ball" hidden></span></div><div class="play-slider"><label for="demo-strength">発射の強さ</label><input id="demo-strength" type="range" min="10" max="100" value="55" step="1" data-play="strength"><output data-play="power" for="demo-strength">55</output></div><div class="play-buttons">' + control('launch','球を打つ','play-primary') + control('reset','リセット') + '</div>' + stats('打った球','入賞した球');
}

function slotMarkup() {
  const reels = pressLabels.map((label,i) => '<div class="play-reel"><span class="play-reel-label">' + label + '</span><div class="play-reel-window" role="img" data-play-reel="' + i + '" aria-label="' + label + '"></div>' + control('stop-' + i,'停止') + '</div>').join('');
  return '<div class="play-reels">' + reels + '</div><div class="play-buttons">' + control('spin','リールを回す','play-primary') + control('reset','リセット') + '</div>' + stats('回した回数','3つ揃い');
}

export function mountPlay(root, {id, title, type} = {}) {
  if (!root || (type !== 'pachinko' && type !== 'slot')) return () => {};
  const [theme, color, pace, variation] = themes[id] || ['金彩','#edc579',type === 'pachinko' ? 55 : 112,type === 'pachinko' ? 28 : 0];
  const pachinko = type === 'pachinko';
  const hint = pachinko ? '強さを変えて、中央の入賞口を狙います。' : '回転中に、3つのリールを好きな順番で止めます。';
  const variationNote = pachinko ? '入賞口を狙いやすい強さや球のばらつきは、デモごとに異なります。' : 'リールの回転速度と開始時の絵柄は、デモごとに異なります。';
  const panel = document.createElement('div');
  panel.className = 'play-demo';
  panel.style.setProperty('--play-accent', color);
  panel.innerHTML = '<div class="play-demo-head"><span>' + theme + ' <span aria-hidden="true">·</span> ' + (pachinko ? 'パチンコ' : 'パチスロ') + '</span><small>無料の操作体験</small></div><div class="play-demo-body"><div class="play-instructions"><p data-play="title"></p><p>' + hint + '</p></div>' + (pachinko ? pachinkoMarkup() : slotMarkup()) + '<p class="play-status" data-play="status" role="status" aria-live="polite"></p><p class="play-note">操作体験用の独自ルールです。実機の挙動・当選確率とは異なります。金銭・景品のやり取りはありません。' + variationNote + '</p></div>';
  panel.querySelector('[data-play="title"]').textContent = title || '遊技デモ';
  root.replaceChildren(panel);

  const listeners = new AbortController();
  const query = name => panel.querySelector('[data-play="' + name + '"]');
  const on = (node,event,handler) => node.addEventListener(event,handler,{signal:listeners.signal});
  const status = query('status');
  const totalView = query('total');
  const matchesView = query('matches');
  const reset = query('reset');
  let total = 0;
  let matches = 0;

  function show(message) {
    status.textContent = message;
    totalView.textContent = String(total);
    matchesView.textContent = String(matches);
  }
  const cleanup = pachinko ? wirePachinko({panel,query,on,reset,show}) : wireSlot({panel,query,on,reset,show});
  return () => {
    listeners.abort();
    cleanup();
    panel.remove();
  };

  function wirePachinko({panel,query,on,reset,show}) {
    const button = query('launch');
    const power = query('strength');
    const ball = query('ball');
    const pockets = [...panel.querySelectorAll('[data-play-pocket]')];
    let pending = 0;
    let animation;
    let moving = false;
    const idle = '発射ボタンを押すと球が動きます。';

    function resetBall() {
      clearTimeout(pending);
      animation?.cancel();
      moving = false;
      ball.hidden = true;
      button.removeAttribute('aria-disabled');
      for (const pocket of pockets) pocket.classList.remove('is-landed');
    }

    on(power,'input',() => { query('power').value = power.value; });
    on(button,'click',() => {
      if (moving) return;
      resetBall();
      moving = true;
      button.setAttribute('aria-disabled','true');
      ball.hidden = false;
      total++;
      show('球が盤面を移動中です。');
      const drift = (Math.random() - .5) * variation;
      const target = Math.max(0,Math.min(4,Math.round(2 + (power.valueAsNumber - pace + drift) / 22.5)));
      const landing = 22 + 14 * target;
      const fromRight = power.valueAsNumber > 58;
      const bounce = (x,y,offset) => ({left:x+'%',top:y+'%',offset});
      const frames = [
        bounce(8,87,0),
        bounce(8,38,.16),
        bounce(23,8,.32),
        bounce(fromRight ? 77 : 49,11,.48),
        bounce(landing + 8,37,.64),
        bounce(landing - 7,51,.75),
        bounce(landing + 4,67,.87),
        bounce(landing,87,1),
      ];
      const instant = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const duration = instant ? 90 : 1250;
      if (!instant && ball.animate) animation = ball.animate(frames,{duration,fill:'forwards',easing:'linear'});
      else Object.assign(ball.style,{left:landing+'%',top:'87%'});
      pending = setTimeout(() => {
        moving = false;
        button.removeAttribute('aria-disabled');
        pockets[target].classList.add('is-landed');
        if (target === 2) {
          matches++;
          show('中央の入賞口に入りました。');
        } else {
          show('中央を外れました。強さを変えて試せます。');
        }
      },duration);
    });
    on(reset,'click',() => {
      resetBall();
      power.value = '55';
      query('power').value = '55';
      total = matches = 0;
      show(idle);
    });
    show(idle);
    return resetBall;
  }

  function wireSlot({panel,query,on,reset,show}) {
    const reels = [...panel.querySelectorAll('[data-play-reel]')];
    const stops = reels.map((_,i) => query('stop-'+i));
    const spin = query('spin');
    const startValues = [0,1,2].map(value => (value + variation) % motifs.length);
    const values = [...startValues];
    const spinning = [false,false,false];
    const idle = '回転ボタンを押すとリールが動きます。';
    let clock = 0;

    function draw(i) {
      const [label,shape] = motifs[values[i]];
      reels[i].innerHTML = svg(shape);
      if (!spinning[i]) reels[i].setAttribute('aria-label',pressLabels[i]+' '+label);
      reels[i].dataset.motif = String(values[i]);
    }

    function stopClock() {
      clearInterval(clock);
      clock = 0;
      spinning.fill(false);
      for (const reel of reels) reel.classList.remove('is-spinning');
      for (const stop of stops) stop.setAttribute('aria-disabled','true');
      spin.removeAttribute('aria-disabled');
    }

    function stop(i) {
      if (!spinning[i]) return;
      spinning[i] = false;
      reels[i].classList.remove('is-spinning');
      draw(i);
      stops[i].setAttribute('aria-disabled','true');
      if (spinning.some(Boolean)) {
        show(pressLabels[i]+'は「'+motifs[values[i]][0]+'」で止まりました。');
        return;
      }
      stopClock();
      total++;
      const result = values.map(value => motifs[value][0]).join('・');
      if (values.every(value => value === values[0])) {
        matches++;
        show('絵柄が3つ揃いました。 '+result);
      } else {
        show('停止した絵柄は '+result+' です。');
      }
    }

    on(spin,'click',() => {
      if (clock) return;
      spinning.fill(true);
      spin.setAttribute('aria-disabled','true');
      for (let i=0;i<reels.length;i++) {
        reels[i].classList.add('is-spinning');
        reels[i].setAttribute('aria-label',pressLabels[i]+' 回転中');
        stops[i].removeAttribute('aria-disabled');
        values[i] = Math.floor(Math.random() * motifs.length);
        draw(i);
      }
      const interval = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 400 : pace;
      clock = setInterval(() => {
        for (let i=0;i<reels.length;i++) {
          if (!spinning[i]) continue;
          values[i] = (values[i] + i + 1) % motifs.length;
          draw(i);
        }
      },interval);
      show('リールが回転しています。停止ボタンを押してください。');
    });
    stops.forEach((button,i) => {
      on(button,'click',() => stop(i));
      button.setAttribute('aria-label',pressLabels[i]+'を停止');
    });
    on(reset,'click',() => {
      stopClock();
      total = matches = 0;
      for (let i=0;i<reels.length;i++) {
        values[i] = startValues[i];
        draw(i);
      }
      show(idle);
    });
    stopClock();
    reels.forEach((_,i) => draw(i));
    show(idle);
    return stopClock;
  }
}
