import { store } from './utils.js';

export const KEYS = {
  SESSION: 'logx_session',
  TYPES: 'logx_types_cache',
  ENTRIES: 'logx_entries_cache'
};

let saver = null;
export function setSaver(fn){ saver = fn; }

export function getTypes(){ return store.get(KEYS.TYPES, []); }
export function setTypes(v){ store.set(KEYS.TYPES, v); if(saver) saver(); }
export function getEntries(){ return store.get(KEYS.ENTRIES, []); }
export function setEntries(v){ store.set(KEYS.ENTRIES, v); if(saver) saver(); }

export function addType(t){
  const types=getTypes();
  t.id=crypto.randomUUID(); t.createdAt=Date.now();
  if(!t.color){
    const hue=(types.length*53)%360;
    t.color = '#7aa2ff';
  }
  types.push(t); setTypes(types);
}
export function updateType(id, patch){
  const types = getTypes().map(t => t.id===id ? {...t, ...patch} : t);
  setTypes(types);
}
export function delType(id){
  setTypes(getTypes().filter(t=>t.id!==id));
  setEntries(getEntries().filter(e=>e.typeId!==id));
}

export function addEntry(typeId, values, atTs){
  const e={id:crypto.randomUUID(), typeId, at: atTs || Date.now(), values};
  const es=getEntries(); es.push(e); setEntries(es);
}
export function updateEntry(entryId, newValues, newAt){
  const es=getEntries().map(e=> e.id===entryId ? {...e, values:newValues, at:(newAt || e.at)} : e);
  setEntries(es);
}
export function delEntry(entryId){
  setEntries(getEntries().filter(e => e.id !== entryId));
}
