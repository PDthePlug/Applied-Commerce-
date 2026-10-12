"use client";
import { useLearningStore } from '@/lib/learning-store';
import { learningValues } from '@/lib/learning-sync';
export function LearningSyncStatus(){
 const {state,signedIn,syncError,pendingCount,chooseConflict,retrySync}=useLearningStore();
 if(!signedIn)return null;
 const conflicts=Object.entries(state.sync?.conflicts??{}), values=learningValues(state);
 if(!conflicts.length&&!syncError)return null;
 const display=(value:unknown)=>typeof value==='boolean'?(value?'Completed':'Incomplete'):typeof value==='string'?(value||'(empty)'):JSON.stringify(value);
 return <aside className="learning-sync-status" aria-label="Account sync">
  {syncError&&<p role="alert">{syncError} <button type="button" onClick={()=>void retrySync()}>Retry sync</button></p>}
  {conflicts.length>0&&<><h2>Work changed on another device</h2><p>Both versions are preserved here. Choose which version to use for each conflict. {pendingCount>0?'Other changes will continue to sync.':''}</p>
   {conflicts.map(([id,remote])=><details key={id}><summary>{remote.kind==='prompt'?'Answer':remote.kind==='note'?'Lesson note':remote.kind==='profile'?'Learning profile':'Lesson completion'} · {remote.key.split('::')[0]}</summary><div className="sync-versions"><div><h3>This device</h3><p>{display(values[id]?.value)}</p></div><div><h3>Saved account version</h3><p>{display(remote.value)}</p></div></div><div className="sync-actions"><button type="button" onClick={()=>chooseConflict(id,'local')}>Keep this device’s version</button><button type="button" onClick={()=>chooseConflict(id,'remote')}>Use saved account version</button></div></details>)}
  </>}
 </aside>;
}
