(function(){
'use strict';
/* Neuralis core: helpers, content, progress state, sync, routing, shared UI.
   Feature modules (src/features/*.js) are pasted before the boot marker by build.py. */

/* ================= helpers ================= */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;};
const pick=a=>a[Math.random()*a.length|0];
const DAY=86400000;
const today=()=>{const d=new Date();d.setHours(0,0,0,0);return d.getTime();};
const ymd=t=>{const d=new Date(t);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
const fold=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
const ic=(n,cls)=>`<svg class="i${cls?' '+cls:''}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
function toast(msg,ms=2600){const t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),ms);}
const store={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}};
const fmtTime=s=>{s=Math.max(0,Math.round(s));return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');};
const LET='ABCDE';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
/* inline text: **bold** (boldface CR) and line breaks; everything else escaped */
const fmt=s=>esc(s).replace(/`([^`\n]+)`/g,'<code class="ic">$1</code>').replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>');
const paras=s=>String(s||'').split(/\n{2,}/).map(p=>`<p>${fmt(p)}</p>`).join('');

/* ================= content =================
   data/lessons.json (all tracks), data/terms.json, data/jobs.json built by tools/build_data.py from content/out. */
const TRACKS=[
  {k:'py',name:'Python',vi:'Python từ số 0',icon:'code',color:'#2A8A88'},
  {k:'math',name:'Math for AI',vi:'Toán cho AI',icon:'sigma',color:'#6A5ACD'},
  {k:'ml',name:'Machine Learning',vi:'Máy học',icon:'brain',color:'#E07A1F'},
  {k:'llm',name:'LLM & GenAI',vi:'Mô hình ngôn ngữ lớn',icon:'sparkles',color:'#0F4C5C'},
  {k:'robo',name:'Robotics',vi:'Robot',icon:'bot',color:'#C8372F'},
  {k:'career',name:'Career',vi:'Nghề nghiệp',icon:'briefcase',color:'#7A5C2E'},
];
const TR=Object.fromEntries(TRACKS.map(t=>[t.k,t]));
const JCACHE={};
function loadJSON(name){if(!JCACHE[name])JCACHE[name]=fetch('data/'+name+'.json').then(r=>{if(!r.ok)throw new Error(name);return r.json();}).catch(e=>{delete JCACHE[name];throw e;});return JCACHE[name];}
let LESSONS=[], LI=new Map(), TERMS=[], JOBS=[];
let DATA=null;
function loadData(){
  if(DATA)return DATA;
  DATA=Promise.all([loadJSON('lessons').catch(()=>[]),loadJSON('terms').catch(()=>[]),loadJSON('jobs').catch(()=>[])]).then(([l,t,j])=>{
    const order=TRACKS.map(x=>x.k);
    LESSONS=l.sort((a,b)=>order.indexOf(a.track)-order.indexOf(b.track)||String(a.id).localeCompare(String(b.id),undefined,{numeric:true}));
    LESSONS.forEach((x,i)=>{x.idx=i;LI.set(x.id,x);});TERMS=t;JOBS=j;return true;});
  return DATA;
}
const trackLessons=k=>LESSONS.filter(l=>l.track===k);
const units=k=>{const m=new Map();trackLessons(k).forEach(l=>{if(!m.has(l.unit))m.set(l.unit,[]);m.get(l.unit).push(l);});return [...m.entries()];};

/* ================= progress state ================= */
const DEFAULT={v:1,upd:0,settings:{theme:'',noMascot:false,mute:false,cardsPerDay:10,focus:''},srs:{},hist:{},day:{},les:{},code:{},labs:{},err:{}};
const slugOf=n=>fold(n).trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,30);
let WHO=store.get('neuralis-who',null);
const PKEY=()=>WHO?'neuralis-p:'+WHO.slug:'neuralis-p';
let P=Object.assign(structuredClone(DEFAULT),store.get(PKEY(),{}));
P.settings=Object.assign({},DEFAULT.settings,P.settings||{});
let dirty=new Set();
function touch(part){P.upd=Date.now();dirty.add(part||'main');store.set(PKEY(),P);scheduleSync();}
/* lesson progress: P.les[id] = {read:ts, quiz:best (0-4), done:ts}; P.code[id] = {ok:ts, tries, src (last code, <= 6 KB)} */
const lesDone=id=>!!(P.les[id]&&P.les[id].done);
function lessonComplete(l){const r=P.les[l.id]||{};return !!r.read&&(r.quiz||0)>=3&&(!l.code||!!(P.code[l.id]&&P.code[l.id].ok));}
function nextLesson(track){return (track?trackLessons(track):LESSONS).find(l=>!lesDone(l.id));}

/* SRS (SM-2 style) for flashcards, keyed by card id */
function schedule(k,r){ // r: 0 again,1 hard,2 good,3 easy
  const now=Date.now(); let c=P.srs[k]||{iv:0,ef:2.5,n:0,l:0,due:now,s:0,first:now};
  if(r===0){c.l++;c.n=0;c.iv=0;c.ef=Math.max(1.3,c.ef-0.2);c.due=now+60*1000;c.s=1;}
  else{
    if(r===1){c.iv=c.iv<1?1:Math.max(1,Math.round(c.iv*1.2));c.ef=Math.max(1.3,c.ef-0.15);}
    else if(r===2){c.iv=c.n===0?1:c.n===1?3:Math.round(c.iv*c.ef);}
    else{c.iv=c.n===0?4:Math.round(Math.max(c.iv,1)*c.ef*1.3);c.ef+=0.15;}
    c.n++;c.s=2;c.due=today()+c.iv*DAY;
  }
  P.srs[k]=c; touch('main');
  return c;
}
function ivLabel(k,r){
  const c=Object.assign({iv:0,ef:2.5,n:0},P.srs[k]||{});
  if(r===0)return '1 min';
  const iv= r===1?(c.iv<1?1:Math.max(1,Math.round(c.iv*1.2))): r===2?(c.n===0?1:c.n===1?3:Math.round(c.iv*c.ef)) : (c.n===0?4:Math.round(Math.max(c.iv,1)*c.ef*1.3));
  return iv<30? iv+(iv===1?' day':' days') : iv<365? Math.round(iv/30)+' mo' : (iv/365).toFixed(1)+' yr';
}
const known=k=>{const c=P.srs[k];return !!(c&&c.s===2&&c.iv>=7);};
function newToday(){const t=today();return Object.values(P.srs).filter(c=>c.first>=t).length;}
function streak(){let s=0,t=today();const on=k=>P.hist[k]||((P.day||{})[k]&&P.day[k].xp);if(!on(ymd(t)))t-=DAY;while(on(ymd(t))){s++;t-=DAY;}return s;}

/* ================= platform: /api/ai (Groq) and /api/sync (Upstash), locked by the group password ================= */
let AI=null, syncState='local', SYNC=null, WEB=null;
const getKey=()=>{try{return localStorage.getItem('neuralis-key')||'';}catch(e){return '';}};
const setKey=v=>{try{v?localStorage.setItem('neuralis-key',v):localStorage.removeItem('neuralis-key');}catch(e){}};
async function initPlatform(){
  try{
    const r=await fetch('api/status',{cache:'no-store'});
    if(r.ok){WEB=await r.json();
      if(WEB.ai){AI=makeWebAI();refreshAIBits();}
      if(WEB.sync){SYNC='web'; if(getKey()) await pullRemote(); else syncState='off';}
    }
  }catch(e){}
  renderSync();
}
function askPassword(wrong){
  return new Promise(res=>{
    const m=modal(`<h2>Mật khẩu nhóm</h2>
      <p class="note">${wrong?'Mật khẩu chưa đúng. Nhập lại nhé.':'Nhập mật khẩu nhóm để mở trợ lý Bit (AI) và đồng bộ tiến độ giữa các máy. Mỗi máy chỉ cần nhập một lần.'}</p>
      <form id="pwF" class="row"><input type="password" id="pwI" autocomplete="current-password" placeholder="Mật khẩu" style="flex:1 1 200px"><button class="btn primary" type="submit">Mở khóa</button></form>`);
    let done=false; const fin=v=>{if(done)return;done=true;res(v);};
    $('#pwF',m.el).onsubmit=e=>{e.preventDefault();const v=$('#pwI',m.el).value.trim();if(!v)return;setKey(v);m.close();fin(true);};
    const obs=new MutationObserver(()=>{if(!document.body.contains(m.el)){obs.disconnect();fin(false);}});obs.observe(document.body,{childList:true});
    setTimeout(()=>$('#pwI',m.el).focus(),50);
  });
}
async function api(path,{method='POST',body}={}){
  for(let i=0;i<3;i++){
    if(!getKey()){const ok=await askPassword(false);if(!ok)throw {code:'not_granted'};}
    let r; const hd={'content-type':'application/json','x-app-key':getKey()};
    if(WHO){hd['x-user']=WHO.slug;if(WHO.pin)hd['x-user-pin']=WHO.pin;}
    try{r=await fetch(path,{method,headers:hd,body:body?JSON.stringify(body):undefined});}catch(e){throw {code:'network'};}
    if(r.status===401){setKey('');const ok=await askPassword(true);if(!ok)throw {code:'not_granted'};continue;}
    if(r.status===429)throw {code:'rate_limited'};
    if(r.status===403||(r.status===400&&path.includes('sync'))){const ok=await askPin(r.status===403&&WHO&&WHO.pin);if(!ok)throw {code:'not_granted'};continue;}
    const j=await r.json().catch(()=>({}));
    if(!r.ok)throw {code:j.error||'upstream',data:j.data};
    return j;
  }
  throw {code:'not_granted'};
}
function parseJSON(text){
  const t=String(text).trim().replace(/^```(?:json)?\s*/i,'').replace(/```\s*$/,'');
  try{return JSON.parse(t);}catch(e){}
  const a=Math.min(...['{','['].map(c=>{const k=t.indexOf(c);return k<0?1e9:k;})), b=Math.max(t.lastIndexOf('}'),t.lastIndexOf(']'));
  if(a<1e9&&b>a){try{return JSON.parse(t.slice(a,b+1));}catch(e){}}
  throw {code:'bad_json'};
}
function makeWebAI(){
  const call=async(input,opts={})=>{
    const messages=typeof input==='string'?[{role:'user',content:input}]:input;
    const j=await api('api/ai',{body:{messages,tier:opts.modelTier||'default'}});
    return {text:String(j.text||''),truncated:!!j.truncated};
  };
  call.json=async(input,opts={})=>{
    const add='\n\nChỉ trả về JSON hợp lệ, không thêm chữ nào khác, không bọc trong ```.';
    const msg=typeof input==='string'?input+add:input.map((m,i)=>i===input.length-1?{role:m.role,content:m.content+add}:m);
    const {text}=await call(msg,opts);
    return parseJSON(text);
  };
  return call;
}
async function ask(prompt,opts={}){ if(!AI)throw {code:'no_ai'}; return AI(prompt,opts); }
async function askJSON(prompt,opts={}){ if(!AI)throw {code:'no_ai'}; return AI.json(prompt,opts); }
function aiError(e){
  const c=e&&e.code;
  if(c==='no_ai')return 'Trợ lý AI chưa bật trên máy chủ (cần APP_PASSWORD và GROQ_API_KEY trong Vercel).';
  if(c==='not_granted')return 'Cần nhập mật khẩu nhóm để dùng phần này.';
  if(c==='rate_limited')return 'Đã chạm giới hạn lượt dùng miễn phí. Đợi một lúc rồi thử lại.';
  if(c==='no_key')return 'Chưa có API key cho AI trong Vercel (GROQ_API_KEY).';
  if(c==='no_password')return 'Chưa đặt mật khẩu nhóm trong Vercel (APP_PASSWORD).';
  if(c==='too_long')return 'Nội dung quá dài để gửi một lần. Rút ngắn rồi thử lại.';
  if(c==='billing')return 'Tài khoản API hết hạn mức miễn phí hôm nay.';
  if(c==='bad_json')return 'AI trả kết quả sai định dạng. Bấm thử lại.';
  if(c==='network')return 'Mất kết nối mạng. Kiểm tra mạng rồi thử lại.';
  return 'AI chưa trả lời được. Thử lại sau ít phút.';
}
function refreshAIBits(){$$('.need-ai').forEach(el=>el.hidden=!AI);$$('.no-ai').forEach(el=>el.hidden=!!AI);}

/* ---- sync ---- */
function adopt(m){P=Object.assign(structuredClone(DEFAULT),m);P.settings=Object.assign({},DEFAULT.settings,m.settings||{});store.set(PKEY(),P);applySettings();route(true);}
/* Merge two copies of the progress (this device and the server) instead of letting the newer one win. */
function mergeP(a,b){
  if(!a||!a.upd)return structuredClone(b); if(!b||!b.upd)return structuredClone(a);
  const [nw,old]=(a.upd||0)>=(b.upd||0)?[a,b]:[b,a];
  if((nw.reset||0)>(old.upd||0))return structuredClone(nw); // a reset on one device wins over older copies
  const m=structuredClone(nw);
  const reviews=c=>(c.n||0)+(c.l||0);
  m.srs=Object.assign({},old.srs||{});
  for(const [k,c] of Object.entries(nw.srs||{})){const o=m.srs[k];m.srs[k]=!o||reviews(c)>reviews(o)||(reviews(c)===reviews(o)&&(c.due||0)>=(o.due||0))?c:o;}
  // lessons, code and labs: keep whichever side shows more progress, field by field
  m.les=Object.assign({},old.les||{});for(const [k,r] of Object.entries(nw.les||{})){const o=m.les[k]||{};m.les[k]={read:r.read||o.read,done:r.done||o.done,quiz:Math.max(r.quiz||0,o.quiz||0)};}
  m.code=Object.assign({},old.code||{});for(const [k,r] of Object.entries(nw.code||{})){const o=m.code[k]||{};m.code[k]=Object.assign({},o,r,{ok:r.ok||o.ok,tries:Math.max(r.tries||0,o.tries||0)});}
  m.labs=Object.assign({},old.labs||{});for(const [k,n] of Object.entries(nw.labs||{}))m.labs[k]=Math.max(m.labs[k]||0,n);
  m.err=Object.assign({},old.err||{},nw.err||{});
  for(const [k,e] of Object.entries(old.err||{})){const n=(nw.err||{})[k];if(n&&(e.last||0)>(n.last||0))m.err[k]=e;}
  m.day=Object.assign({},old.day||{});
  for(const [d,x] of Object.entries(nw.day||{})){const o=m.day[d];if(!o){m.day[d]=x;continue;}const r={};for(const k of new Set([...Object.keys(o),...Object.keys(x)]))r[k]=Math.max(+o[k]||0,+x[k]||0);m.day[d]=r;}
  m.hist=Object.assign({},old.hist||{});for(const [d,n] of Object.entries(nw.hist||{}))m.hist[d]=Math.max(m.hist[d]||0,n);
  const uniq=(arr,key)=>{const seen=new Set();return arr.filter(x=>{const k=key(x);if(seen.has(k))return false;seen.add(k);return true;});};
  m.notes=uniq([...(nw.notes||[]),...(old.notes||[])],x=>String(x.t)).slice(0,200);
  m.upd=Math.max(a.upd||0,b.upd||0)+1;
  return m;
}
async function pullRemote(){
  try{
    const j=await api('api/sync',{method:'GET'});
    if(j.data){const m=mergeP(P,j.data);const changed=JSON.stringify(m)!==JSON.stringify(j.data);adopt(m);syncState='on';if(changed){dirty.add('main');await pushRemote();}return;}
    syncState='on';dirty.add('main');await pushRemote();
  }catch(e){console.warn('sync pull',e);syncState=e&&e.code==='not_granted'?'off':'err';}
}
let syncTimer=null;
function scheduleSync(){if(!SYNC||syncState==='off')return;clearTimeout(syncTimer);syncTimer=setTimeout(pushRemote,2500);}
async function pushRemote(){
  if(!SYNC||!dirty.size)return; dirty.clear();
  try{await api('api/sync',{method:'PUT',body:{data:P,summary:typeof uiSummary==='function'?uiSummary():null}});syncState='on';}
  catch(e){if(e&&e.code==='stale'){await pullRemote();renderSync();return;}console.warn('sync push',e);dirty.add('main');syncState=e&&e.code==='not_granted'?'off':'err';}
  renderSync();
}
function renderSync(){
  const el=$('#sync');if(!el)return;
  el.className='sync'+(syncState==='on'?' on':'');
  const t=syncState==='on'?'Đã đồng bộ':syncState==='err'?'Lỗi đồng bộ, đang lưu trên máy':syncState==='off'?'Bấm để bật đồng bộ':'Lưu trên máy này';
  el.title=t;el.innerHTML='<i></i><span class="sync-t">'+t+'</span>';
  el.style.cursor=syncState==='off'||syncState==='err'?'pointer':'';
  el.onclick=(syncState==='off'||syncState==='err')?async()=>{await pullRemote();renderSync();}:null;
}

/* ================= routing ================= */
const VIEWS={};
let current='home';
function go(v){if(v===current){route();return;}if(window.__guard&&!window.__guard())return;current=v;try{history.pushState(null,'','#'+v);}catch(e){}route();window.scrollTo(0,0);}
window.addEventListener('popstate',()=>{const h=(location.hash||'').slice(1)||'home';if(VIEWS[h]&&h!==current){if(window.__guard&&!window.__guard()){try{history.pushState(null,'','#'+current);}catch(e){}return;}current=h;route();}});
function route(soft){
  if(typeof uiNav==='function')uiNav();
  if(soft&&window.__busy)return;
  window.__leave&&window.__leave(); window.__leave=null; window.__guard=null; window.__busy=false;
  const v=$('#view'); v.innerHTML='';
  try{(VIEWS[current]||VIEWS.home)(v);}catch(e){console.error(e);v.innerHTML=`<div class="view"><p class="note">Có lỗi khi mở trang này. Tải lại trang rồi thử lại.</p></div>`;}
}
function applySettings(){
  if(P.settings.theme)document.documentElement.dataset.theme=P.settings.theme;else delete document.documentElement.dataset.theme;
}

/* ================= shared UI ================= */
function modal(html){
  const bg=document.createElement('div');bg.className='modal-bg';bg.innerHTML=`<div class="modal" role="dialog" aria-modal="true"><button class="spk x" aria-label="Đóng"><svg class="i"><use href="#i-x"/></svg></button>${html}</div>`;
  document.body.appendChild(bg);const close=()=>{bg.remove();document.removeEventListener('keydown',onk);};
  const onk=e=>{if(e.key==='Escape')close();};document.addEventListener('keydown',onk);
  bg.addEventListener('click',e=>{if(e.target===bg)close();});$('.x',bg).onclick=close;return {el:$('.modal',bg),close};
}
function confirmBox(title,text,yes='OK',no='Hủy'){
  return new Promise(res=>{const m=modal(`<h2>${esc(title)}</h2><p class="note">${text}</p><div class="row"><button class="btn primary" id="cfY">${esc(yes)}</button><button class="btn" id="cfN">${esc(no)}</button></div>`);
    let d=false;const fin=v=>{if(d)return;d=true;m.close();res(v);};$('#cfY',m.el).onclick=()=>fin(true);$('#cfN',m.el).onclick=()=>fin(false);
    const obs=new MutationObserver(()=>{if(!document.body.contains(m.el)){obs.disconnect();if(!d){d=true;res(false);}}});obs.observe(document.body,{childList:true});});
}
function subTabs(id,items,cur,onPick){
  setTimeout(()=>{$$('#'+id+' [data-t]').forEach(b=>b.onclick=()=>onPick(b.dataset.t));});
  return `<div class="row tabs" id="${id}" role="tablist">${items.map(([k,t])=>`<button class="chip" role="tab" data-t="${k}" aria-pressed="${k===cur}">${t}</button>`).join('')}</div>`;
}
/* timer: makeTimer(seconds, onTick(left), onEnd) -> {stop, left(), pause(), resume()} ; counts down once per second */
function makeTimer(sec,onTick,onEnd){
  let left=sec,id=null;
  const start=()=>{if(id)return;id=setInterval(()=>{left--;onTick&&onTick(left);if(left<=0){clearInterval(id);id=null;onEnd&&onEnd();}},1000);};
  start();onTick&&onTick(left);
  return {stop(){if(id)clearInterval(id);id=null;},pause(){if(id)clearInterval(id);id=null;},resume:start,left:()=>left};
}
function sfx(k){
  if(P.settings.mute)return;
  try{const A=window.__actx||(window.__actx=new (window.AudioContext||window.webkitAudioContext)());const o=A.createOscillator(),g=A.createGain();o.connect(g);g.connect(A.destination);
    const f={ok:[660,990],bad:[220,170],end:[523,784]}[k]||[440,440];const t=A.currentTime;o.frequency.setValueAtTime(f[0],t);o.frequency.linearRampToValueAtTime(f[1],t+.14);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.12,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+.25);o.start(t);o.stop(t+.27);}catch(e){}
}

/* ================= boot ================= */
async function boot(){
  applySettings();
  if(typeof uiInit==='function')uiInit();
  const h=(location.hash||'').slice(1); if(VIEWS[h])current=h;
  route();
  loadData().then(()=>{if(!window.__busy)route(true);if(typeof uiNav==='function')uiNav();});
  initPlatform().then(()=>{if(['home','settings','friends','bit'].includes(current)&&!window.__busy)route(true);});
  if(typeof uiIntro==='function')setTimeout(()=>uiIntro(false),400);
  if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('/sw.js').catch(()=>{});
}
/* test hook for headless checks */
window.__neuralis={pyRun:(c)=>pyRun(c,{timeout:30000}),go,state:()=>P,loadData,LI:()=>LI,openLesson:id=>openLesson(id)};
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&dirty.size&&SYNC){clearTimeout(syncTimer);pushRemote();}});
boot();
})();
