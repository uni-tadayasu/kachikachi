const sankyoYokai = 'https://www.sankyo-fever.jp/products/machine_list/ppj/spec/';
const fujishojiIndex = 'https://fujimarukun.co.jp/products/machine/e_toaru3/sp/lp.html';
const sankyoEva = 'https://www.sankyo-fever.jp/collection/925/';
const pworldEva = 'https://www.p-world.co.jp/machine/database/9509';
const sammyJuuou = 'https://www.sammy.co.jp/japanese/product/pachinko/e_jyu_oh_sh/?popup=spec';

const pworldRider = 'https://www.p-world.co.jp/machine/database/10584';
const kitadenshi = 'https://www.kitadenshi.co.jp/slot/imjugglerex2020/';
const sankyoGodzilla = 'https://www.sankyo-fever.jp/collection/1001/';
const sankyoKanokari = 'https://www.sankyo-fever.jp/products/machine_list/szf/spec/';
const kyorakuGgo = 'https://www.kyoraku.co.jp/product_site/2026/ggo_s/view/spec/';
const sammyKaiun = 'https://www.sammy.co.jp/japanese/product/pachislot/sp_kai_ja/?popup=spec';
const sammyHokuto = 'https://www.sammy.co.jp/japanese/product/pachislot/sp_hok_ke/spec.html';
const sammyValkyrie = 'https://www.sammy.co.jp/japanese/product/pachinko/e_shu_va_129/?popup=spec';
const sanyoSaintSeiya = 'https://www.sanyobussan.co.jp/information/pdf/sanyo_press_release_20260724_01.pdf';

const averageNote = '公表された設定別の長期平均です。現在のゲーム数、内部モード、周期、天井を条件にした確率には変換できません。';
const remainingNote = '表示された残り回転数を入力します。モード移行後や残保留の抽選は含めません。';

function stage(id, label, denominator, scope, source, extra = {}) {
  return { id, label, denominator, scope, source, ...extra };
}

function settingAverages(rows, events, source, notes = averageNote) {
  return rows.flatMap(([setting, ...denominators]) => events.map(([id, label], index) =>
    stage(id + '-setting-' + setting, label + '（設定' + setting + 'の平均）', denominators[index], 'other', source, {
      setting, referenceOnly: true, notes,
    }),
  ));
}

export const jugglerSettings = [
  { setting: 1, bb: 273.1, rb: 439.8, combined: 168.5 },
  { setting: 2, bb: 269.7, rb: 399.6, combined: 161.0 },
  { setting: 3, bb: 269.7, rb: 331.0, combined: 148.6 },
  { setting: 4, bb: 259.0, rb: 315.1, combined: 142.2 },
  { setting: 5, bb: 259.0, rb: 255.0, combined: 128.5 },
  { setting: 6, bb: 255.0, rb: 255.0, combined: 127.5 },
];

