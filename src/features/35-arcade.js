/* ================= ARCADE: Robot Coder, Predict the output, Bug hunt, Term rush ================= */
let ARC=null, RWORLD=null;
function loadArcade(){if(ARC)return Promise.resolve(ARC);return Promise.all([loadJSON('arcade').catch(()=>({predict:[],bugs:[]})),loadJSON('robot').catch(()=>[]),fetch('data/robot_world.py').then(r=>r.text()).catch(()=>'')]).then(([a,r,w])=>{ARC=Object.assign({robot:r},a);RWORLD=w;return ARC;});}
function arc(){P.arc=P.arc||{robot:{},best:{}};P.arc.robot=P.arc.robot||{};P.arc.best=P.arc.best||{};return P.arc;}
const GAMES=[
  {id:'robot',name:'Robot Coder',vi:'Viết Python điều khiển Bit qua 12 màn mê cung',icon:'bot'},
  {id:'predict',name:'Đoán output',vi:'Đọc code, đoán kết quả in ra trước khi hết giờ',icon:'code'},
  {id:'bughunt',name:'Bug Hunt',vi:'Tìm dòng code bị lỗi, càng nhanh càng nhiều điểm',icon:'search'},
  {id:'termrush',name:'Term Rush',vi:'Ghép thuật ngữ với nghĩa tiếng Việt trong 60 giây',icon:'zap'},
];
VIEWS.arcade=el=>{
  const a=arc(), rb=Object.values(a.robot).filter(x=>x.stars).length;
  el.innerHTML=`<div class="view">
    ${typeof questsHTML==='function'?questsHTML():''}
    <div class="arc-grid">${GAMES.map(g=>`<button class="panel arc-card" data-g="${g.id}"><span class="arc-ic">${ic(g.icon)}</span><span><b>${g.name}</b><span class="small muted">${g.vi}</span>
      <span class="small arc-best">${g.id==='robot'?`${rb}/12 màn, ${Object.values(a.robot).reduce((s,x)=>s+(x.stars||0),0)}/36 sao`:a.best[g.id]?`Kỷ lục: ${a.best[g.id]} điểm`:'Chưa chơi'}</span></span></button>`).join('')}</div>
    <button class="panel cul-inv" data-go="badges"><span class="cul-ic">${ic('award')}</span><span style="min-width:0"><span class="label">Thành tựu</span><b class="cul-t">${Object.keys(P.badges||{}).length}/${BADGES.length} huy hiệu</b></span>${ic('chevron-right')}</button></div>`;
  $$('[data-g]',el).forEach(b=>b.onclick=()=>go(b.dataset.g));
  $$('[data-go]',el).forEach(b=>b.onclick=()=>go(b.dataset.go));
};
function arcBest(id,score){const a=arc();const rec=score>(a.best[id]||0);if(rec)a.best[id]=score;touch('main');return rec;}

