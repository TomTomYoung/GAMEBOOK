# GB21〜GB40の絵と音楽

**2026-10-24：GB21〜GB24の12素材を導入済みです。GB25〜GB40の48素材は未制作です。** 全20作で表紙20点・挿絵20点・BGM20曲を制作する計画です。全作品のゲーム本体は実装済みです。

共通本棚・既存作品を含む全体では、画像61点・BGM28曲、計89点を導入済みです。制作台帳は[asset-plan.json](asset-plan.json)、配置は[実行用マニフェスト](../assets/manifest.json)です。`counts`は導入済み、`plannedCounts`は計画全体、`remainingCounts`は未制作を示します。

## 表示と音楽

表紙は本棚・導入・挿絵指定のない節に表示します。挿絵は指定節だけで切り替え、音楽はそのまま継続します。小さい横画面では従来どおり本文を優先します。音楽は初期OFFです。本文・選択肢・結末・記録形式は変更していません。

## 導入済みの4作

### GB21 百足椅子の晩餐

[本文](drafts/gb21-40/gb21.md)

- **[表紙](../assets/images/gb21-cover.webp)**（`IMG-GB21-COVER`）：食堂の百足椅子。細い木の脚を持つ空の椅子と銀器、床の丸パン。
  [採用PNG](../sources/images/gb21-cover-a.png)・[未採用初稿](../sources/images/gb21-cover-draft.png)・[英語プロンプト全文](../sources/images/gb21-cover.prompt.txt)。1584×993px、WebP 239,068 bytes。
- **[06「パイの直径」](../assets/images/gb21-scene-06.webp)**（`IMG-GB21-SCENE-06`）：厨房の低い台に置いた、窯から出した洋梨の大パイと鉄板。
  [採用PNG](../sources/images/gb21-scene-06-a.png)・[未採用初稿](../sources/images/gb21-scene-06-draft.png)・[英語プロンプト全文](../sources/images/gb21-scene-06.prompt.txt)。1584×993px、WebP 189,660 bytes。

**BGM：[ 二歩と休みの晩餐 ](../assets/audio/gb21-theme.ogg)**（`BGM-GB21`）。84 BPM・91.43秒。音符と編成は[score.json](../sources/audio/gb21-theme.score.json)。-17.96 LUFS-I、true peak -8.68 dBTP、763,522 bytes。

**本文との照合**：百足椅子は多数の細脚として表現し、厳密な本数を判断材料にしない。パイの切分け、食堂への帰還、衣服の破損を先取りしない。

### GB22 雪原の二番手

[本文](drafts/gb21-40/gb22.md)

- **[表紙](../assets/images/gb22-cover.webp)**（`IMG-GB22-COVER`）：青い帆、細い橇、救援綱。凍った入江から白樺の角へ続くコース。
  [採用PNG](../sources/images/gb22-cover-a.png)・[未採用初稿](../sources/images/gb22-cover-draft.png)・[英語プロンプト全文](../sources/images/gb22-cover.prompt.txt)。1584×993px、WebP 230,850 bytes。
- **[04「二つの弧」](../assets/images/gb22-scene-04.webp)**（`IMG-GB22-SCENE-04`）：白樺の根元を通る短い固雪の段と、長く回り込む滑らかな氷の外側。
  [採用PNG](../sources/images/gb22-scene-04-a.png)・[未採用初稿](../sources/images/gb22-scene-04-draft.png)・[英語プロンプト全文](../sources/images/gb22-scene-04.prompt.txt)。1584×993px、WebP 189,292 bytes。

**BGM：[ 白樺の弧 ](../assets/audio/gb22-theme.ogg)**（`BGM-GB22`）。80 BPM・96.00秒。音符と編成は[score.json](../sources/audio/gb22-theme.score.json)。-17.95 LUFS-I、true peak -8.72 dBTP、778,847 bytes。

