# 素材の編集原本

配布する実ファイルは `assets/images` と `assets/audio`、制作記録は [asset-production-log.md](../doc/asset-production-log.md) にあります。このフォルダやPython環境はゲームを遊ぶ際には不要です。

画像は生成PNG原本と指示を保管しています。GB01の原本は採用資料と共通なので `doc/art-direction/a-selected.png` を参照します。`images/manifest.json` に原本と配布用の寸法・SHA-256を記録しました。

音楽の正本は `audio/*.score.json` の音符・編成です。音色と残響は `scripts/render-music.py` にあり、外部サンプルや音源サービスを必要としません。制作環境は Python 3.12、numpy 2.3.5、scipy 1.17.0、ffmpeg 6.1.1です。

```sh
python -m pip install -r sources/audio/requirements.txt
python scripts/render-music.py
# 指定した曲だけ作り直す場合
python scripts/render-music.py --only gb02-theme gb03-theme
```

実行すると24bit WAVを一時生成し、assets/audioのOggとaudio/render-report.jsonを更新します。WAVは処理終了時に削除します。音符・合成処理からPCMを再生成できますが、エンコーダの版やコンテナの識別子によってOgg全体のバイト列は変わることがあります。

画像の配布用変換は原寸のまま、ffmpegの `-c:v libwebp -quality 95` を使用しました。生成原本を上書きせず、変換結果をassetsへ保存してください。

第2回の4曲（GB02〜GB05）は `audio/compose-batch-02.py` に旋律・和音・編成の構成元を保存しています。通常の音源再生成には上記のscore.jsonを使います。構成元を編集した時だけこのスクリプトを実行すると、対象4曲のscore.jsonが上書きされます。

```sh
python sources/audio/compose-batch-02.py
python scripts/render-music.py --only gb02-theme gb03-theme gb04-theme gb05-theme
```

第3回の5曲（GB06〜GB10）の構成元は `audio/compose-batch-03.py` です。実行すると対象5曲だけのscore.jsonを上書きします。フェルトピアノ風、電気鍵盤風、マリンバ風、倍音風、丸い低音の加算合成音色を追加しました。第1・2回の配布音源は変更していません。

```sh
python sources/audio/compose-batch-03.py
python scripts/render-music.py --only gb06-theme gb07-theme gb08-theme gb09-theme gb10-theme
```

第4回の5曲（GB11〜GB15）は `audio/compose-batch-04.py` に構成元を保存しています。実行すると対象5曲だけのscore.jsonを上書きします。低い木琴風と控えめな手拍子風の合成音色を追加しました。第1〜3回の配布音源は変更していません。

```sh
python sources/audio/compose-batch-04.py
python scripts/render-music.py --only gb11-theme gb12-theme gb13-theme gb14-theme gb15-theme
```

第4回から音源は一時ディレクトリで最後まで生成・検証し、書込みと同期が済んだファイルを最後に置換します。ブラウザ検査でもscore.jsonの小節数・BPMから求めた全長と実デコーダのdurationを照合し、途中で切れたファイルを検出します。

第5回の5曲（GB16〜GB20）の構成元は `audio/compose-batch-05.py` です。実行すると対象5曲だけのscore.jsonを上書きします。既存の合成音色を使用し、第1〜4回の音源は変更していません。

```sh
python sources/audio/compose-batch-05.py
python scripts/render-music.py --only gb16-theme gb17-theme gb18-theme gb19-theme gb20-theme
```

第5回のGB16・GB18は初稿も `images/gb16-cover-draft.png`・`images/gb18-cover-draft.png` に保管しました。初稿はゲームへ登録せず、採用版は `*-cover-a.png` です。各prompt.txtに初稿指示と修正指示を記録しています。

第6回はGB01〜GB05の場面挿絵です。採用版は `images/gbNN-scene-XX-a.png`、初稿は `*-draft.png`、指示は `*.prompt.txt` に保存しました。GB01は左右修正前の中間版も `gb01-scene-03-revision-1.png` に残しています。初稿・中間版はゲームに登録していません。原寸を維持し、再標本化や機械的な減色は行っていません。

第7回はGB06〜GB10の場面挿絵です。採用版 `images/gbNN-scene-XX-a.png` と指示全文 `*.prompt.txt` を保存しています。GB06・GB08・GB09・GB10は未採用初稿も `*-draft.png` に残しました。GB09は網の内側の鍵が分かるよう前後関係を修正しました。GB07は最初の生成画像を採用しています。

第8回はGB11〜GB15の場面挿絵です。採用版 `images/gbNN-scene-XX-a.png` と指示全文 `*.prompt.txt` を保存しました。GB12・GB13・GB15は未採用初稿も `*-draft.png` に残しています。GB12は水上に見えた初稿を空中市場へ修正し、GB13・GB15は細かな質感を整理しました。GB11・GB14は最初の生成画像を採用しています。

第9回はGB16〜GB20の場面挿絵です。全5点の採用版 `images/gbNN-scene-XX-a.png`、未採用初稿 `*-draft.png`、初稿と修正の指示全文 `*.prompt.txt` を保存しました。全点で初稿と採用Aを画像参照にして修正しています。GB17は二人の手の帰属が分かるよう袖色を整え、その他も細かな質感を減らしました。これで画像41点・音楽21曲の制作元が揃いました。

