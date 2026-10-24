"""Original reading loops for GB29–GB32; writes only these four scores."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[2]


def add(s, at, note, beats, instrument, gain, pan=0):
    s['events'].append(dict(at=at, note=note, beats=beats,
                            instrument=instrument, gain=gain, pan=pan))


def compose(n, title, bpm, bars, key, description, chords, phrases, lead):
    s = dict(id=f'gb{n}-theme', title=title, bpm=bpm, bars=bars,
             meter='4/4', key=key, form='A8 B8 A′8' + (' turn8' if bars == 32 else ''),
             description=description, seed=2026102400+n, events=[])
    for bar in range(bars):
        i, t = bar % 8, bar*4
        root, middle, top = chords[i].split()
        if n == 29:
            add(s, t, root, 1.1, 'pizzicato', .047, -.15)
            add(s, t+1.5, middle, .9, 'marimba', .035, .20)
            add(s, t+3, top, .8, 'pizzicato', .035, -.22)
        elif n == 30:
            add(s, t, root, 4.8, 'round-bass', .033, -.08)
            add(s, t+.75, middle, 3.2, 'felt-piano', .043, -.20)
            if i % 2 == 0:
                add(s, t+2, top, 3.1, 'harmonics', .022, .24)
        elif n == 31:
            add(s, t, root, 3.8, 'felt-piano', .041, -.16)
            add(s, t+1.25, middle, 2.4, 'electric-keys', .027, .24)
            if i in (1, 4, 6):
                add(s, t+2.75, top, 2.1, 'felt-piano', .025, -.24)
        else:
            add(s, t, root, 3.4, 'round-bass', .034, -.08)
            add(s, t+.5, middle, 1.5, 'pluck', .037, -.24)
            add(s, t+2.5, top, 1.4, 'marimba', .031, .22)
        phrase = phrases[1 if 8 <= bar < 16 else 0][i].split()
        times = [(.75, 2.1)] if len(phrase) == 1 else [(.5, 1.1), (2.5, 1.1)]
        if n == 29:
            times = [(1, 1.4)] if len(phrase) == 1 else [(.75, .8), (2.25, 1.0)]
        for note, (offset, duration) in zip(phrase, times):
            instrument = 'electric-keys' if n == 31 and bar >= 16 else lead
            add(s, t+offset, note, duration, instrument, .057, .10)
        if 16 <= bar < 24 and i in (2, 5):
            add(s, t+3.25, top, 1.2, 'felt-piano', .023, -.20)
    s['events'].sort(key=lambda e: (e['at'], e['instrument'], e['note']))
    assert all(0 <= e['at'] < bars*4 and e['beats'] > 0 for e in s['events'])
    (ROOT/f"sources/audio/{s['id']}.score.json").write_text(
        json.dumps(s, ensure_ascii=False, indent=2)+'\n')
    print(s['id'], len(s['events']), bars*240/bpm)


compose(29, '黒い鐘の七歩', 84, 32, 'G major / playful suspensions',
        '短い撥弦とマリンバにクラリネットが応える、夜冠祭の軽い足取り。追いかけっこの可笑しさを保ち、時間制限や捕縛・逃走成功の合図は置かない。',
        ['G2 D3 B3', 'E3 B3 G4', 'C3 G3 E4', 'D3 A3 E4',
         'B2 F#3 D4', 'C3 G3 A3', 'A2 E3 C4', 'D3 A3 C4'],
        [['B4 A4', 'G4', 'E4 G4', 'A4 F#4', 'D4', 'E4 A4', 'G4 E4', 'F#4'],
         ['D5 B4', 'G4 A4', 'C5', 'B4 A4', 'F#4 A4', 'G4', 'E4 G4', 'A4 F#4']], 'clarinet')

compose(30, '炉のそばの二つの器', 60, 24, 'C major / open ninths',
        '柔らかな低音とフェルト鍵盤の間に、低い木管の短い旋律を置く。冬の小屋の寒さと炉の暖かさを保ち、給餌の成否や獣の行く末を音で断定しない。',
        ['C3 G3 D4', 'A2 E3 C4', 'F2 C3 A3', 'G2 D3 A3',
         'E3 B3 G4', 'F2 C3 G3', 'D3 A3 F4', 'G2 D3 F3'],
        [['E4', 'D4 C4', 'A3 C4', 'D4', 'G4 E4', 'C4', 'F4 D4', 'B3'],
         ['G4', 'E4 D4', 'C4 E4', 'F4', 'B4 G4', 'E4', 'D4 F4', 'D4']], 'woodwind')

compose(31, '折り目の隣に', 64, 24, 'Bb major / quiet added sixths',
        'フェルト鍵盤が途切れながら語り、後半は電気鍵盤へ同じ旋律を渡す。台所の昼の静けさと話す前の間を支え、原本を燃やすことだけを解放として強調しない。',
        ['Bb2 F3 C4', 'G2 D3 Bb3', 'Eb3 Bb3 G4', 'F3 C4 G4',
         'D3 A3 F4', 'Eb3 Bb3 F4', 'C3 G3 D4', 'F2 C3 Eb3'],
        [['D4 F4', 'Bb3', 'G4 F4', 'C4', 'A4 F4', 'Eb4 D4', 'C4', 'G4 Eb4'],
         ['F4 Bb4', 'A4', 'G4 Bb4', 'A4', 'F4 D4', 'G4 F4', 'Eb4', 'C4 A3']], 'felt-piano')

compose(32, '木陰をひらく茶', 80, 32, 'D major / airy pentatonic colors',
        '撥弦とマリンバが木陰の間隔を作り、木管が短く行き来する。昼の市場の会話と茶屋の日常を支える。競売の槌や価格の上昇を模した効果音は加えない。',
        ['D3 A3 F#4', 'B2 F#3 D4', 'G2 D3 B3', 'A2 E3 B3',
         'F#2 C#3 A3', 'G2 D3 E4', 'E3 B3 G4', 'A2 E3 G3'],
        [['F#4 A4', 'B4', 'A4 F#4', 'E4', 'F#4 D4', 'G4 A4', 'B4 G4', 'E4'],
         ['A4 D5', 'F#5 D5', 'B4', 'A4 B4', 'C#5 A4', 'B4', 'G4 F#4', 'E4 A4']], 'woodwind')
