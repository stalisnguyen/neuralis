/* ================= UI SHELL: groups, bottom nav / sidebar, Today, Progress, Settings, celebrations, intro ================= */
const UI_GROUPS=[
  {k:'today',label:'Hôm nay',icon:'house',views:['home']},
  {k:'learn',label:'Học',icon:'book-open',views:['learn','glossary','jobs']},
  {k:'play',label:'Chơi',icon:'gamepad-2',views:['arcade','labs']},
  {k:'practice',label:'Luyện',icon:'code',views:['python','cards','bit']},
  {k:'me',label:'Tôi',icon:'user-round',views:['progress','friends','settings']},
];
const UI_ALIAS={lesson:'learn',lab:'labs',robot:'arcade',predict:'arcade',bughunt:'arcade',termrush:'arcade',badges:'arcade'};
const UI_V={home:['Hôm nay','house'],learn:['Lộ trình','map'],glossary:['Thuật ngữ','book-a'],jobs:['Nghề nghiệp','briefcase'],arcade:['Arcade','gamepad-2'],labs:['Labs','flask'],
  python:['Python','code'],cards:['Thẻ thuật ngữ','layers'],bit:['Hỏi Bit','sparkles'],progress:['Tiến độ','trophy'],friends:['Bạn học','users'],settings:['Cài đặt','settings']};
const uiGroupOf=v=>{v=UI_ALIAS[v]||v;return UI_GROUPS.find(g=>g.views.includes(v))||UI_GROUPS[0];};
const UI_LAST=store.get('neuralis-lastv',{});
const uiReduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