/* ---------- Robot Coder ---------- */
let RB_LV=null;
VIEWS.robot=el=>{
  if(!ARC){el.innerHTML='<div class="view"><p class="note">Đang tải...</p></div>';loadArcade().then(()=>{if(current==='robot')route();});return;}
  pyPreload();
  const a=arc(), L=ARC.robot;
  if(!RB_LV){
    const firstOpen=L.find(l=>!(a.robot[l.n]||{}).stars);
    el.innerHTML=`<div class="view"><button class="btn ghost sm" data-go="arcade" style="align-self:flex-start">${ic('chevron-left')} Arcade</button>
      <div class="panel ex-intro">${mascot('hi',80)}<div><h2 style="margin:0">Robot Coder</h2><p class="small" style="margin:4px 0 0">Viết Python để đưa Bit tới ô cờ. Mỗi màn dạy thêm một ý: vòng lặp, điều kiện, hàm, thuật toán bám tường. Code càng gọn càng nhiều sao.</p></div></div>
      <div class="rb-levels">${L.map((l,i)=>{const r=a.robot[l.n]||{};const lock=i>0&&!(a.robot[L[i-1].n]||{}).stars;return `<button class="rb-lv ${r.stars?'done':''} ${l===firstOpen?'cur':''}" data-lv="${l.n}" ${lock?'disabled':''}><span class="num rb-n">${l.n}</span><span class="rb-t">${esc(l.title)}</span><span class="rb-s">${[1,2,3].map(k=>`<i class="${(r.stars||0)>=k?'on':''}">★</i>`).join('')}</span></button>`;}).join('')}</div></div>`;
    $$('[data-lv]',el).forEach(b=>b.onclick=()=>{RB_LV=+b.dataset.lv;VIEWS.robot(el);});$$('[data-go]',el).forEach(b=>b.onclick=()=>go(b.dataset.go));return;}
  const l=L.find(x=>x.n===RB_LV), r=a.robot[l.n]||{};
  el.innerHTML=`<div class="view"><div class="spread"><button class="btn ghost sm" id="rbBack">${ic('chevron-left')} Các màn</button><span class="small muted">Màn ${l.n}/12</span></div>
    <div><h2 style="margin:0">${esc(l.title)}</h2><p class="small" style="margin:4px 0 0">${esc(l.goal)}</p><p class="small muted" style="margin:4px 0 0">Lệnh mới: <code class="ic">${esc(l.cmds)}</code>. Mục tiêu 3 sao: tối đa ${l.par} dòng code.${l.maps.length>1?` Code chạy trên ${l.maps.length} bản đồ.`:''}</p></div>
    <div class="rb-wrap"><div class="panel rb-stage"><div id="rbMap"></div><div class="row rb-tabs">${l.maps.length>1?l.maps.map((_,i)=>`<button class="chip sm" data-m="${i}" aria-pressed="${i===0}">Bản đồ ${i+1}</button>`).join(''):''}</div><div id="rbMsg" class="small"></div></div>
    <div class="panel rb-code">${editorHTML('rbEd',r.code||l.start||'',12)}
      <div class="row"><button class="btn primary" id="rbRun">${ic('play')} Chạy</button><button class="btn ghost sm" id="rbRef">Lệnh có sẵn</button>${(r.tries||0)>=3||r.stars?'<button class="btn ghost sm" id="rbSol">Xem lời giải</button>':''}<button class="btn ghost sm need-ai" id="rbBit" ${AI?'':'hidden'}>${ic('sparkles')} Hỏi Bit</button></div><div id="rbOut"></div></div></div></div>`;
  const ta=$('#rbEd');bindEditor(ta);
  let mi=0, anim=null;
  const drawMap=(state)=>{const m=l.maps[mi],R=m.length,C=Math.max(...m.map(x=>x.length));const box=$('#rbMap');
    const s=Math.max(18,Math.min(44,Math.floor(Math.min((box.clientWidth||420)-4,520)/C)));
    if(!box.firstChild||box.dataset.k!==mi+'|'+s){box.innerHTML='';box.dataset.k=mi+'|'+s;const g=mkCanvas(box,R*s+4);box._g=g;}
    const {ctx,W}=box._g;ctx.clearRect(0,0,W,R*s+4);const ox=Math.floor((W-C*s)/2);
    let pos=null,coins=new Set();
    m.forEach((row,ri)=>[...row].forEach((ch,ci)=>{if(ch==='c')coins.add(ri+','+ci);if('^>v<'.includes(ch))pos=[ri,ci,'^>v<'.indexOf(ch)];}));
    if(state){pos=[state[0],state[1],state[2]];coins=new Set(state[4].map(x=>x.join(',')));}
    m.forEach((row,ri)=>[...row].forEach((ch,ci)=>{const x=ox+ci*s,y=ri*s+2;ctx.fillStyle=ch==='#'?cssv('--accent'):cssv('--sunk');ctx.fillRect(x+1,y+1,s-2,s-2);
      if(ch==='G'){ctx.fillStyle=cssv('--ok');ctx.fillRect(x+s*.3,y+s*.2,s*.08,s*.6);ctx.beginPath();ctx.moveTo(x+s*.38,y+s*.2);ctx.lineTo(x+s*.75,y+s*.32);ctx.lineTo(x+s*.38,y+s*.45);ctx.fill();}
      if(coins.has(ri+','+ci)){ctx.fillStyle='#F2C14E';ctx.beginPath();ctx.arc(x+s/2,y+s/2,s*.2,0,7);ctx.fill();ctx.strokeStyle='#C99A1E';ctx.stroke();}}));
    if(pos){const x=ox+pos[1]*s+s/2,y=pos[0]*s+2+s/2;ctx.save();ctx.translate(x,y);ctx.rotate(pos[2]*Math.PI/2);ctx.fillStyle=cssv('--orange');ctx.beginPath();ctx.roundRect?ctx.roundRect(-s*.32,-s*.32,s*.64,s*.64,s*.15):ctx.rect(-s*.32,-s*.32,s*.64,s*.64);ctx.fill();
      ctx.fillStyle='#5EF2D3';ctx.fillRect(-s*.2,-s*.18,s*.12,s*.12);ctx.fillRect(s*.08,-s*.18,s*.12,s*.12);ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(0,-s*.46);ctx.lineTo(-s*.1,-s*.33);ctx.lineTo(s*.1,-s*.33);ctx.fill();ctx.restore();}};
  drawMap();
  $$('[data-m]',el).forEach(b=>b.onclick=()=>{mi=+b.dataset.m;$$('[data-m]',el).forEach(x=>x.setAttribute('aria-pressed',x===b));if(anim)anim();drawMap();});
  $('#rbBack').onclick=()=>{RB_LV=null;VIEWS.robot(el);};
  $('#rbRef').onclick=()=>modal(`<h2>Lệnh điều khiển Bit</h2><div class="ls-body">${mdBody(`- \`move()\` đi tới 1 ô theo hướng đang nhìn. Đâm tường là thua.\n- \`turn_left()\`, \`turn_right()\` quay 90 độ tại chỗ.\n- \`pick()\` nhặt đồng xu ở ô đang đứng.\n- \`front_is_clear()\`, \`left_is_clear()\`, \`right_is_clear()\` trả về True nếu phía đó không có tường.\n- \`coin_here()\` True nếu ô hiện tại có xu.\n- \`at_goal()\` True nếu đang đứng ở ô cờ.\n\nThắng khi đứng ở ô cờ và đã nhặt hết xu. Tối đa 400 lệnh mỗi lần chạy.`)}</div>`);
  const sb=$('#rbSol');if(sb)sb.onclick=()=>{$('#rbOut').innerHTML=`<p class="small muted">Một lời giải (${l.par} dòng):</p><pre class="cb-out sol">${esc(l.sol)}</pre>`;};
  const bb=$('#rbBit');if(bb)bb.onclick=()=>bitOpen(`Mình đang chơi Robot Coder màn "${l.title}": ${l.goal}\nBản đồ (# là tường, G là đích, c là xu, mũi tên là robot):\n${l.maps[0].join('\n')}\nCode của mình:\n\`\`\`python\n${ta.value}\n\`\`\`\nGợi ý cho mình hướng nghĩ, đừng đưa lời giải đầy đủ.`);
  $('#rbRun').onclick=async()=>{
    const code=ta.value; r.code=code;r.tries=(r.tries||0)+1;a.robot[l.n]=r;touch('main');
    $('#rbOut').innerHTML='<p class="note">Đang chạy...</p>';
    const prog=`${RWORLD}\nimport json as _j\n_res=[]\n_CODE=${JSON.stringify(code)}\nfor _m in ${JSON.stringify(l.maps)}:\n    W=_World(_m)\n    _err=None\n    try:\n        exec(_CODE, globals())\n    except RobotCrash as _e:\n        _err=str(_e)\n    _res.append({'trace':W.trace,'ok':at_goal() and not W.coins and not _err,'err':_err,'coins':len(W.coins)})\nprint('__T__'+_j.dumps(_res))`;
    const out=await pyRun(prog);
    if(out.err){const h=pyHint(out.err);$('#rbOut').innerHTML=`<div class="fb bad"><b>Lỗi Python:</b> ${esc(out.err)}${h?`<div class="small">${esc(h)}</div>`:''}</div>`;sfx('bad');return;}
    const line=(out.out||'').split('\n').find(x=>x.startsWith('__T__'));const res=JSON.parse(line.slice(5));
    const printed=(out.out||'').split('\n').filter(x=>x&&!x.startsWith('__T__')).join('\n');
    const fail=res.findIndex(x=>!x.ok), show=fail>=0?fail:res.length-1; mi=show;$$('[data-m]',el).forEach((x,i)=>x.setAttribute('aria-pressed',i===mi));
    const tr=res[show].trace;let k=0,f=0;if(anim)anim();
    anim=labLoop(()=>{if(++f%Math.max(4,Math.round(36/Math.max(1,tr.length/12)))!==0)return;drawMap(tr[k]);k++;if(k>=tr.length){anim();anim=null;finish();}});
    const finish=()=>{
      const lines=code.split('\n').filter(x=>x.trim()&&!x.trim().startsWith('#')).length;
      if(fail<0){const st=lines<=l.par?3:lines<=Math.ceil(l.par*1.6)?2:1;const first=!r.stars;const better=st>(r.stars||0);r.stars=Math.max(r.stars||0,st);r.lines=lines;a.robot[l.n]=r;touch('main');
        if(first)award('robot',1);sfx('end');if(first&&l.n===12)confetti();
        $('#rbOut').innerHTML=`<div class="fb ok"><b>Bit tới đích!</b> ${'★'.repeat(st)}${'☆'.repeat(3-st)} (${lines} dòng code${st<3?`, thử rút còn ${l.par} dòng để được 3 sao`:''})${better&&!first?' Kỷ lục mới!':''}</div>${printed?`<pre class="cb-out">${esc(printed)}</pre>`:''}${l.n<12?`<div class="row"><button class="btn primary" id="rbNext">Màn tiếp ${ic('chevron-right')}</button></div>`:''}`;
        const n=$('#rbNext');if(n)n.onclick=()=>{RB_LV=l.n+1;VIEWS.robot(el);};checkBadges();}
      else{const x=res[fail];sfx('bad');$('#rbOut').innerHTML=`<div class="fb bad"><b>Chưa được${res.length>1?` (bản đồ ${fail+1})`:''}:</b> ${esc(x.err||(x.coins?`còn ${x.coins} đồng xu chưa nhặt.`:'Bit chưa tới ô cờ.'))}</div>${printed?`<pre class="cb-out">${esc(printed)}</pre>`:''}`;}
      if(!$('#rbSol')&&r.tries>=3){const row=$('#rbRun').parentElement;row.insertAdjacentHTML('beforeend','<button class="btn ghost sm" id="rbSol">Xem lời giải</button>');$('#rbSol').onclick=()=>{$('#rbOut').insertAdjacentHTML('beforeend',`<p class="small muted">Một lời giải (${l.par} dòng):</p><pre class="cb-out sol">${esc(l.sol)}</pre>`);};}
    };
  };
  window.__leave=stopLabs;
};