## 中編3作の素材（2026-10-23）

`images/m01-*`〜`m03-*`に採用PNGと英語プロンプトを、`audio/m01-theme.score.json`〜`m03-theme.score.json`に音符を保存しています。`python sources/audio/compose-medium.py`でスコア、`python scripts/render-music.py --only m01-theme m02-theme m03-theme`で配布音源を再生成できます。画風・配置・照合の詳細は[中編素材記録](../doc/MEDIUM_ASSETS.md)を参照してください。

第11回では中編の挿絵6点を追加しました。各作の挿絵は3点になり、同じ命名規則でPNG・英語プロンプトを保存しています。正確な章節・原寸・SHA-256は画像台帳と[中編素材記録](../doc/MEDIUM_ASSETS.md)を参照してください。


## 第12回：GB21〜GB24（2026-10-24）

4作の表紙・挿絵各1点、専用BGM各1曲です。`images/gb21-*`〜`gb24-*`に採用PNG、未採用初稿、英語の生成・修正プロンプト全文を保存しています。全8点を組込みimagegenで生成し、初稿と採用Aを参照して色面を整理しました。原寸・縦横比を保ってWebPへ変換し、寸法・SHA-256は画像台帳に記録しています。

音符の構成元は `audio/compose-batch-12.py`、通常の再生成元は `audio/gb21-theme.score.json`〜`gb24-theme.score.json`です。

```sh
python sources/audio/compose-batch-12.py
python scripts/render-music.py --only gb21-theme gb22-theme gb23-theme gb24-theme
```

本文との照合と配置は[新短編の素材記録](../doc/SHORTS_21_40_ASSETS.md)にあります。既存77素材と既存24曲の音符・配布物は保持しています。耳による確認は未実施です。

## 第13回：GB25〜GB28（2026-10-24）

4作へ表紙・挿絵・BGMを各1点追加しました。`images/gb25-*`〜`gb28-*`に採用PNG・未採用初稿・英語の生成と修正プロンプト全文があります。組込みimagegenで生成し、採用Aを参照して色面を整理しました。原寸・縦横比を保持してWebPへ変換しています。

音符と編成は `audio/compose-batch-13.py` と各score.jsonにあります。

```sh
python sources/audio/compose-batch-13.py
python scripts/render-music.py --only gb25-theme gb26-theme gb27-theme gb28-theme
```

配置・本文との照合・測定値は[新短編の素材記録](../doc/SHORTS_21_40_ASSETS.md)を参照してください。既存89素材は保持しています。耳による確認は未実施です。

## 第14回：GB29〜GB32（2026-10-24）

4作へ表紙・挿絵・BGMを各1点追加しました。`images/gb29-*`〜`gb32-*`に採用PNG・未採用初稿・英語の生成と修正プロンプト全文があります。GB31表紙の中間稿も保存しています。組込みimagegenで生成し、採用Aを参照して色面を整理しました。原寸・縦横比を保持してWebPへ変換しています。

音符と編成は `audio/compose-batch-14.py` と各score.jsonにあります。

```sh
python sources/audio/compose-batch-14.py
python scripts/render-music.py --only gb29-theme gb30-theme gb31-theme gb32-theme
```

配置・本文との照合・測定値は[新短編の素材記録](../doc/SHORTS_21_40_ASSETS.md)を参照してください。既存101素材は保持しています。耳による確認は未実施です。

## 第15回：GB33〜GB36（2026-10-24）

4作へ表紙・挿絵・BGMを各1点追加しました。`images/gb33-*`〜`gb36-*`に採用PNG・未採用初稿・英語の生成と修正プロンプト全文があります。組込みimagegenで生成し、採用Aを参照して色面を整理しました。原寸・縦横比を保持してWebPへ変換しています。

音符と編成は `audio/compose-batch-15.py` と各score.jsonにあります。

```sh
python sources/audio/compose-batch-15.py
python scripts/render-music.py --only gb33-theme gb34-theme gb35-theme gb36-theme
```

配置・本文との照合・測定値は[新短編の素材記録](../doc/SHORTS_21_40_ASSETS.md)を参照してください。既存113素材は保持しています。耳による確認は未実施です。

## 第16回：GB37〜GB40（2026-10-24）

4作へ表紙・挿絵・BGMを各1点追加し、計画した全137素材の導入が完了しました。`images/gb37-*`〜`gb40-*`に採用PNG・未採用初稿・英語の生成と修正プロンプト全文があります。組込みimagegenで生成し、採用Aを参照して色面を整理しました。原寸・縦横比を保持してWebPへ変換しています。

音符と編成は `audio/compose-batch-16.py` と各score.jsonにあります。

```sh
python sources/audio/compose-batch-16.py
python scripts/render-music.py --only gb37-theme gb38-theme gb39-theme gb40-theme
```

配置・本文との照合・測定値は[新短編の素材記録](../doc/SHORTS_21_40_ASSETS.md)を参照してください。既存125素材は保持しています。44曲の耳による確認は未実施です。
