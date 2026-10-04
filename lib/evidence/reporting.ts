import type { EvidenceRecord, EvidenceReport, EvidenceReview } from "./types";

export function buildEvidenceReport({
  learnerName,
  grade,
  records,
  reviews,
}:{
  learnerName:string;
  grade?:number;
  records:EvidenceRecord[];
  reviews:Record<string,EvidenceReview>;
}):EvidenceReport{
  const byDomain=new Map<string,{count:number;reviewed:number}>();
  const byKind=new Map<string,number>();
  const byTerm=new Map<number,{count:number;reviewed:number}>();
  const levels:number[]=[];

  records.forEach(record=>{
    const review=reviews[record.responseKey];
    record.definition.domains.forEach(domain=>{
      const current=byDomain.get(domain)??{count:0,reviewed:0};
      current.count+=1;
      if(review) current.reviewed+=1;
      byDomain.set(domain,current);
    });
    byKind.set(record.definition.kind,(byKind.get(record.definition.kind)??0)+1);
    const term=byTerm.get(record.definition.term)??{count:0,reviewed:0};
    term.count+=1;
    if(review) term.reviewed+=1;
    byTerm.set(record.definition.term,term);
    if(review){
      const values=Object.values(review.criteria);
      if(values.length) levels.push(values.reduce((sum,value)=>sum+value,0)/values.length);
    }
  });

  const recordReviews=records.map(record=>reviews[record.responseKey]).filter(Boolean);
  return {
    generatedAt:new Date().toISOString(),
    learnerName,
    grade,
    stage:records[0]?.definition.stage,
    totals:{
      responses:records.length,
      portfolioEligible:records.filter(record=>record.definition.portfolioEligible).length,
      reviewed:recordReviews.length,
      accepted:recordReviews.filter(review=>review.status==="accepted").length,
      needsRevision:recordReviews.filter(review=>review.status==="needs-revision").length,
      verified:recordReviews.filter(review=>review.status==="verified").length,
    },
    byDomain:[...byDomain.entries()].map(([domain,value])=>({domain:domain as EvidenceReport["byDomain"][number]["domain"],...value})).sort((a,b)=>b.count-a.count),
    byKind:[...byKind.entries()].map(([kind,count])=>({kind:kind as EvidenceReport["byKind"][number]["kind"],count})).sort((a,b)=>b.count-a.count),
    byTerm:[...byTerm.entries()].map(([term,value])=>({term,...value})).sort((a,b)=>a.term-b.term),
    averageRubricLevel:levels.length?Number((levels.reduce((sum,value)=>sum+value,0)/levels.length).toFixed(2)):null,
  };
}