/* ---------- shared timer game frame ---------- */
function gameFrame(el,{title,secs,intro,onStart}){
  el.innerHTML=`<div class="view"><button class="btn ghost sm" id="gfBack" style="align-self:flex-start">${ic('chevron-left')} Arcade</button><div class="panel ex-intro">${mascot('idea',80)}<div><h2 style="margin:0">${title}</h2><p class="small">${intro}</p><div class="row"><button class="btn primary" id="gfGo">${ic('play')} Bắt đầu</button></div></div></div></div>`;
  $('#gfBack').onclick=()=>go('arcade');$('#gfGo').onclick=onStart;
}
function gameEnd(el,{id,score,lines,again}){
  const rec=arcBest(id,score);window.__busy=false;if(score)award('game',Math.min(30,score));sfx('end');if(rec&&score)confetti({count:80});checkBadges();
  el.innerHTML=`<div class="view"><div class="panel quiz-end">${mascot(rec?'yay':'ok',96)}<h2>${score} điểm</h2><p class="note">${rec?'Kỷ lục mới!':`Kỷ lục: ${arc().best[id]||0}`}</p>${lines||''}<div class="row" style="justify-content:center"><button class="btn primary" id="geA">Chơi lại</button><button class="btn ghost" id="geB">Arcade</button></div></div></div>`;
  $('#geA').onclick=again;$('#geB').onclick=()=>go('arcade');
}
function pyLevelCap(){const n=Object.values(P.les||{}).filter(r=>r.done).length;const py=trackLessons('py').filter(l=>lesDone(l.id)).length;return py>=20?3:py>=8?2:n>=3?2:1;}

