/* ================= TERMS: flashcards (spaced repetition), glossary, jobs ================= */
let CD_F='all', CQ=[], CCUR=null, CREV=false, CDONE=0;
const termsFor=f=>TERMS.filter(t=>f==='all'||t.track===f);
function cardsDue(f='all'){const now=Date.now();return termsFor(f).filter(c=>P.srs[c.id]&&P.srs[c.id].due<=now).sort((a,b)=>P.srs[a.id].due-P.srs[b.id].due);}
/* new cards follow the learner: terms from tracks they have started first */
function cardsNew(f='all',limit){
  const started=new Set(Object.keys(P.les||{}).map(id=>(LI.get(id)||{}).track).filter(Boolean));
  return termsFor(f).filter(c=>!P.srs[c.id]).sort((a,b)=>(started.has(b.track)?1:0)-(started.has(a.track)?1:0)).slice(0,limit);
}
function cardQueue(){const nw=Math.max(0,(P.settings.cardsPerDay||10)-newToday());CQ=[...cardsDue(CD_F),...cardsNew(CD_F,nw)];CCUR=CQ[0]||null;CREV=false;}
VIEWS.cards=el=>{
  if(!TERMS.length){el.innerHTML='<div class="view"><p class="note">Đang tải...</p></div>';loadData().then(()=>{if(current==='cards'&&TERMS.length)route();});return;}
  if(!CQ.length||!CCUR)cardQueue();
  const due=cardsDue(CD_F).length,total=termsFor(CD_F).length,learned=termsFor(CD_F).filter(c=>known(c.id)).length;
  el.innerHTML=`<div class="view">
    ${subTabs('cdF',[['all','Tất cả'],...TRACKS.filter(t=>t.k!=='career').map(t=>[t.k,t.name])],CD_F,t=>{CD_F=t;CQ=[];VIEWS.cards(el);})}
    <p class="note" id="cdInfo">${due} thẻ đến hạn, ${CQ.length} thẻ trong lượt hôm nay, đã thuộc ${learned}/${total} (nhớ được sau 7 ngày trở lên). Lượt này: ${CDONE}.</p>
    <div id="cdBox"></div>
    <label class="row small">Thẻ mới mỗi ngày <input type="number" id="cdNew" min="0" max="50" value="${P.settings.cardsPerDay||10}" style="width:84px"></label></div>`;
  $('#cdNew').onchange=e=>{P.settings.cardsPerDay=clamp(+e.target.value||0,0,50);touch('main');CQ=[];VIEWS.cards(el);};
  const draw=()=>{const box=$('#cdBox');if(!box)return;
    if(!CCUR){box.innerHTML=`<div class="panel quiz-end">${mascot('yay',96)}<h3>Hết thẻ cho hôm nay</h3><p class="note">Thẻ mới mở thêm vào ngày mai, hoặc lấy thêm ngay.</p><div class="row"><button class="btn" id="cdMore">Thêm 5 thẻ mới</button></div></div>`;
      $('#cdMore').onclick=()=>{CQ=cardsNew(CD_F,5);CCUR=CQ[0]||null;draw();};return;}
    const c=CCUR,isNew=!P.srs[c.id];
    box.innerHTML=`<div class="card fc" id="cdC" tabindex="0" role="button" aria-label="Lật thẻ"><div class="corner"><span class="pill">${esc((TR[c.track]||{}).name||c.track)}</span>${isNew?'<span class="pill ai">mới</span>':''}</div>
      <div class="fc-front">${esc(c.en)}</div>${CREV?`<div class="fc-back"><b>${esc(c.vi)}</b><div class="small" style="margin-top:6px">${fmt(c.explain)}</div></div>`:'<p class="note">Nhớ nghĩa trong đầu rồi bấm để lật.</p>'}</div>
      ${CREV?`<div class="rate">${[['Quên',0],['Khó',1],['Nhớ',2],['Dễ',3]].map(([t,r])=>`<button class="btn ${r===2?'primary':''} r${r}" data-r="${r}">${t}<small>${ivLabel(c.id,r)}</small></button>`).join('')}</div>`:`<div class="row"><button class="btn primary" id="cdFlip">Xem nghĩa</button></div>`}`;
    const flip=()=>{if(!CREV){CREV=true;draw();}};$('#cdC').onclick=flip;$('#cdC').onkeydown=e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();flip();}};const f=$('#cdFlip');if(f)f.onclick=flip;
    $$('[data-r]',box).forEach(b=>b.onclick=()=>{const r=+b.dataset.r,wasNew=!P.srs[c.id];schedule(c.id,r);award(wasNew?'cardnew':'card',1);CDONE++;
      CQ.shift();if(r===0)CQ.splice(Math.min(CQ.length,3),0,c);CCUR=CQ[0]||null;CREV=false;draw();const n=$('#cdInfo');if(n)n.textContent=`${cardsDue(CD_F).length} thẻ đến hạn, còn ${CQ.length} thẻ trong lượt. Lượt này: ${CDONE}.`;});};
  draw();
};
document.addEventListener('keydown',e=>{if(current!=='cards'||e.target.closest('input,textarea,select'))return;if(CREV&&['1','2','3','4'].includes(e.key)){const b=$(`[data-r="${+e.key-1}"]`);b&&b.click();}});

