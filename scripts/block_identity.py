"""Content-addressed block identities, independent of surrounding block positions."""
import hashlib,json,re

def identify_blocks(blocks):
    counts={}; context='lesson'
    for block in blocks:
        if block['kind']=='text':
            text=block['text']
            if block['type'] in ('activity','reflection','checkpoint','story') or re.match(r'^(?:🏠\s*)?Try This at Home',text,re.I):
                context=text
        payload={k:v for k,v in block.items() if k!='id'}
        signature=json.dumps([context,payload],ensure_ascii=False,sort_keys=True,separators=(',',':'))
        digest=hashlib.sha256(signature.encode()).hexdigest()[:24]
        counts[digest]=counts.get(digest,0)+1
        block['id']=f'{digest}-{counts[digest]}'
    return blocks
