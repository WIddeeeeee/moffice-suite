// App shell: tabs, theme, project save/load
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('#tabs button').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('#tabs button').forEach(x=>x.classList.remove('active')); b.classList.add('active');
    document.querySelectorAll('.app').forEach(s=>s.classList.remove('active')); document.getElementById('app-'+b.dataset.app).classList.add('active');
  }));
  document.getElementById('themeBtn').onclick=()=>document.body.classList.toggle('dark');
  const dl=(name,content,type)=>{const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([content],{type})); a.download=name; a.click();};
  document.getElementById('saveProjectBtn').onclick=()=>{
    const data={docTitle:document.getElementById('docTitle').value, doc:document.getElementById('editor').innerHTML, sheet:typeof sheetData!=='undefined'?sheetData:[], video:{overlay:document.getElementById('overlayText').value, trimStart:document.getElementById('trimStart').value, trimEnd:document.getElementById('trimEnd').value}};
    dl('moffice-project.json',JSON.stringify(data,null,2),'application/json'); };
  document.getElementById('loadProjectBtn').onclick=()=>document.getElementById('projectFile').click();
  document.getElementById('projectFile').addEventListener('change',e=>{const f=e.target.files[0]; if(!f) return; const r=new FileReader();
    r.onload=()=>{try{const d=JSON.parse(r.result); if(d.doc) document.getElementById('editor').innerHTML=d.doc; if(d.docTitle) document.getElementById('docTitle').value=d.docTitle; if(d.sheet){sheetData=d.sheet; renderSheet();} if(d.video){document.getElementById('overlayText').value=d.video.overlay||'';}}catch(err){alert('Could not open that project file.');}}; r.readAsText(f);});
});
