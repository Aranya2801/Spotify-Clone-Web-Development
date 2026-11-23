"""
Pre-computes audio features for every track in assets/audio and writes
them to data/features.json. The web player reads that file to build the
"similar tracks" list and the smooth shuffle order.

I do this offline instead of in the browser because decoding ten mp3s with
OfflineAudioContext on page load was slow (~4s on my laptop) and blocked
the UI. The json is ~30KB, so it's a much better trade.

usage:
    pip install -r tools/requirements.txt
    python tools/extract_features.py
"""

import json
import sys
from pathlib import Path

import librosa
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
AUDIO_DIR = ROOT / "assets" / "audio"
OUT = ROOT / "data" / "features.json"

SR = 22050
N_MFCC = 13
WAVEFORM_POINTS = 160

# Krumhansl-Schmuckler key profiles
MAJOR = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MINOR = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
PITCHES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def estimate_key(chroma_mean):
    best = (-2.0, None)
    for shift in range(12):
        rolled = np.roll(chroma_mean, -shift)
        for profile, mode in ((MAJOR, "major"), (MINOR, "minor")):
            r = np.corrcoef(rolled, profile)[0, 1]
            if r > best[0]:
                best = (r, f"{PITCHES[shift]} {mode}")
    return best[1], float(best[0])


def waveform_peaks(y, points):
    # max abs amplitude per bucket, scaled 0..1. used to draw the seek bar
    chunks = np.array_split(np.abs(y), points)
    peaks = np.array([c.max() if len(c) else 0.0 for c in chunks])
    peaks = peaks / (peaks.max() or 1.0)
    return [round(float(p), 3) for p in peaks]


def analyse(path):
    y, sr = librosa.load(path, sr=SR, mono=True)
    duration = len(y) / sr

    tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
    tempo = float(np.atleast_1d(tempo)[0])

    rms = librosa.feature.rms(y=y)[0]
    centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
    rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
    zcr = librosa.feature.zero_crossing_rate(y)[0]
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=N_MFCC)

    key, key_conf = estimate_key(chroma.mean(axis=1))

    # beat regularity: low std of inter-beat intervals -> steady groove
    beat_times = librosa.frames_to_time(beats, sr=sr)
    ibi = np.diff(beat_times)
    regularity = float(1.0 / (1.0 + ibi.std() * 10)) if len(ibi) > 2 else 0.0

    return {
        "duration": round(duration, 2),
        "tempo": round(tempo, 1),
        "key": key,
        "keyConfidence": round(key_conf, 3),
        "energy": round(float(rms.mean()), 5),
        "energyStd": round(float(rms.std()), 5),
        "brightness": round(float(centroid.mean()), 1),
        "rolloff": round(float(rolloff.mean()), 1),
        "zcr": round(float(zcr.mean()), 5),
        "onsetRate": round(float(onset_env.mean()), 4),
        "beatRegularity": round(regularity, 4),
        "chroma": [round(float(c), 4) for c in chroma.mean(axis=1)],
        "mfcc": [round(float(m), 3) for m in mfcc.mean(axis=1)],
        "waveform": waveform_peaks(y, WAVEFORM_POINTS),
    }


def main():
    files = sorted(AUDIO_DIR.glob("*.mp3"))
    if not files:
        sys.exit(f"no mp3 files found in {AUDIO_DIR}")

    tracks = {}
    for f in files:
        print(f"analysing {f.name} ...", flush=True)
        tracks[f.stem] = analyse(f)

    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps({"sampleRate": SR, "tracks": tracks}, indent=1))
    print(f"wrote {OUT.relative_to(ROOT)} ({len(tracks)} tracks)")


if __name__ == "__main__":
    main()
