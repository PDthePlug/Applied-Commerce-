import { buildPortfolioDefinitions, cleanMarkup, sanitizeRemovedLogReferences } from "../portfolio-model";
import type { ContentBlock, UnitContent } from "../types";
import { domainsFor, rubricForKind, stageForGrade } from "./taxonomy";\nimport { authoredAnswerRule } from "./answer-rules";
import type { AutoCheckResult, DeterministicRule, EvidenceDefinition, EvidenceKind, EvidenceRecord } from "./types";

function parseStableResponseKey(key:string){
  const marker="::prompt-";
  const markerAt=key.indexOf(marker);
  if(markerAt<0) return null;
  const unitId=key.slice(0,markerAt);
  const remainder=key.slice(markerAt+marker.length);
  const slotAt=remainder.indexOf("::");
  if(slotAt<0) return null;
  return {unitId,promptId:remainder.slice(0,slotAt),slot:remainder.slice(slotAt+2)};
}

function promptFor(block:ContentBlock,slot:string){
  if(block.kind==="text"){
    return cleanMarkup(sanitizeRemovedLogReferences(block.text))
      .replace(/_{3,}/g,"")
      .replace(/\s+:/g,":")
      .trim() || "Learner response";
  }
  const tableMatch=slot.match(/^table-(\d+)-(\d+)/);
  if(!tableMatch) return "Structured workbook response";
  const row=Number(tableMatch[1]);
  const col=Number(tableMatch[2]);
  const headers=(block.rows[0]??[]).map(cleanMarkup);
  const rowLabel=(block.rows[row]??[]).map(cleanMarkup).find((value,index)=>index!==col&&value);
  return [rowLabel,headers[col]].filter(Boolean).join(" — ") || "Structured workbook response";
}

function inferKind(block:ContentBlock,prompt:string,unitTitle:string,slot:string):EvidenceKind{
  const text=`${prompt} ${unitTitle}`.toLowerCase();
  if(block.kind==="table"||slot.startsWith("table-")) return "structured-work";
  if(block.kind==="text"&&block.type==="reflection") return "reflection";
  if(/calculate|calculation|percentage|profit|revenue|cost|budget|interest|tax|ratio|amount|show your working/.test(text)) return "calculation";
  if(/interview|who i asked|what they said|ask (?:a|an|someone|person)|speak to/.test(text)) return "interview";
  if(/observe|observation|what did you notice|record what you saw|survey/.test(text)) return "observation";
  if(/project|presentation|community money map|portfolio plan/.test(text)) return "project";
  if(/action plan|strategy|plan for|next step|design your|prepare your/.test(text)) return "plan";
  if(/this week|try this at home|launch task|implement|carry out|apply for|open an account|file a return|sign a contract/.test(text)) return "action";
  if(/reflect|what did you learn|what i learned|future self|how did .* change/.test(text)) return "reflection";
  if(/[?]/.test(prompt)||/why|compare|difference|explain|analyse|analyze|what would happen/.test(text)) return "analysis";
  return "knowledge-response";
}

function assessmentModeFor(kind:EvidenceKind,slot:string,hasAuthoredRule:boolean){
  if(hasAuthoredRule) return "deterministic" as const;
  if(slot==="choice"||slot.startsWith("choice-")) return "unscored" as const;
  if(["action","interview","observation"].includes(kind)) return "verification" as const;
  if(kind==="reflection") return "rubric" as const;
  if(["analysis","calculation","plan","project","structured-work","knowledge-response"].includes(kind)) return "rubric" as const;
  return "unscored" as const;
}

export function runDeterministicCheck(value:string,rule:DeterministicRule):AutoCheckResult{
  const trimmed=value.trim();
  if(rule.kind==="presence"){
    const passed=Boolean(trimmed);
    return {rule:"presence",passed,label:passed?"Captured":"Not yet captured",detail:passed?"A response has been recorded.":"No response has been recorded yet."};
  }
  if(!trimmed) return {rule:rule.kind,passed:false,label:"No answer",detail:"An answer is required before this check can run."};
  if(rule.kind==="exact"){
    const actual=rule.caseSensitive?trimmed:trimmed.toLowerCase();
    const accepted=rule.caseSensitive?rule.accepted:rule.accepted.map(item=>item.toLowerCase());
    const passed=accepted.includes(actual);
    return {rule:"exact",passed,label:passed?"Correct":"Check again",detail:passed?"The answer matches the defined answer key.":"The answer does not match the defined answer key."};
  }
  const numeric=Number(trimmed.replace(/[^0-9.+-]/g,""));
  if(!Number.isFinite(numeric)) return {rule:rule.kind,passed:false,label:"Check the number",detail:"A numeric answer is required."};
  if(rule.kind==="number"){
    const tolerance=rule.tolerance??0;
    const passed=Math.abs(numeric-rule.expected)<=tolerance;
    return {rule:"number",passed,label:passed?"Correct":"Check again",detail:passed?"The number is within the defined tolerance.":`Expected ${rule.expected}${tolerance? ` ± ${tolerance}`:""}.`};
  }
  const passed=numeric>=rule.min&&numeric<=rule.max;
  return {rule:"range",passed,label:passed?"Within range":"Outside range",detail:passed?`The answer is between ${rule.min} and ${rule.max}.`:`The answer must be between ${rule.min} and ${rule.max}.`};
}

export function definitionForResponse(unit:UnitContent,responseKey:string,portfolioBlockIds:Set<string>):EvidenceDefinition|null{
  const parsed=parseStableResponseKey(responseKey);
  if(!parsed||parsed.unitId!==unit.id||parsed.slot==="row-count") return null;
  const block=unit.blocks.find(item=>item.id===parsed.promptId);
  if(!block) return null;
  const prompt=promptFor(block,parsed.slot);
  const stage=stageForGrade(unit.grade);
  const kind=inferKind(block,prompt,unit.title,parsed.slot);
  const key=`${unit.id}::${parsed.promptId}::${parsed.slot}`;
  const authoredRule=authoredAnswerRule(key);
  const assessmentMode=assessmentModeFor(kind,parsed.slot,Boolean(authoredRule));
  const rubricKey=assessmentMode==="rubric"?rubricForKind(kind):undefined;
  return {
    key,
    grade:unit.grade,
    term:unit.term,
    lessonNumber:unit.startLesson,
    unitId:unit.id,
    unitTitle:unit.title,
    promptId:parsed.promptId,
    slot:parsed.slot,
    prompt,
    stage,
    kind,
    domains:domainsFor(stage,kind,prompt),
    assessmentMode,
    rubricKey,
    portfolioEligible:portfolioBlockIds.has(parsed.promptId),
    deterministicRule:authoredRule?.rule??{kind:"presence"},
  };
}

export function buildEvidenceRecords(unit:UnitContent,promptResponses:Record<string,string>):EvidenceRecord[]{
  const portfolioBlockIds=new Set(
    buildPortfolioDefinitions(unit)
      .flatMap(definition=>definition.blockIndices)
      .map(index=>unit.blocks[index]?.id)
      .filter((value):value is string=>Boolean(value))
  );
  const prefix=`${unit.id}::prompt-`;
  return Object.entries(promptResponses)
    .filter(([key,value])=>key.startsWith(prefix)&&value.trim())
    .map(([responseKey,responseValue])=>{
      const definition=definitionForResponse(unit,responseKey,portfolioBlockIds);
      if(!definition) return null;
      return {
        responseKey,
        responseValue,
        definition,
        captured:true,
        autoCheck:runDeterministicCheck(responseValue,definition.deterministicRule),
      };
    })
    .filter((record):record is EvidenceRecord=>Boolean(record));
}