/* ---------- Predict the output ---------- */
VIEWS.predict=el=>{
  if(!ARC){loadArcade().then(()=>{if(current==='predict')route();});el.innerHTML='<div class="view"><p class="note">Đang tải...</p></div>';return;}
  const start=()=>{const cap=pyLevelCap();const pool=shuffle(ARC.predict.filter(x=>x.level<=cap)).concat(shuffle(ARC.predict.filter(x=>x.level>cap)));
    let i=0,score=0,combo=0,miss=[],left=90;window.__busy=true;
    el.innerHTML=`<div class="view"><div class="spread"><span class="timer-chip num" id="poT">${ic('clock')}<span>1:30</span></span><span class="num"><b id="poS">0</b> điểm <span class="pill" id="poC"></span></span></div><div id="poBox"></div></div>`;
    const tm=makeTimer(90,l=>{left=l;const t=$('#poT span');if(t)t.textContent=fmtTime(l);},()=>end());window.__leave=()=>tm.stop();
    const draw=()=>{const q=pool[i%pool.length];
      $('#poBox').innerHTML=`<div class="panel"><div class="small muted">${esc(q.topic)} · Code này in ra gì?</div><div class="cb"><pre><code>${esc(q.code)}</code></pre></div><div class="opts po-opts">${q.choices.map((c,k)=>`<button class="opt po-o" data-k="${k}"><pre>${esc(c)}</pre></button>`).join('')}</div><div id="poW"></div></div>`;
      $$('[data-k]',el).forEach(b=>b.onclick=()=>{const k=+b.dataset.k,ok=k===q.answer;$$('[data-k]',el).forEach((y,j)=>{y.disabled=true;if(j===q.answer)y.classList.add('right');else if(j===k)y.classList.add('wrong');});
        if(ok){combo++;score+=1+Math.min(4,Math.floor(combo/3));sfx('ok');award('po',1);}else{combo=0;miss.push(q);sfx('bad');}
        $('#poS').textContent=score;$('#poC').textContent=combo>=3?`combo x${1+Math.min(4,Math.floor(combo/3))}`:'';
        if(ok){setTimeout(()=>{i++;if(left>0)draw();},450);}
        else{$('#poW').innerHTML=`<div class="fb bad">${fmt(q.why)}</div><button class="btn primary sm" id="poN">Tiếp</button>`;$('#poN').onclick=()=>{i++;draw();};}});};
    const end=()=>{tm.stop();gameEnd(el,{id:'predict',score,lines:miss.length?`<p class="small">Xem lại: ${miss.slice(0,4).map(q=>`<code class="ic">${esc(q.topic)}</code>`).join(' ')}</p>`:'',again:start});};
    draw();};
  gameFrame(el,{title:'Đoán output',intro:'90 giây. Mỗi đoạn code ngắn, chọn đúng thứ nó in ra. Đúng liên tiếp 3 câu được nhân điểm. Đây là kỹ năng đọc code, thứ kỹ sư dùng mỗi ngày.',onStart:start});
};

