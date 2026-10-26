/* ================= LABS: 17 interactive simulations (canvas, plain JS) =================
   LABS[id] = {name, vi, track, run(box)}. runLab(id, box) mounts one; stopLabs() cancels animation loops. */
let LAB_LOOPS=[];
function stopLabs(){LAB_LOOPS.forEach(f=>f());LAB_LOOPS=[];}
function labLoop(step){let on=true,id=0;const f=()=>{if(!on)return;step();id=requestAnimationFrame(f);};id=requestAnimationFrame(f);const stop=()=>{on=false;cancelAnimationFrame(id);};LAB_LOOPS.push(stop);return stop;}
function mkCanvas(box,h,cls){
  const cv=document.createElement('canvas');cv.className='lab-cv '+(cls||'');box.appendChild(cv);
  const fit=()=>{const w=Math.max(260,Math.min(box.clientWidth||600,900));const dpr=devicePixelRatio||1;cv.width=w*dpr;cv.height=h*dpr;cv.style.width=w+'px';cv.style.height=h+'px';const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);return {W:w,H:h,ctx:c};};
  const o=fit();o.cv=cv;return o;
}
const cssv=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim()||'#888';
function ctlRow(box,items){
  const d=document.createElement('div');d.className='lab-ctl';box.appendChild(d);
  items.forEach(it=>{
    if(it.type==='range'){const w=document.createElement('label');w.className='lab-r';w.innerHTML=`<span>${it.label} <b class="num">${it.value}</b></span><input type="range" min="${it.min}" max="${it.max}" step="${it.step}" value="${it.value}">`;d.appendChild(w);
      const inp=$('input',w),b=$('b',w);inp.oninput=()=>{b.textContent=it.fmt?it.fmt(+inp.value):inp.value;it.on(+inp.value);};if(it.fmt)b.textContent=it.fmt(it.value);}
    else if(it.type==='btn'){const b=document.createElement('button');b.className='btn sm '+(it.cls||'');b.innerHTML=it.label;b.onclick=()=>it.on(b);d.appendChild(b);}
    else if(it.type==='select'){const s=document.createElement('select');s.innerHTML=it.options.map(([v,t])=>`<option value="${v}">${t}</option>`).join('');s.value=it.value;s.onchange=()=>it.on(s.value);d.appendChild(s);}
  });
  return d;
}
function labInfo(box,html){const p=document.createElement('div');p.className='lab-info small';p.innerHTML=html;box.appendChild(p);return p;}
const rnd=(a,b)=>a+Math.random()*(b-a);
function gauss(){let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}

const LABS={};
/* 1. tokenizer (simplified, for intuition) */
LABS.tokenizer={name:'Tokenizer',vi:'Xem một câu bị cắt thành token ra sao',track:'llm',run(box){
  const COMMON=new Set('the a an and or of to in is are was it that this for on with as be by at from i you we they he she not but have has had do does can will would just ai model token data learn learning machine robot'.split(' '));
  const SUF=['ing','tion','ed','ly','er','est','ment','ness','able','ize','s'];
  const tok=t=>{const out=[];(t.match(/\s*[^\s\w]|\s*[\wÀ-ỹ]+/g)||[]).forEach(w=>{const sp=w.match(/^\s*/)[0],core=w.slice(sp.length),low=core.toLowerCase();
      if(/[^\x00-\x7F]/.test(core)){const parts=core.match(/[\x00-\x7F]+|[^\x00-\x7F]/g)||[core];parts.forEach((p,i)=>out.push((i?'':sp)+p));return;}
      if(COMMON.has(low)||core.length<=5){out.push(w);return;}
      const s=SUF.find(x=>low.endsWith(x)&&low.length-x.length>=3);if(s){const stem=core.slice(0,-s.length);if(stem.length>6){out.push(sp+stem.slice(0,4));out.push(stem.slice(4));}else out.push(sp+stem);out.push(core.slice(-s.length));}
      else if(core.length>8){out.push(sp+core.slice(0,5));out.push(core.slice(5));}else out.push(w);});return out;};
  box.innerHTML=`<textarea class="lab-ta" rows="3">Machine learning models are learning to understand tokenization. Mô hình AI đọc tiếng Việt tốn nhiều token hơn.</textarea><div class="tok-out"></div>`;
  const info=labInfo(box,'');
  const ta=$('textarea',box),o=$('.tok-out',box);
  const cols=['#FDE2C8','#CFEFEA','#E2DBF7','#FBD5D2','#DCEBFB','#F4EBC4'];
  const draw=()=>{const t=tok(ta.value);o.innerHTML=t.map((x,i)=>`<span class="tok" style="background:${cols[i%6]}" title="token #${i+1}">${esc(x).replace(/ /g,'·')}</span>`).join('');
    const ch=ta.value.length;info.innerHTML=`<b>${t.length}</b> token cho <b>${ch}</b> ký tự (khoảng ${(ch/Math.max(1,t.length)).toFixed(1)} ký tự mỗi token). Dấu · là khoảng trắng nằm trong token. Đây là mô phỏng đơn giản: tokenizer thật (BPE) học cách ghép từ dữ liệu, nhưng hiện tượng giống nhau: từ phổ biến tiếng Anh thường là 1 token, từ dài bị cắt nhỏ, chữ có dấu tiếng Việt tốn nhiều token hơn.`;};
  ta.oninput=draw;draw();}};
/* 2. sampling */
LABS.sampling={name:'Temperature & top-p',vi:'Mô hình chọn từ tiếp theo thế nào',track:'llm',run(box){
  const cands=[['nắng',3.1],['mưa',2.6],['đẹp',2.2],['âm u',1.5],['lạnh',1.1],['oi bức',0.8],['buồn',0.2],['tím',-0.8],['bay',-1.6]];
  let T=1,topP=1;
  labInfo(box,'Câu đang viết: <b>"Hôm nay trời ..."</b>. Mô hình chấm điểm (logit) cho từng từ, rồi đổi thành xác suất bằng softmax.');
  const g=mkCanvas(box,240);const res=document.createElement('div');res.className='samp-res';
  const probs=()=>{const ex=cands.map(([w,l])=>Math.exp(l/T));const s=ex.reduce((a,b)=>a+b,0);let p=ex.map(x=>x/s);
    const ord=p.map((v,i)=>[v,i]).sort((a,b)=>b[0]-a[0]);let acc=0;const keep=new Set();for(const [v,i] of ord){keep.add(i);acc+=v;if(acc>=topP)break;}
    p=p.map((v,i)=>keep.has(i)?v:0);const s2=p.reduce((a,b)=>a+b,0);return p.map(v=>v/s2);};
  const draw=()=>{const {ctx,W,H}=g;ctx.clearRect(0,0,W,H);const p=probs();const bw=(W-20)/cands.length;
    p.forEach((v,i)=>{const h=v*(H-50);ctx.fillStyle=v?cssv('--accent'):cssv('--line');ctx.fillRect(10+i*bw+4,H-30-h,bw-8,h);ctx.fillStyle=cssv('--ink');ctx.font='12px sans-serif';ctx.textAlign='center';ctx.fillText(cands[i][0],10+i*bw+bw/2,H-12);ctx.fillText(Math.round(v*100)+'%',10+i*bw+bw/2,H-36-h);});};
  ctlRow(box,[{type:'range',label:'Temperature',min:0.1,max:2.5,step:0.1,value:1,on:v=>{T=v;draw();}},{type:'range',label:'top-p',min:0.1,max:1,step:0.05,value:1,on:v=>{topP=v;draw();}},
    {type:'btn',label:'Sinh 10 lần',cls:'primary',on:()=>{const p=probs();const out=[];for(let k=0;k<10;k++){let r=Math.random(),i=0;while(i<p.length-1&&(r-=p[i])>0)i++;out.push(cands[i][0]);}res.innerHTML=out.map(w=>`<span class="pill">${esc(w)}</span>`).join(' ');}}]);
  box.appendChild(res);labInfo(box,'Temperature thấp: gần như luôn chọn từ điểm cao nhất (ổn định, nhàm). Cao: từ lạ có cơ hội (sáng tạo, dễ nói bậy). top-p: chỉ giữ nhóm từ có tổng xác suất đạt p, cắt bỏ phần đuôi vô lý.');
  draw();}};
