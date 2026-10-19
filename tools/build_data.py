"""Pack content/out into data/: lessons.json (all tracks), terms.json, jobs.json.
Quiz choices are reshuffled with a fixed seed so the right answer is not always in the same position.
Run: python3 tools/build_data.py"""
import json, glob, os, random
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = os.path.join(root, 'data'); os.makedirs(out, exist_ok=True)
lessons, terms, jobs = [], [], []
for f in sorted(glob.glob(os.path.join(root, 'content/out/*.json'))):
    name = os.path.basename(f); data = json.load(open(f, encoding='utf-8'))
    if name.startswith('terms'): terms += data
    elif name.startswith('jobs'): jobs += data
    else: lessons += data
rng = random.Random(7)
for l in lessons:
    for q in l.get('quiz', []):
        right = q['choices'][q['answer']]; order = list(range(4)); rng.shuffle(order)
        q['choices'] = [q['choices'][i] for i in order]; q['answer'] = q['choices'].index(right)
ids = [x['id'] for x in lessons + terms + jobs]
assert len(ids) == len(set(ids)), 'duplicate ids'
for name, arr in [('lessons', lessons), ('terms', terms), ('jobs', jobs)]:
    json.dump(arr, open(os.path.join(out, name + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(name, len(arr), os.path.getsize(os.path.join(out, name + '.json')) // 1024, 'KB')
from collections import Counter
print(Counter(l['track'] for l in lessons), 'code', sum(1 for l in lessons if l.get('code')), 'lab', sum(1 for l in lessons if l.get('lab')))
