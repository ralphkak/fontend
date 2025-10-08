export const $ = (s, el=document)=>el.querySelector(s);
export const $$ = (s, el=document)=>Array.from(el.querySelectorAll(s));

export const store = {
  get(k,d){ try{ return JSON.parse(localStorage.getItem(k)??JSON.stringify(d)); }catch(e){ return d; } },
  set(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
};

export const fmtDateTime = (d)=> new Date(d).toLocaleString();
export const fmtDate = (d)=> new Date(d).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});
export const fmtTime = (d)=> new Date(d).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'});

export function initialsFromName(name,email){
  const s=(name||email||'').split(/[\s._-]/).filter(Boolean);
  const a=(s[0]||'?')[0]; const b=(s[1]||'')[0]||'';
  return (a+b).toUpperCase();
}
export function toLocalDTValue(ts){
  const d=new Date(ts); const pad=n=>String(n).padStart(2,'0');
  return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes());
}
export function fromLocalDTValue(val){ const t = Date.parse(val); return isNaN(t)? Date.now(): t; }

export function hslToHex(h, s, l){
  s/=100; l/=100;
  const k = n => (n + h/30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n)-3, Math.min(9-k(n), 1)));
  const to255 = x => Math.round(255 * x);
  const r = to255(f(0)), g = to255(f(8)), b = to255(f(4));
  return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
}
export function hexWithAlpha(hex, alpha){
  if(!hex) return '#00000022';
  if(/^#([0-9A-Fa-f]{8})$/.test(hex)) return hex;
  if(/^#([0-9A-Fa-f]{6})$/.test(hex)){
    const a = Math.round(alpha*255).toString(16).padStart(2,'0');
    return hex + a;
  }
  const div=document.createElement('div'); div.style.color=hex; document.body.appendChild(div);
  const rgb=getComputedStyle(div).color; document.body.removeChild(div);
  const m = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if(!m) return '#00000022';
  const [r,g,b]=m.slice(1).map(n=>parseInt(n,10));
  const h6 = '#' + [r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');
  const a = Math.round(alpha*255).toString(16).padStart(2,'0');
  return h6 + a;
}

export function firstFloatValue(type, entry){
  if(!type || !entry) return null;
  for(const m of type.measurements){
    if(m.type==='float' && entry.values.hasOwnProperty(m.name)){
      const v = parseFloat(entry.values[m.name]);
      if(!isNaN(v)) return v;
    }
  }
  return null;
}
export function numToDisplay(n){
  if(n===null || n===undefined) return '';
  const s = Number(n);
  if(Number.isInteger(s)) return String(s);
  return String(parseFloat(s.toFixed(2)).toString());
}
