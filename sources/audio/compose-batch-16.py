"""Original reading loops for GB37–GB40; writes only these four scores."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[2]


def add(s, at, note, beats, instrument, gain, pan=0):
    s['events'].append(dict(at=at, note=note, beats=beats,
                            instrument=instrument, gain=gain, pan=pan))


def compose(n, title, bpm, bars, key, description, chords, phrases, lead):
    s = dict(id=f'gb{n}-theme', title=title, bpm=bpm, bars=bars,
             meter='4/4', key=key, form='A8 B8 A′8' + (' turn8' if bars == 32 else ''),
             description=description, seed=2026102600+n, events=[])
    for bar in range(bars):
        i, t = bar % 8, bar*4
        root, middle, top = chords[i].split()
        if n == 37:
            add(s, t, root, 3.4, 'felt-piano', .039, -.12)
            if i % 2 == 0:
                add(s, t+1.5, middle, 2.2, 'electric-keys', .030, -.20)
                add(s, t+1.5, top, 2.2, 'electric-keys', .023, .20)
        elif n == 38:
            add(s, t, root, 1.5, 'pizzicato', .035, -.16)
            add(s, t+1.75, middle, 1.2, 'felt-piano', .030, .18)
            if i in (0, 3, 5):
                add(s, t+3, top, .8, 'marimba', .025, -.22)
        elif n == 39:
            add(s, t, root, 2.5, 'round-bass', .039, -.10)
            add(s, t+1.5, middle, 1.7, 'electric-keys', .032, -.22)
            if i % 2 == 1:
                add(s, t+2.5, top, 1.2, 'felt-piano', .025, .20)
        else:
            add(s, t, root, 3.5, 'felt-piano', .040, -.16)
            add(s, t+1, middle, 2.8, 'harmonics', .029, .18)
            if i in (2, 5, 7):
                add(s, t+2.5, top, 1.3, 'electric-keys', .023, -.23)
        phrase = phrases[1 if 8 <= bar < 16 else 0][i].split()
        times = [(1.5, 1.4)] if len(phrase) == 1 else [(.75, 1.0), (2.5, 1.1)]
        if n == 37:
            times = [(2, 1.5)] if len(phrase) == 1 else [(1.25, 1.0), (2.75, .9)]
        for note, (offset, duration) in zip(phrase, times):
            instrument = 'electric-keys' if n == 40 and bar >= 16 else lead
            add(s, t+offset, note, duration, instrument, .052, .08)
        if 16 <= bar < 24 and i in (1, 6) and n != 37:
            add(s, t+3.5, top, .7, 'felt-piano', .021, -.24)
    s['events'].sort(key=lambda e: (e['at'], e['instrument'], e['note']))
    assert all(0 <= e['at'] < bars*4 and e['beats'] > 0 for e in s['events'])
    (ROOT/f"sources/audio/{s['id']}.score.json").write_text(
        json.dumps(s, ensure_ascii=False, indent=2)+'\n')
    print(s['id'], len(s['events']), bars*240/bpm)


compose(37, '茶碗のあいだ', 60, 24, 'A minor / open thirds',
        'フェルト鍵盤と短い木管の応答を広く離し、帰郷して言葉を聞く時間を支える。顔の解除や和解の効果音、肖像完成の大団円を付けず、用事だけで帰る結末にも同じ余白を保つ。',
        ['A2 E3 C4', 'F2 C3 A3', 'C3 G3 E4', 'G2 D3 A3',
         'D3 A3 F4', 'E3 B3 G3', 'F2 C3 G3', 'E3 B3 D4'],
        [['E4 C4', 'A4', 'G4 E4', 'D4', 'F4 A4', 'B4 G4', 'E4', 'D4 B3'],
         ['A4 E4', 'C5 A4', 'G4', 'B4 G4', 'F4', 'E4 G4', 'A4 C5', 'B4']], 'woodwind')

compose(38, '日曜の歩幅', 80, 32, 'G major / wandering sixths',
        '短い撥弦とマリンバに木管が返す軽い散歩の曲。凧・椅子・運河のどの午後にも使え、瓶の三音や五時の合図を再現しない。遠回りや描かずに帰る選択も急がせない。',
        ['G2 D3 B3', 'E3 B3 G4', 'C3 G3 E4', 'D3 A3 E4',
         'B2 F#3 D4', 'C3 G3 A3', 'A2 E3 C4', 'D3 A3 C4'],
        [['B4 G4', 'E4', 'G4 A4', 'F#4 D4', 'B3 D4', 'E4', 'C5 A4', 'F#4'],
         ['D5 B4', 'G4 E4', 'C5', 'A4 F#4', 'D4', 'G4 A4', 'E5 C5', 'A4']], 'woodwind')

compose(39, '七つの仕事の隣で', 84, 32, 'Bb major / spacious workshop pulse',
        '丸い低音と電気鍵盤を基調に、クラリネットの短句をずらして重ねる。祭りの楽しさと工房の手仕事を支え、拍手・呼吸・七本目の管を実際の合図として鳴らさない。静かな撤収や翌朝の修理にも余白を残す。',
        ['Bb2 F3 D4', 'G2 D3 Bb3', 'Eb3 Bb3 G4', 'F2 C3 G3',
         'D3 A3 F4', 'Eb3 Bb3 C4', 'C3 G3 Eb4', 'F2 C3 Eb3'],
        [['D4 F4', 'G4 Bb4', 'Eb5', 'C5 A4', 'F4 D4', 'G4', 'Eb4 G4', 'A4'],
         ['F4 Bb4', 'D5', 'Bb4 G4', 'A4 C5', 'F5 D5', 'Bb4', 'G4 Eb4', 'C5 A4']], 'clarinet')

compose(40, '余白につながる海', 64, 24, 'E minor / gentle dorian color',
        'フェルト鍵盤と柔らかな倍音に、木管から電気鍵盤へ受け渡す旋律を置く。元の頁の記憶と新しい線を並べ、灯台の光や本を閉じる動作を効果音にしない。休息・帰還・遠い港・共同制作の全結末を支える。',
        ['E3 B3 G4', 'A2 E3 C#4', 'D3 A3 F#4', 'B2 F#3 A3',
         'G2 D3 B3', 'A2 E3 B3', 'F#2 C#3 A3', 'B2 F#3 A3'],
        [['G4 B4', 'C#5', 'A4 F#4', 'E4', 'D5 B4', 'A4', 'F#4 A4', 'B4 F#4'],
         ['B4 E5', 'C#5 B4', 'A4', 'F#4 A4', 'G4 B4', 'E5 C#5', 'A4', 'F#4 B4']], 'woodwind')
