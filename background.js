// Cookie Editor Pro — background service worker.
// Enforces block/allow lists and auto-clean. 100% local, no network calls.

const DEFAULTS = {
  blocklist: [],          // patterns: auto-delete cookies whose domain matches
  allowlist: [],          // patterns: never auto-delete (wins over blocklist)
  autoDeleteBlocked: true, // live enforcement via cookies.onChanged
  clearOnStartup: false,   // clear blocklisted cookies when the browser starts
  clearOnTabClose: false   // clear a site's cookies when its last tab closes (best-effort)
};

async function getSettings() {
  const { settings } = await chrome.storage.local.get('settings');
  return Object.assign({}, DEFAULTS, settings || {});
}

// ---------- pattern matching ----------
// Supports wildcards (e.g. *.google.com) and regex literals (e.g. /(^|\.)google\.com/i).
function compileMatcher(pattern) {
  const p = (pattern || '').trim();
  if (!p) return null;
  const rx = p.match(/^\/(.*)\/([a-z]*)$/i);
  if (rx) { try { return new RegExp(rx[1], rx[2]); } catch { return null; } }
  const esc = p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  try { return new RegExp('^' + esc + '$', 'i'); } catch { return null; }
}

function matchesAny(domain, patterns) {
  if (!patterns || !patterns.length) return false;
  const bare = String(domain).replace(/^\./, '');
  return patterns.some((p) => {
    const m = compileMatcher(p);
    return m && (m.test(domain) || m.test(bare));
  });
}

// ---------- cookie helpers ----------
function cookieUrl(c) {
  const protocol = c.secure ? 'https://' : 'http://';
  const host = c.domain && c.domain.startsWith('.') ? c.domain.slice(1) : c.domain;
  return protocol + host + (c.path || '/');
}

function removeCookie(c) {
  const d = { url: cookieUrl(c), name: c.name };
  if (c.storeId) d.storeId = c.storeId;
  if (c.partitionKey) d.partitionKey = c.partitionKey;
  return chrome.cookies.remove(d).catch(() => {});
}

function isBlocked(domain, s) {
  return !matchesAny(domain, s.allowlist) && matchesAny(domain, s.blocklist);
}

async function runCleanup(s) {
  s = s || await getSettings();
  if (!s.blocklist.length) return 0;
  const all = await chrome.cookies.getAll({});
  let n = 0;
  for (const c of all) {
    if (isBlocked(c.domain, s)) { await removeCookie(c); n++; }
  }
  return n;
}

// ---------- live enforcement ----------
chrome.cookies.onChanged.addListener(async (info) => {
  if (info.removed) return; // ignore our own/expiry removals (prevents loops)
  const s = await getSettings();
  if (!s.autoDeleteBlocked) return;
  if (isBlocked(info.cookie.domain, s)) removeCookie(info.cookie);
});

// ---------- clear on browser startup ----------
chrome.runtime.onStartup.addListener(async () => {
  const s = await getSettings();
  if (s.clearOnStartup) await runCleanup(s);
});

// ---------- best-effort "clear on tab close" ----------
// MV3 has no reliable browser-close event, so we approximate: when a tab to a
// blocklisted site closes, clear that site's cookies. URLs are tracked in
// session storage so the ephemeral worker can recover them.
chrome.tabs.onUpdated.addListener((tabId, _info, tab) => {
  if (tab && tab.url && /^https?:/.test(tab.url)) {
    chrome.storage.session.set({ ['tab_' + tabId]: tab.url });
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const key = 'tab_' + tabId;
  const data = await chrome.storage.session.get(key);
  const url = data[key];
  chrome.storage.session.remove(key);
  const s = await getSettings();
  if (!s.clearOnTabClose || !url) return;
  let host;
  try { host = new URL(url).hostname; } catch { return; }
  if (!isBlocked(host, s)) return;
  const cs = await chrome.cookies.getAll({ url });
  for (const c of cs) await removeCookie(c);
});

// ---------- messages (from options page) ----------
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === 'runCleanup') {
    runCleanup().then((removed) => sendResponse({ removed }));
    return true; // async response
  }
});
