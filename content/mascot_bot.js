/* ================= MASCOT: Bit, a small robot =================
   botSVG(state, size, rank). state: calm | hi | idea | yay | ok | hmm | zzz ; rank 0..7 (Newbie -> Pioneer) adds gear. */
const BT={body:'#E8F1F1',shade:'#BFD3D4',screen:'#0F2E33',glow:'#5EF2D3',teal:'#0F4C5C',teal2:'#16697A',orange:'#E07A1F',gold:'#F2C14E',dark:'#21312F',white:'#FFFFFF'};
function botAcc(r){
  let s='';
  if(r>=6)s+=`<path d="M62 118h76l8 62H54z" fill="${BT.white}" stroke="${BT.shade}" stroke-width="2"/><path d="M100 118v62" stroke="${BT.shade}" stroke-width="2"/>`; // lab coat
  if(r>=5)s+=`<rect x="40" y="118" width="16" height="40" rx="6" fill="${BT.teal2}"/><rect x="144" y="118" width="16" height="40" rx="6" fill="${BT.teal2}"/><path d="M44 158l4 14 4-14zM148 158l4 14 4-14z" fill="${BT.orange}"/>`; // jetpack
  if(r>=3)s+=`<rect x="64" y="160" width="72" height="8" rx="3" fill="${BT.dark}"/><rect x="94" y="158" width="12" height="12" rx="2" fill="${BT.gold}"/>`; // tool belt
  if(r>=4)s+=`<g transform="translate(140 132) rotate(-12)"><rect x="0" y="0" width="34" height="22" rx="3" fill="${BT.dark}"/><rect x="3" y="3" width="28" height="16" rx="2" fill="${BT.glow}" opacity=".7"/><rect x="-4" y="22" width="42" height="4" rx="2" fill="${BT.shade}"/></g>`; // laptop
  if(r>=2)s+=`<path d="M56 50c0-24 88-24 88 0" fill="none" stroke="${BT.dark}" stroke-width="5"/><rect x="48" y="52" width="14" height="24" rx="6" fill="${BT.orange}"/><rect x="138" y="52" width="14" height="24" rx="6" fill="${BT.orange}"/>`; // headphones
  if(r>=7)s+=`<path d="M78 22l8 10 14-16 14 16 8-10 2 18H76z" fill="${BT.gold}"/>`; // crown
  return s;
}
function botSVG(state,size,rank){
  state=state||'calm';size=size||120;rank=rank||0;
  const yay=state==='yay',zzz=state==='zzz';
  const eyes=zzz?`<path d="M78 80h14M108 80h14" stroke="${BT.glow}" stroke-width="5" stroke-linecap="round"/>`
    :yay?`<path d="M77 84q8-12 16 0M107 84q8-12 16 0" stroke="${BT.glow}" stroke-width="5" fill="none" stroke-linecap="round"/>`
    :state==='hmm'?`<rect x="78" y="72" width="14" height="14" rx="4" fill="${BT.glow}"/><rect x="108" y="76" width="14" height="8" rx="3" fill="${BT.glow}"/>`
    :`<rect x="78" y="70" width="14" height="18" rx="6" fill="${BT.glow}"/><rect x="108" y="70" width="14" height="18" rx="6" fill="${BT.glow}"/>`;
  const mouth=yay?`<path d="M88 96q12 10 24 0" stroke="${BT.glow}" stroke-width="4" fill="none" stroke-linecap="round"/>`:state==='hmm'?`<path d="M90 98h20" stroke="${BT.glow}" stroke-width="4" stroke-linecap="round"/>`
    :`<path d="M90 96q10 6 20 0" stroke="${BT.glow}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  const armL=yay?'M64 132l-18-30':'M64 134l-14 20';
  const armR=state==='hi'||yay?'M136 132l18-30':state==='ok'?'M136 134l16-6':state==='hmm'?'M136 130l6-24':'M136 134l14 20';
  const extra=state==='idea'?`<g transform="translate(152 10)"><circle cx="14" cy="16" r="12" fill="${BT.gold}"/><rect x="9" y="26" width="10" height="8" rx="2" fill="#9AA3A0"/></g>`
    :zzz?`<g font-family="sans-serif" font-weight="800" fill="${BT.teal}"><text x="146" y="44" font-size="18">z</text><text x="160" y="30" font-size="13">z</text></g>`
    :yay?`<circle cx="30" cy="40" r="4" fill="${BT.orange}"/><rect x="160" y="34" width="8" height="5" fill="${BT.teal2}" transform="rotate(30 164 36)"/><circle cx="170" cy="76" r="3.5" fill="${BT.gold}"/>`:'';
  const led=rank>=1?BT.orange:BT.shade;
  return `<svg class="mascot bot-${state}" viewBox="0 0 200 200" width="${size}" height="${size}" role="img" aria-label="Bit the robot">
  <ellipse cx="100" cy="190" rx="46" ry="6" fill="#000" opacity=".08"/>
  <path d="M100 38V22" stroke="${BT.dark}" stroke-width="4" stroke-linecap="round"/><circle cx="100" cy="18" r="7" fill="${led}"/>
  <rect x="78" y="164" width="16" height="20" rx="5" fill="${BT.dark}"/><rect x="106" y="164" width="16" height="20" rx="5" fill="${BT.dark}"/>
  <rect x="62" y="116" width="76" height="56" rx="20" fill="${BT.body}" stroke="${BT.shade}" stroke-width="3"/>
  <circle cx="100" cy="142" r="9" fill="${BT.teal}"/><circle cx="100" cy="142" r="4" fill="${BT.glow}"/>
  <path d="${armL}" stroke="${BT.shade}" stroke-width="11" fill="none" stroke-linecap="round"/><path d="${armR}" stroke="${BT.shade}" stroke-width="11" fill="none" stroke-linecap="round"/>
  <rect x="52" y="40" width="96" height="76" rx="26" fill="${BT.body}" stroke="${BT.shade}" stroke-width="3"/>
  <rect x="64" y="54" width="72" height="52" rx="16" fill="${BT.screen}"/>
  ${eyes}${mouth}${botAcc(rank)}${extra}</svg>`;
}