/* 3. embedding map */
LABS['embedding-map']={name:'Embedding map',vi:'Từ gần nghĩa nằm gần nhau',track:'llm',run(box){
  const W0=[['táo',.8,.7],['chuối',.85,.6],['xoài',.78,.62],['cam',.9,.72],['mèo',.2,.8],['chó',.25,.85],['hổ',.15,.9],['cá',.3,.7],['xe máy',.7,.2],['ô tô',.75,.15],['xe buýt',.8,.25],['máy bay',.65,.08],['vui',.35,.35],['buồn',.4,.25],['giận',.3,.2],['hạnh phúc',.38,.4],['cổ phiếu',.55,.45],['lãi suất',.6,.4],['ngân hàng',.58,.5],['tiết kiệm',.52,.38],['vua',.1,.4],['hoàng hậu',.18,.45],['đàn ông',.08,.3],['phụ nữ',.16,.35]];
  const g=mkCanvas(box,320);let sel=null;
  const info=labInfo(box,'Bấm vào một từ để xem 3 từ gần nó nhất. Trong mô hình thật, mỗi từ là vector hàng trăm đến hàng nghìn chiều; ở đây thu gọn còn 2 chiều để nhìn được.');
  const P2=([n,x,y])=>[20+x*(g.W-40),20+(1-y)*(g.H-40)];
  const draw=()=>{const {ctx,W,H}=g;ctx.clearRect(0,0,W,H);
    let near=[];if(sel){near=W0.filter(w=>w!==sel).map(w=>[Math.hypot(w[1]-sel[1],w[2]-sel[2]),w]).sort((a,b)=>a[0]-b[0]).slice(0,3).map(x=>x[1]);
      near.forEach(w=>{const a=P2(sel),b=P2(w);ctx.strokeStyle=cssv('--orange');ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(...a);ctx.lineTo(...b);ctx.stroke();});}
    W0.forEach(w=>{const [x,y]=P2(w);ctx.fillStyle=w===sel?cssv('--orange'):near.includes(w)?cssv('--accent-hi'):cssv('--accent');ctx.beginPath();ctx.arc(x,y,5,0,7);ctx.fill();ctx.fillStyle=cssv('--ink');ctx.font='12px sans-serif';ctx.fillText(w[0],x+7,y+4);});
    if(sel)info.innerHTML=`Gần <b>${esc(sel[0])}</b> nhất: ${near.map(w=>esc(w[0])).join(', ')}. Đó là cách RAG tìm đoạn văn liên quan: đổi câu hỏi thành vector rồi tìm vector ở gần.`;};
  g.cv.onclick=e=>{const r=g.cv.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;let b=null,bd=1e9;W0.forEach(w=>{const [x,y]=P2(w);const d=Math.hypot(x-mx,y-my);if(d<bd){bd=d;b=w;}});if(bd<30){sel=b;draw();}};
  labInfo(box,'Để ý: vua -> hoàng hậu và đàn ông -> phụ nữ đi cùng một hướng. Phép tính "vua - đàn ông + phụ nữ ≈ hoàng hậu" là ví dụ kinh điển của embedding.');
  draw();}};
/* 4. attention */
LABS.attention={name:'Attention',vi:'Mỗi từ "chú ý" tới từ nào',track:'llm',run(box){
  const toks=['Con','mèo','ngồi','trên','tấm','thảm','vì','nó','mệt'];
  const A={'nó':{'mèo':.62,'Con':.12,'mệt':.1,'thảm':.08},'mệt':{'nó':.4,'mèo':.3,'ngồi':.15},'ngồi':{'mèo':.45,'trên':.25,'thảm':.15},'thảm':{'tấm':.45,'trên':.25,'ngồi':.15},'mèo':{'Con':.55,'ngồi':.2},'trên':{'thảm':.4,'ngồi':.35},'tấm':{'thảm':.6},'vì':{'mệt':.35,'ngồi':.3,'nó':.2},'Con':{'mèo':.6}};
  let cur='nó';const g=mkCanvas(box,170);
  const info=labInfo(box,'');
  const draw=()=>{const {ctx,W,H}=g;ctx.clearRect(0,0,W,H);const sp=W/toks.length,y1=40,y2=130;const row=A[cur]||{};
    toks.forEach((t,j)=>{const w=row[t]||0.02;const x1=sp*(toks.indexOf(cur)+.5),x2=sp*(j+.5);if(t!==cur){ctx.strokeStyle=cssv('--orange');ctx.globalAlpha=Math.min(1,w*1.6+.08);ctx.lineWidth=1+w*14;ctx.beginPath();ctx.moveTo(x1,y1+10);ctx.bezierCurveTo(x1,y1+60,x2,y2-60,x2,y2-12);ctx.stroke();ctx.globalAlpha=1;}});
    ctx.font='14px sans-serif';ctx.textAlign='center';toks.forEach((t,j)=>{ctx.fillStyle=t===cur?cssv('--orange'):cssv('--ink');ctx.fillText(t,sp*(j+.5),y1);ctx.fillStyle=cssv('--ink');ctx.fillText(t,sp*(j+.5),y2+6);});
    info.innerHTML=`Từ <b>${cur}</b> chú ý nhiều nhất tới: ${Object.entries(row).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([k,v])=>`<b>${k}</b> ${Math.round(v*100)}%`).join(', ')}. Bấm một từ ở hàng trên để đổi. Trọng số ở đây do Bit đặt tay để minh hoạ; mô hình thật tự học ra chúng, và có hàng chục "đầu" attention nhìn các quan hệ khác nhau.`;};
  g.cv.onclick=e=>{const r=g.cv.getBoundingClientRect();const j=Math.floor((e.clientX-r.left)/(g.W/toks.length));if(toks[j]){cur=toks[j];draw();}};
  draw();}};
/* 5. RAG mini */
LABS.rag={name:'RAG mini',vi:'Tìm đoạn liên quan rồi mới trả lời',track:'llm',run(box){
  const DOC=`Chính sách đổi trả của cửa hàng Mây Coffee: khách được đổi đồ uống trong vòng 15 phút nếu pha sai công thức.

Thẻ thành viên Mây: tích 1 điểm cho mỗi 10.000 đồng. Đủ 50 điểm đổi được một ly bất kỳ size M.

Giờ mở cửa: 7 giờ sáng đến 10 giờ tối các ngày trong tuần, cuối tuần mở tới 11 giờ đêm.

Mây giao hàng qua GrabFood và ShopeeFood trong bán kính 5 km. Đơn từ 150.000 đồng được miễn phí giao.

Wifi của quán: tên MayCoffee_Guest, mật khẩu đổi mỗi thứ Hai và in trên hoá đơn.

Nhân viên mới được đào tạo 2 tuần, tuần đầu học pha chế cơ bản, tuần thứ hai học phục vụ và quy trình đóng ca.`;
  box.innerHTML=`<label class="label">Tài liệu (mỗi đoạn là một chunk, sửa thoải mái)</label><textarea class="lab-ta" rows="7">${esc(DOC)}</textarea>
    <div class="row"><input type="text" class="rag-q" value="Mua bao nhiêu tiền thì được miễn phí ship?" style="flex:1 1 220px"><button class="btn primary sm rag-go">Tìm</button></div><div class="rag-res"></div>`;
  const words=s=>fold(s).match(/[a-z0-9]+/g)||[];
  const go=()=>{const chunks=$('textarea',box).value.split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean);const q=$('.rag-q',box).value;
    const df={};chunks.forEach(c=>new Set(words(c)).forEach(w=>df[w]=(df[w]||0)+1));
    const vec=s=>{const v={};words(s).forEach(w=>v[w]=(v[w]||0)+1);for(const w in v)v[w]*=Math.log(1+chunks.length/((df[w]||0)+1));return v;};
    const cos=(a,b)=>{let d=0,na=0,nb=0;for(const k in a){na+=a[k]*a[k];if(b[k])d+=a[k]*b[k];}for(const k in b)nb+=b[k]*b[k];return d/(Math.sqrt(na*nb)||1);};
    const qv=vec(q);const sc=chunks.map((c,i)=>({c,i,s:cos(qv,vec(c))})).sort((a,b)=>b.s-a.s);
    const top=sc.slice(0,2);
    $('.rag-res',box).innerHTML=`<div class="small muted">Điểm giống nhau (cosine trên TF-IDF, cách tìm kiếm đơn giản nhất):</div>${sc.map(x=>`<div class="rag-c ${top.includes(x)?'top':''}"><span class="num">${x.s.toFixed(2)}</span> ${esc(x.c)}</div>`).join('')}
      <div class="row"><button class="btn sm need-ai rag-ai" ${AI?'':'hidden'}>${ic('sparkles')} Hỏi Bit: có ngữ cảnh vs không có</button></div><div class="rag-ans"></div>`;
    const b=$('.rag-ai',box);if(b)b.onclick=async()=>{const a=$('.rag-ans',box);a.innerHTML='<p class="note">Đang hỏi 2 lần...</p>';
      try{const [x,y]=await Promise.all([ask(`Trả lời ngắn bằng tiếng Việt: ${q}`,{modelTier:'quick'}),ask(`Chỉ dựa vào ngữ cảnh sau, trả lời ngắn bằng tiếng Việt. Nếu ngữ cảnh không có thông tin thì nói không biết.\n\nNgữ cảnh:\n${top.map(t=>t.c).join('\n')}\n\nCâu hỏi: ${q}`,{modelTier:'quick'})]);
        a.innerHTML=`<div class="grid2"><div class="panel"><b>Không có ngữ cảnh</b><div class="small">${fmt(x.text)}</div></div><div class="panel"><b>Có ngữ cảnh (RAG)</b><div class="small">${fmt(y.text)}</div></div></div>`;award('bit',1);}catch(e){a.innerHTML=`<p class="note">${esc(aiError(e))}</p>`;}};};
  $('.rag-go',box).onclick=go;go();
  labInfo(box,'Hệ thống RAG thật dùng embedding (vector ý nghĩa) thay cho đếm từ, nên tìm được cả câu cùng ý khác chữ. Thử hỏi "quán có wifi không" hoặc "nhân viên mới học gì".');}};
