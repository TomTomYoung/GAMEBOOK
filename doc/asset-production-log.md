# 素材制作・導入記録

現在：第3回までの22点を導入。全62点中22点（画像11/41点、音楽11/21曲）、残り40点。次はGB11〜GB15の表紙とBGM。

2026-10-19・第1回の記録：4点を導入。この時点では残り58点、次の制作予定はGB02〜GB05でした。以下に第1回の記録を保持し、後半へ第2回の8点、第3回の10点を追記しています。

![共通の本棚へ導入した画面](previews/batch-01-library.png)

[スマホでのGB01表示](previews/batch-01-mobile.png)。

## 画像の共通処理

採用したAの大きな色面・少ない陰影・階段状の輪郭を使用。生成原本をPNGで保管し、ffmpegのlibwebp、品質95で配布用に圧縮しました。第1回の寸法は原本の1586×992pxを維持しています。初回計画の1600×1000pxへ引き伸ばしたり、2560×1600px以上の原本があると扱ったりしません。厳密な8色への変換も行っていません。

表示は縦横比を保ったobject-fit:coverとpixelated。作品カードは帯の形へトリミングします。読書画面は通常176×110px、今回確認した1280×720では136×85px、スマホでは112×70pxまたは96×60px、横長で高さが足りない画面では省略します。

本棚とGB01を1280×720、390×844、360×640、844×390で検査し、日本語フォントを適用したスクリーンショットで構図・本文・選択肢の収まりを確認しました。画像は判断に必要な唯一の手掛かりにはしていません。

## IMG-GB01-COVER — 潮の下の郵便局

ユーザーが選んだAのPNGをそのまま原本として採用。新規に別構図へ描き直していません。窓の灯り、木の建物、欠けた白い塩柱、水面を主題とし、人物・郵袋・返送箱・救助舟を追加していません。GB01のsetupとauthor.entities／presentationを照合し、救出・回収・結界の復旧を達成済みとして描かないことを確認しました。空の色は共通の作品イメージであり、プレイ中の時刻表示ではありません。

生成手段：imagegen。採用の経緯と色指定は[ART_DIRECTION.md](ART_DIRECTION.md)。配置先はGB01の作品カードと全節共通の既定画像です。

- 配布用：`assets/images/gb01-cover.webp`
- PNG原本：`doc/art-direction/a-selected.png`
- 実寸：1586×992px、WebP、不透明
- 容量：113,262 bytes
- 配布用SHA-256：`5950572a751d778a139387f127dcd5f5966e44f44e1ee3800188eba4c4aca985`
- 状態：導入済み、画面確認済み

## IMG-LIBRARY — 作品一覧の読書室

採用Aを画風参照としてimagegenで新規生成。閉じた本、空いた一脚の椅子、ランプ、夕方の読書室。人物や20作の結末は描いていません。窓の外に水辺が見えるため、指示の「海を入れない」には完全一致していませんが、共通の本棚としての役割や各作品の状態には影響しません。絵は変更せず実物どおり記録します。

使用指示の全文：[library-a.prompt.txt](../sources/images/library-a.prompt.txt)。原本は生成出力exec-5ea17824-6a17-45b2-983d-59faed1142b4.pngから無加工で保存。配置先は本棚の共通イメージです。

- 配布用：`assets/images/library.webp`
- PNG原本：`sources/images/library-a.png`
- 実寸：1586×992px、WebP、不透明
- 容量：165,246 bytes
- 配布用SHA-256：`21912d5467cedcd4392df2a1b3d717d8dc5e891147fb782ebd24155b00979a3c`
- 状態：導入済み、画面確認済み

## 音楽の共通処理

音符・和音・編成を本作向けに作成し、[render-music.py](../scripts/render-music.py)で加算合成しました。外部の録音サンプルは使っていません。ピアノ・木管・弦はそれらを想定した合成音色であり、生楽器の録音ではありません。歌・台詞・効果音なし。ドット絵を理由にチップチューンへ変更していません。

24bit WAVを一時生成し、一定ゲインで約−18 LUFSへ調整した後、Vorbis品質4でOgg化しました。実平均ビットレートはGB01が約42kbps、本棚が約64kbpsです。当初の128〜160kbpsは目安で、今回のファイルの実測値ではありません。WAVは一時ファイルとして扱い、音符・音色・処理を再現するソースを保管しています。

