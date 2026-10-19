/* ================= PLAN: XP, ranks, daily plan ================= */
const PL_W={read:5,quiz:2,code:15,lab:8,card:1,cardnew:2,bit:2,project:40};
const PL_RANKS=[[0,'Newbie','Mới vào nghề, mọi thứ còn mới toanh.'],[300,'Tinkerer','Thích mày mò, bắt đầu hiểu máy móc nghĩ gì.'],[1000,'Coder','Viết được code chạy thật rồi.'],[2500,'Builder','Tự dựng được sản phẩm nhỏ.'],[5000,'Engineer','Kỹ sư thực thụ, đọc lỗi không còn sợ.'],[9000,'Architect','Nhìn ra cả hệ thống, biết chọn công cụ.'],[15000,'Researcher','Đọc paper như đọc báo sáng.'],[25000,'Pioneer','Người mở đường. Bit đội vương miện.']];
function plDay(k){P.day=P.day||{};k=k||ymd(Date.now());return P.day[k]=P.day[k]||{xp:0};}
function plXPTotal(){return Object.values(P.day||{}).reduce((a,d)=>a+(d.xp||0),0);}
function plRank(xp){let r=PL_RANKS[0],nx=PL_RANKS[1];for(let i=0;i<PL_RANKS.length;i++){if(xp>=PL_RANKS[i][0]){r=PL_RANKS[i];nx=PL_RANKS[i+1]||null;}}return {r,nx};}
function award(kind,n){
  n=n||1; const d=plDay(); d[kind]=(d[kind]||0)+n; const before=plXPTotal();
  const gain=Math.round((PL_W[kind]||1)*n); d.xp=(d.xp||0)+gain;
  const k=ymd(Date.now()); P.hist[k]=(P.hist[k]||0)+n; touch('main');
  const a=plRank(before).r, b=plRank(plXPTotal()).r;
  window.__xpFly&&window.__xpFly(gain);
  if(b!==a){if(window.__rankUp)window.__rankUp(b);else toast('Danh hiệu mới: '+b[1],4000);}
  const goal=plGoalXP(); if(d.xp>=goal&&d.xp-gain<goal){if(window.__goalDone)setTimeout(window.__goalDone,b!==a?2500:600);}
}
function plCfg(){P.plan=P.plan||{minutes:30,start:today()};return P.plan;}
function plGoalXP(){return Math.round(plCfg().minutes*2.2);}
/* track to push forward besides Python: the learner's choice, else the first unfinished in this order */
function focusTrack(){const f=P.settings.focus;if(f&&nextLesson(f))return f;return ['llm','ml','robo','math','career'].find(k=>nextLesson(k))||'py';}
const LAB_IDS=['tokenizer','sampling','embedding-map','attention','rag','prompt-lab','linear-regression','gradient-descent','neural-net','overfitting','confusion-matrix','robot-arm','pid','pathfinding','q-learning','kalman','sensors'];
function labOfDay(){const fresh=LAB_IDS.filter(id=>!(P.labs||{})[id]);const pool=fresh.length?fresh:LAB_IDS;return pool[Math.floor(today()/DAY)%pool.length];}
function lessonsToday(){const t=today();return Object.entries(P.les||{}).filter(([id,r])=>r.done>=t).map(([id])=>id);}
function plTasks(){
  const m=plCfg().minutes, d=plDay(), t=[], doneToday=lessonsToday();
  let due=0;try{due=cardsDue().length;}catch(e){}
  const py=nextLesson('py'), ft=focusTrack(), fl=nextLesson(ft);
  const lessonTask=(l,k)=>({k,t:`${TR[l.track].name}: ${l.title}`,sub:l.title_vi+(l.code?', có bài code':'')+(l.lab?', có lab':''),done:false,go:'lesson',lesson:l});
  const pyDone=doneToday.some(id=>id.startsWith('py-')), fDone=doneToday.some(id=>LI.get(id)&&LI.get(id).track===ft);
  if(py)t.push(pyDone?{k:'py',t:'Python: 1 bài hôm nay',sub:'Đã xong, mai học tiếp',done:true,go:'learn'}:lessonTask(py,'py'));
  if(fl&&ft!=='py')t.push(fDone?{k:'focus',t:`${TR[ft].name}: 1 bài hôm nay`,sub:'Đã xong',done:true,go:'learn'}:lessonTask(fl,'focus'));
  if(m>=45){const other=['robo','llm','ml'].find(k=>k!==ft&&nextLesson(k));if(other){const ol=nextLesson(other);const od=doneToday.some(id=>LI.get(id)&&LI.get(id).track===other);t.push(od?{k:'extra',t:`${TR[other].name}: 1 bài`,sub:'Đã xong',done:true,go:'learn'}:lessonTask(ol,'extra'));}}
  const nCards=Math.min(Math.max(due,5),m>=45?20:12);
  t.push({k:'cards',t:'Ôn thuật ngữ',sub:due?`${due} thẻ đến hạn`:'Thuật ngữ AI và Robotics, tiếng Anh kèm nghĩa',done:(d.card||0)+(d.cardnew||0)>=nCards,go:'cards',n:[(d.card||0)+(d.cardnew||0),nCards]});
  const lab=labOfDay();
  t.push({k:'lab',t:'Lab hôm nay: '+(LABS[lab]?LABS[lab].name:lab),sub:LABS[lab]?LABS[lab].vi:'',done:(d.lab||0)>=1,go:'lab',lab});
  return t;
}
function plWeek(){let xp=0,act=0,les=0;for(let i=0;i<7;i++){const d=(P.day||{})[ymd(today()-i*DAY)];if(d){xp+=d.xp||0;if(d.xp)act++;les+=d.read||0;}}return {xp,act,les};}
function plSettings(){
  const c=plCfg();
  const m=modal(`<h2>Lộ trình học</h2>
    <label class="label">Mỗi ngày học bao lâu</label><div class="row">${[15,30,45,60,90].map(n=>`<button class="chip" data-m="${n}" aria-pressed="${c.minutes===n}">${n} phút</button>`).join('')}</div>
    <label class="label">Nhánh muốn đẩy nhanh (học song song với Python)</label><div class="row"><button class="chip" data-f="" aria-pressed="${!P.settings.focus}">Tự chọn</button>${TRACKS.filter(t=>t.k!=='py').map(t=>`<button class="chip" data-f="${t.k}" aria-pressed="${P.settings.focus===t.k}">${t.name}</button>`).join('')}</div>
    <p class="note" id="plInfo"></p>`);
  const info=()=>{$('#plInfo',m.el).textContent=`Mỗi ngày: 1 bài Python, 1 bài ${TR[focusTrack()].name}${c.minutes>=45?', thêm 1 bài nhánh khác':''}, ôn thẻ và 1 lab. Mục tiêu ${plGoalXP()} XP.`;};info();
  $$('[data-m]',m.el).forEach(b=>b.onclick=()=>{c.minutes=+b.dataset.m;$$('[data-m]',m.el).forEach(x=>x.setAttribute('aria-pressed',x===b));info();touch('main');});
  $$('[data-f]',m.el).forEach(b=>b.onclick=()=>{P.settings.focus=b.dataset.f;$$('[data-f]',m.el).forEach(x=>x.setAttribute('aria-pressed',x===b));info();touch('main');});
  const obs=new MutationObserver(()=>{if(!document.body.contains(m.el)){obs.disconnect();route();}});obs.observe(document.body,{childList:true});
}
