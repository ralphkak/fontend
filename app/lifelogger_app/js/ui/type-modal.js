import { $, $$ } from '../utils.js';
import { addType, updateType, getTypes, delType } from '../state.js';

const typeModal=$('#typeModal'), measList=$('#measList'); let editingTypeId=null;

function addMeasRow(m={name:'', type:'float', unit:'', default:''}){
  const row=document.createElement('div'); row.className='meas-row';
  const nameInp=document.createElement('input'); nameInp.className='meas-name'; nameInp.placeholder='Amount or Food type'; nameInp.value=m.name||'';
  const typeSel=document.createElement('select'); typeSel.className='meas-type'; ['float','string'].forEach(v=>{ const o=document.createElement('option'); o.value=v; o.textContent=v; if(m.type===v) o.selected=true; typeSel.appendChild(o); });
  const unitInp=document.createElement('input'); unitInp.className='meas-unit'; unitInp.placeholder='mL, g, etc.'; unitInp.value=m.unit||'';
  const defInp=document.createElement('input'); defInp.className='meas-def'; defInp.placeholder='e.g., 500'; defInp.value=(m.default!==undefined && m.default!=='')? m.default:'';
  const delBtn=document.createElement('button'); delBtn.className='btn small danger'; delBtn.type='button'; delBtn.textContent='Remove'; delBtn.onclick=()=> row.remove();
  const nameLab=document.createElement('label'); nameLab.textContent='Name'; const typeLab=document.createElement('label'); typeLab.textContent='Type'; const unitLab=document.createElement('label'); unitLab.textContent='Unit'; const defLab=document.createElement('label'); defLab.textContent='Default';
  const wrap1=document.createElement('div'); wrap1.appendChild(nameLab); wrap1.appendChild(nameInp);
  const wrap2=document.createElement('div'); wrap2.appendChild(typeLab); wrap2.appendChild(typeSel);
  const wrap3=document.createElement('div'); wrap3.appendChild(unitLab); wrap3.appendChild(unitInp);
  const wrap4=document.createElement('div'); wrap4.appendChild(defLab); wrap4.appendChild(defInp);
  row.appendChild(wrap1); row.appendChild(wrap2); row.appendChild(wrap3); row.appendChild(wrap4); row.appendChild(delBtn);
  measList.appendChild(row);
}

export function openTypeModal(type){
  editingTypeId = type?.id || null;
  $('#typeModalTitle').textContent = editingTypeId ? 'Edit Log Type' : 'Create Log Type';
  $('#typeName').value = type?.name || '';
  $('#typeDesc').value = type?.description || '';
  $('#typeColor').value = (type?.color && /^#/.test(type.color))? type.color : '#7aa2ff';
  measList.innerHTML='';
  const seed = type?.measurements && type.measurements.length ? type.measurements : [{name:'Amount', type:'float', unit:'', default:''}];
  seed.forEach(m => addMeasRow(m));
  typeModal.showModal();
}

$('#addMeas').onclick=()=> addMeasRow();

$('#saveType').onclick=()=>{
  const name=$('#typeName').value.trim(); if(!name){ alert('Type name required'); return; }
  const desc=$('#typeDesc').value.trim(); const color=$('#typeColor').value || '#7aa2ff';
  const ms=[];
  $$('.meas-row', measList).forEach(row=>{
    const name=$('.meas-name',row).value.trim();
    const type=$('.meas-type',row).value;
    const unit=$('.meas-unit',row).value.trim();
    const d=$('.meas-def',row).value.trim();
    if(name) ms.push({name, type, unit, default:d});
  });
  if(ms.length===0){ alert('Add at least one measurement'); return; }
  const payload={name, description:desc, color, measurements:ms};
  if(editingTypeId){ updateType(editingTypeId, payload); }
  else { addType(payload); }
  typeModal.close();
};

// Manage Types modal
const manageModal=$('#manageModal'), manageList=$('#manageList'); $('#closeManage').onclick=()=> manageModal.close();
export function openManageModal(){
  manageList.innerHTML='';
  getTypes().forEach(t=>{
    const card=document.createElement('div'); card.className='entry';
    const left=document.createElement('div');
    const swatch=document.createElement('span'); swatch.className='dot'; swatch.style.background = t.color || '#7aa2ff'; swatch.style.border='1px solid rgba(255,255,255,0.3)';
    const strong=document.createElement('strong'); strong.textContent=' ' + t.name;
    const sub=document.createElement('div'); sub.className='muted'; sub.textContent=t.description||'';
    left.appendChild(swatch); left.appendChild(strong); left.appendChild(sub);
    const right=document.createElement('div'); right.className='row';
    const edit=document.createElement('button'); edit.className='btn small'; edit.textContent='Edit'; edit.onclick=()=>{ manageModal.close(); const type=getTypes().find(x=>x.id===t.id); openTypeModal(type); };
    const del=document.createElement('button'); del.className='btn small danger'; del.textContent='Delete'; del.onclick=()=>{ if(confirm('Delete this log type and all its entries?')){ delType(t.id); openManageModal(); } };
    right.appendChild(edit); right.appendChild(del);
    card.appendChild(left); card.appendChild(right); manageList.appendChild(card);
  });
  manageModal.showModal();
}
