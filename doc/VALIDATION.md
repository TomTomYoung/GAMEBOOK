# 現在の検証結果と残る確認

## GB21〜GB40を追加した版（2026-10-23）

**短編40作・中編3作、合計43作について、単体109件・ブラウザ507ケースが成功しました。** 生成物の一致も確認しています。

今回の追加は[PR #16](https://github.com/TomTomYoung/GAMEBOOK/pull/16)です。[実装仕様](SHORTS_21_40_IMPLEMENTATION.md)に原稿・条件・更新の対応を、[原稿目次](drafts/gb21-40/README.md)に20作のMarkdownをまとめています。

## 成功した試験と対象コミット

各セルから成功したジョブのログを開けます。507はゲームのブラウザケースの合計で、単体109件と試聴ページの試験は含みません。

| ブラウザ | 既存短編・本棚・保存 | 既存の中編 | 新作GB21〜GB40 | 合計 |
| --- | ---: | ---: | ---: | ---: |
| Chromium | [89件](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/39980289098/job/120505496582) | [19件](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/39980289098/job/120505496593) | [61件](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/39980289098/job/120505497207) | 169件 |
| Firefox | [89件](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/39980289098/job/120505496616) | [19件](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/39980289098/job/120505496413) | [61件](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/39979901492/job/120504138620) | 169件 |
| WebKit | [89件](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/39980289098/job/120505496562) | [19件](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/39980289098/job/120505496577) | [61件](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/39980289098/job/120505496553) | 169件 |

8ジョブの試験対象は`d0fd427dcb89b87d016eb1c15a4530d4144461ac`です。Firefoxの新作61件は、ゲーム本体が同一の`6617823e7ff739d638ede13e99efa2418260cd15`で成功した結果を採用しています。最新版の重複実行は記録時点でブラウザのインストール待ちです。この2コミットの差分は本棚テストの期待値とページ走査の修正だけで、新作テスト内の配列を共通定数へ置き換えた箇所も同じ43作品を参照します。`index.html`・`js/`・`css/`・`assets/`・`data/`・`scripts/`の差分がないことを確認しました。

この結果を記録する最後の変更は資料だけです。ゲーム本体とテストコードは試験対象から変更していません。CI実行全体の完了状態とは別に、上表の9ジョブの成功ログを根拠にしています。

## 確認した内容

**新作20作の全333節・81結末・861到達状態を機械検査しました。** 原稿475行の選択肢は、状態による処理を分けた484定義になります。180の条件付き本文断片を含む1,955断片について、順序と表示条件、選択結果、記録の範囲、保存・再生の一致を確認しています。行先の欠落、進行不能な状態、結末へ抜けられない循環も検査します。

GB27の三手は全27通り、GB30の食事・準備は成立する全16通りを確認しました。GB29の帽子の囮、GB31の三通りの返事、GB34の球の位置、GB36・GB39の更新前の描写も具体的な経路で照合しています。

ブラウザの新作61ケースは、本棚・検索・ページ切替の1ケース、20作の通読、全81結末の表示・収集を作品別にまとめた20ケース、長文・画面サイズ・保存再開を作品別にまとめた20ケースです。全到達状態をUIで一つずつ操作したという意味ではなく、全状態の機械検査と実際の選択操作を組み合わせています。

既存作品も本棚から選べることを確認します。初版・第2版・作品別の栞と結末、保存ファイルの出力・取込、不正データの拒否、複数タブの競合など、従来の保存試験を継続しています。新作の進行と結末を追加しても、既存GB01の栞を保持することを検査します。

## 画面と素材

Linux上のNode.js 24とPlaywrightで、`index.html`を`file://`で直接開きます。画面サイズは1280×720、390×844、360×640、844×390の4種類です。本文の全ページを連結して原文と照合し、選択肢・記録・操作が画面内に収まるか確認します。新作の長文は文字サイズ24pxでも検査します。

GB21〜GB40の専用画像・BGMは未制作です。文字と配色による表紙、画像のない本文表示、音楽ボタンの非表示を確認します。既存の画像53点・BGM24曲は従来のブラウザ試験で読み込み、表示切替、再生・停止、音量、ループを確認します。試聴ページの操作試験はゲームのケース数とは別です。

ゲーム本体が同一のコミット`6617823e7ff739d638ede13e99efa2418260cd15`の[Chromium実行](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/39979892651)から新作のレポートと画面PNGを取得しました。61件成功・診断0件を確認し、GB27の結末、GB30の縦画面、GB40の横画面を目視確認しています。

## 結果を見る場所

CIのArtifactsには、`browser-chromium-new-short`など、ブラウザ名と試験区分の付いたZIPがあります。`report.json`に各ケースの結果、PNGに画面を保存します。新作の画像名は、たとえば`new-short-GB30-longest-360x640.png`です。試聴ページの結果は各ZIPの`audio-review/`にあります。

[PR #14の検証結果](validation/HISTORY_PR14.md)は追加前の短編20作・中編3作、単体81件・ブラウザ324ケースの記録です。[2026年10月20日までの履歴](validation/HISTORY_2026-10-20.md)も保存しています。以前の件数を今回の結果に加算しません。

## まだ確認していないこと

- 新作20作の実読者による読み味の試読。
- BGM24曲の音色・圧縮品質・3周連続の聴感評価。自動再生試験とは別です。[試聴手順](AUDIO_REVIEW.md)から続けられます。
- Safari実機、およびWindows・macOS・Android・iOS実機ごとの表示・音楽・保存入出力。Linux上のWebKit試験をSafari実機確認とは扱いません。
- Web公開先URLでの動作。公開時は[HOSTING.md](HOSTING.md)に従い、公開先で別途確認します。

## 再実行する場合

リポジトリ直下で実行します。ゲームを遊ぶだけなら不要です。

```sh
npm run check
npm test
npm ci
npx playwright install chromium firefox webkit
npm run test:browser
BROWSER=firefox npm run test:browser
BROWSER=webkit npm run test:browser
```

環境変数の書き方はbash用です。PowerShellでは`$env:BROWSER='firefox'`のように設定してから実行します。`BROWSER_SUITE=short`・`medium`・`new-short`で試験区分を、`BROWSER_CASE`でケース名の正規表現を指定できます。CIは3ブラウザ×3区分の9ジョブです。各ジョブで同じ単体テストを実行しても、種類は109件として数えます。
