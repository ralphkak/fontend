import { $ } from '../utils.js';
const syncBadge = $('#syncBadge');

export function setSyncState(state, text, breakdown){
  syncBadge.textContent = text;
  syncBadge.title = breakdown || text;
  syncBadge.className = 'status-badge ' + (state==='idle'?'status-idle':state==='loading'?'status-warn':state==='ok'?'status-ok':state==='error'?'status-err':'status-idle');
}

export function updateCountsTooltip(types, entries){
  const typeCount = types.length;
  const countsById = {}; entries.forEach(e => countsById[e.typeId] = (countsById[e.typeId]||0) + 1);
  const nameById = Object.fromEntries(types.map(t=>[t.id, t.name]));
  const parts = Object.entries(countsById).map(([id,c]) => `${nameById[id]||'Unknown'}: ${c}`);
  const breakdown = `Types: ${typeCount}\n` + (parts.length? parts.join('\n') : 'No entries yet');
  const text = `Sync • types ${typeCount}${parts.length? ' • ' + parts.join(', ') : ''}`;
  syncBadge.title = breakdown;
  if(syncBadge.classList.contains('status-ok') || syncBadge.classList.contains('status-idle')){
    syncBadge.textContent = text;
  }
}
