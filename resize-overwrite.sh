#!/bin/bash

SRC=./assets

# --- app icon (1024x1024) ---
if [ -f "$SRC/icon.png" ]; then
  magick "$SRC/icon.png[0]" \
    -resize 1024x1024^ -gravity center -extent 1024x1024 \
    "$SRC/icon.png"
fi

# --- android adaptive icon (1024x1024) ---
if [ -f "$SRC/adaptive-icon.png" ]; then
  magick "$SRC/adaptive-icon.png[0]" \
    -resize 1024x1024^ -gravity center -extent 1024x1024 \
    "$SRC/adaptive-icon.png"
fi

# --- splash screen (1242x2436 portrait) ---
if [ -f "$SRC/splash.png" ]; then
  magick "$SRC/splash.png[0]" \
    -resize 1242x2436^ -gravity center -extent 1242x2436 \
    "$SRC/splash.png"
fi

echo "✅ Resize เสร็จแล้ว (icon, adaptive-icon, splash ถูกเขียนทับเรียบร้อย)"
