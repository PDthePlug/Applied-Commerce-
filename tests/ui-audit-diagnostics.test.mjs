import test from 'node:test';
import assert from 'node:assert/strict';
import {requestFailure} from './helpers/network-diagnostics.mjs';

test('audit distinguishes cancelled speculative prefetches from failed navigation and data',()=>{
  const request=(url,error,headers={})=>({url:()=>url,failure:()=>({errorText:error}),headers:()=>headers});
  assert.equal(requestFailure(request('http://127.0.0.1:3100/auth?_rsc=segment','net::ERR_ABORTED',{'next-router-prefetch':'1'})).cancelledPrefetch,true);
  for(const input of [
    request('http://127.0.0.1:3100/auth?_rsc=segment','net::ERR_CONNECTION_REFUSED',{'next-router-prefetch':'1'}),
    request('http://127.0.0.1:3100/auth?_rsc=segment','net::ERR_ABORTED'),
    request('http://127.0.0.1:3100/curriculum/grade-8.part-01.b64','net::ERR_ABORTED'),
    request('http://127.0.0.1:3100/auth','net::ERR_ABORTED',{'next-router-prefetch':'1'}),
  ])assert.equal(requestFailure(input).cancelledPrefetch,false);
});
