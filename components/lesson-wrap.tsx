import type {ReactNode} from 'react';
import type {LessonWrapContent} from '@/lib/lesson-wrap';
import {Sparkles} from 'lucide-react';
export function LessonWrap({content,children}:{content:LessonWrapContent;children?:ReactNode}){
 return <section className="lesson-wrap" aria-labelledby="lesson-wrap-title" data-learning-mode="reflect">
  <header><Sparkles aria-hidden="true"/><h2 id="lesson-wrap-title">Lesson Wrap</h2></header>
  <div className="lesson-wrap-synthesis">
   <h3>What we learned</h3><ul>{content.takeaways.map(text=><li key={text}>{text}</li>)}</ul>
   <h3>Why it matters</h3><p>{content.why}</p>
  </div>
  {children&&<div className="lesson-wrap-authored">{children}</div>}
  {content.next&&<div className="lesson-wrap-next"><h3>Coming next</h3><p>{content.next.title}</p></div>}
 </section>;
}
