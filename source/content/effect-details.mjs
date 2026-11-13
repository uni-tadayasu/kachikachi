const toaru = 'https://pachiseven.jp/articles/detail/26456';
const yokai = 'https://nana-press.com/kaiseki/machine/1234/39524/';
const eva = 'https://1geki.jp/pachinko/p_eva15roar/25/';
const rider = 'https://1geki.jp/pachinko/e_kmnr_blacklight/21/';
const juuou = 'https://www.p-world.co.jp/machine/database/10551';
const feather = 'https://www.sankyo-fever.jp/collection/1003/';

function effect(label, condition, value, source, sourceLabel, notes = '') {
  return { label, condition, value, source, sourceLabel, notes };
}

export const machineEffects = {
  'toaru-index-3': [
    effect('一方通行カウントダウン予告', '通常時の変動中に発生', '92.4%', toaru, 'パチ7掲載値'),
    effect('竜王の顎保留変化', '通常時に竜王の顎保留に変化', '86.5%', toaru, 'パチ7掲載値', '虹色は別条件です。'),
    effect('自動書記スタンバイ', '通常時の変動中に発生', '約82%', toaru, 'パチ7掲載値'),
    effect('超電磁砲予告', '通常時の変動中またはリーチ後などに発生', '70.5%', toaru, 'パチ7掲載値'),
  ],
  'yokai-watch': [
    effect('最高の友達', '通常時のリーチ後に発生', '90%超', yokai, 'なな徹掲載値'),
    effect('全てを奪うモノ', '通常時に最強SPリーチへ発展', '90%超', yokai, 'なな徹掲載値'),
    effect('赤保留', '通常時の保留が赤に変化', '88.8%', yokai, 'なな徹掲載値'),
    effect('S級進化ルート', '通常時のボスバトルSP中に発生', '85.0%', yokai, 'なな徹掲載値'),
  ],
  'eva-mirai': [
    effect('リーチ後レイ背景', '319版・通常時のノーマルモードで発生', '85.4%', eva, '一撃の自社調査値', 'レイのボイス付きや旧レイ背景は別条件です。'),
    effect('発展率表示図柄送り', '319版・通常時のノーマルモードで赤90%表示', '93.2%', eva, '一撃の自社調査値', '表示された「90%」自体は大当り信頼度の掲載値と異なります。'),
  ],
  'kamen-rider-black-light': [
    effect('金保留', 'デカヘソ Light Versionの通常時に金保留へ変化', '94.3%', rider, '一撃掲載値'),
    effect('キングストーン保留', 'デカヘソ Light Versionの通常時に出現', '94.2%', rider, '一撃掲載値', '「確定キングストーン保留」は別条件です。'),
    effect('赤保留', 'デカヘソ Light Versionの通常時に赤保留へ変化', '81.4%', rider, '一撃掲載値'),
  ],
  'juuou-shishi': [
    effect('ライオン群予告', '通常時の予告として発生', '期待度大幅アップ', juuou, 'P-WORLD／HAZUSE掲載', 'この出典は数値を掲載していません。'),
  ],
  'hane-bastard': [
    effect('スペシャルルート', '羽根に拾われた玉がスペシャルルートに進む', 'V入賞率 約1/2', feather, 'SANKYO公表の実射値', 'スペシャルルート通過を条件とする実射値です。台全体の大当り確率や1回転あたりの確率には換算できません。'),
  ],
};
