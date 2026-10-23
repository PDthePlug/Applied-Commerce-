// A source lesson title is public catalogue metadata, not indicative reasoning.
// Only that exact field/lesson/value combination is exempt; an identical value
// in any private answer/support field remains a sentinel.
export function teachingAssetSentinels(plans,catalog){
 const values=[];let canonicalOriginalTitlesExcluded=0;
 for(const plan of plans)for(const [field,value]of Object.entries(plan.fields)){
  if(value.length<70)continue;
  if(field==='originalTitle'&&catalog.some(entry=>entry.id===plan.lessonId&&entry.title===value)){canonicalOriginalTitlesExcluded++;continue;}
  values.push(value,JSON.stringify(value).slice(1,-1));
 }
 return {values,canonicalOriginalTitlesExcluded};
}
