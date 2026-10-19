#!/usr/bin/env python3
"""Render the original scores without downloaded samples or runtime synthesis.

Build-time dependencies: Python 3, numpy, scipy, ffmpeg. The game only needs
the resulting Ogg files. Notes, arrangement and timbres are retained in source.
Usage: python scripts/render-music.py [--only gb02-theme gb03-theme ...]
"""
from pathlib import Path
import argparse
import hashlib
import json
import math
import subprocess
import tempfile

import numpy as np
from scipy.signal import lfilter

ROOT = Path(__file__).resolve().parents[1]
RATE = 44100


def run(*args):
    return subprocess.run(['ffmpeg', '-hide_banner', '-nostdin', '-y', *args],
                          check=True, capture_output=True, text=True)


def midi(note):
    letters = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
    accidental = 1 if '#' in note else -1 if 'b' in note else 0
    return 12 * (int(note[-1]) + 1) + letters[note[0]] + accidental


def voice(note, duration, instrument, rng):
    t = np.arange(round(duration * RATE), dtype=np.float64) / RATE
    freq = 440 * 2 ** ((midi(note) - 69) / 12)
    if instrument == 'piano':
        signal = np.zeros(len(t))
        for h, level in enumerate([1, .35, .17, .075, .035, .018], 1):
            partial = freq * h * math.sqrt(1 + .00012 * h * h)
            decay = np.exp(-t * (1.35 + h * .28))
            signal += level * np.sin(2 * np.pi * partial * t) * decay
            signal += .12 * level * np.sin(2 * np.pi * partial * 1.0008 * t) * decay
        envelope = (1 - np.exp(-t / .009)) * np.minimum(1, (duration - t) / .18)
    elif instrument in ('pluck', 'pizzicato'):
        signal = np.zeros(len(t))
        damping = 2.3 if instrument == 'pluck' else 4.0
        for h, level in enumerate([1, .46, .21, .10, .05, .025], 1):
            signal += level * np.sin(2 * np.pi * freq * h * t) * np.exp(-t * (damping + h * .8))
        envelope = (1 - np.exp(-t / .004)) * np.minimum(1, (duration - t) / .12)
    elif instrument == 'brush':
        noise = rng.standard_normal(len(t))
        signal = lfilter([.08], [1, -.92], noise)
        envelope = (1 - np.exp(-t / .018)) * np.exp(-t * 18) * np.minimum(1, (duration - t) / .08)
    elif instrument in ('woodwind', 'clarinet'):
        phase = 2 * np.pi * freq * t + .025 * np.sin(2 * np.pi * 4.6 * t)
        signal = np.sin(phase) + .065 * np.sin(2 * phase) + .14 * np.sin(3 * phase) + .025 * np.sin(5 * phase)
        if instrument == 'clarinet':
            signal += .12 * np.sin(3 * phase) + .04 * np.sin(5 * phase)
        breath = lfilter([.1], [1, -.9], rng.standard_normal(len(t)))
        signal += .01 * breath
        envelope = np.minimum(1, t / .16) * np.minimum(1, (duration - t) / .3)
        envelope *= .93 + .07 * np.sin(np.pi * t / duration)
    else:
        signal = np.zeros(len(t))
        harmonics = [1, .20, .10, .045, .02] if instrument in ('strings', 'short-strings') else [1, .07, .025]
        for detune in [-.0015, .0015]:
            phase = 2 * np.pi * freq * (1 + detune) * t + .018 * np.sin(2 * np.pi * 4.1 * t)
            for h, level in enumerate(harmonics, 1):
                signal += .5 * level * np.sin(h * phase + .15 * h)
        attack = .65 if instrument == 'strings' else .9
        release = .9 if instrument == 'strings' else 1.2
        if instrument == 'short-strings':
            attack, release = .08, .22
        envelope = np.minimum(1, t / attack) * np.minimum(1, (duration - t) / release)
        envelope = np.sin(np.maximum(0, envelope) * np.pi / 2) ** 2
    return signal * np.maximum(0, envelope)


def add_wrapped(mix, signal, offset, pan, gain):
    start = round(offset * RATE) % len(mix)
    stereo = signal[:, None] * gain * np.array([math.cos((pan + 1) * np.pi / 4), math.sin((pan + 1) * np.pi / 4)])
    first = min(len(stereo), len(mix) - start)
    mix[start:start + first] += stereo[:first]
    if first < len(stereo):
        mix[:len(stereo) - first] += stereo[first:]


