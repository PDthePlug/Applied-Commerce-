import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");

function worker({ failNetwork = false, cacheNames = [] } = {}) {
  const listeners = new Map(), saved = [], removed = [], requests = [];
  const offline = new Response("offline recovery", { headers: { "Content-Type": "text/html" } });
  const cache = { addAll: async files => saved.push(...files), match: async path => path === "/offline.html" ? offline : path.startsWith("/pwa/") ? new Response("cached icon") : undefined };
  let claimed = false;
  vm.runInNewContext(source, {
    self: { location: { origin: "https://ac.example" }, clients: { claim: async () => { claimed = true; } }, addEventListener: (name, fn) => listeners.set(name, fn) },
    caches: { open: async () => cache, keys: async () => cacheNames, delete: async name => removed.push(name) },
    URL, Response,
    fetch: async request => { requests.push(request.url); if (failNetwork) throw new Error("offline"); return new Response("network"); },
  });
  const navigate = async (path, options = {}) => {
    let result;
    listeners.get("fetch")({ request: { url: new URL(path, "https://ac.example").href, method: "GET", mode: "navigate", ...options }, respondWith: value => { result = value; } });
    return result;
  };
  const lifecycle = async name => {
    let pending;
    listeners.get(name)({ waitUntil: value => { pending = value; } });
    await pending;
  };
  return { saved, removed, requests, navigate, lifecycle, claimed: () => claimed };
}

test("PWA install stores only public recovery assets", async () => {
  const sw = worker();
  await sw.lifecycle("install");
  assert.deepEqual(sw.saved, ["/offline.html", "/pwa/icon-192.png", "/pwa/icon-512.png", "/pwa/icon-maskable-512.png", "/pwa/apple-touch-icon.png"]);
});

test("PWA activation cleans only its own old caches", async () => {
  const sw = worker({ cacheNames: ["applied-commerce-pwa-v0", "applied-commerce-pwa-v1", "other-app", "learner-work"] });
  await sw.lifecycle("activate");
  assert.deepEqual(sw.removed, ["applied-commerce-pwa-v0"]);
  assert.equal(sw.claimed(), true);
});

test("navigation stays fresh online and recovers offline without caching HTML", async () => {
  const online = worker();
  assert.equal(await (await online.navigate("/portfolio")).text(), "network");
  assert.equal(online.saved.length, 0);
  const offline = worker({ failNetwork: true });
  assert.equal(await (await offline.navigate("/learn/8/term/1/g8-t1-l01-001")).text(), "offline recovery");
  assert.equal(offline.saved.length, 0);
});

test("offline recovery icons are served from the public cache", async () => {
  const sw = worker({ failNetwork: true });
  assert.equal(await (await sw.navigate("/pwa/icon-192.png", { mode: "cors" })).text(), "cached icon");
  assert.deepEqual(sw.requests, []);
});

test("PWA does not intercept auth, API, RSC, cross-origin or write requests", async () => {
  const sw = worker({ failNetwork: true });
  for (const [path, options] of [
    ["/auth/callback?code=private", {}], ["/auth", {}], ["/api/classroom", {}],
    ["/learn?_rsc=abc", { mode: "cors" }], ["https://auth.example/token", {}],
    ["/api/preferences", { method: "POST" }], ["/settings", { method: "POST" }],
    ["/curriculum/index.json", { mode: "cors" }],
  ]) assert.equal(await sw.navigate(path, options), undefined, path);
  assert.deepEqual(sw.requests, []);
});
