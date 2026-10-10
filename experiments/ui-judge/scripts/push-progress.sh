#!/usr/bin/env bash
# Publish the judge progress to its own branch every few seconds, so a page can
# read it through the viewer's GitHub connection without anyone uploading it.
# The branch holds one commit with progress.json, amended and force-pushed each time.
#
#   scripts/push-progress.sh [interval seconds, default 5]
# Stops a minute after no run is running.
set -u
ROOT=$(cd "$(dirname "$0")/.." && pwd)
INTERVAL=${1:-5}
BRANCH=ui-judge-progress
WORK=${PROGRESS_WORKDIR:-/tmp/ui-judge-progress}
REMOTE=$(git -C "$ROOT" remote get-url origin)
mkdir -p "$WORK"
if [ ! -d "$WORK/.git" ]; then
  git -C "$WORK" init -q -b "$BRANCH"
  git -C "$WORK" remote add origin "$REMOTE"
fi
idle=0
while true; do
  out=$(node "$ROOT/scripts/progress.mjs" "$WORK" 2>&1) || { echo "progress failed: $out"; sleep "$INTERVAL"; continue; }
  rm -f "$WORK/runs.json" "$WORK/groups.json"
  git -C "$WORK" add progress.json
  if git -C "$WORK" rev-parse -q --verify HEAD >/dev/null; then
    git -C "$WORK" commit -q --amend -m "judge progress" --allow-empty
  else
    git -C "$WORK" commit -q -m "judge progress"
  fi
  git -C "$WORK" push -q -f origin "HEAD:refs/heads/$BRANCH" 2>&1 | tail -1
  echo "$out" | grep -q "运行中" && idle=0 || idle=$((idle + INTERVAL))
  [ "$idle" -ge 60 ] && { echo "no run is running; stopped"; exit 0; }
  sleep "$INTERVAL"
done
