/* ================= BADGES and WEEKLY QUESTS ================= */
const doneN=t=>Object.entries(P.les||{}).filter(([id,r])=>r.done&&(!t||(LI.get(id)||{}).track===t)).length;
const codeN=()=>Object.values(P.code||{}).filter(r=>r.ok).length;
const robotStars=()=>Object.values((P.arc||{}).robot||{}).reduce((s,x)=>s+(x.stars||0),0);
const robotDone=()=>Object.values((P.arc||{}).robot||{}).filter(x=>x.stars).length;
const best=id=>((P.arc||{}).best||{})[id]||0;
const sumDays=k=>Object.values(P.day||{}).reduce((s,d)=>s+(d[k]||0),0);
const BADGES=[
  ['first','Bước đầu','Xong bài học đầu tiên','book-open',()=>doneN()>=1],
  ['l10','Mười bài','Xong 10 bài học','book-open',()=>doneN()>=10],
  ['l30','Ba mươi bài','Xong 30 bài học','book-open',()=>doneN()>=30],
  ['l60','Nửa chặng đường','Xong 60 bài học','map',()=>doneN()>=60],
  ['all','Tốt nghiệp','Xong toàn bộ bài học','graduation-cap',()=>LESSONS.length&&doneN()>=LESSONS.length],
  ['code1','Hello, world','Qua bài code đầu tiên','code',()=>codeN()>=1],
  ['code10','Coder','Qua 10 bài code','code',()=>codeN()>=10],
  ['code40','Pythonista','Qua 40 bài code','code',()=>codeN()>=40],
  ['py','Python vững','Xong nhánh Python','code',()=>trackLessons('py').length&&doneN('py')>=trackLessons('py').length],
  ['math','Không sợ toán','Xong nhánh Math for AI','sigma',()=>trackLessons('math').length&&doneN('math')>=trackLessons('math').length],
  ['ml','Thợ máy học','Xong nhánh Machine Learning','brain',()=>trackLessons('ml').length&&doneN('ml')>=trackLessons('ml').length],
  ['llm','Người thì thầm với LLM','Xong nhánh LLM & GenAI','sparkles',()=>trackLessons('llm').length&&doneN('llm')>=trackLessons('llm').length],
  ['robo','Kỹ sư robot','Xong nhánh Robotics','bot',()=>trackLessons('robo').length&&doneN('robo')>=trackLessons('robo').length],
  ['lab5','Nhà thí nghiệm','Thử 5 lab khác nhau','flask',()=>Object.keys(P.labs||{}).length>=5],
  ['laball','Phòng lab của riêng mình','Thử hết 17 lab','flask',()=>Object.keys(P.labs||{}).length>=17],
  ['rb1','Bit biết đi','Qua màn 1 Robot Coder','bot',()=>robotDone()>=1],
  ['rb6','Lập trình viên robot','Qua 6 màn Robot Coder','bot',()=>robotDone()>=6],
  ['rb12','Thoát mê cung','Qua cả 12 màn Robot Coder','bot',()=>robotDone()>=12],
  ['rb36','Code gọn như kỹ sư','Đủ 36 sao Robot Coder','award',()=>robotStars()>=36],
  ['po20','Đọc code như đọc báo','20 điểm một lượt Đoán output','code',()=>best('predict')>=20],
  ['bug50','Thợ săn bug','50 điểm một lượt Bug Hunt','search',()=>best('bughunt')>=50],
  ['tr20','Từ điển sống','Ghép 20 cặp một lượt Term Rush','zap',()=>best('termrush')>=20],
  ['card100','Trí nhớ dài hạn','Thuộc 100 thuật ngữ','layers',()=>TERMS.filter(t=>known(t.id)).length>=100],
  ['s3','Ba ngày liền','Chuỗi 3 ngày học','flame',()=>streak()>=3],
  ['s7','Một tuần không nghỉ','Chuỗi 7 ngày học','flame',()=>streak()>=7],
  ['s30','Thói quen thép','Chuỗi 30 ngày học','flame',()=>streak()>=30],
  ['bit','Hỏi là học','Hỏi Bit 10 lần','sparkles',()=>sumDays('bit')>=10],
  ['job','Có đích đến','Đánh dấu một nghề muốn theo','briefcase',()=>(P.favJobs||[]).length>=1],
];
let BADGE_LOCK=false;
function checkBadges(){
  if(BADGE_LOCK||!LESSONS.length)return;BADGE_LOCK=true;
  try{P.badges=P.badges||{};const fresh=BADGES.filter(b=>!P.badges[b[0]]&&(()=>{try{return b[4]();}catch(e){return false;}})());
    fresh.forEach(b=>{P.badges[b[0]]=Date.now();});
    if(fresh.length){touch('main');fresh.forEach((b,i)=>setTimeout(()=>toast('Huy hiệu mới: '+b[1]+' 🏅',3500),400+i*900));award('badge',fresh.length);}}
  finally{BADGE_LOCK=false;}
}
window.__checkBadges=checkBadges;
VIEWS.badges=el=>{
  if(!LESSONS.length){loadData().then(()=>{if(current==='badges')route();});el.innerHTML='<div class="view"><p class="note">Đang tải...</p></div>';return;}
  checkBadges();const got=P.badges||{};
  el.innerHTML=`<div class="view"><button class="btn ghost sm" data-go="arcade" style="align-self:flex-start">${ic('chevron-left')} Arcade</button>
    <div class="spread"><h2 style="margin:0">Thành tựu</h2><span class="note num">${Object.keys(got).length}/${BADGES.length}</span></div>
    <div class="bd-grid">${BADGES.map(b=>`<div class="bdg ${got[b[0]]?'on':''}"><span class="bdg-ic">${ic(b[3])}</span><b>${esc(b[1])}</b><span class="small muted">${esc(b[2])}</span>${got[b[0]]?`<span class="small ok-t">${new Date(got[b[0]]).toLocaleDateString('vi-VN')}</span>`:''}</div>`).join('')}</div></div>`;
  $$('[data-go]',el).forEach(b=>b.onclick=()=>go(b.dataset.go));
};