/* ---------- Bug hunt ---------- */
VIEWS.bughunt=el=>{
  if(!ARC){loadArcade().then(()=>{if(current==='bughunt')route();});el.innerHTML='<div class="view"><p class="note">Đang tải...</p></div>';return;}
  const start=()=>{const cap=pyLevelCap();const pool=shuffle(ARC.bugs.filter(x=>x.level<=cap)).concat(shuffle(ARC.bugs.filter(x=>x.level>cap))).slice(0,8);
    let i=0,score=0,t0=Date.now();window.__busy=true;
    const draw=()=>{if(i>=pool.length){gameEnd(el,{id:'bughunt',score,again:start});return;}const q=pool[i];t0=Date.now();
      el.innerHTML=`<div class="view"><div class="spread"><span class="small muted num">Bug ${i+1}/${pool.length}</span><span class="num"><b>${score}</b> điểm</span></div>
        <div class="panel"><p class="small" style="margin:0"><b>Mục đích:</b> ${fmt(q.goal)}</p><p class="small muted" style="margin:0">Bấm vào dòng có lỗi.</p>
        <div class="bug-code">${q.code.split('\n').map((ln,k)=>`<button class="bug-ln" data-l="${k+1}"><span class="num">${k+1}</span><code>${esc(ln)||' '}</code></button>`).join('')}</div><div id="bgW"></div></div></div>`;
      $$('[data-l]',el).forEach(b=>b.onclick=()=>{const ln=+b.dataset.l,ok=ln===q.bug_line,secs=(Date.now()-t0)/1000;$$('[data-l]',el).forEach(x=>{x.disabled=true;if(+x.dataset.l===q.bug_line)x.classList.add('right');else if(x===b)x.classList.add('wrong');});
        let pts=0;if(ok){pts=Math.max(2,10-Math.floor(secs/4));score+=pts;sfx('ok');award('bug',1);}else sfx('bad');
        $('#bgW').innerHTML=`<div class="fb ${ok?'ok':'bad'}"><b>${ok?`Bắt được! +${pts}`:`Lỗi ở dòng ${q.bug_line}.`}</b> ${fmt(q.why)}<div class="small" style="margin-top:6px">Sửa thành: <code class="ic">${esc(q.fix)}</code></div></div><button class="btn primary sm" id="bgN">${i+1<pool.length?'Bug tiếp':'Xem điểm'}</button>`;
        $('#bgN').onclick=()=>{i++;draw();};});};
    draw();};
  gameFrame(el,{title:'Bug Hunt',intro:'8 đoạn code, mỗi đoạn có đúng một dòng sai. Tìm nhanh trong 4 giây được 10 điểm, chậm hơn thì ít điểm hơn. Đọc phần giải thích sau mỗi lỗi, đây là những lỗi người mới gặp nhiều nhất.',onStart:start});
};