第1回の2曲は4/4拍子・24小節、残響を冒頭へ循環させた全長ループ。台帳の音量は0.35、初期OFFです。1個のAudio要素で曲を切り替え、未制作の作品では停止します。タブ非表示とpagehideでも停止し、表示が戻った時にON状態なら再開します。古いplay()の失敗が新しい曲の再生をOFFにしないよう処理しました。

実Oggの復号、音量、ピーク、サンプル数、境界の波形差を検査しました。Chromiumで実ファイルの再生、GB01末尾から冒頭へのループ、ON/OFF、曲切替、連打時の取消、非表示からの復帰を確認しています。**聴感による音色・圧縮品質・3周連続の試聴は未実施です。数値検査とブラウザ再生確認を、試聴済みとは扱いません。**

## BGM-GB01 — 潮を待つ軒下

D長調／B短調。柔らかなピアノ風の旋律に低い弦風の持続音とパッドを重ね、8小節ずつABA′で循環します。潮の揺れと仕事を続ける静けさを狙った曲です。

- 配布用：`assets/audio/gb01-theme.ogg`
- 編集原本：`sources/audio/gb01-theme.score.json` と `scripts/render-music.py`
- 実時間：84.705873秒、68 BPM、24小節
- 形式：Ogg Vorbis、44,100Hz、stereo
- ループ：サンプル0から3,735,529未満まで（全長）
- 実測：-17.97 LUFS-I、True Peak -6.57 dBTP
- 容量：442,610 bytes
- SHA-256：`26679314f1c1a5d60151e836e6aace92c52ffc63a1f604b9e8e083205dde01e4`
- 状態：導入済み、技術検査済み、試聴確認待ち

## BGM-LIBRARY — まだ開かない頁

F長調。柔らかな木管風の短い旋律、疎らなピアノ風の分散和音、薄いパッドを重ねます。作品を選ぶ時間の伴奏として、強い決着を避けて循環します。

- 配布用：`assets/audio/library.ogg`
- 編集原本：`sources/audio/library.score.json` と `scripts/render-music.py`
- 実時間：90.000000秒、64 BPM、24小節
- 形式：Ogg Vorbis、44,100Hz、stereo
- ループ：サンプル0から3,969,000未満まで（全長）
- 実測：-17.96 LUFS-I、True Peak -7.46 dBTP
- 容量：719,607 bytes
- SHA-256：`3e0a3e473ec48bfa1e5480870392a124b0ee3f196115beb6021af150df623d6c`
- 状態：導入済み、技術検査済み、試聴確認待ち

## 出所と次回への引継ぎ

画像はimagegenの生成物で、Aを参照して制作しました。音楽はこのリポジトリに収録した音符データと合成処理によるものです。第三者の既存画像・楽曲・音源サンプルは取り込んでいません。生成画像の利用条件は作成時のサービス条件に従います。追加の外部素材クレジットはありません。

B・Cの比較PNGはそのまま保持しています。原稿20作・分岐・保存データ形式は変更していません。素材の実体はassets/manifest.json、制作予定と残件はasset-plan.json、画像の識別情報はsources/images/manifest.json、音源の実測値はsources/audio/render-report.jsonを参照してください。

第1回終了時点の引継ぎは「GB02の本文と作者用根拠を読み、Aの画風でGB02〜GB05の8点を制作する」でした。これは下記の第2回で実施しました。音楽の試聴確認待ちは引き続き残件として扱います。

## 第2回 — GB02〜GB05の8点（2026-10-19）

Aを画風参照に、imagegenで4枚を生成しました。大きな色面とドットの輪郭を共通にし、橋・終夜駅・儀礼馬車・荷雲で主題を変えています。生成PNGは無加工で保管し、WebP品質95へ変換。原寸は1584×993pxまたは1586×992pxで、縦横比を変えずに配布しました。

![第2回までの素材を導入した本棚](previews/batch-02-library.png)

[スマホでのGB04表示](previews/batch-02-mobile.png)。長い題名はtext-wrap:balanceで折返しを整えています。本棚のGB05は荷雲が帯の中に残るようobject-positionをcenter 30%に設定しました。画像自体の切り貼りや変形は行っていません。

音楽は4曲とも音符・和音から新規に作成しました。外部音源サンプルは使っていません。合成スクリプトへ撥弦、ピチカート風、クラリネット風、短い弦、ブラシ風の音色を追加し、作品ごとに編成・旋律・拍の置き方を変えています。第1回の配布音源は変更していません。

