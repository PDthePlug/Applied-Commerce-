"use client";

import { ChevronDown } from "lucide-react";
import type { ContentBlock, TextBlockType } from "@/lib/types";

type PromptContext = "activity" | "reflection" | "checkpoint" | null;
type IndexedBlock = { block: ContentBlock; index: number };

type Props = {
  blocks: ContentBlock[];
  unitId: string;
  promptResponses: Record<string,string>;
  onSavePromptResponse: (promptId:string,value:string)=>void;
};

const BLANK_RE = /_{3,}/;
const STANDALONE_NUMBER_RE = /^\d+[.)]?$/;
const QUESTION_RE = /^(?:Question|Q)\s*\d+\s*(?::|—|-|\.|\))/i;
const INTERROGATIVE_RE = /(?:^|[.!?]\s+)(?:what|why|how|which|who|where|when|if|do|did|can|could|would|have|has|are|is)\b/i;
const IMPERATIVE_RE = /(?:^|[.!?]\s+)(?:write|list|name|describe|explain|identify|record|state|answer|complete|choose)\b/i;
const LABEL_PROMPT_RE = /^(?:Date|Name|My\b[^:]*|My\b.*\)|Goal|Action|Evidence|Result|Learning|Prediction|Next Action)\s*:\s*$/i;
const INSTRUCTION_ONLY_RE = /^(?:Complete|Fill in|Use)\s+(?:this|the)\s+(?:page|table|section|activity|worksheet|space)(?:\s+below)?\.?$/i;
const TENSION_RE = /tension\s*\/\s*experiment\s+log/i;

function cleanInlineMarkup(text:string){
  return text.replace(/\*\*/g,"").replace(/__/g,"").trim();
}

function promptId(unitId:string, blockIndex:number, slot:string|number){
  return `${unitId}::block-${blockIndex}::${slot}`;
}

function isTensionArtifact(block:ContentBlock){
  if(block.kind!=="text") return false;
  const text=block.text.trim();
  if(TENSION_RE.test(text)) return true;
  if(/^📂\s*Portfolio:\s*Save your Log entry\.?$/i.test(text)) return true;
  if(/^\|\s*Date\s*\|/i.test(text) && /(?:Experiment\/Observation|Launch Decision|Design Decision|Prediction|Result|Learning|Next Action)/i.test(text)) return true;
  return false;
}

function isMajorBoundary(block:ContentBlock){
  if(block.kind!=="text") return false;
  if(["activity","reflection","checkpoint","portfolio","story","section"].includes(block.type)) return true;
  return /^Part\s+[A-Z]\s*:/i.test(block.text.trim());
}

function isTensionSectionStarter(block:ContentBlock){
  if(block.kind!=="text" || !TENSION_RE.test(block.text)) return false;
  return isMajorBoundary(block) || /review|entry/i.test(block.text);
}

function pruneTensionContent(blocks:ContentBlock[]):IndexedBlock[]{
  const output:IndexedBlock[]=[];
  let suppressSection=false;

  blocks.forEach((block,index)=>{
    if(suppressSection){
      if(isMajorBoundary(block) && !isTensionArtifact(block)){
        suppressSection=false;
      } else {
        return;
      }
    }

    if(isTensionSectionStarter(block)){
      suppressSection=true;
      return;
    }

    if(isTensionArtifact(block)) return;
    output.push({block,index});
  });

  return output;
}

function isDeepeningInsight(block:ContentBlock){
  return block.kind==="text" && /deepening\s+insight/i.test(block.text);
}

function isInsightBoundary(block:ContentBlock){
  return block.kind==="text" && ["activity","reflection","checkpoint","portfolio","story","section"].includes(block.type);
}

function TextBlockView({block}:{block:Extract<ContentBlock,{kind:"text"}>}) {
  switch(block.type){
    case "list": return <li>{block.text}</li>;
    case "section": return <h3 className="source-section">{block.text}</h3>;
    case "activity": return <div className="source-callout activity"><span>Activity</span><strong>{block.text.replace(/^✍️\s*/,"")}</strong></div>;
    case "reflection": return <div className="source-callout reflection"><span>Reflect</span><strong>{block.text.replace(/^💭\s*/,"")}</strong></div>;
    case "checkpoint": return <div className="source-callout checkpoint"><span>Checkpoint</span><strong>{block.text.replace(/^✅\s*/,"")}</strong></div>;
    case "portfolio": return <div className="source-callout portfolio"><span>Portfolio</span><strong>{block.text.replace(/^📂\s*/,"")}</strong></div>;
    case "story": return <h3 className="story-heading">{block.text}</h3>;
    case "learning": return <p className="learning-line">{block.text}</p>;
    case "equation": return <blockquote className="equation">{block.text}</blockquote>;
    default: return <p>{block.text}</p>;
  }
}

