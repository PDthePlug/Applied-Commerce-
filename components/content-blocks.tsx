"use client";

import { responseView, persistResponseKey } from "@/lib/response-identity";
import { Plus } from "lucide-react";
import type { ContentBlock, TextBlockType } from "@/lib/types";
import { cleanMarkup, isRemovedLogBlock, sanitizeRemovedLogReferences } from "@/lib/portfolio-model";
import { DeepeningInsightPanel, LearningNotice, PortfolioCaptureNotice, ResponseSurface, ThinkingEquationNotice } from "./presentation-system";

type PromptContext = "activity" | "reflection" | "checkpoint" | "home" | null;
type PromptMode = "checkpoint" | "home";
type StructuredPrompt = { prompt:string; helper?:string };
type PromptBreakdown = { groupLabel?:string; intro?:string; prompts:StructuredPrompt[] };
type IndexedBlock = { block: ContentBlock; index: number };

type Props = {
  blocks: ContentBlock[];
  unitId: string;
  promptResponses: Record<string,string>;
  onSavePromptResponse: (promptId:string,value:string)=>void;
};

const BLANK_RE= /_{3,}/;
const STANDALONE_NUMBER_RE=/^\d+[.)]?$/;
const QUESTION_RE=/^(?:Question|Q)\s*\d+\s*(?::|—|-|\.|\))/i;
const INTERROGATIVE_RE=/(?:^|[.!?]\s+)(?:what|why|how|which|who|where|when|if|do|did|can|could|would|have|has|are|is)\b/i;
const IMPERATIVE_RE=/(?:^|[.!?]\s+)(?:write|list|name|describe|explain|identify|record|state|answer|choose)\b/i;
const TENSION_RE=/tension\s*\/\s*experiment\s+log/i;
const PART_HEADING_RE=/^Part\s+[A-Z]\s*:/i;
const INSTRUCTION_ONLY_RE=/^(?:Complete|Fill in|Use)\s+(?:this|the|these)\s+(?:page|table|section|activity|worksheet|space|sentences|questions)(?:\s+below)?\.?$/i;
const NUMBER_WORDS:Record<string,number>={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10};
const HOME_HEADING_RE=/^(?:🏠\s*)?Try This at Home(?:\s*(?:—|-)\s*(.+))?$/i;
const HOME_ALTERNATIVE_RE=/^(?:If you cannot|If you can't|If you are unable|If there is no|If no one|If you do not|If you don't|If you share\b|If you want\b|Otherwise\b)/i;
const QUESTION_GROUP_RE=/^((?:Question|Q)\s*\d+(?:\s*[—-]\s*[^:]+)?)\s*:\s*(.*)$/i;
const SCAFFOLD_START_RE=/^(?:Is it because|Or because|Or is it|Could it be|For example|For instance|It might be|Maybe|Say,)\b/i;
const GUIDANCE_START_RE=/^(?:Be specific|Write both\.?$|Do not |Don't |Listen\b|Just listen\b|Just receive\b|Read\b|Look at\b|Review\b|Think about\b|Consider\b)/i;
const STRUCTURED_IMPERATIVE_RE=/^(?:(?:Now\s+)?Design|Write|Answer|Explain|Name|List|Give|Describe|Identify|Calculate|Show|Predict|Record|State|Complete|Choose|Trace|Map|Draw)\b/i;

function displayText(text:string){
  return sanitizeRemovedLogReferences(text);
}

function promptId(unitId:string,blockIndex:number,slot:string|number){
  return `${unitId}::block-${blockIndex}::${slot}`;
}

function portfolioMessage(){
  return <PortfolioCaptureNotice/>;
}


function homeTaskSubtype(text:string){
  const match=displayText(text).trim().match(HOME_HEADING_RE);
  return match ? (match[1]?.trim() || "Try This at Home") : null;
}

function maskQuotedText(text:string){
  const quotes:string[]=[];
  const masked=text.replace(/(["“])[\s\S]*?(["”])/g,match=>{
    const token=`__AC_QUOTE_${quotes.length}__`;
    quotes.push(match);
    return token;
  });
  return {masked,quotes};
}

function restoreQuotedText(text:string,quotes:string[]){
  return quotes.reduce((value,quote,index)=>value.split(`__AC_QUOTE_${index}__`).join(quote),text);
}

function splitAuthorSentences(text:string){
  const {masked,quotes}=maskQuotedText(text);
  const coarse=masked.match(/.+?(?:[?!](?=\s|$)|\.(?=\s|$)|$)/g)??[masked];
  const directiveSplit=/\s+(?=(?:Write\b|Answer\b|Then track\b|Now write\b|Then write\b|Show your (?:calculations|working)\b))/;
  return coarse
    .flatMap(value=>value.trim().split(directiveSplit))
    .map(value=>restoreQuotedText(value.trim(),quotes))
    .filter(Boolean);
}

function sentenceCase(value:string){
  return value ? value.charAt(0).toUpperCase()+value.slice(1) : value;
}

function splitCompoundInterrogative(sentence:string){
  const {masked,quotes}=maskQuotedText(sentence);
  const match=masked.match(/\s+(?:—\s*)?and\s+(?=(?:what|why|how|where|who|which|when|would|could|do|does|did|is|are)\b)/i);
  if(!match||!masked.includes("?")) return [sentence];
  const start=match.index??0;
  const left=restoreQuotedText(masked.slice(0,start).replace(/[\s,—]+$/,""),quotes);
  const right=restoreQuotedText(masked.slice(start+match[0].length).trim(),quotes);
  return [
    left.endsWith("?")?left:`${left}?`,
    sentenceCase(right.endsWith("?")?right:`${right}?`),
  ];
}

function splitCompoundImperative(sentence:string){
  if(/^Write down\s+(?:their|the person's)\s+name\s+and\s+(?:the\s+)?date\s+you\s+told\s+them\.?$/i.test(sentence.trim())){
    return ["Who did you tell?","What date did you tell them?"];
  }
  return [sentence];
}

function normaliseStructuredPrompt(text:string){
  return text
    .replace(/^\(\d+\)\s*/,"")
    .replace(/^(?:Then\s+track\s+[^:]+:\s*)\(\d+\)\s*/i,"")
    .replace(/^(?:Now write|Then write)\s*:\s*/i,"")
    .trim();
}

function appendPromptHelper(prompt:StructuredPrompt,value:string){
  prompt.helper=[prompt.helper,value].filter(Boolean).join(" ").trim();
}

function buildPromptBreakdown(text:string,mode:PromptMode):PromptBreakdown{
  let raw=displayText(text).trim();
  let groupLabel:string|undefined;
  const groupMatch=raw.match(QUESTION_GROUP_RE);
  if(groupMatch){
    groupLabel=groupMatch[1].trim();
    raw=groupMatch[2].trim();
  }

  const sentences=splitAuthorSentences(raw)
    .flatMap(splitCompoundImperative)
    .flatMap(splitCompoundInterrogative);
  const prompts:StructuredPrompt[]=[];
  const intro:string[]=[];

  sentences.forEach(sentence=>{
    const value=normaliseStructuredPrompt(sentence);
    if(!value) return;

    if(SCAFFOLD_START_RE.test(value)&&prompts.length){
      appendPromptHelper(prompts[prompts.length-1],value);
      return;
    }

    if(GUIDANCE_START_RE.test(value)){
      if(prompts.length&&/^(?:Be specific|Write both\.?$|Do not |Don't |Listen\b|Just listen\b|Just receive\b)/i.test(value)){
        appendPromptHelper(prompts[prompts.length-1],value);
      }else{
        intro.push(value);
      }
      return;
    }

    const {masked}=maskQuotedText(value);
    if(masked.includes("?")){
      prompts.push({prompt:value});
      return;
    }

    if(/^For each,\s*(?:state|explain|describe|identify|record)\b/i.test(value)){
      prompts.push({prompt:value});
      return;
    }

    if(STRUCTURED_IMPERATIVE_RE.test(value)){
      if(mode==="home"&&/^Write (?:a )?reflection on\b/i.test(value)){
        intro.push(value);
      }else{
        prompts.push({prompt:value});
      }
      return;
    }

    if(prompts.length){
      appendPromptHelper(prompts[prompts.length-1],value);
    }else{
      intro.push(value);
    }
  });

  return {groupLabel,intro:intro.join(" ").trim()||undefined,prompts};
}

function compactStructuredPrompt(prompt:string){
  const value=prompt.trim();
  return value.length<92&&/^(?:Who\b|When\b|What date\b|How many\b|Name\b|Which\b|What is ONE\b|What was the clause\b|Are you\b|Did you\b)/i.test(value);
}

function isEquationMarker(block:ContentBlock){
  if(block.kind!=="text" || block.type!=="equation") return false;
  const text=cleanMarkup(displayText(block.text)).replace(/^⬜\s*/,"").trim();
  return /^Thinking Equation$/i.test(text);
}

function looksLikeEquationValue(block?:ContentBlock){
  if(!block || block.kind!=="text" || block.type!=="paragraph") return false;
  const text=displayText(block.text).trim();
  if(!text || text.length>180 || text.includes("?")) return false;
  if(PART_HEADING_RE.test(text)) return false;
  return true;
}

function TextBlockView({block}:{block:Extract<ContentBlock,{kind:"text"}>}) {
  const text=displayText(block.text);
  if(PART_HEADING_RE.test(text)) return <h3 className="module-part-heading">{text}</h3>;
  if(/^My Term\s+\d+\s+Portfolio Entry/i.test(text)) return <h3 className="module-section-heading">{text}</h3>;
  switch(block.type){
    case "list": return <li>{text}</li>;
    case "section": return <h3 className="source-section">{text}</h3>;
    case "activity": return <LearningNotice tone="activity" title={text.replace(/^✍️\s*/,"")}/>;
    case "reflection": return <LearningNotice tone="reflection" title={text.replace(/^💭\s*/,"")}/>;
    case "checkpoint": return <LearningNotice tone="checkpoint" title={text.replace(/^✅\s*/,"")}/>;
    case "portfolio": return portfolioMessage();
    case "story": return <h3 className="story-heading">{text}</h3>;
    case "learning": return <p className="learning-line">{text}</p>;
    case "equation": return <p className="equation-reference">{text}</p>;
    default: return <p>{text}</p>;
  }
}

function ResponseStatus({value}:{value:string}){
  return <span className={value.trim()?"response-status saved":"response-status"}>{value.trim()?"Captured":"Type your response"}</span>;
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


function PreviousCombinedResponse({value}:{value:string}){
  if(!value.trim()) return null;
  return <details className="previous-combined-response">
    <summary>Previous combined response</summary>
    <p>{value}</p>
    <small>This answer was kept from before the question was separated into individual response fields.</small>
  </details>;
}

function StructuredResponseGroup({
  breakdown,
  unitId,
  blockIndex,
  promptResponses,
  onSavePromptResponse,
}:{
  breakdown:PromptBreakdown;
  unitId:string;
  blockIndex:number;
  promptResponses:Record<string,string>;
  onSavePromptResponse:(promptId:string,value:string)=>void;
}){
  const many=breakdown.prompts.length>1;
  const legacyId=promptId(unitId,blockIndex,"response");
  const legacyValue=many?(promptResponses[legacyId]??""):"";

  return <section className="structured-response-group">
    {(breakdown.groupLabel||breakdown.intro)&&<header className="structured-response-heading">
      {breakdown.groupLabel&&<strong>{breakdown.groupLabel}</strong>}
      {breakdown.intro&&<p>{breakdown.intro}</p>}
    </header>}

    <div className="structured-response-parts">
      {breakdown.prompts.map((part,index)=>{
        const slot=many?`response-${index}`:"response";
        const id=promptId(unitId,blockIndex,slot);
        const value=promptResponses[id]??"";
        const compact=compactStructuredPrompt(part.prompt);
        return <ResponseSurface
          key={id}
          compact={compact}
          prompt={<>
            {many&&<span className="structured-part-label">Part {index+1} of {breakdown.prompts.length}</span>}
            <p className="question-prompt">{part.prompt}</p>
            {part.helper&&<small className="structured-prompt-helper">{part.helper}</small>}
          </>}
        >
          <ResponseArea
            compact={compact}
            id={id}
            value={value}
            onChange={next=>onSavePromptResponse(id,next)}
            label={part.prompt}
          />
        </ResponseSurface>;
      })}
    </div>

    <PreviousCombinedResponse value={legacyValue}/>
  </section>;
}

function HomeAlternative({children}:{children:React.ReactNode}){
  return <details className="home-alternative-path">
    <summary>If the main task is not possible</summary>
    <div>{children}</div>
  </details>;
}

function parseMultiBlankFields(text:string){
  const blanks=[...text.matchAll(/_{3,}/g)];
  if(blanks.length<2) return null;
  const segments=text.split(/_{3,}/);
  const labels:string[]=[];
  let heading="";

  for(let index=0;index<blanks.length;index+=1){
    const segment=segments[index].trim();
    const lastColon=segment.lastIndexOf(":");
    if(lastColon<0) return null;
    const before=segment.slice(0,lastColon).trim();
    if(index===0){
      const previousColon=before.lastIndexOf(":");
      if(previousColon>=0){
        heading=before.slice(0,previousColon).trim();
        labels.push(before.slice(previousColon+1).trim()||`Response ${index+1}`);
      } else {
        labels.push(before||`Response ${index+1}`);
      }
    } else {
      const previousColon=before.lastIndexOf(":");
      labels.push((previousColon>=0?before.slice(previousColon+1):before).trim()||`Response ${index+1}`);
    }
  }

  return {heading,labels};
}

function MultiBlankFields({
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
  const parsed=parseMultiBlankFields(text);
  if(!parsed) return null;
  return <div className="multi-field-answerable">
    {parsed.heading&&<h4>{parsed.heading}</h4>}
    <div className="multi-field-grid">
      {parsed.labels.map((label,index)=>{
        const id=promptId(unitId,blockIndex,`blank-${index}`);
        const value=promptResponses[id]??"";
        return <label key={id}><span>{label}</span><input value={value} onChange={event=>onSavePromptResponse(id,event.target.value)} placeholder="Type your answer"/>{value.trim()&&<small>Saved</small>}</label>;
      })}
    </div>
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
      if(!/^_{3,}$/.test(part)) return part?<span key={index} className="fill-response-copy">{displayText(part)}</span>:null;
      const currentSlot=slot++;
      const id=promptId(unitId,blockIndex,`${slotPrefix}-${currentSlot}`);
      const value=promptResponses[id]??"";
      return <span className="fill-response-field" key={id}>
        <input
          aria-label={`Answer for: ${displayText(text).replace(/_{3,}/g,"blank")}`}
          autoComplete="off"
          value={value}
          onChange={event=>onSavePromptResponse(id,event.target.value)}
          placeholder="Type your answer"
        />
        {value.trim()&&<small>Saved</small>}
      </span>;
    })}
  </div>;
}

function ChoiceBlock({
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
  const cleaned=displayText(text);
  const parts=cleaned.split("☐");
  const prefix=(parts.shift()??"").trim();
  const options=parts.map(value=>value.trim()).filter(Boolean).filter(value=>!TENSION_RE.test(value));
  const choiceId=promptId(unitId,blockIndex,"choice");
  const selected=(promptResponses[choiceId]??"").split("\n").map(value=>value.trim()).filter(Boolean);
  const multi=/check all|choose at least|rank|completed all|portfolio|full year|term \d/i.test(prefix) || !prefix;
  const singleChoice=!multi && (
    prefix.includes("?") ||
    /^(?:My (?:option|chosen option|risk tolerance)|Am I|Is |Do |Did |Have |Can |Given )/i.test(prefix)
  );

  const toggle=(option:string)=>{
    if(singleChoice){
      onSavePromptResponse(choiceId,selected.includes(option)?"":option);
      return;
    }
    const next=selected.includes(option)?selected.filter(value=>value!==option):[...selected,option];
    onSavePromptResponse(choiceId,next.join("\n"));
  };

  return <div className="choice-answerable">
    {prefix&&<div className="choice-prefix">
      {BLANK_RE.test(prefix)
        ? <FillBlankLine text={prefix} unitId={unitId} blockIndex={blockIndex} promptResponses={promptResponses} onSavePromptResponse={onSavePromptResponse} slotPrefix="choice-prefix"/>
        : <p>{prefix}</p>}
    </div>}
    <div className="choice-options" role={singleChoice?"radiogroup":"group"} aria-label={prefix||"Select options"}>
      {options.map((rawOption,index)=>{
        const hasDetail=BLANK_RE.test(rawOption);
        const option=cleanMarkup(rawOption.replace(/_{3,}/g,"")).trim()||`Option ${index+1}`;
        const active=selected.includes(option);
        const detailId=promptId(unitId,blockIndex,`choice-${index}-detail`);
        return <div className={`choice-option-wrap ${active?"selected":""}`} key={`${option}-${index}`}>
          <button
            type="button"
            className="choice-option"
            role={singleChoice?"radio":"checkbox"}
            aria-checked={active}
            onClick={()=>toggle(option)}
          ><span aria-hidden="true">{active?"✓":""}</span><strong>{option}</strong></button>
          {hasDetail&&active&&<input
            className="choice-detail"
            value={promptResponses[detailId]??""}
            onChange={event=>onSavePromptResponse(detailId,event.target.value)}
            placeholder="Add details"
            aria-label={`Details for ${option}`}
          />}
        </div>;
      })}
    </div>
    <ResponseStatus value={selected.join(" ")}/>
  </div>;
}

function isMajorBoundary(block:ContentBlock){
  if(block.kind!=="text") return false;
  if(homeTaskSubtype(block.text)) return true;
  if(["activity","reflection","checkpoint","portfolio","story","section"].includes(block.type)) return true;
  return PART_HEADING_RE.test(block.text.trim());
}

function pruneTensionContent(blocks:ContentBlock[]):IndexedBlock[]{
  const output:IndexedBlock[]=[];
  let suppressSection=false;

  blocks.forEach((block,index)=>{
    if(suppressSection){
      if(isMajorBoundary(block)&&!isRemovedLogBlock(block)) suppressSection=false;
      else return;
    }

    if(block.kind==="text"&&TENSION_RE.test(block.text)&&isMajorBoundary(block)){
      suppressSection=true;
      return;
    }

    if(isRemovedLogBlock(block)) return;
    output.push({block,index});
  });

  return output;
}

function isDeepeningInsight(block:ContentBlock){
  return block.kind==="text"&&/deepening\s+insight/i.test(block.text);
}

function isInsightBoundary(block:ContentBlock){
  return block.kind==="text"&&(Boolean(homeTaskSubtype(block.text))||["activity","reflection","checkpoint","portfolio","story","section"].includes(block.type));
}

function hasDedicatedInput(block?:ContentBlock){
  return Boolean(block?.kind==="text"&&(BLANK_RE.test(block.text)||STANDALONE_NUMBER_RE.test(block.text)));
}

function isGenericActivityLabel(text:string,context:PromptContext,nextBlock?:ContentBlock){
  if(!context||context==="home") return false;
  const value=text.trim();
  if(!value.endsWith(":")||PART_HEADING_RE.test(value)) return false;
  if(/^(?:Learning Outcomes|Key Vocabulary|You met|You learned|Tell your future self|Complete these sentences|Answer these questions)\s*:/i.test(value)) return false;
  if(nextBlock?.kind==="table") return false;
  if(nextBlock?.kind==="text"&&nextBlock.type==="list") return false;
  return true;
}

function isAnswerPrompt(text:string,context:PromptContext,type:TextBlockType,nextBlock?:ContentBlock){
  const value=displayText(text).trim();
  if(!value||INSTRUCTION_ONLY_RE.test(value)) return false;
  if(QUESTION_RE.test(value)) return true;
  if(!context) return false;
  if(INTERROGATIVE_RE.test(value)&&value.includes("?")) return true;
  if(isGenericActivityLabel(value,context,nextBlock)) return true;
  if(type==="activity"||type==="reflection"||type==="checkpoint"||type==="portfolio") return false;
  if((context==="reflection"||context==="checkpoint")&&value.includes("?")) return true;
  if(context&&/(?:\.\.\.|…)\s*$/.test(value)) return true;
  if(context&&context!=="home"&&IMPERATIVE_RE.test(value)&&!hasDedicatedInput(nextBlock)) return true;
  return false;
}

function inferMinimumRows(items:IndexedBlock[],position:number){
  let numberedMax=0;
  for(let offset=1;offset<=12&&position-offset>=0;offset+=1){
    const block=items[position-offset].block;
    if(block.kind!=="text") continue;
    const match=displayText(block.text).trim().match(/^(\d+)[.)]?$/);
    if(match) numberedMax=Math.max(numberedMax,Number(match[1]));
    else if(numberedMax>0) break;
  }
  if(numberedMax>=2&&numberedMax<=10) return numberedMax;

  const nearby=items.slice(Math.max(0,position-5),position)
    .map(item=>item.block.kind==="text"?displayText(item.block.text):"")
    .join(" ");
  const explicit=nearby.match(/(?:at least|write|list|include|create)[^.!?]{0,45}?\b(one|two|three|four|five|six|seven|eight|nine|ten|\d+)\b/i);
  if(explicit){
    const token=explicit[1].toLowerCase();
    const value=NUMBER_WORDS[token]??Number(token);
    if(Number.isFinite(value)&&value>=1&&value<=10) return value;
  }
  return 3;
}

function TableBlockView({
  block,
  unitId,
  blockIndex,
  promptResponses,
  onSavePromptResponse,
  minimumRows=3,
}:{
  block:Extract<ContentBlock,{kind:"table"}>;
  unitId:string;
  blockIndex:number;
  promptResponses:Record<string,string>;
  onSavePromptResponse:(promptId:string,value:string)=>void;
  minimumRows?:number;
}){
  const headers=(block.rows[0]??[]).map(value=>cleanMarkup(displayText(value)));
  const headerOnly=block.rows.length===1;
  const hasWorkbookCells=headerOnly||block.rows.slice(1).some(row=>row.some(cell=>{
    const value=cleanMarkup(cell);
    return !value||/^_+$/.test(value);
  }));
  const countId=promptId(unitId,blockIndex,"row-count");
  const storedCount=Number(promptResponses[countId]??"");
  const generatedRows=headerOnly?Math.max(minimumRows,Number.isFinite(storedCount)&&storedCount>0?storedCount:0):0;
  const rows=headerOnly
    ? [block.rows[0],...Array.from({length:generatedRows},()=>Array.from({length:headers.length},()=>""))]
    : block.rows;

  return <div className={`source-table-wrap ${hasWorkbookCells?"workbook-table":""}`}>
    <table>
      <tbody>
        {rows.map((row,rowIndex)=><tr key={rowIndex}>
          {row.map((cell,colIndex)=>{
            const cleaned=cleanMarkup(displayText(cell));
            const editable=hasWorkbookCells&&rowIndex>0&&(!cleaned||/^_+$/.test(cleaned));
            const containsBlank=BLANK_RE.test(cleaned);

            if(editable){
              const id=promptId(unitId,blockIndex,`table-${rowIndex}-${colIndex}`);
              const value=promptResponses[id]??"";
              const rowLabel=cleanMarkup(row.find((value,index)=>index!==colIndex&&cleanMarkup(value))??"");
              const label=[rowLabel,headers[colIndex],headerOnly?`Entry ${rowIndex}`:""].filter(Boolean).join(" — ")||"Table response";
              return <td className="editable-cell" key={colIndex}>
                <textarea
                  aria-label={label}
                  rows={2}
                  value={value}
                  onChange={event=>onSavePromptResponse(id,event.target.value)}
                  placeholder="Type your answer"
                />
                {value.trim()&&<small>Saved</small>}
              </td>;
            }

            if(rowIndex>0&&containsBlank){
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
    {headerOnly&&<button className="add-table-row" type="button" onClick={()=>onSavePromptResponse(countId,String(generatedRows+1))}><Plus/>Add another row</button>}
  </div>;
}

export function ContentBlocks({blocks,unitId,promptResponses:storedResponses,onSavePromptResponse:saveResponse}:Props) {
  const promptResponses=responseView(unitId,blocks,storedResponses);
  const onSavePromptResponse=(key:string,value:string)=>saveResponse(persistResponseKey(unitId,blocks,key),value);
  const indexed=pruneTensionContent(blocks);

  const renderIndexedBlocks=(items:IndexedBlock[],allowInsightGrouping=true)=>{
    const views:React.ReactNode[]=[];
    let list:Array<{text:string;index:number}>=[];
    let context:PromptContext=null;

    const flush=()=>{
      if(list.length){
        views.push(<ul key={`list-${list[0].index}`}>{list.map(item=><li key={item.index}>{displayText(item.text)}</li>)}</ul>);
        list=[];
      }
    };

    for(let position=0;position<items.length;position+=1){
      const {block,index}=items[position];

      if(block.kind==="text"&&block.type==="list"){
        list.push({text:block.text,index});
        continue;
      }
      flush();

      if(allowInsightGrouping&&isDeepeningInsight(block)){
        context=null;
        let end=position+1;
        while(end<items.length&&!isInsightBoundary(items[end].block)) end+=1;
        const insightBlocks=items.slice(position+1,end);
        views.push(<DeepeningInsightPanel key={`insight-${index}`}>{renderIndexedBlocks(insightBlocks,false)}</DeepeningInsightPanel>);
        position=end-1;
        continue;
      }

      if(block.kind==="text"&&block.type==="equation"){
        if(isEquationMarker(block)){
          const next=items[position+1]?.block;
          if(looksLikeEquationValue(next) && next?.kind==="text"){
            views.push(<ThinkingEquationNotice equation={displayText(next.text)} key={`equation-${index}`}/>);
            position+=1;
          }else{
            views.push(<ThinkingEquationNotice equation="Pause here and hold this idea." key={`equation-${index}`}/>);
          }
        }else{
          views.push(<p className="equation-reference" key={`equation-reference-${index}`}>{displayText(block.text)}</p>);
        }
        continue;
      }

      if(block.kind==="table"){
        views.push(<TableBlockView
          block={block}
          unitId={unitId}
          blockIndex={index}
          promptResponses={promptResponses}
          onSavePromptResponse={onSavePromptResponse}
          minimumRows={inferMinimumRows(items,position)}
          key={`table-${index}`}
        />);
        continue;
      }

      if(block.kind==="text"){
        const homeSubtype=homeTaskSubtype(block.text);
        if(homeSubtype){
          context="home";
          views.push(<LearningNotice tone="home" title={homeSubtype} key={`home-${index}`}/>);
          continue;
        }
      }

      if(block.type==="activity"||block.type==="reflection"||block.type==="checkpoint"){
        context=block.type;
        views.push(<TextBlockView block={block} key={`text-${index}`}/>);
        continue;
      }

      if(block.type==="portfolio"){
        context=null;
        views.push(<TextBlockView block={block} key={`text-${index}`}/>);
        continue;
      }

      if(block.type==="story") context=null;
      // Activity parts keep their task context; unrelated sections end it.
      if(block.type==="section"&&!PART_HEADING_RE.test(block.text)) context=null;

      if(block.text.includes("☐")){
        views.push(<ChoiceBlock
          text={block.text}
          unitId={unitId}
          blockIndex={index}
          promptResponses={promptResponses}
          onSavePromptResponse={onSavePromptResponse}
          key={`choice-${index}`}
        />);
        continue;
      }

      if(BLANK_RE.test(block.text)){
        const multi=parseMultiBlankFields(block.text);
        if(multi){
          views.push(<MultiBlankFields text={block.text} unitId={unitId} blockIndex={index} promptResponses={promptResponses} onSavePromptResponse={onSavePromptResponse} key={`multi-${index}`}/>);
        } else {
          views.push(<div className="answerable-block fill-answerable-block" key={`fill-${index}`}>
            <FillBlankLine text={block.text} unitId={unitId} blockIndex={index} promptResponses={promptResponses} onSavePromptResponse={onSavePromptResponse}/>
          </div>);
        }
        continue;
      }

      if(STANDALONE_NUMBER_RE.test(block.text)){
        const id=promptId(unitId,index,"numbered");
        views.push(<div className="numbered-response" key={`numbered-${index}`}>
          <strong>{displayText(block.text)}</strong>
          <ResponseArea compact id={id} value={promptResponses[id]??""} onChange={value=>onSavePromptResponse(id,value)} label={`Response ${displayText(block.text)}`}/>
        </div>);
        continue;
      }

      const nextBlock=items[position+1]?.block;

      if(context==="checkpoint"&&block.kind==="text"){
        const breakdown=buildPromptBreakdown(block.text,"checkpoint");
        if(breakdown.prompts.length>1||QUESTION_RE.test(displayText(block.text).trim())){
          if(breakdown.prompts.length){
            views.push(<StructuredResponseGroup
              breakdown={breakdown}
              unitId={unitId}
              blockIndex={index}
              promptResponses={promptResponses}
              onSavePromptResponse={onSavePromptResponse}
              key={`structured-checkpoint-${index}`}
            />);
            continue;
          }
        }
      }

      if(context==="home"&&block.kind==="text"){
        const alternative=HOME_ALTERNATIVE_RE.test(displayText(block.text).trim());
        const legacyValue=promptResponses[promptId(unitId,index,"response")]??"";

        if(hasDedicatedInput(nextBlock)){
          const instruction=<div className="home-task-instruction">
            <p>{displayText(block.text)}</p>
            <PreviousCombinedResponse value={legacyValue}/>
          </div>;
          views.push(alternative
            ? <HomeAlternative key={`home-alt-${index}`}>{instruction}</HomeAlternative>
            : <div key={`home-instruction-${index}`}>{instruction}</div>);
          continue;
        }

        const breakdown=buildPromptBreakdown(block.text,"home");
        if(breakdown.prompts.length){
          const responses=<StructuredResponseGroup
            breakdown={breakdown}
            unitId={unitId}
            blockIndex={index}
            promptResponses={promptResponses}
            onSavePromptResponse={onSavePromptResponse}
          />;
          views.push(alternative
            ? <HomeAlternative key={`home-alt-${index}`}>{responses}</HomeAlternative>
            : <div key={`home-response-${index}`}>{responses}</div>);
          continue;
        }

        if(alternative){
          views.push(<HomeAlternative key={`home-alt-${index}`}><p>{displayText(block.text)}</p></HomeAlternative>);
          continue;
        }
      }

      if(isAnswerPrompt(block.text,context,block.type,nextBlock)){
        const id=promptId(unitId,index,"response");
        const compact=/^(?:Date|Name|Education|Skills)\b/i.test(displayText(block.text).trim());
        views.push(<ResponseSurface key={`prompt-${index}`} compact={compact} prompt={<p className={block.type==="equation"?"question-prompt equation-question":"question-prompt"}>{displayText(block.text)}</p>}>
          <ResponseArea compact={compact} id={id} value={promptResponses[id]??""} onChange={value=>onSavePromptResponse(id,value)} label={displayText(block.text)}/>
        </ResponseSurface>);
        continue;
      }

      views.push(<TextBlockView block={block} key={`text-${index}`}/>);
    }

    flush();
    return views;
  };

  return <>{renderIndexedBlocks(indexed)}</>;
}

// Deployment retry checkpoint: 2026-10-01