/* 6. prompt lab */
LABS['prompt-lab']={name:'Prompt lab',vi:'So sánh hai cách viết prompt',track:'llm',run(box){
  box.innerHTML=`<div class="grid2"><div><label class="label">Prompt A</label><textarea class="lab-ta pa" rows="5">Viết email chào mừng khách hàng mới.</textarea></div>
    <div><label class="label">Prompt B</label><textarea class="lab-ta pb" rows="5">Bạn là chuyên viên CRM của một app học tiếng Anh. Viết email chào mừng (tối đa 90 từ, tiếng Việt, giọng thân thiện) cho người vừa đăng ký nhưng chưa học bài nào. Mục tiêu: họ học bài đầu tiên trong 24 giờ. Có 1 tiêu đề, 1 nút kêu gọi hành động. Trả về dạng: Tiêu đề / Nội dung / Nút.</textarea></div></div>
    <div class="row"><button class="btn primary sm pl-go need-ai" ${AI?'':'hidden'}>${ic('sparkles')} Chạy cả hai</button>${AI?'':'<span class="note">Cần đăng nhập để gọi AI.</span>'}</div><div class="pl-out"></div>`;
  const b=$('.pl-go',box);if(b)b.onclick=async()=>{const o=$('.pl-out',box);o.innerHTML='<p class="note">Bit đang chạy hai prompt...</p>';
    try{const [x,y]=await Promise.all([ask($('.pa',box).value,{modelTier:'quick'}),ask($('.pb',box).value,{modelTier:'quick'})]);
      o.innerHTML=`<div class="grid2"><div class="panel"><b>Kết quả A</b><div class="small">${mdBody(x.text)}</div></div><div class="panel"><b>Kết quả B</b><div class="small">${mdBody(y.text)}</div></div></div>`;award('bit',1);}catch(e){o.innerHTML=`<p class="note">${esc(aiError(e))}</p>`;}};
  labInfo(box,'Prompt tốt thường có: vai trò, bối cảnh, mục tiêu, giới hạn (độ dài, giọng), và định dạng đầu ra. Thử sửa prompt B, bỏ bớt từng phần xem kết quả đổi thế nào.');}};
/* 7. linear regression */
LABS['linear-regression']={name:'Linear regression',vi:'Kẻ đường thẳng khớp nhất với dữ liệu',track:'ml',run(box){
  let pts=[];const reset=()=>{pts=[];for(let i=0;i<14;i++){const x=rnd(.05,.95);pts.push([x,.15+.6*x+gauss()*.06]);}};reset();
  let showRes=true;const g=mkCanvas(box,300);const info=labInfo(box,'');
  const draw=()=>{const {ctx,W,H}=g;ctx.clearRect(0,0,W,H);const X=x=>20+x*(W-40),Y=y=>H-20-y*(H-40);
    ctx.strokeStyle=cssv('--line');ctx.strokeRect(20,20,W-40,H-40);
    const n=pts.length;if(n>=2){const mx=pts.reduce((a,p)=>a+p[0],0)/n,my=pts.reduce((a,p)=>a+p[1],0)/n;let sxy=0,sxx=0;pts.forEach(([x,y])=>{sxy+=(x-mx)*(y-my);sxx+=(x-mx)**2;});const w=sxx?sxy/sxx:0,b=my-w*mx;
      let mse=0;pts.forEach(([x,y])=>{const e=y-(w*x+b);mse+=e*e;if(showRes){ctx.strokeStyle=cssv('--orange');ctx.globalAlpha=.6;ctx.beginPath();ctx.moveTo(X(x),Y(y));ctx.lineTo(X(x),Y(w*x+b));ctx.stroke();ctx.globalAlpha=1;}});mse/=n;
      ctx.strokeStyle=cssv('--accent');ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(X(0),Y(b));ctx.lineTo(X(1),Y(w+b));ctx.stroke();ctx.lineWidth=1;
      info.innerHTML=`Đường khớp nhất: <b>y = ${w.toFixed(2)}x + ${b.toFixed(2)}</b>. MSE (sai số bình phương trung bình) = <b>${(mse*1000).toFixed(1)}</b> ×10⁻³. Đoạn cam là sai số của từng điểm; mô hình chọn đường làm tổng bình phương các đoạn này nhỏ nhất. Bấm vào khung để thêm điểm, thử thêm một điểm ngoại lai thật xa xem đường bị kéo lệch thế nào.`;}
    pts.forEach(([x,y])=>{ctx.fillStyle=cssv('--ink');ctx.beginPath();ctx.arc(X(x),Y(y),4.5,0,7);ctx.fill();});};
  g.cv.onclick=e=>{const r=g.cv.getBoundingClientRect();const x=(e.clientX-r.left-20)/(g.W-40),y=(g.H-20-(e.clientY-r.top))/(g.H-40);if(x>=0&&x<=1&&y>=0&&y<=1){pts.push([x,y]);draw();}};
  ctlRow(box,[{type:'btn',label:'Dữ liệu mới',on:()=>{reset();draw();}},{type:'btn',label:'Xoá hết',on:()=>{pts=[];draw();}},{type:'btn',label:'Ẩn/hiện sai số',on:()=>{showRes=!showRes;draw();}}]);
  draw();}};
