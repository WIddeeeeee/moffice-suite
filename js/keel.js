// Keel cloud database + login for MOffice.
// SECURITY: the API key is NEVER in this repo. It is typed in the Cloud tab
// and stored only in this browser's localStorage on the user's own device.
// Base URL default is the one Mason supplied for his Keel project.
// Contract tested 2026-10-30: GET /items currently returns 404 on that host,
// so every call shows its real HTTP status and falls back to local data.
const KEEL_DEFAULT_BASE = 'https://api.keel.app/v1/moofice';
function keelBase(){ return (localStorage.getItem('moffice-keel-base') || KEEL_DEFAULT_BASE).replace(/\/+$/,''); }
function keelKey(){ return localStorage.getItem('moffice-keel-key') || ''; }
async function keelCall(method, path, body){
  const url = keelBase() + path;
  const headers = { 'Content-Type': 'application/json' };
  if (keelKey()) headers['Authorization'] = 'Bearer ' + keelKey();
  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data = null; try { data = JSON.parse(text); } catch(e) { data = text; }
  return { ok: res.ok, status: res.status, data };
}
async function keelList(){ return keelCall('GET', '/items'); }
async function keelCreate(item){ return keelCall('POST', '/items', item); }
async function keelDelete(id){ return keelCall('DELETE', '/items/' + encodeURIComponent(id)); }
function keelItemsArray(result){
  if (Array.isArray(result.data)) return result.data;
  if (result.data && Array.isArray(result.data.items)) return result.data.items;
  if (result.data && Array.isArray(result.data.data)) return result.data.data;
  return [];
}
document.addEventListener('DOMContentLoaded', ()=>{
  const baseEl = document.getElementById('keelBase'); if (!baseEl) return;
  baseEl.value = keelBase();
  const keyEl = document.getElementById('keelKey');
  if (keelKey()) keyEl.placeholder = 'Key saved in this browser (hidden)';
  const userEl = document.getElementById('keelUser');
  userEl.value = localStorage.getItem('moffice-user') || '';
  const statusEl = document.getElementById('keelStatus');
  const setStatus = (msg)=>{ statusEl.textContent = msg; };
  const saveSettings = ()=>{ localStorage.setItem('moffice-keel-base', baseEl.value.trim() || KEEL_DEFAULT_BASE); if (keyEl.value) localStorage.setItem('moffice-keel-key', keyEl.value.trim()); localStorage.setItem('moffice-user', userEl.value.trim()); };
  document.getElementById('keelTestBtn').onclick = async ()=>{ saveSettings(); setStatus('Testing…');
    try { const r = await keelList(); setStatus('GET /items → HTTP ' + r.status + (r.ok ? ' — connected.' : ' — Keel did not return a list. Your work stays saved locally until the endpoint answers.')); renderKeelList(r); }
    catch(e){ setStatus('Connection failed: ' + e.message + ' — working locally.'); } };
  document.getElementById('keelLoginBtn').onclick = async ()=>{ saveSettings();
    const user = userEl.value.trim(); if (!user) { setStatus('Type a username first.'); return; }
    try { const r = await keelList(); const items = keelItemsArray(r);
      const found = items.find(x => (x.username === user) || (x.title === user) || (x.name === user));
      setStatus(found ? 'Signed in as ' + user + ' (found in Keel).' : 'Signed in as ' + user + ' locally — Keel returned HTTP ' + r.status + ', so no cloud account was found to check against.');
    } catch(e){ setStatus('Signed in as ' + user + ' locally — Keel unreachable right now.'); }
    localStorage.setItem('moffice-session', user); document.getElementById('keelSession').textContent = 'Signed in as: ' + user; };
  document.getElementById('keelLogoutBtn').onclick = ()=>{ localStorage.removeItem('moffice-session'); document.getElementById('keelSession').textContent = 'Not signed in'; setStatus('Signed out locally.'); };
  const savedSession = localStorage.getItem('moffice-session'); if (savedSession) document.getElementById('keelSession').textContent = 'Signed in as: ' + savedSession;
  document.getElementById('keelSaveBtn').onclick = async ()=>{ saveSettings(); setStatus('Saving to Keel…');
    const project = { title: document.getElementById('docTitle').value || 'MOffice project', type: 'moffice-project', owner: userEl.value.trim() || 'local', doc: document.getElementById('editor').innerHTML, sheet: typeof sheetData !== 'undefined' ? sheetData : [], video: { overlay: document.getElementById('overlayText').value }, savedAt: new Date().toISOString() };
    try { const r = await keelCreate(project); setStatus(r.ok ? 'Saved to Keel (HTTP ' + r.status + ').' : 'Keel save failed: HTTP ' + r.status + ' — project is still saved locally (Save Project, top right).'); }
    catch(e){ setStatus('Keel save failed: ' + e.message + ' — project is still saved locally.'); } };
  document.getElementById('keelLoadBtn').onclick = async ()=>{ saveSettings(); setStatus('Loading from Keel…');
    try { const r = await keelList(); renderKeelList(r); setStatus(r.ok ? 'Loaded ' + keelItemsArray(r).length + ' item(s) from Keel.' : 'Keel load failed: HTTP ' + r.status + '.'); }
    catch(e){ setStatus('Keel load failed: ' + e.message); } };
  function renderKeelList(r){
    const list = document.getElementById('keelList'); const items = keelItemsArray(r);
    if (!items.length) { list.innerHTML = '<p>No items returned (HTTP ' + r.status + ').</p>'; return; }
    list.innerHTML = items.map((it, i)=>{
      const id = it.id || it._id || i; const title = it.title || it.name || ('Item ' + id);
      return '<div class="keel-item"><b>' + String(title).replace(/</g,'&lt;') + '</b> <span>(' + String(it.type || 'item') + ')</span> ' +
        '<button data-load="' + i + '">Open</button> <button data-del="' + encodeURIComponent(id) + '">Delete</button></div>';
    }).join('');
    list.querySelectorAll('[data-load]').forEach(b=>b.onclick=()=>{ const it = items[parseInt(b.dataset.load)];
      if (it.doc) document.getElementById('editor').innerHTML = it.doc;
      if (it.title) document.getElementById('docTitle').value = it.title;
      if (it.sheet) { sheetData = it.sheet; renderSheet(); }
      setStatus('Opened item from Keel.'); });
    list.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{ const r2 = await keelDelete(decodeURIComponent(b.dataset.del)); setStatus(r2.ok ? 'Deleted from Keel.' : 'Delete failed: HTTP ' + r2.status + '.'); });
  }
});