def render(score):
    beat = 60 / score['bpm']
    sample_count = round(score['bars'] * 4 * beat * RATE)
    mix = np.zeros((sample_count, 2), dtype=np.float64)
    rng = np.random.default_rng(score['seed'])
    for event in score['events']:
        duration = event['beats'] * beat
        signal = voice(event['note'], duration, event['instrument'], rng)
        add_wrapped(mix, signal, event['at'] * beat, event['pan'], event['gain'])
    # Circular room tails are part of the loop, not a fade to silence. All delay
    # paths wrap to the start, preserving the tail of the last phrase.
    dry = mix.copy()
    for delay, gain in [(.071, .11), (.137, .09), (.227, .075), (.379, .052), (.613, .033), (.941, .019), (1.37, .011)]:
        mix += np.roll(dry[:, ::-1], round(delay * RATE), axis=0) * gain
    mix -= mix.mean(axis=0)
    mix *= .65 / max(.001, np.abs(mix).max())
    return mix.astype('<f4')


def loudness(path):
    result = run('-i', str(path), '-af', 'loudnorm=I=-18:TP=-1:LRA=9:print_format=json', '-f', 'null', '-')
    return json.loads(result.stderr[result.stderr.rfind('{'):])


def main():
    parser = argparse.ArgumentParser()
    score_paths = sorted((ROOT / 'sources/audio').glob('*.score.json'))
    parser.add_argument('--only', nargs='+', choices=[p.name.removesuffix('.score.json') for p in score_paths])
    args = parser.parse_args()
    out = ROOT / 'assets/audio'
    out.mkdir(parents=True, exist_ok=True)
    report_path = ROOT / 'sources/audio/render-report.json'
    report = json.loads(report_path.read_text()) if report_path.exists() else {}
    for score_path in score_paths:
        score = json.loads(score_path.read_text())
        name = score['id']
        if args.only and name not in args.only:
            continue
        samples = render(score)
        with tempfile.TemporaryDirectory(prefix='gamebook-music-') as temp:
            temp = Path(temp)
            raw = temp / 'mix.f32'; samples.tofile(raw)
            source = temp / 'source.wav'
            run('-f', 'f32le', '-ar', str(RATE), '-ac', '2', '-i', str(raw), '-c:a', 'pcm_s24le', str(source))
            measured = loudness(source)
            # A constant gain preserves periodicity; a time-varying loudness
            # processor would give the first/last bars different treatment.
            gain_db = min(-18 - float(measured['input_i']), -1.5 - float(measured['input_tp']))
            master = temp / 'master.wav'
            run('-i', str(source), '-af', f'volume={gain_db:.6f}dB', '-c:a', 'pcm_s24le', str(master))
            encoded = out / (name + '.ogg')
            run('-i', str(master), '-c:a', 'libvorbis', '-q:a', '4',
                '-metadata', 'TITLE=' + score['title'], '-metadata', 'ARTIST=GAMEBOOK original score', str(encoded))
            decoded = temp / 'decoded.f32'
            run('-i', str(encoded), '-f', 'f32le', '-acodec', 'pcm_f32le', str(decoded))
            pcm = np.fromfile(decoded, dtype='<f4').reshape(-1, 2)
            metrics = loudness(encoded)
            seam = float(np.max(np.abs(pcm[0] - pcm[-1])))
            # Compare a loop boundary with the largest ordinary adjacent step.
            maximum_step = float(np.max(np.abs(np.diff(pcm, axis=0))))
            assert np.isfinite(pcm).all() and pcm.shape[0] == samples.shape[0]
            assert abs(float(metrics['input_i']) + 18) <= .6
            assert float(metrics['input_tp']) <= -1
            assert seam <= max(.006, maximum_step * 1.5)
            assert encoded.stat().st_size <= 2 * 1024 * 1024
            report[name] = {
                'title': score['title'], 'bpm': score['bpm'], 'bars': score['bars'],
                'sampleRate': RATE, 'channels': 2, 'sampleCount': len(pcm),
                'durationSeconds': len(pcm) / RATE, 'loopStartSample': 0, 'loopEndSampleExclusive': len(pcm),
                'integratedLUFS': float(metrics['input_i']), 'truePeakDBTP': float(metrics['input_tp']),
                'loudnessRangeLU': float(metrics['input_lra']), 'boundaryMaxDelta': seam,
                'interiorMaxDelta': maximum_step, 'bytes': encoded.stat().st_size,
                'sha256': hashlib.sha256(encoded.read_bytes()).hexdigest(),
                'masterPCM24SHA256': hashlib.sha256(master.read_bytes()).hexdigest(),
                'source': str(score_path.relative_to(ROOT)), 'renderer': 'scripts/render-music.py',
                'masterPolicy': '24-bit WAV rendered in temporary build directory; reproducible from score and renderer',
                'listeningReview': 'not_performed',
                'ffmpeg': subprocess.check_output(['ffmpeg', '-version'], text=True).splitlines()[0]
            }
            print(name, json.dumps(report[name], ensure_ascii=False), flush=True)
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    main()
