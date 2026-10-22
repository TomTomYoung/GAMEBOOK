# 二十の分岐 — GAMEBOOK

**20作の日本語ゲームブックを、HTMLとJavaScriptで遊べる作品集です。** 291の節、426の選択肢、76の結末を収録しています。

## 遊ぶ

1. このリポジトリの **Code → Download ZIP** でフォルダを取得します。
2. ZIPを展開します。
3. 展開したフォルダの **`index.html` をブラウザで開きます。**

プレイにサーバー起動、Node.js、インストール、ビルドは不要です。`index.html`と`css/`、`js/`、`assets/`の位置関係を保ってください。ネット接続なしでも本文・選択・セーブファイルの出入が動きます。

## 画面と操作

- **本棚**：20作をページ切替で選べます。題名・ジャンル・あらすじの検索、作品ごとの再開に対応しています。
- **読書画面**：本文・選択肢・記録を画面の高さに収めます。デスクトップでは本文の右に、スマートフォンでは本文の下の固定領域に操作を置きます。
- **本文のページ送り**：画面の広さと文字サイズで実測して分割します。本文の矢印、またはキーボードの左右キーで送れます。
- **選択肢**：現在の記録で実行できる行動だけを表示します。入り切らない場合は、選択肢にも専用のページ送りを表示します。
- **読み返し**：「前提・ルール」「足あと」「記録の詳細」をいつでも開けます。参照用の画面は必要に応じて内部でスクロールできます。
- **表示設定**：本文の文字を4段階から選べます。昼と夜の配色があります。
- **音楽**：対応画面では音楽ボタンでON/OFFを切り替えます。別作品ではその曲へ切り替わり、曲がない作品と非表示のタブでは一時停止します。

ページ送り・再読・経過した現実時間では、物語の数値は変わりません。行動を選んだときだけ効果を一括適用し、次の節へ進みます。別の選択を試すときは新しいプレイを始めます。

## 栞と結末

進行は作品ごとにブラウザへ自動保存します。本棚へ戻る、ブラウザを閉じる、途中で別の作品を開く操作に対応しています。集めた結末は、作品を最初から遊び直しても残ります。

「セーブ」では本棚全体をJSONファイルへ書き出し、別の端末へ持ち運べます。読み込む前に全履歴を再生し、記録と結末がその経路に一致するか検査します。読み込みは内容を確認してから本棚全体へ反映します。

ブラウザの保存領域を利用できない場合は、閉じる前にファイルへ保存してください。フォルダの移動やブラウザ変更で保存領域が変わる場合も、セーブファイルで引き継げます。読めない既存データは自動上書きせず、原本を取り出せるようにしています。

## 収録作品

各作品名から、GitHub上で読めるシナリオ全文のMarkdownを開けます。本文・条件付き本文・選択肢と分岐先・条件と記録の変化・すべての結末・作者資料を収録しています。[全20作の目次](doc/scenarios/README.md)からも選べます。

1. [潮の下の郵便局](doc/scenarios/gb01.md)
2. [骨の橋で待つもの](doc/scenarios/gb02.md)
3. [眠らない駅の忘れ物](doc/scenarios/gb03.md)
4. [王女を運ばない馬車](doc/scenarios/gb04.md)
5. [雨を買った村](doc/scenarios/gb05.md)
6. [最後の一席](doc/scenarios/gb06.md)
7. [複製された遺言](doc/scenarios/gb07.md)
8. [北塔の降伏旗](doc/scenarios/gb08.md)
9. [台所に住む小さな王](doc/scenarios/gb09.md)
10. [返却期限のない図書館](doc/scenarios/gb10.md)
11. [暗礁の二重灯台](doc/scenarios/gb11.md)
12. [空中市場の盗まれた床](doc/scenarios/gb12.md)
13. [雪に埋めた名前](doc/scenarios/gb13.md)
14. [朝焼けまでの怪物番](doc/scenarios/gb14.md)
15. [一度だけ戻れる敗戦](doc/scenarios/gb15.md)
16. [鐘を鳴らさない葬列](doc/scenarios/gb16.md)
17. [砂時計のない牢獄](doc/scenarios/gb17.md)
18. [花嫁ではない竜](doc/scenarios/gb18.md)
19. [十二人目の帰還者](doc/scenarios/gb19.md)
20. [世界を閉じる小さな店](doc/scenarios/gb20.md)

