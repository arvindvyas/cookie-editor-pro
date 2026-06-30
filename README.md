# Cookie Editor Pro

A clean, private Chrome (MV3) extension to view, search, edit, add, delete, protect, and back up your browser cookies. 100% local — no analytics, no servers, no account.

## Features
- List & search cookies for the current site or all sites
- **Domain grouping** with expand/collapse
- **Partitioned / "isolated" cookie support** — sees & deletes cookies other editors skip
- View full cookie details (value, domain, path, expiry, SameSite, Secure, HttpOnly)
- Edit / add / delete cookies in real time
- Protect (lock) cookies from accidental deletion
- Export / import cookies as JSON
- Delete-all (respects protected cookies)
- **Allow / block lists** (wildcard `*.ads.com` or regex `/.../i`) with live auto-delete
- **Auto-clean**: clear-on-startup and best-effort clear-on-tab-close

## Settings page
Right-click the icon → Options (or the ⚙ in the popup) to manage allow/block lists and auto-clean.

## Notes / limits
- "Clear on browser close" isn't reliably possible in MV3 (no close event); we use clear-on-startup + clear-on-tab-close instead, and say so in the UI.
- Partitioned-cookie discovery in "All" scope is best-effort (Chrome has no single API to enumerate every partition); the current-site view is exhaustive for that site.

## Load it locally (unpacked)
1. Open `chrome://extensions`
2. Toggle **Developer mode** (top right)
3. Click **Load unpacked**
4. Select this folder: `cookie-editor/`
5. Pin the extension and click the 🍪 icon

## Project structure
```
cookie-editor/
├── manifest.json       # MV3 manifest, minimal permissions
├── popup.html          # popup markup
├── popup.css           # styles
├── popup.js            # all logic (cookie CRUD, protect, export/import)
├── icons/              # 16/48/128 PNGs + make_icons.py generator
├── STORE_LISTING.md    # ready-to-paste Web Store copy
└── README.md
```

## Privacy
This extension reads and writes only the cookies you choose to manage. It makes **no network requests** and stores only your "protected cookie" list, locally via `chrome.storage.local`.

## Publishing notes
- Pack: just zip the contents of this folder (not the parent) and upload.
- Pick a **distinct name** at upload to avoid search collisions.
