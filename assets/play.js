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
  sound: '<path d="M3 9h4l5-4v14l-5-4H3zM16 8c2 2 2 6 0 8m2.5-10.5c3.4 3.4 3.4 9.6 0 13"/>',
  music: '<path d="M9 17V6l11-3v12M9 10l11-3"/><ellipse cx="6.5" cy="17.5" rx="2.5" ry="1.7"/><ellipse cx="17.5" cy="15.5" rx="2.5" ry="1.7"/>',

};
const svg = paths => '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>';
const control = (name, label, extra = '') => '<button type="button" class="play-action ' + extra + '" data-play="' + name + '">' + svg(buttonIcons[name.split('-')[0]]) + '<span>' + label + '</span></button>';
const stats = (first, second) => '<dl class="play-stats"><div><dt>' + first + '</dt><dd data-play="total">0</dd></div><div><dt>' + second + '</dt><dd data-play="matches">0</dd></div></dl>';
const pressLabels = ['左リール', '中リール', '右リール'];

const quietMedia = '(prefers-reduced-motion: reduce)';
const soundKey = 'zettai-cabinet-effects';
const scale = [1, 1.05946, 1.12246, 1.18921, 1.25992, 1.33484, 1.41421, 1.49831, 1.5874, 1.68179, 1.7818, 1.88775];

function cabinetSound() {
  let context;
  let enabled = true;
  try { enabled = localStorage.getItem(soundKey) !== 'off'; } catch {}
  function awaken() {
    if (!enabled) return;
    try {
      if (navigator.audioSession) navigator.audioSession.type = "playback";
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;
      context ||= new Audio();
      if (context.state === 'suspended') context.resume().catch(() => {});
    } catch {}
  }
  function play(notes, shape = 'sine') {
    if (!enabled || !context || context.state === 'closed') return;
    try {
      const start = context.currentTime;
      for (const [delay,frequency,length,amplitude,finish = frequency] of notes) {
        const time = start + delay;
        const oscillator = context.createOscillator();
        const envelope = context.createGain();
        oscillator.type = shape;
        oscillator.frequency.setValueAtTime(frequency,time);
        oscillator.frequency.exponentialRampToValueAtTime(finish,time+length);
        envelope.gain.setValueAtTime(.0001,time);
        envelope.gain.exponentialRampToValueAtTime(amplitude,time+.012);
        envelope.gain.exponentialRampToValueAtTime(.0001,time+length);
        oscillator.connect(envelope).connect(context.destination);
        oscillator.start(time);
        oscillator.stop(time+length+.01);
      }
    } catch {}
  }
  return {
    awaken,
    play,
    get enabled() { return enabled; },
    toggle() {
      enabled = !enabled;
      try { localStorage.setItem(soundKey,enabled ? 'on' : 'off'); } catch {}
      if (enabled) awaken();
      else this.close();
    },
    close() {
      if (context && context.state !== 'closed') context.close().catch(() => {});
      context = undefined;
    },
  };
}

function pegMarkup() {
  const rows = [
    [91,123,155,187,219,251,283,315,347],
    [103,136,304,337],
    [89,122,152,288,318,351],
    [103,134,306,337],
    [114,148,181,219,257,291,325],
    [132,164,198,240,275,307],
  ];
  return rows.map((row,i) => row.map(x => '<circle cx="' + x + '" cy="' + (63 + i * 28) + '" r="3"/>').join('')).join('');
}

function pachinkoMarkup() {
  const lanes = [0,1,2,3,4].map((_,i) => '<span data-play-pocket="' + i + '"' + (i === 2 ? ' class="play-target"' : '') + '>' + (i === 2 ? '入賞口' : '・') + '</span>').join('');
  return '<div class="play-cabinet"><div class="play-cabinet-top"><span class="play-led"></span><span>発射台</span><span class="play-led"></span></div><div class="play-board" aria-hidden="true"><svg class="play-pin-board" viewBox="0 0 440 268" preserveAspectRatio="none"><path d="M27 238V104C27 44 67 20 118 20h204c52 0 91 25 91 84v134M52 233V108c0-41 25-63 67-63h202c42 0 67 22 67 63v125" class="play-track" fill="none"/><g class="play-pegs">' + pegMarkup() + '</g><path d="m197 205 23 17 23-17m-23 9v18" class="play-gate" fill="none"/></svg><div class="play-display"><span class="play-display-label" data-play="display-label">待機中</span><div class="play-display-symbols" data-play="display-symbols"></div></div><div class="play-pockets">' + lanes + '</div><span class="play-ball" data-play="ball" hidden></span></div><div class="play-console"><div class="play-slider"><label for="demo-strength">発射の強さ</label><input id="demo-strength" type="range" min="10" max="100" value="55" step="1" data-play="strength"><output data-play="power" for="demo-strength">55</output></div><div class="play-buttons">' + control('launch','球を打つ','play-primary') + control('reset','リセット') + '</div></div></div>' + stats('打った球','入賞した球');
}

