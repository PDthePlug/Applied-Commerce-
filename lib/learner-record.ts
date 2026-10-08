import type { LearningState } from "./types";

export type LearningActivity = { kind:"completed"|"response"|"note"; key:string; at:string; unitId:string };

export function buildRecentActivity(state:LearningState,limit=6):LearningActivity[]{
 const items:LearningActivity[]=[];
 for(const [unitId,at] of Object.entries(state.completed)) if(at) items.push({kind:"completed",key:"completed:"+unitId,at,unitId});
 for(const [unitId,value] of Object.entries(state.responses)){ if(!value.trim()) continue; const at=state.responseUpdatedAt?.[unitId]; if(at) items.push({kind:"note",key:"note:"+unitId,at,unitId}); }
 for(const [key,value] of Object.entries(state.promptResponses)){ if(!value.trim()) continue; const at=state.promptResponseUpdatedAt?.[key]; if(at) items.push({kind:"response",key:"response:"+key,at,unitId:key.split("::")[0]}); }
 return items.sort((a,b)=>b.at.localeCompare(a.at)).slice(0,limit);
}
function newer(localAt:string|undefined,remoteAt:string|undefined){if(localAt&&remoteAt)return localAt>=remoteAt;return Boolean(localAt);}

export function mergeLearningState(local:LearningState,remote:LearningState):LearningState{
 const merged:LearningState={...remote,...local,version:2,previousResponses:{...remote.previousResponses,...local.previousResponses},completed:{...remote.completed},completedMeta:{...remote.completedMeta},responses:{...remote.responses},responseUpdatedAt:{...remote.responseUpdatedAt},promptResponses:{...remote.promptResponses},promptResponseUpdatedAt:{...remote.promptResponseUpdatedAt},profile:local.profile??remote.profile,activeGrade:local.activeGrade??remote.activeGrade,lastOpened:local.lastOpened&&remote.lastOpened?(local.lastOpened.at>=remote.lastOpened.at?local.lastOpened:remote.lastOpened):(local.lastOpened??remote.lastOpened)};
 for(const key of new Set([...Object.keys(remote.completed),...Object.keys(local.completed)])){const localAt=local.completed[key],remoteAt=remote.completed[key];if(localAt&&(!remoteAt||localAt>=remoteAt)){merged.completed[key]=localAt;if(local.completedMeta?.[key])merged.completedMeta![key]=local.completedMeta[key];}else if(remoteAt){merged.completed[key]=remoteAt;if(remote.completedMeta?.[key])merged.completedMeta![key]=remote.completedMeta[key];}}
 for(const key of new Set([...Object.keys(remote.responses),...Object.keys(local.responses)])){const chooseLocal=key in local.responses&&(!local.responseUpdatedAt?.[key]||!remote.responseUpdatedAt?.[key]||newer(local.responseUpdatedAt?.[key],remote.responseUpdatedAt?.[key]));const source=chooseLocal?local:remote;if(source.responses[key]!==undefined)merged.responses[key]=source.responses[key];const at=source.responseUpdatedAt?.[key];if(at)merged.responseUpdatedAt![key]=at;}
 for(const key of new Set([...Object.keys(remote.promptResponses),...Object.keys(local.promptResponses)])){const chooseLocal=key in local.promptResponses&&(!local.promptResponseUpdatedAt?.[key]||!remote.promptResponseUpdatedAt?.[key]||newer(local.promptResponseUpdatedAt?.[key],remote.promptResponseUpdatedAt?.[key]));const source=chooseLocal?local:remote;if(source.promptResponses[key]!==undefined)merged.promptResponses[key]=source.promptResponses[key];const at=source.promptResponseUpdatedAt?.[key];if(at)merged.promptResponseUpdatedAt![key]=at;}
 return merged;
}

export function completedCountForGrade(state:LearningState,grade:number){return Object.entries(state.completed).filter(([unitId])=>state.completedMeta?.[unitId]?.grade===grade||unitId.startsWith("g"+grade+"-")).length;}
export function evidenceResponseCount(state:LearningState){return Object.values(state.promptResponses).filter(value=>value.trim()).length;}
export function noteCount(state:LearningState){return Object.values(state.responses).filter(value=>value.trim()).length;}
