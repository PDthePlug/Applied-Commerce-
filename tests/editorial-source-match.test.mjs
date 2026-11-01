import test from 'node:test';
import assert from 'node:assert/strict';
import {editorialPassageMatches} from '../scripts/lib/editorial-source-match.mjs';

test('table citation accepts JSON formatting while rejecting changed cells, numbers and row order',()=>{
 const block={kind:'table',rows:[['Section','Detail'],['TFSA','R36,000/year'],['Review','Every 3 months.']]};
 assert.equal(editorialPassageMatches(block,JSON.stringify(block.rows,null,2)),true);
 for(const rows of [
  [['Section','Detail'],['TFSA','R46,000/year'],['Review','Every 3 months.']],
  [['Section','Detail'],['Review','Every 3 months.'],['TFSA','R36,000/year']],
  [['Section','Detail'],['TFSA','R36,000/year']],
 ])assert.equal(editorialPassageMatches(block,JSON.stringify(rows)),false);
});

test('text citation still requires the exact authored passage',()=>{
 const block={kind:'text',text:'Read it at the end of Term 4.'};
 assert.equal(editorialPassageMatches(block,'at the end of Term 4.'),true);
 assert.equal(editorialPassageMatches(block,'at the end of Term 3.'),false);
 assert.equal(editorialPassageMatches(block,''),false);
});
