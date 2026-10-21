import type {UnitContent} from "../types";
import {learningSections} from "../semantic-learning";
import type {TeacherGuide} from "./model";

export const contextualLessonId="g8-t1-l08-008";
// A placement is a reviewed renderer boundary, not an inferred source offset.
// The opening revisits the phone examples; delivery order is intentionally
// different from source order. Never split the renderer's grouped list/table.
export const contextualPlacements=[
 {stageId:"g8-open",title:"One phone, two purposes",start:0,end:5,boundaryBlockId:"c9786145cf517bdd5a05c00d-1",edge:"before",purpose:"Launch at the authored phone/data examples; then return to the definitions."},
 {stageId:"g8-explore",title:"Teach the distinction and its limits",start:5,end:14,boundaryBlockId:"c69226c6e29eef870006fa8f-1",edge:"before",purpose:"Teach alongside the original definitions and comparison table; vocabulary remains just above."},
 {stageId:"g8-discuss",title:"Data under different constraints",start:14,end:24,boundaryBlockId:"c9786145cf517bdd5a05c00d-1",edge:"after",purpose:"Discuss after the complete phone/data list. Deepening Insight is supporting material later in the lesson."},
 {stageId:"g8-do",title:"Practical application",start:24,end:40,boundaryBlockId:"e00c9dfcd0c93b42a6968deb-1",edge:"before",purpose:"Use the intact Activity 12 section: Part A and one Part C explanation. Part B remains later follow-up."},
 {stageId:"g8-check",title:"Reflection and understanding check",start:40,end:45,boundaryBlockId:"1e8357621b551417d9b19216-1",edge:"before",purpose:"Use checkpoint Question 1 now; plan the later observation without claiming it has happened."},
] as const;

export function contextualAlignment(unit:UnitContent,guide:TeacherGuide){
 if(unit.id!==contextualLessonId||guide.lessonId!==unit.id||unit.grade!==8||unit.term!==1)throw new Error("Contextual teaching is only available for this benchmark.");
 const sections=learningSections(unit.blocks,unit.type);
 const stages=guide.periods.length===1?guide.periods[0].stages:[];
 for(const placement of contextualActivityPlacements){
  const block=unit.blocks.find(item=>item.id===placement.blockId);
  if(!block||(placement.kind==="section"?!sections.some(section=>unit.blocks[section.start]?.id===placement.blockId):block.kind!=="text"||block.type!=="paragraph"||!/^Part [BC]:/.test(block.text)))throw new Error("Activity placement requires renderer review.");
 }
 if(stages.length!==5)throw new Error("The reviewed five-stage plan has changed.");
 return contextualPlacements.map((placement,index)=>{
  const stage=stages[index];
  const section=sections.find(item=>unit.blocks[item.start]?.id===placement.boundaryBlockId);
  if(stage.id!==placement.stageId||stage.minutes!==placement.end-placement.start||!section||stage.sourceBlockIds.some(id=>!unit.blocks.some(block=>block.id===id)))throw new Error("Teaching alignment requires review against the rendered lesson.");
  const supportingSections=sections.filter(item=>item.anchor!==section.anchor&&stage.sourceBlockIds.some(id=>unit.blocks.slice(item.start,item.end).some(block=>block.id===id))).map(item=>({anchor:item.anchor,title:item.title??"Related learner material"}));
  return {...placement,sectionAnchor:section.anchor,stage,supportingSections};
 });
}
export type ContextualMoment=ReturnType<typeof contextualAlignment>[number];

// Additional reviewed boundaries for authored work outside the five timed
// stages. Part headings are separate renderer nodes inside Activity 12.
export const contextualActivityPlacements=[
 {activity:"reflection",blockId:"4366a8a71a6f4c1b34bae61f-1",kind:"section"},
 {activity:"partB",blockId:"6d36aadb38b15408df733b24-1",kind:"part"},
 {activity:"partC",blockId:"616f175c1669b5b75b907def-1",kind:"part"},
 {activity:"deepening",blockId:"52e5abf1875a06c6ea81ce7f-1",kind:"section"},
 {activity:"home",blockId:"22499840c699d3a0d0c842d7-1",kind:"section"},
] as const;
