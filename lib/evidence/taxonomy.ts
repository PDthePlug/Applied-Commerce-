import type { DevelopmentStage, EvidenceDomain, EvidenceKind, RubricTemplate } from "./types";

const levels=(labels:[string,string,string,string], descriptions:[string,string,string,string])=>
  descriptions.map((description,index)=>({
    level:(index+1) as 1|2|3|4,
    label:labels[index],
    description,
  }));

const LEVEL_LABELS:[string,string,string,string]=["Beginning","Developing","Secure","Strong"];

export const RUBRICS:RubricTemplate[]=[
  {
    key:"analysis-v1",
    name:"Analysis and reasoning",
    purpose:"For checkpoints and analytical responses where the learner must explain, compare, connect or justify.",
    criteria:[
      {key:"task-coverage",label:"Addresses the task",description:"Responds to the actual question and its required parts.",weight:1,levels:levels(LEVEL_LABELS,[
        "The response does not yet address the task.",
        "The response addresses some of the task but leaves important parts unresolved.",
        "The response addresses the required task clearly.",
        "The response addresses the full task with precision and useful detail.",
      ])},
      {key:"reasoning",label:"Reasoning",description:"Shows why the learner reached the conclusion.",weight:1,levels:levels(LEVEL_LABELS,[
        "A conclusion is given without supporting reasoning.",
        "Some reasoning is present but connections are limited.",
        "Reasoning is clear and supports the conclusion.",
        "Reasoning is well connected, considered and shows depth.",
      ])},
      {key:"application",label:"Application",description:"Connects the idea to a real example, system, decision or consequence.",weight:1,levels:levels(LEVEL_LABELS,[
        "No meaningful application is visible yet.",
        "An example or application is mentioned but not developed.",
        "The response applies the idea appropriately.",
        "The response applies the idea thoughtfully and shows consequences or trade-offs.",
      ])},
    ],
  },
  {
    key:"reflection-v1",
    name:"Reflection and learning",
    purpose:"For reflections where the learner is making meaning from an experience, decision or change in thinking.",
    criteria:[
      {key:"specificity",label:"Specificity",description:"Uses concrete detail rather than a generic statement.",weight:1,levels:levels(LEVEL_LABELS,[
        "The reflection is too general to show what happened.",
        "Some specific detail is present.",
        "The reflection identifies a clear experience, thought or example.",
        "The reflection uses precise detail that makes the learning visible.",
      ])},
      {key:"insight",label:"Insight",description:"Explains what the learner noticed, understood or reconsidered.",weight:1,levels:levels(LEVEL_LABELS,[
        "The response describes without identifying learning.",
        "A learning point is present but lightly explained.",
        "The learner explains a meaningful insight.",
        "The learner shows a deeper shift, tension or connection in their thinking.",
      ])},
      {key:"next-step",label:"Next step",description:"Identifies what the learner will do, test or pay attention to next where relevant.",weight:1,levels:levels(LEVEL_LABELS,[
        "No next step is visible where one is required.",
        "A broad intention is stated.",
        "A practical next step is identified.",
        "The next step is specific, realistic and clearly linked to the reflection.",
      ])},
    ],
  },
  {
    key:"action-v1",
    name:"Action and real-world evidence",
    purpose:"For interviews, observations, behavioural experiments and launch tasks.",
    criteria:[
      {key:"action-evidence",label:"Evidence of action",description:"Shows that the learner actually carried out the required action.",weight:1,levels:levels(LEVEL_LABELS,[
        "There is not yet enough evidence that the action happened.",
        "The action is described but supporting detail is limited.",
        "The response provides credible evidence that the action was completed.",
        "The evidence is specific, traceable and clearly connected to the task.",
      ])},
      {key:"observation",label:"Observation",description:"Records what happened rather than only what the learner expected.",weight:1,levels:levels(LEVEL_LABELS,[
        "The response does not yet record what happened.",
        "Some result or observation is recorded.",
        "The learner records the relevant result clearly.",
        "The learner notices important detail, differences or unintended outcomes.",
      ])},
      {key:"learning",label:"Learning from action",description:"Explains what the learner learned from doing the task.",weight:1,levels:levels(LEVEL_LABELS,[
        "No learning is identified yet.",
        "A learning point is stated but not developed.",
        "The learner explains what the action taught them.",
        "The learner connects the action to a broader decision, system or future behaviour.",
      ])},
    ],
  },
  {
    key:"project-v1",
    name:"Project evidence",
    purpose:"For projects, maps, plans, presentations and multi-step portfolio work.",
    criteria:[
      {key:"completeness",label:"Completeness",description:"Includes the required elements of the project.",weight:1,levels:levels(LEVEL_LABELS,[
        "Major required elements are missing.",
        "The project is partially complete.",
        "The required elements are present.",
        "The project is complete, coherent and carefully developed.",
      ])},
      {key:"application",label:"Application",description:"Uses the curriculum idea in the project rather than only repeating theory.",weight:1,levels:levels(LEVEL_LABELS,[
        "The project does not yet apply the idea.",
        "Some application is visible.",
        "The project applies the idea appropriately.",
        "The application is thoughtful, contextual and shows trade-offs or consequences.",
      ])},
      {key:"evidence",label:"Use of evidence",description:"Uses observations, information, calculations or artefacts appropriately.",weight:1,levels:levels(LEVEL_LABELS,[
        "Evidence is absent or unrelated.",
        "Some relevant evidence is included.",
        "Relevant evidence supports the work.",
        "Evidence is well selected, interpreted and strengthens the project.",
      ])},
      {key:"communication",label:"Communication",description:"Makes the learner's thinking understandable to another person.",weight:1,levels:levels(LEVEL_LABELS,[
        "The work is difficult to follow.",
        "The main idea can be understood with some gaps.",
        "The work communicates its purpose and reasoning clearly.",
        "The work is clear, purposeful and communicates complex thinking effectively.",
      ])},
    ],
  },
];

