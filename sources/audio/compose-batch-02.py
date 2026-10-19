from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[2]

def new(n,title,bpm,bars,key,form,description):
 return {'id':f'gb{n:02}-theme','title':title,'bpm':bpm,'bars':bars,'meter':'4/4','key':key,'form':form,'description':description,'seed':2026101900+n,'events':[]}
def add(s,at,note,beats,instrument,gain,pan=0):
 s['events'].append({'at':round(at,4),'note':note,'beats':round(beats,4),'instrument':instrument,'gain':round(gain,4),'pan':pan})
def phrase(s,bar,notes,instrument,gain=.08,pan=.08):
 for at,note,duration in notes: add(s,bar*4+at,note,duration,instrument,gain,pan)
def save(s):
 s['events'].sort(key=lambda x:(x['at'],x['instrument'],x['note']))
 assert all(0<=e['at']<s['bars']*4 and e['beats']>0 for e in s['events'])
 (ROOT/f"sources/audio/{s['id']}.score.json").write_text(json.dumps(s,ensure_ascii=False,indent=2)+'\n')
 print(s['id'],len(s['events']),s['bars']*240/s['bpm'])

# GB02: short woodwind questions, detached low-string answers, open fifths.
s=new(2,'骨の欄干',84,32,'D minor','A8 B8 A′8 B′8','短い木管風の問いと低い弦の応答。通行交渉と試合の両方に使える、決着を急がせない緊張。')
chords=[['D3','F3','A3'],['Bb2','D3','F3'],['G2','Bb2','D3'],['A2','E3','A3'],['D3','F3','A3'],['C3','E3','G3'],['Bb2','D3','F3'],['A2','E3','G3']]
melA=[[(.5,'D4',.7),(1.5,'F4',.6),(2.5,'E4',.6)],[(0,'D4',1.4),(2.5,'A3',.7)],[(.5,'Bb3',.7),(1.5,'D4',.6),(3,'G4',.6)],[(0,'E4',1.4),(2.5,'C#4',.7)],[(.5,'A4',.6),(1.5,'F4',.8),(3,'D4',.6)],[(0,'E4',1.2),(2,'G4',.8)],[(.5,'F4',1.2),(2,'D4',.8)],[(0,'E4',1.4),(2.5,'A3',.8)]]
melB=[[(0,'F4',1.1),(1.5,'A4',.6),(3,'G4',.6)],[(.5,'F4',.8),(2,'D4',1.1)],[(0,'D4',.7),(1,'G4',.7),(2.5,'F4',.8)],[(.5,'E4',1.3),(2.5,'C#4',.8)],[(0,'D4',1.3),(2,'F4',.6)],[(.5,'G4',.7),(1.5,'E4',1.2)],[(0,'D4',1.4),(2.5,'F4',.6)],[(.5,'E4',1.3),(2.5,'C#4',.6)]]
for bar in range(32):
 c=chords[bar%8]
 for note in c: add(s,bar*4,note,4.4,'pad',.012,-.18)
 for at in (0,2): add(s,bar*4+at,c[0],.85,'short-strings',.06,-.2)
 add(s,bar*4+1,c[2],.7,'pizzicato',.045,.3)
 if bar%4!=3: add(s,bar*4+3.25,c[1],.55,'pizzicato',.035,.3)
 phrase(s,bar,(melA if (bar//8)%2==0 else melB)[bar%8],'woodwind',.085 if bar<16 else .077)
save(s)

# GB03: an unhurried counter conversation, four-bar breath at the turn.
s=new(3,'終夜窓口',72,28,'B-flat major / G minor','A8 B8 A′8 turn4','間を空けたクラリネット風の旋律と小さなピアノ。窓口の夜の生活感を保ち、返還や和解の結果を決めない。')
chords=[['Bb2','D3','F3','A3'],['D3','F3','A3','C4'],['Eb3','G3','Bb3','D4'],['F3','Bb3','C4','F4'],['G2','Bb2','D3','F3'],['C3','Eb3','G3','Bb3'],['Eb3','G3','Bb3','D4'],['F3','A3','C4','Eb4']]
melA=[[(1,'F4',1.5),(3,'D4',.7)],[(.5,'A4',1),(2,'F4',1.4)],[(1,'G4',1.4),(3,'F4',.7)],[(.5,'Eb4',1.5)],[(1,'D4',1.8)],[(.5,'G4',.8),(2,'Eb4',1.4)],[(1,'F4',.8),(2.5,'G4',.9)],[(.5,'A4',1.4),(2.5,'C5',.9)]]
melB=[[(.5,'D5',1.3),(2.5,'C5',.8)],[(1,'A4',1.5)],[(.5,'Bb4',.9),(2,'G4',1.3)],[(1,'F4',1.5),(3,'Eb4',.7)],[(.5,'D4',1),(2,'F4',1.5)],[(1,'Eb4',1.6)],[(.5,'G4',1.4),(2.5,'Bb4',.8)],[(1,'A4',1.3)]]
for bar in range(28):
 idx=bar%8 if bar<24 else [4,5,6,7][bar-24];c=chords[idx]
 for note in c[:3]: add(s,bar*4,note,4.8,'strings',.012,-.25)
 for at,k in [(0,0),(1.5,2),(2.5,1),(3.5,3)]: add(s,bar*4+at,c[k],1.7,'piano',.055 if k==0 else .042,-.2)
 if bar<24: phrase(s,bar,(melB if 8<=bar<16 else melA)[idx],'clarinet',.065)
 elif bar==24: phrase(s,bar,[(1,'D4',1.5)],'clarinet',.05)
 elif bar==26: phrase(s,bar,[(1,'G4',1.4)],'clarinet',.05)
 elif bar==27: phrase(s,bar,[(.5,'A4',1.6)],'clarinet',.05)
save(s)

# GB04: restrained 3+3+2 plucked pulse; soft noise is an instrument, not hoof SFX.
s=new(4,'空席の車輪',88,32,'E minor / Dorian color','A8 B8 A′8 B′8','軽い撥弦の3+3+2の刻み、控えめな低弦と合成ブラシ。足取りを保ちながら、追跡や会談の成否を音で確定しない。')
chords=[['E3','G3','B3'],['D3','F#3','A3'],['A2','C#3','E3'],['B2','E3','F#3'],['C3','E3','G3'],['G2','B2','D3'],['A2','C3','E3'],['B2','D#3','F#3']]
melA=[[(0,'E4',.75),(1.5,'G4',.65),(3,'B4',.65)],[(.5,'A4',.75),(2,'F#4',1.1)],[(0,'E4',.75),(1.5,'C#4',.65),(3,'E4',.65)],[(.5,'F#4',1.2),(2.5,'B3',.75)],[(0,'G4',1),(1.5,'E4',.65),(3,'G4',.65)],[(.5,'B4',.8),(2,'A4',1)],[(0,'G4',.7),(1.5,'E4',.65),(3,'C4',.65)],[(.5,'F#4',1.25),(2.5,'D#4',.75)]]
melB=[[(.5,'B4',.75),(2,'G4',.8)],[(0,'F#4',.7),(1.5,'A4',.65),(3,'D5',.65)],[(.5,'C#5',.75),(2,'A4',1)],[(0,'F#4',.75),(1.5,'E4',.65),(3,'B3',.65)],[(.5,'C5',.8),(2,'G4',1)],[(0,'B4',.75),(1.5,'D5',.65),(3,'B4',.65)],[(.5,'A4',.75),(2,'E4',1)],[(0,'F#4',.75),(1.5,'D#4',1.1)]]
for bar in range(32):
 c=chords[bar%8]
 for at,k in [(0,0),(1.5,2),(3,1)]: add(s,bar*4+at,c[k],.9,'pizzicato',.07,-.25)
 for note in c[:2]: add(s,bar*4,note,3.9,'short-strings',.018,-.15)
 for at in (1,3): add(s,bar*4+at,'C2',.28,'brush',.08,.25)
 phrase(s,bar,(melA if (bar//8)%2==0 else melB)[bar%8],'pluck',.13,.18)
save(s)

# GB05: gently displaced plucked arpeggios and a mostly pentatonic woodwind line.
s=new(5,'縄で運ぶ空',78,28,'G major','A8 B8 A′8 turn4','撥弦の分散和音に淡い木管と柔らかな低音。乾いた山道を歩く余白。鐘・雨・納品完了を示す効果音は使わない。')
chords=[['G2','B2','D3','G3'],['D3','F#3','A3','D4'],['E3','G3','B3','E4'],['C3','E3','G3','C4'],['G2','B2','D3','G3'],['A2','C3','E3','G3'],['C3','E3','G3','B3'],['D3','F#3','A3','C4']]
melA=[[(.5,'G4',1.1),(2,'B4',.9)],[(1,'A4',1.7)],[(.5,'B4',.7),(1.5,'G4',1.4)],[(1,'E4',1.8)],[(.5,'D4',.9),(2,'G4',1.2)],[(1,'A4',.8),(2.5,'G4',.9)],[(.5,'E4',1.2),(2,'G4',.9)],[(1,'A4',1.5)]]
melB=[[(.5,'D5',1.1),(2,'B4',1)],[(1,'A4',.8),(2.5,'F#4',.9)],[(.5,'G4',1.2),(2,'B4',.9)],[(1,'C5',1.6)],[(.5,'B4',.7),(1.5,'G4',1.6)],[(1,'E4',1.6)],[(.5,'G4',.7),(1.5,'E4',1.5)],[(1,'F#4',1.5)]]
for bar in range(28):
 idx=bar%8 if bar<24 else [4,5,6,7][bar-24];c=chords[idx]
 for at,k in [(0,0),(.75,2),(1.5,1),(2.5,3),(3.25,2)]: add(s,bar*4+at,c[k],1.45,'pluck',.07 if k==0 else .052,-.3)
 add(s,bar*4,c[0],4.6,'pad',.025,-.1)
 if bar<24: phrase(s,bar,(melB if 8<=bar<16 else melA)[idx],'woodwind',.065,.2)
 elif bar%2==0: phrase(s,bar,[(1,c[2][:-1]+'4',1.9)],'woodwind',.05,.2)
 elif bar==27: phrase(s,bar,[(1,'A4',1.8)],'woodwind',.05,.2)
save(s)
