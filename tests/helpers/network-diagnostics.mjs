// Next cancels speculative segment prefetches when it replaces their priority.
// Retain those events as diagnostics; actual document/data failures still fail.
export function requestFailure(request){
  const url=request.url(),error=request.failure()?.errorText;
  return {url,error,cancelledPrefetch:error==='net::ERR_ABORTED'&&new URL(url).searchParams.has('_rsc')&&request.headers()['next-router-prefetch']==='1'};
}
