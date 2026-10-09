import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../lib/portfolio-synthesis.ts", import.meta.url), "utf8");
const javascript = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }
}).outputText;
const { buildPortfolioSynthesis } = await import("data:text/javascript;base64," + Buffer.from(javascript).toString("base64"));

const item = (id, unitId, status, extras = {}) => ({
  id,
  title: "Activity " + unitId,
  href: "/learn/9/term/1/" + unitId,
  unitId,
  domain: ["decision-making"],
  response: "A saved learner response",
  reviewedStatus: status,
  ...extras,
});

test("missing evidence is explicitly insufficient and never claims competency", () => {
  const sections = buildPortfolioSynthesis([]);
  assert.equal(sections.length, 6);
  assert.match(sections.find(section => section.key === "competency").conclusion, /not yet confirmed/i);
  assert.equal(sections.find(section => section.key === "competency").confidence, "insufficient");
  assert.match(sections.find(section => section.key === "growth").conclusion, /not yet enough/i);
});

test("one unreviewed response is evidence of participation, not competence or transfer", () => {
  const sections = buildPortfolioSynthesis([item("r1", "unit-a", undefined)]);
  assert.match(sections.find(section => section.key === "competency").conclusion, /not yet confirmed/i);
  assert.match(sections.find(section => section.key === "progression").conclusion, /does not yet establish/i);
  assert.match(sections.find(section => section.key === "edge").conclusion, /gap|not yet/i);
});

test("real staging-shaped case: nine saved responses across four contexts remain unconfirmed when none are reviewed", () => {
  const units = ["g8-t1-l01-001", "g8-t1-l03-003", "g8-t1-l04-004", "g12-t2-l21-021"];
  const records = Array.from({ length: 9 }, (_, index) => item(
    "staging-response-" + index,
    units[index % units.length],
    undefined,
    { createdAt: "2026-10-09T12:33:55.27137Z" }
  ));
  const sections = buildPortfolioSynthesis(records);
  assert.match(sections.find(section => section.key === "evidence").conclusion, /9 saved response\(s\) across 4 learning context\(s\)/i);
  assert.match(sections.find(section => section.key === "competency").conclusion, /not yet confirmed/i);
  assert.equal(sections.find(section => section.key === "competency").confidence, "insufficient");
  assert.match(sections.find(section => section.key === "growth").conclusion, /not yet enough dated, comparable reviewed evidence/i);
  assert.match(sections.find(section => section.key === "progression").conclusion, /does not yet establish/i);
  assert.match(sections.find(section => section.key === "edge").conclusion, /review is still missing/i);
});

test("accepted evidence in two contexts supports cautious progression and transfer", () => {
  const sections = buildPortfolioSynthesis([
    item("r1", "unit-a", "accepted"),
    item("r2", "unit-b", "verified"),
  ]);
  assert.match(sections.find(section => section.key === "progression").conclusion, /multiple contexts/i);
  assert.match(sections.find(section => section.key === "pathway").conclusion, /new problem/i);
  assert.equal(sections.find(section => section.key === "competency").confidence, "low");
});

test("growth requires dated accepted observations in the same evidence domain", () => {
  const insufficient = buildPortfolioSynthesis([
    item("r1", "unit-a", "accepted", { createdAt: "2026-09-01T10:00:00Z", domain: ["cost reasoning"] }),
    item("r2", "unit-b", "verified", { createdAt: "2026-09-12T10:00:00Z", domain: ["attention management"] }),
  ]);
  assert.match(insufficient.find(section => section.key === "growth").conclusion, /not yet enough dated, comparable reviewed evidence/i);

  const comparable = buildPortfolioSynthesis([
    item("r1", "unit-a", "accepted", { createdAt: "2026-09-01T10:00:00Z", domain: ["cost reasoning"] }),
    item("r2", "unit-b", "verified", { createdAt: "2026-09-12T10:00:00Z", domain: ["cost reasoning"] }),
  ]);
  assert.match(comparable.find(section => section.key === "growth").conclusion, /dated, reviewed observations in the same evidence domain/i);
  assert.equal(comparable.find(section => section.key === "growth").evidence.length, 2);
});

test("revision feedback and facilitator guidance take precedence over generic pathways", () => {
  const sections = buildPortfolioSynthesis([
    item("r1", "unit-a", "needs-revision", {
      portfolioInterpretation: "The learner identifies the issue but has not justified the choice.",
      nextPathway: "Rework the comparison table, then explain the trade-off in a new example.",
    }),
  ]);
  assert.equal(sections.find(section => section.key === "competency").conclusion, "The learner identifies the issue but has not justified the choice.");
  assert.equal(sections.find(section => section.key === "pathway").conclusion, "Rework the comparison table, then explain the trade-off in a new example.");
  assert.match(sections.find(section => section.key === "edge").conclusion, /need revision/i);
});
