"""Synthesises the showreel's score (96 BPM) from the cue sheet the composition exports.

    node showreel/render.mjs --timeline-only        → showreel/out/timeline.json
    python3 showreel/soundtrack.py [out.wav] [timeline.json]      (needs numpy + scipy)

Quiet and sparse to match the white, restrained picture: a soft pad, a light mallet arpeggio that
fills in from each chapter's 解法 step, a gentle pulse, and a small chime on every chapter and a
tick on every 背景 / 解法 / 结果 step. Harmony: D (intro) → Bm → G → Em → F#m → G → A → D (outro).
"""
import json
import sys
import wave
import numpy as np
from scipy.signal import butter, sosfilt

OUT = sys.argv[1] if len(sys.argv) > 1 else 'showreel/out/soundtrack.wav'
CUES = json.load(open(sys.argv[2] if len(sys.argv) > 2 else 'showreel/out/timeline.json'))
SR = 48000
DUR = CUES['duration']
N = int(SR * DUR)
BEAT = CUES['beat']                                     # 96 BPM; every cue sits on this grid
rng = np.random.default_rng(1012)
L = np.zeros(N)
R = np.zeros(N)

PROJECTS = [c['start'] for c in CUES['chapters']]
SOLUTION = {c['start']: c['steps'][1] for c in CUES['chapters']}   # arpeggio fills in from 解法
STEPS = [s for c in CUES['chapters'] for s in c['steps']]
OUTRO = CUES['outro'][0]


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def tt(d):
    return np.arange(int(d * SR)) / SR


def lp(x, f, order=2):
    return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x)


def add(sig, t0, gain=1.0, pan=0.0):
    i = int(round(t0 * SR))
    if i >= N:
        return
    sig = sig[: N - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    L[i:i + len(sig)] += sig * gain * l * 1.414
    R[i:i + len(sig)] += sig * gain * r * 1.414


# ---------- instruments ----------
def mallet(n, d=0.9):
    """Soft marimba-ish tone: fundamental + a quickly-decaying 4th partial."""
    t = tt(d)
    f = midi(n)
    v = np.sin(2 * np.pi * f * t) * np.exp(-t * 5.5) + 0.25 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 22)
    return v * np.minimum(1, t / 0.004)


def chime(notes, d=2.2):
    t = tt(d)
    v = np.zeros(len(t))
    for k, n in enumerate(notes):
        f = midi(n)
        v += (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6)) * np.exp(-t * (1.6 + k * .3))
    return v / len(notes) * np.minimum(1, t / 0.003)


def tick():
    t = tt(0.03)
    return hp(rng.standard_normal(len(t)), 5000) * np.exp(-t * 180) * 0.6 + np.sin(2 * np.pi * 2600 * t) * np.exp(-t * 260)


def pulse():
    t = tt(0.35)
    f = 52 + 40 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * np.minimum(1, t / 0.006)


def swell(d=0.6):
    t = tt(d)
    return lp(hp(rng.standard_normal(len(t)), 900), 5000) * (t / d) ** 2.5


def pad(notes, d, attack=0.7, release=0.9, cutoff=1500):
    t = tt(d)
    outL, outR = np.zeros(len(t)), np.zeros(len(t))
    for n in notes:
        f = midi(n)
        for det, side in [(-0.07, -1), (0.07, 1)]:
            ph = f * 2 ** (det / 12) * t + rng.random()
            v = 0.7 * np.sin(2 * np.pi * ph) + 0.3 * (2 * (ph % 1.0) - 1)
            if side < 0:
                outL += v
            else:
                outR += v
    env = np.minimum(1, t / attack) * np.clip((d - t) / release, 0, 1)
    k = 1.0 / len(notes)
    return lp(outL, cutoff) * env * k, lp(outR, cutoff) * env * k


