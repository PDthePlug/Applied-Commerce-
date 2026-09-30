"use client";

import type { ContentBlock, TextBlockType } from "@/lib/types";

type PromptContext = "activity" | "reflection" | "checkpoint" | null;

type Props = {
  blocks: ContentBlock[];
  unitId: string;
  promptResponses: Record<string,string>;
  onSavePromptResponse: (promptId:string,value:string)=>void;
};

const BLANK_RE = /_{3,}/;
const STANDALONE_NUMBER_RE = /^\d+[.)]?$/;
const QUESTION_RE = /^(?:Question|Q)\s*\d+\s*(?::|—|-|\.|\))/i;
const DIRECT_PROMPT_RE = /^(?:what|why|how|which|who|where|when|if|do|did|can|could|would|have|has|are|is|think about|look at)\b/i;
const IMPERATIVE_RE = /(?:^|[.!?]\s+)(?:write|list|name|describe|explain|identify|record|state|answer|complete)\b/i;

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

function promptId(unitId:string, blockIndex:number, slot:string|number){
  return `${unitId}::block-${blockIndex}::${slot}`;
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
}:{
  text:string;
  unitId:string;
  blockIndex:number;
  promptResponses:Record<string,string>;
  onSavePromptResponse:(promptId:string,value:string)=>void;
}){
  const parts=text.split(/(_{3,})/g);
  let slot=0;
  return <div className="fill-response-line">
    {parts.map((part,index)=>{
      if(!/^_{3,}$/.test(part)) return part?<span key={index} className="fill-response-copy">{part}</span>:null;
      const currentSlot=slot++;
      const id=promptId(unitId,blockIndex,`blank-${currentSlot}`);
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
  return Boolean(block?.kind==="text" && (BLANK_RE.test(block.text) || STANDALONE_NUMBER_RE.test(block.text)));
}

function isAnswerPrompt(text:string, context:PromptContext, type:TextBlockType, nextBlock?:ContentBlock){
  if(QUESTION_RE.test(text)) return true;
  if(type==="activity" || type==="reflection" || type==="checkpoint" || type==="portfolio") return false;
  const hasQuestion=text.includes("?");
  const directToLearner=/\b(?:you|your)\b/i.test(text);
  if(hasQuestion && directToLearner && DIRECT_PROMPT_RE.test(text)) return true;
  if((context==="reflection" || context==="checkpoint") && hasQuestion) return true;
  if(context && IMPERATIVE_RE.test(text) && !hasDedicatedInput(nextBlock)) return true;
  return false;
}

export function ContentBlocks({blocks,unitId,promptResponses,onSavePromptResponse}:Props) {
  const views: React.ReactNode[]=[];
  let list: string[]=[];
  let context: PromptContext=null;

  const flush=()=>{if(list.length){views.push(<ul key={`list-${views.length}`}>{list.map((x,i)=><li key={i}>{x}</li>)}</ul>);list=[];}};

  blocks.forEach((block,i)=>{
    if(block.kind==="text" && block.type==="list"){list.push(block.text);return;}
    flush();

    if(block.kind==="table"){
      views.push(<div className="source-table-wrap" key={`table-${i}`}><table><tbody>{block.rows.map((row,r)=><tr key={r}>{row.map((cell,c)=><td key={c}>{cell}</td>)}</tr>)}</tbody></table></div>);
      return;
    }

    if(block.type==="activity" || block.type==="reflection" || block.type==="checkpoint"){
      context=block.type;
      views.push(<TextBlockView block={block} key={`text-${i}`}/>);
      return;
    }

    if(block.type==="portfolio"){
      context=null;
      views.push(<TextBlockView block={block} key={`text-${i}`}/>);
      return;
    }

    if(block.type==="story" || block.type==="section"){
      context=null;
    }

    if(BLANK_RE.test(block.text)){
      views.push(<div className="answerable-block fill-answerable-block" key={`fill-${i}`}>
        <FillBlankLine
          text={block.text}
          unitId={unitId}
          blockIndex={i}
          promptResponses={promptResponses}
          onSavePromptResponse={onSavePromptResponse}
        />
        {QUESTION_RE.test(block.text) && block.text.includes("?") && <ResponseArea
          id={promptId(unitId,i,"detail")}
          value={promptResponses[promptId(unitId,i,"detail")]??""}
          onChange={value=>onSavePromptResponse(promptId(unitId,i,"detail"),value)}
          label={block.text}
        />}
      </div>);
      return;
    }

    if(STANDALONE_NUMBER_RE.test(block.text)){
      const id=promptId(unitId,i,"numbered");
      views.push(<div className="numbered-response" key={`numbered-${i}`}>
        <strong>{block.text}</strong>
        <ResponseArea
          compact
          id={id}
          value={promptResponses[id]??""}
          onChange={value=>onSavePromptResponse(id,value)}
          label={`Response ${block.text}`}
        />
      </div>);
      return;
    }

    if(isAnswerPrompt(block.text,context,block.type,blocks[i+1])){
      const id=promptId(unitId,i,"response");
      views.push(<div className="answerable-block" key={`prompt-${i}`}>
        {block.type==="equation"?<p className="question-prompt equation-question">{block.text}</p>:<p className="question-prompt">{block.text}</p>}
        <ResponseArea
          id={id}
          value={promptResponses[id]??""}
          onChange={value=>onSavePromptResponse(id,value)}
          label={block.text}
        />
      </div>);
      return;
    }

    views.push(<TextBlockView block={block} key={`text-${i}`}/>);
  });

  flush();
  return <>{views}</>;
}
