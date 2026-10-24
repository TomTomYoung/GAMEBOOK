# GB21〜GB40の絵と音楽

**2026-10-24：GB21〜GB36の48素材を導入済みです。GB37〜GB40の12素材は未制作です。** 全20作で表紙20点・挿絵20点・BGM20曲を制作する計画です。全作品のゲーム本体は実装済みです。

共通本棚・既存作品を含む全体では、画像85点・BGM40曲、計125点を導入済みです。制作台帳は[asset-plan.json](asset-plan.json)、配置は[実行用マニフェスト](../assets/manifest.json)です。`counts`は導入済み、`plannedCounts`は計画全体、`remainingCounts`は未制作を示します。

## 表示と音楽

表紙は本棚・導入・挿絵指定のない節に表示します。挿絵は指定節だけで切り替え、音楽はそのまま継続します。小さい横画面では従来どおり本文を優先します。音楽は初期OFFです。本文・選択肢・結末・記録形式は変更していません。

## 導入済みの16作

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

### GB25 竜の背中の菜園

[本文](drafts/gb21-40/gb25.md)

- **[表紙](../assets/images/gb25-cover.webp)**（`IMG-GB25-COVER`）：昼の谷で休む大きな四足の竜。背中の鱗に積もる土と根の上に、段々畑と小さな家がある。
  [採用PNG](../sources/images/gb25-cover-a.png)・[未採用初稿](../sources/images/gb25-cover-draft.png)・[英語プロンプト全文](../sources/images/gb25-cover.prompt.txt)。1586×992px、WebP 417,512 bytes。

- **[05「葉の天井」](../assets/images/gb25-scene-05.webp)**（`IMG-GB25-SCENE-05`）：葉の天井から垂れる雨豆。ふくらんだ莢と平たい若い莢が、露を付けて同じ蔓に残る。
  [採用PNG](../sources/images/gb25-scene-05-a.png)・[未採用初稿](../sources/images/gb25-scene-05-draft.png)・[英語プロンプト全文](../sources/images/gb25-scene-05.prompt.txt)。1584×993px、WebP 277,662 bytes。

**BGM：[背中の水路](../assets/audio/gb25-theme.ogg)**（`BGM-GB25`）。64 BPM・90.00秒。音符と編成は[score.json](../sources/audio/gb25-theme.score.json)。-17.93 LUFS-I、true peak -9.62 dBTP、713,537 bytes。

**本文との照合**：竜は地上を歩く四足として描く。畑の土と根を鱗の上に置き、皮膚を掘る描写にしない。昼の光を保つ。挿絵は収穫前で、莢を取る選択を先取りしない。

### GB26 百年遅れの開演

[本文](drafts/gb21-40/gb26.md)

- **[表紙](../assets/images/gb26-cover.webp)**（`IMG-GB26-COVER`）：古い市民劇場の木の舞台。中央の青い灯、赤い幕、舞台装置の門と袖の道具箱。
  [採用PNG](../sources/images/gb26-cover-a.png)・[未採用初稿](../sources/images/gb26-cover-draft.png)・[英語プロンプト全文](../sources/images/gb26-cover.prompt.txt)。1586×992px、WebP 172,066 bytes。

- **[02「王が戻る話」](../assets/images/gb26-scene-02.webp)**（`IMG-GB26-SCENE-02`）：開いた道具箱の古い銀色の王冠。欠けた実飾りの針金と布、その隣の底が抜けたやかんと鉄板。
  [採用PNG](../sources/images/gb26-scene-02-a.png)・[未採用初稿](../sources/images/gb26-scene-02-draft.png)・[英語プロンプト全文](../sources/images/gb26-scene-02.prompt.txt)。1585×992px、WebP 170,628 bytes。

**BGM：[青い灯の幕間](../assets/audio/gb26-theme.ogg)**（`BGM-GB26`）。84 BPM・91.43秒。音符と編成は[score.json](../sources/audio/gb26-theme.score.json)。-17.95 LUFS-I、true peak -7.05 dBTP、749,015 bytes。

**本文との照合**：王冠とやかんは各一つ。王冠の欠けた飾りと短い針金、やかんの開いた底を確認。小道具は選択前で、配役・布の内張り・開演の成否を固定しない。

### GB27 女王のいない盤

[本文](drafts/gb21-40/gb27.md)

