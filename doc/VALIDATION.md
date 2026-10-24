# 現在の検証結果と残る確認

## GB21〜GB24の素材追加（2026-10-24）

表紙4点・挿絵4点・BGM4曲を追加しました。短編40作・中編3作を保持し、素材は画像61点・音楽28曲、合計89点です。[素材記録](SHORTS_21_40_ASSETS.md)に配置・本文照合・原本をまとめています。追加内容は[PR #17](https://github.com/TomTomYoung/GAMEBOOK/pull/17)です。

### 成功した試験と対象コミット

**単体109件・3ブラウザ合計531ケースがすべて成功しました。** 全9ジョブが成功し、各ブラウザは既存短編89件＋中編19件＋新作69件＝177件です。

[GitHub Actionsの実行](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/40058393381)の対象は `c6e2a8c2bc18d51dfadfc393ce4e81b94d6b8039` です。下表はゲームのケース数で、単体試験と試聴ページの操作試験は別に数えます。

| ブラウザ | 既存短編・本棚・保存 | 中編 | 新作GB21〜GB40 |
| --- | ---: | ---: | ---: |
| Chromium | [89件成功](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/40058393381/job/120766356108) | [19件成功](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/40058393381/job/120766356224) | [69件成功](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/40058393381/job/120766356262) |
| Firefox | [89件成功](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/40058393381/job/120766356241) | [19件成功](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/40058393381/job/120766356213) | [69件成功](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/40058393381/job/120766356235) |
| WebKit | [89件成功](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/40058393381/job/120766356298) | [19件成功](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/40058393381/job/120766356275) | [69件成功](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/40058393381/job/120766356243) |

各ジョブで単体109件を実行していますが、重複分を加算しません。生成データの一致も確認しました。この結果を記録する最後の変更は文書と検証JSONだけで、ゲーム本体・素材・テストコードは上記対象から変更していません。

### 確認した内容

新作69ケースは、本棚の1ケース、全20作の通読20ケース、全81結末の表示と収集を作品別にまとめた20ケース、長文・4画面サイズ・保存再開の20ケース、追加4作品の表紙・音楽4ケース、追加4挿絵4ケースです。全到達状態をUIで一つずつ操作したという意味ではありません。原稿・分岐・状態・保存の網羅検査は単体試験で別途行います。

挿絵は全7到達状態を実際の選択操作で確認しました。GB21の拍子2通り、GB22の余力・先行2通り、GB23の1通り、GB24の珠2通りです。指定節での画像切替、次節での表紙への復帰、BGMを再起動しない継続、栞からの再開を検査しています。音楽は初期OFFで読み込まれず、オンにした後の復号・全長・音量・ループ・停止も確認しました。

既存短編は初版・第2版の進行、作品別の栞と結末、保存ファイルの出力・取込、不正データの拒否、複数タブの競合を検査します。中編は各作の通読・挿絵・結末・長文・保存再開を確認しています。

### 実画面と試聴ページ

Linux上のNode.js 24とPlaywrightで、`index.html` を `file://` から直接開きました。画面サイズは1280×720、390×844、360×640、844×390です。本文のページ送り後に全文章を照合し、選択肢・記録・操作欄のはみ出しを検査します。

Chromiumの[新作69ケースのJSON](validation/batch-12-chromium-new-short.json)は全件成功・診断0件です。取得したZIPのSHA-256はActionsの記録と一致しました。4表紙と4挿絵のPC画面、表紙の縦・横画面の代表例、4挿絵の縦画面とGB24の横画面を目視確認しました。小さい横画面で画像を隠して本文を優先する従来の表示も確認しています。

3ブラウザの試聴ページで28曲の読込を確認し、再生・停止、継ぎ目、3周後の停止、再生し直し、曲別メモ、判定、JSON保存と読込、古い音源のメモの保管、狭い画面の表示を検査しました。[Chromiumの操作結果](validation/batch-12-audio-review.json)は4ケース成功・診断0件です。3周の操作試験では終端付近へ移動して繰返しを確認しており、全曲を耳で3周聴いたという意味ではありません。

全ブラウザの画面PNGと結果JSONは、上記実行のArtifactsにある `browser-chromium-new-short` などのZIPに保存されています。挿絵のファイル名は、たとえば `scene-GB24-05-360x640.png` です。試聴ページの結果は各ZIPの `audio-review/` にあります。

### 素材・原稿の確認

- 追加8画像のPNG・WebPのデコード、寸法一致、不透明性、容量、SHA-256を確認しました。
- 追加4音源の全長・音量・true peak・有限値・容量・ループ境界の検査が成功しました。87.27〜96秒、−17.96〜−17.95 LUFS-I、true peak最大−7.76 dBTPです。
- 既存77素材、本文・分岐・セーブ処理と既存24曲の配布物・音符を保持しています。
- 変更・追加文書13ファイルの相対リンク394件に欠落がないことを確認しました。

### 試験準備処理の修正

[初回実行](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/40057762121)では、新作69ケース中65件が各ブラウザで成功しました。残る4件は、挿絵試験の共通準備処理が、版を一つだけ持つ新作の非表示セレクターを操作しようとして時間切れになりました。

準備処理を、実際に開いた作品・版の識別子で判定するよう修正しました。既存作では必要な版切替を引き続き行い、新作では不要な切替を行いません。素材とゲーム本体の変更はありません。修正後は上表の新作69ケースが3ブラウザですべて成功しています。

### 以前の結果

[PR #16の検証履歴](validation/HISTORY_PR16.md)に、追加前の単体109件・3ブラウザ507ケースの成功記録があります。今回の成功数へは加算しません。[PR #14](validation/HISTORY_PR14.md)と[2026-10-20までの履歴](validation/HISTORY_2026-10-20.md)も保持しています。

### 未確認

- 新曲を含む28曲の耳による評価と3周連続試聴。[試聴手順](AUDIO_REVIEW.md)から続けられます。
- Safari実機、Windows・macOS・Android・iOS実機での表示・音楽・保存入出力。LinuxのWebKit試験とは区別します。
- 新作20作の実読者による読み味の試読。
- Web公開先URLでの動作。公開時は[HOSTING.md](HOSTING.md)を参照します。

### 再実行

```sh
npm run check
npm test
npm ci
npx playwright install --with-deps chromium firefox webkit
BROWSER=chromium BROWSER_SUITE=new-short npm run test:browser
BROWSER=firefox BROWSER_SUITE=new-short npm run test:browser
BROWSER=webkit BROWSER_SUITE=new-short npm run test:browser
```

`BROWSER_SUITE=short`・`medium` で他の区分も実行できます。`BROWSER_CASE` はケース名の正規表現です。試聴ページは `BROWSER=chromium node tests/audio-review.browser.cjs` のように別途実行します。環境変数の記法はbash用です。
