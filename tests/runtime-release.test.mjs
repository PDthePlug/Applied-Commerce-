import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("runtime release manifest is explicit and does not claim source fingerprinting",()=>{
 const release=JSON.parse(fs.readFileSync("public/curriculum/release.json","utf8"));
 const index=JSON.parse(fs.readFileSync("public/curriculum/index.json","utf8"));
 assert.equal(release.product,"Applied Commerce");
 assert.equal(release.runtimeFormatVersion,index.formatVersion);
 assert.match(release.releaseKey,/^ac-runtime-/);
 assert.equal(release.curriculumSourceStatus,"not-source-fingerprinted");
 assert.equal(release.sourceReleaseKey,null);
});
