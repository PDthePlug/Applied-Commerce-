import type { ContentBlock, UnitContent } from "./types";

export type PortfolioDefinition = {
  id: string;
  title: string;
  instruction: string;
  blockIndices: number[];
};

export type PortfolioResponse = {
  key: string;
  label: string;
  value: string;
};

const TENSION_RE=/tension\s*\/\s*experiment\s+log/i;
const SAVE_LOG_RE=/Portfolio:\s*Save (?:your |the )?(?:final )?Log entry/i;

export function cleanMarkup(text:string){
  return text.replace(/\*\*/g,"").replace(/__/g,"").replace(/^[📂✍️💭✅]\s*/u,"").trim();
}

export function isRemovedLogBlock(block:ContentBlock){
  if(block.kind!=="text") return false;
  return TENSION_RE.test(block.text) || SAVE_LOG_RE.test(block.text);
}

export function sanitizeRemovedLogReferences(text:string){
  return text
    .replace(/One experiment from your Log that changed how you see yourself/gi,"One experience this term that changed how you see yourself")
    .replace(/You conducted experiments\. You kept a Log\. You learned to notice\./gi,"You conducted experiments. You learned to notice.")
    .replace(/,?\s*every Log entry/gi,"")
    .replace(/,?\s*all Log entries/gi,"")
    .replace(/,?\s*your Log(?=[.,])/gi,"")
    .replace(/\s{2,}/g," ")
    .trim();
}

export function isMeaningfulPortfolioBlock(block:ContentBlock){
  return block.kind==="text" && block.type==="portfolio" && !isRemovedLogBlock(block);
}

function contextTitle(block:ContentBlock, fallback:string){
  if(block.kind!=="text") return fallback;
  return cleanMarkup(block.text)
    .replace(/^Activity\s+/i,"Activity ")
    .replace(/^Portfolio:\s*/i,"")
    .trim() || fallback;
}

export function buildPortfolioDefinitions(unit:UnitContent):PortfolioDefinition[]{
  const definitions:PortfolioDefinition[]=[];
  let title=unit.title;
  let blockIndices:number[]=[];

  unit.blocks.forEach((block,index)=>{
    if(isRemovedLogBlock(block)){
      blockIndices=[];
      return;
    }

    if(block.kind==="text" && ["activity","reflection","checkpoint"].includes(block.type)){
      title=contextTitle(block,unit.title);
      blockIndices=[];
      return;
    }

    if(isMeaningfulPortfolioBlock(block)){
      definitions.push({
        id:`${unit.id}::portfolio::${index}`,
        title,
        instruction:cleanMarkup(block.text).replace(/^Portfolio:\s*/i,""),
        blockIndices:[...blockIndices],
      });
      blockIndices=[];
      return;
    }

    blockIndices.push(index);
  });

  return definitions;
}

function responseLabelForBlock(block:ContentBlock,slot:string){
  if(block.kind==="text"){
    return cleanMarkup(sanitizeRemovedLogReferences(block.text))
      .replace(/_{3,}/g,"")
      .replace(/\s+:/g,":")
      .trim() || "Response";
  }

  const tableMatch=slot.match(/^table-(\d+)-(\d+)/);
  if(!tableMatch) return "Table response";
  const rowIndex=Number(tableMatch[1]);
  const colIndex=Number(tableMatch[2]);
  const headers=(block.rows[0]??[]).map(cleanMarkup);
  const header=headers[colIndex]||"Response";
  const sourceRow=block.rows[rowIndex];
  const rowLabel=sourceRow
    ? sourceRow.map(cleanMarkup).find((value,index)=>index!==colIndex && value)
    : "";
  return rowLabel ? `${rowLabel} — ${header}` : `Entry ${rowIndex}: ${header}`;
}

export function responsesForPortfolio(
  unit:UnitContent,
  definition:PortfolioDefinition,
  promptResponses:Record<string,string>,
):PortfolioResponse[]{
  const allowed=new Set(definition.blockIndices);
  const prefix=`${unit.id}::block-`;

  return Object.entries(promptResponses)
    .filter(([key,value])=>key.startsWith(prefix) && value.trim() && !key.endsWith("::row-count"))
    .map(([key,value])=>{
      const match=key.match(/::block-(\d+)::(.+)$/);
      if(!match) return null;
      const blockIndex=Number(match[1]);
      if(!allowed.has(blockIndex)) return null;
      const block=unit.blocks[blockIndex];
      if(!block) return null;
      return {
        key,
        label:responseLabelForBlock(block,match[2]),
        value,
      };
    })
    .filter((item):item is PortfolioResponse=>Boolean(item));
}
