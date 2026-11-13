// Condition-specific outcomes are intentionally separate from per-spin probability models.
export const effectData = {
  'yokai-watch': [
    { title:'先読み演出', condition:'通常時、先読みカスタム「熱」を設定して先読みが発生した変動。', expectation:'大当り信頼度 98.0%', source:'https://nana-press.com/kaiseki/machine/1234/39526/', sourceLabel:'なな徹の機種解析' },
    { title:'先ウィスパーフラッシュ', condition:'通常時、先ウィスパーフラッシュカスタム「EX」で発生した変動。', expectation:'大当り・RUSH突入濃厚', source:'https://nana-press.com/kaiseki/machine/1234/39526/', sourceLabel:'なな徹の機種解析' },
  ],
  'hane-bastard': [
    { title:'スペシャルルート（赤）', condition:'羽根に拾われた玉が、中央の役物から手前側のスペシャルルートに入った場合のV入賞率。', expectation:'V入賞率 約1/2', source:'https://www.sankyo-fever.jp/products/assets/pdf/prg/prg_mp.pdf', sourceLabel:'SANKYO公式 遊技ガイド' },
  ],
  'godzilla-eva-2': [
    { title:'履歴アイコン「金チャンス」', condition:'小役履歴に表示されるチャンスアイコンが金の場合。赤はボーナスの大チャンス示唆。', expectation:'ボーナス濃厚と紹介', source:'https://1geki.jp/slot/l_goji_eva2/43/', sourceLabel:'一撃の機種解析' },
  ],
  'toaru-index-3': [
    { title:'金保留', condition:'通常時の保留変化予告で保留が金になった変動。', expectation:'大当り信頼度 94.4%', source:'https://hisshobon.com/machineinfo/184937/', sourceLabel:'パチ＆スロ必勝本の機種解析' },
    { title:'打ち止め（ラストオーダー）かくれんぼ', condition:'RUSH中の同名カスタムで、変動中に打ち止めを見つけたとき。', expectation:'大当り濃厚', source:'https://nana-press.com/kaiseki/machine/1236/39651/', sourceLabel:'なな徹の機種解析' },
  ],
  'kamen-rider-black-light': [
    { title:'創世王フラッシュ（赤）', condition:'通常時、デカヘソ Light Versionの「創世王フラッシュ強化モード」で赤が発生した変動。', expectation:'大当り信頼度 93.3%', source:'https://nana-press.com/kaiseki/machine/1258/40072/', sourceLabel:'なな徹の機種解析' },
    { title:'創世王フラッシュ（虹）', condition:'通常時、デカヘソ Light Versionの「創世王フラッシュ強化モード」で虹が発生した変動。', expectation:'大当り濃厚', source:'https://nana-press.com/kaiseki/machine/1258/40072/', sourceLabel:'なな徹の機種解析' },
  ],
  'saint-seiya-ougon': [
    { title:'スピンフラッシュ', condition:'上位CZ「最終決戦サガバトル」または最終決戦前エピソードの消化中に発生した場合。', expectation:'上位CZ勝利濃厚', source:'https://nana-press.com/kaiseki/machine/1193/40128/', sourceLabel:'なな徹の機種解析' },
  ],
  'gun-gale-online': [
    { title:'SAO失敗者でブラックアウト', condition:'SJ1のボスチームバトル勝利後に入る「SAO失敗者」でブラックアウトが発生したとき。', expectation:'上位ST「イカれたレン」への移行告知', source:'https://nana-press.com/kaiseki/machine/1244/40113/', sourceLabel:'なな徹の機種解析' },
  ],
  'juuou-shishi': [
    { title:'ギアクラッシュ', condition:'通常時にギアクラッシュが発生した変動。カスタムで変わるのは掲載上の占有率。', expectation:'大当り信頼度 98.0%', source:'https://nana-press.com/kaiseki/machine/1252/40163/', sourceLabel:'なな徹の機種解析' },
    { title:'キリンフラッシュ', condition:'通常時、「キリンフラッシュカスタム」を「アップ」または「激アップ」にして発生した変動。', expectation:'大当り濃厚', source:'https://nana-press.com/kaiseki/machine/1252/40163/', sourceLabel:'なな徹の機種解析' },
  ],
  'kanokari-slot': [
    { title:'1GレンCHANCE中の虹系演出', condition:'「1GレンCHANCE」の消化中に虹系演出が出たとき。開発記事では、2G目の失敗演出後に金7の復活煽りが出る場合も紹介。', expectation:'ななかりDREAM当選濃厚と開発記事が紹介', source:'https://www.secret-story.sankyo-fever.jp/product/szf', sourceLabel:'SANKYO公式 開発こぼれ話' },
  ],
  'hokuto-smart-slot': [
    { title:'VSアミバ・VSでかいババア', condition:'通常時に対象の連続演出へ発展した時点。', expectation:'バトルボーナス濃厚', source:'https://p.hisshobon.jp/machine/4047/1/94258', sourceLabel:'パチ＆スロ必勝本の機種解析' },
    { title:'北斗カウンタ直後の連続演出', condition:'北斗カウンタ発動後、3ゲーム以内に連続演出へ発展した場合。', expectation:'バトルボーナス濃厚', source:'https://p.hisshobon.jp/machine/4047/1/94258', sourceLabel:'パチ＆スロ必勝本の機種解析' },
  ],
  'eva-mirai': [
    { title:'赤保留', condition:'2021年版「未来への咆哮」の通常時。シンプルモードではこの色保留演出は発生しない。', expectation:'大当り信頼度 約91.0%', source:'https://www.dechau.com/news/single.php?id=7473', sourceLabel:'でちゃう！の演出信頼度特集' },
    { title:'虹保留', condition:'同機種の通常時。シンプルモードではこの色保留演出は発生しない。', expectation:'確変大当り濃厚', source:'https://www.dechau.com/news/single.php?id=7473', sourceLabel:'でちゃう！の演出信頼度特集' },
  ],
  'im-juggler-ex': [
    { title:'GOGO!ランプ点灯', condition:'2020年モデルでGOGO!ランプが点灯したとき。成立後の告知。', expectation:'ボーナス確定告知', source:'https://www.pachibee.jp/machines/about/220040006', sourceLabel:'パチビーの機種解説' },
  ],
  'kaiun-japan-bt': [
    { title:'にゃぱんランプ点灯', condition:'2027年2月8日導入予定。通常時の標準カスタムで、リール上のにゃぱんランプが点灯したとき。', expectation:'ボーナス当選の告知', source:'https://yugi-nippon.com/pachinko-new-machine/post-81326/', sourceLabel:'遊技日本の新機種紹介' },
    { title:'おみくじ出現', condition:'導入前の情報。おみくじカスタムを選んだときのおみくじ出現。', expectation:'ボーナスのチャンス示唆（数値未確認）', source:'https://yugi-nippon.com/pachinko-new-machine/post-81326/', sourceLabel:'遊技日本の新機種紹介' },
  ],
  'valkyrie-dodeka': [
    { title:'RUSH突入画面のタイトル背景', condition:'ドデカ129ver.でRUSH突入画面の表示中にPUSHを押したときの背景色。次の1回転の大当り率には換算できません。', expectation:'赤はRUSH継続率 約82%以上、虹は約89%のモードを示唆', source:'https://pachimaga.com/free/mach/maker-p/sammy/e_valkyrie_dodeka129.php', sourceLabel:'パチマガスロマガFREEの機種解析' },
  ],
};
