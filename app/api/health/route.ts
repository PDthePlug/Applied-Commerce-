const HEADERS = { "cache-control": "no-store, max-age=0" };

// Public, read-only dependency probe. No identity, configuration secrets or
// provider response bodies are returned. This is availability, not certification.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const commit = process.env.VERCEL_GIT_COMMIT_SHA ?? null;
  let projectRef: string | null = null;
  try {
    const parsed = new URL(url ?? "");
    if (parsed.protocol !== "https:" || !/^[a-z]{20}\.supabase\.co$/.test(parsed.hostname) || parsed.username || parsed.password || parsed.port || parsed.pathname !== "/" || parsed.search || parsed.hash) throw new Error();
    projectRef = parsed.hostname.split(".")[0];
  } catch { /* Configuration failure is reported without its value. */ }
  if (!projectRef || !key || process.env.NEXT_PUBLIC_APPLIED_COMMERCE_BACKEND_MODE === "local") {
    return Response.json({ status: "unavailable", projectRef, commit, dependencies: { auth: false, dataAPI: false } }, { status: 503, headers: HEADERS });
  }
  const probe = async (path: string, dataProbe = false) => {
    try {
      const result = await fetch(new URL(path, url), { headers: { apikey: key }, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(5000) });
      if (dataProbe) {
        const body = await result.json();
        // OpenAPI requires a secret key. A zero-row curriculum query instead
        // checks a real database round trip with the existing public key.
        // An expected PostgreSQL permission denial also proves connectivity;
        // permissions stay intact and no learner records are queried.
        return (result.ok && Array.isArray(body) && body.length === 0)
          || ([401, 403].includes(result.status) && body?.code === "42501");
      }
      // Provider bodies are never logged or returned to the caller.
      await result.body?.cancel();
      return result.ok;
    } catch { return false; }
  };
  const [auth, dataAPI] = await Promise.all([probe("/auth/v1/health"), probe("/rest/v1/curriculum_releases?select=id&limit=0", true)]);
  const healthy = auth && dataAPI;
  return Response.json({ status: healthy ? "ok" : "unavailable", projectRef, commit, dependencies: { auth, dataAPI } }, { status: healthy ? 200 : 503, headers: HEADERS });
}
