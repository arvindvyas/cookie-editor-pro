#!/usr/bin/env python3
"""Generate HTML templates for Chrome Web Store assets, then screenshot via Playwright."""
import os
BASE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(BASE, "raw")
HTML = os.path.join(BASE, "html")
os.makedirs(HTML, exist_ok=True)

GRAD = "linear-gradient(135deg,#3b78ff 0%,#1f57d6 100%)"
FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif"

def page(w, h, body, extra=""):
    return f"""<!DOCTYPE html><html><head><meta charset="utf-8"><style>
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:{w}px;height:{h}px;overflow:hidden;font-family:{FONT}}}
.stage{{width:{w}px;height:{h}px;background:{GRAD};display:flex;flex-direction:column;
  align-items:center;justify-content:center;color:#fff}}
{extra}
</style></head><body><div class="stage">{body}</div></body></html>"""

def slide(name, shot, headline):
    body = f"""
    <div style="font-size:44px;font-weight:800;margin:34px 0 22px;text-align:center;
      text-shadow:0 2px 8px rgba(0,0,0,.18)">{headline}</div>
    <img src="file://{RAW}/{shot}" style="max-height:632px;max-width:1180px;
      border-radius:16px;box-shadow:0 24px 60px rgba(0,0,0,.35);background:#fff"/>"""
    open(os.path.join(HTML, name), "w").write(page(1280, 800, body))

# Store screenshots (1280x800)
slide("intro.html", None, "")  # placeholder replaced below
open(os.path.join(HTML, "intro.html"), "w").write(page(1280, 800, f"""
  <img src="file://{BASE}/../icons/icon128.png" style="width:150px;height:150px;
    border-radius:32px;box-shadow:0 20px 50px rgba(0,0,0,.3)"/>
  <div style="font-size:66px;font-weight:800;margin-top:34px;
    text-shadow:0 2px 10px rgba(0,0,0,.2)">Cookie Editor Pro</div>
  <div style="font-size:30px;margin-top:14px;color:#dce6ff">View · Edit · Clean · Manage Cookies</div>"""))

slide("screen1.html", "shot1.png", "See every cookie on any site")
slide("screen2.html", "shot2.png", "Grouped by domain — expand &amp; collapse")
slide("screen3.html", "shot3.png", "Edit, protect &amp; delete in one click")
slide("screen4.html", "shot5.png", "Block &amp; allow lists + auto-clean")

# Small promo tile (440x280)
open(os.path.join(HTML, "promo_small.html"), "w").write(page(440, 280, f"""
  <div style="display:flex;align-items:center;gap:18px;padding:0 30px">
    <img src="file://{BASE}/../icons/icon128.png" style="width:92px;height:92px;border-radius:20px"/>
    <div style="text-align:left">
      <div style="font-size:30px;font-weight:800">Cookie Editor Pro</div>
      <div style="font-size:16px;color:#dce6ff;margin-top:6px">Edit, clean &amp; manage cookies</div>
    </div>
  </div>"""))

# Marquee promo tile (1400x560)
open(os.path.join(HTML, "promo_marquee.html"), "w").write(page(1400, 560, f"""
  <div style="display:flex;align-items:center;gap:48px;padding:0 90px">
    <img src="file://{BASE}/../icons/icon128.png" style="width:200px;height:200px;border-radius:42px;
      box-shadow:0 20px 50px rgba(0,0,0,.3)"/>
    <div style="text-align:left">
      <div style="font-size:76px;font-weight:800">Cookie Editor Pro</div>
      <div style="font-size:32px;color:#dce6ff;margin-top:16px">View, edit, clean &amp; manage your<br>cookies — 100% local, no servers.</div>
    </div>
  </div>"""))

print("Wrote HTML templates to", HTML)
for f in sorted(os.listdir(HTML)):
    print(" ", f)
