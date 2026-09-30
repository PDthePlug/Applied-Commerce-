from __future__ import annotations
from docx import Document
from docx.text.paragraph import Paragraph
from docx.table import Table
from pathlib import Path
import base64, gzip, json, re, shutil, sys

SOURCE_DIR = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('/mnt/data')
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else Path('public/curriculum')
if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir(parents=True, exist_ok=True)

def clean(text: str) -> str:
    return ' '.join(text.replace('\xa0',' ').split()).strip()

def upper_ratio(text: str) -> float:
    letters=[c for c in text if c.isalpha()]
    return sum(c.isupper() for c in letters)/len(letters) if letters else 0

def lesson_heading(text: str):
    m=re.match(r'^LESSON(?:S)?\s+([0-9]+)(?:[-–—]([0-9]+))?\s*:\s*(.+)$', text)
    if not m: return None
    title=m.group(3).strip()
    if len(text)>220 or upper_ratio(title)<.82: return None
    return int(m.group(1)), int(m.group(2) or m.group(1)), title

def block_type(text: str, style: str) -> str:
    u=text.upper()
    if style.startswith('List'): return 'list'
    if text.startswith('✍️') or u.startswith('ACTIVITY '): return 'activity'
    if text.startswith('💭'): return 'reflection'
    if text.startswith('✅'): return 'checkpoint'
    if text.startswith('📂'): return 'portfolio'
    if text.startswith('📘'): return 'story'
    if text.startswith(('🔍','💡','🔬')): return 'learning'
    if text.startswith('⬜') or re.fullmatch(r'THINKING EQUATION', u): return 'equation'
    if u in {'LEARNING OUTCOMES','KEY VOCABULARY','DEEPENING INSIGHT','HOW TO USE THIS BOOK','YOUR TENSION/EXPERIMENT LOG'}: return 'section'
    if len(text)<=100 and upper_ratio(text)>.9: return 'section'
    return 'paragraph'

def serialize(item):
    if isinstance(item, Paragraph):
        text=clean(item.text)
        if text: return {'kind':'text','type':block_type(text,item.style.name if item.style else ''),'text':text}
    elif isinstance(item, Table):
        rows=[]
        for row in item.rows:
            vals=[clean(cell.text) for cell in row.cells]
            if any(vals): rows.append(vals)
        if rows: return {'kind':'table','type':'table','rows':rows}
    return None

def term_marker(text: str, grade: int):
    m=re.fullmatch(r'Term\s+([1-4])',text,re.I)
    if m: return int(m.group(1))
    m=re.search(rf"Grade\s+{grade}\s+Learner's Book\s+[—-]\s+Term\s+([1-4])",text,re.I)
    return int(m.group(1)) if m else None

def source_note(text: str) -> bool:
    u=text.upper()
    return u.startswith('SITUATION REPORT:') or u.startswith('END OF GRADE ') or u.startswith('END OF PAPER ')

PART_SIZE = 40000
catalogue={'product':'Applied Commerce','formatVersion':2,'grades':[]}
for path in sorted(SOURCE_DIR.glob('APPLIED COMMERCE Grade *.docx')):
    grade=int(re.search(r'Grade (\d+)',path.name).group(1))
    doc=Document(path)
    items=list(doc.iter_inner_content())
    title=''; book_title=f"Grade {grade} Learner's Book"
    for item in items[:100]:
        if isinstance(item,Paragraph):
            t=clean(item.text)
            if not t: continue
            if not title and t.upper().startswith('APPLIED COMMERCE'): title=t
            if f'Grade {grade}' in t and "Learner's Book" in t: book_title=t

    terms={n:{'term':n,'intro':[],'units':[]} for n in range(1,5)}
    preface=[]; current_term=1; current_unit=None; seen=False; serial=0; assessment_serial=0
    for item in items:
        b=serialize(item)
        if not b: continue
        text=b.get('text','') if b['kind']=='text' else ''
        if text:
            tm=term_marker(text,grade)
            if tm:
                current_term=tm; current_unit=None
                if seen: continue
            if source_note(text):
                current_unit=None; continue
            exam=re.fullmatch(rf'GRADE\s+{grade}\s+TERM\s+([1-4])\s+MOCK EXAM',text,re.I)
            if exam:
                current_term=int(exam.group(1)); assessment_serial+=1; serial+=1; seen=True
                current_unit={'id':f'g{grade}-t{current_term}-assessment-{assessment_serial}','type':'assessment','grade':grade,'term':current_term,'label':text,'title':text,'blocks':[],'position':len(terms[current_term]['units'])}
                terms[current_term]['units'].append(current_unit); continue
            if re.fullmatch(r'END OF MOCK EXAM\s*[—-].*',text,re.I):
                current_unit=None; continue
            lesson=lesson_heading(text)
            if lesson:
                seen=True; serial+=1; start,end,l_title=lesson
                current_unit={'id':f'g{grade}-t{current_term}-l{start:02d}-{serial:03d}','type':'lesson','grade':grade,'term':current_term,'label':f'Lesson {start}' if start==end else f'Lessons {start}–{end}','title':l_title,'startLesson':start,'endLesson':end,'blocks':[],'position':len(terms[current_term]['units'])}
                terms[current_term]['units'].append(current_unit); continue
        if current_unit is not None: current_unit['blocks'].append(b)
        elif seen: terms[current_term]['intro'].append(b)
        else: preface.append(b)

    cleaned=[]
    for b in preface:
        if b.get('kind')=='text':
            t=b['text']
            if t==title or t.startswith(f"Grade {grade} Learner's Book") or re.fullmatch(r'Term\s+[1-4]',t,re.I): continue
        cleaned.append(b)
    preface=cleaned

    bundle={'grade':grade,'title':title,'bookTitle':book_title,'sourceFile':path.name,'preface':preface,'terms':[]}
    total_lessons=0; total_assessments=0
    term_catalogue=[]
    for n in range(1,5):
        units=terms[n]['units']
        lesson_units=[u for u in units if u['type']=='lesson']; assessments=[u for u in units if u['type']=='assessment']
        total_lessons+=len(lesson_units); total_assessments+=len(assessments)
        bundle['terms'].append({'term':n,'intro':terms[n]['intro'],'units':units})
        term_catalogue.append({'term':n,'unitCount':len(lesson_units),'assessmentCount':len(assessments)})
    raw=json.dumps(bundle,ensure_ascii=False,separators=(',',':')).encode('utf-8')
    encoded=base64.b64encode(gzip.compress(raw,9)).decode('ascii')
    parts=[encoded[i:i+PART_SIZE] for i in range(0,len(encoded),PART_SIZE)]
    for i,part in enumerate(parts,1):
        (OUT/f'grade-{grade}.part-{i}.b64').write_text(part,encoding='ascii')
    catalogue['grades'].append({'grade':grade,'title':title,'bookTitle':book_title,'unitCount':total_lessons,'assessmentCount':total_assessments,'bundleParts':len(parts),'terms':term_catalogue})

catalogue['grades'].sort(key=lambda g:g['grade'])
(OUT/'index.json').write_text(json.dumps(catalogue,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print(json.dumps({g['grade']:{'lessons':g['unitCount'],'assessments':g['assessmentCount'],'terms':[t['unitCount'] for t in g['terms']]} for g in catalogue['grades']},indent=2))
