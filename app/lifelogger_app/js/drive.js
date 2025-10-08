import { $, store } from './utils.js';
import { getTypes, getEntries } from './state.js';
import { setSyncState, updateCountsTooltip } from './ui/status.js';
import { setAppEnabled } from './ui/health.js';

let accessToken = null, logFolderId = null;
let typesFileId = null, entriesFileId = null;
let syncTimer = null;

export function setToken(token){ accessToken = token; }
export function getToken(){ return accessToken; }

async function gapi(path, method='GET', body=null, params=null, headers={}){
  if(!accessToken) throw new Error('No access token');
  const url = new URL('https://www.googleapis.com/drive/v3/'+path);
  if(params) Object.entries(params).forEach(([k,v])=> url.searchParams.set(k,v));
  const r = await fetch(url.toString(), { method, headers: { Authorization:'Bearer '+accessToken, ...headers }, body });
  if(!r.ok){ const t = await r.text(); throw new Error('Drive error '+r.status+': '+t); }
  return r.json();
}

export async function ensureFolder(){
  setSyncState('loading','Locating Drive folder...');
  const q = "mimeType='application/vnd.google-apps.folder' and name='LogX' and trashed=false";
  const res = await gapi('files','GET',null,{ q, spaces:'drive', fields:'files(id,name)' });
  if(res.files && res.files.length>0){ logFolderId = res.files[0].id; }
  else {
    const meta = { name:'LogX', mimeType:'application/vnd.google-apps.folder' };
    const r = await fetch('https://www.googleapis.com/drive/v3/files', { method:'POST', headers:{ 'Authorization':'Bearer '+accessToken, 'Content-Type':'application/json' }, body: JSON.stringify(meta) });
    const j = await r.json(); logFolderId = j.id;
  }
  setSyncState('loading','Folder ready');
}

async function findFileByName(name){
  const q = `name='${name}' and '${logFolderId}' in parents and trashed=false`;
  const res = await gapi('files','GET',null,{ q, spaces:'drive', fields:'files(id,name,modifiedTime,mimeType)' });
  return res.files && res.files.length>0 ? res.files[0] : null;
}

export async function ensureFilesExist(){
  setSyncState('loading','Ensuring data files...');
  const need = ['types.json','entries.json'];
  for(const n of need){
    const f = await findFileByName(n);
    if(!f){
      const meta = { name:n, parents:[logFolderId], mimeType:'application/json' };
      const create = await fetch('https://www.googleapis.com/drive/v3/files', { method:'POST', headers:{ 'Authorization':'Bearer '+accessToken, 'Content-Type':'application/json' }, body: JSON.stringify(meta) });
      const j = await create.json();
      const id = j.id;
      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=media`, { method:'PATCH', headers:{ 'Authorization':'Bearer '+accessToken, 'Content-Type':'application/json' }, body: JSON.stringify([]) });
    }
  }
}

async function loadFileJSON(name){
  const f = await findFileByName(name);
  if(!f) return null;
  const contentRes = await fetch(`https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`, { headers:{ Authorization:'Bearer '+accessToken } });
  const txt = await contentRes.text();
  let data=null; try{ data = JSON.parse(txt||'[]'); } catch { data = []; }
  return { id:f.id, name:f.name, modifiedTime:f.modifiedTime, data };
}

async function saveFileJSON(name, data, existingId=null){
  let fileId = existingId;
  if(!fileId){
    const f = await findFileByName(name);
    if(f){ fileId = f.id; }
    else {
      const meta = { name, parents:[logFolderId], mimeType:'application/json' };
      const create = await fetch('https://www.googleapis.com/drive/v3/files', { method:'POST', headers:{ 'Authorization':'Bearer '+accessToken, 'Content-Type':'application/json' }, body: JSON.stringify(meta) });
      if(!create.ok){ throw new Error('Drive create failed'); }
      const j = await create.json(); fileId = j.id;
    }
  }
  const up = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, { method:'PATCH', headers:{ 'Authorization':'Bearer '+accessToken, 'Content-Type':'application/json' }, body: JSON.stringify(data) });
  if(!up.ok){ throw new Error('Drive content update failed'); }
  return fileId;
}

export async function loadFromDrive(){
  try{
    setSyncState('loading','Loading from Drive...');
    const types = await loadFileJSON('types.json');
    const entries = await loadFileJSON('entries.json');
    if(types){ typesFileId = types.id; store.set('logx_types_cache', types.data||[]); }
    if(entries){ entriesFileId = entries.id; store.set('logx_entries_cache', entries.data||[]); }
    setSyncState('ok','Loaded ✔'); updateCountsTooltip(getTypes(), getEntries());
  }catch(e){
    console.warn(e);
    setSyncState('error','Load failed (using cache)');
    updateCountsTooltip(getTypes(), getEntries());
  }
}

export function requestSync(){
  clearTimeout(syncTimer);
  syncTimer = setTimeout(()=> saveToDrive().catch(err=>{ console.warn(err); setSyncState('error','Save failed'); setAppEnabled(false, 'Save failed — likely disconnected'); }), 400);
}

export async function saveToDrive(){
  if(!accessToken || !logFolderId){ return; }
  setSyncState('loading','Saving...');
  const types = getTypes(); const entries = getEntries();
  try{
    typesFileId = await saveFileJSON('types.json', types, typesFileId);
    entriesFileId = await saveFileJSON('entries.json', entries, entriesFileId);
    setSyncState('ok','Up to date ✔'); updateCountsTooltip(types, entries);
  }catch(e){
    setSyncState('error','Save failed');
    setAppEnabled(false, 'Save failed — likely disconnected');
    throw e;
  }
}
