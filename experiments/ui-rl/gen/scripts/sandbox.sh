#!/bin/bash
# Run one shell command for the generator agent in a sandbox.
#
#   scripts/sandbox.sh <workspace> <command>
#
# New mount, network and PID namespaces with a fresh root on tmpfs. Inside, the
# command sees only:
#   <workspace>                      read-write (data.json, Page.tsx, screenshots)
#   gen/app, node_modules,           read-only (the component library and the
#   scripts/shoot.mjs, grid-check.mjs build/screenshot tooling)
#   /usr, /opt/node22, /opt/pw-browsers, /etc/fonts and a few /etc files, read-only
#   /tmp, /dev/shm                   empty tmpfs
# Nothing else of the repository, no home directory, no environment variables
# beyond PATH/HOME/LANG (so no API keys), and no network except loopback.
set -euo pipefail
WS="$(realpath "$1")"
CMD="$2"
LOOP="$(realpath "$(dirname "$0")/..")"

exec unshare --mount --net --pid --fork --mount-proc env -i \
  PATH=/usr/sbin:/usr/bin:/bin WS="$WS" CMD="$CMD" LOOP="$LOOP" /bin/bash -c '
set -euo pipefail
R=$(mktemp -d)
mount -t tmpfs -o size=512m sandbox "$R"
ro() { # bind $1 read-only at the same path inside the new root
  if [ -d "$1" ]; then mkdir -p "$R$1"; else mkdir -p "$(dirname "$R$1")"; touch "$R$1"; fi
  mount --bind "$1" "$R$1"; mount -o remount,bind,ro "$R$1"
}
for d in /usr /opt/node22 /opt/pw-browsers /etc/fonts; do ro "$d"; done
for f in /etc/passwd /etc/group /etc/hosts /etc/ld.so.cache; do [ -e "$f" ] && ro "$f"; done
ln -s usr/bin "$R/bin"; ln -s usr/lib "$R/lib"; ln -s usr/lib64 "$R/lib64"; ln -s usr/sbin "$R/sbin"
ro "$LOOP/app"; ro "$LOOP/node_modules"; ro "$LOOP/scripts/shoot.mjs"; ro "$LOOP/scripts/grid-check.mjs"
mkdir -p "$R$WS"; mount --bind "$WS" "$R$WS"
mkdir -p "$R/dev" "$R/proc" "$R/tmp" "$R/dev/shm"
for d in null zero random urandom; do touch "$R/dev/$d"; mount --bind "/dev/$d" "$R/dev/$d"; done
mount -t tmpfs none "$R/tmp"; mount -t tmpfs none "$R/dev/shm"
mount -t proc proc "$R/proc"
# bring loopback up so the page server and Chromium can talk
/usr/bin/python3 -c "import socket,fcntl,struct; fcntl.ioctl(socket.socket(socket.AF_INET,socket.SOCK_DGRAM),0x8914,struct.pack(\"16sH\",b\"lo\",0x49))"
cd "$R$WS"
exec chroot "$R" /usr/bin/env -i PATH=/opt/node22/bin:/usr/bin:/bin HOME=/tmp LANG=C.UTF-8 \
  SHOOT="$LOOP/scripts/shoot.mjs" /bin/bash -c "cd \"$WS\" && $CMD"
'
