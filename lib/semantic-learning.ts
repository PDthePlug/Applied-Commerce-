import type { ContentBlock, UnitContent } from "./types";

export type LearningMode = "read" | "understand" | "decide" | "do" | "reflect" | "prove";
export type LearningSection = { start:number; end:number; mode:LearningMode; title?:string; anchor:string; context:"activity"|"reflection"|"checkpoint"|"home"|null };
export type AuthoredScale = { min:number; max:number };
export type ChoiceMeaning = { prompt:string; options:string[]; kind:"single"|"multiple"|"ranking" };
export type ValueSelection = { count:number; options:string[]; fromIndex?:number; allowCustom:boolean };

// Presentation inference never rewrites source blocks or their response identities.
export function sourceCopy(text:string){
  return text.replace(/\*\*/g, "").replace(/^[📂✍️💭✅📘⬜]\s*/u, "").trim();
}

export function authoredScale(header:string):AuthoredScale|null{
  const match=header.match(/\(\s*(\d+)\s*[-–]\s*(\d+)\s*\)/);
  if(!match) return null;
  const min=Number(match[1]), max=Number(match[2]);
  return min>=0&&max>min&&max-min<=9?{min,max}:null;
}

export function choiceMeaning(text:string, instruction=""):ChoiceMeaning|null{
  if(!text.includes("☐")) return null;
  const [prefix,...parts]=sourceCopy(text).split("☐");
  const options=parts.map(option=>option.trim()).filter(Boolean);
  if(!options.length) return null;
  const prompt=prefix.trim();
  const task=prompt||instruction;
  if(/^Rank\b/i.test(task)&&options.length>1) return {prompt,options,kind:"ranking"};
  // Yes/no alternatives and an explicit singular selection are decisions, not checklists.
  const yesNo=options.length>=2&&options.every(option=>/^(?:yes|no|mostly|close|not yet|i am not sure|unsure)$/i.test(option));
  const single= yesNo || /^(?:My (?:option|chosen option|risk tolerance)|Am I|Is |Do |Did |Have |Can |Given )/i.test(prompt)
    || /\b(?:choose|select|pick)\s+(?:ONE|one option)\b/i.test(task);
  return {prompt,options,kind:single?"single":"multiple"};
}

function boundaryMode(block:ContentBlock, unitType:UnitContent["type"]):LearningMode|null{
  if(block.kind!=="text") return null;
  const text=sourceCopy(block.text);
  if(/^Try This at Home\b/i.test(text)) return "do";
  if(block.type==="activity") return "do";
  if(block.type==="reflection") return "reflect";
  if(block.type==="checkpoint") return "prove";
  if(block.type==="story") return "read";
  if(block.type==="equation"&&/^Thinking Equation$/i.test(text)) return "understand";
  if(block.type!=="section"||/^(?:OR|Part\s+[A-Z]\s*:)/i.test(text)) return null;
  if(unitType==="assessment") return "prove";
  if(/^(?:Learning Outcomes|Key Vocabulary|Deepening Insight|What (?:Is|Are)\b|How\b|Types?\b|Understanding\b)/i.test(text)) return "understand";
  return "read";
}

export function learningSections(blocks:ContentBlock[], unitType:UnitContent["type"]="lesson"):LearningSection[]{
  const sections:LearningSection[]=[];
  blocks.forEach((block,index)=>{
    const mode=boundaryMode(block,unitType);
    if(index!==0&&!mode) return;
    if(sections.length) sections[sections.length-1].end=index;
    const context=block.kind==="text"&&/^Try This at Home\b/i.test(sourceCopy(block.text))?"home"
      :block.kind==="text"&&["activity","reflection","checkpoint"].includes(block.type)?block.type as "activity"|"reflection"|"checkpoint":null;
    sections.push({start:index,end:blocks.length,mode:unitType==="assessment"?"prove":mode??"read",context,
      title:block.kind==="text"&&mode?sourceCopy(block.text):undefined,anchor:`learning-${block.id??index}`});
  });
  for(const section of sections){
    if(section.mode!=="do"||section.context!=="activity") continue;
    const taskBlocks=blocks.slice(section.start,section.end);
    if(taskBlocks.some(block=>block.kind==="text"&&(block.text.includes("☐")||/\b(?:choose your top|values sort)\b/i.test(block.text)))) section.mode="decide";
  }
  return sections;
}

export function valueSelection(blocks:ContentBlock[],index:number):ValueSelection|null{
  const block=blocks[index];
  if(block?.kind!=="text"||!/_{3,}/.test(block.text)) return null;
  const instruction=blocks[index-1];
  if(instruction?.kind!=="text") return null;
  const words:Record<string,number>={one:1,three:3,five:5};
  const directive=sourceCopy(block.text.includes("choose")?block.text:instruction.text);
  const match=directive.match(/\bchoose\s+(?:your\s+)?top\s+(ONE|THREE|FIVE)\b/i);
  if(!match||!/value|from your (?:five|three)/i.test(directive)) return null;
  const count=words[match[1].toLowerCase()];
  const earlier=blocks.slice(0,index);
  if(/from your (?:five|three)/i.test(directive)){
    const fromIndex=earlier.findLastIndex(candidate=>candidate.kind==="text"&&/_{3,}/.test(candidate.text)&&/my top five|choose your top THREE/i.test(candidate.text));
    return fromIndex>=0?{count,options:[],fromIndex,allowCustom:false}:null;
  }
  const table=earlier.findLast(candidate=>candidate.kind==="table"&&/^Value$/i.test(candidate.rows[0]?.[0]??""));
  if(table?.kind!=="table") return null;
  return {count,options:table.rows.slice(1).map(row=>sourceCopy(row[0]??"")).filter(Boolean),allowCustom:/add any/i.test(directive)};
}
