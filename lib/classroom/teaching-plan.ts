import type {UnitContent} from "../types";
import {learningSections} from "../semantic-learning";
import {isRemovedLogBlock} from "../portfolio-model";

// Instructional text lives only in the encrypted release. Layouts refer to
// stable field paths so an orphan cannot be hidden in a print-only fallback.
export type TeachingGroup={heading:string;fields:string[]};
export type TeachingPlacement={kind:"section"|"heading";blockId:string;edge:"before"|"after";review:string};
export type TeachingMoment={id:string;title:string;minutes:number;period:number|null;schedule:"classroom"|"support"|"later"|"optional";withinStage?:string;placement:TeachingPlacement;sourceBlockIds:string[];core:TeachingGroup[];depth:TeachingGroup[];links:string[]};
export type TeachingPlan={schemaVersion:2;version:string;status:"educator-review-required";lessonId:string;sourceUnitSHA256:string;fields:Record<string,string>;preparation:TeachingGroup[];periods:Array<{title:string;minutes:45;moments:string[]}>;moments:TeachingMoment[];activityCoverage:Array<{blockId:string;momentId:string;disposition:"classroom"|"support"|"later"|"optional"}>;review:{sourceRead:boolean;alignmentReviewed:boolean;timingRationale:string;limits:string[]}};
export function teachingHeading(block:UnitContent["blocks"][number]){
 return block.kind==="text"&&block.type==="paragraph"&&/^(?:Part\s+[A-Z]\s*:|Step\s+\d+\b)/i.test(block.text.trim())&&!/_{2,}|☐/.test(block.text);
}
export function teachingBoundaries(unit:UnitContent){
 // A non-empty semantic container can survive after its original heading has
 // been pruned (for example a remaining portfolio notice). That container is
 // not evidence that the authored heading is a visible teaching anchor.
 const sections=learningSections(unit.blocks,unit.type).filter(section=>!isRemovedLogBlock(unit.blocks[section.start]));
 return {sections,headings:unit.blocks.filter(teachingHeading)};
}
export function teachingCoverage(plan:TeachingPlan){
 const locations=new Map<string,string[]>();
 const add=(field:string,location:string)=>locations.set(field,[...(locations.get(field)??[]),location]);
 for(const group of plan.preparation)for(const field of group.fields)add(field,"preparation");
 for(const [index,period]of plan.periods.entries())add(period.title,`preparation.periods.${index}`);
 for(const moment of plan.moments){add(moment.title,moment.id);for(const group of [...moment.core,...moment.depth])for(const field of group.fields)add(field,moment.id);}
 return Object.keys(plan.fields).map(path=>({path,locations:locations.get(path)??[]}));
}
export type TeachingSource={id:string;sourceUnitSHA256:string;blockIds:string[];sections:string[];headings:string[];activityIds:string[]};
export function teachingSource(unit:UnitContent,sourceUnitSHA256:string):TeachingSource{
 const boundaries=teachingBoundaries(unit);
 return {id:unit.id,sourceUnitSHA256,blockIds:unit.blocks.map(block=>block.id!),sections:boundaries.sections.map(section=>unit.blocks[section.start].id!),headings:boundaries.headings.map(block=>block.id!),activityIds:unit.blocks.filter(block=>block.kind==="text"&&(["activity","reflection","checkpoint"].includes(block.type)||teachingHeading(block))).map(block=>block.id!)};
}
export function validateTeachingPlan(value:unknown,source:TeachingSource):asserts value is TeachingPlan{
 const plan=value as TeachingPlan;
 const fail=()=>{throw new Error("Classroom teaching plan requires source and coverage review.");};
 if(!plan||plan.schemaVersion!==2||plan.status!=="educator-review-required"||plan.lessonId!==source.id||plan.sourceUnitSHA256!==source.sourceUnitSHA256||!plan.version)fail();
 if(!plan.fields||!Object.keys(plan.fields).length||Object.values(plan.fields).some(text=>typeof text!=="string"||!text.trim()))fail();
 for(const pattern of [/^(purpose|centralConcept)/,/^(objectives|purpose\.1)/,/^(outcome|observableOutcome)/,/^prerequisites/,/^(materials|preparation\.materials)/,/^(vocabulary|preparation\.vocabulary)/,/^(misconceptions|preparation\.misconceptions)/,/^(context|preparation\.southAfricanContext)/,/^(access|preparation\.privacy)/])if(!Object.keys(plan.fields).some(path=>pattern.test(path)))fail();
 const field=(id:string)=>{if(!Object.hasOwn(plan.fields,id))fail();};
 const groups=(items:TeachingGroup[])=>{if(!Array.isArray(items)||items.some(group=>!group.heading||!Array.isArray(group.fields)||!group.fields.length))fail();for(const group of items)group.fields.forEach(field);};
 groups(plan.preparation);
 if(!plan.periods?.length||plan.periods.length>2||!plan.moments?.length)fail();
 const ids=new Set(plan.moments.map(moment=>moment.id));
 if(ids.size!==plan.moments.length)fail();
 const blocks=new Set(source.blockIds);
 for(const [index,period]of plan.periods.entries()){
  field(period.title);
  if(period.minutes!==45||!period.moments?.length||new Set(period.moments).size!==period.moments.length)fail();
  const stages=period.moments.map(id=>plan.moments.find(moment=>moment.id===id));
  if(stages.some(moment=>!moment||moment.period!==index||moment.schedule!=="classroom")||stages.reduce((sum,moment)=>sum+(moment?.minutes??0),0)!==45)fail();
 }
 for(const moment of plan.moments){
  field(moment.title);groups(moment.core);groups(moment.depth);
  const cues=moment.core.filter(group=>group.heading==="Facilitation cue");
  if(cues.length>1||cues.some(group=>group.fields.length!==1||moment.schedule!=="classroom"))fail();
  if(!/^[a-z0-9-]+$/.test(moment.id)||!moment.placement?.review||!moment.sourceBlockIds?.length||moment.sourceBlockIds.some(id=>!blocks.has(id))||moment.links.some(id=>!ids.has(id)))fail();
  if(!["before","after"].includes(moment.placement.edge))fail();
  if(moment.placement.kind==="section"){
   if(!source.sections.includes(moment.placement.blockId))fail();
  }else if(moment.placement.kind!=="heading"||moment.placement.edge!=="before"||!source.headings.includes(moment.placement.blockId))fail();
  if(moment.schedule==="classroom"){
   if(!moment.core.length)fail();
   if(!Number.isInteger(moment.minutes)||moment.minutes<=0||moment.period===null||!plan.periods[moment.period]?.moments.includes(moment.id))fail();
  }else{
   if(!["support","later","optional"].includes(moment.schedule)||moment.minutes!==0||moment.period!==null)fail();
   if(moment.schedule==="support"&&!plan.moments.some(stage=>stage.id===moment.withinStage&&stage.schedule==="classroom"))fail();
  }
 }
 const known=new Set(Object.keys(plan.fields));
 for(const row of teachingCoverage(plan))if(!known.has(row.path)||!row.locations.length)fail();
 const covered=new Set(plan.activityCoverage?.map(row=>row.blockId));
 if(!covered.size||covered.size!==plan.activityCoverage.length||plan.activityCoverage.some(row=>!blocks.has(row.blockId)||!plan.moments.some(moment=>moment.id===row.momentId&&moment.schedule===row.disposition)))fail();
 if(source.activityIds.some(id=>!covered.has(id)))fail();
 if(!plan.review?.sourceRead||!plan.review.alignmentReviewed||!plan.review.timingRationale||!plan.review.limits?.length)fail();
}
