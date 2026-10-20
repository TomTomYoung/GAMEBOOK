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
