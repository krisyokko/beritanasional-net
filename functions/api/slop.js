// POST /api/slop — live AI slop check via Claude API.
// API key stays server-side (Pages secret ANTHROPIC_API_KEY), never in the browser.
// Body: { "text": "..." } → { ok:true, engine:"claude", result:{score,verdict,signals,tokens,chars} }
export async function onRequestPost(ctx) {
  try {
    const body = await ctx.request.json().catch(() => ({}));
    const text = String(body.text || "").slice(0, 4000).trim();
    if (!text) return Response.json({ ok: false, error: "empty" }, { status: 400 });
    if (text.length < 20) return Response.json({ ok: false, error: "too-short" }, { status: 400 });
    const key = ctx.env.ANTHROPIC_API_KEY;
    if (!key) return Response.json({ ok: false, error: "no-key" }, { status: 503 });

    const model = ctx.env.SLOP_MODEL || "claude-haiku-4-5-20251001";
    const sys = `You are SlopCheck, an anti-slop content scorer for Indonesian (ID) and English (EN) text. Score how much the text looks like AI slop / spam / clickbait. Respond with ONLY valid JSON, no markdown fences, in this exact shape:
{"score":0-100,"verdict":"CLEAN"|"SUSPECT"|"SLOP","signals":[{"id":"...","label":"...","value":0-100,"detail":"..."}],"summary":"one short sentence, ID or EN matching input"}
Rules: score<=30 CLEAN, 31-60 SUSPECT, >60 SLOP. Cover: caps shouting, punctuation/emoji spam, hashtags, link spam, clickbait & money-bait (ID: gacor, cuan, togel, maxwin; EN equivalents), AI-cliche ("delve","game-changer","unlock the future","merevolusi"), repetition, short-form spam. 5-9 signals. Be strict on money-bait and link spam.`;

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 700,
        system: sys,
        messages: [{ role: "user", content: `Score this text:\n\n${text}` }],
      }),
    });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      return Response.json({ ok: false, error: "claude-" + r.status, detail: t.slice(0, 200) }, { status: 502 });
    }
    const data = await r.json();
    const raw = (data.content || []).map((b) => b.text || "").join("").trim()
      .replace(/^```(json)?/i, "").replace(/```$/, "").trim();
    let result;
    try { result = JSON.parse(raw); }
    catch { return Response.json({ ok: false, error: "bad-json" }, { status: 502 }); }
    result.tokens = text.split(/\s+/).filter(Boolean).length;
    result.chars = text.length;
    if (typeof result.score !== "number" || !result.verdict || !Array.isArray(result.signals)) {
      return Response.json({ ok: false, error: "bad-shape" }, { status: 502 });
    }
    result.score = Math.max(0, Math.min(100, Math.round(result.score)));
    for (const s of result.signals) s.value = Math.max(0, Math.min(100, Math.round(s.value || 0)));
    return Response.json({ ok: true, engine: "claude", model, result });
  } catch (e) {
    return Response.json({ ok: false, error: "server-error" }, { status: 500 });
  }
}
