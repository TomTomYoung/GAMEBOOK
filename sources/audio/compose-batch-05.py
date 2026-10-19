"""Original, branch-neutral reading music for GB16–GB20."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[2]


def new(n, title, bpm, bars, key, form, description):
    return dict(id=f'gb{n:02}-theme', title=title, bpm=bpm, bars=bars,
                meter='4/4', key=key, form=form, description=description,
                seed=2026102000+n, events=[])


def add(s, at, note, beats, instrument, gain, pan=0):
    s['events'].append(dict(at=round(at, 4), note=note, beats=round(beats, 4),
                            instrument=instrument, gain=round(gain, 4), pan=pan))


def phrase(s, bar, notes, instrument, gain=.07, pan=.1):
    for at, note, duration in notes:
        add(s, bar*4+at, note, duration, instrument, gain, pan)


def save(s):
    s['events'].sort(key=lambda e: (e['at'], e['instrument'], e['note']))
    assert all(0 <= e['at'] < s['bars']*4 and e['beats'] > 0 for e in s['events'])
    (ROOT/f"sources/audio/{s['id']}.score.json").write_text(
        json.dumps(s, ensure_ascii=False, indent=2)+'\n')
    print(s['id'], len(s['events']), s['bars']*240/s['bpm'], flush=True)


# GB16: breathing space and low registers; no bell-like percussion or high keys.
s = new(16, '門までの足音', 56, 22, 'D minor / suspended sixths', 'A8 B8 return6',
        '低い弦と息の長い木管、少ない低音のフェルトピアノ。鳴鐘・チャイム・打楽器を使わず、参列人数や約束の履行を音で確定しない。')
chords = [['D3','A3','F4'], ['Bb2','F3','A3'], ['F3','C4','G4'], ['C3','G3','D4'],
          ['G2','D3','A3'], ['Bb2','F3','C4'], ['G2','D3','Bb3'], ['A2','E3','G3']]
a = [[(.75,'A3',2.5)], [(1.25,'F3',2.1)], [(.5,'G3',1.2),(2.5,'A3',1)],
     [(1,'E3',2.4)], [(.75,'D4',2)], [(1.5,'C4',1.8)],
     [(.75,'Bb3',1.4),(2.75,'G3',.9)], [(1.25,'A3',2.2)]]
b = [[(1,'F4',2.1)], [(.75,'D4',2.5)], [(1.5,'C4',1.8)],
     [(.75,'G3',2.5)], [(1,'Bb3',1.3),(2.75,'A3',.9)],
     [(.75,'F3',2.4)], [(1.5,'G3',1.8)], [(.75,'E3',2.5)]]
for bar in range(22):
    i = bar % 8 if bar < 16 else [0,2,4,5,6,7][bar-16]
    for note in chords[i][:2]: add(s, bar*4, note, 4.8, 'strings', .027, -.15)
    if bar % 3 == 0: add(s, bar*4+.5, chords[i][0], 2.8, 'felt-piano', .043, -.08)
    phrase(s, bar, (b if 8 <= bar < 16 else a)[i], 'woodwind', .058, .12)
save(s)

# GB17: irregular rests make each phrase a response, never a ticking countdown.
s = new(17, '人が送る一拍', 68, 26, 'E Dorian', 'A8 B8 A′8 turn2',
        '短い乾いた弦と柔らかな電子鍵盤、操作の間を思わせる不均等な休符。時計・警報・カウントダウン・レバーの効果音は置かない。')
chords = [['E3','B3','F#4'], ['D3','A3','E4'], ['A2','E3','B3'], ['B2','F#3','A3'],
          ['C#3','G3','B3'], ['A2','E3','G3'], ['D3','F#3','A3'], ['B2','F#3','A3']]
a = [[(.25,'B3',.9),(2.75,'E4',.8)], [(1.5,'F#4',1.2)],
     [(.75,'E4',1.4)], [(2,'D4',1)], [(.5,'B3',.8),(2.25,'C#4',.9)],
     [(1.25,'A3',1.6)], [(.5,'F#3',.7),(2.75,'A3',.8)], [(1.75,'B3',1.3)]]
b = [[(1.25,'G4',1.2)], [(.5,'E4',1),(2.5,'D4',.8)], [(1.75,'C#4',1.3)],
     [(.75,'F#4',1.5)], [(1.5,'E4',1)], [(.25,'D4',.8),(2.25,'B3',1.1)],
     [(1.25,'A3',1.2)], [(.75,'F#3',1.5)]]
for bar in range(26):
    i = bar % 8 if bar < 24 else [6,7][bar-24]
    add(s, bar*4+.25, chords[i][0], 1.6, 'short-strings', .051, -.22)
    if bar % 2 == 0: add(s, bar*4+2.5, chords[i][1], 1.15, 'short-strings', .033, -.1)
    if bar % 4 == 1: add(s, bar*4+.75, chords[i][2], 4.1, 'pad', .018, .22)
    phrase(s, bar, (b if 8 <= bar < 16 else a)[i], 'electric-keys', .082, .12)
save(s)

# GB18: modest work-song phrasing with no wedding cadence or success fanfare.
s = new(18, '石を運ぶ役', 82, 30, 'G major / E minor', 'A8 B8 A′8 turn6',
        '温かな撥弦と木管、丸い低音。共同作業の穏やかな歩調を出し、婚礼行進曲・婚礼チャイム・通水や支払完了の効果音を使わない。')
chords = [['G2','D3','B3'], ['D3','A3','F#4'], ['E3','B3','G4'], ['C3','G3','D4'],
          ['A2','E3','C4'], ['G2','D3','A3'], ['C3','E3','B3'], ['D3','A3','C4']]
a = [[(.5,'B4',.8),(2,'G4',1.2)], [(1,'A4',1.6)], [(.5,'G4',.8),(2.25,'E4',1)],
     [(1,'D4',1.8)], [(.5,'E4',.7),(1.75,'G4',.8),(3,'A4',.6)],
     [(.75,'B4',1.6)], [(1,'G4',.9),(2.5,'E4',.9)], [(.75,'F#4',1.8)]]
b = [[(1,'D5',1.5)], [(.5,'C5',.8),(2.25,'A4',1)], [(1,'B4',1.4)],
     [(.75,'G4',1),(2.5,'E4',.9)], [(1,'A4',1.4)], [(.5,'G4',1),(2.25,'D4',1.1)],
     [(.75,'E4',.9),(2.5,'G4',.8)], [(1,'A4',1.7)]]
for bar in range(30):
    i = bar % 8 if bar < 24 else [0,2,4,5,6,7][bar-24]
    c = chords[i]
    add(s, bar*4, c[0], 2.9, 'round-bass', .065, -.08)
    for at, k in [(.5,1),(2.25,2),(3.25,1)]: add(s, bar*4+at, c[k], 1.3, 'pluck', .046, -.2)
    phrase(s, bar, (b if 8 <= bar < 16 else a)[i], 'woodwind', .062, .16)
save(s)

# GB19: two instruments answer without any literal recorded speech.
s = new(19, '重さのある声', 66, 24, 'B minor / D major', 'A8 B8 A′8',
        '薄い弦と柔らかなピアノ、短く返す木管。帰還を待つ暖かさと照合の静けさを残し、録音の声・幽霊音・人数を数える合図を使わない。')
chords = [['B2','F#3','A3'], ['G2','D3','F#4'], ['D3','A3','E4'], ['A2','E3','B3'],
          ['E3','B3','D4'], ['G2','D3','A3'], ['D3','F#3','B3'], ['F#2','C#3','E3']]
a = [[(.5,'F#4',1.4)], [(.75,'D4',1.2)], [(1,'E4',1.3)], [(.5,'C#4',1.5)],
     [(.75,'B3',1.3)], [(1,'D4',1.3)], [(.5,'F#4',1.4)], [(.75,'E4',1.4)]]
b = [[(.5,'A4',1.3)], [(1,'B4',1.2)], [(.75,'F#4',1.4)], [(.5,'E4',1.3)],
     [(1,'G4',1.2)], [(.75,'F#4',1.4)], [(.5,'E4',1.3)], [(1,'C#4',1.4)]]
responses = ['D4','B3','A3','E4','G4','E4','D4','C#4']
for bar in range(24):
    c = chords[bar % 8]
    for note in c[:2]: add(s, bar*4, note, 4.7, 'strings', .022, -.2)
    phrase(s, bar, (b if 8 <= bar < 16 else a)[bar % 8], 'felt-piano', .086, -.08)
    if bar % 2 == 0:
        add(s, bar*4+2.5, responses[bar % 8], 1.05, 'woodwind', .052, .2)
save(s)

# GB20: open-ended harmony works for closure, succession and return to the shelf.
s = new(20, '曲がり角の灯り', 70, 26, 'F major / added ninths', 'A8 B8 A′8 turn2',
        '穏やかなピアノと丸い木管、薄い弦。閉店と継承のどちらにも使える未完の巡り。扉の閉鎖・錠・世界の消滅を表す効果音は置かない。')
chords = [['F3','C4','G4'], ['C3','G3','D4'], ['D3','A3','E4'], ['Bb2','F3','C4'],
          ['G2','D3','A3'], ['A2','E3','G3'], ['Bb2','F3','A3'], ['C3','G3','Bb3']]
a = [[(.5,'A4',1.1),(2.25,'G4',1)], [(1,'E4',1.8)], [(.75,'F4',1.1),(2.5,'A4',.9)],
     [(1,'D5',1.7)], [(.5,'C5',1),(2.25,'A4',1.1)], [(1,'G4',1.7)],
     [(.75,'F4',1.1),(2.5,'D4',.9)], [(1,'E4',1.8)]]
b = [[(1,'C5',1.5)], [(.75,'G4',1),(2.5,'E4',.9)], [(1,'A4',1.6)],
     [(.5,'F4',1.2),(2.25,'D4',1)], [(1,'G4',1.6)], [(.75,'E4',1),(2.5,'C4',.9)],
     [(1,'D4',1.6)], [(.75,'G4',1.8)]]
for bar in range(26):
    i = bar % 8 if bar < 24 else [6,7][bar-24]
    c = chords[i]
    for note in c[:2]: add(s, bar*4, note, 4.6, 'strings', .019, -.2)
    add(s, bar*4+.25, c[0], 2.6, 'felt-piano', .06, -.1)
    phrase(s, bar, (b if 8 <= bar < 16 else a)[i], 'piano', .065, .08)
    if bar % 4 == 2: add(s, bar*4+2.5, c[2], 2.7, 'clarinet', .04, .2)
save(s)