/* 8. gradient descent */
LABS['gradient-descent']={name:'Gradient descent',vi:'Quả bóng lăn xuống đáy hàm loss',track:'ml',run(box){
  const FN={bowl:[x=>(x-.6)**2*4,x=>8*(x-.6)],two:[x=>2*((x*3-1.6)**2-0.5)**2+.3*x,x=>2*2*((x*3-1.6)**2-.5)*2*(x*3-1.6)*3+.3]};
  let f='bowl',lr=.1,x=.05,hist=[],stop=null;const g=mkCanvas(box,260);const info=labInfo(box,'');
  const draw=()=>{const {ctx,W,H}=g;ctx.clearRect(0,0,W,H);const [F]=FN[f];let lo=1e9,hi=-1e9;for(let i=0;i<=200;i++){const v=F(i/200*1.2-.1);lo=Math.min(lo,v);hi=Math.max(hi,v);}hi=Math.min(hi,lo+4);
    const X=v=>20+(v+.1)/1.2*(W-40),Y=v=>H-20-(Math.min(v,hi)-lo)/(hi-lo||1)*(H-50);
    ctx.strokeStyle=cssv('--accent');ctx.lineWidth=2.5;ctx.beginPath();for(let i=0;i<=200;i++){const xx=i/200*1.2-.1;i?ctx.lineTo(X(xx),Y(F(xx))):ctx.moveTo(X(xx),Y(F(xx)));}ctx.stroke();
    hist.forEach((h,i)=>{ctx.fillStyle=cssv('--orange');ctx.globalAlpha=.25+.75*i/hist.length;ctx.beginPath();ctx.arc(X(h),Y(F(h)),3,0,7);ctx.fill();});ctx.globalAlpha=1;
    ctx.fillStyle=cssv('--orange');ctx.beginPath();ctx.arc(X(x),Y(F(x))-8,8,0,7);ctx.fill();
    info.innerHTML=`Bước ${hist.length}: x = <b>${x.toFixed(3)}</b>, loss = <b>${F(x).toFixed(4)}</b>. Mỗi bước: x mới = x - learning rate × độ dốc. Learning rate nhỏ thì đi chậm; lớn quá thì nhảy qua lại hoặc văng ra ngoài. Với hàm hai thung lũng, điểm xuất phát quyết định bóng rơi vào đáy nào (local minimum).`;};
  const step=()=>{const [,dF]=FN[f];hist.push(x);x=x-lr*dF(x);if(!isFinite(x)||Math.abs(x)>3){x=Math.sign(x||1)*3;}draw();};
  ctlRow(box,[{type:'select',value:'bowl',options:[['bowl','Hàm một đáy'],['two','Hàm hai thung lũng']],on:v=>{f=v;x=.05;hist=[];draw();}},
    {type:'range',label:'Learning rate',min:.01,max:.6,step:.01,value:.1,on:v=>{lr=v;}},
    {type:'btn',label:'1 bước',on:step},{type:'btn',label:'Chạy 30 bước',cls:'primary',on:()=>{let k=0;const t=setInterval(()=>{step();if(++k>=30)clearInterval(t);},90);LAB_LOOPS.push(()=>clearInterval(t));}},
    {type:'btn',label:'Đặt lại',on:()=>{x=f==='bowl'?.05:.95;hist=[];draw();}}]);
  g.cv.onclick=e=>{const r=g.cv.getBoundingClientRect();x=(e.clientX-r.left-20)/(g.W-40)*1.2-.1;hist=[];draw();};
  draw();}};
/* 9. neural net playground (2-H-H-1 MLP, tanh, trained with backprop in JS) */
LABS['neural-net']={name:'Neural net',vi:'Train một mạng nhỏ phân loại điểm',track:'ml',run(box){
  let data=[],H=6,lr=.05,net=null,epoch=0,running=false,kind='circle';
  const mk=k=>{data=[];for(let i=0;i<200;i++){const x=rnd(-1,1),y=rnd(-1,1);let c;if(k==='circle')c=x*x+y*y<.45?1:0;else if(k==='xor')c=(x*y>0)?1:0;else if(k==='spiral'){const r=Math.hypot(x,y),a=Math.atan2(y,x);c=Math.sin(a*1+r*7)>0?1:0;}else c=x+y*.5>0?1:0;data.push([x,y,c]);}};
  const init=()=>{const r=()=>gauss()*.6;net={W1:[...Array(H)].map(()=>[r(),r()]),b1:Array(H).fill(0),W2:[...Array(H)].map(()=>[...Array(H)].map(r)),b2:Array(H).fill(0),W3:[...Array(H)].map(r),b3:0};epoch=0;};
  const fwd=(x,y)=>{const h1=net.W1.map((w,i)=>Math.tanh(w[0]*x+w[1]*y+net.b1[i]));const h2=net.W2.map((w,i)=>Math.tanh(w.reduce((s,v,j)=>s+v*h1[j],0)+net.b2[i]));const o=1/(1+Math.exp(-(net.W3.reduce((s,v,j)=>s+v*h2[j],0)+net.b3)));return {h1,h2,o};};
  const train=()=>{let loss=0;for(const [x,y,c] of shuffle(data)){const {h1,h2,o}=fwd(x,y);loss+=-(c*Math.log(o+1e-9)+(1-c)*Math.log(1-o+1e-9));const d3=o-c;
      const d2=h2.map((h,i)=>d3*net.W3[i]*(1-h*h));const d1=h1.map((h,j)=>d2.reduce((s,d,i)=>s+d*net.W2[i][j],0)*(1-h*h));
      net.W3=net.W3.map((w,i)=>w-lr*d3*h2[i]);net.b3-=lr*d3;net.W2=net.W2.map((row,i)=>row.map((w,j)=>w-lr*d2[i]*h1[j]));net.b2=net.b2.map((b,i)=>b-lr*d2[i]);
      net.W1=net.W1.map((w,i)=>[w[0]-lr*d1[i]*x,w[1]-lr*d1[i]*y]);net.b1=net.b1.map((b,i)=>b-lr*d1[i]);}epoch++;return loss/data.length;};
  const g=mkCanvas(box,300);const info=labInfo(box,'');let lastLoss=0;
  const draw=()=>{const {ctx,W,H:Hh}=g;const S=Math.min(W,Hh),ox=(W-S)/2,cell=S/40;
    for(let i=0;i<40;i++)for(let j=0;j<40;j++){const x=-1+(i+.5)/20,y=1-(j+.5)/20;const o=fwd(x,y).o;ctx.fillStyle=`rgba(${Math.round(224*o+15*(1-o))},${Math.round(122*o+76*(1-o))},${Math.round(31*o+92*(1-o))},.35)`;ctx.fillRect(ox+i*cell,j*cell,cell+1,cell+1);}
    data.forEach(([x,y,c])=>{ctx.fillStyle=c?cssv('--orange'):cssv('--accent');ctx.beginPath();ctx.arc(ox+(x+1)/2*S,(1-(y+1)/2)*S,3.5,0,7);ctx.fill();});
    const acc=data.filter(([x,y,c])=>(fwd(x,y).o>.5?1:0)===c).length/data.length;
    info.innerHTML=`Epoch <b>${epoch}</b>, loss <b>${lastLoss.toFixed(3)}</b>, độ chính xác <b>${Math.round(acc*100)}%</b>. Nền màu là "ý kiến" của mạng cho từng vùng. Mạng có 2 lớp ẩn, mỗi lớp ${H} neuron. Thử dữ liệu xoắn ốc với 2 neuron (mạng quá nhỏ) rồi tăng lên 8.`;};
  const loop=()=>{if(!running)return;for(let k=0;k<2;k++)lastLoss=train();draw();if(epoch>=600){running=false;tb.textContent='Train';}};
  let tb;
  ctlRow(box,[{type:'select',value:'circle',options:[['circle','Hình tròn'],['xor','XOR'],['line','Đường thẳng'],['spiral','Xoắn']],on:v=>{kind=v;mk(v);init();draw();}},
    {type:'range',label:'Neuron mỗi lớp',min:2,max:8,step:1,value:6,on:v=>{H=v;init();draw();}},{type:'range',label:'Learning rate',min:.005,max:.2,step:.005,value:.05,on:v=>{lr=v;}},
    {type:'btn',label:'Train',cls:'primary',on:b=>{tb=b;running=!running;b.textContent=running?'Dừng':'Train';}},{type:'btn',label:'Khởi tạo lại',on:()=>{init();lastLoss=0;draw();}}]);
  mk(kind);init();draw();labLoop(loop);}};