/* ---------- weekly quests: 3 per week, picked by week number, reward 50 XP each ---------- */
const QUESTS=[
  ['les5','Xong 5 bài học',5,w=>w.done],['code3','Qua 3 bài code',3,w=>w.code],['lab3','Thử 3 lab',3,w=>w.lab],
  ['rb2','Qua 2 màn Robot Coder',2,w=>w.robot],['po15','Trả lời đúng 15 câu Đoán output',15,w=>w.po],['bug8','Bắt 8 bug',8,w=>w.bug],
  ['term30','Ghép 30 cặp Term Rush',30,w=>w.term],['card60','Ôn 60 thẻ thuật ngữ',60,w=>w.cards],['days5','Học 5 ngày trong tuần',5,w=>w.days],['bit5','Hỏi Bit 5 câu',5,w=>w.bit],
];
function weekStats(){
  const mon=today()-((new Date(today()).getDay()+6)%7)*DAY;const w={done:0,code:0,lab:0,robot:0,po:0,bug:0,term:0,cards:0,days:0,bit:0};
  for(let d=mon;d<=today();d+=DAY){const x=(P.day||{})[ymd(d)];if(!x)continue;if(x.xp)w.days++;w.code+=x.code||0;w.lab+=x.lab||0;w.robot+=x.robot||0;w.po+=x.po||0;w.bug+=x.bug||0;w.term+=x.term||0;w.cards+=(x.card||0)+(x.cardnew||0);w.bit+=x.bit||0;}
  w.done=Object.values(P.les||{}).filter(r=>r.done>=mon).length;return {w,key:ymd(mon)};
}
function weekQuests(){const {w,key}=weekStats();const n=Math.floor(new Date(key).getTime()/(7*DAY));const pick=[0,1,2].map(i=>QUESTS[(n*3+i*4)%QUESTS.length]);return {w,key,qs:pick};}
function questsHTML(){
  const {w,key,qs}=weekQuests();const cl=(P.quests||{})[key]||{};
  setTimeout(()=>{$$('[data-claim]').forEach(b=>b.onclick=()=>{P.quests=P.quests||{};P.quests[key]=Object.assign(P.quests[key]||{},{[b.dataset.claim]:Date.now()});touch('main');award('quest',1);sfx('end');confetti({count:70});route();});},0);
  return `<div class="panel quests"><div class="spread"><h3 style="margin:0">${ic('target')} Nhiệm vụ tuần này</h3><span class="small muted">mỗi nhiệm vụ +50 XP</span></div>${qs.map(([id,t,goal,f])=>{const v=Math.min(goal,f(w)),ok=v>=goal,c=cl[id];
    return `<div class="qst ${c?'done':''}"><span class="qst-t"><b>${t}</b><span class="bar-track"><i style="width:${v/goal*100}%"></i></span></span><span class="num small">${v}/${goal}</span>${c?`<span class="bm-ok">Đã nhận</span>`:ok?`<button class="btn primary sm" data-claim="${id}">Nhận</button>`:''}</div>`;}).join('')}</div>`;
}
