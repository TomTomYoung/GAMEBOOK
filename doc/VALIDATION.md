# 現在の検証結果と残る確認

## GB25〜GB28の素材追加（2026-10-24）

表紙4点・挿絵4点・BGM4曲を追加しました。短編40作・中編3作を保持し、素材は画像69点・音楽32曲、合計101点です。[素材記録](SHORTS_21_40_ASSETS.md)に配置・本文照合・原本をまとめています。追加内容は[PR #18](https://github.com/TomTomYoung/GAMEBOOK/pull/18)です。

### 成功した試験と対象コミット

**単体111件・3ブラウザ合計555ケースがすべて成功しました。** 全9ジョブが成功し、各ブラウザは既存短編89件＋中編19件＋新作77件＝185件です。

[GitHub Actionsの実行](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/40063798715)の対象は `b853c21fad66423d750bd2e696d486229ae19566` です。[ジョブとログの照合結果](validation/batch-13-ci.json)に成功数を保存しました。下表はゲームのケース数で、単体試験と試聴ページの操作試験は別に数えます。

| ブラウザ | 既存短編・本棚・保存 | 中編 | 新作GB21〜GB40 |
| --- | ---: | ---: | ---: |
| Chromium | [89件成功](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/40063798715/job/120782687914) | [19件成功](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/40063798715/job/120782687728) | [77件成功](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/40063798715/job/120782687903) |
| Firefox | [89件成功](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/40063798715/job/120782687859) | [19件成功](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/40063798715/job/120782687830) | [77件成功](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/40063798715/job/120782687854) |
| WebKit | [89件成功](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/40063798715/job/120782687966) | [19件成功](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/40063798715/job/120782687929) | [77件成功](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/40063798715/job/120782687857) |

各ジョブで単体111件を実行していますが、重複分を加算しません。生成データの一致も確認しました。結果を記録する最後の変更は文書と検証JSONだけで、ゲーム本体・素材・テストコードは上記対象から変更していません。

### 確認した内容

新作77ケースは、本棚の1ケース、全20作の通読20ケース、全81結末の表示と収集を作品別にまとめた20ケース、長文・4画面サイズ・保存再開の20ケース、素材導入済み8作品の表紙・音楽8ケース、8挿絵8ケースです。全到達状態をUIで一つずつ操作したという意味ではありません。原稿・分岐・状態・保存の網羅検査は単体試験で別途行います。

今回の4挿絵は[全5到達状態](validation/batch-13-scene-states.json)を実際の選択操作で確認しました。GB25は収穫前、GB26は王冠未選択、GB27は一手目前の各1状態、GB28は理由を話したかどうかの2状態です。従来4挿絵の7状態も含め、計12状態で指定節の画像切替、次節の画像への復帰、BGMを再起動しない継続、栞の再開を検査しています。音楽は初期OFFで読み込まれず、オンにした後の復号・全長・音量・ループ・停止も確認しました。

既存短編は初版・第2版の進行、作品別の栞と結末、保存ファイルの出力・取込、不正データの拒否、複数タブの競合を検査します。中編は各作の通読・挿絵・結末・長文・保存再開を確認しています。

### 実画面と試聴ページ

Linux上のNode.js 24とPlaywrightで、`index.html` を `file://` から直接開きました。画面サイズは1280×720、390×844、360×640、844×390です。本文のページ送り後に全文章を照合し、選択肢・記録・操作欄のはみ出しを検査します。

素材の目視確認には、素材が同一のコミット `777633eccef4afa7c6bfac8e62698196a7c334f2` の成果物を使用しました。以後のコード差分は旧版差替えテストの識別方法だけです。Chromiumの[新作77ケースのJSON](validation/batch-13-chromium-new-short.json)は全件成功・診断0件です。取得したZIPのSHA-256はActionsの記録と一致しました。追加4表紙と4挿絵のPC画面、4挿絵の縦画面、表紙の縦画面と挿絵の横画面の代表例を目視確認しました。小さい横画面では画像を隠し、本文を優先する従来の表示も確認しています。

3ブラウザの試聴ページで32曲の読込を確認し、再生・停止、継ぎ目、3周後の停止、再生し直し、曲別メモ、判定、JSON保存と読込、古い音源のメモの保管、狭い画面の表示を検査しました。[Chromiumの操作結果](validation/batch-13-audio-review.json)は4ケース成功・診断0件です。3周の操作試験では終端付近へ移動して繰返しを確認しており、全曲を耳で3周聴いたという意味ではありません。

各ブラウザの画面PNGと結果JSONは、上記実行のArtifactsにある `browser-chromium-new-short` などのZIPに保存されています。挿絵のファイル名は、たとえば `scene-GB28-08-360x640.png` です。試聴ページの結果は各ZIPの `audio-review/` にあります。

### 素材・原稿・台帳

- 追加8画像のPNG・WebPのデコード、寸法一致、不透明性、500KB以下の容量、SHA-256を確認しました。
- 追加4曲は90〜96秒、−17.96〜−17.93 LUFS-I、true peak最大−6.67 dBTPです。全長・有限値・容量・ループ境界を測定しました。
- 既存89素材、本文・分岐・保存処理と既存28曲の配布物・音符を保持しています。
- 制作台帳の古いprogress値を修正し、導入済み数・残数・実行用マニフェストの一致を単体試験へ加えました。
- 変更・追加文書13ファイルの相対リンク444件に欠落がないことを確認しました。

### 初回試験で見つかった画像の欠落
+
+[初回CI](https://github.com/TomTomYoung/GAMEBOOK/actions/runs/40062206939)で、GB26の02節の画像読込が失敗しました。コミットされたWebPが0バイトになっていたため、保存済みの採用PNGから再変換し、制作時の170,628 bytes・SHA-256と一致する配布物を復元しました。空ファイルになった時点は特定していません。全導入画像の容量とSHA-256を原本台帳へ照合する単体試験を追加し、修正後の9ジョブを再実行しています。上記の成功数は修正後の結果です。

初回のChromiumでは、既存の旧版保存データ試験も期待する内容版4ではなく2を観測しました。テスト用の旧版差替えを解除する印をURLフラグメントへ移し、現行版のデータが読み込まれたことを別に検査します。window.nameを使った途中の試行ではWebKitに旧版が残ったため、この方式へ揃えました。ゲーム本体・保存処理は変更していません。
+
+### 以前の結果と未確認範囲

[PR #17の検証履歴](validation/HISTORY_PR17.md)に、追加前の単体109件・3ブラウザ531ケースの成功記録があります。今回の成功数へは加算しません。[PR #16](validation/HISTORY_PR16.md)、[PR #14](validation/HISTORY_PR14.md)、[2026-10-20までの履歴](validation/HISTORY_2026-10-20.md)も保持しています。

耳による32曲の評価と3周連続試聴、Safari実機・Windows・macOS・Android・iOS実機、新作の実読者による試読、Web公開先での確認は未実施です。[試聴手順](AUDIO_REVIEW.md)と[公開手順](HOSTING.md)から続けられます。LinuxのWebKit試験をSafari実機の結果として扱いません。

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