function uiInit(){
  const fl=document.createElementNS('http://www.w3.org/2000/svg','svg');fl.setAttribute('width','0');fl.setAttribute('height','0');fl.style.position='absolute';
  fl.innerHTML='<defs><linearGradient id="flameG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB020"/><stop offset="1" stop-color="#FF6A1A"/></linearGradient></defs>';document.body.appendChild(fl);
  $('#brandMc').innerHTML=botSVG('calm',44,mcRankIdx());$('#brandMc2').innerHTML=botSVG('calm',38,mcRankIdx());
  $('#brand').onclick=()=>go('home');$('#brandSm').onclick=()=>go('home');
  $('#tgAa').onclick=uiAaSheet;
  $('#stChip').onclick=$('#stChip2').onclick=()=>go('progress');
  $('#bnav').innerHTML=UI_GROUPS.map(g=>`<button data-g="${g.k}" aria-label="${g.label}"><span class="ind">${ic(g.icon)}</span><span>${g.label}</span></button>`).join('');
  $$('#bnav [data-g]').forEach(b=>b.onclick=()=>uiGoGroup(b.dataset.g));
  document.addEventListener('pointerdown',e=>{UI_PT={x:e.clientX,y:e.clientY};},{capture:true,passive:true});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){const m=$('.mc-cele');if(m&&!m.classList.contains('locked'))m.remove();}});
}
let UI_PT=null;
function uiGoGroup(k){const g=UI_GROUPS.find(x=>x.k===k);const v=UI_LAST[k]&&g.views.includes(UI_LAST[k])?UI_LAST[k]:g.views[0];go(v);}
function uiNav(){
  const v=UI_ALIAS[current]||current, g=uiGroupOf(current);
  if(UI_LAST[g.k]!==v&&g.views.includes(v)&&!UI_ALIAS[current]){UI_LAST[g.k]=v;store.set('neuralis-lastv',UI_LAST);}
  let due=0;try{due=TERMS.length?cardsDue().length:0;}catch(e){}
  const badge=k=>k==='practice'&&due?`<span class="badge num">${due>99?'99+':due}</span>`:'';
  $$('#bnav [data-g]').forEach(b=>{if(b.dataset.g===g.k)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');const old=$('.badge',b);if(old)old.remove();const bd=badge(b.dataset.g);if(bd)b.insertAdjacentHTML('beforeend',bd);});
  $('#sideNav').innerHTML=UI_GROUPS.map(x=>{const on=x.k===g.k;const solo=x.views.length===1;
    return `<button class="g${solo?' solo':''}" data-g="${x.k}" ${on?'aria-current="page"':''}>${ic(x.icon)}<span>${x.label}</span>${badge(x.k)}</button>`+
      (on&&!solo?`<div class="sub">${x.views.map(w=>`<button data-v="${w}" ${w===v?'aria-current="page"':''}>${UI_V[w][0]}</button>`).join('')}</div>`:'');}).join('');
  $$('#sideNav [data-g]').forEach(b=>b.onclick=()=>uiGoGroup(b.dataset.g));
  $$('#sideNav [data-v]').forEach(b=>b.onclick=()=>go(b.dataset.v));
  const busy=false;
  $('#pgTitle').textContent=g.k==='today'?'Hôm nay':(UI_V[v]?UI_V[v][0]:g.label);
  document.title=g.k==='today'?"Neuralis - Stalis's AI & Robotics":(UI_V[v]?UI_V[v][0]:'Neuralis')+' - Neuralis';
  const sn=$('#subnav');
  if(g.views.length>1&&!busy){sn.innerHTML=g.views.map(w=>`<button role="tab" data-v="${w}" aria-selected="${w===v}">${ic(UI_V[w][1])}${UI_V[w][0]}</button>`).join('');
    $$('[data-v]',sn).forEach(b=>b.onclick=()=>go(b.dataset.v));
    const on=$('[aria-selected="true"]',sn);if(on&&on.scrollIntoView)setTimeout(()=>{try{on.scrollIntoView({block:'nearest',inline:'nearest'});}catch(e){}},0);}
  else sn.innerHTML='';
  document.body.classList.toggle('busy',busy);
  uiChips();
}
function uiStudied(k){const d=(P.day||{})[k];return !!((d&&d.xp)||P.hist[k]);}
let UI_RANK=-1;
function uiChips(){
  const st=streak(), hot=uiStudied(ymd(Date.now()));
  const html=`<svg class="i" aria-hidden="true" style="fill:${hot?'url(#flameG)':'var(--line2)'}"><use href="#i-flame"/></svg><span class="num">${st}</span>`;
  ['#stChip','#stChip2'].forEach(s=>{const e=$(s);if(e){e.innerHTML=html;e.classList.toggle('cold',!hot);e.title='Chuỗi '+st+' ngày';}});
  const x=$('#xpChip');if(x){x.innerHTML=`${ic('zap')}<span>${(plDay().xp||0)}</span>`;}
  const r=mcRankIdx();if(UI_RANK!==r){UI_RANK=r;const a=$('#brandMc'),b=$('#brandMc2');if(a)a.innerHTML=botSVG('calm',44,r);if(b)b.innerHTML=botSVG('calm',38,r);}
}

/* ---------- Today ---------- */
const UI_SHORT={py:'Python',focus:'Nhánh chính',extra:'Nhánh phụ',cards:'Thẻ',lab:'Lab',game:'Game'};
function uiGreet(){const h=new Date().getHours();return h<11?'Chào buổi sáng':h<14?'Chào buổi trưa':h<18?'Chào buổi chiều':'Chào buổi tối';}
function uiRing(pct,size){const p=Math.round(Math.min(1,pct)*100);return `<div class="ring-box" style="width:${size}px;height:${size}px"><svg class="ring ${p>=100?'full':''}" viewBox="0 0 72 72" width="${size}" height="${size}" role="img" aria-label="${p}% mục tiêu"><circle cx="36" cy="36" r="30" class="ring-track"/><circle cx="36" cy="36" r="30" class="ring-fill" pathLength="100" style="stroke-dasharray:${p} 100;${p?'':'opacity:0'}"/></svg><span class="ring-n num">${p>=100?ic('check'):p+'%'}</span></div>`;}
function uiWeek(){
  const t=today(), dow=(new Date(t).getDay()+6)%7, mon=t-dow*DAY, names=['T2','T3','T4','T5','T6','T7','CN'];
  return `<div class="wk">${names.map((n,i)=>{const d=mon+i*DAY,k=ymd(d),done=uiStudied(k),isT=d===t,fut=d>t;
    return `<div class="wk-d ${done?'on':''} ${isT?'is-today':''} ${fut?'fut':''}"><span class="wk-n">${n}</span><span class="wk-c">${done?ic('check'):new Date(d).getDate()}</span></div>`;}).join('')}</div>`;
}
function uiTaskGo(t){if(t.lesson){openLesson(t.lesson.id);return;}if(t.lab){openLab(t.lab);return;}go(t.go);}
VIEWS.home=el=>{
  if(!LESSONS.length){el.innerHTML='<div class="view"><p class="note">Đang tải...</p></div>';loadData().then(()=>{if(current==='home')route();});return;}
  plCfg();
  const tasks=plTasks(), d=plDay(), goal=plGoalXP(), xpT=plXPTotal(), {r,nx}=plRank(xpT);
  const doneN=tasks.filter(t=>t.done).length, next=tasks.find(t=>!t.done);
  const label=next?(doneN?'Tiếp tục: ':'Bắt đầu: ')+next.t:'Xong hôm nay. Học thêm?';
  const lo=nx?nx[0]-r[0]:1, pr=nx?(xpT-r[0])/lo:1;
  const tot=LESSONS.length, dn=LESSONS.filter(l=>lesDone(l.id)).length;
  el.innerHTML=`<div class="view home2">
   <div class="hm-hello">${mascot(doneN===tasks.length?'yay':'hi',64)}<div><h2 class="hm-greet">${uiGreet()}, ${esc(uiName())}</h2><p class="note">${doneN===tasks.length?'Xong hết việc hôm nay. Bit tự hào lắm!':doneN?`Đã xong ${doneN}/${tasks.length} việc hôm nay.`:'Mỗi ngày một chút. Hôm nay mình học gì nào?'}</p></div></div>
   ${SYNC==='web'&&syncState==='off'?`<div class="vbanner">${mcSay('hmm','Tiến độ đang chỉ lưu trên máy này. Đăng nhập Google (hoặc nhập mã mời) để đồng bộ giữa các máy.',48)}<div class="row"><button class="btn primary sm" id="hmSync">Đăng nhập hoặc nhập mã</button></div></div>`:''}
   ${uiWeek()}
   <div class="hm-grid"><div class="hm-main">
     <section class="sess" aria-label="Buổi học hôm nay">
      <div class="sess-top"><div><div class="sess-k">Buổi học hôm nay</div><div class="sess-x"><b class="num">${d.xp||0}</b> / ${goal} XP</div><div class="sess-s">${doneN}/${tasks.length} việc, khoảng ${plCfg().minutes} phút</div></div>${uiRing((d.xp||0)/goal,76)}</div>
      <ol class="path">${tasks.map(t=>`<li class="${t.done?'on':''} ${t===next?'cur':''}"><i></i><span>${UI_SHORT[t.k]||t.k}</span></li>`).join('')}</ol>
      <button class="btn sess-go" id="hmGo"><span class="sg-t">${esc(label)}</span> ${ic('chevron-right')}</button></section>
     <div class="tasks">${tasks.map((t,i)=>`<button class="task ${t.done?'done':''}" data-i="${i}"><span class="tk-c">${t.done?ic('check'):ic(t.k==='game'?'gamepad-2':t.k==='lab'?'flask':t.k==='cards'?'layers':t.lesson&&t.lesson.code?'code':'book-open')}</span><span class="tk-t"><span><b>${esc(t.t)}</b>${t.n?` <span class="num muted small">${Math.min(t.n[0],t.n[1])}/${t.n[1]}</span>`:''}</span><span class="small muted">${esc(t.sub||'')}</span></span>${ic('chevron-right','tk-a')}</button>`).join('')}</div>
     ${dn===0?mcSay('idea','Bắt đầu với bài Python đầu tiên, chỉ khoảng 8 phút. Không cần cài gì, code chạy ngay trên trình duyệt.',56):''}
   </div><div class="hm-side">
     <button class="mini" data-go="learn"><span class="mini-n num">${dn}<span class="small muted">/${tot}</span></span><span class="mini-l">bài đã xong</span><span class="tr-mini">${TRACKS.map(t=>{const a=trackLessons(t.k),x=a.filter(l=>lesDone(l.id)).length;return `<span title="${t.name}"><i style="background:${t.color};width:${a.length?Math.max(4,x/a.length*100):0}%"></i></span>`;}).join('')}</span><span class="mini-a">Mở lộ trình ${ic('chevron-right')}</span></button>
     <button class="mini rank" data-go="progress"><span class="seal-rk">${r[1]}</span><span class="mini-l">${esc(r[2])}</span><span class="bar-track"><i style="width:${Math.round(pr*100)}%"></i></span><span class="small muted num">${nx?`${xpT-r[0]}/${lo} XP lên ${nx[1]}`:'Danh hiệu cao nhất'}</span></button>
     ${(()=>{try{const {w,key,qs}=weekQuests();const cl=(P.quests||{})[key]||{};const dn=qs.filter(([id,,g,f])=>cl[id]||f(w)>=g).length;return `<button class="mini" data-go="arcade"><span class="mini-n num">${dn}<span class="small muted">/3</span></span><span class="mini-l">nhiệm vụ tuần, ${Object.keys(P.badges||{}).length} huy hiệu</span><span class="mini-a">Vào Arcade ${ic('chevron-right')}</span></button>`;}catch(e){return '';}})()}
     <button class="panel cul-inv" data-go="bit"><span class="cul-ic">${ic('sparkles')}</span><span style="min-width:0"><span class="label">Bí chỗ nào?</span><b class="cul-t">Hỏi Bit, giải thích bằng tiếng Việt</b></span>${ic('chevron-right')}</button>
   </div></div></div>`;
  $('#hmGo').onclick=()=>{if(next)uiTaskGo(next);else go('learn');};
  const hs=$('#hmSync',el);if(hs)hs.onclick=async()=>{if(await askPassword(false)){await pullRemote();renderSync();route();}};
  $$('[data-i]',el).forEach(b=>b.onclick=()=>uiTaskGo(tasks[+b.dataset.i]));
  $$('[data-go]',el).forEach(b=>b.onclick=()=>go(b.dataset.go));
  uiFriendsCard();
};

/* ---------- Me: progress ---------- */
VIEWS.progress=el=>{
  const xpT=plXPTotal(),{r,nx}=plRank(xpT),ri=PL_RANKS.indexOf(r),wk=plWeek();
  const heat=[];const start=today()-83*DAY;for(let i=0;i<84;i++){const k=ymd(start+i*DAY);const n=((P.day||{})[k]||{}).xp||0;heat.push(n===0?'':n<30?'h1':n<70?'h2':n<120?'h3':'h4');}
  const codeOk=LESSONS.filter(l=>l.code&&P.code[l.id]&&P.code[l.id].ok).length, codeAll=LESSONS.filter(l=>l.code).length;
  const termsK=TERMS.filter(t=>known(t.id)).length, labsN=Object.keys(P.labs||{}).length;
  el.innerHTML=`<div class="view">
   <div class="rk-hero">${mascot('ok',110)}<div><span class="label" style="color:inherit;opacity:.85">Danh hiệu</span><h2>${r[1]}</h2><p class="small" style="margin:2px 0 8px;opacity:.9">${esc(r[2])}</p>
     <div class="bar-track lt"><i style="width:${nx?Math.round((xpT-r[0])/(nx[0]-r[0])*100):100}%"></i></div><div class="small num" style="margin-top:4px;opacity:.9">${xpT} XP${nx?`, còn ${nx[0]-xpT} XP lên ${nx[1]}`:''}</div></div></div>
   <div class="ranks">${PL_RANKS.map((x,i)=>`<div class="rk ${i<=ri?'on':''}" title="${x[1]}: ${x[0]} XP">${botSVG(i<=ri?'calm':'zzz',44,i)}<span class="rk-n">${x[1]}</span><span class="small">${x[0]} XP</span></div>`).join('')}</div>
   <div class="panel"><h3>Các nhánh</h3>${TRACKS.map(t=>{const a=trackLessons(t.k),x=a.filter(l=>lesDone(l.id)).length;return `<div class="lvrow"><b>${t.name}</b><span class="bar-track"><i style="width:${a.length?x/a.length*100:0}%;background:${t.color}"></i></span><span class="num muted small">${x}/${a.length}</span></div>`;}).join('')}</div>
   <div class="stats4">
     <div class="panel st"><span class="st-i fl">${ic('flame')}</span><b class="num">${streak()}</b><span class="small muted">ngày liên tiếp</span></div>
     <div class="panel st"><span class="st-i ok">${ic('code')}</span><b class="num">${codeOk}/${codeAll}</b><span class="small muted">bài code đã qua</span></div>
     <div class="panel st"><span class="st-i xp">${ic('flask')}</span><b class="num">${labsN}/${Object.keys(LABS).length}</b><span class="small muted">lab đã thử</span></div>
     <div class="panel st"><span class="st-i bl">${ic('layers')}</span><b class="num">${termsK}</b><span class="small muted">thuật ngữ đã thuộc</span></div>
   </div>
   <div class="panel"><h3>12 tuần gần đây</h3>${Object.keys(P.day||{}).length?`<div class="heat">${heat.map(x=>`<i class="${x}"></i>`).join('')}</div><span class="note">Mỗi ô là một ngày, càng đậm càng học nhiều. 7 ngày qua: ${wk.xp} XP, ${wk.act}/7 ngày có học.</span>`:mcSay('zzz','Ô đầu tiên sẽ sáng lên sau buổi học hôm nay.',56)}
     <div class="row"><button class="btn sm" id="pgPlan">Đổi lộ trình</button></div></div></div>`;
  $('#pgPlan').onclick=plSettings;
};

/* ---------- settings ---------- */
const uiTg=(id,label,on,sub)=>`<button class="tg-row" id="${id}" role="switch" aria-checked="${!!on}"><span><b>${label}</b>${sub?`<span class="small muted">${sub}</span>`:''}</span><span class="tg"><i></i></span></button>`;
function uiToggles(root){
  const set={tgSnd:()=>{P.settings.mute=!P.settings.mute;},tgMc:()=>{P.settings.noMascot=!P.settings.noMascot;}};
  Object.keys(set).forEach(id=>{const b=$('#'+id,root);if(b)b.onclick=()=>{set[id]();touch('main');applySettings();b.setAttribute('aria-checked',b.getAttribute('aria-checked')!=='true');};});
  $$('[data-theme-set]',root).forEach(b=>b.onclick=()=>{P.settings.theme=b.dataset.themeSet||'';touch('main');applySettings();$$('[data-theme-set]',root).forEach(x=>x.setAttribute('aria-pressed',x===b));});
}
function uiToggleHTML(){
  return `${uiTg('tgSnd','Âm thanh',!P.settings.mute,'Tiếng "ting" khi đúng, tiếng trầm khi sai')}${uiTg('tgMc','Bit',!P.settings.noMascot,'Robot đi cùng bạn ở các mốc học')}
   <div class="tg-row static"><span><b>Giao diện</b></span><span class="row">${[['','Tự động'],['light','Sáng'],['dark','Tối']].map(([k,t])=>`<button class="chip" data-theme-set="${k}" aria-pressed="${(P.settings.theme||'')===k}">${t}</button>`).join('')}</span></div>`;
}
function uiAaSheet(){
  const m=modal(`<h2>Hiển thị và âm thanh</h2><div class="tg-list">${uiToggleHTML()}</div>`);
  m.el.classList.add('sheet'); uiToggles(m.el);
  const obs=new MutationObserver(()=>{if(!document.body.contains(m.el)){obs.disconnect();if(!window.__busy)route();}});obs.observe(document.body,{childList:true});
}
VIEWS.settings=el=>{
  const c=plCfg();
  const aiTxt=AI?'Đang bật':WEB?(WEB.ai?'Cần đăng nhập':'Chưa cấu hình trên máy chủ'):'Không kết nối được máy chủ';
  const syTxt=syncState==='on'?'Đã đồng bộ':syncState==='err'?'Lỗi đồng bộ, đang lưu trên máy':syncState==='off'?'Chưa bật (cần đăng nhập)':'Chỉ lưu trên máy này';
  el.innerHTML=`<div class="view set">
   <div class="panel"><div class="spread"><h3>Người học</h3><button class="btn sm" id="stWho">Đổi người học</button></div><div class="kv"><span>Đang học với tên</span><b>${esc(uiName())}</b></div></div>
   <div class="panel"><h3>Lộ trình</h3><p class="small" style="margin:0"><b>${c.minutes} phút</b> mỗi ngày, nhánh chính: <b>${TR[focusTrack()].name}</b> (song song với Python).</p><div class="row"><button class="btn sm" id="stPlan">Đổi lộ trình</button></div></div>
   <div class="panel"><h3>Hiển thị và âm thanh</h3><div class="tg-list">${uiToggleHTML()}</div></div>
   <div class="panel"><h3>Đồng bộ và trợ lý AI</h3><div class="kv"><span>Đồng bộ tiến độ</span><b>${syTxt}</b></div><div class="kv"><span>Bit (AI)</span><b>${aiTxt}</b></div>
     ${WEB&&(!getKey()||syncState==='off')?'<button class="btn primary sm" id="stKey" style="align-self:flex-start">Nhập mã mời</button>':''}
     ${WEB&&getKey()?'<div class="row" style="gap:8px"><button class="btn sm" id="stChg">Đổi mật khẩu hoặc mã trên máy này</button><button class="btn ghost sm" id="stOut">Xóa mật khẩu khỏi máy này</button></div>':''}
     <details class="adv"><summary>Nâng cao</summary><p class="note">Bit chạy qua Groq, đồng bộ qua Upstash Redis, cấu hình bằng biến môi trường trên Vercel: APP_PASSWORD, GROQ_API_KEY, KV_REST_API_URL, KV_REST_API_TOKEN. Python chạy bằng Pyodide ngay trong trình duyệt.</p></details></div>
   <div class="panel"><h3>Khác</h3><div class="row"><button class="btn sm" id="stHi">Gặp lại Bit</button><button class="btn sm" id="stReset">Xoá toàn bộ tiến độ</button></div>
     <p class="note">Neuralis, Stalis's AI & Robotics. Bài học, bài tập và lab do Neuralis tự soạn. Thông tin về công cụ, công ty và thị trường thay đổi nhanh, nên đối chiếu thêm nguồn mới khi cần.</p></div></div>`;
  $('#stPlan').onclick=plSettings;$('#stWho').onclick=switchProfile;uiToggles(el);
  const k=$('#stKey');if(k)k.onclick=async()=>{const ok=await askPassword(false);if(ok){await initPlatform();VIEWS.settings(el);}};
  const ch=$('#stChg');if(ch)ch.onclick=async()=>{const ok=await askPassword(false);if(ok){await initPlatform();VIEWS.settings(el);toast('Đã đổi. Máy này giờ dùng mật khẩu hoặc mã mới.');}};
  const o=$('#stOut');if(o)o.onclick=()=>{if(!confirm('Máy này sẽ không dùng được AI và đồng bộ cho tới khi nhập lại mật khẩu hoặc mã. Tiến độ đã lưu trên máy không bị mất. Xóa không?'))return;setKey('');toast('Đã xoá mật khẩu trên máy này.');VIEWS.settings(el);};
  $('#stHi').onclick=()=>uiIntro(true);
  $('#stReset').onclick=async()=>{if(!await confirmBox('Xoá toàn bộ tiến độ?','Xoá bài đã học, code, thẻ, XP của '+esc(uiName())+' trên mọi máy. Không hoàn tác được.','Xoá hết','Giữ lại'))return;
    const keep={settings:P.settings,plan:P.plan};P=Object.assign(structuredClone(DEFAULT),keep);P.upd=Date.now();P.reset=Date.now();store.set(PKEY(),P);
    if(SYNC==='web'&&getKey()){try{await api('api/sync',{method:'PUT',body:{data:P,summary:uiSummary()}});}catch(e){}}toast('Đã xoá tiến độ.');route();};
};

/* ---------- feedback ---------- */
window.__xpFly=n=>{
  setTimeout(uiChips,0); if(!n)return;
  const chip=[$('#xpChip')].find(x=>x&&x.offsetParent); if(!chip)return;
  const to=chip.getBoundingClientRect(), from=UI_PT||{x:innerWidth/2,y:innerHeight/2};
  const f=document.createElement('div');f.className='xpfly';f.textContent='+'+n+' XP';document.body.appendChild(f);
  f.style.left=from.x+'px';f.style.top=from.y+'px';
  if(uiReduced()||!f.animate){setTimeout(()=>f.remove(),900);return;}
  const dx=to.left+to.width/2-from.x, dy=to.top+to.height/2-from.y;
  f.animate([{transform:'translate(-50%,-50%) scale(.8)',opacity:0},{transform:'translate(-50%,-120%) scale(1.05)',opacity:1,offset:.25},{transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.6)`,opacity:.2}],{duration:750,easing:'cubic-bezier(.2,.8,.2,1)'}).onfinish=()=>{f.remove();};
};
function confetti({count=100,duration=1500}={}){
  if(uiReduced())return;
  const cv=document.createElement('canvas'),dpr=devicePixelRatio||1;cv.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:90;width:100%;height:100%';
  cv.width=innerWidth*dpr;cv.height=innerHeight*dpr;document.body.appendChild(cv);const ctx=cv.getContext('2d');ctx.scale(dpr,dpr);
  const cols=['#0F4C5C','#E07A1F','#5EF2D3','#16697A','#F2C14E','#C8372F'];
  const ps=Array.from({length:count},()=>({x:innerWidth/2+(Math.random()-.5)*80,y:innerHeight*.35,vx:(Math.random()-.5)*13,vy:-Math.random()*13-4,r:Math.random()*Math.PI,vr:(Math.random()-.5)*.3,w:6+Math.random()*6,h:4+Math.random()*4,c:cols[Math.floor(Math.random()*cols.length)]}));
  const t0=performance.now();
  (function f(t){const k=(t-t0)/duration;ctx.clearRect(0,0,innerWidth,innerHeight);
    ps.forEach(p=>{p.vy+=.35;p.vx*=.99;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;ctx.save();ctx.globalAlpha=Math.max(0,1-k);ctx.translate(p.x,p.y);ctx.rotate(p.r);ctx.fillStyle=p.c;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore();});
    if(k<1)requestAnimationFrame(f);else cv.remove();})(t0);
}
function uiCele(html,cls){
  const old=$('.mc-cele');if(old)old.remove();
  const bg=document.createElement('div');bg.className='mc-cele '+(cls||'');bg.setAttribute('role','dialog');bg.setAttribute('aria-modal','true');
  bg.innerHTML=`<div class="cele-in">${html}</div>`;document.body.appendChild(bg);
  const close=()=>bg.remove();$$('[data-close]',bg).forEach(b=>b.onclick=close);bg.addEventListener('click',e=>{if(e.target===bg&&!bg.classList.contains('locked'))close();});
  setTimeout(()=>{const b=$('[data-close]',bg);b&&b.focus();},50);
  return {el:bg,close};
}
window.__rankUp=b=>{
  const i=PL_RANKS.indexOf(b), nx=PL_RANKS[i+1];
  uiCele(`<div class="cele-mc">${botSVG('yay',140,i)}</div><div class="stamp">${b[1]}</div><h2>Bạn đã lên ${b[1]}!</h2><p>${esc(b[2])} Bit được nâng cấp phụ kiện mới.</p>${nx?`<p class="small" style="opacity:.85">Mốc tiếp theo: ${nx[1]}, ${nx[0]} XP.</p>`:''}<button class="btn cele-btn" data-close>Tuyệt vời</button>`,'rank');
  sfx('end');setTimeout(()=>confetti({count:130}),300);uiChips();
};
window.__goalDone=()=>{
  if($('.mc-cele'))return;const d=plDay();
  uiCele(`<div class="cele-mc">${mascot('yay',130)}</div><h2>Xong mục tiêu hôm nay!</h2>
    <div class="cele-st"><div><span class="st-i xp">${ic('zap')}</span><b class="num">${d.xp||0}</b><span>XP</span></div><div><span class="st-i fl">${ic('flame')}</span><b class="num">${streak()}</b><span>ngày liên tiếp</span></div><div><span class="st-i ok">${ic('book-open')}</span><b class="num">${lessonsToday().length}</b><span>bài xong</span></div></div>
    <p class="small">Mai giữ lửa nhé. Học thêm thì lên danh hiệu nhanh hơn.</p><div class="row" style="justify-content:center"><button class="btn cele-btn" data-close>Xong</button></div>`,'goal');
  sfx('end');confetti();
};

/* ---------- intro ---------- */
function uiIntro(force){
  if(!force&&store.get('neuralis-intro',0)&&WHO)return;
  const noName=!WHO;
  const steps=[
    ()=>`<div class="cele-mc">${mascot('hi',120)}</div><h2>Chào bạn, mình là Bit</h2><p>Đây là <b>Neuralis</b> (neural + Stalis), nơi học AI và Robotics từ con số 0: Python, toán cho AI, Machine Learning, LLM, robot và con đường vào nghề. Mình giải thích bằng tiếng Việt, giữ thuật ngữ tiếng Anh.</p>${profileForm(true)}<button class="btn cele-btn" id="inName">Tiếp</button>`,
    ()=>`<div class="cele-mc">${mascot('hi',130)}</div><h2>Chào ${esc(uiName())}!</h2><p>Mình được nâng cấp theo danh hiệu của bạn, từ Newbie đến Pioneer. Mỗi lần lên hạng, mình có thêm đồ nghề mới.</p>
      <div class="hats">${[0,1,2,3,4,7].map(i=>botSVG('calm',52,i)).join('')}</div><button class="btn cele-btn" id="inNext">Tiếp</button>`,
    ()=>{const c=plCfg();return `<div class="cele-mc">${mascot('idea',96)}</div><h2>Mỗi ngày học bao lâu?</h2><div class="row" style="justify-content:center">${[15,30,45,60].map(n=>`<button class="chip big" data-mn="${n}" aria-pressed="${c.minutes===n}">${n} phút</button>`).join('')}</div>
      <h2 style="margin-top:8px">Muốn đẩy nhanh nhánh nào cùng Python?</h2><div class="row" style="justify-content:center">${['llm','ml','robo','math'].map(k=>`<button class="chip big" data-fc="${k}" aria-pressed="${(P.settings.focus||'llm')===k}">${TR[k].name}</button>`).join('')}</div>
      <button class="btn cele-btn" id="inGo" style="margin-top:10px">Học bài đầu tiên</button>`;},
  ];
  let i=noName?0:1; const m=uiCele('','intro'+(noName?' locked':''));const box=$('.cele-in',m.el);
  const draw=()=>{if(i==='g'){introSignIn(box,()=>{i=1;draw();});return;}box.innerHTML=steps[i]();
    const nm=$('#inName',box);if(nm)nm.onclick=async()=>{const n=$('#pfN',box).value.trim();if(!slugOf(n)){toast('Nhập tên của bạn trước nhé.');return;}
      await setProfile(n,'');m.el.classList.remove('locked');i=typeof introAuthWanted==='function'&&introAuthWanted()?'g':1;draw();};
    const n=$('#inNext',box);if(n)n.onclick=()=>{i=2;draw();};
    $$('[data-mn]',box).forEach(b=>b.onclick=()=>{plCfg().minutes=+b.dataset.mn;touch('main');$$('[data-mn]',box).forEach(x=>x.setAttribute('aria-pressed',x===b));});
    $$('[data-fc]',box).forEach(b=>b.onclick=()=>{P.settings.focus=b.dataset.fc;touch('main');$$('[data-fc]',box).forEach(x=>x.setAttribute('aria-pressed',x===b));});
    const g=$('#inGo',box);if(g)g.onclick=()=>{store.set('neuralis-intro',1);m.close();loadData().then(()=>{const l=nextLesson('py');if(l)openLesson(l.id);else go('learn');});};};
  draw();
}
