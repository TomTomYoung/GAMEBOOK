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