**本文との照合**：先行・後行や残り余力を絵に固定しない。転倒、裂けた帆、救援、優勝を描かない。段は固雪で、木の障害物ではない。

### GB23 あなたより先に帰った影

[本文](drafts/gb21-40/gb23.md)

- **[表紙](../assets/images/gb23-cover.webp)**（`IMG-GB23-COVER`）：帰宅する家の明るい玄関と台所の窓。鍋の湯気と濡れた敷石。
  [採用PNG](../sources/images/gb23-cover-a.png)・[未採用初稿](../sources/images/gb23-cover-draft.png)・[英語プロンプト全文](../sources/images/gb23-cover.prompt.txt)。1584×993px、WebP 255,196 bytes。
- **[09「先に開けた引出し」](../assets/images/gb23-scene-09.webp)**（`IMG-GB23-SCENE-09`）：開いた小引出しの横に置いた木の舟。少し傾く帆柱を、新しい白い糸で支えている。
  [採用PNG](../sources/images/gb23-scene-09-a.png)・[未採用初稿](../sources/images/gb23-scene-09-draft.png)・[英語プロンプト全文](../sources/images/gb23-scene-09.prompt.txt)。1585×992px、WebP 132,684 bytes。

**BGM：[ 先に灯った窓 ](../assets/audio/gb23-theme.ogg)**（`BGM-GB23`）。64 BPM・90.00秒。音符と編成は[score.json](../sources/audio/gb23-theme.score.json)。-17.95 LUFS-I、true peak -9.78 dBTP、552,790 bytes。

**本文との照合**：人物や影の人数、融合や同居の決定を絵に固定しない。舟はまだ水に浮かべず、明日の約束の成否を示さない。糊で完全に直した状態にしない。

### GB24 赤い傘の相棒

[本文](drafts/gb21-40/gb24.md)

- **[表紙](../assets/images/gb24-cover.webp)**（`IMG-GB24-COVER`）：川沿いの逆雨楼と鐘楼、中庭の赤い傘、上へ向かう水筋。
  [採用PNG](../sources/images/gb24-cover-a.png)・[未採用初稿](../sources/images/gb24-cover-draft.png)・[英語プロンプト全文](../sources/images/gb24-cover.prompt.txt)。1584×993px、WebP 243,632 bytes。
- **[05「名前を呼べる距離」](../assets/images/gb24-scene-05.webp)**（`IMG-GB24-SCENE-05`）：葉のない銀の木の最下段にある閉じた檻。尾先の白い黒い鳥と、留め金の三本の音管。
  [採用PNG](../sources/images/gb24-scene-05-a.png)・[未採用初稿](../sources/images/gb24-scene-05-draft.png)・[英語プロンプト全文](../sources/images/gb24-scene-05.prompt.txt)。1584×993px、WebP 206,058 bytes。

**BGM：[ 同じ左を向く ](../assets/audio/gb24-theme.ogg)**（`BGM-GB24`）。88 BPM・87.27秒。音符と編成は[score.json](../sources/audio/gb24-theme.score.json)。-17.95 LUFS-I、true peak -7.76 dBTP、725,479 bytes。

**本文との照合**：音管三本、閉じた扉、黒い鳥の白い尾先を目視照合。珠の取得前後どちらでも使える。解放、傘の損傷、同行の結末を先取りしない。

## 画像の採用と原本

組込みimagegenで全8点を生成し、各初稿と採用Aを参照して色面・輪郭・陰影を整理しました。GB23表紙では、本文の着衣と混同しやすい窓内の灰色シャツを戸棚へ置き換えました。GB22挿絵では内側の固雪の段を明確にし、外側の氷の細かな亀裂を整理しました。GB24挿絵の音管は三本であることを目視確認しました。

原寸・縦横比を保持したままWebP化し、機械的な縮小・拡大・減色はしていません。PNGとWebPの寸法・デコード・不透明性・容量を確認し、SHA-256は[原本台帳](../sources/images/manifest.json)に保存しています。A・B・Cの参照画像、既存77素材の配布物は保持しています。

