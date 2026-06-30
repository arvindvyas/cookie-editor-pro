#!/bin/bash
# Build Chrome Web Store assets from raw popup screenshots.
# Renders HTML templates with headless Chrome (crisp text), then builds the promo
# video with ffmpeg. Requires: Google Chrome, ffmpeg, sips (macOS).
# Run from project root:  bash assets/build_assets.sh
set -e
cd "$(dirname "$0")/.."   # project root

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT=assets/store
mkdir -p "$OUT"

echo "Generating HTML templates…"
python3 assets/gen_html.py >/dev/null

shot_html () { # $1=html $2=W $3=H $4=out
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --allow-file-access-from-files --window-size=$2,$3 \
    --screenshot="$4" "file://$PWD/assets/html/$1" >/dev/null 2>&1
  echo "  $4"
}

echo "Rendering store images…"
shot_html intro.html        1280 800 "$OUT/intro.png"
shot_html screen1.html      1280 800 "$OUT/screen1.png"
shot_html screen2.html      1280 800 "$OUT/screen2.png"
shot_html screen3.html      1280 800 "$OUT/screen3.png"
shot_html screen4.html      1280 800 "$OUT/screen4.png"
shot_html promo_small.html   440 280 "$OUT/promo_small_440x280.png"
shot_html promo_marquee.html 1400 560 "$OUT/promo_marquee_1400x560.png"

echo "Building promo video…"
ffmpeg -y -loglevel error \
  -loop 1 -t 3   -i "$OUT/intro.png" \
  -loop 1 -t 3.2 -i "$OUT/screen1.png" \
  -loop 1 -t 3.2 -i "$OUT/screen2.png" \
  -loop 1 -t 3.2 -i "$OUT/screen3.png" \
  -loop 1 -t 3.5 -i "$OUT/screen4.png" \
  -filter_complex " \
    [0][1]xfade=transition=fade:duration=0.5:offset=2.5[a]; \
    [a][2]xfade=transition=fade:duration=0.5:offset=5.2[b]; \
    [b][3]xfade=transition=fade:duration=0.5:offset=7.9[c]; \
    [c][4]xfade=transition=fade:duration=0.5:offset=10.6,format=yuv420p[v]" \
  -map "[v]" -r 30 -movflags +faststart "$OUT/promo_video.mp4"
echo "  $OUT/promo_video.mp4"

echo "Done. Assets in $OUT/"