function ResponseStatus({value}:{value:string}){
  return <span className={value.trim()?"response-status saved":"response-status"}>{value.trim()?"Saved on this device":"Type your response"}</span>;
}

function ResponseArea({
  id,
  value,
  onChange,
  label,
  compact=false,
}:{
  id:string;
  value:string;
  onChange:(value:string)=>void;
  label:string;
  compact?:boolean;
}){
  if(compact){
    return <div className="short-response-wrap">
      <input
        className="short-response"
        aria-label={label}
        autoComplete="off"
        value={value}
        onChange={event=>onChange(event.target.value)}
        placeholder="Type your answer"
      />
      <ResponseStatus value={value}/>
    </div>;
  }
  return <div className="prompt-response-control">
    <textarea
      id={id}
      aria-label={label}
      autoComplete="off"
      rows={3}
      value={value}
      onChange={event=>onChange(event.target.value)}
      placeholder="Write your response here…"
    />
    <ResponseStatus value={value}/>
  </div>;
}

function FillBlankLine({
  text,
  unitId,
  blockIndex,
  promptResponses,
  onSavePromptResponse,
  slotPrefix="blank",
}:{
  text:string;
  unitId:string;
  blockIndex:number;
  promptResponses:Record<string,string>;
  onSavePromptResponse:(promptId:string,value:string)=>void;
  slotPrefix?:string;
}){
  const parts=text.split(/(_{3,})/g);
  let slot=0;
  return <div className="fill-response-line">
    {parts.map((part,index)=>{
      if(!/^_{3,}$/.test(part)) return part?<span key={index} className="fill-response-copy">{part}</span>:null;
      const currentSlot=slot++;
      const id=promptId(unitId,blockIndex,`${slotPrefix}-${currentSlot}`);
      const value=promptResponses[id]??"";
      return <span className="fill-response-field" key={id}>
        <input
          aria-label={`Answer for: ${text.replace(/_{3,}/g,"blank")}`}
          autoComplete="off"
          value={value}
          onChange={event=>onSavePromptResponse(id,event.target.value)}
          placeholder="Type your answer"
        />
        {value.trim() && <small>Saved</small>}
      </span>;
    })}
  </div>;
}

function hasDedicatedInput(block?:ContentBlock){
  return Boolean(block?.kind==="text" && (BLANK_RE.test(block.text) || STANDALONE_NUMBER_RE.test(block.text) || LABEL_PROMPT_RE.test(block.text)));
}

function isAnswerPrompt(text:string, context:PromptContext, type:TextBlockType, nextBlock?:ContentBlock){
  const value=text.trim();
  if(INSTRUCTION_ONLY_RE.test(value)) return false;
  if(QUESTION_RE.test(value)) return true;
  if(INTERROGATIVE_RE.test(value) && value.includes("?")) return true;
  if(LABEL_PROMPT_RE.test(value)) return true;
  if(type==="activity" || type==="reflection" || type==="checkpoint" || type==="portfolio") return false;
  if((context==="reflection" || context==="checkpoint") && value.includes("?")) return true;
  if(context && IMPERATIVE_RE.test(value) && !hasDedicatedInput(nextBlock)) return true;
  return false;
}

function TableBlockView({
  block,
  unitId,
  blockIndex,
  promptResponses,
  onSavePromptResponse,
}:{
  block:Extract<ContentBlock,{kind:"table"}>;
  unitId:string;
  blockIndex:number;
  promptResponses:Record<string,string>;
  onSavePromptResponse:(promptId:string,value:string)=>void;
}){
  const headers=(block.rows[0]??[]).map(cleanInlineMarkup);
  const hasWorkbookCells=block.rows.slice(1).some(row=>row.some(cell=>{
    const value=cleanInlineMarkup(cell);
    return !value || /^_+$/.test(value);
  }));

  return <div className={`source-table-wrap ${hasWorkbookCells?"workbook-table":""}`}>
    <table>
      <tbody>
        {block.rows.map((row,rowIndex)=><tr key={rowIndex}>
          {row.map((cell,colIndex)=>{
            const cleaned=cleanInlineMarkup(cell);
            const editable=hasWorkbookCells && rowIndex>0 && (!cleaned || /^_+$/.test(cleaned));
            const containsBlank=BLANK_RE.test(cleaned);

            if(editable){
              const id=promptId(unitId,blockIndex,`table-${rowIndex}-${colIndex}`);
              const value=promptResponses[id]??"";
              const rowLabel=cleanInlineMarkup(row.find((value,index)=>index!==colIndex && cleanInlineMarkup(value))??"");
              const label=[headers[colIndex],rowLabel].filter(Boolean).join(" — ") || "Table response";
              return <td className="editable-cell" key={colIndex}>
                <textarea
                  aria-label={label}
                  rows={2}
                  value={value}
                  onChange={event=>onSavePromptResponse(id,event.target.value)}
                  placeholder="Type your answer"
                />
                {value.trim() && <small>Saved</small>}
              </td>;
            }

            if(rowIndex>0 && containsBlank){
              return <td className="inline-blank-cell" key={colIndex}>
                <FillBlankLine
                  text={cleaned}
                  unitId={unitId}
                  blockIndex={blockIndex}
                  promptResponses={promptResponses}
                  onSavePromptResponse={onSavePromptResponse}
                  slotPrefix={`table-${rowIndex}-${colIndex}`}
                />
              </td>;
            }

            return <td key={colIndex}>{cleaned}</td>;
          })}
        </tr>)}
      </tbody>
    </table>
  </div>;
}

