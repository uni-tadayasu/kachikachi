# 絶対勝てる！ ホームページ設置版

## Webサーバーに設置する

1. ZIPを展開し、`index.html` が見えるフォルダーを開きます。
2. `index.html`、`404.html`（含まれる場合）、`assets/`、`machines/`、`guides/`、`glossary/`、`updates/`、`play/`、`site.webmanifest`、`robots.txt`、`sitemap.xml`（含まれる場合）を、フォルダー構成を保って公開先にアップロードします。公開先にはルートとサブフォルダーのどちらも使えます。
3. HTTPSで公開したURLを開きます。添付曲のBGMと読み上げは「音声設定」や各ページの再生ボタンから操作できます。

Windowsで手元の表示を確認するときは、Pythonが使える場合、展開先でターミナルを開いて `py -m http.server 8000` を実行し、[http://localhost:8000/](http://localhost:8000/) を開いてください。HTMLのダブルクリックではブラウザの制限でゲームや音声を読み込めません。

## 公開URLに合わせてSEO情報を生成する

Node.js 20以降が使える環境で、ZIP展開先から次を実行します。URLは実際に設置する場所に置き換えてください。生成された `../publish` の中身だけをアップロードできます。

```sh
node source/scripts/static-site.mjs . ../publish https://example.jp/
```

この処理で絶対URL付きのOGP、canonical、構造化データ、サイトマップを生成します。サブフォルダーで公開する場合は `https://example.jp/kateru/` のように指定してください。検索エンジンが参照する robots.txt はドメインのルートに置きます。

## GitHub Pagesで公開し、新着を定期更新する

1. ZIP展開先の中身をGitリポジトリに追加し、GitHubへpushします。`.github/workflows/pages.yml` と `source/` を含めます。
2. リポジトリの **Settings → Pages → Build and deployment → Source** で **GitHub Actions** を選びます。
3. **Actions → 絶対勝てる！ GitHub Pages → Run workflow** をデフォルトブランチで実行します。公開URLが確定すると、OGP、canonical、サイトマップに反映されます。
4. ワークフロー有効時は日本時間の毎日9時17分ごろに、サミー・平和・北電子の公式一覧を確認します。更新された情報を `assets/feed-snapshot.json` に保存して公開し、取得できなかったメーカーは前回分を維持します。

定期更新には、同じリポジトリの `assets/feed-snapshot.json` を更新できる権限が必要です。リポジトリの保護設定でデフォルトブランチへの書き込みが許可されない場合は、実行結果を **Actions** で確認してください。GitHub以外の静的ホスティングでは、同梱済みの新着データが表示されます。Node.js と curl が使える環境で更新する場合は、次の順で実行し、更新したJSONをアップロードします。

```sh
node source/scripts/fetch-catalog.mjs new-feed.json
node source/scripts/static-site.mjs --merge-feed new-feed.json assets/feed-snapshot.json
```

公開・ワークフローの仕様は、[GitHub Pagesの公式設定ガイド](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)と[GitHub Actionsのスケジュール仕様](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)を参照してください。

## ファイルを編集する

| 場所 | 内容 |
| --- | --- |
| `index.html`、`machines/`、`guides/`、`glossary/`、`updates/`、`play/` | 公開する各ページのHTML |
| `assets/` | CSS、JavaScript、画像、サイトアイコン、OGP、BGM、読み上げ音声 |
| `source/content/` | 機種データ、遊技ガイド、用語、読み上げ原稿、新着の元データ |
| `source/scripts/` | ページ・読み上げ音声の生成、公式情報の取得、公開用ファイルの組み立て |
| `.github/workflows/pages.yml` | GitHub Pagesへの公開と新着更新 |

公開用HTMLと素材は展開先で直接編集できます。掲載機種の遊技デモはブラウザ内で動作します。新着一覧の外部リンク先はメーカー公式ページです。

機種データや記事本文を `source/content/` で編集した場合は、以下で公開用HTMLを作り直せます。新規の出力フォルダーと実際の公開URLを指定してください。元のファイルは直接変更されません。読み上げ原稿を編集した場合は、FFmpegと `pyopenjtalk-plus==0.4.1.post10` を用意して `python source/scripts/build-readings.py` を先に実行すると、対応する音声を `assets/` に生成できます。

```sh
node source/scripts/rebuild-portable.mjs ../publish-new https://example.jp/
```