/* 10. overfitting */
LABS.overfitting={name:'Overfitting',vi:'Mô hình phức tạp quá thì học thuộc lòng',track:'ml',run(box){
  let deg=3,tr=[],te=[];const f=x=>Math.sin(x*5)*.3+.5;
  const gen=()=>{tr=[...Array(12)].map(()=>{const x=rnd(0,1);return [x,f(x)+gauss()*.07];});te=[...Array(40)].map(()=>{const x=rnd(0,1);return [x,f(x)+gauss()*.07];});};gen();
  const fit=()=>{const n=deg+1,A=[...Array(n)].map(()=>Array(n).fill(0)),b=Array(n).fill(0);tr.forEach(([x,y])=>{const p=[...Array(n)].map((_,i)=>(x*2-1)**i);for(let i=0;i<n;i++){b[i]+=p[i]*y;for(let j=0;j<n;j++)A[i][j]+=p[i]*p[j];}});for(let i=0;i<n;i++)A[i][i]+=1e-9;
    for(let i=0;i<n;i++){let m=i;for(let k=i+1;k<n;k++)if(Math.abs(A[k][i])>Math.abs(A[m][i]))m=k;[A[i],A[m]]=[A[m],A[i]];[b[i],b[m]]=[b[m],b[i]];for(let k=i+1;k<n;k++){const r=A[k][i]/A[i][i];for(let j=i;j<n;j++)A[k][j]-=r*A[i][j];b[k]-=r*b[i];}}
    const w=Array(n).fill(0);for(let i=n-1;i>=0;i--){let s=b[i];for(let j=i+1;j<n;j++)s-=A[i][j]*w[j];w[i]=s/A[i][i];}return x=>w.reduce((s,c,i)=>s+c*(x*2-1)**i,0);};
  const g=mkCanvas(box,280);const info=labInfo(box,'');
  const draw=()=>{const {ctx,W,H}=g;ctx.clearRect(0,0,W,H);const X=x=>20+x*(W-40),Y=y=>H-20-y*(H-40);const p=fit();
    ctx.strokeStyle=cssv('--accent');ctx.lineWidth=2.5;ctx.beginPath();for(let i=0;i<=200;i++){const x=i/200,y=Math.max(-.2,Math.min(1.2,p(x)));i?ctx.lineTo(X(x),Y(y)):ctx.moveTo(X(x),Y(y));}ctx.stroke();ctx.lineWidth=1;
    te.forEach(([x,y])=>{ctx.strokeStyle=cssv('--muted');ctx.beginPath();ctx.arc(X(x),Y(y),3,0,7);ctx.stroke();});tr.forEach(([x,y])=>{ctx.fillStyle=cssv('--orange');ctx.beginPath();ctx.arc(X(x),Y(y),4.5,0,7);ctx.fill();});
    const mse=a=>a.reduce((s,[x,y])=>s+(p(x)-y)**2,0)/a.length;const a=mse(tr),b=mse(te);
    info.innerHTML=`Bậc đa thức <b>${deg}</b>. Lỗi trên dữ liệu train (chấm cam): <b>${(a*1000).toFixed(1)}</b>, trên dữ liệu test chưa thấy (vòng xám): <b>${(b*1000).toFixed(1)}</b>. ${b>a*3&&deg>5?'<b>Overfitting:</b> khớp từng điểm train nhưng đoán sai dữ liệu mới.':deg<=1?'<b>Underfitting:</b> mô hình quá đơn giản, sai cả hai.':'Khá cân bằng.'}`;};
  ctlRow(box,[{type:'range',label:'Độ phức tạp (bậc đa thức)',min:1,max:11,step:1,value:3,on:v=>{deg=v;draw();}},{type:'btn',label:'Dữ liệu mới',on:()=>{gen();draw();}}]);
  draw();}};
/* 11. confusion matrix */
LABS['confusion-matrix']={name:'Precision & recall',vi:'Ngưỡng báo gian lận và cái giá của sai',track:'ml',run(box){
  const data=[...Array(300)].map((_,i)=>{const fraud=i<45;return [Math.max(0,Math.min(1,(fraud?.68:.32)+gauss()*.15)),fraud];});
  let th=.5;const g=mkCanvas(box,170);const m=document.createElement('div');m.className='cm-grid';box.appendChild(m);const info=labInfo(box,'');
  const draw=()=>{const {ctx,W,H}=g;ctx.clearRect(0,0,W,H);const bins=30;const hp=Array(bins).fill(0),hn=Array(bins).fill(0);data.forEach(([s,f])=>{const b=Math.min(bins-1,Math.floor(s*bins));f?hp[b]++:hn[b]++;});const mx=Math.max(...hn,...hp);
    const bw=(W-20)/bins;for(let b=0;b<bins;b++){ctx.fillStyle=cssv('--accent');ctx.globalAlpha=.5;ctx.fillRect(10+b*bw,H-20-hn[b]/mx*(H-30),bw-1,hn[b]/mx*(H-30));ctx.fillStyle=cssv('--orange');ctx.globalAlpha=.8;ctx.fillRect(10+b*bw,H-20-hp[b]/mx*(H-30),bw-1,hp[b]/mx*(H-30));}ctx.globalAlpha=1;
    ctx.strokeStyle=cssv('--ink');ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(10+th*(W-20),5);ctx.lineTo(10+th*(W-20),H-15);ctx.stroke();ctx.lineWidth=1;
    let tp=0,fp=0,fn=0,tn=0;data.forEach(([s,f])=>{const p=s>=th;if(p&&f)tp++;else if(p)fp++;else if(f)fn++;else tn++;});
    const pr=tp/(tp+fp||1),rc=tp/(tp+fn||1),f1=2*pr*rc/(pr+rc||1);
    m.innerHTML=`<div></div><b>Thực tế: gian lận</b><b>Thực tế: bình thường</b><b>Báo gian lận</b><span class="ok">TP ${tp}</span><span class="bad">FP ${fp}</span><b>Không báo</b><span class="bad">FN ${fn}</span><span class="ok">TN ${tn}</span>`;
    info.innerHTML=`Precision <b>${(pr*100).toFixed(0)}%</b> (trong các giao dịch bị báo, bao nhiêu là gian lận thật), recall <b>${(rc*100).toFixed(0)}%</b> (bắt được bao nhiêu phần gian lận), F1 <b>${f1.toFixed(2)}</b>, accuracy <b>${((tp+tn)/data.length*100).toFixed(0)}%</b>. Cam là gian lận, xanh là bình thường. Hạ ngưỡng: bắt nhiều hơn nhưng làm phiền khách thật nhiều hơn. Đây là quyết định kinh doanh, không chỉ là chuyện kỹ thuật.`;};
  ctlRow(box,[{type:'range',label:'Ngưỡng báo động',min:.05,max:.95,step:.01,value:.5,on:v=>{th=v;draw();}}]);draw();}};
