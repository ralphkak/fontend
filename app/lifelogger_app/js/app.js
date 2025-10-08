import { $, $$ } from './utils.js';
import { setSaver } from './state.js';
import { setupAuth, afterSignInUI } from './auth.js';
import { requestSync, getToken } from './drive.js';
import { setAccessTokenRef, checkDriveHealth } from './ui/health.js';
import { renderAll } from './ui/render.js';
import { openTypeModal, openManageModal } from './ui/type-modal.js';
import { openLogModal } from './ui/log-modal.js';

setSaver(()=> requestSync());
setAccessTokenRef(()=> getToken());

$('#addTypeBtn').onclick=()=> openTypeModal(null);
$('#manageTypesBtn').onclick=()=> openManageModal();
$('#manualBtn').onclick=()=> openLogModal({ mode:'manual' });

setupAuth(async ()=>{
  await afterSignInUI();
  renderAll();
  checkDriveHealth();
  if('serviceWorker' in navigator){ window.addEventListener('load', ()=> navigator.serviceWorker.register('./js/pwa/sw.js')); }
}, ()=>{
  location.reload();
});
