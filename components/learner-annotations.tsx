"use client";
import {confidenceMeaning} from '@/lib/response-annotations';

export function ConfidenceLegend(){
 return <div className="annotation-legend" id="ability-marker-legend"><p>Mark each statement: ⭐ — Statements you genuinely believe. ❓ — Statements you are unsure about.</p><small>Select one symbol, or select it again to leave the statement unmarked.</small></div>;
}

export function ConfidenceMarkers({label,value,onChange}:{label:string;value:string;onChange:(value:string)=>void}){
 return <div className="confidence-markers">
  <div className="confidence-marker-buttons" role="group" aria-label={`Confidence for ${label}`} aria-describedby="ability-marker-legend">
   {([['believe','⭐','I genuinely believe'],['unsure','❓','I am unsure about']] as const).map(([key,icon,meaning])=><button key={key} type="button" aria-pressed={value===key} aria-label={`${meaning} ${label}; select again to clear`} onClick={()=>onChange(value===key?'':key)}><span aria-hidden="true">{icon}</span></button>)}
  </div>
  <span className="printed-annotation">{confidenceMeaning[value]??'Unmarked'}</span>
 </div>;
}

export function SourceSelectionControl({label,options,value,onChange}:{label:string;options:string[];value:string;onChange:(value:string)=>void}){
 const choices=[...new Set(options)];
 return <label className="source-selection-control"><span>{label}</span><select value={value} onChange={event=>onChange(event.target.value)}>
  <option value="">Leave unmarked</option>
  {value&&!choices.includes(value)&&<option value={value}>Earlier selection: {value}</option>}
  {choices.map(option=><option key={option} value={option}>{option}</option>)}
 </select><span className="printed-response">{value||'Unmarked'}</span>{!choices.length&&!value&&<small>Add your responses to the earlier list to choose one here.</small>}</label>;
}
