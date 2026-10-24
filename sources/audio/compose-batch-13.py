"""Original reading loops for GB25–GB28; writes only these four scores."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[2]


def add(score, at, note, beats, instrument, gain, pan=0):
    score['events'].append(dict(at=at, note=note, beats=beats,
                               instrument=instrument, gain=gain, pan=pan))


def compose(number, title, bpm, bars, key, description, chords, a, b, lead):
    score = dict(id=f'gb{number}-theme', title=title, bpm=bpm, bars=bars,
                 meter='4/4', key=key, form='A8 B8 A′8' + (' turn8' if bars == 32 else ''),
                 description=description, seed=2026102500+number, events=[])
    for bar in range(bars):
        i, start = bar % 8, bar * 4
        chord = chords[i]
        if number == 25:
            add(score, start, chord[0], 4.1, 'round-bass', .037, -.08)
            add(score, start+.5, chord[1], 2.1, 'marimba', .042, -.22)
            add(score, start+2.5, chord[2], 2.2, 'pluck', .031, .20)
        elif number == 26:
            for at, k in [(0, 0), (1.5, 1), (3, 2)]:
                add(score, start+at, chord[k], .8, 'pizzicato', .045, -.21)
            if i % 2 == 0:
                add(score, start+2.25, chord[2], 1.4, 'felt-piano', .028, .24)
        elif number == 27:
            add(score, start, chord[0], 3.1, 'felt-piano', .048, -.16)
            add(score, start+1, chord[1], 1.8, 'pluck', .030, .20)
            add(score, start+2.75, chord[2], 2.0, 'electric-keys', .028, -.25)
        else:
            add(score, start, chord[0], 4.7, 'felt-piano', .044, -.16)
            add(score, start+.75, chord[1], 4.4, 'harmonics', .025, .22)
            if i in (1, 3, 6):
                add(score, start+2.5, chord[2], 2.6, 'electric-keys', .026, -.24)
        phrase = b[i] if 8 <= bar < 16 else a[i]
        for at, note, beats in phrase:
            instrument = 'electric-keys' if number == 28 and bar >= 16 else lead
            add(score, start+at, note, beats, instrument, .059, .10)
        if 16 <= bar < 24 and i in (2, 5):
            add(score, start+3, chord[2], 1.6, 'felt-piano', .025, -.24)
    score['events'].sort(key=lambda e: (e['at'], e['instrument'], e['note']))
    assert all(0 <= e['at'] < bars*4 and e['beats'] > 0 for e in score['events'])
    (ROOT/f"sources/audio/{score['id']}.score.json").write_text(
        json.dumps(score, ensure_ascii=False, indent=2)+'\n')
    print(score['id'], len(score['events']), bars*240/bpm)


compose(25, '背中の水路', 64, 24, 'F major / open sixths',
        '丸い低音と木の響きがゆっくり歩き、木管が葉の間を通る。菜園の日常と竜の大きな呼吸を、収穫の選択に依存しない間の長い旋律にする。',
        [['F2','C3','A3'],['D3','A3','F4'],['Bb2','F3','D4'],['C3','G3','D4'],
         ['A2','E3','C4'],['Bb2','F3','G3'],['G2','D3','Bb3'],['C3','G3','Bb3']],
        [[(.75,'A4',1.3),(2.75,'G4',.8)],[(1,'F4',2)],
         [(.5,'D4',1),(2.25,'F4',1.4)],[(1.25,'G4',1.8)],
         [(.75,'E4',1),(2.5,'C4',1.1)],[(1,'D4',2)],
         [(.5,'Bb3',1.1),(2.25,'D4',1.2)],[(1,'C4',2)]],
        [[(1,'C5',1.8)],[(.5,'A4',1),(2.5,'F4',1)],
         [(1,'G4',1),(2.75,'F4',1)],[(1,'D5',1.8)],
         [(.75,'C5',1),(2.25,'A4',1.2)],[(1,'G4',2)],
         [(.5,'F4',1),(2,'D4',1.4)],[(1,'E4',1.8)]], 'woodwind')

compose(26, '青い灯の幕間', 84, 32, 'Eb major / gentle suspensions',
        '小さな撥弦の足取りへクラリネットが少し遅れて応える。古い劇場の可笑しさと温かさを支え、拍手や開演の合図、配役の決定を音で先取りしない。',
        [['Eb3','Bb3','G4'],['C3','G3','Eb4'],['Ab2','Eb3','C4'],['Bb2','F3','C4'],
         ['G2','D3','Bb3'],['Ab2','Eb3','Bb3'],['F3','C4','Ab4'],['Bb2','F3','Ab3']],
        [[(.75,'G4',.7),(2,'Bb4',1)],[(1,'Eb4',1.6)],
         [(.5,'C4',.7),(1.75,'Eb4',.7),(3,'G4',.7)],[(1,'F4',1.8)],
         [(.75,'D4',.9),(2.5,'Bb3',.9)],[(1.25,'C4',1.5)],
         [(.5,'Ab4',.8),(2,'G4',1.1)],[(1,'F4',1),(2.75,'D4',.8)]],
        [[(.5,'Bb4',.8),(2,'G4',1)],[(1,'C5',1.6)],
         [(.75,'Ab4',.8),(2.5,'G4',.9)],[(1,'D5',1.5)],
         [(.5,'Bb4',.8),(1.75,'G4',1.4)],[(1,'Eb4',1.8)],
         [(.75,'F4',.7),(2,'Ab4',1)],[(1,'G4',.9),(2.5,'F4',1)]], 'clarinet')

compose(27, '三手のあとで', 80, 32, 'A minor / warm modal colors',
        'フェルト鍵盤の短い問いに撥弦と柔らかな電気鍵盤が答える。考える余白と喫茶店の午後を保ち、三つの門の正解や勝敗を示す合図は置かない。',
        [['A2','E3','B3'],['F3','C4','A4'],['D3','A3','F4'],['E3','B3','D4'],
         ['C3','G3','E4'],['G2','D3','A3'],['F3','C4','G4'],['E3','B3','F#4']],
        [[(.5,'E4',.9),(2,'A4',1.4)],[(1,'G4',1.7)],
         [(.75,'F4',1),(2.5,'D4',1)],[(1,'B3',1.8)],
         [(.5,'E4',1),(2.25,'G4',1)],[(1.25,'D4',1.5)],
         [(.75,'C4',1),(2.5,'E4',1)],[(1,'F#4',1),(2.75,'B3',.8)]],
        [[(1,'B4',1.5)],[(.5,'A4',.8),(2,'E4',1.3)],
         [(1,'F4',1.7)],[(.75,'G4',.8),(2.25,'F#4',1.1)],
         [(1,'E5',1.5)],[(.5,'D5',.8),(2,'B4',1.3)],
         [(1,'A4',1.7)],[(.75,'G4',1),(2.5,'E4',1)]], 'felt-piano')

compose(28, '降りてゆく庭', 64, 24, 'D major / suspended sixths',
        '長い倍音と木管の間に、言葉を待つ余白を置く。同じ旋律を後半で柔らかな鍵盤へ渡し、穏やかな降下を保つ。告白や和解の成否による盛り上がりは付けない。',
        [['D3','A3','E4'],['G2','D3','B3'],['B2','F#3','A3'],['A2','E3','B3'],
         ['F#2','C#3','A3'],['G2','D3','A3'],['E3','B3','F#4'],['A2','E3','G3']],
        [[(1,'F#4',2.1)],[(.75,'E4',1.5),(3,'D4',.8)],
         [(1.25,'A4',1.8)],[(1,'G4',2)],
         [(.75,'E4',1.5)],[(1.25,'D4',1.8)],
         [(1,'F#4',1.4),(3,'E4',.8)],[(1.25,'B3',1.9)]],
        [[(1,'A4',2.1)],[(.75,'B4',1.5),(3,'A4',.8)],
         [(1.25,'F#4',1.8)],[(1,'E4',2)],
         [(.75,'C#5',1.5)],[(1.25,'B4',1.8)],
         [(1,'A4',1.4),(3,'F#4',.8)],[(1.25,'E4',1.9)]], 'woodwind')
