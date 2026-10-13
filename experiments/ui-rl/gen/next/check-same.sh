#!/bin/bash
# 新旧组件库各渲染一次,逐字节比检查结果和截图。用法(在 experiments/ 下):ui-rl/gen/next/check-same.sh ui-rl/gen/next/check-pages.txt
S=${EQ_DIR:-/tmp/report-eq}; mkdir -p $S; NEXT=$(dirname "$(realpath "$0")")
SHOOT=/home/user/QFY1012.github.io/experiments/ui-rl/gen/scripts/shoot.mjs
E=$S/eq; rm -rf $E; mkdir -p $E; ln -s /home/user/QFY1012.github.io/experiments/ui-rl/gen/node_modules $E/node_modules
i=0
while read -r ws; do
  i=$((i+1)); id=$(printf "%02d" $i)
  for side in old new; do
    mkdir -p $E/$side/$id; cp "$ws/Page.tsx" "$ws/data.json" $E/$side/$id/; [ -d "$ws/assets" ] && cp -r "$ws/assets" $E/$side/$id/
  done
  cp -r $(dirname "$NEXT")/app $E/new/$id/app; rm -rf $E/new/$id/app/src/components/report; cp -r $NEXT/report $E/new/$id/app/src/components/report
  echo "$id $ws" >> $E/list.txt
done < "$1"
one() { id=$1; for side in old new; do node $SHOOT $S/eq/$side/$id > $S/eq/$side/$id.log 2>&1; done
  r=""; for f in checks.json tiles.json shot.png thumb.png $(cd $S/eq/old/$id && ls tile-*.png); do cmp -s $S/eq/old/$id/$f $S/eq/new/$id/$f || r="$r $f"; done; r=${r:-全部一致}
  echo "$id $r $(grep " $id " /dev/null; awk -v id=$id '$1==id{print $2}' $S/eq/list.txt | sed 's|.*experiments/||')"; }
export -f one; export S SHOOT
cut -d' ' -f1 $E/list.txt | xargs -P 3 -I{} bash -c 'one {}'
