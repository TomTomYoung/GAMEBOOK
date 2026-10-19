"""Original scores for GB11–GB15, independent from earlier batches."""
from pathlib import Path
import json

ROOT=Path(__file__).resolve().parents[2]

def new(n,title,bpm,bars,key,form,description):
    return dict(id=f'gb{n:02}-theme',title=title,bpm=bpm,bars=bars,meter='4/4',
                key=key,form=form,description=description,seed=2026101920+n,events=[])

def add(s,at,note,beats,instrument,gain,pan=0):
    s['events'].append(dict(at=round(at,4),note=note,beats=round(beats,4),
                            instrument=instrument,gain=round(gain,4),pan=pan))

def phrase(s,bar,notes,instrument,gain=.08,pan=.08):
    for at,note,duration in notes: add(s,bar*4+at,note,duration,instrument,gain,pan)

def save(s):
    s['events'].sort(key=lambda e:(e['at'],e['instrument'],e['note']))
    assert all(0<=e['at']<s['bars']*4 and e['beats']>0 for e in s['events'])
    (ROOT/f"sources/audio/{s['id']}.score.json").write_text(json.dumps(s,ensure_ascii=False,indent=2)+'\n')
    print(s['id'],len(s['events']),s['bars']*240/s['bpm'],flush=True)

# GB11: open low strings and long piano intervals, no literal foghorn or bell.
s=new(11,'二本の塔へ',70,26,'G minor / suspended fifths','A8 B8 A′8 turn2',
      '低弦の長い音と疎らなピアノ、淡い持続音で海の広さを出す。警笛・鐘・波の効果音、航路の正誤を示す合図は置かない。')
chords=[['G2','D3','A3','Bb3'],['Eb3','Bb3','D4','F4'],['Bb2','F3','A3','C4'],['F3','C4','G4','A4'],
        ['C3','G3','Bb3','D4'],['G2','D3','F3','A3'],['Eb3','Bb3','C4','G4'],['D3','A3','C4','E4']]
a=[[(.75,'D4',1.6),(3,'G4',.8)],[(1,'F4',2)],[(.75,'D4',1.8)],[(1.25,'C5',1.7)],
   [(.75,'Bb4',1.2),(2.5,'G4',1)],[(1,'F4',1.8)],[(.75,'G4',2)],[(1.5,'A4',1.6)]]
b=[[(1,'Bb4',1.7)],[(.75,'D5',1.2),(2.5,'C5',1)],[(1,'A4',1.7)],[(.75,'G4',2)],
   [(1,'D5',1.2),(2.75,'Bb4',.8)],[(.75,'A4',1.4),(2.5,'F4',1)],[(1,'Eb4',2)],[(.75,'D4',2.2)]]
for bar in range(26):
    idx=bar%8 if bar<24 else [6,7][bar-24];c=chords[idx]
    for note in c[:2]: add(s,bar*4,note,4.8,'strings',.032,-.2)
    add(s,bar*4+.5,c[2],5.2,'pad',.018,.15)
    add(s,bar*4,c[0],3.2,'felt-piano',.065,-.12)
    if bar%2==0: add(s,bar*4+2.5,c[3],2.8,'felt-piano',.04,.2)
    if bar<24: phrase(s,bar,(b if 8<=bar<16 else a)[idx],'piano',.065,.1)
    elif bar==25: phrase(s,bar,[(1,'A4',2)],'piano',.05,.1)
save(s)

# GB12: varied detached woodwind phrases, no slapstick or automatic victory.
s=new(12,'風に浮く店先',96,36,'D major','A8 B8 A′8 B′8 turn4',
      '歯切れのよい木管と軽い撥弦、控えめな合成手拍子。空中市場の手際とおかしみを出し、床の回収や公演の成立を音で確定しない。')
chords=[['D3','F#3','A3'],['A2','C#3','E3'],['B2','D3','F#3'],['G2','B2','D3'],
        ['E3','G3','B3'],['A2','D3','E3'],['G2','B2','D3'],['A2','C#3','E3']]
