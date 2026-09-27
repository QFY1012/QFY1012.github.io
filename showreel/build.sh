#!/usr/bin/env bash
# One command: render every frame → synthesise the score from the exported cue sheet → mux into public/videos/showreel.mp4
# (the MP4 is the download / share copy; the site plays public/showreel/index.html live with public/showreel/soundtrack.mp3; MP3 plays in every browser)
# Requires: node (repo deps installed), python3 with numpy + scipy, ffmpeg (or FFMPEG=/path/to/ffmpeg).
set -euo pipefail
cd "$(dirname "$0")"
FFMPEG="${FFMPEG:-ffmpeg}"
export FFMPEG
node render.mjs --crf 20 --out out/video.mp4          # also writes out/timeline.json
python3 soundtrack.py out/soundtrack.wav out/timeline.json
"$FFMPEG" -hide_banner -loglevel error -y -i out/video.mp4 -i out/soundtrack.wav \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart ../public/videos/showreel.mp4
# the site plays the composition live (public/showreel/?embed); its opening page holds shorter, so it gets its own
# cue sheet and score
node render.mjs --timeline-only --embed
python3 soundtrack.py out/soundtrack-embed.wav out/timeline-embed.json
"$FFMPEG" -hide_banner -loglevel error -y -i out/soundtrack-embed.wav -c:a libmp3lame -b:a 128k ../public/showreel/soundtrack.mp3
echo "showreel → public/videos/showreel.mp4 · score → public/showreel/soundtrack.mp3"
