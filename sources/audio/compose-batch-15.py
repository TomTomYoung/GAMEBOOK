"""Original reading loops for GB33–GB36; writes only these four scores."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[2]


def add(s, at, note, beats, instrument, gain, pan=0):
    s['events'].append(dict(at=at, note=note, beats=beats,
                            instrument=instrument, gain=gain, pan=pan))


def compose(n, title, bpm, bars, key, description, chords, phrases, lead):
    s = dict(id=f'gb{n}-theme', title=title, bpm=bpm, bars=bars,
             meter='4/4', key=key, form='A8 B8 A′8' + (' turn8' if bars == 32 else ''),
             description=description, seed=2026102500+n, events=[])
    for bar in range(bars):
        i, t = bar % 8, bar*4
        root, middle, top = chords[i].split()
        if n == 33:
            add(s, t, root, 2.2, 'round-bass', .033, -.10)
            if i % 2 == 0:
                add(s, t+.5, middle, 1.9, 'electric-keys', .039, -.22)
                add(s, t+.5, top, 1.9, 'electric-keys', .025, .18)
        elif n == 34:
            add(s, t, root, 1.7, 'pizzicato', .042, -.18)
            add(s, t+1.5, middle, 1.3, 'felt-piano', .034, .20)
            if i in (1, 3, 6):
                add(s, t+3, top, .8, 'pizzicato', .027, -.24)
        elif n == 35:
            add(s, t, root, 1.4, 'round-bass', .039, -.10)
            add(s, t+1, middle, 1.0, 'marimba', .037, -.20)
            add(s, t+2.75, top, .8, 'pizzicato', .031, .22)
        else:
            add(s, t, root, 3.6, 'felt-piano', .041, -.18)
            add(s, t+1.25, middle, 2.3, 'electric-keys', .030, .20)
            if i % 2 == 1:
                add(s, t+2.75, top, 1.7, 'harmonics', .023, .24)
        phrase = phrases[1 if 8 <= bar < 16 else 0][i].split()
        times = [(1.25, 1.4)] if len(phrase) == 1 else [(.75, 1.0), (2.5, 1.0)]
        if n == 33:
            times = [(2, 1.3)] if len(phrase) == 1 else [(1.25, .9), (2.75, .8)]
        for note, (offset, duration) in zip(phrase, times):
            instrument = 'electric-keys' if n == 33 and bar >= 16 else lead
            add(s, t+offset, note, duration, instrument, .054, .08)
        if 16 <= bar < 24 and i in (2, 5) and n != 33:
            add(s, t+3.25, top, .9, 'felt-piano', .022, -.24)
    s['events'].sort(key=lambda e: (e['at'], e['instrument'], e['note']))
    assert all(0 <= e['at'] < bars*4 and e['beats'] > 0 for e in s['events'])
    (ROOT/f"sources/audio/{s['id']}.score.json").write_text(
        json.dumps(s, ensure_ascii=False, indent=2)+'\n')
    print(s['id'], len(s['events']), bars*240/bpm)


compose(33, '返事を置く水辺', 64, 24, 'F major / open sixths',
        '短い電気鍵盤と柔らかな木管が余白を渡し合う。ネル自身の演奏への興味と主人公の旋律を並べて支える。実際の石・水・停止合図や鐘を模倣せず、歌唱や治癒の達成を演出しない。',
        ['F2 C3 A3', 'D3 A3 F4', 'Bb2 F3 D4', 'C3 G3 D4',
         'A2 E3 C4', 'Bb2 F3 G3', 'G2 D3 Bb3', 'C3 G3 Bb3'],
        [['A4', 'G4 F4', 'D4', 'E4 G4', 'C5 A4', 'G4', 'Bb4 G4', 'E4'],
         ['C5 A4', 'F4', 'D5 C5', 'G4', 'E5 C5', 'D5 Bb4', 'A4', 'G4 E4']], 'woodwind')

compose(34, '手すりの曲がる先', 80, 32, 'Eb major / gentle contrary motion',
        '撥弦の短い歩幅にフェルト鍵盤と木管を重ねる。上下へ向きを変える旋律で観察の楽しさを支え、操作順・球の移動・正解の効果音は入れない。点検廊下からの回収も同じ調子で読める。',
        ['Eb3 Bb3 G4', 'C3 G3 Eb4', 'Ab2 Eb3 C4', 'Bb2 F3 C4',
         'G2 D3 Bb3', 'Ab2 Eb3 Bb3', 'F3 C4 Ab4', 'Bb2 F3 Ab3'],
        [['G4 Bb4', 'Eb5', 'C5 Ab4', 'F4', 'D4 F4', 'Bb4', 'Ab4 F4', 'D4'],
         ['Bb4 G4', 'F4 Eb4', 'Ab4', 'C5 Bb4', 'F4 D4', 'Eb4', 'C5 Ab4', 'F4 Bb4']], 'clarinet')

compose(35, '鍋が先に行く午後', 84, 32, 'C major / domestic syncopation',
        '丸い低音、マリンバ、短い撥弦にクラリネットが軽く応える生活喜劇の曲。行進や客の入場を実時間の指示にせず、共同作業・庭の食事・静かな帰宅のどれにも余白を残す。',
        ['C3 G3 E4', 'A2 E3 C4', 'F2 C3 A3', 'G2 D3 B3',
         'E3 B3 G4', 'F2 C3 G3', 'D3 A3 F4', 'G2 D3 F3'],
        [['E4 G4', 'A4', 'C5 A4', 'B4 G4', 'E4', 'F4 A4', 'G4 F4', 'D4'],
         ['G4 C5', 'E5 C5', 'A4', 'D5 B4', 'G4 E4', 'C5', 'A4 F4', 'B4 G4']], 'clarinet')

compose(36, '雨の広場で一歩', 64, 24, 'D minor / gentle dorian color',
        '穏やかな鍵盤と息の長い木管で、雨の広場の勝負と互いを観察する時間を支える。膝の隙、留め金の破損、正式な一本の音を付けず、勝利・降参・見学を同じ読書曲で扱う。',
        ['D3 A3 F4', 'G2 D3 B3', 'C3 G3 E4', 'A2 E3 G3',
         'F2 C3 A3', 'G2 D3 A3', 'E3 B3 G4', 'A2 E3 G3'],
        [['F4 A4', 'B4', 'G4 E4', 'D4', 'C5 A4', 'G4', 'B4 G4', 'E4'],
         ['A4 D5', 'B4 A4', 'G4', 'E4 G4', 'F4 A4', 'D5 B4', 'G4', 'E4 A4']], 'woodwind')