/* 12. robot arm: forward and inverse kinematics */
LABS['robot-arm']={name:'Robot arm',vi:'Cánh tay 2 khớp: forward và inverse kinematics',track:'robo',run(box){
  const L1=1,L2=.8;let t1=.6,t2=.9,target=null,anim=null,elbow=1;const g=mkCanvas(box,320);const info=labInfo(box,'');let s1,s2;
  const fk=(a,b)=>[[L1*Math.cos(a),L1*Math.sin(a)],[L1*Math.cos(a)+L2*Math.cos(a+b),L1*Math.sin(a)+L2*Math.sin(a+b)]];
  const ik=(x,y)=>{const d=(x*x+y*y-L1*L1-L2*L2)/(2*L1*L2);if(Math.abs(d)>1)return null;const b=elbow*Math.acos(d);const a=Math.atan2(y,x)-Math.atan2(L2*Math.sin(b),L1+L2*Math.cos(b));return [a,b];};
  const draw=()=>{const {ctx,W,H}=g;ctx.clearRect(0,0,W,H);const S=Math.min(W,H*1.6)/4.4,ox=W/2,oy=H-30;const T=([x,y])=>[ox+x*S,oy-y*S];
    ctx.strokeStyle=cssv('--line');ctx.setLineDash([4,4]);ctx.beginPath();ctx.arc(ox,oy,(L1+L2)*S,Math.PI,0);ctx.stroke();ctx.beginPath();ctx.arc(ox,oy,(L1-L2)*S,Math.PI,0);ctx.stroke();ctx.setLineDash([]);
    const [p1,p2]=fk(t1,t2);ctx.lineCap='round';ctx.strokeStyle=cssv('--accent');ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(...T(p1));ctx.stroke();ctx.strokeStyle=cssv('--accent-hi');ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(...T(p1));ctx.lineTo(...T(p2));ctx.stroke();
    [[ox,oy],T(p1)].forEach(([x,y])=>{ctx.fillStyle=cssv('--ink');ctx.beginPath();ctx.arc(x,y,7,0,7);ctx.fill();});ctx.fillStyle=cssv('--orange');ctx.beginPath();ctx.arc(...T(p2),7,0,7);ctx.fill();
    if(target){ctx.strokeStyle=cssv('--orange');ctx.lineWidth=2;const [x,y]=T(target);ctx.beginPath();ctx.moveTo(x-8,y);ctx.lineTo(x+8,y);ctx.moveTo(x,y-8);ctx.lineTo(x,y+8);ctx.stroke();}
    ctx.lineWidth=1;ctx.fillStyle=cssv('--line2');ctx.fillRect(ox-30,oy,60,10);
    info.innerHTML=`Góc khớp θ1 = <b>${(t1*180/Math.PI).toFixed(0)}°</b>, θ2 = <b>${(t2*180/Math.PI).toFixed(0)}°</b> -> đầu tay ở (<b>${p2[0].toFixed(2)}</b>, <b>${p2[1].toFixed(2)}</b>). Kéo thanh trượt là <b>forward kinematics</b> (biết góc, tính vị trí). Bấm một điểm trong vùng nét đứt là <b>inverse kinematics</b> (biết vị trí, tính góc). Ngoài vùng đó tay không với tới.`;};
  const toCanvas=e=>{const r=g.cv.getBoundingClientRect();const S=Math.min(g.W,g.H*1.6)/4.4;return [(e.clientX-r.left-g.W/2)/S,(g.H-30-(e.clientY-r.top))/S];};
  g.cv.onclick=e=>{const [x,y]=toCanvas(e);target=[x,y];const s=ik(x,y);if(!s){toast('Ngoài tầm với của cánh tay.');draw();return;}
    const a0=t1,b0=t2;let k=0;if(anim)anim();anim=labLoop(()=>{k+=.05;const u=Math.min(1,k);t1=a0+(s[0]-a0)*u;t2=b0+(s[1]-b0)*u;draw();if(u>=1){anim();anim=null;}});};
  ctlRow(box,[{type:'range',label:'θ1 vai',min:0,max:180,step:1,value:34,on:v=>{t1=v*Math.PI/180;target=null;draw();}},{type:'range',label:'θ2 khuỷu',min:-170,max:170,step:1,value:52,on:v=>{t2=v*Math.PI/180;target=null;draw();}},
    {type:'btn',label:'Đổi khuỷu lên/xuống',on:()=>{elbow*=-1;if(target){const s=ik(...target);if(s){[t1,t2]=s;}}draw();}}]);
  draw();}};
/* 13. PID drone altitude */
LABS.pid={name:'PID controller',vi:'Giữ drone ở đúng độ cao',track:'robo',run(box){
  let kp=2,ki=.4,kd=1.4,target=5,y=0,v=0,I=0,prevE=null,t=0,hist=[],wind=0;const g=mkCanvas(box,280);const info=labInfo(box,'');
  const reset=()=>{y=0;v=0;I=0;prevE=null;t=0;hist=[];};
  const step=dt=>{const e=target-y;I=Math.max(-20,Math.min(20,I+e*dt));const D=prevE==null?0:(e-prevE)/dt;prevE=e;let u=kp*e+ki*I+kd*D+9.8;u=Math.max(0,Math.min(30,u));const a=u-9.8+wind-0.4*v;v+=a*dt;y+=v*dt;if(y<0){y=0;v=Math.max(0,v);}t+=dt;hist.push([t,y]);if(hist.length>600)hist.shift();wind*=.97;};
  const draw=()=>{const {ctx,W,H}=g;ctx.clearRect(0,0,W,H);const pw=W-110,Y=h=>H-20-h/10*(H-40);
    ctx.strokeStyle=cssv('--line');ctx.strokeRect(10,20,pw,H-40);ctx.setLineDash([5,4]);ctx.strokeStyle=cssv('--orange');ctx.beginPath();ctx.moveTo(10,Y(target));ctx.lineTo(10+pw,Y(target));ctx.stroke();ctx.setLineDash([]);
    if(hist.length>1){const t0=hist[0][0],span=Math.max(10,t-t0);ctx.strokeStyle=cssv('--accent');ctx.lineWidth=2;ctx.beginPath();hist.forEach(([tt,h],i)=>{const x=10+(tt-t0)/span*pw;i?ctx.lineTo(x,Y(h)):ctx.moveTo(x,Y(h));});ctx.stroke();ctx.lineWidth=1;}
    const dx=W-50,dy=Y(y);ctx.fillStyle=cssv('--ink');ctx.fillRect(dx-22,dy-4,44,8);ctx.fillStyle=cssv('--accent');[-22,22].forEach(o=>{ctx.fillRect(dx+o-10,dy-9,20,3);});
    ctx.strokeStyle=cssv('--orange');ctx.beginPath();ctx.moveTo(W-80,Y(target));ctx.lineTo(W-20,Y(target));ctx.stroke();
    const e=target-y;info.innerHTML=`Độ cao <b>${y.toFixed(2)} m</b>, mục tiêu <b>${target} m</b>, sai số <b>${e.toFixed(2)}</b>. Kp đẩy mạnh khi còn xa mục tiêu; Ki gom sai số dồn lại để khử lệch nhỏ còn sót; Kd phanh lại khi đang lao nhanh, chống vọt quá. Thử Kd = 0 để thấy drone dao động, hoặc bấm "Gió giật".`;};
  labLoop(()=>{for(let k=0;k<4;k++)step(1/120);draw();});
  ctlRow(box,[{type:'range',label:'Kp',min:0,max:8,step:.1,value:2,on:v=>kp=v},{type:'range',label:'Ki',min:0,max:3,step:.05,value:.4,on:v=>ki=v},{type:'range',label:'Kd',min:0,max:5,step:.1,value:1.4,on:v=>kd=v},
    {type:'range',label:'Mục tiêu (m)',min:1,max:9,step:.5,value:5,on:v=>target=v},{type:'btn',label:'Gió giật',on:()=>{wind=-25;}},{type:'btn',label:'Thả lại từ đất',on:reset}]);
}};
/* 14. pathfinding BFS vs A* */
LABS.pathfinding={name:'Pathfinding',vi:'BFS và A* tìm đường trong mê cung',track:'robo',run(box){
  const C=24,R=14;let wall=new Set(),S=[2,7],G=[21,7],res=null;
  const seedWalls=()=>{wall=new Set();for(let y=2;y<12;y++)wall.add(`10,${y}`);for(let x=13;x<20;x++)wall.add(`${x},4`);for(let y=4;y<11;y++)wall.add(`16,${y}`);};seedWalls();
  const g=mkCanvas(box,R*20+4);const info=labInfo(box,'Bấm vào ô để dựng hoặc phá tường, rồi chạy thuật toán.');
  const cs=()=>Math.floor(Math.min(g.W/C,(g.H-4)/R));
  const run=alg=>{const key=p=>p.join(','),h=p=>Math.abs(p[0]-G[0])+Math.abs(p[1]-G[1]);const open=[[S,0]],came={},cost={[key(S)]:0},seen=[];const done=new Set();
    while(open.length){open.sort((a,b)=>a[1]-b[1]);const [cur]=open.shift();const k=key(cur);if(done.has(k))continue;done.add(k);seen.push(cur);if(k===key(G))break;
      for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const n=[cur[0]+dx,cur[1]+dy],nk=key(n);if(n[0]<0||n[1]<0||n[0]>=C||n[1]>=R||wall.has(nk))continue;const c=cost[k]+1;if(cost[nk]==null||c<cost[nk]){cost[nk]=c;came[nk]=cur;open.push([n,alg==='astar'?c+h(n):c]);}}}
    const path=[];let k=key(G);if(cost[k]!=null){let p=G;while(p){path.push(p);p=came[key(p)];}}
    const me={seen,path,alg,i:0};res=me;const stop=labLoop(()=>{if(res!==me){stop();return;}res.i+=Math.max(1,Math.round(seen.length/90));draw();if(res.i>=seen.length){stop();info.innerHTML=`<b>${alg==='astar'?'A*':'BFS'}</b> đã xét <b>${seen.length}</b> ô, đường đi dài <b>${path.length?path.length-1:'-'}</b> bước${path.length?'':' (không có đường)'}. BFS loang đều mọi hướng; A* dùng "ước lượng khoảng cách tới đích" nên ưu tiên hướng về đích và xét ít ô hơn, mà vẫn ra đường ngắn nhất.`;}});};
  const draw=()=>{const {ctx}=g;const s=cs();ctx.clearRect(0,0,g.W,g.H);
    for(let x=0;x<C;x++)for(let y=0;y<R;y++){ctx.fillStyle=wall.has(`${x},${y}`)?cssv('--ink'):cssv('--sunk');ctx.fillRect(x*s+1,y*s+1,s-2,s-2);}
    if(res){res.seen.slice(0,res.i).forEach(([x,y])=>{ctx.fillStyle=cssv('--accent-soft');ctx.fillRect(x*s+1,y*s+1,s-2,s-2);});if(res.i>=res.seen.length)res.path.forEach(([x,y])=>{ctx.fillStyle=cssv('--orange');ctx.fillRect(x*s+4,y*s+4,s-8,s-8);});}
    [[S,cssv('--accent')],[G,cssv('--ok')]].forEach(([[x,y],c])=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(x*s+s/2,y*s+s/2,s/2-2,0,7);ctx.fill();});};
  g.cv.onclick=e=>{const r=g.cv.getBoundingClientRect(),s=cs();const x=Math.floor((e.clientX-r.left)/s),y=Math.floor((e.clientY-r.top)/s);const k=`${x},${y}`;if(x>=C||y>=R||k===S.join(',')||k===G.join(','))return;wall.has(k)?wall.delete(k):wall.add(k);res=null;draw();};
  ctlRow(box,[{type:'btn',label:'Chạy BFS',on:()=>run('bfs')},{type:'btn',label:'Chạy A*',cls:'primary',on:()=>run('astar')},{type:'btn',label:'Xoá tường',on:()=>{wall=new Set();res=null;draw();}},{type:'btn',label:'Mê cung mẫu',on:()=>{seedWalls();res=null;draw();}}]);
  draw();}};
