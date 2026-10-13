import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const code=ts.transpileModule(fs.readFileSync('lib/customer-errors.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {friendlyActionError,friendlyAuthError}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
test('structured backend errors give the correct safe permission and duplicate guidance',()=>{
 assert.match(friendlyActionError({message:'permission denied for table secret_table',code:'42501'}),/doesn’t have permission/);
 assert.match(friendlyActionError({message:'duplicate key value violates unique constraint internal_constraint'}),/already exists/);
 assert.doesNotMatch(friendlyActionError({message:'internal_constraint: credentials=private'}),/credentials|internal_constraint/);
});
test('stale review guidance requires reloading instead of retrying the same answer',()=>{
 assert.match(friendlyActionError({message:'The learner answer changed; reload it before reviewing',code:'P0001'}),/Reload it before saving/);
});
test('assignment prerequisites and existing review ownership have actionable guidance',()=>{
 assert.match(friendlyActionError({message:'The facilitator must first be an active member of this school'}),/institution team before assigning/);
 assert.match(friendlyActionError({message:'Evidence has already been reviewed by another facilitator'}),/institution administrator/);
});
test('malformed errors use a safe fallback and structured Auth errors are recognized',()=>{
 for(const error of [null,undefined,{},42,{message:{private:'data'}}])assert.equal(friendlyActionError(error,'Safe fallback'),'Safe fallback');
 assert.match(friendlyAuthError({message:'Invalid login credentials'}),/email or password/);
});
