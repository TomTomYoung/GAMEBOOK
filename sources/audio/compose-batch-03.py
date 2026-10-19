"""Original scores for GB06–GB10. Run separately from the audio renderer."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[2]

def new(n, title, bpm, bars, key, form, description):
    return dict(id=f'gb{n:02}-theme', title=title, bpm=bpm, bars=bars,
                meter='4/4', key=key, form=form, description=description,
                seed=2026101910+n, events=[])

def add(s, at, note, beats, instrument, gain, pan=0):
    s['events'].append(dict(at=round(at,4), note=note, beats=round(beats,4),
                            instrument=instrument, gain=round(gain,4), pan=pan))

def phrase(s, bar, notes, instrument, gain=.08, pan=.08):
    for at, note, duration in notes:
        add(s, bar*4+at, note, duration, instrument, gain, pan)

def save(s):
    s['events'].sort(key=lambda x:(x['at'],x['instrument'],x['note']))
    assert all(0<=e['at']<s['bars']*4 and e['beats']>0 for e in s['events'])
    (ROOT/f"sources/audio/{s['id']}.score.json").write_text(json.dumps(s,ensure_ascii=False,indent=2)+'\n')
    print(s['id'],len(s['events']),s['bars']*240/s['bpm'])

# GB06: warm major sevenths, a tentative opening that can continue elsewhere.
s=new(6,'暗転前の入口',64,24,'E-flat major / C minor','A8 B8 A′8',
      'フェルトピアノ風の短い呼びかけと薄い弦。建物との別れに余韻を残し、劇団の終わりや再会の成立を決めない。')
chords=[['Eb3','G3','Bb3','D4'],['Bb2','F3','Bb3','C4'],['C3','Eb3','G3','Bb3'],['Ab2','Eb3','G3','C4'],
        ['F3','Ab3','C4','Eb4'],['Bb2','F3','Ab3','D4'],['Ab2','Eb3','G3','Bb3'],['Bb2','F3','Ab3','C4']]
a=[[(.5,'G4',1.5),(2.75,'Bb4',.75)],[(1,'F4',1.8)],[(.5,'Eb4',1),(2,'G4',1.5)],[(1,'C5',1.6)],
   [(.5,'Ab4',1.7)],[(1,'F4',1),(2.5,'D4',1)],[(.5,'Eb4',1.3),(2.25,'G4',1)],[(1,'F4',2)]]
b=[[(1,'Bb4',1),(2.5,'D5',1)],[(.5,'C5',1.3),(2.5,'Bb4',.9)],[(1,'G4',2)],[(.5,'Eb5',1.2),(2.5,'C5',.9)],
   [(1,'Ab4',1.4),(3,'G4',.65)],[(.5,'F4',1.2),(2.5,'Ab4',1)],[(1,'G4',2)],[(.5,'F4',1.6)]]
for bar in range(24):
    c=chords[bar%8]
    for note in c[1:3]: add(s,bar*4+.25,note,4.7,'strings',.018,-.25)
    add(s,bar*4,c[0],2.8,'felt-piano',.09,-.15)
    for at,k in [(1.75,2),(3.25,3)]: add(s,bar*4+at,c[k],2,'felt-piano',.05,-.15)
    phrase(s,bar,(b if 8<=bar<16 else a)[bar%8],'felt-piano',.105 if bar<16 else .09,.17)
save(s)

# GB07: the same contour with different spaces, never two simultaneous voices.
s=new(7,'二つの間',60,22,'A minor / Dorian color','A8 B8 turn6',
      '温かな合成パッド、丸い低音、疎らな電気鍵盤。似た音型を異なる休符で一つずつ受け渡し、二人格の同時稼働を示す音声は使わない。')
chords=[['A2','E3','B3'],['G2','D3','A3'],['D3','F#3','A3'],['E3','A3','B3'],
        ['F2','C3','E3'],['C3','G3','D4'],['D3','F#3','A3'],['E3','G3','B3']]
a=[[(.5,'E4',1),(2,'B4',.7),(3,'A4',.7)],[(1,'G4',1.8)],[(.5,'F#4',1),(2.5,'E4',1)],[(1,'B4',1.5)],
   [(.5,'E4',1),(2,'G4',.75),(3,'A4',.65)],[(1,'G4',1.8)],[(.5,'F#4',1.5)],[(1,'E4',1.8)]]
b=[[(0,'E4',.7),(1,'B4',1.2),(3,'A4',.6)],[(.5,'G4',1.2)],[(0,'F#4',.75),(1.5,'E4',1.8)],[(.5,'B4',1.4)],
   [(0,'E4',.75),(1,'G4',1.2),(3,'A4',.65)],[(.5,'G4',1.2)],[(0,'F#4',1.6)],[(.5,'E4',1.5)]]
for bar in range(22):
    idx=bar%8 if bar<16 else [0,2,4,5,6,7][bar-16];c=chords[idx]
    for note in c: add(s,bar*4,note,4.8,'pad',.018,-.1)
    add(s,bar*4,c[0],3.1,'round-bass',.075,-.05)
    if bar%2==0: add(s,bar*4+2.75,c[2],2.7,'electric-keys',.04,.05)
    if bar<16:
        phrase(s,bar,(a if bar<8 else b)[idx],'electric-keys',.09,-.18 if bar<8 else .18)
    elif bar in (16,18,20,21):
        phrase(s,bar,[(1,c[2][:-1]+'4',1.8)],'electric-keys',.065,0)
save(s)

# GB08: low viola-like register; soft questions without military pulse.
s=new(8,'机の両側',66,24,'D Dorian / F major','A8 B8 A′8',
      '低い弦と柔らかなピアノに、息の長い木管の問いを置く。行進の拍、勝利の終止、降伏成立の合図を避ける。')
chords=[['D3','F3','A3','E4'],['C3','E3','G3','D4'],['G2','D3','F3','A3'],['D3','E3','A3','C4'],
        ['Bb2','D3','F3','A3'],['F3','A3','C4','G4'],['G2','B2','D3','F3'],['A2','D3','E3','G3']]
a=[[(1,'A3',1.8)],[(.5,'G3',1.1),(2.5,'E4',.9)],[(1,'D4',1.9)],[(.5,'E4',1.5)],
   [(1,'F4',1.3),(3,'D4',.65)],[(.5,'C4',1.5)],[(1,'B3',1),(2.5,'D4',1)],[(.5,'E4',2)]]
b=[[(.5,'F4',1),(2,'E4',1.5)],[(1,'G4',1.5)],[(.5,'A4',1.2),(2.5,'G4',1)],[(1,'E4',1.7)],
   [(.5,'D4',1.1),(2,'F4',1.5)],[(1,'C4',1.7)],[(.5,'D4',1),(2,'B3',1.4)],[(1,'A3',2)]]
for bar in range(24):
    c=chords[bar%8]
    for note in c[:2]: add(s,bar*4,note,4.5,'strings',.028,-.18)
    for at,k in [(0,0),(1.75,2),(3.25,3)]: add(s,bar*4+at,c[k],2.2,'felt-piano',.06,.12)
    phrase(s,bar,(b if 8<=bar<16 else a)[bar%8],'woodwind',.065,.1)
save(s)

# GB09: unevenly spaced little steps, marimba tone, no countdown or kitchen SFX.
s=new(9,'パン箱の遠景',92,32,'C major / Lydian color','A8 B8 A′8 B′8',
      '小さなマリンバ風の跳躍とピチカート、軽い木管。大きな台所を歩く発見を主題にし、残り時間を急かす強い拍は置かない。')
chords=[['C3','E3','G3'],['G2','B2','D3'],['D3','F#3','A3'],['G2','B2','D3'],
        ['A2','C3','E3'],['F3','A3','C4'],['D3','F3','A3'],['G2','B2','D3']]
a=[[(.5,'E5',.5),(1.5,'C5',.7),(3,'G4',.6)],[(.25,'B4',.7),(2,'D5',.7)],[(.5,'F#5',.5),(1.5,'E5',.7),(3,'A4',.6)],[(1,'B4',.7),(2.5,'G4',.9)],
   [(.5,'C5',.5),(1.5,'E5',.8),(3,'A4',.6)],[(.25,'F5',.7),(2,'C5',.8)],[(.5,'D5',.8),(2,'A4',.7)],[(1,'B4',1.1)]]
b=[[(.5,'G4',.7),(2,'C5',.8)],[(1,'D5',.6),(2.25,'B4',.8)],[(.5,'A4',.7),(2,'F#5',.8)],[(1,'G5',.7),(2.5,'D5',.8)],
   [(.5,'E5',.6),(1.75,'C5',.8)],[(1,'A4',.7),(2.5,'C5',.8)],[(.5,'F5',.7),(2,'D5',.7)],[(1,'D5',1.2)]]
for bar in range(32):
    c=chords[bar%8]
    for at,k in [(0,0),(1.25,2),(2.75,1)]: add(s,bar*4+at,c[k],.8,'pizzicato',.06,-.25)
    phrase(s,bar,(a if (bar//8)%2==0 else b)[bar%8],'marimba',.1,.2)
    if bar%4 in (1,3): phrase(s,bar,[(.5,c[1][:-1]+'4',2)],'woodwind',.048,-.05)
save(s)

# GB10: sparse high harmonics, long rests and no irreversible-choice cue.
s=new(10,'頁の外の星',58,22,'F major / D minor','A8 B6 A′8',
      '静かなピアノ、薄い持続弦、遠い倍音風の響き。長い休符を残し、記憶の交換や修理の正解を音で選ばない。')
chords=[['F2','C3','A3','E4'],['C3','G3','B3','D4'],['D3','A3','C4','F4'],['Bb2','F3','A3','C4'],
        ['G2','D3','A3','Bb3'],['A2','E3','G3','C4'],['Bb2','F3','A3','D4'],['C3','G3','Bb3','D4']]
a=[[(1,'A4',2)],[(1.5,'G4',1.6)],[(.5,'F4',1.3),(2.5,'A4',1.3)],[],
   [(1,'D5',1.8)],[(1.5,'C5',1.8)],[(.5,'A4',1.7)],[(1,'G4',2)]]
b=[[(1,'C5',1.8)],[],[(.5,'F5',1.5),(2.5,'E5',1)],[(1,'D5',2)],[],[(1,'G4',2)]]
for bar in range(22):
    idx=bar if bar<8 else ([0,2,3,4,6,7][bar-8] if bar<14 else bar-14);c=chords[idx]
    for note in c[1:3]: add(s,bar*4,note,4.9,'strings',.016,-.2)
    add(s,bar*4,c[0],3.4,'felt-piano',.07,-.1)
    if bar%2==0: add(s,bar*4+2.5,c[3],3,'piano',.04,.15)
    phrase(s,bar,(a[idx] if bar<8 or bar>=14 else b[bar-8]),'piano',.065,.15)
    if bar in (3,7,9,12,17,21): add(s,bar*4+1.5,c[2][:-1]+'5',3.3,'harmonics',.022,.3)
save(s)