画像の数量・所在・結末の先取りを本文と照合しました。4作品の画像とOggを実際のChromiumで開き、4画面サイズで本文を全ページ連結して元の文章と照合。各音源は初期OFF、再生、末尾から冒頭へのループ、停止まで確認しています。聴感による音色・圧縮品質・3周連続試聴は未実施で、技術検査と区別します。

## IMG-GB02-COVER — 骨の橋で待つもの

骨を編んだ橋と西岸を主題にしました。人物、胸札、父の剣、勝敗、流血、開閉状態を決める鎖を描いていません。試合に勝った結果や通行許可の取得を先取りしない構図です。

- 配布用：`assets/images/gb02-cover.webp`
- PNG原本：`sources/images/gb02-cover-a.png`
- 指示全文：[gb02-cover.prompt.txt](../sources/images/gb02-cover.prompt.txt)
- 生成出力：`exec-98a08335-2016-4795-85bf-9218ca33f975.png`、imagegen、A参照
- 実寸：1584×993px、WebP、不透明
- 容量：231,574 bytes
- SHA-256：`da0baff0a6566e1a2022e086a2bae5618717f751f794f58ded1ec68e3f26faf8`
- 状態：導入済み、画面確認済み

## BGM-GB02 — 骨の欄干

短い木管風の問いと低い弦の応答。通行交渉と試合の両方に使える、決着を急がせない緊張。 調・構成はD minor、A8 B8 A′8 B′8です。楽器名は合成音色の方向を表し、生楽器の録音ではありません。

- 配布用：`assets/audio/gb02-theme.ogg`
- 音符正本：`sources/audio/gb02-theme.score.json`
- 構成元：`sources/audio/compose-batch-02.py`、合成処理：`scripts/render-music.py`
- 実時間：91.428571秒、84 BPM、4/4拍子、32小節
- 形式：Ogg Vorbis品質4、44,100Hz、stereo、実平均約65.1kbps
- ループ：サンプル0から4,032,000未満まで（全長）
- 実測：-17.96 LUFS-I、True Peak -8.18 dBTP
- 容量：743,677 bytes
- SHA-256：`7d4a0705d27f04741b9a17c51b5e205e2817ec080b2a6d0831a906deb44d0b5f`
- 状態：導入済み、技術検査済み、試聴確認待ち

## IMG-GB03-COVER — 眠らない駅の忘れ物

終夜駅の窓口と閉じた木箱、左側の銅色の金具を主題にしました。人形や人物、名札、半券、返還の動作は描いていません。箱は作品の共通モチーフで、各節の現時点の保持者を示す図ではありません。

- 配布用：`assets/images/gb03-cover.webp`
- PNG原本：`sources/images/gb03-cover-a.png`
- 指示全文：[gb03-cover.prompt.txt](../sources/images/gb03-cover.prompt.txt)
- 生成出力：`exec-aa4ae73f-8b52-4b93-9303-cb4ba7efff75.png`、imagegen、A参照
- 実寸：1586×992px、WebP、不透明
- 容量：158,798 bytes
- SHA-256：`d1904177aa5fa02b710892c34e460827967d41b8e50f456dd09ea321de46b02e`
- 状態：導入済み、画面確認済み

## BGM-GB03 — 終夜窓口

間を空けたクラリネット風の旋律と小さなピアノ。窓口の夜の生活感を保ち、返還や和解の結果を決めない。 調・構成はB-flat major / G minor、A8 B8 A′8 turn4です。楽器名は合成音色の方向を表し、生楽器の録音ではありません。

- 配布用：`assets/audio/gb03-theme.ogg`
- 音符正本：`sources/audio/gb03-theme.score.json`
- 構成元：`sources/audio/compose-batch-02.py`、合成処理：`scripts/render-music.py`
- 実時間：93.333333秒、72 BPM、4/4拍子、28小節
- 形式：Ogg Vorbis品質4、44,100Hz、stereo、実平均約59.5kbps
- ループ：サンプル0から4,116,000未満まで（全長）
- 実測：-17.96 LUFS-I、True Peak -8.37 dBTP
- 容量：694,022 bytes
- SHA-256：`e4891ced26c9e94ca4f362010aa211d533dc4f40b61d28193fb05bc96b864367`
- 状態：導入済み、技術検査済み、試聴確認待ち

