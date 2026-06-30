// Cookie Editor Pro — popup logic. 100% local, no network calls.

const $ = (id) => document.getElementById(id);

let state = {
  scope: 'site',     // 'site' | 'all'
  tabUrl: '',
  cookies: [],       // currently loaded cookies
  filtered: [],
  editing: null,     // cookie being edited, or null for a new cookie
  protected: new Set(),
  collapsed: new Set() // domains currently collapsed
};

// ---------- helpers ----------

function protectedKey(c) {
  return `${c.domain}|${c.path}|${c.name}`;
}

function cookieUrl(c) {
  const protocol = c.secure ? 'https://' : 'http://';
  const host = c.domain && c.domain.startsWith('.') ? c.domain.slice(1) : c.domain;
  return protocol + host + (c.path || '/');
}

// Unique key including partition, so partitioned + unpartitioned twins don't collide.
function cookieKey(c) {
  return `${c.name}|${c.domain}|${c.path}|${c.partitionKey ? JSON.stringify(c.partitionKey) : ''}`;
}

// Build a chrome.cookies.remove() detail object, carrying partition + store.
function removeDetails(c) {
  const d = { url: cookieUrl(c), name: c.name };
  if (c.storeId) d.storeId = c.storeId;
  if (c.partitionKey) d.partitionKey = c.partitionKey;
  return d;
}

function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.add('hidden'), 1800);
}

function hostFromUrl(url) {
  try { return new URL(url).hostname; } catch { return ''; }
}

// ---------- loading ----------

async function loadProtected() {
  const data = await chrome.storage.local.get('protected');
  state.protected = new Set(data.protected || []);
}

async function saveProtected() {
  await chrome.storage.local.set({ protected: [...state.protected] });
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Fetch cookies for the current scope, INCLUDING partitioned ("isolated") cookies.
// chrome.cookies.getAll() skips partitioned cookies unless partitionKey is given,
// so we explicitly pull those too and merge (deduped).
async function fetchScopeCookies() {
  const out = [];
  const seen = new Set();
  const add = (arr) => {
    for (const c of arr || []) {
      const k = cookieKey(c);
      if (!seen.has(k)) { seen.add(k); out.push(c); }
    }
  };

  if (state.scope === 'site' && state.tabUrl) {
    let origin = '';
    try { origin = new URL(state.tabUrl).origin; } catch {}
    add(await chrome.cookies.getAll({ url: state.tabUrl }));
    if (origin) {
      try { add(await chrome.cookies.getAll({ url: state.tabUrl, partitionKey: { topLevelSite: origin } })); } catch {}
    }
  } else {
    add(await chrome.cookies.getAll({}));
    // Best-effort partitioned sweep: probe each known site as a top-level partition.
    const sites = new Set();
    for (const c of out.slice()) sites.add('https://' + c.domain.replace(/^\./, ''));
    const probes = [...sites].map((site) =>
      chrome.cookies.getAll({ partitionKey: { topLevelSite: site } }).catch(() => []));
    (await Promise.all(probes)).forEach(add);
  }
  return out;
}

async function loadCookies() {
  const cookies = await fetchScopeCookies();
  cookies.sort((a, b) => a.name.localeCompare(b.name));
  state.cookies = cookies;
  // Default: collapse domains in "All" (many domains), expand in single-site view.
  const domains = new Set(cookies.map((c) => c.domain));
  state.collapsed = state.scope === 'all' ? domains : new Set();
  applyFilter();
}

function applyFilter() {
  const q = $('search').value.trim().toLowerCase();
  state.filtered = !q
    ? state.cookies
    : state.cookies.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        (c.value || '').toLowerCase().includes(q) ||
        c.domain.toLowerCase().includes(q));
  renderList();
}

// ---------- rendering ----------

function buildCookieRow(c) {
  const row = document.createElement('div');
  row.className = 'cookie-row';

  const isLocked = state.protected.has(protectedKey(c));
  const partTag = c.partitionKey ? '<span class="part-tag">🧩 isolated</span>' : '';
  const main = document.createElement('div');
  main.className = 'cookie-main';
  main.innerHTML = `
    <div class="cookie-name">${escapeHtml(c.name)}${isLocked ? '<span class="lock">🔒</span>' : ''}</div>
    <div class="cookie-value">${escapeHtml(c.value || '(empty)')}</div>
    <div class="cookie-domain">${escapeHtml(c.domain)}${escapeHtml(c.path)}${partTag}</div>`;

  const chev = document.createElement('span');
  chev.className = 'chev';
  chev.textContent = '›';

  row.appendChild(main);
  row.appendChild(chev);
  row.addEventListener('click', () => openEdit(c));
  return row;
}

