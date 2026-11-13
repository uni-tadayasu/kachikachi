const maxCount = 10_000_000;
const historyLimit = 30;
const prefix = 'zettai-counter-v1';

const scopeNames = {
  normal: '通常時',
  short: '時短',
  st: 'ST',
  rush: 'RUSH／AT',
  other: 'その他',
};

const pachinkoRoles = [
  ['hit', '大当り'],
  ['start', '始動口入賞'],
  ['rush', 'RUSH突入'],
  ['return', '引き戻し'],
];

const slotRoles = [
  ['bb', 'BIG'],
  ['rb', 'REG'],
  ['grape', 'ブドウ'],
  ['cherry', 'チェリー'],
  ['replay', 'リプレイ'],
  ['bell', 'ベル'],
  ['watermelon', 'スイカ'],
  ['at', 'AT初当り'],
  ['cz', 'CZ突入'],
];

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(label, className, ariaLabel) {
  const node = element('button', className, label);
  node.type = 'button';
  if (ariaLabel) node.setAttribute('aria-label', ariaLabel);
  return node;
}

function numberField(label) {
  const node = element('input', 'counter-number');
  node.type = 'number';
  node.inputMode = 'numeric';
  node.min = '0';
  node.max = String(maxCount);
  node.step = '1';
  node.setAttribute('aria-label', label);
  return node;
}

function safeCount(value) {
  return Number.isSafeInteger(value) && value >= 0 && value <= maxCount ? value : 0;
}

function observedRate(value, trials) {
  if (!trials) return '—';
  if (value > trials) return '回転数を超えています';
  if (!value) return '0%';
  const percent = (value / trials * 100).toLocaleString('ja-JP', { maximumFractionDigits: 5 });
  const denominator = (trials / value).toLocaleString('ja-JP', { maximumFractionDigits: 2 });
  return percent + '%（約1/' + denominator + '）';
}

