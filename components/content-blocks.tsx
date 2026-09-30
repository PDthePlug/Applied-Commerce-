import type { ContentBlock } from "@/lib/types";

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

export function ContentBlocks({blocks}:{blocks:ContentBlock[]}) {
  const views: React.ReactNode[]=[];
  let list: string[]=[];
  const flush=()=>{if(list.length){views.push(<ul key={`list-${views.length}`}>{list.map((x,i)=><li key={i}>{x}</li>)}</ul>);list=[];}};
  blocks.forEach((block,i)=>{
    if(block.kind==="text" && block.type==="list"){list.push(block.text);return;}
    flush();
    if(block.kind==="table"){
      views.push(<div className="source-table-wrap" key={`table-${i}`}><table><tbody>{block.rows.map((row,r)=><tr key={r}>{row.map((cell,c)=><td key={c}>{cell}</td>)}</tr>)}</tbody></table></div>);
    } else views.push(<TextBlockView block={block} key={`text-${i}`}/>);
  });
  flush();
  return <>{views}</>;
}
