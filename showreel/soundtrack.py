"""Synthesises the showreel's 15 s score (120 BPM) so every hit lands on a cut in composition.html.

    python3 showreel/soundtrack.py [out.wav]      (needs numpy + scipy)

Harmony follows the chapters: Dm (Alibaba) → B♭ (NarraSteer) → F (ToA) → C (Public Opinion)
→ A riser (undergrad flashes) → D major on the name.
"""
import sys
import wave
import numpy as np
from scipy.signal import butter, lfilter, sosfilt

SR = 48000
DUR = 15.0
N = int(SR * DUR)
rng = np.random.default_rng(1012)
L = np.zeros(N)
R = np.zeros(N)

# cut times mirrored from composition.html (T = { intro, ali, ns, toa, po, ug, end })
INTRO, ALI, NS, TOA, PO, UG, END = 0.0, 1.5, 4.0, 6.5, 9.5, 11.75, 12.5
SLAMS = [3.0, 6.0, 8.5, 11.0]             # 1000+ · 15/16 · +58.3% · 0→1
WHOOSH_INTO = [1.5, 4.0, 6.5, 9.5, 11.75]
FLASHES = [11.75, 12.0, 12.25]
COUNTERS = [(2.45, 2.95), (3.0, 3.4), (6.0, 6.3), (8.5, 8.9)]


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def add(sig, t0, gain=1.0, pan=0.0):
    i = int(round(t0 * SR))
    if i >= N:
        return
    if i < 0:
        sig = sig[-i:]
        i = 0
    sig = sig[: N - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    L[i:i + len(sig)] += sig * gain * l * 1.414
    R[i:i + len(sig)] += sig * gain * r * 1.414


def tt(d):
    return np.arange(int(d * SR)) / SR


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x)


# ---------- instruments ----------
def kick(big=False):
    t = tt(0.6 if big else 0.42)
    f = 44 + (150 if big else 115) * np.exp(-t * 32)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * (5.5 if big else 8.5))
    click = hp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 400) * 0.35
    return np.tanh((body + click) * 1.6)


def clap():
    t = tt(0.3)
    n = bp(rng.standard_normal(len(t)), 1100, 5200)
    env = np.zeros(len(t))
    for k, d in enumerate([0, 0.011, 0.022]):
        env += (t >= d) * np.exp(-(t - d).clip(0) * (260 if k < 2 else 22))
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.4
    return (n * env + body) * 0.8


def hat(open_=False):
    t = tt(0.16 if open_ else 0.05)
    return hp(rng.standard_normal(len(t)), 7500, 4) * np.exp(-t * (28 if open_ else 110))


def tick(freq=3200):
    t = tt(0.018)
    return np.sin(2 * np.pi * freq * t) * np.exp(-t * 320)


def saw(freq, t):
    ph = (freq * t) % 1.0
    return 2 * ph - 1


def pad(notes, d, cutoff=1800, attack=0.25, release=0.35):
    t = tt(d)
    outL, outR = np.zeros(len(t)), np.zeros(len(t))
    for n in notes:
        f = midi(n)
        for det, side in [(-0.11, -1), (0.0, 0), (0.12, 1)]:
            v = saw(f * 2 ** (det / 12), t + rng.random())
            if side <= 0:
                outL += v
            if side >= 0:
                outR += v
    env = np.minimum(1, t / attack) * np.minimum(1, (d - t) / release).clip(0)
    k = 1.0 / (len(notes) * 2)
    return lp(outL, cutoff) * env * k, lp(outR, cutoff) * env * k


def bass_note(n, d=0.2):
    t = tt(d)
    f = midi(n)
    v = np.sin(2 * np.pi * f * t) + 0.35 * np.tanh(3 * np.sin(2 * np.pi * f * t))
    return lp(v, 600) * np.exp(-t * 7) * np.minimum(1, t / 0.004)


def whoosh(d=0.45, rise=True):
    t = tt(d)
    noise = rng.standard_normal(len(t))
    out = np.zeros(len(t))
    blk = 256
    zi = None
    for s in range(0, len(t), blk):
        x = s / len(t)
        fc = (400 + 7000 * x ** 2) if rise else (7400 - 7000 * x ** 0.5)
        b, a = butter(2, [max(80, fc * 0.5), min(20000, fc * 1.6)], 'band', fs=SR)
        if zi is None:
            zi = np.zeros(max(len(a), len(b)) - 1)
        out[s:s + blk], zi = lfilter(b, a, noise[s:s + blk], zi=zi)
    env = (t / d) ** 2.2 if rise else (1 - t / d) ** 2
    return out * env


def boom():
    t = tt(2.6)
    f = 30 + 38 * np.exp(-t * 3)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.5)
    n = lp(rng.standard_normal(len(t)), 900) * np.exp(-t * 5) * 0.6
    return np.tanh((s + n) * 1.8)


def shimmer(notes, d=2.5):
    t = tt(d)
    v = np.zeros(len(t))
    for i, n in enumerate(notes):
        f = midi(n)
        v += np.sin(2 * np.pi * f * t + i) * (0.6 + 0.4 * np.sin(2 * np.pi * (0.7 + i * .3) * t))
    return v / len(notes) * np.exp(-t * 1.1) * np.minimum(1, t / 0.01)


def reverse_swell(d=0.6):
    t = tt(d)
    return hp(rng.standard_normal(len(t)), 3000) * (t / d) ** 3


# ---------- arrangement ----------
beats = np.arange(0, 12.5, 0.5)
# intro slams: one per word, each with a sub
for b0 in [0.0, 0.5, 1.0]:
    add(kick(big=True), b0, 0.95)
    add(clap(), b0, 0.28)
    add(boom()[: int(0.5 * SR)] * np.linspace(1, 0, int(0.5 * SR)), b0, 0.35)
