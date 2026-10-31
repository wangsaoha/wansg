#!/bin/bash
# 从 Google Fonts 下载思源宋体（Noto Serif SC）的子集：只包含片子里用到的字
# 改了文案以后，把新字加进 TEXT 再运行一次
set -e
cd "$(dirname "$0")"
TEXT="有一个想法。说给它听。查方案画角色做动画检查电路搭3D一次对话。想法，可以走得更远。粉丝自制·非官方QQ群聊机器人方案调研像素角色小克40秒2D动画代码合成音效走线检查：0短路断路Three.js电路板0102030405 …"
Q=$(python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$TEXT")
mkdir -p assets/fonts
for w in 400 600; do
  url=$(curl -sS -A "Mozilla/5.0 Chrome/120" "https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@$w&text=$Q" | grep -o "https://[^)]*" | head -1)
  curl -sS -o assets/fonts/serif-$w.woff2 "$url"
done
