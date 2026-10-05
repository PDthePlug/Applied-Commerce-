"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import type { AuthoredScale } from "@/lib/semantic-learning";

export function RatingControl({scale,label,value,onChange}:{scale:AuthoredScale;label:string;value:string;onChange:(value:string)=>void}){
  const valid=value===""||Array.from({length:scale.max-scale.min+1},(_,i)=>String(i+scale.min)).includes(value);
  return <div className="rating-control">
    <div className="rating-options" role="group" aria-label={label}>
      {Array.from({length:scale.max-scale.min+1},(_,index)=>String(scale.min+index)).map(option=><button
        type="button" key={option} aria-label={`${label}: ${option}`} aria-pressed={value===option}
        onClick={()=>onChange(value===option?"":option)}>{option}</button>)}
    </div>
    {!valid&&<p className="retained-answer">Earlier answer: {value}</p>}
    {value&&<small className="response-status saved">Captured on this device</small>}
  </div>;
}

export function RankingControl({options,label,value,onChange}:{options:string[];label:string;value:string;onChange:(value:string)=>void}){
  const saved=value.split("\n").filter(Boolean);
  const compatible=saved.every(option=>options.includes(option));
  const ordered=[...saved.filter(option=>options.includes(option)),...options.filter(option=>!saved.includes(option))];
  const move=(index:number,direction:number)=>{
    const next=[...ordered];
    [next[index],next[index+direction]]=[next[index+direction],next[index]];
    onChange(next.join("\n"));
  };
  return <div className="ranking-control">
    <p className="interaction-guidance">Use the arrows to put the options in order. Save the order when it reflects your priorities.</p>
    <ol aria-label={label||"Your ranking"}>
      {ordered.map((option,index)=><li key={option}>
        <span className="rank-position" aria-label={`Position ${index+1}`}>{index+1}</span><strong>{option}</strong>
        <div className="rank-actions">
          <button type="button" disabled={index===0} aria-label={`Move ${option} up`} onClick={()=>move(index,-1)}><ArrowUp/></button>
          <button type="button" disabled={index===ordered.length-1} aria-label={`Move ${option} down`} onClick={()=>move(index,1)}><ArrowDown/></button>
        </div>
      </li>)}
    </ol>
    {!compatible&&<p className="retained-answer">Earlier answer: {value}</p>}
    {saved.length>0&&saved.length<options.length&&<p className="interaction-guidance">Your earlier selections are shown first. Save to confirm the full ranking.</p>}
    <button className="confirm-ranking" type="button" onClick={()=>onChange(ordered.join("\n"))}>Save this order</button>
    <small className="response-status" aria-live="polite">{saved.length===options.length&&compatible?"Order captured on this device":"Order not yet confirmed"}</small>
  </div>;
}

export function ValuesControl({options,count,allowCustom,label,value,onChange}:{options:string[];count:number;allowCustom:boolean;label:string;value:string;onChange:(value:string)=>void}){
  const [custom,setCustom]=useState("");
  const selected=value.split("\n").filter(Boolean);
  const choices=[...new Set([...options,...selected])];
  const outsidePrevious=!allowCustom&&selected.some(option=>!options.includes(option));
  const toggle=(option:string)=>{
    if(selected.includes(option)) onChange(selected.filter(item=>item!==option).join("\n"));
    else if(selected.length<count) onChange([...selected,option].join("\n"));
  };
  return <div className="values-control">
    <div className="values-options" role="group" aria-label={label}>
      {choices.map(option=><button type="button" key={option} aria-pressed={selected.includes(option)}
        disabled={!selected.includes(option)&&selected.length>=count} onClick={()=>toggle(option)}>{option}</button>)}
    </div>
    {!options.length&&!selected.length&&<p className="interaction-guidance">Choose your values in the previous step first.</p>}
    {outsidePrevious&&<p className="retained-answer">An earlier selection no longer appears in the previous step. Review your selection here; it has been kept so your work is not lost.</p>}
    {allowCustom&&<form className="custom-value" onSubmit={event=>{
      event.preventDefault();
      const next=custom.trim();
      if(next&&!selected.includes(next)&&selected.length<count){onChange([...selected,next].join("\n"));setCustom("");}
    }}><label><span>Add a value of your own</span><input aria-label="Add a value of your own" value={custom} onChange={event=>setCustom(event.target.value)}/></label>
      <button type="submit" disabled={!custom.trim()||selected.length>=count}><Plus/>Add</button>
    </form>}
    <small className="selection-count" aria-live="polite">{selected.length} of {count} selected{selected.length?" · Captured on this device":""}</small>
  </div>;
}