## 短編の第2版制作

[GB01『潮の下の郵便局』の初版保存と第2版準備](doc/editions/gb01/README.md)を追加しました。初版全文・正本JSONを固定保存し、別の作業原稿と検討資料を用意しています。第2版の本文改稿・ゲームへの実装は未着手です。

## 使用モデル・素材制作の引継ぎ

- [使用モデル全文](doc/SCENARIO_MODEL_V1_2.md)：『ゲームシナリオモデル v1.2』の0〜25章を収録。リンク先の参照だけに依存せず、本文・契約・雛形・検査指示をリポジトリ内に保持しています。
- [モデルと実装の対応](doc/MODEL_IMPLEMENTATION.md)：五層、九つの契約、原稿データ、実行処理、保存形式の関係。
- [絵・音楽のハンドオフ](doc/ASSET_HANDOFF.md)：**画像41点・音楽21曲**のファイル名、制作指示、配置、優先順、導入手順。
- [画像の採用方針と比較案](doc/ART_DIRECTION.md)：**Aの少色ドット絵を採用**。B・Cも画像付きで保存しています。
- [検証記録](doc/VALIDATION.md)：実行グラフとブラウザで確認した範囲。
- [資料の案内](doc/README.md)：原稿レビュー、機械処理できる素材台帳など。

共通の本棚と全20作に、Aの少色ドット絵と専用BGMを導入しました。全20作に場面挿絵もあり、指定の節で表紙から切り替わります（画像41点・音楽21曲、予定62点をすべて導入済み）。音楽は初期OFFで、画面上の音楽ボタンから再生できます。Linux上のChromium・Firefox・WebKitで各65ケースを確認しました。Safari実機・実機OS別とBGMの聴感・3周試聴は未完了です。[制作記録](doc/asset-production-log.md)に原本・実測値・確認範囲を残しています。

## 開発・検証

BGMの最終試聴には [doc/audio-review.html](doc/audio-review.html) を直接開きます。全21曲を選び、3周再生・末尾5秒からの継ぎ目確認・曲別メモ・JSON保存ができます。サーバーの起動は不要です。詳しくは[試聴の手順](doc/AUDIO_REVIEW.md)を参照してください。

以下は原稿やコードを編集する人のための手順です。プレイ時には実行不要です。

Node.js 24以上で、依存ライブラリなしの構造・実行・保存テストを実行できます。

```sh
node scripts/build-data.cjs --check
node --test --test-isolation=none tests/*.test.cjs
```

原稿は`data/stories/gb01.json`〜`gb20.json`が正本です。全文と作者用の人物・因果・根拠も保持しています。編集後は次を実行し、ブラウザ用のclassic scriptと`doc/scenarios/`のMarkdownを再生成してください。

```sh
node scripts/build-data.cjs
```

シナリオMarkdownも `node scripts/build-data.cjs --check` による生成物の一致検査の対象です。本文や分岐を変更する際は正本のJSONを編集してください。

ブラウザ試験には開発用のPlaywrightを使います。

```sh
npm ci
npx playwright install chromium firefox webkit
npm run test:browser
BROWSER=firefox npm run test:browser
BROWSER=webkit npm run test:browser
```

既定はChromiumです。`BROWSER`環境変数でFirefox・WebKitへ切り替えます。上の変数指定はbash用で、PowerShellでは先に `$env:BROWSER='firefox'` のように設定します。既存のChromiumを使う場合は`CHROMIUM_PATH`で実行ファイルを指定できます。ブラウザ試験も`file://`で開き、サーバー不要の配布を確認します。WebKitの試験はSafari実機の確認とは区別します。

GitHub ActionsのCIは生成物の一致、単体試験、3ブラウザの試験を実行し、ブラウザ別のJSON結果と画面画像を保存します。Web公開を設定する場合は、[GitHub Pagesの手順](doc/HOSTING.md)を参照してください。
