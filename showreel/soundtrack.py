"""Synthesises the showreel's 30 s score (96 BPM) so its cues line up with composition.html.

    python3 showreel/soundtrack.py [out.wav]      (needs numpy + scipy)

Quiet and sparse to match the white, restrained picture: a soft pad, a light mallet arpeggio,
a gentle pulse, and a small chime on every project and every 背景 / 解法 / 结果 step.
Harmony per chapter: D (intro) → Bm (01) → G (02) → Em (03) → A (04) → D (outro).
"""
import sys
import wave
import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
DUR = 30.0
N = int(SR * DUR)
BEAT = 0.625                                   # 96 BPM
rng = np.random.default_rng(1012)
L = np.zeros(N)
R = np.zeros(N)

# mirrored from composition.html: T = { intro, p1..p4, outro }, STEP = beats 1 / 4 / 7 of each project
PROJECTS = [2.5, 8.75, 15.0, 21.25]
OUTRO = 27.5
STEPS = [p + b * BEAT for p in PROJECTS for b in (1, 4, 7)]


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
CHORDS = [  # (start, end, pad voicing, arpeggio notes)
    (0.0, 2.5, [50, 57, 61, 64], [74, 78, 81, 76]),        # Dmaj9
    (2.5, 8.75, [47, 54, 57, 62], [71, 74, 78, 73]),       # Bm(add9)
    (8.75, 15.0, [43, 50, 54, 59], [67, 71, 74, 69]),      # Gmaj7(add9)
    (15.0, 21.25, [40, 47, 55, 62], [67, 71, 74, 66]),     # Em9
    (21.25, 27.5, [45, 52, 57, 61], [69, 73, 76, 71]),     # A(add9)
    (27.5, 30.0, [38, 50, 57, 61, 64], [74, 78, 81, 85]),  # Dmaj9
]
for s0, e0, voicing, arp in CHORDS:
    pl, pr = pad(voicing, e0 - s0 + 0.6)
    i = int(s0 * SR)
    n = min(len(pl), N - i)
    L[i:i + n] += pl[:n] * 0.10
    R[i:i + n] += pr[:n] * 0.10
    # eighth-note mallet arpeggio, lighter on the off-beats
    k, t0 = 0, s0
    while t0 < e0 - 0.01 and t0 < OUTRO + 1.25:
        vel = 0.075 if k % 2 == 0 else 0.045
        add(mallet(arp[k % len(arp)]), t0, vel, pan=-0.35 if k % 2 else 0.35)
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

out = sys.argv[1] if len(sys.argv) > 1 else 'showreel/out/soundtrack.wav'
with wave.open(out, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('soundtrack →', out)
