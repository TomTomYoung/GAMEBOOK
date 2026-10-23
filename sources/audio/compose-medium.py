"""Original reading loops for the three medium-length gamebooks."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[2]


def add(score, at, note, beats, instrument, gain, pan=0):
    score['events'].append(dict(at=at, note=note, beats=beats,
                               instrument=instrument, gain=gain, pan=pan))


def compose(n, title, bpm, key, description, chords, melody, answer, lead):
    score = dict(id=f'm{n:02}-theme', title=title, bpm=bpm, bars=28,
                 meter='4/4', key=key, form='A8 B8 A′8 turn4',
                 description=description, seed=2026102300+n, events=[])
    for bar in range(28):
        i = bar % 8 if bar < 24 else [4, 5, 6, 7][bar-24]
        c = chords[i]
        if n == 1:
            add(score, bar*4, c[0], 3.4, 'felt-piano', .060, -.12)
            for offset, k in [(1.25, 1), (3, 2)]:
                add(score, bar*4+offset, c[k], 1.7, 'pluck', .033, -.23)
        elif n == 2:
            for note in c[:2]:
                add(score, bar*4, note, 4.6, 'strings', .025, -.18)
            add(score, bar*4+.75, c[1], 1.1, 'pluck', .038, .18)
            if bar % 2 == 0:
                add(score, bar*4+2.75, c[2], .8, 'pizzicato', .030, .12)
        else:
            add(score, bar*4+.25, c[0], 3.2, 'felt-piano', .060, -.14)
            add(score, bar*4+1.5, c[1], 4.1, 'harmonics', .026, .23)
        phrase = answer[i] if 8 <= bar < 16 else melody[i]
        for offset, note, beats in phrase:
            add(score, bar*4+offset, note, beats, lead, .063, .10)
        # A′ answers softly in a second timbre; the turnaround keeps a suspended cadence.
        if 16 <= bar < 24 and bar % 2 == 1:
            add(score, bar*4+3, c[2], 1.6, 'felt-piano' if n == 1 else 'woodwind', .032, -.15)
    score['events'].sort(key=lambda e: (e['at'], e['instrument'], e['note']))
    assert all(0 <= e['at'] < 112 and e['beats'] > 0 for e in score['events'])
    (ROOT/f"sources/audio/{score['id']}.score.json").write_text(
        json.dumps(score, ensure_ascii=False, indent=2)+'\n')
    print(score['id'], len(score['events']), 28*240/bpm)


compose(1, '舞台を運ぶ潮', 68, 'F major / added sixths',
        '柔らかな木管の呼びかけに撥弦と低い鍵盤が応える。船のゆるい揺れと会話の間。上演の種類や結末を限定しない原作専用の読書曲。',
        [['F3','C4','A4'],['D3','A3','F4'],['Bb2','F3','D4'],['C3','G3','E4'],
         ['G2','D3','Bb3'],['A2','E3','C4'],['Bb2','F3','A3'],['C3','G3','D4']],
        [[(.5,'A4',1),(2.25,'G4',1)],[(1,'F4',2)],[(.75,'D4',1),(2.5,'F4',1)],[(1,'E4',2)],
         [(.5,'G4',1.3),(2.5,'F4',1)],[(1.25,'E4',1.8)],[(.75,'D4',1),(2.5,'C4',1)],[(1,'G4',2)]],
        [[(1,'C5',1.7)],[(.75,'A4',1),(2.5,'F4',1)],[(1,'Bb4',1.7)],[(.75,'G4',2)],
         [(1,'D5',1.5)],[(.75,'C5',1),(2.5,'A4',1)],[(1,'F4',1.8)],[(.5,'E4',1),(2.5,'G4',1)]], 'woodwind')

compose(2, '灰の門の向こう', 64, 'D Dorian / suspended fifths',
        '低い弦と控えめな撥弦が足取りを作り、丸いクラリネットが短く応える。探索・休息・帰還に共通する静かな緊張を保つ。',
        [['D3','A3','E4'],['C3','G3','D4'],['G2','D3','A3'],['A2','E3','G3'],
         ['B2','F3','A3'],['G2','D3','F3'],['C3','G3','E4'],['A2','E3','B3']],
        [[(1,'A3',2.3)],[(.75,'G3',1.2),(2.75,'D4',.8)],[(1.25,'A3',1.7)],[(1,'E4',2)],
         [(.75,'D4',1),(2.5,'B3',1)],[(1.25,'A3',1.8)],[(.75,'G3',1.2),(2.75,'E3',.8)],[(1,'A3',2.1)]],
        [[(.75,'F4',2)],[(1,'E4',1.6)],[(.75,'D4',1.2),(2.5,'B3',1)],[(1.25,'C4',1.7)],
         [(1,'D4',2)],[(.75,'B3',1),(2.75,'A3',.8)],[(1,'G3',2)],[(1.25,'E4',1.8)]], 'clarinet')

compose(3, '雲のあいだの往復便', 72, 'G major / open ninths',
        '軽い鍵盤と倍音の余韻、木管の返答を開いた音程で組む。朝の空路と仕事の呼吸を描き、飛行中以外の場面にもなじませる。',
        [['G3','D4','A4'],['E3','B3','F#4'],['C3','G3','D4'],['D3','A3','E4'],
         ['A2','E3','B3'],['C3','G3','B3'],['G2','D3','A3'],['D3','A3','C4']],
        [[(.5,'B4',1),(2.25,'D5',1)],[(1,'A4',1.8)],[(.75,'G4',1),(2.5,'D4',1)],[(1,'F#4',1.8)],
         [(.5,'E4',1.2),(2.5,'B4',1)],[(1.25,'G4',1.7)],[(.75,'A4',1),(2.5,'B4',1)],[(1,'A4',2)]],
        [[(1,'D5',1.8)],[(.75,'B4',1),(2.5,'A4',1)],[(1,'E5',1.6)],[(.75,'D5',1.8)],
         [(1,'B4',1.7)],[(.5,'G4',1),(2.25,'E4',1)],[(1,'D4',1.8)],[(.75,'F#4',1),(2.5,'A4',1)]], 'electric-keys')
