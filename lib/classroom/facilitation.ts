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
 if(moment.schedule!=="classroom")return null;
 const reference=plan.lessonId==="g8-t1-l01-001"?representative[moment.id]:undefined;
 if(!reference){
  const instruction=moment.core.find(group=>group.heading==="Explain");
  if(!instruction)return null;
  const fields=[...instruction.fields];
  if(moment.id==="g11-do")return plan.fields["practical.instructions.0"];
  if(moment.id==="g10-p1-do")return plan.fields[instruction.fields[0]].split(/(?<=[.!?])\s+(?=[A-Z])/u)[0];
  // Keep task-specific safeguards at the point of use, rather than moving
  // every warning to preparation or requiring all deeper panels to be opened.
  const safeguards:Record<string,string[]>={
   "l14-stage-5":["stages.4.misconception.0"],
   "l15-stage-2":["stages.1.misconception.0"],
   "l16-stage-2":["stages.1.misconception.0"],
   "l19-stage-2":["stages.1.misconception.0"],
  };
  fields.push(...safeguards[moment.id]??[]);
  return fields.map(field=>plan.fields[field]).join(" ");
 }
 const text=plan.fields[reference.field];if(!text)throw new Error("Facilitation reference differs from the private release.");
 return reference.sentence===undefined?text:text.split(/(?<=[.!?])\s+(?=[A-Z])/u)[reference.sentence]??text;
}
export function periodContinuation(plan:TeachingPlan,moment:TeachingMoment){
 if(plan.lessonId==="g8-t1-l01-001"&&moment.id==="l1-stage-4")return plan.fields["stages.3.next.0"].split(/(?<=[.!?])\s+(?=[A-Z])/u)[1];
 return null;
}