- **[表紙](../assets/images/gb27-cover.webp)**（`IMG-GB27-COVER`）：川を望む喫茶店の木の卓。白い鳥の駒と黒い門番、木の盤、旅鞄と胡桃。
  [採用PNG](../sources/images/gb27-cover-a.png)・[未採用初稿](../sources/images/gb27-cover-draft.png)・[英語プロンプト全文](../sources/images/gb27-cover.prompt.txt)。1584×993px、WebP 289,594 bytes。

- **[03「一手目、正面の椅子」](../assets/images/gb27-scene-03.webp)**（`IMG-GB27-SCENE-03`）：三つの門を描いた木の盤。左は木のある庭、中央はまっすぐな道、右は川の橋。白い鳥と、盤外の伏せた札に乗る黒い門番。
  [採用PNG](../sources/images/gb27-scene-03-a.png)・[未採用初稿](../sources/images/gb27-scene-03-draft.png)・[英語プロンプト全文](../sources/images/gb27-scene-03.prompt.txt)。1586×992px、WebP 247,780 bytes。

**BGM：[三手のあとで](../assets/audio/gb27-theme.ogg)**（`BGM-GB27`）。80 BPM・96.00秒。音符と編成は[score.json](../sources/audio/gb27-theme.score.json)。-17.96 LUFS-I、true peak -6.67 dBTP、417,843 bytes。

**本文との照合**：本文独自の三門の遊びとして描く。白い鳥と黒い門番は各一つ。門番は伏せた札の上で盤外に待つ。門の左右と中央を照合し、一手目の正解や勝敗を絵で示さない。

### GB28 空から落ちるまでの会話

[本文](drafts/gb21-40/gb28.md)

- **[表紙](../assets/images/gb28-cover.webp)**（`IMG-GB28-COVER`）：透明な風壁に囲まれた円形の石の庭。谷へ向く二脚の隣り合う椅子と青い花、遠くの河川と港。
  [採用PNG](../sources/images/gb28-cover-a.png)・[未採用初稿](../sources/images/gb28-cover-draft.png)・[英語プロンプト全文](../sources/images/gb28-cover.prompt.txt)。1585×992px、WebP 328,540 bytes。

- **[08「雲の下の水」](../assets/images/gb28-scene-08.webp)**（`IMG-GB28-SCENE-08`）：雲を抜けて降りる庭から望む広い川。手前の透明な風壁と石の縁、青い花、遠くの小さな赤い受け台。
  [採用PNG](../sources/images/gb28-scene-08-a.png)・[未採用初稿](../sources/images/gb28-scene-08-draft.png)・[英語プロンプト全文](../sources/images/gb28-scene-08.prompt.txt)。1586×992px、WebP 328,468 bytes。

**BGM：[降りてゆく庭](../assets/audio/gb28-theme.ogg)**（`BGM-GB28`）。64 BPM・90.00秒。音符と編成は[score.json](../sources/audio/gb28-theme.score.json)。-17.95 LUFS-I、true peak -10.17 dBTP、565,792 bytes。

**本文との照合**：水平な庭と連続する透明な風壁を保ち、安全な交通機関として描く。表紙の椅子は隣り合う二脚。挿絵は降下中で受け台が遠く、理由を話したかどうかに依存する人物の行動や関係の結末を固定しない。

### GB29 ひと晩だけの悪役

[本文](drafts/gb21-40/gb29.md)

- **[表紙](../assets/images/gb29-cover.webp)**（`IMG-GB29-COVER`）：夜冠祭の支度をする場所。赤い裏地の黒マント、黒帽子、三つの尖りを持つ金塗りの木の冠と赤い腕章。
  [採用PNG](../sources/images/gb29-cover-a.png)・[未採用初稿](../sources/images/gb29-cover-draft.png)・[英語プロンプト全文](../sources/images/gb29-cover.prompt.txt)。1586×992px、WebP 164,006 bytes。

- **[11「鐘まで七歩」](../assets/images/gb29-scene-11.webp)**（`IMG-GB29-SCENE-11`）：夜の荷車置き場に下がる黒い鐘。手前には二つの空の布枠があり、周囲を回れる床が空いている。
  [採用PNG](../sources/images/gb29-scene-11-a.png)・[未採用初稿](../sources/images/gb29-scene-11-draft.png)・[英語プロンプト全文](../sources/images/gb29-scene-11.prompt.txt)。1585×992px、WebP 192,382 bytes。

**BGM：[黒い鐘の七歩](../assets/audio/gb29-theme.ogg)**（`BGM-GB29`）。84 BPM・91.43秒。音符と編成は[score.json](../sources/audio/gb29-theme.score.json)。-17.95 LUFS-I、true peak -8.16 dBTP、744,357 bytes。

