"""Original reading loops for GB21–GB24; writes only these four scores."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[2]


def add(score, at, note, beats, instrument, gain, pan=0):
    score['events'].append(dict(at=at, note=note, beats=beats,
                               instrument=instrument, gain=gain, pan=pan))


def compose(number, title, bpm, bars, key, description, chords, a, b, lead):
    score = dict(id=f'gb{number}-theme', title=title, bpm=bpm, bars=bars,
                 meter='4/4', key=key, form='A8 B8 A′8' + (' turn8' if bars == 32 else ''),
                 description=description, seed=2026102400+number, events=[])
    for bar in range(bars):
        i, start = bar % 8, bar * 4
        chord = chords[i]
        if number == 21:
            # Two gentle steps followed by room for the reply.
            add(score, start, chord[0], 1.3, 'pizzicato', .054, -.20)
            add(score, start+1, chord[1], 1.2, 'pizzicato', .038, -.12)
            add(score, start+2.5, chord[2], 1.4, 'felt-piano', .034, .19)
        elif number == 22:
            # A moving accompaniment stays even through every race outcome.
            add(score, start, chord[0], 3.7, 'round-bass', .035, -.08)
            for at, k in [(.5, 1), (1.5, 2), (2.5, 1)]:
                add(score, start+at, chord[k], 1.0, 'pluck', .033, -.24)
            if i % 2 == 0:
                add(score, start+3, chord[2], 1.8, 'harmonics', .023, .26)
        elif number == 23:
            # Familiar phrases return from another side with altered endings.
            add(score, start, chord[0], 4.2, 'felt-piano', .048, -.15)
            add(score, start+.5, chord[1], 3.8, 'harmonics', .022, .18)
            if i in (1, 4, 7):
                add(score, start+2.75, chord[2], 1.7, 'electric-keys', .026, -.24)
        else:
            add(score, start, chord[0], 2.9, 'felt-piano', .046, -.15)
            for at, k in [(.75, 1), (2.25, 2), (3.25, 1)]:
                add(score, start+at, chord[k], 1.5, 'pluck', .031, .24)
        phrase = b[i] if 8 <= bar < 16 else a[i]
        for at, note, beats in phrase:
            instrument = 'electric-keys' if number == 23 and bar >= 16 else lead
            add(score, start+at, note, beats, instrument, .060,
                -.08 if number == 23 and bar >= 16 else .11)
        if 16 <= bar < 24 and i % 2:
            add(score, start+3.25, chord[2], 1.5,
                'woodwind' if number == 24 else 'felt-piano', .026, -.22)
    score['events'].sort(key=lambda e: (e['at'], e['instrument'], e['note']))
    assert all(0 <= e['at'] < bars*4 and e['beats'] > 0 for e in score['events'])
    (ROOT/f"sources/audio/{score['id']}.score.json").write_text(
        json.dumps(score, ensure_ascii=False, indent=2)+'\n')
    print(score['id'], len(score['events']), bars*240/bpm)


compose(21, '二歩と休みの晩餐', 84, 32, 'Bb major / added sixths',
        '二歩と休みを短い撥弦で作り、丸いクラリネットが応える。食卓の可笑しさと職人の手際を、全結末で続けられる穏やかな舞曲にする。',
        [['Bb2','F3','D4'],['G2','D3','Bb3'],['Eb3','Bb3','G4'],['F3','C4','A4'],
         ['D3','A3','F4'],['G2','D3','A3'],['Eb3','Bb3','F4'],['F3','C4','G4']],
        [[(.25,'D4',.7),(1.25,'F4',.7),(2.75,'D4',1)],[(.75,'Bb3',1.8)],
         [(.25,'G4',.8),(1.5,'F4',1)],[(1,'C4',1.2),(2.75,'A3',.8)],
         [(.5,'F4',1),(2,'D4',1)],[(.75,'Bb3',.8),(2.25,'D4',1)],
         [(.25,'Eb4',1),(2,'D4',1)],[(.75,'C4',1.2),(2.5,'F4',1)]],
        [[(.5,'F4',.8),(2,'Bb4',1.2)],[(.75,'A4',1),(2.25,'G4',.9)],
         [(1,'Eb4',1.5)],[(.5,'C5',1),(2.25,'A4',1)],
         [(.75,'F4',1.7)],[(.5,'G4',1),(2,'D4',1)],
         [(1,'Eb4',1),(2.75,'G4',.8)],[(.5,'F4',1),(2,'C4',1.4)]], 'clarinet')

compose(22, '白樺の弧', 80, 32, 'D major / open sixths',
        '淡い木管と均等な撥弦が雪面を滑る感触を作る。加速や勝敗を告げる効果音を入れず、完走後の場面でも読書の速度を保つ。',
        [['D3','A3','F#4'],['B2','F#3','D4'],['G2','D3','B3'],['A2','E3','B3'],
         ['F#2','C#3','A3'],['G2','D3','A3'],['E3','B3','G4'],['A2','E3','G3']],
        [[(.5,'F#4',1.5),(2.5,'A4',1)],[(1,'D5',1.8)],
         [(.5,'B4',1),(2,'A4',1.4)],[(1,'E4',2)],
         [(.75,'F#4',1.3),(2.5,'E4',1)],[(1,'D4',2)],
         [(.5,'G4',1),(2.25,'B4',1)],[(1,'A4',2)]],
        [[(.75,'A4',1),(2.5,'F#4',1)],[(1,'B4',1.8)],
         [(.5,'D5',1.1),(2.25,'B4',1.3)],[(1,'C#5',1.7)],
         [(.75,'A4',1.6)],[(.5,'G4',1),(2.25,'F#4',1)],
         [(1,'E4',1.5)],[(.75,'G4',1),(2.5,'E4',1)]], 'woodwind')

compose(23, '先に灯った窓', 64, 24, 'E minor / borrowed major colors',
        '低い鍵盤と間の長い木管。同じ短句を別の音色で返し、家の温かさと他人に似た自分の揺らぎを重ねる。驚かせる音や結末専用の終止を置かない。',
        [['E3','B3','F#4'],['C3','G3','E4'],['A2','E3','B3'],['B2','F#3','A3'],
         ['G2','D3','B3'],['F#2','C#3','A3'],['C3','G3','D4'],['B2','F#3','C#4']],
        [[(1,'B3',2)],[(.75,'E4',1.6)],[(1.25,'C4',1.8)],[(1,'B3',2)],
         [(.75,'D4',1),(2.5,'B3',1)],[(1.25,'A3',1.7)],
         [(1,'G3',1.5),(3,'B3',.7)],[(1,'F#3',2)]],
        [[(1,'B3',2)],[(.75,'E4',1.6)],[(1.25,'C4',1.8)],[(1,'D4',2)],
         [(.75,'G4',1),(2.5,'D4',1)],[(1.25,'C#4',1.7)],
         [(1,'E4',1.5),(3,'D4',.7)],[(1,'B3',2)]], 'clarinet')

compose(24, '同じ左を向く', 88, 32, 'G major / suspended ninths',
        'ずらした撥弦へ木管が短く答える、二人の呼吸の曲。上向きの雨を軽い上行形で表し、鳥の声や合図と混同する音は使わない。',
        [['G2','D3','A3'],['A2','E3','C4'],['C3','G3','D4'],['D3','A3','F#4'],
         ['E3','B3','G4'],['C3','G3','B3'],['A2','E3','B3'],['D3','A3','C4']],
        [[(.5,'D4',.8),(1.75,'G4',.8),(3,'A4',.7)],[(1,'E4',1.8)],
         [(.75,'G4',1),(2.5,'B4',1)],[(1,'A4',1.7)],
         [(.5,'B4',1),(2.25,'G4',1)],[(1,'E4',1.8)],
         [(.75,'D4',.8),(2,'E4',1)],[(1,'F#4',1),(2.75,'D4',1)]],
        [[(1,'B4',1.8)],[(.5,'A4',1),(2.25,'C5',1)],
         [(1,'G4',1.7)],[(.5,'F#4',.8),(1.75,'A4',1.4)],
         [(1,'E5',1.6)],[(.5,'D5',1),(2.25,'B4',1)],
         [(1,'A4',1.6)],[(.75,'G4',.8),(2.25,'F#4',1)]], 'woodwind')
