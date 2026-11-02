import registry from './lesson-wraps/registry.json';
export type LessonWrapContent={takeaways:string[];why:string;sourceRefs:string[];sourceSHA256:string;authoredHeadingId:string|null;closingStartId:string|null;next?:{id:string;title:string;grade:number;term:number}};
// Deliberately no generic fallback: missing source-reviewed copy is a coverage failure.
export function lessonWrapFor(unitId:string):LessonWrapContent|null{
 return (registry as Record<string,LessonWrapContent>)[unitId]??null;
}