function slotMarkup() {
  const reels = pressLabels.map((label,i) => '<div class="play-reel"><span class="play-reel-label">' + label + '</span><div class="play-reel-window" role="img" data-play-reel="' + i + '" aria-label="' + label + '"></div>' + control('stop-' + i,'停止') + '</div>').join('');
  return '<div class="play-cabinet"><div class="play-cabinet-top"><span class="play-led"></span><span data-play="display-label">リール待機中</span><span class="play-led"></span></div><div class="play-reels">' + reels + '</div><div class="play-console"><div class="play-buttons">' + control('spin','リールを回す','play-primary') + control('reset','リセット') + '</div></div></div>' + stats('回した回数','3つ揃い');
}

export function mountPlay(root, {id, title, type, onMusicToggle} = {}) {
  if (!root || (type !== 'pachinko' && type !== 'slot')) return () => {};
  const [theme, color, pace, variation] = themes[id] || ['金彩','#edc579',type === 'pachinko' ? 55 : 112,type === 'pachinko' ? 28 : 0];
  const pachinko = type === 'pachinko';
  const hint = pachinko ? '発射の強さを調整し、中央の入賞口を狙います。' : 'リールを回し、3つの停止ボタンを好きな順で押します。';
  const variationNote = pachinko ? '強さと球のばらつきは機種デモごとに異なります。' : '回転速度と開始絵柄は機種デモごとに異なります。';
  const panel = document.createElement('div');
  panel.className = 'play-demo play-demo-' + type;
  panel.style.setProperty('--play-accent', color);
  const musicControl = typeof onMusicToggle === 'function' ? control('music','BGMを切り替え','play-audio-control') : '';
  panel.innerHTML = '<div class="play-demo-head"><strong>' + theme + ' <span aria-hidden="true">·</span> ' + (pachinko ? 'パチンコ' : 'パチスロ') + '</strong><div class="play-sound-controls">' + control('sound','効果音','play-audio-control') + musicControl + '</div></div><div class="play-demo-body"><div class="play-instructions"><p data-play="title"></p><p>' + hint + '</p></div>' + (pachinko ? pachinkoMarkup() : slotMarkup()) + '<p class="play-status" data-play="status" role="status" aria-live="polite"></p><p class="play-note">実機の操作を参考にした無料のオリジナル体験です。演出・音源・抽選はデモ独自で、実機と異なります。金銭や景品のやり取りはありません。' + variationNote + '</p></div>';
  panel.querySelector('[data-play="title"]').textContent = title || '遊技体験';
  root.replaceChildren(panel);

  const listeners = new AbortController();
  const query = name => panel.querySelector('[data-play="' + name + '"]');
  const on = (node,event,handler) => node.addEventListener(event,handler,{signal:listeners.signal});
  const status = query('status');
  const totalView = query('total');
  const matchesView = query('matches');
  const reset = query('reset');
  const sound = cabinetSound();
  const soundButton = query('sound');
  const musicButton = query('music');
  const display = query('display-label');
  const rootPitch = 294 * scale[(pace + variation) % scale.length];
  let total = 0;
  let matches = 0;
  function updateSoundButton() {
    soundButton.setAttribute('aria-pressed',String(sound.enabled));
    soundButton.querySelector('span').textContent = sound.enabled ? '効果音 オン' : '効果音 オフ';
  }
  on(soundButton,'click',() => {
    sound.toggle();
    updateSoundButton();
    if (sound.enabled) sound.play([[0,660,.16,.045]]);
  });
  if (musicButton) on(musicButton,'click',onMusicToggle);
  updateSoundButton();

  function show(message) {
    status.textContent = message;
    totalView.textContent = String(total);
    matchesView.textContent = String(matches);
  }
  function signal(state,text) {
    panel.dataset.cabinetState = state;
    display.textContent = text;
  }
  function chime() {
    sound.play([
      [0,rootPitch,.16,.06],[.11,rootPitch*1.26,.18,.058],
      [.23,rootPitch*1.5,.18,.054],[.35,rootPitch*2,.37,.06],
      [.35,rootPitch*1.5,.32,.036],
    ],'triangle');
  }
  const cleanup = pachinko ? wirePachinko() : wireSlot();
  return () => {
    listeners.abort();
    cleanup();
    sound.close();
    panel.remove();
  };

  function wirePachinko() {
    const button = query('launch');
    const power = query('strength');
    const ball = query('ball');
    const pockets = [...panel.querySelectorAll('[data-play-pocket]')];
    const screen = query('display-symbols');
    let pending = 0;
    let ticker = 0;
    let animation;
    let moving = false;
    const idle = '発射ボタンを押すと球が動きます。';

    function drawDisplay(values) {
      screen.innerHTML = values.map(index=>svg(motifs[index][1])).join('');
    }

    function resetBall() {
      clearTimeout(pending);
      clearInterval(ticker);
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
      sound.awaken();
      sound.play([[0,rootPitch*.62,.12,.045,rootPitch*1.3]],'triangle');
      moving = true;
      signal('moving','変動中');
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
        bounce(9,91,0),
        bounce(9,38,.17),
        bounce(23,8,.32),
        bounce(fromRight ? 77 : 49,11,.47),
        bounce(landing + 8,31,.59),
        bounce(landing - 7,48,.71),
        bounce(landing + 4,72,.87),
        bounce(landing,89,1),
      ];
      const instant = window.matchMedia(quietMedia).matches;
      const duration = instant ? 90 : 1250;
      if (!instant && ball.animate) animation = ball.animate(frames,{duration,fill:'forwards',easing:'linear'});
      else Object.assign(ball.style,{left:landing+'%',top:'89%'});
      if (!instant) {
        sound.play([[.45,910,.08,.026,490],[.67,740,.07,.021,440],[.84,680,.08,.027,370]],'triangle');
        let tick = 0;
        ticker = setInterval(() => {
          tick++;
          drawDisplay([tick % motifs.length,(tick+2)%motifs.length,(tick+4)%motifs.length]);
        },105);
      }
      pending = setTimeout(() => {
        moving = false;
        clearInterval(ticker);
        button.removeAttribute('aria-disabled');
        pockets[target].classList.add('is-landed');
        if (target === 2) {
          matches++;
          drawDisplay([0,0,0]);
          signal('match','中央入賞');
          chime();
          show('中央の入賞口に入りました。');
        } else {
          drawDisplay([1,3,2]);
          signal('settled','変動終了');
          sound.play([[0,rootPitch*.62,.16,.033,rootPitch*.5]]);
          show('中央を外れました。強さを変えて試せます。');
        }
      },duration);
    });
    on(reset,'click',() => {
      resetBall();
      power.value = '55';
      query('power').value = '55';
      total = matches = 0;
      drawDisplay([0,1,2]);
      signal('idle','待機中');
      show(idle);
    });
    drawDisplay([0,1,2]);
    signal('idle','待機中');
    show(idle);
    return resetBall;
  }

  function wireSlot() {
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
      const before = motifs[(values[i]+motifs.length-1)%motifs.length][1];
      const after = motifs[(values[i]+1)%motifs.length][1];
      reels[i].innerHTML = '<div class="play-strip" aria-hidden="true">' + svg(before) + svg(shape) + svg(after) + '</div>';
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
      sound.awaken();
      sound.play([[0,rootPitch*(1+i*.2),.14,.044,rootPitch*.7]],'triangle');
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
        signal('match','３つ揃い');
        chime();
        show('絵柄が3つ揃いました。 '+result);
      } else {
        signal('settled','リール停止');
        show('停止した絵柄は '+result+' です。');
      }
    }

    on(spin,'click',() => {
      if (clock) return;
      sound.awaken();
      sound.play([[0,rootPitch*.45,.22,.044,rootPitch*.9],[.09,rootPitch,.28,.026,rootPitch*1.5]],'triangle');
      signal('moving','リール回転中');
      spinning.fill(true);
      spin.setAttribute('aria-disabled','true');
      for (let i=0;i<reels.length;i++) {
        reels[i].classList.add('is-spinning');
        reels[i].setAttribute('aria-label',pressLabels[i]+' 回転中');
        stops[i].removeAttribute('aria-disabled');
        values[i] = Math.floor(Math.random() * motifs.length);
        draw(i);
      }
      const interval = window.matchMedia(quietMedia).matches ? 400 : pace;
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
      signal('idle','リール待機中');
      show(idle);
    });
    stopClock();
    signal('idle','リール待機中');
    reels.forEach((_,i) => draw(i));
    show(idle);
    return stopClock;
  }
}
