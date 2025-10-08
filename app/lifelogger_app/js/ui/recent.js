import { $, $$, fmtDateTime } from '../utils.js';
import { getTypes, getEntries, delEntry } from '../state.js';
import { openLogModal } from './log-modal.js';

export function renderRecent(){
  const holder=$('#recentList'); holder.innerHTML='';
  const types=getTypes(); const typesById=Object.fromEntries(types.map(t=>[t.id,t]));
  const entries=getEntries().slice().sort((a,b)=>b.at-a.at).slice(0,100);

  const usedTypeIds = new Set(entries.map(e=>e.typeId));
  let maxSlots = 0;
  types.forEach(t => { if(usedTypeIds.has(t.id)) maxSlots = Math.max(maxSlots, t.measurements.length||0); });

  const wrap=document.createElement('div'); wrap.className='table-wrap';
  const table=document.createElement('table');
  const thead=document.createElement('thead'); const trh=document.createElement('tr');
  ['Date','Type'].forEach(h=>{ const th=document.createElement('th'); th.textContent=h; trh.appendChild(th); });
  for(let i=0;i<maxSlots;i++){
    const th1=document.createElement('th'); th1.textContent = `measurement[${i}] type`;
    const th2=document.createElement('th'); th2.textContent = `measurement[${i}] value`;
    trh.appendChild(th1); trh.appendChild(th2);
  }
  const thA=document.createElement('th'); thA.textContent='Actions'; trh.appendChild(thA);
  thead.appendChild(trh); table.appendChild(thead);

  const tbody=document.createElement('tbody');
  entries.forEach(e=>{
    const t=typesById[e.typeId]; if(!t) return;
    const tr=document.createElement('tr');

    const tdDate=document.createElement('td'); tdDate.textContent = fmtDateTime(e.at); tr.appendChild(tdDate);

    const tdType=document.createElement('td');
    const sw=document.createElement('span'); sw.className='dot'; sw.style.verticalAlign='middle'; sw.style.marginRight='6px'; sw.style.background=t.color||'#7aa2ff'; sw.style.border='1px solid rgba(255,255,255,0.35)';
    tdType.appendChild(sw); tdType.appendChild(document.createTextNode(t.name));
    tr.appendChild(tdType);

    for(let i=0;i<maxSlots;i++){
      const tdName=document.createElement('td');
      const tdVal=document.createElement('td');
      const m = t.measurements[i];
      if(m){
        tdName.textContent = m.name;
        const v = e.values.hasOwnProperty(m.name) ? e.values[m.name] : '';
        tdVal.textContent = m.type==='float' && v!=='' ? (Number.isInteger(+v)? v : parseFloat(v).toFixed(2)) : (v ?? '');
      } else { tdName.textContent = ''; tdVal.textContent = ''; }
      tr.appendChild(tdName); tr.appendChild(tdVal);
    }

    const tdAct=document.createElement('td');
    const edit=document.createElement('button'); edit.className='btn small'; edit.textContent='Edit'; edit.onclick=()=> openLogModal({ mode:'edit', entry:e });
    const del=document.createElement('button'); del.className='btn small danger'; del.style.marginLeft='6px'; del.textContent='Delete'; del.onclick=()=>{ if(confirm('Delete this entry?')){ delEntry(e.id); renderRecent(); } };
    tdAct.appendChild(edit); tdAct.appendChild(del); tr.appendChild(tdAct);

    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
  holder.appendChild(wrap);
}