a=[[(.5,'F#4',.55),(1.5,'A4',.6),(3,'D5',.5)],[(.25,'C#5',.65),(2,'A4',.8)],[(.5,'B4',.7),(2,'F#4',.6),(3,'D4',.5)],[(1,'G4',.7),(2.5,'B4',.65)],
   [(.5,'E5',.7),(2,'B4',.75)],[(.25,'A4',.6),(1.5,'G4',.6),(3,'E4',.5)],[(.5,'F#4',.55),(1.5,'G4',.6),(3,'B4',.55)],[(1,'C#5',1.1)]]
b=[[(1,'A4',.65),(2.25,'F#4',.75)],[(.5,'E4',.5),(1.5,'A4',.6),(3,'C#5',.5)],[(1,'D5',.65),(2.5,'B4',.75)],[(.5,'D5',.6),(2,'B4',.65)],
   [(1,'G4',.6),(2.25,'B4',.7)],[(.5,'A4',.8),(2,'E4',.8)],[(1,'D5',.65),(2.5,'B4',.6)],[(.5,'A4',1.2)]]
for bar in range(36):
    idx=bar%8 if bar<32 else [4,5,6,7][bar-32];c=chords[idx]
    for at,k in [(0,0),(1.25,2),(2.75,1)]:add(s,bar*4+at,c[k],1.05,'pluck',.062,-.2)
    if bar%2==1:add(s,bar*4+2,'C2',.21,'soft-clap',.085,.18)
    if bar<32:phrase(s,bar,(a if (bar//8)%2==0 else b)[idx],'woodwind',.072,.14)
    elif bar%2==0:phrase(s,bar,[(1,c[2][:-1]+'4',1.2)],'woodwind',.055,.14)
save(s)

# GB13: low woodwind and dry detached strings, not a supernatural lament.
s=new(13,'姓をなぞる雪',62,24,'A-flat major / F minor','A8 B8 A′8',
      '低めの木管風旋律、少ないピアノ、短く乾いた弦。雪谷の静けさと本人の意思に余白を残し、死亡や帰宅を決める響きにしない。')
chords=[['Ab2','Eb3','C4'],['Eb3','Bb3','G4'],['F3','C4','Ab4'],['Db3','Ab3','F4'],
        ['Bb2','F3','Ab3'],['Eb3','Ab3','Bb3'],['Db3','Ab3','C4'],['Eb3','Bb3','Db4']]
a=[[(.75,'C4',1.7)],[(1.5,'Bb3',1.6)],[(.75,'Ab3',1.1),(2.5,'C4',1.1)],[(1,'Db4',1.8)],
   [(.75,'F4',1.2),(2.5,'Db4',1)],[(1,'Eb4',1.6)],[(.75,'C4',1.8)],[(1.5,'Bb3',1.7)]]
b=[[(1,'Eb4',1.3),(2.75,'C4',.8)],[(.75,'G4',1.6)],[(1,'F4',1.7)],[(.75,'Ab4',1.4),(2.5,'F4',1)],
   [(1,'Db4',1.5)],[(.75,'C4',1.1),(2.5,'Bb3',1.1)],[(1,'Ab3',1.8)],[(.75,'Bb3',1.9)]]
for bar in range(24):
    c=chords[bar%8]
    for note in c[:2]:add(s,bar*4+.15,note,2.8,'short-strings',.023,-.25)
    add(s,bar*4,c[0],3,'felt-piano',.07,-.1)
    if bar%2==0:add(s,bar*4+2.25,c[2],2,'piano',.04,.18)
    phrase(s,bar,(b if 8<=bar<16 else a)[bar%8],'clarinet',.064,.12)
save(s)

# GB14: two widely separated low wooden tones per bar; no three-beat command.
s=new(14,'足音の往復',64,24,'B-flat Dorian','A8 B8 A′8',
      '低い木琴風の単音と柔らかな弦、ゆっくり膨らむパッド。物語の三拍の合図を再現せず、炉色・石炭・学習回数を示す効果音を置かない。')
chords=[['Bb2','F3','Ab3'],['Db3','Ab3','Eb4'],['Eb3','Bb3','C4'],['F3','Bb3','C4'],
        ['Gb2','Db3','Ab3'],['Ab2','Eb3','Bb3'],['Eb3','G3','Bb3'],['F3','Ab3','C4']]
a=[[(.5,'Bb3',.85),(2.75,'F3',.85)],[(.75,'Ab3',.85),(3,'Db4',.7)],[(.5,'C4',.9),(2.75,'Bb3',.85)],[(.75,'F3',.9),(3,'Ab3',.7)],
   [(.5,'Db4',.85),(2.75,'Ab3',.85)],[(.75,'Bb3',.85),(3,'Eb4',.7)],[(.5,'G3',.9),(2.75,'Bb3',.85)],[(.75,'C4',.9),(3,'F3',.7)]]
b=[[(.75,'F4',.85),(3,'Db4',.7)],[(.5,'Eb4',.85),(2.75,'Ab3',.85)],[(.75,'G4',.85),(3,'Eb4',.7)],[(.5,'C4',.9),(2.75,'F4',.85)],
   [(.75,'Db4',.85),(3,'Gb3',.7)],[(.5,'Eb4',.85),(2.75,'Bb3',.85)],[(.75,'C4',.85),(3,'G3',.7)],[(.5,'Ab3',.9),(2.75,'F3',.85)]]
for bar in range(24):
    c=chords[bar%8]
    for note in c[:2]:add(s,bar*4,note,4.6,'strings',.027,-.15)
    add(s,bar*4+.5,c[2],5,'pad',.022,.12)
    phrase(s,bar,(b if 8<=bar<16 else a)[bar%8],'low-xylophone',.095,.05)
save(s)

# GB15: the same contour returns with altered spacing, not a literal rewind SFX.
s=new(15,'戻る川の記憶',76,28,'C minor / Dorian color','A8 B8 A′8 turn4',
      '低弦の緩い脈と控えめなピアノ。同じ音型が少し異なる休符で戻り、救出済みの組や巻戻し実行を決めずに循環する。警鐘・秒針・逆再生の効果音は使わない。')
chords=[['C3','G3','Bb3','D4'],['Ab2','Eb3','G3','C4'],['Eb3','Bb3','D4','G4'],['Bb2','F3','A3','D4'],
        ['F3','A3','C4','G4'],['C3','G3','Bb3','Eb4'],['Ab2','Eb3','G3','Bb3'],['G2','D3','F3','A3']]
a=[[(.5,'G4',1),(2,'Eb4',1.25)],[(1,'C4',1.8)],[(.5,'Bb4',1),(2,'G4',1.25)],[(1,'F4',1.8)],
   [(.5,'A4',1),(2,'G4',1.25)],[(1,'Eb4',1.8)],[(.5,'C5',1),(2,'Bb4',1.25)],[(1,'A4',1.8)]]
b=[[(.75,'Eb4',1),(2.25,'G4',1)],[(.5,'Ab4',1.3),(2.5,'G4',.9)],[(.75,'D5',1),(2.25,'Bb4',1)],[(.5,'A4',1.3),(2.5,'F4',.9)],
   [(.75,'C5',1),(2.25,'A4',1)],[(.5,'G4',1.3),(2.5,'Eb4',.9)],[(.75,'G4',1),(2.25,'C5',1)],[(.5,'D5',1.3),(2.5,'B4',.9)]]
for bar in range(28):
    idx=bar%8 if bar<24 else [4,5,6,7][bar-24];c=chords[idx]
    for at in (0,2.25):add(s,bar*4+at,c[0],1.4,'short-strings',.05,-.2)
    for note in c[1:3]:add(s,bar*4,note,4.6,'strings',.016,-.1)
    add(s,bar*4+.25,c[3],2.6,'felt-piano',.048,.2)
    notes=(b if 8<=bar<16 else a)[idx]
    if 16<=bar<24:notes=[(at+.25,note,duration-.2) for at,note,duration in notes]
    if bar<24:phrase(s,bar,notes,'piano',.073,.08)
    elif bar%2==0:phrase(s,bar,[(1,c[2][:-1]+'4',1.6)],'piano',.055,.08)
    elif bar==27:phrase(s,bar,[(1,'B4',1.6)],'piano',.05,.08)
save(s)
