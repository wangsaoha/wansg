#!/bin/bash
# 把 40 秒分成 4 段同时渲染，再拼起来、加上声音
set -e
cd "$(dirname "$0")"
python3 music.py
for i in 0 1 2 3; do
  FROM=$((i*300)) TO=$(((i+1)*300)) PORT=$((8781+i)) PAGE=index.html node render.js video 40 part$i.mp4 > part$i.log 2>&1 &
done
wait
printf "file 'part0.mp4'\nfile 'part1.mp4'\nfile 'part2.mp4'\nfile 'part3.mp4'\n" > parts.txt
# 纸张颗粒每帧都变，用 crf 24 重新压缩，体积小很多、肉眼看不出差别
ffmpeg -y -loglevel error -f concat -safe 0 -i parts.txt -i music.wav -c:v libx264 -crf 24 -preset slow -pix_fmt yuv420p -c:a aac -b:a 160k -shortest promo_40s.mp4
rm -f part*.mp4 part*.log parts.txt
ffprobe -v error -show_entries format=duration -of csv=p=0 promo_40s.mp4