## IMG-GB04-COVER — 王女を運ばない馬車

運河沿いの停止した儀礼馬車と暗い窓を描きました。車内の人影、群衆、監察人、信号旗、会談成立を示す記号を入れていません。王女が車内にいると見せず、車輪も動かしていません。

- 配布用：`assets/images/gb04-cover.webp`
- PNG原本：`sources/images/gb04-cover-a.png`
- 指示全文：[gb04-cover.prompt.txt](../sources/images/gb04-cover.prompt.txt)
- 生成出力：`exec-c587e7ab-115b-4446-a834-b95e2d32e8d6.png`、imagegen、A参照
- 実寸：1584×993px、WebP、不透明
- 容量：186,106 bytes
- SHA-256：`54ab2ac7054c6c404c2f942ffe7737303c58ef3ea38069c5215a475b23ad7e09`
- 状態：導入済み、画面確認済み

## BGM-GB04 — 空席の車輪

軽い撥弦の3+3+2の刻み、控えめな低弦と合成ブラシ。足取りを保ちながら、追跡や会談の成否を音で確定しない。 調・構成はE minor / Dorian color、A8 B8 A′8 B′8です。楽器名は合成音色の方向を表し、生楽器の録音ではありません。

- 配布用：`assets/audio/gb04-theme.ogg`
- 音符正本：`sources/audio/gb04-theme.score.json`
- 構成元：`sources/audio/compose-batch-02.py`、合成処理：`scripts/render-music.py`
- 実時間：87.272721秒、88 BPM、4/4拍子、32小節
- 形式：Ogg Vorbis品質4、44,100Hz、stereo、実平均約71.0kbps
- ループ：サンプル0から3,848,727未満まで（全長）
- 実測：-17.96 LUFS-I、True Peak -4.82 dBTP
- 容量：774,664 bytes
- SHA-256：`88b6046d00ab775cf73b76ce3e22ac77ba12cf38433ec0f76f3d34c72032a06f`
- 状態：導入済み、技術検査済み、試聴確認待ち

## IMG-GB05-COVER — 雨を買った村

乾いた山道の上の小さな荷雲と一本の縄を主題にしました。銀の計量線、瓶、雨滴、鐘、散水済みの苗を描いていません。雲の水量、瓶への移送、贈与、村への配達を画像だけで確定しない構図です。

- 配布用：`assets/images/gb05-cover.webp`
- PNG原本：`sources/images/gb05-cover-a.png`
- 指示全文：[gb05-cover.prompt.txt](../sources/images/gb05-cover.prompt.txt)
- 生成出力：`exec-16074036-8f02-408a-a667-a4e60ebf9190.png`、imagegen、A参照
- 実寸：1584×993px、WebP、不透明
- 容量：111,826 bytes
- SHA-256：`690e4251f09ade79a90293beb6696925117d0044ac3b27248388c11b8f5529f7`
- 状態：導入済み、画面確認済み

## BGM-GB05 — 縄で運ぶ空

撥弦の分散和音に淡い木管と柔らかな低音。乾いた山道を歩く余白。鐘・雨・納品完了を示す効果音は使わない。 調・構成はG major、A8 B8 A′8 turn4です。楽器名は合成音色の方向を表し、生楽器の録音ではありません。

- 配布用：`assets/audio/gb05-theme.ogg`
- 音符正本：`sources/audio/gb05-theme.score.json`
- 構成元：`sources/audio/compose-batch-02.py`、合成処理：`scripts/render-music.py`
- 実時間：86.153855秒、78 BPM、4/4拍子、28小節
- 形式：Ogg Vorbis品質4、44,100Hz、stereo、実平均約61.0kbps
- ループ：サンプル0から3,799,385未満まで（全長）
- 実測：-17.96 LUFS-I、True Peak -7.46 dBTP
- 容量：656,390 bytes
- SHA-256：`a519560f509a526fd31c54b2ba768a6f71a3fb123d5832171cd2e83d7162e33f`
- 状態：導入済み、技術検査済み、試聴確認待ち

## 第2回後の残件

導入済みは画像6点・音楽6曲、計12点。残りは画像35点・音楽15曲、計50点です。次はGB06〜GB10の表紙と音楽10点。P1の基本素材は残り30点、P2の場面挿絵は20点すべて未着手です。B・Cの比較資料は保持しています。

