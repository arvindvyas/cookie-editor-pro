// Cookie Editor Pro — options page logic.

const $ = (id) => document.getElementById(id);

const DEFAULTS = {
  blocklist: [], allowlist: [],
  autoDeleteBlocked: true, clearOnStartup: false, clearOnTabClose: false
};

function linesToList(text) {
  return text.split('\n').map((s) => s.trim()).filter(Boolean);
}

function validatePatterns(list) {
  const bad = [];
  for (const p of list) {
    const rx = p.match(/^\/(.*)\/([a-z]*)$/i);
    if (rx) { try { new RegExp(rx[1], rx[2]); } catch { bad.push(p); } }
  }
  return bad;
}

async function load() {
  const { settings } = await chrome.storage.local.get('settings');
  const s = Object.assign({}, DEFAULTS, settings || {});
  $('blocklist').value = s.blocklist.join('\n');
  $('allowlist').value = s.allowlist.join('\n');
  $('autoDeleteBlocked').checked = s.autoDeleteBlocked;
  $('clearOnStartup').checked = s.clearOnStartup;
  $('clearOnTabClose').checked = s.clearOnTabClose;
}

function status(msg, ok = true) {
  const el = $('status');
  el.textContent = msg;
  el.style.color = ok ? '#1aa860' : '#e04b4b';
  clearTimeout(status._t);
  status._t = setTimeout(() => { el.textContent = ''; }, 3000);
}

async function save() {
  const blocklist = linesToList($('blocklist').value);
  const allowlist = linesToList($('allowlist').value);
  const bad = [...validatePatterns(blocklist), ...validatePatterns(allowlist)];
  if (bad.length) { status('Invalid regex: ' + bad.join(', '), false); return; }

  const settings = {
    blocklist, allowlist,
    autoDeleteBlocked: $('autoDeleteBlocked').checked,
    clearOnStartup: $('clearOnStartup').checked,
    clearOnTabClose: $('clearOnTabClose').checked
  };
  await chrome.storage.local.set({ settings });
  status('Saved ✓');
}

function cleanNow() {
  status('Cleaning…');
  chrome.runtime.sendMessage({ type: 'runCleanup' }, (resp) => {
    if (chrome.runtime.lastError) { status('Error: ' + chrome.runtime.lastError.message, false); return; }
    status(`Removed ${resp ? resp.removed : 0} block-listed cookies ✓`);
  });
}

$('save').addEventListener('click', save);
$('cleanNow').addEventListener('click', cleanNow);
load();
