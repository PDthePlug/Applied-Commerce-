import {isDeepStrictEqual} from 'node:util';

// JSON spacing is not learner wording. Compare the exact table cells without
// normalising their punctuation, numbers, row order or content.
export function editorialPassageMatches(block, passage) {
 if(typeof passage!=='string'||!passage.trim())return false;
 if(block.kind!=='table')return typeof passage==='string'&&block.text?.includes(passage);
 try{if(isDeepStrictEqual(JSON.parse(passage),block.rows))return true;}catch{/* A quotation may instead use the readable table form. */}
 return block.rows.map(row=>row.join(' | ')).join('\n').includes(passage);
}
