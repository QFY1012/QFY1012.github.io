"""The colour-blind views of each 色觉无障碍分析 sample's interface.

    python3 skills/simulate_cvd.py

Applies the same Machado 2009 matrices make_data.py uses for the colour differences
(severity 1.0, in linear RGB) to data/<c>/original.png → protanopia / deuteranopia / tritanopia.png.
"""
from pathlib import Path
import numpy as np
from PIL import Image

from make_data import CVD, SIM

ROOT = Path(__file__).parent
for d in sorted((ROOT / "cvd" / "data").iterdir()):
    if not (d / "original.png").exists():
        continue
    rgb = np.asarray(Image.open(d / "original.png").convert("RGB"), dtype=np.float64) / 255
    lin = np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)
    for kind, m in CVD.items():
        out = np.clip(lin @ np.array(m).T, 0, 1)
        srgb = np.where(out <= 0.0031308, out * 12.92, 1.055 * out ** (1 / 2.4) - 0.055)
        Image.fromarray((srgb * 255 + 0.5).astype(np.uint8)).save(d / f"{SIM[kind]}.png")
    print(d.name)
