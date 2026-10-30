// MSheets: grid + formulas SUM/AVERAGE/MIN/MAX/COUNT + arithmetic + CSV/TSV/JSON
let sheetData=[], sheetRows=30, sheetCols=12, selected='A1'; let boldCells=new Set();
function colName(i){let s=''; i++; while(i>0){let m=(i-1)%26; s=String.fromCharCode(65+m)+s; i=Math.floor((i-1)/26);} return s;}
function cellRefToRC(ref){const m=ref.match(/^([A-Z]+)(\d+)$/); if(!m) return null; let c=0; for(const ch of m[1]) c=c*26+(ch.charCodeAt(0)-64); return {r:parseInt(m[2])-1,c:c-1};}
function evalFormula(f){
  try{
    let expr=f.slice(1).toUpperCase();
    const rangeFn=(fn,range)=>{const [a,b]=range.split(':'); const A=cellRefToRC(a),B=cellRefToRC(b); if(!A||!B) return 0; let vals=[];
      for(let r=Math.min(A.r,B.r);r<=Math.max(A.r,B.r);r++) for(let c=Math.min(A.c,B.c);c<=Math.max(A.c,B.c);c++){const v=parseFloat(getRaw(r,c)); if(!isNaN(v)) vals.push(v);}
      if(fn==='SUM') return vals.reduce((a,b)=>a+b,0); if(fn==='AVERAGE') return vals.length? vals.reduce((a,b)=>a+b,0)/vals.length:0;
      if(fn==='MIN') return vals.length? Math.min(...vals):0; if(fn==='MAX') return vals.length? Math.max(...vals):0; if(fn==='COUNT') return vals.length; return 0;};
    expr=expr.replace(/(SUM|AVERAGE|MIN|MAX|COUNT)\(([A-Z]+\d+:[A-Z]+\d+)\)/g,(m,fn,rg)=>rangeFn(fn,rg));
    expr=expr.replace(/[A-Z]+\d+/g,m=>{const rc=cellRefToRC(m); if(!rc) return 0; const v=getRaw(rc.r,rc.c); const n=parseFloat(v); return isNaN(n)?0:n;});
    if(!/^[0-9+\-*/().\s]+$/.test(expr)) return '#ERR';
    return Function('"use strict";return ('+expr+')')();
  }catch(e){return '#ERR';}
}
function getRaw(r,c){ return (sheetData[r]&&sheetData[r][c]!==undefined)? sheetData[r][c]:''; }
function getDisplay(r,c){ const v=getRaw(r,c); if(typeof v==='string'&&v.startsWith('=')) return evalFormula(v); return v; }
function renderSheet(){
  const t=document.getElementById('sheet'); if(!t) return; let html='<tr><th></th>';
  for(let c=0;c<sheetCols;c++) html+='<th>'+colName(c)+'</th>'; html+='</tr>';
  for(let r=0;r<sheetRows;r++){ html+='<tr><th>'+(r+1)+'</th>';
    for(let c=0;c<sheetCols;c++){ const ref=colName(c)+(r+1); const disp=String(getDisplay(r,c)).replace(/</g,'&lt;'); html+='<td data-ref="'+ref+'" class="'+(ref===selected?'selected':'')+'" style="'+(boldCells.has(ref)?'font-weight:bold;':'')+'">'+disp+'</td>'; }
    html+='</tr>'; }
  t.innerHTML=html;
  t.querySelectorAll('td').forEach(td=>td.addEventListener('click',()=>{selected=td.dataset.ref; document.getElementById('cellRef').value=selected; const rc=cellRefToRC(selected); document.getElementById('formulaBar').value=rc?getRaw(rc.r,rc.c):''; renderSheet();}));
}
document.addEventListener('DOMContentLoaded',()=>{
  if(!document.getElementById('sheet')) return;
  sheetData=Array.from({length:sheetRows},()=>Array(sheetCols).fill('')); renderSheet();
  const bar=document.getElementById('formulaBar');
  bar.addEventListener('keydown',e=>{ if(e.key==='Enter'){ const rc=cellRefToRC(selected); if(rc){ sheetData[rc.r][rc.c]=bar.value; renderSheet(); } }});
  document.getElementById('addRowBtn').onclick=()=>{sheetRows++; sheetData.push(Array(sheetCols).fill('')); renderSheet();};
  document.getElementById('addColBtn').onclick=()=>{sheetCols++; sheetData.forEach(row=>row.push('')); renderSheet();};
  document.getElementById('sheetBold').onclick=()=>{ if(boldCells.has(selected)) boldCells.delete(selected); else boldCells.add(selected); renderSheet(); };
  document.getElementById('sheetItalic').onclick=()=>{ alert('Italic: select a cell and use the formula bar for now — bold + fill are the styled options in this version.'); };
  document.getElementById('cellFill').addEventListener('input',e=>{document.querySelector('td.selected')?.style.setProperty('background',e.target.value);});
  document.getElementById('sheetSampleBtn').onclick=()=>{ const sample=[['Item','Cost'],['Laptop',899],['Mouse',25],['Keyboard',79],['Total','=SUM(B2:B4)']];
    sample.forEach((row,r)=>row.forEach((v,c)=>sheetData[r][c]=v)); renderSheet(); };
  document.getElementById('openSheetBtn').onclick=()=>document.getElementById('sheetFile').click();
  document.getElementById('sheetFile').addEventListener('change',e=>{const f=e.target.files[0]; if(!f) return; const r=new FileReader();
    r.onload=()=>{ sheetData=Array.from({length:sheetRows},()=>Array(sheetCols).fill(''));
      if(f.name.endsWith('.json')){ const j=JSON.parse(r.result); j.forEach((row,ri)=>row.forEach((v,ci)=>{if(ri<sheetRows&&ci<sheetCols) sheetData[ri][ci]=v;})); }
      else { const sep=f.name.endsWith('.tsv')?'\t':','; r.result.split(/\r?\n/).forEach((line,ri)=>{ if(ri>=sheetRows) return; line.split(sep).forEach((v,ci)=>{if(ci<sheetCols) sheetData[ri][ci]=v;}); }); }
      renderSheet(); }; r.readAsText(f);});
  const dl=(name,content,type)=>{const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([content],{type})); a.download=name; a.click();};
  document.getElementById('exportSheet').addEventListener('change',e=>{const v=e.target.value; if(!v) return;
    const rows=sheetData.map(row=>row.map((_,c)=>getDisplay(sheetData.indexOf(row),c)));
    // simpler: build from sheetData directly
    const out=sheetData.map((row,r)=>row.map((_,c)=>getDisplay(r,c)));
    if(v==='csv') dl('sheet.csv',out.map(r=>r.join(',')).join('\n'),'text/csv');
    if(v==='tsv') dl('sheet.tsv',out.map(r=>r.join('\t')).join('\n'),'text/tab-separated-values');
    if(v==='json') dl('sheet.json',JSON.stringify(out),'application/json');
    e.target.value='';});
  document.getElementById('chartBtn').onclick=()=>{ const cv=document.getElementById('sheetChart'); cv.hidden=false; const ctx=cv.getContext('2d'); ctx.clearRect(0,0,720,240);
    let vals=[]; for(let r=1;r<Math.min(10,sheetRows);r++){const n=parseFloat(getDisplay(r,1)); if(!isNaN(n)) vals.push({label:String(getDisplay(r,0)),v:n});}
    if(!vals.length){alert('No numbers in column B to chart. Load the sample budget first.'); return;}
    const max=Math.max(...vals.map(x=>x.v)); vals.forEach((x,i)=>{const h=x.v/max*160; ctx.fillStyle='#6366f1'; ctx.fillRect(20+i*70,200-h,50,h); ctx.fillStyle='#111'; ctx.font='12px sans-serif'; ctx.fillText(x.label.slice(0,8),20+i*70,220); ctx.fillText(x.v,20+i*70,195-h);});
  };
});