原稿20作の本文・状態・分岐・保存形式は変更していません。BGM6曲の聴感確認は引き続き残件です。


## 第3回 — GB06〜GB10の10点（2026-10-19）

Aを画風参照に、劇場・宇宙船・川町の北塔・小人の台所・図書館の5枚をimagegenで生成しました。原本は1586×992px（GB08のみ1584×993px）。無加工のPNGと指示全文を保存し、原寸・縦横比のままWebP品質95へ変換しました。厳密な8色への減色や引き伸ばしは行っていません。

![第3回までの素材を導入した本棚](previews/batch-03-library.png)

[本棚の2ページ目](previews/batch-03-library-page2.png)、[スマホでのGB09表示](previews/batch-03-mobile.png)。

カードの帯では主題が見えるよう、GB07をcenter 65%、GB08・GB09をcenter 35%、GB10をcenter 70%に設定。画像自体の寸法や構図は変えていません。

音楽は5曲の旋律・和音・編成を新規に作成。フェルトピアノ風、電気鍵盤風、マリンバ風、倍音風、丸い低音の加算合成音色を加えました。録音サンプルは使っていません。以前の配布画像・音源12点はバイト単位で変更がないことを確認しました。

単体試験54件が成功。ブラウザ全35ケースを実行し、GB10の空のWebPを検出しました。原本から復元して記録済みハッシュと照合し、画像・音楽の10ケースを再実行してすべて成功。他の25ケースも成功しています。新しい5作品すべてで、4画面サイズの表示、本文全ページの連結一致、実Ogg再生、音量0.35、末尾から冒頭へのループ、OFFでの停止を確認しました。全20作のUI経路と保存も検査しています。画像の数量・所在・結末の先取りを本文と照合し、生成原本と画面を目視しました。音楽の聴感による音色・圧縮品質・3周連続試聴は引き続き未実施です。

## IMG-GB06-COVER — 最後の一席

劇場の入口、真鍮の把手、赤い幕、空いた敷居と灯りを主題にしました。招待券、席の割当て、傘の返却や和解の成立を描いていません。建物の最後の公演と劇団そのものの解散を混同しない構図です。

- 配布用：`assets/images/gb06-cover.webp`
- PNG原本：`sources/images/gb06-cover-a.png`
- 指示全文：[gb06-cover.prompt.txt](../sources/images/gb06-cover.prompt.txt)
- 生成出力：`exec-32394ca2-5937-4d75-95d1-8e707e571ac7.png`、imagegen、A参照
- 実寸：1586×992px、WebP、不透明
- 容量：161,530 bytes
- 配布用SHA-256：`ca439ae7f690cf73593ab3d4d710632393a04b1d727dbb6c8a16b79cd2160022`
- 原本SHA-256：`273c2a653a57a2af7eb4ceb703ad26a16cba8ee8139a2b09a44ce38f6fde0c8a`
- 状態：導入済み、画面確認済み

## BGM-GB06 — 暗転前の入口

フェルトピアノ風の短い呼びかけと薄い弦。建物との別れに余韻を残し、劇団の終わりや再会の成立を決めない。 調・構成はE-flat major / C minor、A8 B8 A′8です。楽器名は合成音色の方向を表し、生楽器の録音ではありません。

- 配布用：`assets/audio/gb06-theme.ogg`
- 音符正本：`sources/audio/gb06-theme.score.json`
- 構成元：`sources/audio/compose-batch-03.py`、合成処理：`scripts/render-music.py`
- 実時間：90.000000秒、64 BPM、4/4拍子、24小節
- 形式：Ogg Vorbis品質4、44,100Hz、stereo、実平均約34.6kbps
- ループ：サンプル0から3,969,000未満まで（全長）
- 実測：-17.96 LUFS-I、True Peak -6.66 dBTP
- 容量：388,811 bytes
- SHA-256：`3eb87493e0403a956baf1cbd028ad35439103496fe12656dcbf2484529c5a6c7`
- 状態：導入済み、技術検査済み、試聴確認待ち

## IMG-GB07-COVER — 複製された遺言

別々の記憶槽を二つと、空の接続座を一基だけ描きました。両方に同程度の周囲の反射を置き、通電・休止を示す状態灯や人物の顔を描いていません。現在の接続状態や任用結果を表示する図ではなく、二つの独立した記憶槽と共用設備を示す共通モチーフです。