/* ---------- Term rush ---------- */
VIEWS.termrush=el=>{
  if(!TERMS.length){loadData().then(()=>{if(current==='termrush')route();});el.innerHTML='<div class="view"><p class="note">Đang tải...</p></div>';return;}
  const start=()=>{let score=0,sel=null,set=[];window.__busy=true;
    const started=new Set(Object.keys(P.les||{}).map(id=>(LI.get(id)||{}).track).filter(Boolean));
    const pool=shuffle(TERMS.filter(t=>!started.size||started.has(t.track)).concat(shuffle(TERMS))).filter((t,i,a)=>a.indexOf(t)===i);let pi=0;
    el.innerHTML=`<div class="view"><div class="spread"><span class="timer-chip num" id="trT">${ic('clock')}<span>1:00</span></span><span class="num"><b id="trS">0</b> cặp</span></div><div class="tr-board" id="trB"></div></div>`;
    const tm=makeTimer(60,l=>{const t=$('#trT span');if(t)t.textContent=fmtTime(l);},()=>{tm.stop();gameEnd(el,{id:'termrush',score,again:start});});window.__leave=()=>tm.stop();
    const deal=()=>{set=pool.slice(pi,pi+5);pi+=5;if(pi>=pool.length)pi=0;const L=shuffle(set),R=shuffle(set);
      $('#trB').innerHTML=`<div class="tr-col">${L.map(t=>`<button class="tr-it en" data-id="${t.id}" data-s="L">${esc(t.en)}</button>`).join('')}</div><div class="tr-col">${R.map(t=>`<button class="tr-it" data-id="${t.id}" data-s="R">${esc(String(t.vi).split(/[;(]/)[0].trim())}</button>`).join('')}</div>`;
      $$('.tr-it',el).forEach(b=>b.onclick=()=>{if(b.classList.contains('gone'))return;
        if(!sel||sel.dataset.s===b.dataset.s){if(sel)sel.classList.remove('sel');sel=b;b.classList.add('sel');return;}
        if(sel.dataset.id===b.dataset.id){[sel,b].forEach(x=>{x.classList.remove('sel');x.classList.add('gone');});score++;award('term',1);sfx('ok');$('#trS').textContent=score;sel=null;if(!$$('.tr-it:not(.gone)',el).length)deal();}
        else{sfx('bad');[sel,b].forEach(x=>x.classList.add('shake'));const a=sel;setTimeout(()=>{a.classList.remove('shake','sel');b.classList.remove('shake');},350);sel=null;}});};
    deal();};
  gameFrame(el,{title:'Term Rush',intro:'60 giây ghép thuật ngữ tiếng Anh với nghĩa tiếng Việt. Ghép xong 5 cặp thì ra bộ mới. Thuật ngữ lấy từ các nhánh bạn đang học.',onStart:start});
};