/* 15. Q-learning gridworld */
LABS['q-learning']={name:'Q-learning',vi:'Agent tự học đường đi qua thử và sai',track:'robo',run(box){
  const C=7,R=5,goal=[6,0],pits=new Set(['3,1','3,2','5,3','1,3']),start=[0,4];const A=[[0,-1],[1,0],[0,1],[-1,0]];
  let Q={},eps=.2,episodes=0,agent=null,rets=[];const g=mkCanvas(box,R*56+4);const info=labInfo(box,'');
  const q=(s)=>Q[s]||(Q[s]=[0,0,0,0]);
  const stepEnv=(p,a)=>{const n=[Math.max(0,Math.min(C-1,p[0]+A[a][0])),Math.max(0,Math.min(R-1,p[1]+A[a][1]))];const k=n.join(',');if(k===goal.join(','))return [n,10,true];if(pits.has(k))return [n,-10,true];return [n,-1,false];};
  const episode=()=>{let p=start.slice(),ret=0;for(let t=0;t<60;t++){const s=p.join(',');const a=Math.random()<eps?Math.floor(Math.random()*4):q(s).indexOf(Math.max(...q(s)));const [n,r,done]=stepEnv(p,a);ret+=r;const ns=n.join(',');q(s)[a]+=.3*(r+(done?0:.95*Math.max(...q(ns)))-q(s)[a]);p=n;if(done)break;}episodes++;rets.push(ret);if(rets.length>50)rets.shift();};
  const draw=()=>{const {ctx}=g;const s=Math.floor(Math.min(g.W/C,(g.H-4)/R));ctx.clearRect(0,0,g.W,g.H);
    for(let x=0;x<C;x++)for(let y=0;y<R;y++){const k=`${x},${y}`,v=Math.max(...q(k));ctx.fillStyle=pits.has(k)?cssv('--bad'):k===goal.join(',')?cssv('--ok'):`rgba(15,76,92,${Math.max(0,Math.min(.6,(v+5)/25))})`;ctx.fillRect(x*s+1,y*s+1,s-2,s-2);
      if(!pits.has(k)&&k!==goal.join(',')&&Q[k]){const a=Q[k].indexOf(v);ctx.strokeStyle=cssv('--ink');ctx.lineWidth=2;const cx=x*s+s/2,cy=y*s+s/2;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+A[a][0]*s*.3,cy+A[a][1]*s*.3);ctx.stroke();ctx.lineWidth=1;}}
    ctx.fillStyle=cssv('--ink');ctx.font='12px sans-serif';ctx.fillText('S',start[0]*s+5,start[1]*s+16);
    if(agent){ctx.fillStyle=cssv('--orange');ctx.beginPath();ctx.arc(agent[0]*s+s/2,agent[1]*s+s/2,s/4,0,7);ctx.fill();}
    const avg=rets.length?rets.reduce((a,b)=>a+b,0)/rets.length:0;
    info.innerHTML=`Đã chơi <b>${episodes}</b> lượt, điểm trung bình 50 lượt gần nhất <b>${avg.toFixed(1)}</b>. Ô xanh lá là đích (+10), ô đỏ là hố (-10), mỗi bước -1. Mũi tên là hành động agent cho là tốt nhất ở mỗi ô, màu càng đậm là ô càng "đáng giá". Epsilon là tỉ lệ thử bừa để khám phá thay vì làm theo cái đã biết.`;};
  ctlRow(box,[{type:'btn',label:'Học 1 lượt',on:()=>{episode();draw();}},{type:'btn',label:'Học 200 lượt',cls:'primary',on:()=>{for(let i=0;i<200;i++)episode();draw();}},
    {type:'range',label:'Epsilon (khám phá)',min:0,max:1,step:.05,value:.2,on:v=>eps=v},
    {type:'btn',label:'Cho agent đi thử',on:()=>{let p=start.slice(),n=0;agent=p;const stop=labLoop(()=>{if(++n%14)return;const s=p.join(',');const a=q(s).indexOf(Math.max(...q(s)));const [np,,done]=stepEnv(p,a);p=np;agent=p;draw();if(done||n>14*30){stop();setTimeout(()=>{agent=null;draw();},700);}});}},
    {type:'btn',label:'Quên hết',on:()=>{Q={};episodes=0;rets=[];draw();}}]);
  draw();}};