- 配布用：`assets/images/gb07-cover.webp`
- PNG原本：`sources/images/gb07-cover-a.png`
- 指示全文：[gb07-cover.prompt.txt](../sources/images/gb07-cover.prompt.txt)
- 生成出力：`exec-c2a91228-2cdf-47f6-85da-980aa7877a3d.png`、imagegen、A参照
- 実寸：1586×992px、WebP、不透明
- 容量：83,494 bytes
- 配布用SHA-256：`235ae2e4eb14bb731eed19972c549aeb69b3f1fdc2843fc26e674759437c7469`
- 原本SHA-256：`dc043e5bce034357bc0caba15b99f964c33fd5069c98cd598223d07b0cc98777`
- 状態：導入済み、画面確認済み

## BGM-GB07 — 二つの間

温かな合成パッド、丸い低音、疎らな電気鍵盤。似た音型を異なる休符で一つずつ受け渡し、二人格の同時稼働を示す音声は使わない。 調・構成はA minor / Dorian color、A8 B8 turn6です。楽器名は合成音色の方向を表し、生楽器の録音ではありません。

- 配布用：`assets/audio/gb07-theme.ogg`
- 音符正本：`sources/audio/gb07-theme.score.json`
- 構成元：`sources/audio/compose-batch-03.py`、合成処理：`scripts/render-music.py`
- 実時間：88.000000秒、60 BPM、4/4拍子、22小節
- 形式：Ogg Vorbis品質4、44,100Hz、stereo、実平均約31.0kbps
- ループ：サンプル0から3,880,800未満まで（全長）
- 実測：-17.96 LUFS-I、True Peak -6.05 dBTP
- 容量：341,438 bytes
- SHA-256：`1b5df959c83093b013ec11dd4e72ba3e60e84be1bbd9cfca70031e0cffe543b2`
- 状態：導入済み、技術検査済み、試聴確認待ち

## IMG-GB08-COVER — 北塔の降伏旗

川町の橋、北塔、面談を求める白い布を主題にしました。兵士、避難者、武装解除、降伏成立、捕虜の返還や勝利の祝祭を描かず、本文の交渉と履行を先取りしていません。

- 配布用：`assets/images/gb08-cover.webp`
- PNG原本：`sources/images/gb08-cover-a.png`
- 指示全文：[gb08-cover.prompt.txt](../sources/images/gb08-cover.prompt.txt)
- 生成出力：`exec-cbbbcaf6-a0c9-4ebf-a5a2-a27182c6745c.png`、imagegen、A参照
- 実寸：1584×993px、WebP、不透明
- 容量：160,198 bytes
- 配布用SHA-256：`4bf32838ea4f912d2eb6b54d8e10cd3f390587f33f30910550298effd9dddab2`
- 原本SHA-256：`e64ce2d0f0c396bf68f2a95f54c7138eea5de637d6c2d43aa3fb081c8c28d624`
- 状態：導入済み、画面確認済み

## BGM-GB08 — 机の両側

低い弦と柔らかなピアノに、息の長い木管の問いを置く。行進の拍、勝利の終止、降伏成立の合図を避ける。 調・構成はD Dorian / F major、A8 B8 A′8です。楽器名は合成音色の方向を表し、生楽器の録音ではありません。

- 配布用：`assets/audio/gb08-theme.ogg`
- 音符正本：`sources/audio/gb08-theme.score.json`
- 構成元：`sources/audio/compose-batch-03.py`、合成処理：`scripts/render-music.py`
- 実時間：87.272721秒、66 BPM、4/4拍子、24小節
- 形式：Ogg Vorbis品質4、44,100Hz、stereo、実平均約56.0kbps
- ループ：サンプル0から3,848,727未満まで（全長）
- 実測：-17.96 LUFS-I、True Peak -8.67 dBTP
- 容量：611,422 bytes
- SHA-256：`f41741dc355614f550c5292d07acef0142ff37dabd1b789435ddaed4d678a859`
- 状態：導入済み、技術検査済み、試聴確認待ち

## IMG-GB09-COVER — 台所に住む小さな王

小人の視点の低い台所、閉じたパン箱、乾いた高い足場のカップを描きました。人物、鍵、匙、砂糖糸、洪水を追加せず、道具の保持や時間、王国への帰還を断定していません。

