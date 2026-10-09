import { createClient } from "@/lib/supabase/server";

const DEFAULTS = { appearance: "system", accent: "commerce", textSize: "standard", readingWidth: "standard" } as const;
const APPEARANCES = new Set(["system", "light", "warm", "dark"]);
const ACCENTS = new Set(["commerce", "blue", "amber", "sage"]);
const TEXT_SIZES = new Set(["small", "standard", "large", "extra_large"]);
const READING_WIDTHS = new Set(["narrow", "standard", "wide"]);
const ALLOWED_KEYS = new Set(["appearance", "accent", "textSize", "readingWidth"]);
const PRIVATE_HEADERS = { "cache-control": "private, no-store" };

type Preferences = { appearance: string; accent: string; textSize: string; readingWidth: string };

function responseError(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: PRIVATE_HEADERS });
}

async function authenticatedClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { response: responseError("Sign in is required to sync settings.", 401) } as const;
  return { supabase, user: data.user } as const;
}

function fromRow(row: { appearance: string; accent: string; text_size: string; reading_width: string } | null): Preferences {
  return row ? { appearance: row.appearance, accent: row.accent, textSize: row.text_size, readingWidth: row.reading_width } : { ...DEFAULTS };
}

export async function GET() {
  try {
    const auth = await authenticatedClient();
    if ("response" in auth) return auth.response;
    const { data, error } = await auth.supabase.from("account_preferences").select("appearance,accent,text_size,reading_width").eq("user_id", auth.user.id).maybeSingle();
    if (error) throw error;
    return Response.json({ preferences: fromRow(data) }, { headers: PRIVATE_HEADERS });
  } catch (cause) {
    console.error("Applied Commerce preferences read failed", cause);
    return responseError("Settings could not be loaded. Please try again.", 503);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await authenticatedClient();
    if ("response" in auth) return auth.response;
    let body: Record<string, unknown>;
    try { body = await request.json() as Record<string, unknown>; }
    catch { return responseError("Settings could not be read. Check the values and try again.", 400); }
    if (!body || Array.isArray(body) || typeof body !== "object" || Object.keys(body).some(key => !ALLOWED_KEYS.has(key))) {
      return responseError("Check the settings values and try again.", 400);
    }
    if (Object.keys(body).length === 0) return responseError("No settings changes were provided.", 400);
    if (body.appearance !== undefined && (typeof body.appearance !== "string" || !APPEARANCES.has(body.appearance))) return responseError("Choose a valid appearance.", 400);
    if (body.accent !== undefined && (typeof body.accent !== "string" || !ACCENTS.has(body.accent))) return responseError("Choose a valid accent colour.", 400);
    if (body.textSize !== undefined && (typeof body.textSize !== "string" || !TEXT_SIZES.has(body.textSize))) return responseError("Choose a valid text size.", 400);
    if (body.readingWidth !== undefined && (typeof body.readingWidth !== "string" || !READING_WIDTHS.has(body.readingWidth))) return responseError("Choose a valid reading width.", 400);

    const currentResult = await auth.supabase.from("account_preferences").select("appearance,accent,text_size,reading_width").eq("user_id", auth.user.id).maybeSingle();
    if (currentResult.error) throw currentResult.error;
    const current = fromRow(currentResult.data);
    const preferences: Preferences = { ...current, ...body } as Preferences;
    const saved = await auth.supabase.from("account_preferences").upsert({
      user_id: auth.user.id,
      appearance: preferences.appearance,
      accent: preferences.accent,
      text_size: preferences.textSize,
      reading_width: preferences.readingWidth,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (saved.error) throw saved.error;
    return Response.json({ preferences }, { headers: PRIVATE_HEADERS });
  } catch (cause) {
    console.error("Applied Commerce preferences write failed", cause);
    return responseError("That setting could not be saved. Please try again.", 503);
  }
}