export function ContentBlocks({blocks,unitId,promptResponses,onSavePromptResponse}:Props) {
  const indexed=pruneTensionContent(blocks);

  const renderIndexedBlocks=(items:IndexedBlock[],allowInsightGrouping=true)=>{
    const views:React.ReactNode[]=[];
    let list:Array<{text:string;index:number}>=[];
    let context:PromptContext=null;

    const flush=()=>{
      if(list.length){
        views.push(<ul key={`list-${list[0].index}`}>{list.map(item=><li key={item.index}>{item.text}</li>)}</ul>);
        list=[];
      }
    };

    for(let position=0;position<items.length;position+=1){
      const {block,index}=items[position];

      if(block.kind==="text" && block.type==="list"){
        list.push({text:block.text,index});
        continue;
      }
      flush();

      if(allowInsightGrouping && isDeepeningInsight(block)){
        context=null;
        let end=position+1;
        while(end<items.length && !isInsightBoundary(items[end].block)) end+=1;
        const insightBlocks=items.slice(position+1,end);
        views.push(<details className="deepening-insight" key={`insight-${index}`}>
          <summary>
            <div><span>Deepening Insight</span><small>Tap to explore</small></div>
            <ChevronDown aria-hidden="true"/>
          </summary>
          <div className="deepening-insight-body">{renderIndexedBlocks(insightBlocks,false)}</div>
        </details>);
        position=end-1;
        continue;
      }

      if(block.kind==="table"){
        views.push(<TableBlockView
          block={block}
          unitId={unitId}
          blockIndex={index}
          promptResponses={promptResponses}
          onSavePromptResponse={onSavePromptResponse}
          key={`table-${index}`}
        />);
        continue;
      }

      if(block.type==="activity" || block.type==="reflection" || block.type==="checkpoint"){
        context=block.type;
        views.push(<TextBlockView block={block} key={`text-${index}`}/>);
        continue;
      }

      if(block.type==="portfolio"){
        context=null;
        views.push(<TextBlockView block={block} key={`text-${index}`}/>);
        continue;
      }

      if(block.type==="story" || block.type==="section") context=null;

      if(BLANK_RE.test(block.text)){
        views.push(<div className="answerable-block fill-answerable-block" key={`fill-${index}`}>
          <FillBlankLine
            text={block.text}
            unitId={unitId}
            blockIndex={index}
            promptResponses={promptResponses}
            onSavePromptResponse={onSavePromptResponse}
          />
        </div>);
        continue;
      }

      if(STANDALONE_NUMBER_RE.test(block.text)){
        const id=promptId(unitId,index,"numbered");
        views.push(<div className="numbered-response" key={`numbered-${index}`}>
          <strong>{block.text}</strong>
          <ResponseArea
            compact
            id={id}
            value={promptResponses[id]??""}
            onChange={value=>onSavePromptResponse(id,value)}
            label={`Response ${block.text}`}
          />
        </div>);
        continue;
      }

      if(isAnswerPrompt(block.text,context,block.type,items[position+1]?.block)){
        const id=promptId(unitId,index,"response");
        const compact=/^(?:Date|Name)\s*:/i.test(block.text.trim());
        views.push(<div className={`answerable-block ${LABEL_PROMPT_RE.test(block.text.trim())?"label-answerable-block":""}`} key={`prompt-${index}`}>
          <p className={block.type==="equation"?"question-prompt equation-question":"question-prompt"}>{block.text}</p>
          <ResponseArea
            compact={compact}
            id={id}
            value={promptResponses[id]??""}
            onChange={value=>onSavePromptResponse(id,value)}
            label={block.text}
          />
        </div>);
        continue;
      }

      views.push(<TextBlockView block={block} key={`text-${index}`}/>);
    }

    flush();
    return views;
  };

  return <>{renderIndexedBlocks(indexed)}</>;
}