function renderList() {
  const list = $('cookieList');
  $('count').textContent = state.filtered.length;
  list.innerHTML = '';

  if (!state.filtered.length) {
    const div = document.createElement('div');
    div.className = 'empty';
    div.textContent = state.cookies.length ? 'No cookies match your search.' : 'No cookies found for this scope.';
    list.appendChild(div);
    return;
  }

  // While searching, expand everything so matches are always visible.
  const searching = $('search').value.trim().length > 0;

  // Group cookies by domain.
  const groups = new Map();
  for (const c of state.filtered) {
    if (!groups.has(c.domain)) groups.set(c.domain, []);
    groups.get(c.domain).push(c);
  }
  const domains = [...groups.keys()].sort((a, b) =>
    a.replace(/^\./, '').localeCompare(b.replace(/^\./, '')));

  for (const domain of domains) {
    const items = groups.get(domain);
    const isCollapsed = !searching && state.collapsed.has(domain);

    const header = document.createElement('div');
    header.className = 'group-header' + (isCollapsed ? ' collapsed' : '');
    header.innerHTML = `
      <span class="group-twisty">▾</span>
      <span class="group-domain">${escapeHtml(domain)}</span>
      <span class="group-count">${items.length}</span>`;
    header.addEventListener('click', () => {
      if (state.collapsed.has(domain)) state.collapsed.delete(domain);
      else state.collapsed.add(domain);
      renderList();
    });
    list.appendChild(header);

    if (!isCollapsed) {
      for (const c of items) list.appendChild(buildCookieRow(c));
    }
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]
  ));
}

// ---------- edit view ----------

function showView(which) {
  $('listView').classList.toggle('hidden', which !== 'list');
  $('editView').classList.toggle('hidden', which !== 'edit');
}

function openEdit(cookie) {
  state.editing = cookie; // null => new
  const c = cookie || {
    name: '', value: '', domain: hostFromUrl(state.tabUrl), path: '/',
    secure: false, httpOnly: false, hostOnly: false, sameSite: 'unspecified', session: true
  };

  $('editTitle').textContent = cookie
    ? (cookie.partitionKey ? 'Edit cookie (isolated 🧩)' : 'Edit cookie')
    : 'Add cookie';
  $('f-name').value = c.name;
  $('f-value').value = c.value || '';
  $('f-domain').value = c.domain || '';
  $('f-path').value = c.path || '/';
  $('f-secure').checked = !!c.secure;
  $('f-httponly').checked = !!c.httpOnly;
  $('f-hostonly').checked = !!c.hostOnly;
  $('f-samesite').value = c.sameSite || 'unspecified';

  if (c.session || !c.expirationDate) {
    $('f-exptype').value = 'session';
    $('f-expdate-wrap').classList.add('hidden');
  } else {
    $('f-exptype').value = 'date';
    $('f-expdate-wrap').classList.remove('hidden');
    $('f-expdate').value = toLocalDatetime(c.expirationDate);
  }

  $('protectBtn').textContent = cookie && state.protected.has(protectedKey(cookie)) ? '🔓 Unprotect' : '🔒 Protect';
  $('deleteBtn').style.display = cookie ? '' : 'none';
  showView('edit');
}

