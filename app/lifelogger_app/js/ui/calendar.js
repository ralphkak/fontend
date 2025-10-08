import { $, fmtDate, numToDisplay, firstFloatValue, hexWithAlpha } from '../utils.js';
import { getTypes, getEntries } from '../state.js';
import { openLogModal } from './log-modal.js';

let viewMode='month', refDate=new Date();

$('#todayBtn')?.addEventListener('click', ()=>{ refDate=new Date(); renderCalendar(); });
$('#prevBtn')?.addEventListener('click', ()=> shift(-1));
$('#nextBtn')?.addEventListener('click', ()=> shift(+1));
document.querySelectorAll('.view-tabs .btn').forEach(b=> b.addEventListener('click', ()=>{ viewMode=b.dataset.view; renderCalendar(); }));

function shift(n){ if(viewMode==='week'){ refDate.setDate(refDate.getDate()+n*7);} else if(viewMode==='month'){ refDate.setMonth(refDate.getMonth()+n);} else if(viewMode==='year'){ refDate.setFullYear(refDate.getFullYear()+n);} else { refDate.setDate(refDate.getDate()+n*7);} renderCalendar(); }
function startOfDayJS(d){ const x=new Date(d); x.setHours(0,0,0,0); return x; }

function addColoredBadge(container, color, text){
  const badge=document.createElement('div'); badge.className='pill';
  // hexWithAlpha provides a translucent background
  badge.style.borderColor = color; badge.style.background = hexWithAlpha(color, 0.2); badge.style.color = '#e9ecff';
  badge.textContent = text || ''; if(!text){ badge.style.width='14px'; badge.style.height='14px'; badge.style.padding='0'; badge.style.borderRadius='999px'; }
  container.appendChild(badge);
}

