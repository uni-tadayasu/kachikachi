const trialLimit = 1000000;
const denominatorLimit = 1000000000000;
const wilsonZ = 1.959963984540054;
const settingsSource = 'https://www.kitadenshi.co.jp/slot/imjugglerex2020/';
const wilsonSource = 'https://itl.nist.gov/div898/handbook/prc/section2/prc241.htm';
const scopes = {
  normal:'通常時', short:'時短', st:'ST', rush:'RUSH・AT',
  other:'その他・区分なし',
};
const scopeOrder = ['normal','short','st','rush','other'];
const numberFormat = new Intl.NumberFormat('ja-JP');

function validTrials(value) {
  return Number.isSafeInteger(value) && value >= 0 && value <= trialLimit;
}

function validRate(value) {
  return Number.isFinite(value) && value >= 1 && value <= denominatorLimit;
}

export function calculateProbability(probability, trials) {
  if (!validTrials(trials) || !Number.isFinite(probability) || probability < 0 || probability > 1) {
    throw new RangeError('Invalid probability or trial count');
  }
  if (trials === 0 || probability === 0) return { atLeastOne:0, none:1 };
  if (probability === 1) return { atLeastOne:1, none:0 };
  const logNone = trials * Math.log1p(-probability);
  return { atLeastOne:-Math.expm1(logNone), none:Math.exp(logNone) };
}

export function wilsonInterval(successes, trials) {
  if (!validTrials(trials) || trials < 1 || !validTrials(successes) || successes > trials) {
    throw new RangeError('Invalid observation counts');
  }
  const rate = successes / trials;
  const squaredZ = wilsonZ * wilsonZ;
  const correction = 1 + squaredZ / trials;
  const center = (rate + squaredZ / (2 * trials)) / correction;
  const radius = wilsonZ * Math.sqrt((rate * (1 - rate) + squaredZ / (4 * trials)) / trials) / correction;
  return {
    rate,
    lower:successes === 0 ? 0 : Math.max(0,center - radius),
    upper:successes === trials ? 1 : Math.min(1,center + radius),
  };
}

function percent(probability, exactZero = probability === 0, exactOne = probability === 1) {
  if (exactZero) return '0%';
  if (exactOne) return '100%';
  if (probability < 0.00005) return '0.005%未満';
  if (probability > 0.99995) return '99.995%超';
  return (probability * 100).toLocaleString('ja-JP', { maximumFractionDigits:3 }) + '%';
}

function htmlOption(value, text) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = text;
  return option;
}

function asSafeLink(link, url, label) {
  try {
    const target = new URL(url);
    if (target.protocol !== 'https:') throw new TypeError('Expected HTTPS');
    link.href = target.href;
    link.textContent = label;
    link.hidden = false;
  } catch {
    link.removeAttribute('href');
    link.hidden = true;
  }
}