function toLocalDatetime(epochSeconds) {
  const d = new Date(epochSeconds * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function saveCookie(e) {
  e.preventDefault();
  const domain = $('f-domain').value.trim();
  const path = $('f-path').value.trim() || '/';
  const secure = $('f-secure').checked;
  const hostOnly = $('f-hostonly').checked;

  const details = {
    url: cookieUrl({ domain, path, secure }),
    name: $('f-name').value.trim(),
    value: $('f-value').value,
    path,
    secure,
    httpOnly: $('f-httponly').checked,
    sameSite: $('f-samesite').value
  };
  // Host-only cookies must NOT carry a domain attribute.
  if (!hostOnly) details.domain = domain;
  // Preserve the partition for isolated cookies.
  if (state.editing && state.editing.partitionKey) details.partitionKey = state.editing.partitionKey;

  if ($('f-exptype').value === 'date' && $('f-expdate').value) {
    details.expirationDate = new Date($('f-expdate').value).getTime() / 1000;
  }

  // If renaming/redomaining an existing cookie, remove the old one first.
  if (state.editing && (state.editing.name !== details.name ||
      state.editing.domain !== domain || state.editing.path !== path)) {
    await chrome.cookies.remove(removeDetails(state.editing));
  }

  try {
    const result = await chrome.cookies.set(details);
    if (!result) throw new Error('Cookie was rejected (check domain/secure/SameSite).');
    toast('Saved');
    showView('list');
    await loadCookies();
  } catch (err) {
    toast('Error: ' + err.message);
  }
}

async function deleteCookie() {
  const c = state.editing;
  if (!c) return;
  if (state.protected.has(protectedKey(c))) {
    toast('This cookie is protected. Unprotect it first.');
    return;
  }
  await chrome.cookies.remove(removeDetails(c));
  toast('Deleted');
  showView('list');
  await loadCookies();
}

async function toggleProtect() {
  const c = state.editing;
  if (!c) return;
  const key = protectedKey(c);
  if (state.protected.has(key)) {
    state.protected.delete(key);
    $('protectBtn').textContent = '🔒 Protect';
    toast('Protection removed');
  } else {
    state.protected.add(key);
    $('protectBtn').textContent = '🔓 Unprotect';
    toast('Cookie protected');
  }
  await saveProtected();
}

// ---------- export / import ----------

function exportCookies() {
  const data = JSON.stringify(state.cookies, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const label = state.scope === 'site' ? hostFromUrl(state.tabUrl) : 'all';
  a.href = url;
  a.download = `cookies-${label}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast(`Exported ${state.cookies.length} cookies`);
}

async function importCookies(file) {
  try {
    const text = await file.text();
    const items = JSON.parse(text);
    if (!Array.isArray(items)) throw new Error('File is not a cookie array.');
    let ok = 0;
    for (const c of items) {
      const details = {
        url: cookieUrl(c),
        name: c.name,
        value: c.value,
        path: c.path || '/',
        secure: !!c.secure,
        httpOnly: !!c.httpOnly,
        sameSite: c.sameSite || 'unspecified'
      };
      if (!c.hostOnly && c.domain) details.domain = c.domain;
      if (c.partitionKey) details.partitionKey = c.partitionKey;
      if (!c.session && c.expirationDate) details.expirationDate = c.expirationDate;
      try { if (await chrome.cookies.set(details)) ok++; } catch (_) {}
    }
    toast(`Imported ${ok}/${items.length} cookies`);
    await loadCookies();
  } catch (err) {
    toast('Import failed: ' + err.message);
  }
}

async function deleteAll() {
  const target = state.filtered;
  const skipped = [];
  let removed = 0;
  for (const c of target) {
    if (state.protected.has(protectedKey(c))) { skipped.push(c.name); continue; }
    await chrome.cookies.remove(removeDetails(c));
    removed++;
  }
  toast(`Deleted ${removed}${skipped.length ? `, kept ${skipped.length} protected` : ''}`);
  await loadCookies();
}

// ---------- init ----------

async function init() {
  await loadProtected();
  const tab = await getActiveTab();
  state.tabUrl = tab && tab.url && /^https?:/.test(tab.url) ? tab.url : '';
  $('siteLabel').textContent = state.tabUrl ? hostFromUrl(state.tabUrl) : 'No site (showing all)';
  if (!state.tabUrl) state.scope = 'all';
  syncScopeButtons();
  await loadCookies();

  $('search').addEventListener('input', applyFilter);
  $('scopeSite').addEventListener('click', () => setScope('site'));
  $('scopeAll').addEventListener('click', () => setScope('all'));
  $('settingsBtn').addEventListener('click', () => chrome.runtime.openOptionsPage());
  $('addBtn').addEventListener('click', () => openEdit(null));
  $('backBtn').addEventListener('click', () => showView('list'));
  $('editForm').addEventListener('submit', saveCookie);
  $('deleteBtn').addEventListener('click', deleteCookie);
  $('protectBtn').addEventListener('click', toggleProtect);
  $('exportBtn').addEventListener('click', exportCookies);
  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', (e) => {
    if (e.target.files[0]) importCookies(e.target.files[0]);
    e.target.value = '';
  });
  $('deleteAllBtn').addEventListener('click', deleteAll);
  $('f-exptype').addEventListener('change', (e) => {
    $('f-expdate-wrap').classList.toggle('hidden', e.target.value !== 'date');
  });
}

function setScope(scope) {
  if (!state.tabUrl && scope === 'site') { toast('No active site'); return; }
  state.scope = scope;
  syncScopeButtons();
  loadCookies();
}

function syncScopeButtons() {
  $('scopeSite').classList.toggle('active', state.scope === 'site');
  $('scopeAll').classList.toggle('active', state.scope === 'all');
}

init();
