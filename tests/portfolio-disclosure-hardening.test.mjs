import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=(path)=>fs.readFileSync(path,"utf8");

test("portfolio disclosures stay collapsed by default without removing evidence",()=>{
  const portfolio=read("components/portfolio-dashboard.tsx");
  const synthesis=read("components/portfolio-synthesis.tsx");
  const presentation=read("components/presentation-system.tsx");
  assert.match(portfolio,/<details className="portfolio-artifact-responses">/);
  assert.match(portfolio,/<summary><span>View captured responses<\/span>/);
  assert.match(portfolio,/<details className="portfolio-secondary-details">/);
  assert.match(synthesis,/<details className="portfolio-synthesis-evidence">/);
  assert.match(synthesis,/<summary>Supporting work \(\{section\.evidence\.length\}\)<\/summary>/);
  assert.match(portfolio,/response\.value/);
  assert.match(portfolio,/state\.previousResponses/);
  assert.match(portfolio,/state\.responses/);
  assert.match(synthesis,/item\.feedback/);
  assert.match(synthesis,/item\.portfolioInterpretation/);
  assert.match(synthesis,/item\.nextPathway/);
  assert.doesNotMatch(portfolio,/<details className="portfolio-artifact-responses" open/);
  assert.doesNotMatch(synthesis,/<details className="portfolio-synthesis-evidence" open/);
});

test("lesson portfolio notice has only the requested compact label and preserves expanded instructions",()=>{
  const presentation=read("components/presentation-system.tsx");
  const styles=read("app/presentation.css");
  assert.match(presentation,/<details className="portfolio-capture-disclosure">/);
  assert.match(presentation,/<summary>[\s\S]*<span>Portfolio evidence<\/span>[\s\S]*<\/summary>/);
  assert.match(presentation,/instruction\.replace\(\/\^Portfolio:/);
  assert.match(presentation,/Your responses stay with this lesson on this device/);
  assert.doesNotMatch(presentation,/Saved with this lesson automatically|Tap to view details/);
  assert.match(styles,/\.portfolio-capture-disclosure summary:focus-visible/);
  assert.match(styles,/\.portfolio-capture-disclosure\[open\]/);
});

test("portfolio disclosures retain keyboard-visible focus styling",()=>{
  const styles=read("app/learner-record.css");
  assert.match(styles,/\.portfolio-artifact-responses[^\n]*focus-visible|\.portfolio-artifact-responses[\s\S]*:focus-visible/);
  assert.match(styles,/\.portfolio-secondary-details[\s\S]*:focus-visible/);
});