- 配布用：`assets/images/gb09-cover.webp`
- PNG原本：`sources/images/gb09-cover-a.png`
- 指示全文：[gb09-cover.prompt.txt](../sources/images/gb09-cover.prompt.txt)
- 生成出力：`exec-29dfb121-86b3-4983-b725-04ed3ad13fbf.png`、imagegen、A参照
- 実寸：1586×992px、WebP、不透明
- 容量：122,836 bytes
- 配布用SHA-256：`fd559cfdc44c90b8cc529750431b7840694516c38249a2b0ebc2ef92e8829a91`
- 原本SHA-256：`215254650a9445043c8904c010f009b7109becfa86ec934627581182453a0190`
- 状態：導入済み、画面確認済み

## BGM-GB09 — パン箱の遠景

小さなマリンバ風の跳躍とピチカート、軽い木管。大きな台所を歩く発見を主題にし、残り時間を急かす強い拍は置かない。 調・構成はC major / Lydian color、A8 B8 A′8 B′8です。楽器名は合成音色の方向を表し、生楽器の録音ではありません。

- 配布用：`assets/audio/gb09-theme.ogg`
- 音符正本：`sources/audio/gb09-theme.score.json`
- 構成元：`sources/audio/compose-batch-03.py`、合成処理：`scripts/render-music.py`
- 実時間：83.478254秒、92 BPM、4/4拍子、32小節
- 形式：Ogg Vorbis品質4、44,100Hz、stereo、実平均約54.9kbps
- ループ：サンプル0から3,681,391未満まで（全長）
- 実測：-17.96 LUFS-I、True Peak -5.86 dBTP
- 容量：572,450 bytes
- SHA-256：`30ea2bb3738ccf2138248eea3f2d290a0bc8d88754f65b1d0a84d7a4ebd47386`
- 状態：導入済み、技術検査済み、試聴確認待ち

## IMG-GB10-COVER — 返却期限のない図書館

高い書架、空の読書机、星が見える遠い窓を主題にしました。机の本は文字のない一般的な閉じた本で、取得した調整書を示しません。失った体験の幻影、父の死、記憶の回復、星灯機の修理完了を描いていません。

- 配布用：`assets/images/gb10-cover.webp`
- PNG原本：`sources/images/gb10-cover-a.png`
- 指示全文：[gb10-cover.prompt.txt](../sources/images/gb10-cover.prompt.txt)
- 生成出力：`exec-080d5622-ddcf-4b48-9171-ea02b606d529.png`、imagegen、A参照
- 実寸：1586×992px、WebP、不透明
- 容量：130,938 bytes
- 配布用SHA-256：`89f6f433cfa1007c43897085516bc38994a163bb75b3a2e315be17790e66de1f`
- 原本SHA-256：`ef5d7f435e3c64fa30fccd948ea50e5ff2e57135c711d684c640bf7afc14a734`
- 状態：導入済み、画面確認済み

## BGM-GB10 — 頁の外の星

静かなピアノ、薄い持続弦、遠い倍音風の響き。長い休符を残し、記憶の交換や修理の正解を音で選ばない。 調・構成はF major / D minor、A8 B6 A′8です。楽器名は合成音色の方向を表し、生楽器の録音ではありません。

- 配布用：`assets/audio/gb10-theme.ogg`
- 音符正本：`sources/audio/gb10-theme.score.json`
- 構成元：`sources/audio/compose-batch-03.py`、合成処理：`scripts/render-music.py`
- 実時間：91.034490秒、58 BPM、4/4拍子、22小節
- 形式：Ogg Vorbis品質4、44,100Hz、stereo、実平均約42.1kbps
- ループ：サンプル0から4,014,621未満まで（全長）
- 実測：-17.97 LUFS-I、True Peak -3.38 dBTP
- 容量：479,452 bytes
- SHA-256：`8c4dccb954973a91858aa21254f883ae0dfb4ac856369e23ce975a491fc41706`
- 状態：導入済み、技術検査済み、試聴確認待ち

## 第3回終了時点の次回作業

導入済み22点、未制作40点。P1の残りはGB11〜GB20の表紙10点・BGM10曲、P2は全20作の場面挿絵です。次はGB11〜GB15の10点を制作します。Aを共通基準としてB・Cの比較資料を保持し、本文と作者用根拠を照合してから実物を作り、登録・表示・再生検査と記録まで行います。
