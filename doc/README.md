# GAMEBOOKの資料案内

**2026年10月23日現在、短編40作・中編3作をプレイできます。画像53点・BGM24曲の計77点を導入済みです。** ゲームはフォルダを展開し、直下の `index.html` を開くだけで動きます。サーバー起動やビルドは不要です。

## 現在できていること

- **短編GB01〜GB20**：全20作に初版・第2版があります。画面で版を切り替え、進行・栞・結末を別々に保存できます。
- **中編M01〜M03**：全40章・965節・13結末を実装済みです。本棚の「作品の長さ」で「中編」を選べます。
- **絵と音楽**：GB01〜GB20と中編3作に表紙と専用BGMがあります。場面挿絵はGB01〜GB20に各1点、中編各3点。音楽は初期OFFで、ボタンから再生します。
- **動作確認**：単体108件が成功しています。ブラウザ試験の進捗と対象は[検証記録](VALIDATION.md)にまとめています。
- **短編GB21〜GB40**：設計モデルv1.2bの20作・333節・81結末を実装済みです。条件付き本文、記録更新、保存・再開に対応します。専用画像・BGMは未制作です。

作品数は版を重複して数えません。短編40作＋中編3作で、合計1,589節・2,013選択肢定義・170結末（条件別に分けた同じ行動の定義を含む）です。

## 目的から探す

- **遊び方・保存方法を知る** → [リポジトリのREADME](../README.md)
- **GB01〜GB20の全文を読む** → [短編20作・初版と第2版の目次](scenarios/README.md)
- **中編の全文を読む** → 下の「中編3作」
- **GB21〜GB40の全文を読む** → [GB21〜GB40の原稿目次](drafts/gb21-40/README.md)と[レビュー記録](drafts/gb21-40/REVIEW.md)
- **絵・音楽の配置と残作業を確認する** → [素材ハンドオフ](ASSET_HANDOFF.md)
- **中編にどの絵が入ったかを見る** → [中編の素材一覧](MEDIUM_ASSETS.md)
- **テスト結果と未確認の範囲を知る** → [検証記録](VALIDATION.md)
- **BGMの試聴を進める** → [試聴手順](AUDIO_REVIEW.md)と[audio-review.html](audio-review.html)

## 中編3作

- **[M01 潮待ちの劇場](drafts/medium01/README.md)**：船旅と舞台。全12章・322節・6結末。四人で劇場船を動かし、九日目の祭へ一本の芝居を届けます。
- **[M02 灰冠迷宮と星火の剣](drafts/medium02/README.md)**：ダンジョン・剣と魔法。全12章・339節・4結末。剣と有限の霊力を使い、町の灯を救うため迷宮へ潜ります。
- **[M03 空渡り便の二度目の人生](drafts/medium03/README.md)**：異世界転生と竜便。全16章・304節・3結末。浮島で生まれ直した主人公が、竜と郵便を運び、帰郷後の仕事を選びます。

各作の目次から章別本文、作者用設計書、原稿レビューを開けます。作者用資料には結末の情報を含みます。フォルダ名の `drafts` は原稿の保存場所で、中編3作はゲーム実装済みです。[中編の実装仕様](MEDIUM_IMPLEMENTATION.md)に、原稿からの変換と七つの記録の扱いを説明しています。

## 残っている確認

GB01〜GB20・中編3作・共通本棚の素材77点は制作・配置済みです。GB21〜GB40の専用画像・BGMは未制作です。`asset-plan.json` の `nextBatch` は空です。これは導入済み23作の制作計画です。新作20作の素材は含みません。現在の未完了項目は次のとおりです。

1. **BGM24曲の聴感確認**：音色、圧縮による変化、継ぎ目、3周連続での聴こえ方を試聴し、曲別の判定を保存します。[手順](AUDIO_REVIEW.md)
2. **実機での確認**：Safari実機とWindows・macOS・Android・iOSで、直接ファイルを開いた表示、音楽、保存・読込を確認します。Linuxの自動試験とは別の確認です。
3. **Web公開する場合の確認**：公開先URLでの読込と保存・読込を確認します。[公開手順](HOSTING.md)

## 編集するファイル

- **短編の初版**：`data/stories/gb01.json`〜`gb20.json`。取得時の識別情報は[data/source-manifest.json](../data/source-manifest.json)に保持しています。
- **短編の第2版**：`data/editions/gb01-v2.json`〜`gb20-v2.json`。初版と別の正本です。
- **GB21〜GB40の本文**：`doc/drafts/gb21-40/gb21.md`〜`gb40.md`。条件・更新の対応定義は `data/short-adapters/`。[実装仕様](SHORTS_21_40_IMPLEMENTATION.md)に編集と検査の手順があります。
- **中編の本文**：`doc/drafts/medium01/`〜`medium03/`の章別Markdown。導入・記録の宣言と変換処理は[scripts/medium-stories.cjs](../scripts/medium-stories.cjs)にあります。
- **素材の配置**：[assets/manifest.json](../assets/manifest.json)。作品・節と、実際に使う画像・音楽を結び付けます。
- **素材の制作状況**：[asset-plan.json](asset-plan.json)。素材ID・制作状態・次の制作対象を記録します。ゲームの配置を変える台帳とは役割が違います。
- **画像・音楽の編集原本**：[sources/](../sources/README.md)。PNG、生成プロンプト、音符・編成、寸法・音量・SHA-256の記録を保持しています。

変更後はリポジトリ直下で次を実行します。Node.js 24以上を使用します。

```sh
npm run build
npm run check
npm test
```

`js/stories.js`・`js/editions.js`・`js/medium.js`・`js/assets.js`、`data/medium/`、`doc/scenarios/`、`doc/audio-review-data.js`は生成物です。直接編集せず、対応する正本を変更して再生成します。本文・条件・効果を変更するときは、作品の内容版と保存互換も確認してください。

## 設計資料と履歴

- [モデルv1.2全文](SCENARIO_MODEL_V1_2.md)：短編GB01〜GB20の制作モデル。
- [モデルv1.2b全文](SCENARIO_MODEL_V1_2B.md)：中編3作とGB21〜GB40の制作モデル。
- [モデルと実装の対応](MODEL_IMPLEMENTATION.md)：条件・効果・本文・保存・版の仕組み。
- [初版の原稿照合記録](SOURCE_REVIEW.md)：制作時の文章・根拠のレビュー。
- [画風の採用方針](ART_DIRECTION.md)：採用Aの少色ドット絵と、比較用のB・C。
- [素材の制作履歴](asset-production-log.md)：第1〜11回の制作・修正・採用記録。
- [2026年10月20日までの検証履歴](validation/HISTORY_2026-10-20.md)：素材第9回までの試験と不具合調査。現在の件数は[検証記録](VALIDATION.md)を参照します。
