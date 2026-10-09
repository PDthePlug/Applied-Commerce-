import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";

const source = await readFile(new URL("../app/api/preferences/route.ts", import.meta.url), "utf8");
const state = { user: null, row: null, upserted: null, failRead: false, failWrite: false };
globalThis.__preferencesMocks = {
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user }, error: null }) },
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
  assert.equal(state.upserted.row.user_id, "learner-1");
  assert.equal(state.upserted.row.appearance, "dark");
  assert.equal(state.upserted.options.onConflict, "user_id");
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
