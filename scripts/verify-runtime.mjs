import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const root=path.resolve("public/curriculum");
const indexPath=path.join(root,"index.json");

function fail(message){ throw new Error(message); }
function readJson(file){ return JSON.parse(fs.readFileSync(file,"utf8")); }

if(!fs.existsSync(indexPath)) fail("Missing public/curriculum/index.json");
const index=readJson(indexPath);
if(index.product!=="Applied Commerce") fail("Unexpected curriculum product");
if(index.formatVersion!==3) fail(`Unsupported curriculum format: ${index.formatVersion}`);
if(!Array.isArray(index.grades)||!index.grades.length) fail("Curriculum index contains no grades");

let lessonCount=0;
let assessmentCount=0;
let blockCount=0;
let responseIdentityCount=0;
const globalIds=new Set();

for(const gradeMeta of index.grades){
  const gradeDir=root;
  if(!Number.isInteger(gradeMeta.grade)||gradeMeta.grade<1) fail("Invalid grade metadata");
  if(!Number.isInteger(gradeMeta.bundleParts)||gradeMeta.bundleParts<1) fail(`Grade ${gradeMeta.grade} has invalid bundleParts`);

  const encodedParts=[];
  for(let i=1;i<=gradeMeta.bundleParts;i++){
    const file=path.join(gradeDir,`grade-${gradeMeta.grade}.part-${i}.b64`);
    if(!fs.existsSync(file)) fail(`Missing Grade ${gradeMeta.grade} runtime part ${i}`);
    const part=fs.readFileSync(file,"utf8").trim();
    if(!part) fail(`Empty Grade ${gradeMeta.grade} runtime part ${i}`);
    encodedParts.push(part);
  }

  let bundle;
  try{
    const compressed=Buffer.from(encodedParts.join(""),"base64");
    bundle=JSON.parse(zlib.gunzipSync(compressed).toString("utf8"));
  }catch(error){
    fail(`Grade ${gradeMeta.grade} runtime bundle cannot be decoded: ${error.message}`);
  }

  if(bundle.grade!==gradeMeta.grade) fail(`Grade ${gradeMeta.grade} bundle identity mismatch`);
  if(!Array.isArray(bundle.terms)||bundle.terms.length!==4) fail(`Grade ${gradeMeta.grade} must contain four terms`);

  let gradeLessons=0;
  let gradeAssessments=0;

  for(const term of bundle.terms){
    if(!Number.isInteger(term.term)||term.term<1||term.term>4) fail(`Grade ${gradeMeta.grade} contains invalid term`);
    if(!Array.isArray(term.units)) fail(`Grade ${gradeMeta.grade} Term ${term.term} has no units array`);

    for(const unit of term.units){
      if(!unit.id||!unit.type||!unit.title||!Array.isArray(unit.blocks)) fail(`Malformed unit in Grade ${gradeMeta.grade} Term ${term.term}`);
      if(globalIds.has(unit.id)) fail(`Duplicate unit ID: ${unit.id}`);
      globalIds.add(unit.id);

      if(unit.type==="lesson") gradeLessons++;
      else if(unit.type==="assessment") gradeAssessments++;
      else fail(`Unsupported unit type: ${unit.type}`);

      const blockIds=new Set();
      for(const block of unit.blocks){
        blockCount++;
        if(!block.id) fail(`Unit ${unit.id} contains a block without stable identity`);
        if(blockIds.has(block.id)) fail(`Duplicate block ID ${block.id} in unit ${unit.id}`);
        blockIds.add(block.id);
        responseIdentityCount++;
      }
    }
  }

  if(gradeLessons!==gradeMeta.unitCount) fail(`Grade ${gradeMeta.grade} lesson count mismatch: index=${gradeMeta.unitCount}, runtime=${gradeLessons}`);
  if(gradeAssessments!==gradeMeta.assessmentCount) fail(`Grade ${gradeMeta.grade} assessment count mismatch: index=${gradeMeta.assessmentCount}, runtime=${gradeAssessments}`);

  lessonCount+=gradeLessons;
  assessmentCount+=gradeAssessments;
}

console.log(JSON.stringify({
  ok:true,
  curriculumFormat:index.formatVersion,
  grades:index.grades.length,
  lessons:lessonCount,
  assessments:assessmentCount,
  blocks:blockCount,
  stableBlocks:responseIdentityCount
},null,2));
