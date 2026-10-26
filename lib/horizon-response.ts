// The approved Lesson 60 repair keeps its original single response identity.
// Older flat choices cannot be assigned to a horizon, so retain them verbatim.
export const horizonResponseKey="g10-t4-l60-060::prompt-dfe0b8dcfd78fcd81bea25f0-1::choice";
export const financialHorizons=["Now","10 years","20 years","40 years"] as const;
export const financialStages=["Dependent","Surviving","Stable","Secure","Independent","Abundant"] as const;
type Horizon=typeof financialHorizons[number];
type Stage=typeof financialStages[number];
export type HorizonResponse={answers:Partial<Record<Horizon,Stage>>;legacy:string};
const kind="ac_horizon_choices_v1";

export function isFinancialHorizonPrompt(text:string){
  const expected=financialHorizons.map(label=>`${label}: ${financialStages.map(option=>`☐ ${option}`).join(" ")}`).join(" ");
  return text.replace(/\s+/g," ").trim()===expected;
}

export function readHorizonResponse(value:string):HorizonResponse{
  const fallback={answers:{},legacy:value};
  if(!value) return fallback;
  try{
    const data:unknown=JSON.parse(value);
    if(!data||typeof data!=="object"||Array.isArray(data)) return fallback;
    const record=data as Record<string,unknown>;
    if(record.kind!==kind||typeof record.legacy!=="string"||!record.answers||typeof record.answers!=="object"||Array.isArray(record.answers)) return fallback;
    if(Object.keys(record).some(key=>!["kind","answers","legacy"].includes(key))) return fallback;
    const answers=record.answers as Record<string,unknown>;
    if(Object.entries(answers).some(([label,option])=>!financialHorizons.includes(label as Horizon)||!financialStages.includes(option as Stage))) return fallback;
    return {answers:answers as HorizonResponse["answers"],legacy:record.legacy};
  }catch{return fallback;}
}

export function changeHorizonResponse(value:string,horizon:Horizon,option:Stage|""){
  const previous=readHorizonResponse(value),answers={...previous.answers};
  if(option) answers[horizon]=option;
  else delete answers[horizon];
  // Clearing all current choices restores the exact older string, if present.
  if(!Object.keys(answers).length) return previous.legacy;
  return JSON.stringify({kind,answers,legacy:previous.legacy});
}

export function displayHorizonResponse(responseKey:string,value:string){
  if(responseKey!==horizonResponseKey) return value;
  const {answers,legacy}=readHorizonResponse(value);
  const lines=financialHorizons.flatMap(label=>answers[label]?[`${label}: ${answers[label]}`]:[]);
  if(!lines.length) return legacy;
  if(legacy) lines.push(`Previous combined response:\n${legacy}`);
  return lines.join("\n");
}
