#!/usr/bin/env bash
# Pulls the real stills the showreel uses out of the site's own images and demo videos.
# Every visual in the reel comes from files already in /public — nothing external.
set -euo pipefail
cd "$(dirname "$0")"
FFMPEG="${FFMPEG:-ffmpeg}"
P=../public
A=assets
mkdir -p "$A"
ff() { "$FFMPEG" -hide_banner -loglevel error -y "$@"; }

# ToA — the real product UI (analysis tree + conversation panel)
ff -i "$P/images/toa/Interface.png" -vf "scale=2400:-2:flags=lanczos" "$A/toa-interface.png"

# Public-opinion platform — frames from the recorded demo
ff -ss 72  -i "$P/videos/yuqing-demo.mp4" -frames:v 1 -q:v 2 "$A/po-bubbles.jpg"
ff -ss 134 -i "$P/videos/yuqing-demo.mp4" -frames:v 1 -q:v 2 "$A/po-sankey.jpg"
ff -ss 294 -i "$P/videos/yuqing-demo.mp4" -frames:v 1 -q:v 2 "$A/po-network.jpg"

# Undergraduate flashes — one frame each from the project videos
ff -ss 16 -i "$P/videos/coco.mp4"          -frames:v 1 -vf "scale=1920:-2:flags=lanczos" -q:v 2 "$A/ug-coco.jpg"
ff -ss 30 -i "$P/videos/qibaishi-demo.mp4" -frames:v 1 -vf "crop=2048:1152:1352:0,scale=1920:-2:flags=lanczos" -q:v 2 "$A/ug-qibaishi.jpg"
ff -ss 37 -i "$P/videos/jieguan.mp4"       -frames:v 1 -vf "scale=1920:-2:flags=lanczos,crop=1920:680:0:196" -q:v 2 "$A/ug-l3.jpg"

echo "assets ready in showreel/$A"
