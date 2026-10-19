/* ================= LEARN: track map, lesson page (reading, terms, lab, quiz, code), Python runner ================= */
function mdBody(t){
  const out=[];let list=null,lt='ul',para=[],code=null;
  const flushP=()=>{if(para.length){out.push(`<p>${fmt(para.join(' '))}</p>`);para=[];}};
  const flushL=()=>{if(list){out.push(`<${lt}>${list.map(x=>`<li>${fmt(x)}</li>`).join('')}</${lt}>`);list=null;}};
  String(t||'').split('\n').forEach(line=>{
    if(code!==null){if(/^\s*```/.test(line)){out.push(codeBlock(code.join('\n')));code=null;}else code.push(line);return;}
    if(/^\s*```/.test(line)){flushP();flushL();code=[];return;}
    const l=line.trim();
    if(!l){flushP();flushL();return;}
    let m=l.match(/^#{1,4} (.*)/);if(m){flushP();flushL();out.push(`<h3 class="ls-h">${fmt(m[1])}</h3>`);return;}
    m=l.match(/^[-*•] (.*)/);if(m){flushP();if(list&&lt!=='ul')flushL();lt='ul';(list=list||[]).push(m[1]);return;}
    m=l.match(/^\d+[.)] (.*)/);if(m){flushP();if(list&&lt!=='ol')flushL();lt='ol';(list=list||[]).push(m[1]);return;}
    flushL();para.push(l);});
  if(code!==null)out.push(codeBlock(code.join('\n')));
  flushP();flushL();return out.join('');
}
function codeBlock(src){return `<div class="cb"><pre><code>${esc(src)}</code></pre><button class="btn ghost sm cb-run" data-src="${esc(src)}">${ic('play')} Chạy thử</button><pre class="cb-out" hidden></pre></div>`;}
function bindCodeBlocks(root){$$('.cb-run',root).forEach(b=>b.onclick=async()=>{const o=b.nextElementSibling;o.hidden=false;o.textContent='Đang chạy...';const r=await pyRun(b.dataset.src);o.textContent=(r.out||'')+(r.err?'\n'+r.err:'')||'(không in ra gì)';o.classList.toggle('err',!!r.err);});}

/* ---------- Python in the browser: Pyodide in a Web Worker (a runaway loop can be killed) ---------- */
const PYODIDE='https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';
let PYW=null, PYREADY=null, PYSEQ=0; const PYCB={};
function pyWorker(){
  if(PYW)return PYREADY;
  const src=`importScripts('${PYODIDE}pyodide.js');let py=null;
  async function boot(){py=await loadPyodide({indexURL:'${PYODIDE}'});postMessage({ready:1});}
  const ready=boot();
  onmessage=async e=>{await ready;const {id,code}=e.data;let out='';py.setStdout({batched:s=>{out+=s+'\\n';}});py.setStderr({batched:s=>{out+=s+'\\n';}});
    try{if(/\\bimport\\s+numpy|from\\s+numpy/.test(code))await py.loadPackage('numpy');
      await py.runPythonAsync(code);postMessage({id,out});}
    catch(err){let m=String(err.message||err);const lines=m.trim().split('\\n');const last=lines[lines.length-1];
      const tb=lines.filter(l=>/File "<exec>", line/.test(l)).pop();postMessage({id,out,err:last,line:tb?+(tb.match(/line (\\d+)/)||[])[1]:null,full:m});}};`;
  PYW=new Worker(URL.createObjectURL(new Blob([src],{type:'text/javascript'})));
  PYREADY=new Promise((res,rej)=>{const t=setTimeout(()=>rej(new Error('timeout')),60000);PYW.onmessage=e=>{if(e.data.ready){clearTimeout(t);res();return;}const cb=PYCB[e.data.id];if(cb){delete PYCB[e.data.id];cb(e.data);}};PYW.onerror=e=>{clearTimeout(t);rej(e);};});
  return PYREADY;
}
async function pyRun(code,{timeout=12000}={}){
  try{await pyWorker();}catch(e){PYW=null;return {err:'Không tải được Python (cần mạng để tải lần đầu, khoảng 10 MB). Thử lại sau.'};}
  return new Promise(res=>{const id=++PYSEQ;const t=setTimeout(()=>{delete PYCB[id];PYW.terminate();PYW=null;res({err:'Code chạy quá 12 giây nên bị dừng. Có thể bạn đang có một vòng lặp không bao giờ kết thúc (while True mà không có break?).'});},timeout);
    PYCB[id]=r=>{clearTimeout(t);res(r);};PYW.postMessage({id,code});});
}
function pyPreload(){setTimeout(()=>{pyWorker().catch(()=>{});},300);}
/* plain-language note for the most common Python errors */
function pyHint(err){
  const e=String(err||'');
  if(/^AssertionError/.test(e))return null;
  if(/IndentationError/.test(e))return 'Lỗi thụt lề: các dòng bên trong def, if, for phải thụt vào cùng một mức (4 dấu cách).';
  if(/SyntaxError/.test(e))return 'Lỗi cú pháp: thiếu dấu hai chấm cuối dòng def/if/for, thiếu ngoặc hoặc dấu nháy?';
  if(/NameError/.test(e))return 'NameError: dùng một tên chưa được định nghĩa. Kiểm tra chính tả tên biến hoặc tên hàm.';
  if(/TypeError/.test(e))return 'TypeError: phép tính giữa hai kiểu không hợp nhau, ví dụ cộng chữ với số. Thử chuyển kiểu bằng int(), str().';
  if(/IndexError/.test(e))return 'IndexError: truy cập vị trí vượt quá độ dài list. Nhớ là vị trí bắt đầu từ 0.';
  if(/KeyError/.test(e))return 'KeyError: dictionary không có key này. Dùng d.get(key) nếu key có thể không tồn tại.';
  if(/ZeroDivisionError/.test(e))return 'Chia cho 0. Cần kiểm tra trường hợp mẫu số bằng 0 trước.';
  if(/RecursionError/.test(e))return 'Hàm gọi lại chính nó mãi không dừng.';
  return null;
}

/* ---------- map of all tracks ---------- */
let LM_TAB=store.get('neuralis-tab','py');
VIEWS.learn=el=>{
  if(!LESSONS.length){el.innerHTML='<div class="view"><p class="note">Đang tải bài học...</p></div>';loadData().then(()=>{if(current==='learn')route();});return;}
  const tr=TR[LM_TAB]?LM_TAB:'py';
  const ls=trackLessons(tr), dn=ls.filter(l=>lesDone(l.id)).length, nx=nextLesson(tr);
  el.innerHTML=`<div class="view">
    <div class="tr-tabs">${TRACKS.map(t=>{const a=trackLessons(t.k),d=a.filter(l=>lesDone(l.id)).length;return `<button class="tr-tab ${t.k===tr?'on':''}" data-tr="${t.k}" style="--tc:${t.color}"><span class="tr-ic">${ic(t.icon)}</span><span class="tr-n"><b>${t.name}</b><span class="small muted">${d}/${a.length}</span></span><span class="tr-bar"><i style="width:${a.length?d/a.length*100:0}%"></i></span></button>`;}).join('')}</div>
    <div class="panel tr-head" style="--tc:${TR[tr].color}"><div><span class="label">${TR[tr].vi}</span><h2>${TR[tr].name}</h2><p class="small muted" style="margin:0">${dn}/${ls.length} bài xong.${nx?` Tiếp theo: <b>${esc(nx.title)}</b>.`:' Xong cả nhánh rồi!'}</p></div>${nx?`<button class="btn primary" id="lmGo">${ic('play')} Học tiếp</button>`:''}</div>
    ${units(tr).map(([u,arr],ui)=>`<div class="unit"><div class="unit-h"><span class="unit-n">${ui+1}</span><b>${esc(u)}</b><span class="small muted num">${arr.filter(l=>lesDone(l.id)).length}/${arr.length}</span></div>
      <div class="nodes">${arr.map(l=>{const d=lesDone(l.id),cur=l===nx;return `<button class="node ${d?'done':''} ${cur?'cur':''}" data-l="${esc(l.id)}"><span class="node-c">${d?ic('check'):l.code?ic('code'):l.lab?ic('flask'):ic('book-open')}</span><span class="node-t"><b>${esc(l.title)}</b><span class="small muted">${esc(l.title_vi)}</span><span class="node-m">${l.minutes||10} phút${l.code?' · code':''}${l.lab?' · lab':''}${l.level>=3?' · nâng cao':''}</span></span></button>`;}).join('')}</div></div>`).join('')}
  </div>`;
  $$('[data-tr]',el).forEach(b=>b.onclick=()=>{LM_TAB=b.dataset.tr;store.set('neuralis-tab',LM_TAB);VIEWS.learn(el);});
  $$('[data-l]',el).forEach(b=>b.onclick=()=>openLesson(b.dataset.l));
  const g=$('#lmGo');if(g)g.onclick=()=>openLesson(nx.id);
};

/* ---------- lesson page ---------- */
let LS_ID=null;
function openLesson(id){LS_ID=id;const l=LI.get(id);if(l){LM_TAB=l.track;store.set('neuralis-tab',LM_TAB);}go('lesson');}
VIEWS.lesson=el=>{
  const l=LI.get(LS_ID);
  if(!l){if(!LESSONS.length){el.innerHTML='<div class="view"><p class="note">Đang tải...</p></div>';loadData().then(()=>{if(current==='lesson')route();});return;}go('learn');return;}
  const r=P.les[l.id]||(P.les[l.id]={});
  if(!r.read){r.read=Date.now();touch('main');award('read',1);}
  const ul=trackLessons(l.track), i=ul.indexOf(l), prev=ul[i-1], next=ul[i+1];
  el.innerHTML=`<div class="view lesson" style="--tc:${TR[l.track].color}">
    <div class="ls-top"><button class="btn ghost sm" id="lsBack">${ic('chevron-left')} ${TR[l.track].name}</button><span class="small muted">${esc(l.unit)}, bài ${i+1}/${ul.length}</span></div>
    <div><h2 class="ls-title">${esc(l.title)}</h2><p class="ls-sub">${esc(l.title_vi)}</p><div class="q-meta"><span class="pill">${l.minutes||10} phút</span><span class="pill">${['','Cơ bản','Trung bình','Nâng cao'][l.level]||''}</span>${l.code?'<span class="pill ai">Có bài code</span>':''}${l.lab?'<span class="pill ai">Có lab</span>':''}</div></div>
    <article class="panel ls-body">${mdBody(l.body)}</article>
    ${(l.terms||[]).length?`<div class="panel"><h3>Thuật ngữ trong bài</h3><div class="terms">${l.terms.map(t=>`<span class="term"><b>${esc(t.en)}</b> ${esc(t.vi)}</span>`).join('')}</div></div>`:''}
    ${l.lab&&LABS[l.lab]?`<div class="panel lab-in"><div class="spread"><h3>${ic('flask')} Lab: ${esc(LABS[l.lab].name)}</h3><button class="btn ghost sm" id="lsLabFull">Mở rộng</button></div><p class="small muted" style="margin:0">${esc(LABS[l.lab].vi)}</p><div id="lsLab" class="lab-box"></div></div>`:''}
    <div class="panel" id="lsQuiz"></div>
    ${l.code?`<div class="panel" id="lsCode"></div>`:''}
    <div class="panel takeaway">${ic('lightbulb')}<span><b>Ghi nhớ:</b> ${fmt(l.takeaway||'')}</span></div>
    <div id="lsDone"></div>
    <div class="row ls-nav">${prev?`<button class="btn" id="lsPrev">${ic('chevron-left')} ${esc(prev.title)}</button>`:''}<button class="btn need-ai" id="lsAsk" ${AI?'':'hidden'}>${ic('sparkles')} Hỏi Bit về bài này</button>${next?`<button class="btn" id="lsNext">${esc(next.title)} ${ic('chevron-right')}</button>`:''}</div>
  </div>`;
  bindCodeBlocks(el);
  $('#lsBack').onclick=()=>go('learn');
  if(prev)$('#lsPrev').onclick=()=>openLesson(prev.id);
  if(next)$('#lsNext').onclick=()=>openLesson(next.id);
  const as=$('#lsAsk');if(as)as.onclick=()=>bitOpen(`Mình đang học bài "${l.title}" (${l.title_vi}). Giải thích lại ý chính theo cách khác, thêm một ví dụ đời thường và một ví dụ trong công việc thực tế.`,l.id);
  if(l.lab&&LABS[l.lab]){const box=$('#lsLab');runLab(l.lab,box);$('#lsLabFull').onclick=()=>openLab(l.lab);}
  drawQuiz(l);
  if(l.code)drawCode(l,$('#lsCode'));
  drawDone(l);
  if(l.code)pyPreload();
  window.__leave=()=>{stopLabs();};
};
function drawDone(l){
  const box=$('#lsDone');if(!box)return;
  const r=P.les[l.id]||{}, ok=lessonComplete(l);
  if(ok&&!r.done){r.done=Date.now();P.les[l.id]=r;touch('main');sfx('end');if(typeof uiChips==='function')uiChips();}
  const need=[];if((r.quiz||0)<3)need.push('đúng ít nhất 3/4 câu quiz');if(l.code&&!(P.code[l.id]&&P.code[l.id].ok))need.push('qua bài code');
  box.innerHTML=r.done?mcSay('yay','Xong bài này rồi! '+(LI.get(l.id)&&trackLessons(l.track)[trackLessons(l.track).indexOf(l)+1]?'Bấm bài tiếp theo bên dưới khi sẵn sàng.':'Bạn đã đi hết nhánh này.'),56)
    :`<p class="note">Để hoàn thành bài: ${need.join(' và ')}.</p>`;
}
function drawQuiz(l){
  const box=$('#lsQuiz');const qs=l.quiz||[];let i=0,score=0;
  const r=P.les[l.id]||{};
  const draw=()=>{
    if(i>=qs.length){const best=Math.max(r.quiz||0,score);r.quiz=best;P.les[l.id]=r;touch('main');
      box.innerHTML=`<h3>Kiểm tra nhanh</h3><p>Đúng <b>${score}/${qs.length}</b>${best>score?` (tốt nhất ${best})`:''}. ${score>=3?'Nắm được ý chính rồi.':'Đọc lại phần bài học rồi làm lại nhé.'}</p><div class="row"><button class="btn sm" id="qzRe">Làm lại</button></div>`;
      $('#qzRe',box).onclick=()=>{i=0;score=0;draw();};drawDone(l);return;}
    const q=qs[i];
    box.innerHTML=`<div class="spread"><h3>Kiểm tra nhanh</h3><span class="small muted num">${i+1}/${qs.length}</span></div><div class="qz-q">${fmt(q.q)}</div><div class="opts gq-opts">${q.choices.map((c,k)=>`<button class="opt gopt" data-k="${k}"><span class="ol">${'ABCD'[k]}</span><span class="ot">${fmt(c)}</span></button>`).join('')}</div><div id="qzW"></div>`;
    $$('[data-k]',box).forEach(b=>b.onclick=()=>{const k=+b.dataset.k,ok=k===q.answer;if(ok)score++;award('quiz',ok?1:0);sfx(ok?'ok':'bad');
      $$('[data-k]',box).forEach((y,j)=>{y.disabled=true;if(j===q.answer)y.classList.add('right');else if(j===k)y.classList.add('wrong');});
      $('#qzW',box).innerHTML=`<div class="fb ${ok?'ok':'bad'}"><b>${ok?'Đúng rồi.':'Chưa đúng.'}</b> ${fmt(q.why)}</div><button class="btn primary" id="qzN">${i+1<qs.length?'Câu tiếp':'Xem kết quả'} ${ic('chevron-right')}</button>`;
      $('#qzN',box).onclick=()=>{i++;draw();};});
  };
  if(r.quiz!=null&&r.quiz>=3){box.innerHTML=`<h3>Kiểm tra nhanh</h3><p class="small">Bạn đã làm, tốt nhất <b>${r.quiz}/${qs.length}</b>.</p><button class="btn sm" id="qzRe">Làm lại</button>`;$('#qzRe',box).onclick=()=>{draw();};}
  else draw();
}
/* ---------- code exercise ---------- */
function editorHTML(id,src,rows){return `<textarea class="code-ed" id="${id}" spellcheck="false" autocapitalize="off" autocomplete="off" rows="${rows||12}">${esc(src)}</textarea>`;}
function bindEditor(ta){
  ta.addEventListener('keydown',e=>{
    if(e.key==='Tab'){e.preventDefault();const s=ta.selectionStart,en=ta.selectionEnd;ta.setRangeText('    ',s,en,'end');}
    else if(e.key==='Enter'){const s=ta.selectionStart;const line=ta.value.slice(0,s).split('\n').pop();let ind=(line.match(/^\s*/)||[''])[0];if(/:\s*$/.test(line))ind+='    ';e.preventDefault();ta.setRangeText('\n'+ind,s,ta.selectionEnd,'end');}
  });
}
function drawCode(l,box){
  const c=l.code, saved=P.code[l.id]||{};
  box.innerHTML=`<div class="spread"><h3>${ic('code')} Bài code</h3>${saved.ok?`<span class="bm-ok">Đã qua</span>`:''}</div>
    <div class="code-prompt">${mdBody(c.prompt)}</div>
    ${editorHTML('cdEd',saved.src||c.starter,Math.min(22,Math.max(8,(saved.src||c.starter).split('\n').length+3)))}
    <div class="row"><button class="btn primary" id="cdTest">${ic('check')} Chạy và kiểm tra</button><button class="btn" id="cdRun">${ic('play')} Chỉ chạy</button><button class="btn ghost sm" id="cdHint">${ic('lightbulb')} Gợi ý</button><button class="btn ghost sm need-ai" id="cdBit" ${AI?'':'hidden'}>${ic('sparkles')} Bit xem code</button><button class="btn ghost sm" id="cdReset">Làm lại từ đầu</button>${(saved.tries||0)>=3||saved.ok?`<button class="btn ghost sm" id="cdSol">Xem lời giải</button>`:''}</div>
    <div id="cdOut"></div>`;
  const ta=$('#cdEd',box);bindEditor(ta);
  const save=()=>{const s=ta.value;P.code[l.id]=Object.assign(P.code[l.id]||{},{src:s.length<6000?s:s.slice(0,6000)});touch('main');};
  let tmr=null;ta.oninput=()=>{clearTimeout(tmr);tmr=setTimeout(save,800);};
  const out=$('#cdOut',box);
  const show=(r,tested)=>{
    const hint=pyHint(r.err);
    if(tested&&!r.err){out.innerHTML=`<div class="fb ok"><b>Qua hết các bài kiểm tra!</b> ${r.out?`<pre class="cb-out">${esc(r.out)}</pre>`:''}</div>`;return;}
    out.innerHTML=`${r.out?`<pre class="cb-out">${esc(r.out)}</pre>`:''}${r.err?`<div class="fb bad"><b>${/^AssertionError/.test(r.err)?'Chưa qua: ':'Lỗi: '}</b>${esc(r.err.replace(/^AssertionError:?\s*/,''))||'một bài kiểm tra chưa đúng'}${r.line&&!/^AssertionError/.test(r.err)?` <span class="small">(dòng ${r.line})</span>`:''}${hint?`<div class="small" style="margin-top:4px">${esc(hint)}</div>`:''}</div>`:(tested?'':'<p class="note">Chạy xong, không có lỗi.</p>')}`;};
  $('#cdRun',box).onclick=async()=>{save();out.innerHTML='<p class="note">Đang chạy... (lần đầu cần tải Python, chờ chút)</p>';show(await pyRun(ta.value),false);};
  $('#cdTest',box).onclick=async()=>{save();out.innerHTML='<p class="note">Đang kiểm tra... (lần đầu cần tải Python, chờ chút)</p>';
    const r=await pyRun(ta.value+'\n\n'+c.tests);const rec=P.code[l.id]=Object.assign(P.code[l.id]||{},{tries:((P.code[l.id]||{}).tries||0)+1});
    if(!r.err){const first=!rec.ok;rec.ok=Date.now();touch('main');sfx('ok');if(first)award('code',1);show(r,true);drawDone(l);if(first)setTimeout(()=>drawCode(l,box),1200);}
    else{touch('main');sfx('bad');show(r,true);if(rec.tries===3)drawCode(l,box),show(r,true);}};
  $('#cdHint',box).onclick=()=>{out.innerHTML=`<div class="hint"><b>Gợi ý:</b> ${fmt(c.hint)}</div>`;};
  $('#cdReset',box).onclick=async()=>{if(await confirmBox('Làm lại từ đầu?','Code hiện tại sẽ bị thay bằng code ban đầu.','Làm lại','Thôi')){ta.value=c.starter;save();out.innerHTML='';}};
  const sb=$('#cdSol',box);if(sb)sb.onclick=()=>{out.innerHTML=`<p class="small muted">Một lời giải mẫu (có nhiều cách đúng):</p><pre class="cb-out sol">${esc(c.solution)}</pre>`;};
  const bb=$('#cdBit',box);if(bb)bb.onclick=async()=>{const last=out.innerText.slice(0,800);bitReview(l,ta.value,last);};
}

/* ---------- Python playground ---------- */
VIEWS.python=el=>{
  const src=store.get('neuralis-play','# Viết Python ở đây rồi bấm Chạy\nname = "Stalis"\nfor i in range(3):\n    print(f"Xin chào {name}, lần {i + 1}")\n');
  const done=LESSONS.filter(l=>l.code&&P.code[l.id]&&P.code[l.id].ok).length, all=LESSONS.filter(l=>l.code).length;
  el.innerHTML=`<div class="view">
    <div class="panel"><div class="spread"><h3>${ic('code')} Sân chơi Python</h3><span class="small muted">Python 3.12 chạy ngay trong trình duyệt</span></div>
      ${editorHTML('pyEd',src,14)}
      <div class="row"><button class="btn primary" id="pyRun">${ic('play')} Chạy</button><button class="btn ghost sm need-ai" id="pyBit" ${AI?'':'hidden'}>${ic('sparkles')} Hỏi Bit về code này</button></div><div id="pyOut"></div>
      <p class="note">Có sẵn thư viện chuẩn và numpy. Lần chạy đầu cần tải khoảng 10 MB nên hơi lâu, các lần sau nhanh.</p></div>
    <div class="panel"><div class="spread"><h3>Bài code trong các bài học</h3><span class="small muted num">${done}/${all} đã qua</span></div>
      <div class="rv-list">${LESSONS.filter(l=>l.code).map(l=>{const ok=P.code[l.id]&&P.code[l.id].ok;return `<button class="rv-row" data-l="${esc(l.id)}"><span class="rv-ic ${ok?'ok':''}">${ok?ic('check'):ic('code')}</span><span class="rv-t"><b>${esc(l.title)}</b><span class="small muted">${TR[l.track].name}, ${esc(l.title_vi)}</span></span></button>`;}).join('')}</div></div></div>`;
  const ta=$('#pyEd');bindEditor(ta);ta.oninput=()=>store.set('neuralis-play',ta.value);
  $('#pyRun').onclick=async()=>{const o=$('#pyOut');o.innerHTML='<p class="note">Đang chạy...</p>';const r=await pyRun(ta.value);const h=pyHint(r.err);
    o.innerHTML=`<pre class="cb-out ${r.err?'err':''}">${esc((r.out||'')+(r.err?'\n'+r.err:'')||'(không in ra gì)')}</pre>${h?`<p class="small">${esc(h)}</p>`:''}`;};
  const b=$('#pyBit');if(b)b.onclick=()=>bitOpen('Giải thích đoạn code Python này cho mình từng dòng, và gợi ý cách viết gọn hơn nếu có:\n\n```\n'+ta.value.slice(0,3000)+'\n```');
  $$('[data-l]',el).forEach(x=>x.onclick=()=>openLesson(x.dataset.l));
  pyPreload();
};
