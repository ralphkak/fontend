import { $, store, initialsFromName } from './utils.js';
import { KEYS } from './state.js';
import { GOOGLE_CLIENT_ID, DRIVE_SCOPE } from './config.js';
import { setToken, getToken, ensureFolder, ensureFilesExist, loadFromDrive } from './drive.js';
import { startDriveMonitor, checkDriveHealth } from './ui/health.js';

let tokenClient = null;
let remember = false;
let onSignedIn = async ()=>{};
let onSignedOut = ()=>{};

export function setupAuth(_onSignedIn, _onSignedOut){
  onSignedIn = _onSignedIn; onSignedOut = _onSignedOut;
  window.addEventListener('load', ()=>{
    if(window.google && google.accounts){
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID, scope: DRIVE_SCOPE,
        callback: async (token) => {
          setToken(token.access_token);
          store.set(KEYS.SESSION, { remember, accessToken: token.access_token, ts: Date.now() });
          await onSignedIn();
        }
      });
      bindUI();
      bootFromSession();
    }
  });
}

function bindUI(){
  $('#googleBtn').addEventListener('click', ()=>{ remember = $('#remember').checked; tokenClient.requestAccessToken({ prompt: 'consent' }); });
  $('#logoutBtn').addEventListener('click', ()=>{ setToken(null); store.set(KEYS.SESSION, null); location.reload(); });
  startDriveMonitor(()=> tokenClient.requestAccessToken({ prompt: '' }));
}

function bootFromSession(){
  const sess = store.get(KEYS.SESSION, null);
  if(sess && sess.accessToken){
    setToken(sess.accessToken); remember=!!sess.remember; onSignedIn();
  } else {
    checkDriveHealth();
  }
}

export async function afterSignInUI(){
  $('#section-login').classList.add('hidden');
  ['section-log','section-cal','section-chart','section-quick'].forEach(id=> $('#'+id).classList.remove('hidden'));
  $('#userPanel').classList.remove('hidden');
  $('#saveTag').classList.toggle('hidden', !remember);
  try{
    const r=await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers:{ Authorization: 'Bearer ' + getToken() } });
    const info = await r.json();
    $('#avatar').textContent = initialsFromName(info?.name, info?.email);
    $('#username').textContent = info?.email || 'Signed in';
  }catch(e){}
  await ensureFolder(); await ensureFilesExist(); await loadFromDrive();
}

window.addEventListener("focus", () => {
  if (!getToken() && tokenClient) {
    tokenClient.requestAccessToken({ prompt: "" });
  }
});