export function stageForGrade(grade:number):DevelopmentStage{
  if(grade<=8) return "self-awareness";
  if(grade===9) return "agency";
  if(grade===10) return "strategy";
  if(grade===11) return "architecture";
  return "adult-execution";
}

export function rubricForKind(kind:EvidenceKind){
  if(kind==="reflection") return "reflection-v1";
  if(["action","interview","observation"].includes(kind)) return "action-v1";
  if(["project","plan"].includes(kind)) return "project-v1";
  if(["analysis","knowledge-response","calculation","structured-work"].includes(kind)) return "analysis-v1";
  return undefined;
}

export function domainsFor(stage:DevelopmentStage,kind:EvidenceKind,prompt:string):EvidenceDomain[]{
  const text=prompt.toLowerCase();
  const domains=new Set<EvidenceDomain>();
  if(stage==="self-awareness") domains.add("self-awareness");
  if(stage==="agency") domains.add("agency");
  if(stage==="strategy") domains.add("decision-making");
  if(stage==="architecture") domains.add("systems-thinking");
  if(stage==="adult-execution") domains.add("execution");

  if(/money|income|cost|price|profit|budget|saving|credit|tax|bank|insurance|interest|financial/.test(text)) domains.add("financial-capability");
  if(/value|customer|business|enterprise|product|service|market/.test(text)) domains.add("value-creation");
  if(/system|chain|flow|power|leak|structure|network|community|economy/.test(text)) domains.add("systems-thinking");
  if(/why|compare|difference|consequence|trade[- ]?off|analyse|analyze/.test(text)) domains.add("economic-reasoning");
  if(/observe|observation|interview|ask |research|survey|map|trace/.test(text)) domains.add("research-observation");
  if(/present|explain|letter|conversation|tell |pitch|communicat/.test(text)) domains.add("communication");
  if(/plan|strategy|goal|next step|design|prepare/.test(text)) domains.add("planning");
  if(/do |try |this week|launch|implement|apply|open |file |sign |action/.test(text)) domains.add("execution");
  if(/reflect|learned|notice|feel|belief|changed|future self/.test(text)||kind==="reflection") domains.add("reflection");

  if(domains.size===0) domains.add("decision-making");
  return [...domains];
}

export function rubricByKey(key?:string){
  return RUBRICS.find(rubric=>rubric.key===key);
}
