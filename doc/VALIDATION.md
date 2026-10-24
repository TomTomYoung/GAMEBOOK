# 現在の検証結果と残る確認

## GB29〜GB32の素材追加（2026-10-24）

表紙4点・挿絵4点・BGM4曲を追加しました。短編40作・中編3作を保持し、素材は画像77点・音楽36曲、合計113点です。[素材記録](SHORTS_21_40_ASSETS.md)に配置・本文照合・原本をまとめています。追加内容は[PR #19](https://github.com/TomTomYoung/GAMEBOOK/pull/19)です。

### 成功した試験と対象コミット

**単体111件・3ブラウザ合計579ケースがすべて成功しました。** 全9ジョブが成功し、各ブラウザは既存短編89件＋中編19件＋新作85件＝193件です。

[GitHub Actionsの実行](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/40066520653)の対象は `0f67765b081c11e83ca50ad94a791e2ea53895be` です。[ジョブとログの照合結果](validation/batch-14-ci.json)に成功数を保存しました。下表はゲームのケース数で、単体試験と試聴ページの操作試験は別に数えます。

| ブラウザ | 既存短編・本棚・保存 | 中編 | 新作GB21〜GB40 |
| --- | ---: | ---: | ---: |
| Chromium | [89件成功](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/40066520653/job/120790822996) | [19件成功](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/40066520653/job/120790823008) | [85件成功](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/40066520653/job/120790822963) |
| Firefox | [89件成功](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/40066520653/job/120790822958) | [19件成功](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/40066520653/job/120790822915) | [85件成功](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/40066520653/job/120790823068) |
| WebKit | [89件成功](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/40066520653/job/120790823020) | [19件成功](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/40066520653/job/120790822738) | [85件成功](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/40066520653/job/120790823029) |

各ジョブで単体111件を実行していますが、重複分を加算しません。生成データの一致も確認しました。結果を記録する最後の変更は文書と検証JSONだけで、ゲーム本体・素材・テストコードは上記対象から変更していません。

### 確認した内容

新作85ケースは、本棚の1ケース、全20作の通読20ケース、全81結末の表示と収集を作品別にまとめた20ケース、長文・4画面サイズ・保存再開の20ケース、素材導入済み12作品の表紙・音楽12ケース、12挿絵12ケースです。全到達状態をUIで一つずつ操作したという意味ではありません。原稿・分岐・状態・保存の網羅検査は単体試験で別途行います。

今回の4挿絵は[全11到達状態](validation/batch-14-scene-states.json)を実際の選択操作で確認しました。GB29の11節は名乗りが異なる3状態、GB30の08節は初夜の給餌と準備が異なる6状態、GB31とGB32の02節は各1状態です。従来8挿絵の12状態も含め、計23状態で指定節の画像切替、次節の画像への復帰、BGMを再起動しない継続、栞の再開を検査しています。音楽は初期OFFで読み込まれず、オンにした後の復号・全長・音量・ループ・停止も確認しました。

既存短編は初版・第2版の進行、作品別の栞と結末、保存ファイルの出力・取込、不正データの拒否、複数タブの競合を検査します。中編は各作の通読・挿絵・結末・長文・保存再開を確認しています。

### 実画面と試聴ページ

Linux上のNode.js 24とPlaywrightで、`index.html` を `file://` から直接開きました。画面サイズは1280×720、390×844、360×640、844×390です。本文のページ送り後に全文章を照合し、選択肢・記録・操作欄のはみ出しを検査します。

素材の目視確認には上記対象コミットのCI成果物を使用しました。Chromiumの[新作85ケースのJSON](validation/batch-14-chromium-new-short.json)は全件成功・診断0件です。取得したZIPのSHA-256はActionsの記録と一致しました。追加4表紙と4挿絵のPC画面、4挿絵の縦画面、表紙の縦画面と挿絵の横画面の代表例を目視確認しました。小さい横画面では画像を隠し、本文を優先する従来の表示も確認しています。

3ブラウザの試聴ページで36曲の読込を確認し、再生・停止、継ぎ目、3周後の停止、再生し直し、曲別メモ、判定、JSON保存と読込、古い音源のメモの保管、狭い画面の表示を検査しました。[Chromiumの操作結果](validation/batch-14-audio-review.json)は4ケース成功・診断0件です。3周の操作試験では終端付近へ移動して繰返しを確認しており、全曲を耳で3周聴いたという意味ではありません。

各ブラウザの画面PNGと結果JSONは、上記実行のArtifactsにある `browser-chromium-new-short` などのZIPに保存されています。挿絵のファイル名は、たとえば `scene-GB30-08-360x640.png` です。試聴ページの結果は各ZIPの `audio-review/` にあります。

### 素材・原稿・台帳

- 追加8画像のPNG・WebPのデコード、寸法一致、不透明性、500KB以下の容量、SHA-256を確認しました。
- 追加4曲は90〜96秒、−17.95〜−17.94 LUFS-I、true peak最大−7.93 dBTPです。全長・有限値・容量・ループ境界を測定しました。
- 既存101素材、本文・分岐・保存処理と既存32曲の配布物・音符を保持しています。
- 制作台帳のcounts・progress・残数を更新し、実行用マニフェストとの一致を既存の単体試験で確認しました。ハンドオフ文書の優先度別小計もP1 72点・P2 41点へ更新しました。
- 変更・追加文書13ファイルの相対リンク493件に欠落がないことを確認しました。

### 以前の結果と未確認範囲

[PR #18の検証履歴](validation/HISTORY_PR18.md)に、追加前の単体111件・3ブラウザ555ケースの成功記録があります。今回の成功数へは加算しません。[PR #16](validation/HISTORY_PR16.md)、[PR #14](validation/HISTORY_PR14.md)、[2026-10-20までの履歴](validation/HISTORY_2026-10-20.md)も保持しています。

耳による36曲の評価と3周連続試聴、Safari実機・Windows・macOS・Android・iOS実機、新作の実読者による試読、Web公開先での確認は未実施です。[試聴手順](AUDIO_REVIEW.md)と[公開手順](HOSTING.md)から続けられます。LinuxのWebKit試験をSafari実機の結果として扱いません。

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

`BROWSER_SUITE=short`・`medium` で他の区分も実行できます。試聴ページは `BROWSER=chromium node tests/audio-review.browser.cjs` のように別途実行します。環境変数の記法はbash用です。