# ---------- arrangement ----------
PROGRESSION = [  # (pad voicing, arpeggio notes) per chapter: Bm → G → Em → F#m → G → A, then D
    ([47, 54, 57, 62], [71, 74, 78, 73]),       # Bm(add9)
    ([43, 50, 54, 59], [67, 71, 74, 69]),       # Gmaj7(add9)
    ([40, 47, 55, 62], [67, 71, 74, 66]),       # Em9
    ([42, 52, 57, 61], [66, 69, 73, 76]),       # F#m7
    ([43, 50, 55, 59], [67, 71, 74, 79]),       # G(add9)
    ([45, 52, 57, 61], [69, 73, 76, 71]),       # A(add9)
]
DMAJ9 = ([50, 57, 61, 64], [74, 78, 81, 76])
CHORDS = [(0.0, PROJECTS[0], *DMAJ9)]
for i, c in enumerate(CUES['chapters']):
    CHORDS.append((c['start'], c['end'], *PROGRESSION[i % len(PROGRESSION)]))
CHORDS.append((OUTRO, DUR, [38, 50, 57, 61, 64], [74, 78, 81, 85]))
for s0, e0, voicing, arp in CHORDS:
    pl, pr = pad(voicing, e0 - s0 + 0.6)
    i = int(s0 * SR)
    n = min(len(pl), N - i)
    L[i:i + n] += pl[:n] * 0.10
    R[i:i + n] += pr[:n] * 0.10
    # eighth-note mallet arpeggio, lighter on the off-beats
    k, t0 = 0, s0
    while t0 < e0 - 0.01 and t0 < OUTRO + 2.5:
        busy = s0 in SOLUTION and t0 >= SOLUTION[s0] - 1e-6        # from 解法 onward
        if k % 2 == 0 or busy:
            vel = 0.075 if k % 2 == 0 else 0.045
            add(mallet(arp[(k // (1 if busy else 2)) % len(arp)]), t0, vel, pan=-0.35 if k % 2 else 0.35)
        k, t0 = k + 1, t0 + BEAT / 2

# gentle pulse on beats 1 and 3 through the projects
t0 = PROJECTS[0]
while t0 < OUTRO - 0.01:
    add(pulse(), t0, 0.22)
    t0 += 2 * BEAT

# chapter changes: a swell into the cut, a chime on it
for c in PROJECTS + [OUTRO]:
    add(swell(0.6), c - 0.6, 0.05, pan=-0.2)
    add(chime([86, 93]), c, 0.10, pan=0.15)
# every 背景 / 解法 / 结果 step gets a small tick
for s in STEPS:
    add(tick(), s, 0.08, pan=0.25)
# the name: a wider chime
add(chime([74, 81, 86, 90], 2.5), OUTRO + 0.1, 0.12)


# ---------- mix bus ----------
def reverb(x, secs=1.8, mix=0.25, seed=7):
    r = np.random.default_rng(seed)
    t = tt(secs)
    ir = lp(r.standard_normal(len(t)) * np.exp(-t * 3.2), 6000)
    send = hp(x, 250)
    n = 1 << int(np.ceil(np.log2(len(x) + len(ir))))
    y = np.fft.irfft(np.fft.rfft(send, n) * np.fft.rfft(ir, n), n)[: len(x)]
    y /= np.max(np.abs(y)) + 1e-9
    return x + y * mix * np.max(np.abs(x))


L, R = reverb(L, seed=7), reverb(R, seed=8)
fade = np.ones(N)
fn = int(0.8 * SR)
fade[-fn:] = np.linspace(1, 0, fn) ** 1.5
fade[: int(0.05 * SR)] = np.linspace(0, 1, int(0.05 * SR))
mix = np.stack([L * fade, R * fade], 1)
mix = np.tanh(mix * 1.05) / np.tanh(1.05)
mix *= 0.8 / np.max(np.abs(mix))

with wave.open(OUT, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print(f'soundtrack → {OUT} ({DUR:.2f} s)')