## 音楽の制作

作品ごとに新しい旋律と伴奏を書き、既存の加算合成音色で制作しました。第12回の構成元は[compose-batch-12.py](../sources/audio/compose-batch-12.py)、通常の再生成元は4個のscore.jsonです。既存24曲の音符と配布音源は変更していません。

- GB21：二歩と休みの撥弦にクラリネットが応える舞曲。
- GB22：均等な撥弦と木管による、雪面を滑るような流れ。
- GB23：同じ短句を別の音色で返し、家の温かさと違和感を重ねる。
- GB24：少しずらした撥弦と木管が、二人の呼吸を作る。

全長・音量・true peak・有限値・容量・ループ境界を測定しました。[render-report.json](../sources/audio/render-report.json)に対象音源のハッシュと結果があります。聴感・圧縮品質・3周連続試聴は未実施です。[試聴ページ](audio-review.html)から28曲を確認できます。

## 次の制作対象

**次はGB25〜GB28の12点です。** 以後も番号順に進みます。次の各作品に表紙1点・挿絵1点・BGM1曲を用意します。挿絵の節、曲名・編成は本文と作者メモを読んでから決定します。台帳の未選定の節・パスはnullで、実行用マニフェストへは未登録です。

- [GB25 竜の背中の菜園](drafts/gb21-40/gb25.md)：表紙・挿絵・BGMの3点が未制作。
- [GB26 百年遅れの開演](drafts/gb21-40/gb26.md)：表紙・挿絵・BGMの3点が未制作。
- [GB27 女王のいない盤](drafts/gb21-40/gb27.md)：表紙・挿絵・BGMの3点が未制作。
- [GB28 空から落ちるまでの会話](drafts/gb21-40/gb28.md)：表紙・挿絵・BGMの3点が未制作。
- [GB29 ひと晩だけの悪役](drafts/gb21-40/gb29.md)：表紙・挿絵・BGMの3点が未制作。
- [GB30 牙のない獣の冬](drafts/gb21-40/gb30.md)：表紙・挿絵・BGMの3点が未制作。
- [GB31 燃えない手紙を燃やす日](drafts/gb21-40/gb31.md)：表紙・挿絵・BGMの3点が未制作。
- [GB32 砂漠の競売人](drafts/gb21-40/gb32.md)：表紙・挿絵・BGMの3点が未制作。
- [GB33 うたわない人魚の伴奏](drafts/gb21-40/gb33.md)：表紙・挿絵・BGMの3点が未制作。
- [GB34 逆さ城の落とし物](drafts/gb21-40/gb34.md)：表紙・挿絵・BGMの3点が未制作。
- [GB35 魔王の留守番](drafts/gb21-40/gb35.md)：表紙・挿絵・BGMの3点が未制作。
- [GB36 雨の中で笑う鎧](drafts/gb21-40/gb36.md)：表紙・挿絵・BGMの3点が未制作。
- [GB37 借りた顔で会いに行く](drafts/gb21-40/gb37.md)：表紙・挿絵・BGMの3点が未制作。
- [GB38 地図にない日曜日](drafts/gb21-40/gb38.md)：表紙・挿絵・BGMの3点が未制作。
- [GB39 栄光を食べる獣](drafts/gb21-40/gb39.md)：表紙・挿絵・BGMの3点が未制作。
- [GB40 最後の頁を盗んだ子](drafts/gb21-40/gb40.md)：表紙・挿絵・BGMの3点が未制作。

## 検証と引継ぎ

[現在の検証記録](VALIDATION.md)に今回の結果と未確認範囲を記載します。[PR #16の履歴](validation/HISTORY_PR16.md)は画像追加前の507ケースで、今回の結果とは分けて扱います。新作の素材試験では4表紙・4曲、4挿絵への全到達状態、画像切替時のBGM継続、4画面サイズ、保存と再開を確認します。
