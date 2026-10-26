/* ================= BIT: AI tutor (Groq). Explains in Vietnamese with English terms, reviews code. ================= */
const BIT_SYS=`Bạn là Bit, một robot nhỏ thân thiện, là gia sư AI và Robotics trong app Neuralis. Người học là người Việt, nền product và lifecycle marketing/CRM, đang học Python từ đầu, muốn hiểu sâu AI và Robotics để đi làm trong ngành. Quy tắc:
- Trả lời bằng tiếng Việt tự nhiên, ngắn gọn, như một người hướng dẫn giỏi nói chuyện với người lớn thông minh.
- Giữ thuật ngữ chuyên ngành bằng tiếng Anh, lần đầu xuất hiện thì giải thích ngắn trong ngoặc.
- Giải thích bằng ví dụ đời thường cụ thể (quán cà phê, Grab, Shopee, ngân hàng, giao thông Sài Gòn) và ví dụ công việc thật.
- Code dùng Python, đặt trong khối \`\`\`. Không dùng LaTeX. Không dùng dấu gạch ngang dài.
- Khi không chắc về một thông tin thay đổi nhanh (giá, phiên bản, số liệu mới), nói rõ là không chắc.`;
function bitContext(){
  const done=Object.entries(P.les||{}).filter(([,r])=>r.done).map(([id])=>id);
  const by={};done.forEach(id=>{const l=LI.get(id);if(l)by[l.track]=(by[l.track]||0)+1;});
  const jobs=(P.favJobs||[]).map(id=>(JOBS.find(j=>j.id===id)||{}).title).filter(Boolean);
  return `Tiến độ người học: ${TRACKS.map(t=>`${t.name} ${by[t.k]||0}/${trackLessons(t.k).length}`).join(', ')}. Bài tiếp theo: ${TRACKS.map(t=>{const n=nextLesson(t.k);return n?`${t.name}: ${n.title}`:null;}).filter(Boolean).join('; ')}.${jobs.length?` Nghề đang nhắm: ${jobs.join(', ')}.`:''}`;
}
let BITC=null, BIT_PENDING=null, BIT_LESSON=null;
const bitKey=()=>'neuralis-bit:'+(WHO?WHO.slug:'');
function bitOpen(text,lessonId){BIT_PENDING=text;BIT_LESSON=lessonId||null;go('bit');}
function bitReview(l,code,result){
  bitOpen(`Mình đang làm bài code của bài "${l.title}". Đề bài:\n${l.code.prompt}\n\nCode của mình:\n\`\`\`python\n${code.slice(0,3000)}\n\`\`\`\n\nKết quả khi chạy kiểm tra:\n${result||'(chưa chạy)'}\n\nHãy chỉ ra chỗ sai hoặc chỗ có thể viết tốt hơn, gợi ý từng bước. Đừng đưa lời giải hoàn chỉnh trừ khi code của mình đã gần đúng.`,l.id);
}
VIEWS.bit=el=>{
  BITC=BITC||store.get(bitKey(),[]);
  const draw=()=>{
    el.innerHTML=`<div class="view tutor">
      ${!AI?mcSay('hmm',WEB&&WEB.ai?'Đăng nhập Google (hoặc nhập mã mời) để nói chuyện với Bit.':'Trợ lý AI chưa bật trên máy chủ (cần GROQ_API_KEY và APP_PASSWORD trong Vercel).',56)+(WEB&&WEB.ai?'<button class="btn primary" id="btKey" style="align-self:flex-start">Đăng nhập hoặc nhập mã</button>':''):''}
      <div class="chat-box big" id="btBox">${BITC.length?BITC.map(m=>`<div class="cm ${m.role==='assistant'?'max':'me'}">${m.role==='assistant'?`<span class="cm-av">${botSVG('calm',30,mcRankIdx())}</span>`:''}<div class="cm-b">${m.role==='assistant'?mdBody(m.content):esc(m.content).replace(/\n/g,'<br>')}</div></div>`).join(''):mcSay('hi','Chào bạn, mình là Bit. Hỏi mình bất cứ gì về AI, Robotics, Python, hoặc con đường vào nghề. Mình giải thích bằng tiếng Việt, giữ thuật ngữ tiếng Anh.',60)}</div>
      <div class="row am-q">${['Giải thích Transformer như cho người mới','Ra cho mình 1 bài Python vừa sức','RAG khác fine-tuning thế nào?','Robot hình người học kiểu gì?','Mình nên học gì tiếp theo?'].map(t=>`<button class="chip sm" data-p="${esc(t)}">${t}</button>`).join('')}</div>
      <form class="row composer" id="btF"><textarea id="btI" rows="2" placeholder="Hỏi Bit" style="flex:1 1 220px"></textarea><button class="btn primary" aria-label="Gửi">${ic('send')}</button></form>
      ${BITC.length?'<button class="btn ghost sm" id="btClr" style="align-self:flex-start">Xoá cuộc trò chuyện</button>':''}</div>`;
    const box=$('#btBox');box.scrollTop=box.scrollHeight;bindCodeBlocks(box);
    const k=$('#btKey');if(k)k.onclick=async()=>{if(await askPassword(false)){await initPlatform();draw();}};
    $$('[data-p]',el).forEach(b=>b.onclick=()=>send(b.dataset.p));
    $('#btF').onsubmit=e=>{e.preventDefault();send($('#btI').value);};
    $('#btI').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send($('#btI').value);}};
    const c=$('#btClr');if(c)c.onclick=()=>{BITC=[];store.set(bitKey(),BITC);draw();};
  };
  const send=async text=>{text=String(text||'').trim();if(!text)return;if(!AI){toast(aiError({code:'no_ai'}));return;}
    BITC.push({role:'user',content:text});draw();
    $('#btBox').insertAdjacentHTML('beforeend',`<div class="cm max"><span class="cm-av">${botSVG('idea',30,mcRankIdx())}</span><div class="cm-b"><span class="typing">Bit đang nghĩ...</span></div></div>`);$('#btBox').scrollTop=1e9;
    const hist=BITC.slice(-12).map(m=>({role:m.role,content:m.content}));if(hist[0].role!=='user')hist.shift();
    const les=BIT_LESSON&&LI.get(BIT_LESSON);
    hist[0]={role:'user',content:BIT_SYS+'\n\n'+bitContext()+(les?`\n\nBài học đang mở: ${les.title} (${les.title_vi}). Nội dung bài:\n${les.body.slice(0,2500)}`:'')+'\n\n'+hist[0].content};
    try{const r=await ask(hist);BITC.push({role:'assistant',content:r.text});award('bit',1);}catch(e){BITC.push({role:'assistant',content:aiError(e)});}
    BITC=BITC.slice(-40);store.set(bitKey(),BITC);if(current==='bit')draw();};
  draw();
  if(BIT_PENDING){const t=BIT_PENDING;BIT_PENDING=null;setTimeout(()=>send(t),50);}
};