export function renderCalendar(){
  const cal=$('#calendar'); if(!cal) return; cal.innerHTML='';
  const entries=getEntries().slice().sort((a,b)=>a.at-b.at);
  const typesById=Object.fromEntries(getTypes().map(t=>[t.id,t]));

  if(viewMode==='list'){
    $('#calTitle').textContent='Recent (by day)';
    const grouped={}; entries.slice().reverse().forEach(e=>{ const k=startOfDayJS(e.at).toISOString(); (grouped[k]=grouped[k]||[]).push(e); });
    Object.entries(grouped).sort((a,b)=> new Date(b[0])-new Date(a[0])).slice(0,14).forEach(([k,list])=>{
      const day=document.createElement('div'); day.className='card'; day.style.background='transparent'; day.style.border='1px dashed var(--line)'; const d=new Date(k);
      const head=document.createElement('div'); head.style.marginBottom='6px'; head.innerHTML = '<strong>'+fmtDate(d)+'</strong>'; day.appendChild(head);
      list.sort((a,b)=>b.at-a.at).forEach(e=>{
        const t=typesById[e.typeId]; if(!t)return; const row=document.createElement('div'); row.className='entry';
        const left=document.createElement('div');
        const fv = firstFloatValue(t,e);
        addColoredBadge(left, t.color||'#7aa2ff', fv!==null? numToDisplay(fv):'');
        const time=document.createElement('span'); time.className='meta'; time.style.marginLeft='8px'; time.textContent = new Date(e.at).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});
        left.appendChild(time);
        const edit=document.createElement('button'); edit.className='btn small'; edit.textContent='Edit'; edit.onclick=()=> openLogModal({ mode:'edit', entry:e });
        row.appendChild(left); row.appendChild(edit); day.appendChild(row);
      });
      cal.appendChild(day);
    });
    return;
  }

  if(viewMode==='week'){
    const start=new Date(refDate); start.setDate(start.getDate()-((start.getDay()+6)%7));
    const end=new Date(start); end.setDate(end.getDate()+6);
    $('#calTitle').textContent=`${fmtDate(start)} – ${fmtDate(end)}`;
    const grid=document.createElement('div'); grid.className='cal-grid';
    ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(h=>{ const s=document.createElement('div'); s.style.textAlign='center'; s.style.fontSize='12px'; s.style.color='var(--muted)'; s.textContent=h; grid.appendChild(s); });
    for(let i=0;i<7;i++){
      const day=new Date(start); day.setDate(start.getDate()+i);
      const cell=document.createElement('div'); cell.className='cal-cell';
      const dn=document.createElement('div'); dn.className='d'; dn.textContent=day.getDate(); cell.appendChild(dn);
      entries.filter(e=>{ const ed=new Date(e.at); return ed>=startOfDayJS(day)&&ed<startOfDayJS(new Date(day.getFullYear(),day.getMonth(),day.getDate()+1)); }).forEach(e=>{
        const t=typesById[e.typeId]; if(!t)return; const fv=firstFloatValue(t,e);
        addColoredBadge(cell, t.color||'#7aa2ff', fv!==null? numToDisplay(fv):'');
      });
      grid.appendChild(cell);
    }
    cal.appendChild(grid); return;
  }

  if(viewMode==='month'){
    const y=refDate.getFullYear(), m=refDate.getMonth(); const first=new Date(y,m,1);
    const start=new Date(first); start.setDate(1-((first.getDay()+6)%7));
    const last=new Date(y,m+1,0);
    const finish=new Date(last); finish.setDate(last.getDate()+(7-((last.getDay()+6)%7)-1));
    $('#calTitle').textContent=`${first.toLocaleString(undefined,{month:'long'})} ${y}`;
    const grid=document.createElement('div'); grid.className='cal-grid';
    ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(h=>{ const s=document.createElement('div'); s.style.textAlign='center'; s.style.fontSize='12px'; s.style.color='var(--muted)'; s.textContent=h; grid.appendChild(s); });
    let d=new Date(start);
    while(d<=finish){
      const cell=document.createElement('div'); cell.className='cal-cell'; if(d.getMonth()!==m) cell.style.opacity='0.5';
      const dn=document.createElement('div'); dn.className='d'; dn.textContent=d.getDate(); cell.appendChild(dn);
      entries.filter(e=>{ const ed=new Date(e.at); return ed>=startOfDayJS(d)&&ed<startOfDayJS(new Date(d.getFullYear(),d.getMonth(),d.getDate()+1)); }).forEach(e=>{
        const t=typesById[e.typeId]; if(!t)return; const fv=firstFloatValue(t,e);
        addColoredBadge(cell, t.color||'#7aa2ff', fv!==null? numToDisplay(fv):'');
      });
      grid.appendChild(cell); d.setDate(d.getDate()+1);
    }
    cal.appendChild(grid); return;
  }

  if(viewMode==='year'){
    const y=refDate.getFullYear(); $('#calTitle').textContent=`Year ${y}`;
    const wrap=document.createElement('div'); wrap.style.display='grid'; wrap.style.gridTemplateColumns='repeat(3,1fr)'; wrap.style.gap='8px';
    for(let m=0;m<12;m++){
      const box=document.createElement('div'); box.className='card'; box.style.padding='8px';
      const head=document.createElement('div'); head.className='muted'; head.style.marginBottom='4px'; head.textContent=new Date(y,m,1).toLocaleString(undefined,{month:'long'}); box.appendChild(head);
      const grid=document.createElement('div'); grid.className='cal-grid';
      ['M','T','W','T','F','S','S'].forEach(h=>{ const s=document.createElement('div'); s.style.textAlign='center'; s.style.fontSize='11px'; s.style.color='var(--muted)'; s.textContent=h; grid.appendChild(s); });
      const first=new Date(y,m,1); const start=new Date(first); start.setDate(1-((first.getDay()+6)%7));
      const last=new Date(y,m+1,0); const finish=new Date(last); finish.setDate(last.getDate()+(7-((last.getDay()+6)%7)-1));
      let d=new Date(start);
      while(d<=finish){
        const cell=document.createElement('div'); cell.className='cal-cell'; cell.style.height='50px'; if(d.getMonth()!==m) cell.style.opacity='0.45';
        const dn=document.createElement('div'); dn.className='d'; dn.textContent=d.getDate(); dn.style.fontSize='10px'; cell.appendChild(dn);
        entries.filter(e=>{ const ed=new Date(e.at); return ed>=startOfDayJS(d)&&ed<startOfDayJS(new Date(d.getFullYear(),d.getMonth(),d.getDate()+1)); }).forEach(e=>{
          const t=typesById[e.typeId]; if(!t)return; const fv=firstFloatValue(t,e);
          addColoredBadge(cell, t.color||'#7aa2ff', fv!==null? numToDisplay(fv):'');
        });
        grid.appendChild(cell); d.setDate(d.getDate()+1);
      }
      box.appendChild(grid); wrap.appendChild(box);
    }
    cal.appendChild(wrap); return;
  }
}
