# 制作・実装・引継ぎ資料

このフォルダには、ゲームシナリオモデルの本文、この20作への適用方法、HTML版の実行仕様、次回以降に制作する絵と音楽の一覧を収録します。本文を読むだけで遊べるゲームの入口は、リポジトリ直下の `index.html` です。

## 使用したモデル

- [SCENARIO_MODEL_V1_2.md](SCENARIO_MODEL_V1_2.md)：使用モデルの**全文**。0〜25章、設計契約、検査基準、JSON雛形、生成指示、適用例を含みます。参照リンクだけの資料ではありません。
- [MODEL_IMPLEMENTATION.md](MODEL_IMPLEMENTATION.md)：モデルのどの要求を作品データ・実行エンジン・画面・セーブへ割り当てたか、対応範囲と版の管理を説明します。
- [SOURCE_REVIEW.md](SOURCE_REVIEW.md)：原稿制作時に行った本文と根拠の照合記録です。原稿のレビューと、HTML版の実行試験を区別しています。

## 次回以降の素材制作

- [ART_DIRECTION.md](ART_DIRECTION.md)：採用したAの少色ドット絵と制作基準。B・Cも比較画像と特徴を保存しています。
- [ASSET_HANDOFF.md](ASSET_HANDOFF.md)：絵と音楽の全一覧、作品別の制作指示、配置先の節番号、仕様、優先順、導入と確認の手順です。
- [asset-plan.json](asset-plan.json)：同じ素材計画を、作品ID・素材ID・予定ファイル名・制作状態から取り出せる形式で収録しています。画風はAに決定済み。22点が `installed`、残り40点が `planned` です。
- [../assets/manifest.json](../assets/manifest.json)：**実際に導入した素材だけ**を登録する実行用台帳です。共通画面とGB01〜GB10の画像・音楽22点を登録済みです。ほかの作品は `null`、場面一覧は空です。
- [asset-production-log.md](asset-production-log.md)：導入済み素材の原本、制作方法、実測値、確認した範囲と残る確認事項。

## 原稿と生成物の扱い

20作の正本は [../data/stories/](../data/stories/) の `gb01.json`〜`gb20.json` です。本文、選択肢、状態、結末、作者用の根拠が一つの作品データに入っています。取得元とバイト単位の識別情報は [../data/source-manifest.json](../data/source-manifest.json) にあります。

ブラウザ用の `js/stories.js` と `js/assets.js` は、正本から `node scripts/build-data.cjs` で生成します。生成物だけを直接編集すると、次の生成で変更が消えます。作品の条件・効果・本文を変えた場合は、作品の内容版と保存互換を見直してください。

ゲームを遊ぶために、この生成コマンドやサーバーの起動は必要ありません。

## 配布と検証

- [HTML版の検証記録](VALIDATION.md)：今回の自動試験と実ブラウザで確認した範囲。
- [Web公開の手順](HOSTING.md)：GitHub Pages用ワークフローと、ローカルの栞をWebへ持ち運ぶ手順。
