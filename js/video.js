// MVideo: trim, filters, overlay, stock music (Web Audio, generated), canvas export to WebM
let audioCtx=null, musicNodes=[], musicTimer=null, demoAnim=null;
function fmt(s){ if(!isFinite(s)) return '0:00'; s=Math.floor(s); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); }
function applyFilters(){ const v=document.getElementById('videoPreview'); if(!v) return;
  const g=id=>document.getElementById(id).value;
  v.style.filter=`brightness(${g('fBright')}%) contrast(${g('fContrast')}%) saturate(${g('fSaturate')}%) grayscale(${g('fGray')}%) sepia(${g('fSepia')}%) blur(${g('fBlur')}px)`;
}
function updateOverlay(){ const o=document.getElementById('videoOverlay'); o.textContent=document.getElementById('overlayText').value;
  o.className='video-overlay '+document.getElementById('overlayPos').value; o.style.fontSize=document.getElementById('overlaySize').value+'px'; o.style.color=document.getElementById('overlayColor').value; }
function stopMusic(){ if(musicTimer) clearInterval(musicTimer); musicTimer=null; musicNodes.forEach(n=>{try{n.stop()}catch(e){}}); musicNodes=[]; if(audioCtx) audioCtx.close().catch(()=>{}); audioCtx=null; }
// Simple generated loops: chord pads / arpeggios, no copyrighted audio
function playStock(kind){
  stopMusic(); audioCtx=new (window.AudioContext||window.webkitAudioContext)();
  const master=audioCtx.createGain(); master.gain.value=document.getElementById('musicVol').value/100; master.connect(audioCtx.destination);
  const scales={chill:[261.63,329.63,392.00,523.25],upbeat:[523.25,659.25,783.99,1046.50],cinematic:[220.00,261.63,329.63,440.00],lofi:[220.00,277.18,329.63,415.30],electronic:[110.00,220.00,277.18,330.00]};
  const notes=scales[kind]||scales.chill; let step=0;
  const playNote=(freq,time,dur,type='sine')=>{const o=audioCtx.createOscillator(),g=audioCtx.createGain(); o.type=type; o.frequency.value=freq; g.gain.setValueAtTime(0.0001,time); g.gain.exponentialRampToValueAtTime(0.25,time+0.05); g.gain.exponentialRampToValueAtTime(0.0001,time+dur); o.connect(g); g.connect(master); o.start(time); o.stop(time+dur); musicNodes.push(o);};
  musicTimer=setInterval(()=>{ const t=audioCtx.currentTime; const f=notes[step%notes.length];
    if(kind==='electronic') playNote(f,t,0.4,'square'); else if(kind==='upbeat') playNote(f,t,0.5,'triangle');
    else playNote(f,t,1.2,'sine');
    if(kind==='cinematic') playNote(f/2,t,2.0,'sine');
    step++; }, kind==='electronic'?300: kind==='upbeat'?400: 800);
}
document.addEventListener('DOMContentLoaded',()=>{
  const v=document.getElementById('videoPreview'); if(!v) return;
  ['fBright','fContrast','fSaturate','fGray','fSepia','fBlur'].forEach(id=>document.getElementById(id).addEventListener('input',applyFilters));
  ['overlayText','overlayPos','overlaySize','overlayColor'].forEach(id=>document.getElementById(id).addEventListener('input',updateOverlay));
  document.getElementById('videoSpeed').addEventListener('change',e=>v.playbackRate=parseFloat(e.target.value));
  document.getElementById('videoVol').addEventListener('input',e=>v.volume=e.target.value/100);
  document.getElementById('musicVol').addEventListener('input',()=>{});
  document.getElementById('videoFile').addEventListener('change',e=>{const f=e.target.files[0]; if(!f) return; v.src=URL.createObjectURL(f); v.load(); document.getElementById('videoInfo').textContent=f.name+' — loaded. Set trim + filters, then export.';});
  v.addEventListener('loadedmetadata',()=>{ document.getElementById('trimEndLabel').textContent=fmt(v.duration); const ts=document.getElementById('trimStart'), te=document.getElementById('trimEnd');
    ts.max=Math.floor(v.duration); te.max=Math.floor(v.duration); te.value=Math.floor(v.duration); });
  document.getElementById('trimStart').addEventListener('input',e=>{document.getElementById('trimStartLabel').textContent=fmt(e.target.value); v.currentTime=parseFloat(e.target.value);});
  document.getElementById('trimEnd').addEventListener('input',e=>document.getElementById('trimEndLabel').textContent=fmt(e.target.value));
  document.getElementById('previewTrimBtn').onclick=()=>{ v.currentTime=parseFloat(document.getElementById('trimStart').value); v.play(); const end=parseFloat(document.getElementById('trimEnd').value);
    const chk=setInterval(()=>{ if(v.currentTime>=end||v.paused){v.pause(); clearInterval(chk);} },200); };
  document.getElementById('playMusicBtn').onclick=()=>playStock(document.getElementById('stockTrack').value);
  document.getElementById('stopMusicBtn').onclick=stopMusic;
  document.getElementById('musicFile').addEventListener('change',e=>{const f=e.target.files[0]; if(!f) return; const a=document.getElementById('customAudio'); a.src=URL.createObjectURL(f); a.play();});
  document.getElementById('demoVideoBtn').onclick=()=>{
    // Demo clip: animated canvas -> captureStream as a video source is complex; instead show an animated canvas preview
    const c=document.getElementById('videoCanvas'); c.hidden=false; v.hidden=true; const ctx=c.getContext('2d'); let x=0;
    if(demoAnim) cancelAnimationFrame(demoAnim);
    const draw=()=>{ ctx.fillStyle='#0f172a'; ctx.fillRect(0,0,640,360); ctx.fillStyle='#6366f1'; ctx.beginPath(); ctx.arc(80+x,180,40,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#fff'; ctx.font='28px sans-serif'; ctx.fillText('MOffice Demo Clip',180,190); x=(x+2)%560; demoAnim=requestAnimationFrame(draw); };
    draw(); document.getElementById('videoInfo').textContent='Demo clip playing (canvas animation). Upload a real video file to trim / filter / export it.';
  };
  document.getElementById('exportVideoBtn').onclick=async()=>{
    const status=document.getElementById('exportStatus');
    if(!v.src || v.hidden){ status.textContent='Upload a real video first — the demo animation cannot be recorded as a file in this version.'; return; }
    try{
      const canvas=document.createElement('canvas'); canvas.width=v.videoWidth||640; canvas.height=v.videoHeight||360; const ctx=canvas.getContext('2d');
      const start=parseFloat(document.getElementById('trimStart').value)||0; const end=parseFloat(document.getElementById('trimEnd').value)||v.duration;
      v.currentTime=start; await v.play(); applyFilters();
      const stream=canvas.captureStream(30); const rec=new MediaRecorder(stream,{mimeType:'video/webm'});
      const chunks=[]; rec.ondataavailable=e=>chunks.push(e.data);
      rec.onstop=()=>{ const blob=new Blob(chunks,{type:'video/webm'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='moffice-clip.webm'; a.click(); status.textContent='Exported moffice-clip.webm ('+Math.round(blob.size/1024)+' KB).'; v.pause(); };
      rec.start();
      const drawFrame=()=>{ if(v.paused||v.ended||v.currentTime>=end){rec.stop(); return;} ctx.filter=v.style.filter||'none'; ctx.drawImage(v,0,0,canvas.width,canvas.height);
        const txt=document.getElementById('overlayText').value; if(txt){ctx.font=document.getElementById('overlaySize').value+'px sans-serif'; ctx.fillStyle=document.getElementById('overlayColor').value; ctx.textAlign='center'; const y=document.getElementById('overlayPos').value==='top'?40:document.getElementById('overlayPos').value==='bottom'?canvas.height-20:canvas.height/2; ctx.fillText(txt,canvas.width/2,y);}
        requestAnimationFrame(drawFrame); };
      drawFrame(); status.textContent='Recording trimmed clip… it will download when it reaches the end point.';
    }catch(e){ status.textContent='Export failed in this browser: '+e.message; }
  };
  applyFilters(); updateOverlay();
});