**本文との照合**：木の冠の尖りは三つ、赤い裏地と腕章を保持。挿絵の空の布枠は二つ、鐘の綱は地面から届く位置。名乗り・捕縛・鐘を鳴らす勝敗を絵で固定しない。

### GB30 牙のない獣の冬

[本文](drafts/gb21-40/gb30.md)

- **[表紙](../assets/images/gb30-cover.webp)**（`IMG-GB30-COVER`）：吹雪の山小屋へ入る老いた灰色の岩犬ムク。白い頬、低い腰、首輪と金具、暖かな炉の光。
  [採用PNG](../sources/images/gb30-cover-a.png)・[未採用初稿](../sources/images/gb30-cover-draft.png)・[英語プロンプト全文](../sources/images/gb30-cover.prompt.txt)。1587×991px、WebP 205,820 bytes。

- **[08「二つの器」](../assets/images/gb30-scene-08.webp)**（`IMG-GB30-SCENE-08`）：山小屋の炉にかかる鍋と、夕食をよそう前の空の椀と皿。片方の縁には小さな欠けがある。
  [採用PNG](../sources/images/gb30-scene-08-a.png)・[未採用初稿](../sources/images/gb30-scene-08-draft.png)・[英語プロンプト全文](../sources/images/gb30-scene-08.prompt.txt)。1586×992px、WebP 133,208 bytes。

**BGM：[炉のそばの二つの器](../assets/audio/gb30-theme.ogg)**（`BGM-GB30`）。60 BPM・96.00秒。音符と編成は[score.json](../sources/audio/gb30-theme.score.json)。-17.95 LUFS-I、true peak -8.94 dBTP、756,515 bytes。

**本文との照合**：ムクは老いた灰色の荷獣として描き、若い個体や救出後の回復にしない。挿絵は配膳前の空の器二つに絞り、準備・残り食料・薪・給餌回数を固定しない。皿の印は裏側のため見せない。

### GB31 燃えない手紙を燃やす日

[本文](drafts/gb21-40/gb31.md)

- **[表紙](../assets/images/gb31-cover.webp)**（`IMG-GB31-COVER`）：庭の見える昼の台所。斜めの食卓、空いた母の木の椅子、四つ折りの手紙。
  [採用PNG](../sources/images/gb31-cover-a.png)・[未採用初稿](../sources/images/gb31-cover-draft.png)・[英語プロンプト全文](../sources/images/gb31-cover.prompt.txt)。1586×992px、WebP 185,794 bytes。

- **[02「火のつかない端」](../assets/images/gb31-scene-02.webp)**（`IMG-GB31-SCENE-02`）：朝の炉のそばの鍋敷きに戻した、燃えずに残る火守り紙の手紙。白い縁に赤い光が映る。
  [採用PNG](../sources/images/gb31-scene-02-a.png)・[未採用初稿](../sources/images/gb31-scene-02-draft.png)・[英語プロンプト全文](../sources/images/gb31-scene-02.prompt.txt)。1586×992px、WebP 140,684 bytes。

**BGM：[折り目の隣に](../assets/audio/gb31-theme.ogg)**（`BGM-GB31`）。64 BPM・90.00秒。音符と編成は[score.json](../sources/audio/gb31-theme.score.json)。-17.95 LUFS-I、true peak -7.93 dBTP、356,881 bytes。

**本文との照合**：手紙は封筒ではなく折り畳んだ紙。挿絵では原本を傷めず、字を絵の必須情報にしない。家庭炉で燃やした原本や、後の家具移動・告白・処分結果を描かない。

### GB32 砂漠の競売人

[本文](drafts/gb21-40/gb32.md)

- **[表紙](../assets/images/gb32-cover.webp)**（`IMG-GB32-COVER`）：昼の砂漠の市場にある荷車一台の茶屋。茶釜、布の日除け、三脚の木の椅子。
  [採用PNG](../sources/images/gb32-cover-a.png)・[未採用初稿](../sources/images/gb32-cover-draft.png)・[英語プロンプト全文](../sources/images/gb32-cover.prompt.txt)。1586×992px、WebP 200,964 bytes。

- **[02「庭の裏側」](../assets/images/gb32-scene-02.webp)**（`IMG-GB32-SCENE-02`）：競売台の折り庭。大木と三つの石の腰掛け、独立した小鉢、めくった敷物の裏に三つの丸い印。
  [採用PNG](../sources/images/gb32-scene-02-a.png)・[未採用初稿](../sources/images/gb32-scene-02-draft.png)・[英語プロンプト全文](../sources/images/gb32-scene-02.prompt.txt)。1586×992px、WebP 215,400 bytes。

