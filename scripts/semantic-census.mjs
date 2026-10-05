import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

export function typescriptModule(file){
  const code=ts.transpileModule(fs.readFileSync(file,"utf8"),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  return `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`;
}

export async function runtimeUnits(){
  const original=globalThis.fetch;
  globalThis.fetch=async url=>new Response(fs.readFileSync(path.join("public",url)));
  try{
    const {curriculum}=await import(typescriptModule("lib/curriculum.ts"));
    const index=await curriculum.index();
    const units=[];
    for(const grade of index.grades){
      for(const term of grade.terms){
        const data=await curriculum.term(grade.grade,term.term);
        for(const unit of [...data.units,...data.assessments]) units.push(await curriculum.unit(grade.grade,term.term,unit.id));
      }
    }
    return units;
  }finally{globalThis.fetch=original;}
}

export async function census(){
  const {learningSections,choiceMeaning,authoredScale,valueSelection}=await import(typescriptModule("lib/semantic-learning.ts"));
  const units=await runtimeUnits();
  const rows=[];
  for(const grade of [8,9,10,11,12]) for(const term of [1,2,3,4]){
    const selected=units.filter(unit=>unit.grade===grade&&unit.term===term);
    const modes={read:0,understand:0,decide:0,do:0,reflect:0,prove:0};
    let choices=0,rankings=0,scales=0,valueSteps=0;
    for(const unit of selected){
      for(const section of learningSections(unit.blocks,unit.type)) modes[section.mode]++;
      unit.blocks.forEach((block,index)=>{
        if(block.kind==="table") scales+=block.rows[0].filter(header=>authoredScale(header)).length;
        else{
          const previous=unit.blocks[index-1];
          const choice=choiceMeaning(block.text,previous?.kind==="text"?previous.text:"");
          if(choice){choices++;if(choice.kind==="ranking")rankings++;}
          if(valueSelection(unit.blocks,index))valueSteps++;
        }
      });
    }
    rows.push({grade,term,lessons:selected.filter(unit=>unit.type==="lesson").length,assessments:selected.filter(unit=>unit.type==="assessment").length,modes,choices,rankings,scaleColumns:scales,valueSteps});
  }
  return {renderer:"applied-commerce-v3",lessons:units.filter(unit=>unit.type==="lesson").length,assessments:units.filter(unit=>unit.type==="assessment").length,rows};
}

if(process.argv[1]===new URL(import.meta.url).pathname){
  const result=await census();
  const output=process.argv[2];
  if(output) fs.writeFileSync(output,`${JSON.stringify(result,null,2)}\n`);
  console.log(JSON.stringify(result));
}