/* 16. Kalman filter 1D */
LABS.kalman={name:'Kalman filter',vi:'Lọc nhiễu cảm biến, đoán vị trí thật',track:'robo',run(box){
  let Rn=1.5,Qn=.02,N=120;const g=mkCanvas(box,280);const info=labInfo(box,'');let data;
  const gen=()=>{let x=0,v=.12;data=[];for(let i=0;i<N;i++){v+=gauss()*.02;x+=v;data.push({t:x,z:x+gauss()*Rn});}};gen();
  const draw=()=>{const {ctx,W,H}=g;ctx.clearRect(0,0,W,H);let x=data[0].z,v=0,p00=4,p01=0,p11=1;const est=[],ma=[];const r2=Rn*Rn;
    data.forEach((d,i)=>{ // constant-velocity model: predict, then correct with the new measurement
      if(i){x+=v;p00+=2*p01+p11+Qn*.25;p01+=p11+Qn*.5;p11+=Qn;}
      const S=p00+r2,k0=p00/S,k1=p01/S,y=d.z-x;x+=k0*y;v+=k1*y;const n00=(1-k0)*p00,n01=(1-k0)*p01,n11=p11-k1*p01;p00=n00;p01=n01;p11=n11;est.push(x);const w=data.slice(Math.max(0,i-7),i+1);ma.push(w.reduce((a,b)=>a+b.z,0)/w.length);});
    const all=data.flatMap(d=>[d.t,d.z]),lo=Math.min(...all),hi=Math.max(...all),X=i=>15+i/(N-1)*(W-30),Y=v=>H-15-(v-lo)/(hi-lo||1)*(H-30);
    data.forEach((d,i)=>{ctx.fillStyle=cssv('--muted');ctx.globalAlpha=.6;ctx.beginPath();ctx.arc(X(i),Y(d.z),2.2,0,7);ctx.fill();});ctx.globalAlpha=1;
    const line=(arr,c,w,dash)=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.setLineDash(dash||[]);ctx.beginPath();arr.forEach((v,i)=>i?ctx.lineTo(X(i),Y(v)):ctx.moveTo(X(i),Y(v)));ctx.stroke();ctx.setLineDash([]);};
    line(data.map(d=>d.t),cssv('--ink'),1.5,[5,4]);line(ma,cssv('--line2'),2);line(est,cssv('--orange'),2.5);ctx.lineWidth=1;
    const err=a=>Math.sqrt(a.reduce((s,v,i)=>s+(v-data[i].t)**2,0)/N);
    info.innerHTML=`Chấm xám: số đo cảm biến có nhiễu. Nét đứt: vị trí thật. Xám đậm: trung bình trượt 8 điểm (sai số <b>${err(ma).toFixed(2)}</b>). Cam: Kalman filter (sai số <b>${err(est).toFixed(2)}</b>). Kalman cân giữa "dự đoán theo chuyển động" và "số đo mới", tin bên nào hơn tuỳ độ nhiễu của từng bên.`;};
  ctlRow(box,[{type:'range',label:'Nhiễu cảm biến',min:.2,max:4,step:.1,value:1.5,on:v=>{Rn=v;gen();draw();}},{type:'range',label:'Q (độ tin dự đoán)',min:.001,max:.5,step:.001,value:.02,on:v=>{Qn=v;draw();}},{type:'btn',label:'Dữ liệu mới',on:()=>{gen();draw();}}]);
  draw();}};
/* 17. lidar sensor */
LABS.sensors={name:'Lidar',vi:'Robot quét căn phòng bằng tia laser',track:'robo',run(box){
  let rays=72,noise=.02,pos=[.3,.5];const walls=[[0,0,1,0],[1,0,1,1],[1,1,0,1],[0,1,0,0],[.55,.2,.75,.2],[.75,.2,.75,.45],[.15,.75,.4,.75],[.62,.62,.85,.85]];
  const g=mkCanvas(box,300);const info=labInfo(box,'Bấm vào phòng để đặt robot ở chỗ khác.');
  const hit=(ox,oy,dx,dy)=>{let best=Infinity;walls.forEach(([x1,y1,x2,y2])=>{const ex=x2-x1,ey=y2-y1,den=dx*ey-dy*ex;if(Math.abs(den)<1e-9)return;const t=((x1-ox)*ey-(y1-oy)*ex)/den,u=((x1-ox)*dy-(y1-oy)*dx)/den;if(t>0&&u>=0&&u<=1)best=Math.min(best,t);});return best;};
  const draw=()=>{const {ctx,W,H}=g;ctx.clearRect(0,0,W,H);const S=Math.min(W,H)-20,ox=(W-S)/2,oy=10,T=(x,y)=>[ox+x*S,oy+y*S];
    ctx.strokeStyle=cssv('--line2');ctx.lineWidth=3;walls.forEach(([a,b,c,d])=>{ctx.beginPath();ctx.moveTo(...T(a,b));ctx.lineTo(...T(c,d));ctx.stroke();});ctx.lineWidth=1;
    for(let i=0;i<rays;i++){const a=i/rays*Math.PI*2,dx=Math.cos(a),dy=Math.sin(a);let r=hit(pos[0],pos[1],dx,dy);if(!isFinite(r))continue;r*=1+gauss()*noise;const hx=pos[0]+dx*r,hy=pos[1]+dy*r;
      ctx.strokeStyle=cssv('--orange');ctx.globalAlpha=.25;ctx.beginPath();ctx.moveTo(...T(...pos));ctx.lineTo(...T(hx,hy));ctx.stroke();ctx.globalAlpha=1;ctx.fillStyle=cssv('--orange');ctx.beginPath();ctx.arc(...T(hx,hy),2.5,0,7);ctx.fill();}
    ctx.fillStyle=cssv('--accent');ctx.beginPath();ctx.arc(...T(...pos),9,0,7);ctx.fill();};
  g.cv.onclick=e=>{const r=g.cv.getBoundingClientRect(),S=Math.min(g.W,g.H)-20;const x=(e.clientX-r.left-(g.W-S)/2)/S,y=(e.clientY-r.top-10)/S;if(x>0.02&&x<.98&&y>.02&&y<.98){pos=[x,y];draw();}};
  ctlRow(box,[{type:'range',label:'Số tia',min:8,max:360,step:4,value:72,on:v=>{rays=v;draw();}},{type:'range',label:'Nhiễu đo khoảng cách',min:0,max:.1,step:.005,value:.02,on:v=>{noise=v;draw();}},{type:'btn',label:'Quét lại',on:draw}]);
  labInfo(box,'Mỗi chấm cam là một điểm tia laser chạm vật cản. Ghép nhiều lần quét khi robot di chuyển, ta vẽ được bản đồ phòng: đó là ý tưởng của SLAM. Ít tia thì bản đồ thưa; nhiễu lớn thì tường bị nhoè.');
  draw();}};

function runLab(id,box){box.innerHTML='';try{LABS[id].run(box);}catch(e){console.error(e);box.innerHTML='<p class="note">Lab này đang lỗi, thử tải lại trang.</p>';}
  const d=plDay();if(!d['lab_'+id]){d['lab_'+id]=1;P.labs[id]=(P.labs[id]||0)+1;award('lab',1);}}
let LAB_OPEN=null;
function openLab(id){LAB_OPEN=id;go('lab');}
VIEWS.labs=el=>{
  const by=k=>Object.entries(LABS).filter(([,v])=>v.track===k);
  el.innerHTML=`<div class="view"><p class="note" style="margin:0">Mô phỏng tương tác, chơi trực tiếp trên trình duyệt. Mỗi lab gắn với vài bài học; mở lab trước hay sau khi đọc bài đều được.</p>
    ${[['llm','LLM & GenAI'],['ml','Machine Learning'],['robo','Robotics']].map(([k,t])=>`<h3>${t}</h3><div class="lab-grid">${by(k).map(([id,v])=>`<button class="panel lab-card" data-lab="${id}" style="--tc:${TR[k].color}"><span class="lab-ic">${ic('flask')}</span><span><b>${esc(v.name)}</b><span class="small muted">${esc(v.vi)}</span>${P.labs[id]?`<span class="small ok-t">Đã thử ${P.labs[id]} lần</span>`:''}</span></button>`).join('')}</div>`).join('')}</div>`;
  $$('[data-lab]',el).forEach(b=>b.onclick=()=>openLab(b.dataset.lab));
};
VIEWS.lab=el=>{
  const id=LAB_OPEN||labOfDay(), L=LABS[id];
  const rel=LESSONS.filter(l=>l.lab===id);
  el.innerHTML=`<div class="view"><button class="btn ghost sm" id="lbBack" style="align-self:flex-start">${ic('chevron-left')} Tất cả lab</button>
    <div><h2 style="margin:0">${esc(L.name)}</h2><p class="ls-sub">${esc(L.vi)}</p></div><div class="panel lab-box" id="lbBox"></div>
    ${rel.length?`<div class="panel"><h3>Bài học liên quan</h3><div class="rv-list">${rel.map(l=>`<button class="rv-row" data-l="${esc(l.id)}"><span class="rv-ic ${lesDone(l.id)?'ok':''}">${lesDone(l.id)?ic('check'):ic('book-open')}</span><span class="rv-t"><b>${esc(l.title)}</b><span class="small muted">${TR[l.track].name}, ${esc(l.title_vi)}</span></span></button>`).join('')}</div></div>`:''}</div>`;
  $('#lbBack').onclick=()=>go('labs');$$('[data-l]',el).forEach(b=>b.onclick=()=>openLesson(b.dataset.l));
  runLab(id,$('#lbBox'));window.__leave=stopLabs;
};
