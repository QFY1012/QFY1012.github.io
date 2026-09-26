"""Synthesises the showreel's score (96 BPM, D major) from the cue sheet the composition exports.

    node showreel/render.mjs --timeline-only        → showreel/out/timeline.json
    python3 showreel/soundtrack.py [out.wav] [timeline.json]      (needs numpy + scipy)

Quiet and sparse to match the white, restrained picture, but it moves with the story so the long reading
holds never sit on one loop:
  - the harmony changes on every 背景 / 解法 / 结果 step, and within a step every two bars;
  - each chapter has its own arpeggio figure, and the three research chapters a softer, glassier voice;
  - density follows the step: pad under the title, a sparse figure in 背景, full eighths, bass and pulse in
    解法, and in 结果 a short bell motif, light off-beat ticks and a brighter pad;
  - four-bar phrases breathe (the fourth bar drops back), and the level arcs across the reel.
Chapter changes still get a swell and a chime; every step a small tick.
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
EIGHTH = BEAT / 2
rng = np.random.default_rng(1012)
L = np.zeros(N)
R = np.zeros(N)

CHAPTERS = CUES['chapters']
INTRO_END = CUES['intro'][1]
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
    if i >= N or gain <= 0:
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


def glass(n, d=1.3):
    """Rounder, longer tone for the research chapters: fundamental + a soft octave, slow decay."""
    t = tt(d)
    f = midi(n)
    v = np.sin(2 * np.pi * f * t) * np.exp(-t * 3.2) + 0.18 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 7)
    return v * np.minimum(1, t / 0.012)


def bell(n, d=2.4):
    t = tt(d)
    f = midi(n)
    v = np.sin(2 * np.pi * f * t) * np.exp(-t * 1.8) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 5) \
        + 0.12 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 9)
    return v * np.minimum(1, t / 0.003)


def chime(notes, d=2.2):
    t = tt(d)
    v = np.zeros(len(t))
    for k, n in enumerate(notes):
        f = midi(n)
        v += (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6)) * np.exp(-t * (1.6 + k * .3))
    return v / len(notes) * np.minimum(1, t / 0.003)


def bass(n, d):
    t = tt(d)
    f = midi(n)
    v = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 4)
    env = np.minimum(1, t / 0.02) * np.exp(-t * 1.1) * np.clip((d - t) / 0.15, 0, 1)
    return lp(v * env, 400)


def tick():
    t = tt(0.03)
    return hp(rng.standard_normal(len(t)), 5000) * np.exp(-t * 180) * 0.6 + np.sin(2 * np.pi * 2600 * t) * np.exp(-t * 260)


def hat():
    t = tt(0.06)
    return hp(rng.standard_normal(len(t)), 7000) * np.exp(-t * 70)


def pulse():
    t = tt(0.35)
    f = 52 + 40 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * np.minimum(1, t / 0.006)


def swell(d=0.6):
    t = tt(d)
    return lp(hp(rng.standard_normal(len(t)), 900), 5000) * (t / d) ** 2.5


def pad(notes, d, attack=0.45, release=0.7, cutoff=1500):
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


# ---------- harmony ----------
CH = {  # pad voicing, arpeggio tones (low → high), bass
    'Dmaj9':   ([50, 57, 61, 64], [74, 76, 78, 81], 38),
    'Dmaj7/F#': ([42, 50, 57, 61], [69, 73, 74, 78], 42),
    'Bm9':     ([47, 54, 57, 62], [71, 73, 74, 78], 47),
    'Bm7':     ([47, 54, 57, 62], [66, 69, 71, 74], 47),
    'Gmaj7':   ([43, 50, 54, 59], [67, 71, 74, 78], 43),
    'Gmaj9':   ([43, 50, 57, 59], [69, 71, 74, 79], 43),
    'Em9':     ([40, 47, 55, 62], [66, 67, 71, 74], 40),
    'F#m7':    ([42, 52, 57, 61], [66, 69, 73, 76], 42),
    'A6':      ([45, 52, 57, 61], [69, 71, 73, 76], 45),
}
# per chapter: (背景, 解法, 结果), each a pair of chords that alternate every two bars
HARMONY = [
    (('Bm9', 'Gmaj7'), ('Em9', 'A6'), ('Dmaj9', 'Gmaj9')),
    (('Gmaj7', 'Em9'), ('Bm7', 'A6'), ('Dmaj7/F#', 'Gmaj9')),
    (('Em9', 'F#m7'), ('Gmaj7', 'A6'), ('Bm9', 'Gmaj9')),
    (('F#m7', 'Bm7'), ('Gmaj7', 'Dmaj7/F#'), ('Em9', 'A6')),
    (('Gmaj9', 'Dmaj7/F#'), ('Em9', 'Bm7'), ('Gmaj7', 'A6')),
    (('Bm7', 'Gmaj7'), ('Dmaj9', 'A6'), ('Gmaj9', 'A6')),
]
PATTERNS = [  # eighth-note figures, indices into the chord's arpeggio tones
    [0, 1, 2, 3, 2, 1, 2, 3],
    [0, 2, 1, 3, 0, 2, 1, 3],
    [3, 2, 1, 0, 1, 2, 3, 2],
    [0, 2, 3, 2, 1, 2, 3, 2],
    [0, 1, 3, 1, 2, 1, 3, 1],
    [0, 3, 2, 3, 1, 3, 2, 3],
]
RESEARCH = {3, 4}                          # NarraSteer, ToA: the softer voice
LEVEL = [0.86, 0.93, 1.0, 0.84, 0.92, 1.0]  # the arc across the reel
SECTION = {'title': .75, 'bg': 1.0, 'sol': 1.0, 'res': 1.06}
PHRASE = [1.0, 0.92, 1.0, 0.78]            # four-bar phrases breathe on the last bar


def segments(t0, t1, pair, bar0):
    """Split [t0, t1) into two-bar blocks alternating between the pair, counted from bar0."""
    out, t, k = [], t0, int(round((t0 - bar0) / (8 * BEAT)))
    while t < t1 - 1e-6:
        e = min(t1, bar0 + (k + 1) * 8 * BEAT)
        out.append((t, e, pair[k % 2]))
        t, k = e, k + 1
    return out


def lay_pad(t0, t1, chord, gain, cutoff):
    voicing = CH[chord][0]
    pl, pr = pad(voicing, t1 - t0 + 0.7, cutoff=cutoff)
    i = int(t0 * SR)
    n = min(len(pl), N - i)
    L[i:i + n] += pl[:n] * gain
    R[i:i + n] += pr[:n] * gain


def lay_arp(t0, t1, chord, pat, voice, every, gain, lift=0):
    tones = CH[chord][1]
    t = t0
    while t < t1 - 1e-6:
        n8 = int(round(t / EIGHTH))                           # global eighth index keeps every figure on the grid
        if n8 % every == 0:
            bar = (n8 // 8) % 4
            step = n8 % 8
            rot = (n8 // 32) % 2 * 2                          # second phrase of every eight bars: figure shifted
            note = tones[pat[(step + rot) % 8] % len(tones)] + lift
            vel = (0.075 if step % 2 == 0 else 0.048) * PHRASE[bar] * gain
            add(voice(note), t, vel, pan=0.35 if step % 2 == 0 else -0.35)
        t += EIGHTH


# intro: Dmaj9, turning to A6 for the last bar so the first chapter's Bm lands as a resolution
intro_turn = INTRO_END - 4 * BEAT
lay_pad(0.0, intro_turn, 'Dmaj9', 0.09, 1400)
lay_pad(intro_turn, INTRO_END, 'A6', 0.09, 1400)
lay_arp(0.0, intro_turn, 'Dmaj9', PATTERNS[0], mallet, 4, 0.7)
lay_arp(intro_turn, INTRO_END, 'A6', PATTERNS[0], mallet, 2, 0.75)

for i, c in enumerate(CHAPTERS):
    s0, (s_bg, s_sol, s_res), e0 = c['start'], c['steps'], c['end']
    bg, sol, res = HARMONY[i % len(HARMONY)]
    pat = PATTERNS[i % len(PATTERNS)]
    voice = glass if i in RESEARCH else mallet
    lvl = LEVEL[i % len(LEVEL)]
    # title + 背景 share one two-bar clock; 解法 and 结果 start their own
    for t0, t1, ch in segments(s0, s_sol, bg, s0):
        lay_pad(t0, t1, ch, 0.095 * lvl, 1200)
        a0 = max(t0, s_bg)
        if a0 < t1:
            lay_arp(a0, t1, ch, pat, voice, 2, SECTION['bg'] * lvl)
            add(bass(CH[ch][2], t1 - a0 + 0.2), a0, 0.11 * lvl)          # one soft bass note per chord
    for t0, t1, ch in segments(s_sol, s_res, sol, s_sol):
        lay_pad(t0, t1, ch, 0.10 * lvl, 1600)
        lay_arp(t0, t1, ch, pat, voice, 1, SECTION['sol'] * lvl)
        b = t0
        while b < t1 - 1e-6:                                  # bass on each bar's downbeat
            add(bass(CH[ch][2], min(4 * BEAT, t1 - b) + 0.2), b, 0.16 * lvl)
            b += 4 * BEAT
    for t0, t1, ch in segments(s_res, e0, res, s_res):
        lay_pad(t0, t1, ch, 0.105 * lvl, 2200)
        lay_arp(t0, t1, ch, pat, voice, 1, SECTION['res'] * lvl)
        b = t0
        while b < t1 - 1e-6:                                  # bass on beats 1 and 3
            add(bass(CH[ch][2], min(2 * BEAT, t1 - b) + 0.2), b, 0.14 * lvl)
            b += 2 * BEAT
    # 结果: a four-note bell motif on the chord, one note a beat, rising (falling in the research chapters)
    tones = CH[res[0]][1]
    motif = [tones[0] + 12, tones[1] + 12, tones[2] + 12, tones[3] + 12]
    if i in RESEARCH:
        motif = motif[::-1]
    for k, n in enumerate(motif):
        add(bell(n), s_res + k * BEAT, 0.055 * lvl, pan=-0.2 + k * 0.13)
    # rhythm: a gentle pulse on 1 and 3 from 解法; in 结果 light ticks on the off-beats too
    t = s_sol
    while t < e0 - 0.01:
        add(pulse(), t, 0.2 * lvl)
        t += 2 * BEAT
    t = s_res + EIGHTH
    while t < e0 - 0.01:
        add(hat(), t, 0.035 * lvl, pan=0.3)
        t += BEAT

# outro: the name on a wide Dmaj9
lay_pad(OUTRO, DUR, 'Dmaj9', 0.10, 1600)
add(bass(38, DUR - OUTRO), OUTRO, 0.14)
lay_arp(OUTRO, min(DUR, OUTRO + 2.5), 'Dmaj9', PATTERNS[0], mallet, 2, 0.8)

# chapter changes: a swell into the cut, a chime on it
for c in [c['start'] for c in CHAPTERS] + [OUTRO]:
    add(swell(0.6), c - 0.6, 0.05, pan=-0.2)
    add(chime([86, 93]), c, 0.10, pan=0.15)
# every 背景 / 解法 / 结果 step gets a small tick
for s in [s for c in CHAPTERS for s in c['steps']]:
    add(tick(), s, 0.08, pan=0.25)
# the name: a wider chime, then the motif falling home
add(chime([74, 81, 86, 90], 2.5), OUTRO + 0.1, 0.12)
for k, n in enumerate([90, 88, 86, 81]):
    add(bell(n), OUTRO + 1.2 + k * BEAT, 0.04, pan=0.2 - k * 0.1)


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
