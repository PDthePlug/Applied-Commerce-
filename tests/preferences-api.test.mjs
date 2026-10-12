import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";

const source = await readFile(new URL("../app/api/preferences/route.ts", import.meta.url), "utf8");
const state = { user: null, row: null, upserted: null, failRead: false, failWrite: false, active: true };
globalThis.__preferencesMocks = {
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user }, error: null }) },
    rpc: async (name,args) => name==='has_active_session'?{data:state.active,error:null}:(state.upserted={patch:args.p_patch,user_id:state.user.id},{data:{appearance:'system',accent:'commerce',text_size:'standard',reading_width:'standard',...state.row,...{appearance:args.p_patch.appearance??state.row?.appearance??'system',accent:args.p_patch.accent??state.row?.accent??'commerce',text_size:args.p_patch.textSize??state.row?.text_size??'standard',reading_width:args.p_patch.readingWidth??state.row?.reading_width??'standard'}},error:state.failWrite?new Error('write failed'):null}),
    from: () => ({
      select: () => ({ eq: (_column, id) => ({ maybeSingle: async () => state.failRead ? ({ data: null, error: new Error("read failed") }) : ({ data: id === state.user?.id ? state.row : null, error: null }) }) }),
      upsert: async (row, options) => { state.upserted = { row, options }; return { error: state.failWrite ? new Error("write failed") : null }; },
    }),
  }),
};
const moduleText = source.replace(/^import .*;\n/gm, "");
const moduleUrl = "data:text/javascript;base64," + Buffer.from("const {createClient}=globalThis.__preferencesMocks;\n" + stripTypeScriptTypes(moduleText)).toString("base64");
const { GET, PATCH } = await import(moduleUrl);
const patch = (body, expectedUserId) => PATCH(new Request("https://ac.invalid/api/preferences", { method: "PATCH", headers: { "content-type": "application/json", ...(expectedUserId ? { "x-ac-expected-user-id": expectedUserId } : {}) }, body: JSON.stringify(body) }));

test("signed-out preference reads and writes are denied", async () => {
  state.user = null;
  assert.equal((await GET()).status, 401);
  assert.equal((await patch({ appearance: "warm" })).status, 401);
});

test("preference reads return safe defaults and private cache headers", async () => {
  state.user = { id: "learner-1" }; state.row = null; state.failRead = false;
  const response = await GET();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.deepEqual((await response.json()).preferences, { appearance: "system", accent: "commerce", textSize: "standard", readingWidth: "standard" });
});

test("updates validate preference values and only write the authenticated account", async () => {
  state.user = { id: "learner-1" }; state.row = null; state.upserted = null; state.failRead = false; state.failWrite = false;
  const response = await patch({ appearance: "dark", accent: "sage" });
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).preferences, { appearance: "dark", accent: "sage", textSize: "standard", readingWidth: "standard" });
  assert.equal(state.upserted.user_id, "learner-1");
  assert.equal(state.upserted.patch.appearance, "dark");
  assert.deepEqual(state.upserted.patch, {appearance:"dark",accent:"sage"});
  state.upserted = null;
  const staleAccount = await patch({ appearance: "warm" }, "another-account");
  assert.equal(staleAccount.status, 409);
  assert.equal(state.upserted, null);
  for (const body of [{ appearance: "flashy" }, { accent: "not-a-colour" }, { textSize: "tiny" }, { readingWidth: "infinite" }, { user_id: "another-user", appearance: "warm" }, {}]) {
    assert.equal((await patch(body)).status, 400);
  }
});

test("storage failures return private service errors rather than claiming success", async () => {
  state.user = { id: "learner-1" }; state.failRead = true;
  const original = console.error; console.error = () => {};
  try {
    const response = await GET();
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("cache-control"), "private, no-store");
  } finally { state.failRead = false; state.failWrite = false; console.error = original; }
});

test("cross-origin settings writes are rejected", async () => {
  const response = await PATCH(new Request("https://ac.invalid/api/preferences", { method: "PATCH", headers: { "origin": "https://other.invalid", "content-type": "application/json" }, body: JSON.stringify({ appearance: "dark" }) }));
  assert.equal(response.status, 403);
});

test("revoked sessions cannot load defaults or save settings",async()=>{state.user={id:'learner-1'};state.active=false;try{assert.equal((await GET()).status,401);assert.equal((await patch({appearance:'dark'})).status,401);}finally{state.active=true;}});
