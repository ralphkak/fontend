import { $, $$ } from '../utils.js';
import { getTypes, getEntries } from '../state.js';

const chartCanvas = $('#chart'); const ctx = chartCanvas.getContext('2d');

function getColorFor(typeId, fallbackIndex){
  const t = getTypes().find(t=>t.id===typeId);
  return t?.color || `hsl(${(fallbackIndex*57)%360} 80% 65%)`;
}

export function renderSelectors(){
  const box=$('#selectors'); box.innerHTML=''; const types=getTypes();
  types.forEach((t,i)=>{
    const wrap=document.createElement('div'); wrap.className='checkbox-group';
    const label=document.createElement('label'); label.style.display='flex'; label.style.alignItems='center'; label.style.gap='6px';
    const dot=document.createElement('span'); dot.className='dot'; dot.style.background=t.color||'#7aa2ff'; dot.style.border='1px solid rgba(255,255,255,0.35)';
    const cb=document.createElement('input'); cb.type='checkbox'; cb.dataset.type=t.id; cb.checked=(i===0);
    label.appendChild(cb); label.appendChild(dot); label.appendChild(document.createTextNode(t.name));
    wrap.appendChild(label);
    const sub=document.createElement('div'); sub.className='measure-sub';
    t.measurements.forEach((m,j)=>{ const mcb=document.createElement('label'); mcb.style.display='flex'; mcb.style.alignItems='center'; mcb.style.gap='6px';
      const c=document.createElement('input'); c.type='checkbox'; c.dataset.type=t.id; c.dataset.measure=m.name; c.checked=(j===0&&i===0);
      mcb.appendChild(c); mcb.appendChild(document.createTextNode(`${m.name}${m.unit?` (${m.unit})`:''}`)); sub.appendChild(mcb);
    });
    wrap.appendChild(sub); box.appendChild(wrap);
  });
  box.onchange=()=> drawChart();
}

function getSelectedDatasets(){
  const typesById=Object.fromEntries(getTypes().map(t=>[t.id,t]));
  const entries=getEntries().slice().sort((a,b)=>a.at-b.at);
  const ds=[];
  $$('#selectors input[type="checkbox"][data-measure]').forEach(c=>{
    if(!c.checked) return; const typeId=c.dataset.type; const meas=c.dataset.measure;
    const color=getColorFor(typeId, ds.length);
    const points=entries.filter(e=>e.typeId===typeId && e.values.hasOwnProperty(meas)).map(e=>({x: new Date(e.at).getTime(), y: parseFloat(e.values[meas])})).filter(p=>!isNaN(p.y)).sort((a,b)=>a.x-b.x);
    ds.push({label:`${typesById[typeId]?.name||'?'} — ${meas}`, color, points});
  });
  return ds;
}

export function drawChart(){
  const cumulative=$('#cumulative').checked; const showPoints=$('#showPoints').checked;
  const w=chartCanvas.width=chartCanvas.clientWidth*devicePixelRatio; const h=chartCanvas.height=chartCanvas.clientHeight*devicePixelRatio;
  ctx.clearRect(0,0,w,h); ctx.font=`${12*devicePixelRatio}px system-ui, Inter, Arial`; ctx.textBaseline='top';
  const ds=getSelectedDatasets(); if(ds.length===0){ ctx.fillStyle='#9ca3c9'; ctx.fillText('Select a log type & measurement below to plot.', 10, 10); return; }
  const allPts=ds.flatMap(d=>d.points); const minX=Math.min(...allPts.map(p=>p.x)); const maxX=Math.max(...allPts.map(p=>p.x)); let minY=0; let maxY=Math.max(...allPts.map(p=>p.y));
  const transformed=ds.map(d=>{ if(!cumulative) return {...d, cum:d.points}; let acc=0; const cum=d.points.map(p=>({x:p.x, y:(acc+=p.y)})); return {...d, cum}; });
  if(cumulative){ maxY=Math.max(...transformed.flatMap(d=>d.cum.map(p=>p.y))); }
  const pad={l:60*devicePixelRatio,r:10*devicePixelRatio,t:10*devicePixelRatio,b:24*devicePixelRatio};
  const fx=x=> pad.l + ((x-minX)/Math.max(1,(maxX-minX||1))) * (w-pad.l-pad.r);
  const fy=y=> h-pad.b - ((y-minY)/Math.max(1,(maxY-minY||1))) * (h-pad.t-pad.b);
  ctx.strokeStyle='rgba(255,255,255,0.25)'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(pad.l,pad.t); ctx.lineTo(pad.l,h-pad.b); ctx.lineTo(w-pad.r,h-pad.b); ctx.stroke();
  const ticks=4; for(let i=0;i<=ticks;i++){ const y=minY + (i*(maxY-minY)/ticks); const yy=fy(y); ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.moveTo(pad.l,yy); ctx.lineTo(w-pad.r,yy); ctx.stroke(); ctx.fillStyle='#9ca3c9'; ctx.fillText(y.toFixed(0), 6*devicePixelRatio, yy-6*devicePixelRatio); }
  ctx.fillStyle='#9ca3c9'; ctx.fillText(new Date(minX).toLocaleDateString(), pad.l, h-pad.b+4*devicePixelRatio); ctx.fillText(new Date(maxX).toLocaleDateString(), w-pad.r-80*devicePixelRatio, h-pad.b+4*devicePixelRatio);
  transformed.forEach((d,i)=>{ const pts=cumulative?d.cum:d.points; if(pts.length===0) return; ctx.strokeStyle=d.color; ctx.lineWidth=2*devicePixelRatio; ctx.beginPath(); ctx.moveTo(fx(pts[0].x), fy(pts[0].y)); for(let k=1;k<pts.length;k++){ ctx.lineTo(fx(pts[k].x), fy(pts[k].y)); } ctx.stroke(); if(showPoints){ ctx.fillStyle=d.color; pts.forEach(p=>{ ctx.beginPath(); ctx.arc(fx(p.x), fy(p.y), 3*devicePixelRatio, 0, Math.PI*2); ctx.fill(); }); } ctx.fillStyle=d.color; ctx.fillRect(pad.l+10*devicePixelRatio, pad.t+16*devicePixelRatio*i, 10*devicePixelRatio, 10*devicePixelRatio); ctx.fillStyle='#dfe3ff'; ctx.fillText(d.label, pad.l+24*devicePixelRatio, pad.t+16*devicePixelRatio*i-2*devicePixelRatio); });
}
