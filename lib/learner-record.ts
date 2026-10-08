import type { LearningState } from "./types";

export type LearningActivity = { kind:"completed"|"response"|"note"; key:string; at:string; unitId:string };

export function buildRecentActivity(state:LearningState,limit=6):LearningActivity[]{
 const items:LearningActivity[]=[];
 for(const [unitId,at] of Object.entries(state.completed)) if(at) items.push({kind:"completed",key:"completed:"+unitId,at,unitId});
 for(const [unitId,value] of Object.entries(state.responses)){ if(!value.trim()) continue; const at=state.responseUpdatedAt?.[unitId]; if(at) items.push({kind:"note",key:"note:"+unitId,at,unitId}); }
 for(const [key,value] of Object.entries(state.promptResponses)){ if(!value.trim()) continue; const at=state.promptResponseUpdatedAt?.[key]; if(at) items.push({kind:"response",key:"response:"+key,at,unitId:key.split("::")[0]}); }
 return items.sort((a,b)=>b.at.localeCompare(a.at)).slice(0,limit);
}
export function completedCountForGrade(state:LearningState,grade:number){return Object.entries(state.completed).filter(([unitId])=>state.completedMeta?.[unitId]?.grade===grade||unitId.startsWith("g"+grade+"-")).length;}
export function evidenceResponseCount(state:LearningState){return Object.values(state.promptResponses).filter(value=>value.trim()).length;}
export function noteCount(state:LearningState){return Object.values(state.responses).filter(value=>value.trim()).length;}