# groove through the chapters (drums drop out on the undergrad flashes)
for b in beats:
    if b < ALI or b >= UG:
        continue
    add(kick(), b, 0.85)
    if int(round(b / 0.5)) % 2 == 1:
        add(clap(), b, 0.32, pan=0.05)
for k in range(int(ALI / .25), int(UG / .25)):
    t0 = k * 0.25
    add(hat(open_=(k % 4 == 2)), t0, 0.11 if k % 2 else 0.06, pan=0.35)
# intro hats (16ths) under the typewriter
for k in range(0, 6):
    add(hat(), 0.25 * k + 0.125, 0.05, pan=-0.3)

# harmony: rolling offbeat bass + pads per chapter
CHORDS = [  # (start, end, bass midi, pad notes)
    (INTRO, ALI, 38, [50, 53, 57]),          # Dm
    (ALI, NS, 38, [50, 53, 57, 60]),         # Dm7
    (NS, TOA, 34, [46, 50, 53, 57]),         # B♭maj7
    (TOA, PO, 41, [48, 53, 57, 60]),         # F
    (PO, UG, 36, [48, 52, 55, 59]),          # Cmaj7
    (UG, END, 33, [45, 49, 52, 57]),         # A (dominant)
]
for s0, e0, bn, notes in CHORDS:
    pl, pr = pad(notes, e0 - s0 + 0.3, cutoff=1400 if s0 < ALI else 2200)
    i = int(s0 * SR)
    n = min(len(pl), N - i)
    L[i:i + n] += pl[:n] * 0.16
    R[i:i + n] += pr[:n] * 0.16
    if s0 >= ALI and s0 < UG:
        t0 = s0 + 0.25
        while t0 < e0 - 0.01:
            add(bass_note(bn + (12 if int(t0 * 4) % 4 == 3 else 0)), t0, 0.32)
            t0 += 0.5

# transitions, slams, counters
for c in WHOOSH_INTO:
    add(whoosh(0.42, True), c - 0.42, 0.22, pan=-0.2)
    add(whoosh(0.3, False), c, 0.10, pan=0.2)
for s0 in SLAMS:
    add(kick(big=True), s0, 0.9)
    add(boom()[: int(0.9 * SR)] * np.linspace(1, 0, int(0.9 * SR)) ** 2, s0, 0.45)
    add(hat(open_=True), s0, 0.18)
for a, b in COUNTERS:
    t0 = a
    while t0 < b:
        add(tick(2600 + 1800 * (t0 - a) / (b - a)), t0, 0.07, pan=0.25)
        t0 += 1 / 28
# ToA metric extra accent; NarraSteer drag-and-click
add(tick(1800), 6.15, 0.12)
add(tick(2400), 6.17, 0.1)

# undergrad flashes: shutter hits into the riser
for f in FLASHES:
    add(kick(big=True), f, 0.8)
    add(clap(), f, 0.35)
    add(hp(rng.standard_normal(int(0.06 * SR)), 2000) * np.exp(-tt(0.06) * 60), f, 0.25)
riser_t = tt(END - UG)
riser = np.sin(2 * np.pi * np.cumsum(220 + 660 * (riser_t / riser_t[-1]) ** 2) / SR) * (riser_t / riser_t[-1]) ** 2
add(riser, UG, 0.07)
add(reverse_swell(0.6), END - 0.6, 0.22)

# the name: impact, D major bloom, typewriter
add(boom(), END, 1.0)
add(kick(big=True), END, 0.9)
add(hp(rng.standard_normal(int(1.2 * SR)), 1500) * np.exp(-tt(1.2) * 3.5), END, 0.18)
sh = shimmer([74, 81, 86, 90, 93], 2.5)
add(sh, END, 0.16, pan=-0.25)
add(sh[int(0.012 * SR):], END, 0.16, pan=0.25)
pl, pr = pad([38, 50, 54, 57, 62, 64], DUR - END, cutoff=1600, attack=0.8, release=0.9)
i = int(END * SR)
L[i:i + len(pl)] += pl * 0.34
R[i:i + len(pr)] += pr * 0.34
for k in range(25):  # "DESIGN · ENGINEERING · AI" typed at 44 cps from 13.7 s
    add(tick(4200) + tick(1900) * 0.5, 13.7 + k / 44, 0.05, pan=0.1 * np.sin(k))

# ---------- mix bus: short plate reverb, glue, fade ----------
def reverb(x, secs=1.3, mix=0.18, seed=7):
    r = np.random.default_rng(seed)
    t = tt(secs)
    ir = r.standard_normal(len(t)) * np.exp(-t * 4.2)
    ir = lp(ir, 5000)
    send = hp(x, 350)  # keep the low end dry
    n = 1 << int(np.ceil(np.log2(len(x) + len(ir))))
    y = np.fft.irfft(np.fft.rfft(send, n) * np.fft.rfft(ir, n), n)[: len(x)]
    y /= np.max(np.abs(y)) + 1e-9
    return x + y * mix * np.max(np.abs(x))


L, R = reverb(L, seed=7), reverb(R, seed=8)
fade = np.ones(N)
fn = int(0.35 * SR)
fade[-fn:] = np.linspace(1, 0, fn) ** 1.5
L *= fade
R *= fade
mix = np.stack([L, R], 1)
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix *= 0.89 / np.max(np.abs(mix))

out = sys.argv[1] if len(sys.argv) > 1 else 'showreel/out/soundtrack.wav'
pcm = (mix * 32767).astype('<i2')
with wave.open(out, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print('soundtrack →', out)