export function mountCounter(root, { id, title, type, onChange = () => {} } = {}) {
  if (!root) return { destroy() {}, getState: () => ({ trials: 0, counts: {}, scope: 'normal' }) };

  const isSlot = type === 'slot';
  const roles = isSlot ? slotRoles : pachinkoRoles;
  const scopes = isSlot ? ['normal', 'rush', 'other'] : Object.keys(scopeNames);
  const storageKey = prefix + ':' + (id || type || 'general');
  const loaded = load();
  let scope = scopes.includes(loaded.scope) ? loaded.scope : 'normal';
  const sessions = Object.fromEntries(scopes.map(key => [key, sanitized(loaded.sessions?.[key])]));
  const histories = Object.fromEntries(scopes.map(key => [key, []]));
  const controller = new AbortController();
  const signal = controller.signal;

  function load() {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || {};
    } catch {
      return {};
    }
  }

  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ scope, sessions }));
    } catch {
      // Counting remains available for this page when device storage is unavailable.
    }
  }

  function sanitized(value) {
    return {
      trials: safeCount(value?.trials),
      counts: Object.fromEntries(roles.map(([key]) => [key, safeCount(value?.counts?.[key])])),
    };
  }

  function getState() {
    const { trials, counts } = sessions[scope];
    const result = { ...counts };
    if (isSlot) result.hit = result.bb + result.rb;
    return { trials, counts: result, scope };
  }

  const panel = element('div', 'counter-widget');
  const header = element('div', 'counter-header');
  const heading = element('h3', 'counter-title', '勝ち勝ちくん式カウンター');
  const subtitle = element('p', 'counter-machine', title || '実測カウンター');
  const headText = element('div');
  headText.append(heading, subtitle);
  const label = element('label', 'counter-scope');
  label.append(element('span', '', '記録する遊技状態'));
  const select = element('select', 'counter-select');
  for (const key of scopes) {
    const option = element('option', '', isSlot && key === 'rush' ? 'AT中' : scopeNames[key]);
    option.value = key;
    select.append(option);
  }
  label.append(select);
  header.append(headText, label);

  const directions = element('p', 'counter-help', '状態ごとに回転数と発生回数を記録します。回転数は観測を始めてからの合計を入力してください。');
  const storage = element('p', 'counter-storage', '機種・状態ごとの記録を、このブラウザに保存します。');
  const trialPanel = element('div', 'counter-trials');
  const trialLabel = element('label', 'counter-trial-field');
  trialLabel.append(element('span', '', isSlot ? '観測したゲーム数' : '観測した回転数'));
  const trialInput = numberField(isSlot ? '観測したゲーム数' : '観測した回転数');
  trialLabel.append(trialInput);
  const trialButtons = element('div', 'counter-trial-buttons');
  for (const amount of [1, 10]) {
    const control = button('＋' + amount, 'counter-step', '観測回数を' + amount + '加える');
    control.addEventListener('click', () => setValue('trials', Math.min(maxCount, sessions[scope].trials + amount), '観測回数を更新しました。'), { signal });
    trialButtons.append(control);
  }
  trialPanel.append(trialLabel, trialButtons);

  const cards = element('div', 'counter-roles');
  const roleViews = new Map();
  for (const [key, name] of roles) {
    const card = element('div', 'counter-role');
    const roleLabel = element('label', 'counter-role-label');
    roleLabel.append(element('span', '', name));
    const input = numberField(name + 'の回数');
    roleLabel.append(input);
    const controls = element('div', 'counter-role-controls');
    const add = button('＋1', 'counter-step counter-add', name + 'を1回加える');
    const subtract = button('−1', 'counter-step counter-subtract', name + 'を1回減らす');
    const rate = element('span', 'counter-rate');
    controls.append(add, subtract);
    card.append(roleLabel, controls, rate);
    cards.append(card);
    roleViews.set(key, { input, add, subtract, rate });
    const current = () => sessions[scope].counts[key];
    const setRole = value => setValue(key, value, name + 'の回数を更新しました。');
    add.addEventListener('click', () => setRole(Math.min(maxCount, current() + 1)), { signal });
    subtract.addEventListener('click', () => setRole(Math.max(0, current() - 1)), { signal });
    input.addEventListener('change', () => readNumber(input, current(), setRole), { signal });
  }

  const toolbar = element('div', 'counter-toolbar');
  const undo = button('ひとつ戻す', 'counter-step');
  const reset = button('この状態の記録をリセット', 'counter-step');
  toolbar.append(undo, reset);

  const confirmation = element('div', 'counter-confirm');
  confirmation.hidden = true;
  const cancel = button('キャンセル', 'counter-step');
  const confirm = button('リセットする', 'counter-step');
  confirmation.append(element('p', '', '表示中の状態の記録を0に戻します。直後は「ひとつ戻す」で復元できます。'), cancel, confirm);
  const status = element('p', 'counter-status');
  status.setAttribute('role', 'status');
  const combined = isSlot ? element('p', 'counter-combined') : null;
  panel.append(header, directions, trialPanel, cards);
  if (combined) panel.append(combined);
  panel.append(toolbar, confirmation, status, storage);
  root.replaceChildren(panel);

  function announce(text) {
    status.textContent = text;
  }

  function render() {
    const { trials, counts } = getState();
    select.value = scope;
    trialInput.value = String(trials);
    for (const [key, view] of roleViews) {
      const count = counts[key];
      view.input.value = String(count);
      view.add.disabled = count >= maxCount;
      view.subtract.disabled = count === 0;
      view.rate.textContent = (key === 'start' ? '入賞／回転 ' : '実測 ') + observedRate(count, trials);
    }
    if (combined) combined.textContent = 'ボーナス合計 ' + counts.hit.toLocaleString('ja-JP') + '回 ／ 実測 ' + observedRate(counts.hit, trials);
    undo.disabled = histories[scope].length === 0;
    reset.disabled = !trials && !Object.values(counts).some(Boolean);
  }

  function commit(next, message) {
    const history = histories[scope];
    history.push(sessions[scope]);
    if (history.length > historyLimit) history.shift();
    sessions[scope] = next;
    update(message);
  }

  function update(message) {
    confirmation.hidden = true;
    save();
    render();
    announce(message);
    onChange(getState());
  }

  function setValue(key, value, message) {
    const current = sessions[scope];
    const same = (key === 'trials' ? current.trials : current.counts[key]) === value;
    if (same) return;
    if (key === 'trials') commit({ ...current, trials: value }, message);
    else commit({ ...current, counts: { ...current.counts, [key]: value } }, message);
  }

  function readNumber(input, previous, apply) {
    const value = input.valueAsNumber;
    if (!Number.isSafeInteger(value) || value < 0 || value > maxCount) {
      input.value = String(previous);
      announce('0から1,000万までの整数を入力してください。');
      return;
    }
    apply(value);
  }

  trialInput.addEventListener('change', () => readNumber(trialInput, sessions[scope].trials, value => setValue('trials', value, '観測回数を更新しました。')), { signal });
  select.addEventListener('change', () => {
    if (!scopes.includes(select.value)) return;
    scope = select.value;
    update('表示する遊技状態を切り替えました。');
  }, { signal });
  undo.addEventListener('click', () => {
    const previous = histories[scope].pop();
    if (!previous) return;
    sessions[scope] = previous;
    update('直前の変更を取り消しました。');
  }, { signal });
  reset.addEventListener('click', () => {
    confirmation.hidden = false;
    cancel.focus();
  }, { signal });
  cancel.addEventListener('click', () => {
    confirmation.hidden = true;
    reset.focus();
  }, { signal });
  confirm.addEventListener('click', () => {
    commit(sanitized(null), 'この状態の記録をリセットしました。');
    undo.focus();
  }, { signal });

  render();
  onChange(getState());
  return {
    destroy() {
      controller.abort();
      panel.remove();
    },
    getState,
  };
}