**BGM：[木陰をひらく茶](../assets/audio/gb32-theme.ogg)**（`BGM-GB32`）。80 BPM・96.00秒。音符と編成は[score.json](../sources/audio/gb32-theme.score.json)。-17.94 LUFS-I、true peak -10.29 dBTP、795,232 bytes。

**本文との照合**：茶屋の椅子と庭の石の腰掛けは各三つ。親木一つと独立した小鉢一つ、敷物の裏の丸印三つを保持。通常の昼の木陰として描き、庭の落札者・小鉢譲渡・残金を先取りしない。

### GB33 うたわない人魚の伴奏

[本文](drafts/gb21-40/gb33.md)

- **[表紙](../assets/images/gb33-cover.webp)**（`IMG-GB33-COVER`）：昼の入り江に面した桟橋の足踏みオルガンと腰掛け。鍵盤と二つの踏板、水辺の演奏板。
  [採用PNG](../sources/images/gb33-cover-a.png)・[未採用初稿](../sources/images/gb33-cover-draft.png)・[英語プロンプト全文](../sources/images/gb33-cover.prompt.txt)。1585×992px、WebP 214,226 bytes。

- **[05「石の名前」](../assets/images/gb33-scene-05.webp)**（`IMG-GB33-SCENE-05`）：浅瀬の演奏板に離して置いた黒・白・赤の石と、桟橋の下の空洞。
  [採用PNG](../sources/images/gb33-scene-05-a.png)・[未採用初稿](../sources/images/gb33-scene-05-draft.png)・[英語プロンプト全文](../sources/images/gb33-scene-05.prompt.txt)。1586×992px、WebP 138,836 bytes。

**BGM：[返事を置く水辺](../assets/audio/gb33-theme.ogg)**（`BGM-GB33`）。64 BPM・90.00秒。音符と編成は[score.json](../sources/audio/gb33-theme.score.json)。-17.95 LUFS-I、true peak -8.34 dBTP、539,125 bytes。

**本文との照合**：初期の石三つを確認。追加の白石を受け取る前の05節だけに配置する。赤石は中央へ置かず、停止を既成事実にしない。歌唱・治癒・演目の合意を描かず、ネル自身の音への関心と主人公の旋律の双方を尊重する。

### GB34 逆さ城の落とし物

[本文](drafts/gb21-40/gb34.md)

- **[表紙](../assets/images/gb34-cover.webp)**（`IMG-GB34-COVER`）：床の室内履き棚、天井側に靴底を付ける四つの長靴、輪付きの連続した手すり。
  [採用PNG](../sources/images/gb34-cover-a.png)・[未採用初稿](../sources/images/gb34-cover-draft.png)・[英語プロンプト全文](../sources/images/gb34-cover.prompt.txt)。1585×992px、WebP 176,824 bytes。

- **[06「右上の球」](../assets/images/gb34-scene-06.webp)**（`IMG-GB34-SCENE-06`）：荷送り窓の右上に付く真鍮の球と上枠の羽根。右壁から伸びる棚、左の隙間、左下の空の受け皿。
  [採用PNG](../sources/images/gb34-scene-06-a.png)・[未採用初稿](../sources/images/gb34-scene-06-draft.png)・[英語プロンプト全文](../sources/images/gb34-scene-06.prompt.txt)。1585×992px、WebP 77,732 bytes。

**BGM：[手すりの曲がる先](../assets/audio/gb34-theme.ogg)**（`BGM-GB34`）。80 BPM・96.00秒。音符と編成は[score.json](../sources/audio/gb34-theme.score.json)。-17.95 LUFS-I、true peak -8.78 dBTP、762,524 bytes。

**本文との照合**：球は一つで右上。棚は右壁から水平に伸び、左壁との間に球が通る隙間がある。上枠は連続し、下枠は左下の出口へ傾く。操作順や正解の矢印を加えず、人物と取っ手は画面外に置く。同行の一人・ミナと二人の双方で成立する。

### GB35 魔王の留守番

[本文](drafts/gb21-40/gb35.md)

