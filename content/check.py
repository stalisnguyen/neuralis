import json, sys, re, subprocess, tempfile, os
kind, path = sys.argv[1], sys.argv[2]
data = json.load(open(path, encoding='utf-8'))
errs = []
BAD = re.compile(r'[—→←↔]')
LABS = set('tokenizer embedding-map sampling attention rag prompt-lab linear-regression gradient-descent neural-net overfitting confusion-matrix robot-arm pid pathfinding q-learning kalman sensors'.split())
def scan(x, where):
    if isinstance(x, str):
        if BAD.search(x): errs.append(f'{where}: em dash or unicode arrow')
        if '\\frac' in x or '\\(' in x or '$$' in x: errs.append(f'{where}: LaTeX')
    elif isinstance(x, list):
        for i, v in enumerate(x): scan(v, f'{where}[{i}]')
    elif isinstance(x, dict):
        for k, v in x.items(): scan(v, f'{where}.{k}')
ids = set()
def run(code):
    with tempfile.NamedTemporaryFile('w', suffix='.py', delete=False) as f: f.write(code); p = f.name
    try:
        r = subprocess.run([sys.executable, p], capture_output=True, text=True, timeout=20); return r.returncode, (r.stderr or '')[-300:]
    finally: os.unlink(p)
pos = []
for i, x in enumerate(data):
    w = x.get('id', f'#{i}')
    if x.get('id') in ids: errs.append(f'{w}: duplicate id')
    ids.add(x.get('id'))
    scan(x, w)
    if kind == 'lesson':
        for k in ['id','track','unit','order','title','title_vi','level','minutes','body','terms','quiz','takeaway']:
            if k not in x: errs.append(f'{w}: missing {k}')
        if x.get('track') not in ['py','math','ml','llm','robo','career']: errs.append(f'{w}: bad track')
        n = len(re.findall(r'\w+', x.get('body',''), re.U))
        if not 300 <= n <= 950: errs.append(f'{w}: body {n} words')
        if x.get('lab') and x['lab'] not in LABS: errs.append(f'{w}: unknown lab {x["lab"]}')
        q = x.get('quiz', [])
        if len(q) != 4: errs.append(f'{w}: quiz needs 4')
        for j, qq in enumerate(q):
            if len(qq.get('choices', [])) != 4 or qq.get('answer') not in range(4) or not qq.get('why'): errs.append(f'{w}: quiz {j} malformed')
            else: pos.append(qq['answer'])
        if x.get('track') == 'py' and 'code' not in x: errs.append(f'{w}: py lesson needs code')
        c = x.get('code')
        if c:
            for k in ['prompt','starter','solution','tests','hint']:
                if not c.get(k): errs.append(f'{w}: code.{k} missing')
            if c.get('tests','').count('assert') < 4: errs.append(f'{w}: need >=4 asserts')
            if c.get('solution') and c.get('tests'):
                rc, e = run(c['solution'] + '\n\n' + c['tests'])
                if rc != 0: errs.append(f'{w}: solution fails tests: {e}')
                rc, e = run(c['starter'] + '\n\n' + c['tests'])
                if rc == 0: errs.append(f'{w}: starter already passes tests')
    elif kind == 'terms':
        for k in ['id','en','vi','track','explain']:
            if not x.get(k): errs.append(f'{w}: missing {k}')
    elif kind == 'job':
        for k in ['id','title','vi','what','day','skills','tools','start','portfolio','interview','fit']:
            if not x.get(k): errs.append(f'{w}: missing {k}')
    else: errs.append('unknown kind'); break
if pos and len(pos) >= 20:
    for a in range(4):
        if pos.count(a) / len(pos) > 0.36: errs.append(f'answer position {a} used {pos.count(a)}/{len(pos)}')
print('\n'.join(errs[:40]) if errs else f'OK ({len(data)} items)')
