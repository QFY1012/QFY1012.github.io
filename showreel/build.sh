#!/usr/bin/env bash
# One command: render 3600 frames → synthesise the score → mux into public/videos/showreel.mp4
# Requires: node (repo deps installed), python3 with numpy + scipy, ffmpeg (or FFMPEG=/path/to/ffmpeg).
set -euo pipefail
cd "$(dirname "$0")"
FFMPEG="${FFMPEG:-ffmpeg}"
export FFMPEG
node render.mjs --shutter 2 --crf 20 --out out/video.mp4
python3 soundtrack.py out/soundtrack.wav
"$FFMPEG" -hide_banner -loglevel error -y -i out/video.mp4 -i out/soundtrack.wav \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart ../public/videos/showreel.mp4
echo "showreel → public/videos/showreel.mp4"