- **[表紙](../assets/images/gb35-cover.webp)**（`IMG-GB35-COVER`）：午後の魔王の家。大きな玄関扉、庇、脇の椅子、庭先の荷車がある日常的な住まい。
  [採用PNG](../sources/images/gb35-cover-a.png)・[未採用初稿](../sources/images/gb35-cover-draft.png)・[英語プロンプト全文](../sources/images/gb35-cover.prompt.txt)。1585×992px、WebP 258,792 bytes。

- **[14「廊下の行進」](../assets/images/gb35-scene-14.webp)**（`IMG-GB35-SCENE-14`）：廊下でモフの前に止まる赤い鍋。鍋の短い脚は二本、モフは目と短い脚のある敷物。
  [採用PNG](../sources/images/gb35-scene-14-a.png)・[未採用初稿](../sources/images/gb35-scene-14-draft.png)・[英語プロンプト全文](../sources/images/gb35-scene-14.prompt.txt)。1586×992px、WebP 155,124 bytes。

**BGM：[鍋が先に行く午後](../assets/audio/gb35-theme.ogg)**（`BGM-GB35`）。84 BPM・91.43秒。音符と編成は[score.json](../sources/audio/gb35-theme.score.json)。-17.95 LUFS-I、true peak -7.84 dBTP、740,441 bytes。

**本文との照合**：鍋がまだ混ぜられていない14節にだけ配置する。二本の脚と乾いた床を確認。匙はトトの手にあるため画面外とし、蓋に載せた初稿を修正した。方針で変わる客・クッション・布巾・札は描かず、迎える・手伝う・玄関の三状態で成立する。火災・破損・勝敗を付け足さない。

### GB36 雨の中で笑う鎧

[本文](drafts/gb21-40/gb36.md)

- **[表紙](../assets/images/gb36-cover.webp)**（`IMG-GB36-COVER`）：雨の広場の敷物と赤旗、裏面を見せた看板、刃先を丸めた貸剣。
  [採用PNG](../sources/images/gb36-cover-a.png)・[未採用初稿](../sources/images/gb36-cover-draft.png)・[英語プロンプト全文](../sources/images/gb36-cover.prompt.txt)。1584×993px、WebP 269,940 bytes。

- **[09「負け役はいらない」](../assets/images/gb36-scene-09.webp)**（`IMG-GB36-SCENE-09`）：敷物の上で刃先を丸めた剣を下げて構える黒鉄ジェロ。奥に賞金箱と赤旗、端の目安線。
  [採用PNG](../sources/images/gb36-scene-09-a.png)・[未採用初稿](../sources/images/gb36-scene-09-draft.png)・[英語プロンプト全文](../sources/images/gb36-scene-09.prompt.txt)。1585×992px、WebP 210,976 bytes。

**BGM：[雨の広場で一歩](../assets/audio/gb36-theme.ogg)**（`BGM-GB36`）。64 BPM・90.00秒。音符と編成は[score.json](../sources/audio/gb36-theme.score.json)。-17.95 LUFS-I、true peak -9.02 dBTP、658,255 bytes。

**本文との照合**：ジェロは自律する鎧として描き、人の顔を入れない。肩・肘・膝がつながり、右足を前に置く。目安線を新しい勝敗条件にせず、破損・転倒・賞金獲得・共演の成立を先取りしない。「間」の有無の二状態で成立する。看板と旗の本文はゲームの文章で読む。

## 画像の採用と原本

第12回では組込みimagegenで8点を生成し、各初稿と採用Aを参照して色面・輪郭・陰影を整理しました。GB23表紙では、本文の着衣と混同しやすい窓内の灰色シャツを戸棚へ置き換えました。GB22挿絵では内側の固雪の段を明確にし、外側の氷の細かな亀裂を整理しました。GB24挿絵の音管は三本であることを目視確認しました。

第13回も8点を組込みimagegenで生成し、初稿と採用Aを参照して色面を整理しました。GB25表紙は昼の光へ修正し、GB26挿絵は王冠の針金とやかんの開いた底、GB27挿絵は三門の配置と伏せた札上の門番を確認しました。GB28表紙は本文の隣の椅子に合わせて二脚を並べました。

第14回も8点を組込みimagegenで生成し、初稿と採用Aを参照して色面・輪郭を整理しました。GB29の冠は三つの尖り、空の布枠は二つ。GB30は配膳前の器二つを確認し、皿の裏の印は見せていません。GB31の手紙を封筒から四つ折りの紙へ修正しました。[表紙の中間稿](../sources/images/gb31-cover-intermediate.png)も保存しています。GB32は椅子・腰掛け・折る印の三つずつと、独立した小鉢を確認しました。

