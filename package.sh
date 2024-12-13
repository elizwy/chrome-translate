#!/bin/bash

# 创建发布目录
mkdir -p dist
mkdir -p dist/icons
mkdir -p dist/images

# 清理旧的发布文件
rm -rf dist/*

# 复制必要文件
cp manifest.json dist/
cp content.js dist/
cp background.js dist/
cp popup.html dist/
cp popup.js dist/
cp README.md dist/
cp -r icons/* dist/icons/
cp -r images/* dist/images/

# 创建zip包
cd dist
zip -r chrome-translator.zip *
cd ..

echo "打包完成！发布文件位于 dist/chrome-translator.zip" 