import type {TeachingPlan,TeachingMoment} from "./teaching-plan";

// Representative review first. References address existing encrypted text;
// there is no public guide, new activity, response identity or content key here.
const representative:Record<string,{field:string;sentence?:number}>={
 "l1-stage-1":{field:"stages.0.explain.0",sentence:0},
 "l1-stage-2":{field:"stages.1.explain.0",sentence:1},
 "l1-stage-3":{field:"stages.2.explain.0",sentence:1},
 "l1-stage-4":{field:"stages.3.explain.0",sentence:1},
 "l1-stage-5":{field:"stages.4.explain.0"},
 "l1-stage-6":{field:"stages.5.task.0"},
 "l1-stage-7":{field:"stages.6.task.0"},
 "l1-stage-8":{field:"stages.7.explain.0",sentence:0},
};
export function facilitationCue(plan:TeachingPlan,moment:TeachingMoment){
 if(plan.lessonId!=="g8-t1-l01-001")return null;
 const reference=representative[moment.id];if(!reference)return null;
 const text=plan.fields[reference.field];if(!text)throw new Error("Facilitation reference differs from the private release.");
 return reference.sentence===undefined?text:text.split(/(?<=[.!?])\s+(?=[A-Z])/u)[reference.sentence]??text;
}
export function periodContinuation(plan:TeachingPlan,moment:TeachingMoment){
 if(plan.lessonId==="g8-t1-l01-001"&&moment.id==="l1-stage-4")return plan.fields["stages.3.next.0"].split(/(?<=[.!?])\s+(?=[A-Z])/u)[1];
 return null;
}