第15回も組込みimagegenで8点を生成し、初稿と採用Aを参照して色面・輪郭を整理しました。GB33は三つの石、GB34は天井側の四つの長靴の向きと窓内の棚・隙間を照合。GB35は鍋の二本脚を保ち、14節ではトトが持つ匙を蓋の上から除きました。GB36は敷物を明示し、無傷の鎧と丸めた貸剣を確認しました。

原寸・縦横比を保持したままWebP化し、機械的な縮小・拡大・減色はしていません。PNGとWebPの寸法・デコード・不透明性・容量を確認し、SHA-256は[原本台帳](../sources/images/manifest.json)に保存しています。A・B・Cの参照画像、第15回追加前の既存113素材の配布物は保持しています。

## 音楽の制作

作品ごとに新しい旋律と伴奏を書き、既存の加算合成音色で制作しました。第12回の構成元は[compose-batch-12.py](../sources/audio/compose-batch-12.py)、通常の再生成元は4個のscore.jsonです。第13回は[compose-batch-13.py](../sources/audio/compose-batch-13.py)と4個のscore.jsonを追加しました。第14回は[compose-batch-14.py](../sources/audio/compose-batch-14.py)と4個のscore.jsonを追加しました。第15回は[compose-batch-15.py](../sources/audio/compose-batch-15.py)と4個のscore.jsonを追加しました。既存36曲の音符と配布音源は変更していません。

- GB21：二歩と休みの撥弦にクラリネットが応える舞曲。
- GB22：均等な撥弦と木管による、雪面を滑るような流れ。
- GB23：同じ短句を別の音色で返し、家の温かさと違和感を重ねる。
- GB24：少しずらした撥弦と木管が、二人の呼吸を作る。

- GB25：丸い低音と木の響き、間の長い木管で菜園の日常を支える。
- GB26：撥弦の足取りへクラリネットが応える、劇場の軽いやり取り。
- GB27：鍵盤と撥弦の短い問いと応答で、考える間を残す。
- GB28：長い倍音と木管の旋律を柔らかな鍵盤へ渡し、静かな降下を保つ。

- GB29：撥弦とマリンバにクラリネットが応える、祭りの軽い足取り。
- GB30：低音とフェルト鍵盤の間に木管を置く、冬の炉の穏やかな曲。
- GB31：短く途切れる鍵盤の旋律で、言葉を待つ台所の間を残す。
- GB32：撥弦・マリンバと木管で、昼の市場の会話を支える。

- GB33：短い鍵盤と木管が余白を渡し合い、石・水・停止合図を模倣しない。
- GB34：撥弦と木管の上下する旋律で観察を支え、操作順を指示しない。
- GB35：丸い低音とマリンバ、クラリネットで家事の喜劇を支える。
- GB36：穏やかな鍵盤と木管で雨の勝負を支え、勝敗の合図を加えない。

全長・音量・true peak・有限値・容量・ループ境界を測定しました。[render-report.json](../sources/audio/render-report.json)に対象音源のハッシュと結果があります。聴感・圧縮品質・3周連続試聴は未実施です。[試聴ページ](audio-review.html)から40曲を確認できます。

## 次の制作対象

**次はGB37〜GB40の12点です。** 以後も番号順に進みます。次の各作品に表紙1点・挿絵1点・BGM1曲を用意します。挿絵の節、曲名・編成は本文と作者メモを読んでから決定します。台帳の未選定の節・パスはnullで、実行用マニフェストへは未登録です。

- [GB37 借りた顔で会いに行く](drafts/gb21-40/gb37.md)：表紙・挿絵・BGMの3点が未制作。
- [GB38 地図にない日曜日](drafts/gb21-40/gb38.md)：表紙・挿絵・BGMの3点が未制作。
- [GB39 栄光を食べる獣](drafts/gb21-40/gb39.md)：表紙・挿絵・BGMの3点が未制作。
- [GB40 最後の頁を盗んだ子](drafts/gb21-40/gb40.md)：表紙・挿絵・BGMの3点が未制作。

## 検証と引継ぎ

今回の対象はGB33〜GB36の12素材です。以前の成功数を今回の結果に流用せず、[現在の検証記録](VALIDATION.md)へ対象コミット・ジョブ・結果JSONを記載します。[PR #19の検証履歴](validation/HISTORY_PR19.md)は今回の追加前の記録です。追加4挿絵の到達状態は合計8通りで、[状態と選択列](validation/batch-15-scene-states.json)を保存しました。
