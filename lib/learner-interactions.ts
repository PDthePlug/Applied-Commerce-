import type {ContentBlock} from './types';
import decisions from './interaction-decisions.json';
export type InteractionDecision={kind:'instruction'|'reflection'|'skills'|'circle-map'|'projections';reason:string;sourceText:string};
export function reviewedInteraction(unitId:string,block:ContentBlock):InteractionDecision|null{
 const decision=(decisions as Record<string,InteractionDecision>)[`${unitId}::${block.id}`];
 // A source edit requires renewed review; never silently reuse an exception.
 return decision&&block.kind==='text'&&decision.sourceText===block.text?decision:null;
}
export function deepeningHeading(block:ContentBlock){
 return block.kind==='text'&&block.type==='section'&&/^(?:Deepening Insight|The Deeper Look(?:\s*→\s*Truth\s*\/\s*Danger\s*\/\s*Your Move)?|Truth\s*\/\s*Danger\s*\/\s*Your Move)$/i.test(block.text.trim());
}
export {confidenceSlot} from './response-annotations';
export function abilityAnnotations(unitId:string,blocks:ContentBlock[]){
 if(unitId!=='g8-t1-l03-003')return null;
 const instruction=blocks.find(b=>b.id==='ccda8b6c62811ac821a121d1-1');
 if(instruction?.kind!=='text'||instruction.text!=='Now, look at your list. Put a star ⭐ next to the ones you truly believe. Put a question mark ❓ next to the ones you are not sure about.')return null;
 const ids=['9e792fcd769219db957b3b96-1','ccca920f173876770a67e6b4-1','4e67f062cd88ddbd27c7d249-1','ef1569c5f407d4854e27dcb7-1','87c8ee503918e2344566e482-1','a2651a014e78f40fe03dfb93-1','d16bd5e890e03257dc746b4a-1','da3ee8e770f45904c4dcb882-1','b913749698e72fa384caed4d-1','01c54a12e694b3deae36cf42-1'];
 if(!ids.every((id,i)=>blocks.some(b=>b.id===id&&b.kind==='text'&&b.text===`${i+1}. I can _________________________________`)))return null;
 return {ids,instructionId:instruction.id};
}
