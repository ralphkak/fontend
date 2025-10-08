import { $ } from '../utils.js';
import { getTypes } from '../state.js';
import { isDriveHealthy } from './health.js';
import { openLogModal } from './log-modal.js';

const logButtons=$('#logButtons');

export function renderTypes(){
  const types=getTypes(); logButtons.innerHTML='';
  types.forEach(t=>{
    const b=document.createElement('button'); b.className='btn';
    b.textContent=t.name; b.style.borderColor=t.color; b.style.boxShadow=`0 0 0 1px inset ${t.color}55`;
    b.onclick=()=>openLogModal({ mode:'quick', type:t });
    b.disabled = !isDriveHealthy();
    logButtons.appendChild(b);
  });
}
