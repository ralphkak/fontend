import { $, $$, toLocalDTValue, fromLocalDTValue } from '../utils.js';
import { getTypes, addEntry, updateEntry } from '../state.js';
import { ensureWritable } from './health.js';

function buildFields(type, entry, container){
  container.innerHTML='';
  if(!type){ container.innerHTML = '<div class="muted">No types yet. Create one first.</div>'; return; }
  type.measurements.forEach((m,i)=>{
    const wrap=document.createElement('div');
    const lab=document.createElement('label');
    lab.textContent = m.name + (m.unit?` (${m.unit})`:'') + ((m.default!==undefined && m.default!=='') ? ` — default: ${m.default}`:'');
    const inp=document.createElement('input'); inp.type = m.type==='float' ? 'number' : 'text'; if(m.type==='float') inp.step='any'; inp.id='m_'+i;
    if(entry){ const v=entry.values[m.name]; if(v!==undefined) inp.value=v; }
    wrap.appendChild(lab); container.appendChild(wrap); container.appendChild(inp);
  });
}

export function openLogModal(opts){
  const dlg=$('#logModal'); const title=$('#logTitle'); const metaWrap=$('#logMeta'); const dtInp=$('#entryDateTime'); const typeWrap=$('#typeSelectWrap'); const typeSel=$('#typeSelect'); const fields=$('#logFields');
  fields.innerHTML=''; typeSel.innerHTML='';
  let type = opts.type || null;

  if(opts.mode === 'quick'){
    title.textContent = 'Log: ' + type.name;
    metaWrap.classList.add('hidden'); typeWrap.classList.add('hidden');
    buildFields(type, null, fields);
    $('#logIt').onclick = ()=> saveFromModal({ mode:'quick', type, dt:null, entry:null });
  }
  if(opts.mode === 'edit'){
    const entry = opts.entry;
    type = getTypes().find(t=>t.id===entry.typeId);
    title.textContent = 'Edit: ' + (type?.name || 'Entry');
    metaWrap.classList.remove('hidden'); typeWrap.classList.add('hidden');
    dtInp.value = toLocalDTValue(entry.at);
    buildFields(type, entry, fields);
    $('#logIt').onclick = ()=> saveFromModal({ mode:'edit', type, dt:dtInp.value, entry });
  }
  if(opts.mode === 'manual'){
    title.textContent = 'Add manual entry';
    metaWrap.classList.remove('hidden'); typeWrap.classList.remove('hidden');
    getTypes().forEach(t=>{ const o=document.createElement('option'); o.value=t.id; o.textContent=t.name; typeSel.appendChild(o); });
    type = getTypes()[0] || null;
    if(typeSel.value) type = getTypes().find(t=>t.id===typeSel.value);
    dtInp.value = toLocalDTValue(Date.now());
    buildFields(type, null, fields);
    typeSel.onchange = ()=>{ type = getTypes().find(t=>t.id===typeSel.value); buildFields(type, null, fields); };
    $('#logIt').onclick = ()=> saveFromModal({ mode:'manual', type: getTypes().find(t=>t.id===typeSel.value), dt:dtInp.value, entry:null });
  }
  dlg.returnValue='cancel'; dlg.showModal();
}

function saveFromModal({mode, type, dt, entry}){
  if(!ensureWritable()) return;
  if(!type){ alert('Choose a type'); return; }
  const values={}; let ok=true;
  type.measurements.forEach((m,i)=>{
    let v = $('#m_'+i).value.trim();
    if(v==='' && m.default!==undefined && m.default!==''){ v=String(m.default); }
    if(v==='' || v===null){ ok=false; }
    values[m.name] = m.type==='float' ? parseFloat(v) : v;
  });
  if(!ok){ alert('Fill all fields (defaults fill blanks if set).'); return; }
  if(mode==='quick'){ addEntry(type.id, values, null); }
  if(mode==='manual'){ addEntry(type.id, values, fromLocalDTValue(dt)); }
  if(mode==='edit'){ updateEntry(entry.id, values, fromLocalDTValue(dt)); }
  $('#logModal').close();
}
