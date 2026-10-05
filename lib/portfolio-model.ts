import { responseView } from "./response-identity";
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

export function isTensionSectionHeading(block:ContentBlock){
  if(block.kind!=="text") return false;
  const text=cleanMarkup(block.text);
  return TENSION_RE.test(text) && (
    block.type==="activity" ||
    block.type==="portfolio" ||
    /^Tension\s*\/\s*Experiment\s+Log/i.test(text)
  );
}

export function isRemovedLogBlock(block:ContentBlock){
  if(block.kind!=="text") return false;
  return isTensionSectionHeading(block) || SAVE_LOG_RE.test(block.text);
}

export function sanitizeRemovedLogReferences(text:string){
  return text
    .replace(/One experiment from your Log that changed how you see yourself/gi,"One experience this term that changed how you see yourself")
    .replace(/You conducted experiments\. You kept a Log\. You learned to notice\./gi,"You conducted experiments. You learned to notice.")
    .replace(/,?\s*every Log entry/gi,"")
    .replace(/,?\s*all Log entries/gi,"")
    .replace(/,?\s*your Log(?=[.,])/gi,"")
    .replace(/☐\s*All Tension\s*\/\s*Experiment Log entries[^☐]*/gi,"")
    .replace(/\s{2,}/g," ")
    .trim();
}

export function isMeaningfulPortfolioBlock(block:ContentBlock){
  return block.kind==="text" && block.type==="portfolio" && !isRemovedLogBlock(block)
    && !(block.text.includes("=")&&!/^Portfolio:/i.test(block.text.trim()));
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
  let suppressLogSection=false;

  unit.blocks.forEach((block,index)=>{
    if(suppressLogSection){
      const boundary=block.kind==="text" && (
        ["activity","reflection","checkpoint","portfolio","story","section"].includes(block.type) ||
        /^Part\s+[A-Z]\s*:/i.test(block.text.trim())
      );
      if(boundary && !isRemovedLogBlock(block)) suppressLogSection=false;
      else return;
    }

    if(isTensionSectionHeading(block)){
      suppressLogSection=true;
      blockIndices=[];
      return;
    }

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
        id:`${unit.id}::portfolio::${block.id??index}`,
        title,
        instruction:"Captured automatically from this activity.",
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
    const label=cleanMarkup(sanitizeRemovedLogReferences(block.text))
      .replace(/_{3,}/g,"")
      .replace(/\s+:/g,":")
      .trim() || "Response";
    const structured=slot.match(/^response-(\d+)$/);
    if(structured){
      const group=label.match(/^((?:Question|Q)\s*\d+(?:\s*[—-]\s*[^:]+)?):/i)?.[1];
      return `${group||"Response"} · part ${Number(structured[1])+1}`;
    }
    return label;
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
  promptResponses=responseView(unit.id,unit.blocks,promptResponses);
  const allowed=new Set(definition.blockIndices);
  const prefix=`${unit.id}::block-`;

  const entries=Object.entries(promptResponses)
    .filter(([key,value])=>key.startsWith(prefix) && value.trim() && !key.endsWith("::row-count"));

  const splitBlocks=new Set<number>();
  entries.forEach(([key])=>{
    const match=key.match(/::block-(\d+)::response-\d+$/);
    if(match) splitBlocks.add(Number(match[1]));
  });

  return entries
    .map(([key,value])=>{
      const match=key.match(/::block-(\d+)::(.+)$/);
      if(!match) return null;
      const blockIndex=Number(match[1]);
      const slot=match[2];
      if(!allowed.has(blockIndex)) return null;
      if(slot==="response"&&splitBlocks.has(blockIndex)) return null;
      const block=unit.blocks[blockIndex];
      if(!block) return null;
      return {
        key,
        label:responseLabelForBlock(block,slot),
        value,
      };
    })
    .filter((item):item is PortfolioResponse=>Boolean(item));
}