export function mountProbability(root, {id,title,type,models=[],settings=[],counterState} = {}) {
  const noAction = () => {};
  if (!root) return {destroy:noAction,setCounts:noAction};
  const settingRows = settings.filter(row => Number.isInteger(row.setting)
    && ['bb','rb','combined'].every(event => validRate(row[event])));
  const playableModels = models.filter(model => model.id && validRate(model.denominator)
    && !(settingRows.length && !model.referenceOnly && Number.isInteger(model.setting)));
  const pachinko = type === 'pachinko';
  const eventNames = pachinko
    ? {hit:'大当り', start:'始動口入賞', rush:'RUSH突入', return:'引き戻し'}
    : {hit:'BB・RB合算',bb:'BB',rb:'RB',at:'AT初当り',cz:'CZ',grape:'ブドウ',cherry:'チェリー',replay:'リプレイ',bell:'ベル',watermelon:'スイカ'};
  const forwardEventNames = {combined:'BB・RB合算',bb:'BB',rb:'RB'};
  const markup = document.createElement('div');
  markup.className = 'probability-tool';
  markup.innerHTML = `<section class="probability-panel">
    <h3>これから当たる確率</h3>
    <p class="probability-intro">現在と同じ抽選条件が続くと仮定して計算します。</p>
    <form data-prob-form novalidate>
      <div class="probability-inputs">
        <label>計算に使う条件<select data-prob="model"></select></label>
        <label data-prob="manual-scope-group" hidden>現在の遊技状態<select data-prob="manual-scope"></select></label>
        <label data-prob="manual-group" hidden>1回あたりの確率の分母<input data-prob="denominator" type="number" min="1" max="${denominatorLimit}" step="any" inputmode="decimal" placeholder="例 319.7"><small>1/319.7 の場合は 319.7</small></label>
        <label data-prob="setting-group" hidden>台の設定<select data-prob="setting"></select></label>
        <label data-prob="setting-event-group" hidden>抽選の種類<select data-prob="setting-event"></select></label>
        <label>これから回す回数<input data-prob="horizon" type="number" min="1" max="${trialLimit}" step="1" inputmode="numeric" value="100"></label>
        <label>同じ条件での連続ハズレ回数（任意）<input data-prob="streak" type="number" min="0" max="${trialLimit}" step="1" inputmode="numeric" placeholder="例 500"></label>
        <label data-prob="remaining-group" hidden>現在の状態の残り回数<input data-prob="remaining" type="number" min="0" max="${trialLimit}" step="1" inputmode="numeric"><small data-prob="remaining-help"></small></label>
      </div>
      <p class="probability-context"><span data-prob="model-note"></span> <a data-prob="source" target="_blank" rel="noopener noreferrer" hidden></a></p>
      <div class="probability-actions"><button type="submit" class="button primary">確率を計算</button></div>
    </form>
    <div data-prob="result" class="probability-result" role="status" aria-live="polite"></div>
    <details class="probability-assumptions">
      <summary>計算式と適用できる条件</summary>
      <p>1回あたりの当選率を p とすると、独立した n 回の抽選で1回以上当たる確率は 1 − (1 − p)ⁿ です。同じ確率で独立に抽選される場合、過去のハマりは次の抽選確率を変えません。</p>
      <p>天井、ゾーン、内部モード、抽選確率が変わる区間、設定が不明な台の実際の当選率には、それぞれの条件に合うデータが必要です。</p>
    </details>
  </section>
  <section class="probability-panel">
    <h3>実測の当たり方</h3>
    <p class="probability-intro">同じ条件で記録した試行と当たりの回数から、観測割合とばらつきの目安を計算します。</p>
    <form data-observed-form novalidate>
      <div class="probability-inputs">
        <label>数えた項目<select data-prob="observed-event"></select></label>
        <label>集計した遊技状態<select data-prob="observed-scope"></select></label>
        <label>対象の試行数<input data-prob="observed-trials" type="number" min="1" max="${trialLimit}" step="1" inputmode="numeric" placeholder="例 1000"></label>
        <label>当たり・成立の回数<input data-prob="observed-hits" type="number" min="0" max="${trialLimit}" step="1" inputmode="numeric" placeholder="例 4"></label>
      </div>
      <div class="probability-actions"><button type="button" class="button" data-prob="sync" disabled>カウンターの記録を使う</button><button type="submit" class="button primary">観測割合を計算</button></div>
      <p class="probability-context" data-prob="counter-hint"></p>
    </form>
    <div data-prob="observed-result" class="probability-result" role="status" aria-live="polite"></div>
    <details class="probability-assumptions">
      <summary>95%信頼区間について</summary>
      <p>抽選条件をそろえ、独立した試行で集計した場合のWilson法による近似区間です。台の設定や次回の当選を直接判定する値ではありません。<a href="${wilsonSource}" target="_blank" rel="noopener noreferrer">Wilson法の資料（NIST）</a></p>
    </details>
  </section>`;
  root.replaceChildren(markup);
  const el = key => markup.querySelector('[data-prob="' + key + '"]');
  const control = el;
  const listeners = new AbortController();
  const on = (element, event, action) => element.addEventListener(event,action,{signal:listeners.signal});
  const modelSelect = control('model');
  const settingSelect = control('setting');
  const settingEventSelect = control('setting-event');
  const manualScope = control('manual-scope');
  const remaining = control('remaining');
  const observedEvent = control('observed-event');
  const observedScope = control('observed-scope');
  const result = control('result');
  const observedResult = control('observed-result');
  let snapshot;
  let appliedSnapshot;

  for (const model of playableModels) modelSelect.append(htmlOption('model-' + model.id,model.label));
  if (settingRows.length) modelSelect.append(htmlOption('settings','通常時・設定別のボーナス確率（メーカー公表）'));
  modelSelect.append(htmlOption('manual','同じ確率が続く条件を手入力'));
  if (!playableModels.some(model => !model.referenceOnly) && settingRows.length) modelSelect.value = 'settings';
  if (playableModels.length && playableModels.every(model => model.referenceOnly) && !settingRows.length) modelSelect.value = 'manual';
  settingSelect.append(htmlOption('all','不明（設定別の範囲を表示）'));
  for (const row of settingRows) settingSelect.append(htmlOption(String(row.setting),'設定 ' + row.setting));
  for (const [key,label] of Object.entries(forwardEventNames)) settingEventSelect.append(htmlOption(key,label));
  for (const key of scopeOrder) {
    if (!pachinko && ['short','st'].includes(key)) continue;
    manualScope.append(htmlOption(key,scopes[key]));
    observedScope.append(htmlOption(key,scopes[key]));
  }
  for (const [key,label] of Object.entries(eventNames)) observedEvent.append(htmlOption(key,label));

  function selectedModel() {
    return playableModels.find(model => 'model-' + model.id === modelSelect.value);
  }

  function fixedLimit() {
    const model = selectedModel();
    return Number.isInteger(model?.limit) && model.limit > 0 ? model.limit : null;
  }

  function showResult(host, value, detail, rows = []) {
    host.replaceChildren();
    const main = document.createElement('strong');
    main.className = 'probability-value';
    main.textContent = value;
    const secondary = document.createElement('p');
    secondary.textContent = detail;
    host.append(main,secondary);
    if (rows.length) {
      const list = document.createElement('dl');
      for (const [label,amount] of rows) {
        const entry = document.createElement('div');
        const term = document.createElement('dt');
        const description = document.createElement('dd');
        term.textContent = label;
        description.textContent = amount;
        entry.append(term,description);
        list.append(entry);
      }
      host.append(list);
    }
  }

  function showProbabilityForm() {
    const model = selectedModel();
    const manual = modelSelect.value === 'manual';
    const settingsMode = modelSelect.value === 'settings';
    const limit = fixedLimit();
    control('manual-scope-group').hidden = !manual;
    control('manual-group').hidden = !manual;
    control('setting-group').hidden = !settingsMode;
    control('setting-event-group').hidden = !settingsMode;
    const capRequired = manual ? ['short','st','rush'].includes(manualScope.value) : limit !== null || model?.requireRemaining === true;
    control('remaining-group').hidden = !capRequired;
    remaining.max = String(limit ?? trialLimit);
    remaining.required = capRequired;
    control('remaining-help').textContent = limit === null ? '同じ確率が続く残り回数' : 'この区間の上限は ' + numberFormat.format(limit) + ' 回';
    const note = control('model-note');
    const source = control('source');
    if (model) {
      const rate = (model.sourceLabel ? '掲載値 1/' : '公表値 1/') + numberFormat.format(model.denominator) + '。';
      note.textContent = (model.referenceOnly ? '参考値 1/' + numberFormat.format(model.denominator) + '。条件別の確率計算には使えません。' : rate) + (model.notes ? ' ' + model.notes : '');
      asSafeLink(source,model.source,model.sourceLabel || '公表資料');
    } else if (settingsMode) {
      note.textContent = '各設定の公表値で計算します。設定が不明な場合は設定1〜6の幅を示します。';
      asSafeLink(source,settingsSource,'北電子の公表値');
    } else {
      note.textContent = '手入力値での試算です。確率の根拠と、現在の抽選条件に適用できることを確認してください。';
      asSafeLink(source,null,'');
    }
    if (model?.referenceOnly) showResult(result,'参考値のみ','この公表値は状態を通じた平均などです。条件別の抽選確率が確認できる場合は手入力を選べます。');
    else result.replaceChildren();
  }

  function intervalForValues(values, count, field) {
    const evaluated = values.map(value => calculateProbability(1 / value,count)[field]);
    const low = Math.min(...evaluated);
    const high = Math.max(...evaluated);
    const exactZero = count === 0 ? field === 'atLeastOne' : field === 'none' && values.every(value => value === 1);
    const exactOne = count === 0 ? field === 'none' : field === 'atLeastOne' && values.every(value => value === 1);
    const format = value => percent(value, exactZero || (value === 0 && values.includes(1) && field === 'none'), exactOne || (value === 1 && values.includes(1) && field === 'atLeastOne'));
    return low === high ? format(low) : format(low) + ' 〜 ' + format(high);
  }

  function computeForward() {
    const model = selectedModel();
    if (model?.referenceOnly) {
      showProbabilityForm();
      return;
    }
    const requested = control('horizon').valueAsNumber;
    if (!validTrials(requested) || requested === 0) {
      showResult(result,'回数を確認してください','これから回す回数に 1〜1,000,000 の整数を入力してください。');
      return;
    }
    let effective = requested;
    let capped = false;
    if (remaining.required) {
      const left = remaining.valueAsNumber;
      const limit = fixedLimit() ?? trialLimit;
      if (!validTrials(left) || left > limit) {
        showResult(result,'残り回数を確認してください','現在と同じ状態での残り回数を 0〜' + numberFormat.format(limit) + ' の整数で入力してください。');
        return;
      }
      if (left === 0) {
        showResult(result,'現在の状態は残り0回です','状態が変わった後は、次の状態に合う確率を選んでください。');
        return;
      }
      effective = Math.min(left,requested);
      capped = effective < requested;
    }

    let rates;
    let eventLabel;
    let premise;
    if (model) {
      rates = [model.denominator];
      eventLabel = model.event || '対象の当たり';
      premise = '対象は「' + model.label + '」です。';
    } else if (modelSelect.value === 'settings') {
      const event = settingEventSelect.value;
      const rows = settingSelect.value === 'all'
        ? settingRows
        : settingRows.filter(row => String(row.setting) === settingSelect.value);
      rates = rows.map(row => row[event]);
      eventLabel = forwardEventNames[event];
      premise = rows.length === 1
        ? '設定 ' + rows[0].setting + ' の公表値を使用。'
        : '各設定の公表値から計算した範囲です。台の設定を推定する値ではありません。';
    } else {
      const denominator = control('denominator').valueAsNumber;
      if (!validRate(denominator)) {
        showResult(result,'確率を確認してください','1回あたりの確率の分母に、1以上1兆以下の値を入力してください。');
        return;
      }
      rates = [denominator];
      eventLabel = '対象の当たり';
      premise = scopes[manualScope.value] + '・入力された確率での試算。';
    }
    const streakInput = control('streak');
    const streak = streakInput.valueAsNumber;
    if ((streakInput.value !== '' && !validTrials(streak)) || streakInput.validity.badInput) {
      showResult(result,'連続ハズレ回数を確認してください','0〜1,000,000 の整数で入力してください。');
      return;
    }
    const label = 'これから ' + numberFormat.format(effective) + ' 回で' + eventLabel + 'が1回以上の確率';
    const detail = capped ? premise + ' 状態が変わった後の抽選は含めていません。' : premise;
    const results = [
      ['次の1回の確率',intervalForValues(rates,1,'atLeastOne')],
      [numberFormat.format(effective) + '回とも当たらない確率',intervalForValues(rates,effective,'none')],
    ];
    if (streak > 0) results.push(['同じ条件で' + numberFormat.format(streak) + '連続で外れる確率',intervalForValues(rates,streak,'none')]);
    showResult(result,intervalForValues(rates,effective,'atLeastOne'),label + '。' + detail,results);
  }

  function setCounts(state) {
    snapshot = state && typeof state.counts === 'object' ? state : undefined;
    const sync = control('sync');
    sync.disabled = !validTrials(snapshot?.trials) || snapshot.trials === 0;
    if (appliedSnapshot) control('counter-hint').textContent = '反映済みの記録を表示中です。現在の記録を取り込むにはボタンを押してください。';
    else control('counter-hint').textContent = sync.disabled ? '' : 'カウンターに ' + numberFormat.format(snapshot.trials) + ' 回の記録があります。';
  }

  function applyCounts() {
    const event = observedEvent.value;
    const value = appliedSnapshot.counts?.[event];
    const conditional = pachinko && (event === 'rush' || event === 'return');
    control('observed-trials').value = !conditional && validTrials(appliedSnapshot.trials) ? String(appliedSnapshot.trials) : '';
    control('observed-hits').value = Number.isSafeInteger(value) && value >= 0 ? String(value) : '';
    observedScope.value = Object.hasOwn(scopes,appliedSnapshot.scope) ? appliedSnapshot.scope : 'other';
    if (!observedScope.value) observedScope.value = 'other';
    control('counter-hint').textContent = conditional
      ? '成立回数を反映しました。分母には回転数の代わりに、突入や引き戻しの対象となった抽選機会の数を入力してください。'
      : 'カウンターから反映しました。';
    if (conditional) observedResult.replaceChildren();
    else computeObserved();
  }

  function syncCounts() {
    if (!snapshot) return;
    appliedSnapshot = {...snapshot,counts:{...snapshot.counts}};
    applyCounts();
  }

  function computeObserved() {
    const trials = control('observed-trials').valueAsNumber;
    const hits = control('observed-hits').valueAsNumber;
    if (!validTrials(trials) || trials < 1 || !validTrials(hits) || hits > trials) {
      showResult(observedResult,'集計値を確認してください','試行数は 1〜1,000,000 の整数で、当たり回数は 0 から試行数までの整数で入力してください。');
      return;
    }
    const interval = wilsonInterval(hits,trials);
    const displayRate = percent(interval.rate);
    const detail = scopes[observedScope.value] + ' ／ ' + eventNames[observedEvent.value] + ' ／ ' + numberFormat.format(hits) + ' 回 ÷ ' + numberFormat.format(trials) + ' 回';
    showResult(observedResult,displayRate,detail,[
      ['観測割合の95%信頼区間（Wilson法）',percent(interval.lower) + ' 〜 ' + percent(interval.upper)],
    ]);
  }

  on(modelSelect,'change',() => {
    remaining.value = '';
    showProbabilityForm();
  });
  on(manualScope,'change',() => {
    remaining.value = '';
    showProbabilityForm();
  });
  for (const name of ['setting','setting-event','horizon','remaining','denominator','streak']) {
    on(control(name),'input',() => result.replaceChildren());
  }
  on(markup.querySelector('[data-prob-form]'),'submit',event => {
    event.preventDefault();
    computeForward();
  });
  on(markup.querySelector('[data-observed-form]'),'submit',event => {
    event.preventDefault();
    computeObserved();
  });
  on(control('sync'),'click',syncCounts);
  on(observedEvent,'change',() => {
    if (appliedSnapshot) applyCounts();
    else {
      control('observed-hits').value = '';
      observedResult.replaceChildren();
    }
  });
  for (const name of ['observed-trials','observed-hits','observed-scope']) {
    on(control(name),'input',() => {
      appliedSnapshot = undefined;
      control('counter-hint').textContent = '';
      observedResult.replaceChildren();
    });
  }
  setCounts(counterState);
  showProbabilityForm();
  return {
    destroy() {
      listeners.abort();
      markup.remove();
    },
    setCounts,
  };
}