/* ---------- glossary ---------- */
let GL_Q='',GL_T='';
VIEWS.glossary=el=>{
  if(!TERMS.length){el.innerHTML='<div class="view"><p class="note">Đang tải...</p></div>';loadData().then(()=>{if(current==='glossary'&&TERMS.length)route();});return;}
  el.innerHTML=`<div class="view"><input type="search" id="glQ" placeholder="Tìm thuật ngữ tiếng Anh hoặc tiếng Việt" value="${esc(GL_Q)}">
    <div class="row">${[['','Tất cả'],...TRACKS.filter(t=>t.k!=='career').map(t=>[t.k,t.name])].map(([k,t])=>`<button class="chip sm" data-t="${k}" aria-pressed="${GL_T===k}">${t}</button>`).join('')}</div><div class="gl-list" id="glL"></div></div>`;
  const draw=()=>{const q=fold(GL_Q.trim());const list=TERMS.filter(t=>(!GL_T||t.track===GL_T)&&(!q||fold(t.en+' '+t.vi).includes(q)));
    $('#glL').innerHTML=list.length?list.map(t=>`<div class="gl-row"><div class="gl-h"><b>${esc(t.en)}</b><span class="gl-vi">${esc(t.vi)}</span><span class="pill">${esc((TR[t.track]||{}).name||'')}</span></div><div class="small">${fmt(t.explain)}</div></div>`).join(''):'<p class="note">Không tìm thấy.</p>';};
  $('#glQ').oninput=e=>{GL_Q=e.target.value;draw();};
  $$('[data-t]',el).forEach(b=>b.onclick=()=>{GL_T=b.dataset.t;$$('[data-t]',el).forEach(x=>x.setAttribute('aria-pressed',x===b));draw();});draw();
};

/* ---------- jobs ---------- */
let JOB_OPEN=null;
VIEWS.jobs=el=>{
  if(!JOBS.length){el.innerHTML='<div class="view"><p class="note">Đang tải...</p></div>';loadData().then(()=>{if(current==='jobs'&&JOBS.length)route();});return;}
  const fav=new Set(P.favJobs||[]);
  el.innerHTML=`<div class="view"><p class="note" style="margin:0">Bản đồ nghề AI và Robotics: mỗi nghề làm gì, cần kỹ năng gì, bắt đầu từ đâu với nền product và CRM của bạn. Đánh dấu sao những nghề bạn nhắm tới.</p>
    <div class="job-grid">${JOBS.map(j=>`<button class="panel job-card ${fav.has(j.id)?'fav':''}" data-j="${esc(j.id)}"><b>${esc(j.title)}</b><span class="small muted">${esc(j.vi)}</span><span class="small">${esc(String(j.what).slice(0,140))}${String(j.what).length>140?'...':''}</span>${fav.has(j.id)?'<span class="pill ai">Đang nhắm tới</span>':''}</button>`).join('')}</div>
    <div class="row"><button class="btn" id="jbCareer">${ic('book-open')} Các bài học về nghề nghiệp</button></div></div>`;
  $$('[data-j]',el).forEach(b=>b.onclick=()=>openJob(b.dataset.j));
  $('#jbCareer').onclick=()=>{LM_TAB='career';go('learn');};
};
function openJob(id){
  const j=JOBS.find(x=>x.id===id);if(!j)return;const fav=new Set(P.favJobs||[]);
  const L=v=>Array.isArray(v)?`<ul>${v.map(x=>`<li>${fmt(x)}</li>`).join('')}</ul>`:mdBody(v);
  const m=modal(`<h2>${esc(j.title)}</h2><p class="ls-sub">${esc(j.vi)}</p><div class="job-d">${mdBody(j.what)}
    <h3>Một ngày làm việc</h3>${L(j.day)}<h3>Kỹ năng</h3><div class="terms">${(j.skills||[]).map(s=>`<span class="term">${esc(s)}</span>`).join('')}</div>
    <h3>Công cụ hay dùng</h3><div class="terms">${(j.tools||[]).map(s=>`<span class="term">${esc(s)}</span>`).join('')}</div>
    <h3>Bắt đầu từ đâu</h3>${L(j.start)}<h3>Ý tưởng portfolio</h3>${L(j.portfolio)}<h3>Câu hỏi phỏng vấn hay gặp</h3>${L(j.interview)}<h3>Có hợp với bạn không</h3>${mdBody(j.fit)}</div>
    <div class="row"><button class="btn primary" id="jbFav">${fav.has(id)?'Bỏ đánh dấu':'Đánh dấu: đang nhắm tới'}</button><button class="btn need-ai" id="jbBit" ${AI?'':'hidden'}>${ic('sparkles')} Hỏi Bit lộ trình cho nghề này</button></div>`);
  m.el.classList.add('wide');
  $('#jbFav',m.el).onclick=()=>{fav.has(id)?fav.delete(id):fav.add(id);P.favJobs=[...fav];touch('main');m.close();if(current==='jobs')route();};
  const b=$('#jbBit',m.el);if(b)b.onclick=()=>{m.close();bitOpen(`Mình muốn hướng tới nghề ${j.title}. Dựa trên tiến độ học hiện tại của mình, lập lộ trình 3 tháng cụ thể theo tuần: học gì trong app, làm project gì, khi nào bắt đầu ứng tuyển.`);};
}
