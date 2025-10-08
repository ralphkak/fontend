import { $, $$ } from '../utils.js';
import { setSyncState } from './status.js';

let accessTokenRef = null;
export function setAccessTokenRef(getter){ accessTokenRef = getter; }

let driveHealthy = true;
export function isDriveHealthy(){ return driveHealthy; }

export function setAppEnabled(enabled, reason=''){
  driveHealthy = !!enabled;
  document.body.classList.toggle('app-disabled', !enabled);
  $('#offlineMask').style.display = enabled ? 'none' : 'flex';
  $('#offlineReason').textContent = reason || '';
  if(enabled){
    if(!$('#syncBadge').classList.contains('status-error')) setSyncState('ok','Up to date ✔');
  }else{
    setSyncState('error','Disconnected from Drive');
  }
  ['#addTypeBtn','#manageTypesBtn','#manualBtn'].forEach(sel => { const el=$(sel); if(el) el.disabled=!enabled; });
  $$('#logButtons .btn').forEach(b => b.disabled = !enabled);
  $$('#recentList .btn').forEach(b => { if(b.id!=='retryBtn' && b.id!=='reauthBtn') b.disabled = !enabled; });
}

async function pingDrive(){
  const accessToken = accessTokenRef ? accessTokenRef() : null;
  if(!accessToken) return { ok:false, reason:'No access token' };
  try{
    const resp = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=1&spaces=drive&fields=files(id)', { headers:{ Authorization:'Bearer '+accessToken } });
    if(resp.status === 401 || resp.status === 403){
      return { ok:false, reason:'Unauthorized' };
    }
    if(!resp.ok){ return { ok:false, reason:'Drive ping failed: '+resp.status }; }
    return { ok:true };
  }catch(e){
    return { ok:false, reason:'Network error' };
  }
}

export async function checkDriveHealth(){
  if(!navigator.onLine){
    setAppEnabled(false, 'Browser offline');
    return;
  }
  const r = await pingDrive();
  if(r.ok){ setAppEnabled(true); }
  else { setAppEnabled(false, r.reason); }
}

const DRIVE_HEARTBEAT_MS = 15000;
export function startDriveMonitor(tokenRefresh){
  window.addEventListener('online', checkDriveHealth);
  window.addEventListener('offline', ()=> setAppEnabled(false, 'Browser offline'));
  setInterval(checkDriveHealth, DRIVE_HEARTBEAT_MS);
  $('#retryBtn').addEventListener('click', checkDriveHealth);
  $('#reauthBtn').addEventListener('click', ()=> {
    if(typeof tokenRefresh === 'function'){ tokenRefresh(); }
    setTimeout(checkDriveHealth, 1500);
  });
}

export function ensureWritable(){
  if(!driveHealthy){
    alert('Google Drive is disconnected. Please reconnect before making changes.');
    return false;
  }
  return true;
}