export const probabilityModels = {
  'yokai-watch': [
    stage('normal-hit', '通常時の大当り', 319.7, 'normal', sankyoYokai, { notes: '通常時の公表値（約）。V入賞が条件です。' }),
    stage('koma-challenge', '時短・コマチャレンジの図柄揃い', 399, 'short', sankyoYokai, { limit: 100, notes: '時短中の図柄揃い確率（約）。普図ロング開放当選後に特図2の抽選を経ます。' }),
  ],
  'toaru-index-3': [
    stage('normal-symbol', '通常時の数字図柄揃い（特図1 c時短）', 348, 'normal', fujishojiIndex, { notes: '液晶の数字図柄が揃う確率です。出玉を伴う大当りと同じ指標ではありません。' }),
    stage('st-first', 'ST前半・LIMIT BREAK CHANCE 当選', 99, 'st', fujishojiIndex, { limit: 30, notes: '前半30回の抽選です。ボーナス消化中の別抽選は含めません。' }),
    stage('st-late', 'ST後半・とある魔術の最強激突 当選', 128, 'st', fujishojiIndex, { limit: 100, notes: '後半100回の抽選です。ST再開を抽選する最終回転（LAST CHANCE）は含めません。' }),
  ],
  'eva-mirai': [
    stage('normal-hit', '通常時の大当り（319版）', 319.7, 'normal', sankyoEva, { notes: '型式「Ｐ新世紀エヴァンゲリオン１５ 未来への咆哮」が対象です。' }),
    stage('st-impact', 'ST・IMPACT MODEの大当り（319版）', 99.4, 'st', pworldEva, { limit: 163, sourceLabel: 'P-WORLD掲載スペック', notes: remainingNote }),
    stage('short-100', 'チャンスタイム（時短100回）の大当り', 319.7, 'short', pworldEva, { limit: 100, sourceLabel: 'P-WORLD掲載スペック', notes: remainingNote }),
    stage('short-500', 'チャンスタイム（特定条件の時短500回）の大当り', 319.7, 'short', pworldEva, { limit: 500, sourceLabel: 'P-WORLD掲載スペック', notes: '高ベース中に特図1で通常当りに当せんした場合です。' + remainingNote }),
  ],
  'juuou-shishi': [
    stage('normal-hit', '通常時の大当り', 319.7, 'normal', sammyJuuou, { notes: '通常時の公表値（約）。大当り後のRUSH突入抽選とは異なります。' }),
    stage('juuou-rush', '獣王RUSH（ST）の大当り', 144.7, 'rush', sammyJuuou, { limit: 100, sourceLabel: 'サミー公式 基本情報・小冊子', notes: remainingNote + '100回は同社デジタル小冊子4ページの公表値です。サバンナチャンス中は別の状態です。' }),
  ],
  'kamen-rider-black-light': [
    stage('normal-hit', '通常時の大当り（デカヘソ Light）', 129.9, 'normal', pworldRider, { sourceLabel: 'P-WORLD掲載スペック', notes: 'デカヘソ Light Versionの掲載値（約）です。' }),
    stage('justice-rush', 'JUSTICE RUSHの大当り', 96, 'rush', pworldRider, { limit: 120, sourceLabel: 'P-WORLD掲載スペック', notes: remainingNote + '宿命BATTLE中は別の状態です。' }),
  ],
  'im-juggler-ex': jugglerSettings.flatMap(row => [
    stage('bb-setting-' + row.setting, 'BB（設定' + row.setting + 'と仮定）', row.bb, 'normal', kitadenshi, { setting: row.setting, notes: '北電子が工場データから算出した予測値です。' }),
    stage('rb-setting-' + row.setting, 'RB（設定' + row.setting + 'と仮定）', row.rb, 'normal', kitadenshi, { setting: row.setting, notes: '北電子が工場データから算出した予測値です。' }),
    stage('combined-setting-' + row.setting, 'ボーナス合算（設定' + row.setting + 'と仮定）', row.combined, 'normal', kitadenshi, { setting: row.setting, notes: 'BBとRBを合わせた公表値です。北電子が工場データから算出した予測値です。' }),
  ]),
  'godzilla-eva-2': settingAverages([
    [1, 234.2, 460.5], [2, 229.0, 446.5], [3, 221.8, 425.5],
    [4, 207.0, 390.4], [5, 201.5, 374.2], [6, 195.0, 355.5],
  ], [['bonus', 'ボーナス'], ['at', 'AT']], sankyoGodzilla),
  'kanokari-slot': settingAverages([
    [1, 172, 269], [2, 169, 263], [3, 164, 254],
    [4, 154, 235], [5, 151, 231], [6, 149, 226],
  ], [['cz', 'CZ合算'], ['bonus', 'BONUS初当り合算']], sankyoKanokari),
  'gun-gale-online': settingAverages([
    [1, 192.0, 521.7], [2, 189.2, 510.4], [3, 180.9, 486.6],
    [4, 168.6, 445.3], [5, 155.4, 405.0], [6, 153.9, 392.6],
  ], [['first-bonus', '初当りBONUS'], ['sj', 'SQUAD JAM']], kyorakuGgo),
  'kaiun-japan-bt': settingAverages([
    [1, 297.9, 394.8, 169.8], [2, 293.9, 387.8, 167.2], [3, 287.4, 378.8, 163.4],
    [4, 278.9, 366.1, 158.3], [5, 271.9, 356.2, 154.2], [6, 265.3, 346.8, 150.3],
  ], [['big', 'BIG'], ['reg', 'REG'], ['combined', 'ボーナス合算']], sammyKaiun, '導入予定機種の公表値です。ボーナストリガー中など、条件の異なる状態には適用できません。'),
  'valkyrie-dodeka': [
    stage('normal-hit', '通常時の大当り（ドデカ129ver.）', 129.8, 'normal', sammyValkyrie, { notes: '導入予定機種の通常時公表値（約）です。RUSH中の継続率にはモード差があります。' }),
  ],
  'hokuto-smart-slot': settingAverages([
    [1, 383.4], [2, 370.5], [4, 297.8], [5, 258.7], [6, 235.1],
  ], [['at-combined', 'AT確率・合算']], sammyHokuto),
  'saint-seiya-ougon': settingAverages(
    [[1, 214, 364]], [['cz', 'CZ初当り'], ['at', 'AT初当り']], sanyoSaintSeiya,
  ),
};
