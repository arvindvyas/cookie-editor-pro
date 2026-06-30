# Cookie Editor Pro — Store assets & publishing guide

All generated assets live in **`assets/store/`**. Regenerate any time with one command:
```
bash assets/build_assets.sh   # renders images via headless Chrome + builds the video with ffmpeg
```

## 1. What you have (and where each goes in the Developer Dashboard)

| Asset | File | Size | Dashboard field |
|-------|------|------|-----------------|
| Store icon | `icons/icon128.png` | 128×128 | Auto-pulled from the package |
| Screenshot 1 (title) | `assets/store/intro.png` | 1280×800 | Store listing → Screenshots |
| Screenshot 2 | `assets/store/screen1.png` | 1280×800 | Store listing → Screenshots |
| Screenshot 3 | `assets/store/screen2.png` | 1280×800 | Store listing → Screenshots |
| Screenshot 4 | `assets/store/screen3.png` | 1280×800 | Store listing → Screenshots |
| Screenshot 5 | `assets/store/screen4.png` | 1280×800 | Store listing → Screenshots |
| Small promo tile | `assets/store/promo_small_440x280.png` | 440×280 | Store listing → Small promo tile |
| Marquee promo tile | `assets/store/promo_marquee_1400x560.png` | 1400×560 | Store listing → Marquee promo tile |
| Promo video | `assets/store/promo_video.mp4` | 1280×800, ~14s | Upload to YouTube → paste URL (see §2) |

Chrome rules: screenshots must be **1280×800 or 640×400** (1280×800 preferred), 1–5 of them. Small promo tile **440×280**. Marquee **1400×560**. These are all met.

## 2. The video — where to host it

**Chrome Web Store only accepts a YouTube URL** for the listing video. You cannot upload an mp4 directly. So:

1. Go to <https://youtube.com> → **Create → Upload video** → pick `assets/store/promo_video.mp4`.
2. Visibility: **Unlisted** is fine (it still embeds on your store page and won't clutter your channel) — or Public if you want the reach.
3. Title it e.g. *"Cookie Editor Pro — view, edit & clean your cookies"*.
4. Copy the watch URL (`https://www.youtube.com/watch?v=…`).
5. In the Developer Dashboard → **Store listing → Promotional video** → paste the URL → Save draft.

## 3. (Optional) Record a *real* screencast instead

The generated video is a clean slideshow. A live screen recording converts better. Easiest on macOS:

- Press **⌘⇧5** → record a portion → capture the popup while you click through.
- Or use **QuickTime → File → New Screen Recording**.
- Keep it **15–30s**, no audio needed. Follow the script in `VIDEO_SCRIPT.md`.
- Trim/export, upload to YouTube the same way.

## 4. Publish checklist

1. `chrome://extensions` → confirm the unpacked build loads with no errors.
2. Zip the **contents** of the project folder (not the parent), excluding `assets/` and the `.md`/`.py`/`.sh` dev files:
   ```
   cd cookie-editor && zip -r ../cookie-editor-pro.zip . \
     -x "assets/*" "*.md" "*.py" "*.sh" "icons/make_icons.py"
   ```
3. Developer Dashboard → your item → **Package → Upload new package** → `cookie-editor-pro.zip`.
4. Paste the description from `STORE_LISTING.md`, upload screenshots + tiles, paste the YouTube URL.
5. Fill **Privacy practices**: declare *no data collected / no remote code*; add the permission justifications from `STORE_LISTING.md`.
6. **Submit for review.**

> Tip: since you're rebranding the *existing* listing (`flpedpcnnbajikaocbjdidbafmfhajoe`), upload this as a new package version on that same item — you keep your users and install count.
