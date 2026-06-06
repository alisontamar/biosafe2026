import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const { lat, lng } = await req.json();

    // ── Clima real (siempre se ejecuta) ───────────────────────────────────────
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation`
    );
    const weather = await weatherRes.json();

    const temp: number = weather.current.temperature_2m;
    const rain: boolean = weather.current.precipitation > 0;

    // ── Riesgo calculado localmente (siempre se ejecuta, no depende de Gemini) ─
    let risk = "bajo";
    if (temp <= 5) risk = "alto";
    else if (temp < 17) risk = "moderado";
    if (rain && risk === "bajo") risk = "moderado";

    // ── Contexto climático estático ───────────────────────────────────────────
    // ESTÁTICO: estos textos se usan como contexto para el prompt de Gemini
    // y también como FALLBACK si Gemini falla (429, error de red, sin key, etc.)
    const climaContext =
      temp <= 5
        ? "Hace mucho frío. Recomienda abrigar bien a los niños con ropa de abrigo, evitar salir en las horas más frías y estar atento a síntomas respiratorios."
        : temp < 17
        ? "Hace frío moderado. Recomienda llevar abrigo, especialmente en niños pequeños, y mantener los espacios ventilados pero cálidos."
        : temp >= 30
        ? "Hace calor intenso. Recomienda mantener a los niños hidratados, evitar exposición al sol en horas pico y buscar lugares frescos."
        : temp >= 25
        ? "Hace calor moderado. Recomienda hidratación frecuente, ropa ligera en niños y evitar actividades al aire libre en el mediodía."
        : "Temperatura templada. Aun así recomienda mantener el calendario de vacunación al día y atender síntomas inusuales.";

    // ESTÁTICO: igual que climaContext, es fallback si Gemini no responde
    const lluviaContext = rain
      ? "Está lloviendo. Recomienda evitar acumulación de agua estancada y extremar higiene para prevenir enfermedades de transmisión hídrica."
      : "";

    // ── Gemini (IA real) ───────────────────────────────────────────────────────
    // Si Gemini responde OK → title y message vienen de aquí (texto generado por IA)
    // Si Gemini falla (429 rate limit, sin key, error de red) → se usan los fallbacks estáticos de abajo
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    const prompt = `Eres un asistente de salud preventiva para Bolivia.

Datos actuales:
- Temperatura: ${temp}°C
- Lluvia: ${rain ? "Sí" : "No"}
- Nivel de riesgo: ${risk}

Contexto:
${climaContext}
${lluviaContext}

Genera exactamente lo siguiente en español, incorporando las recomendaciones del contexto:
TÍTULO: [título preventivo breve, máximo 8 palabras]
MENSAJE: [recomendación preventiva clara, máximo 60 palabras, enfocada en niños y familias]`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const geminiData = await geminiRes.json();
    // REAL (Gemini): texto generado por IA — vacío si Gemini falló
    const rawText: string =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    const titleMatch = rawText.match(/TÍTULO:\s*(.+)/i);
    const messageMatch = rawText.match(/MENSAJE:\s*([\s\S]+)/i);

    // REAL si Gemini respondió bien → fallback estático "Riesgo X detectado" si no
    const title = titleMatch?.[1]?.trim() ?? `Riesgo ${risk} detectado`;

    // REAL si Gemini respondió bien → ESTÁTICO (climaContext) si Gemini falló
    const message =
      messageMatch?.[1]?.trim() ||   // ← REAL: Gemini respondió con formato correcto
      rawText.trim() ||               // ← REAL: Gemini respondió pero sin formato MENSAJE:
      climaContext + (lluviaContext ? " " + lluviaContext : ""); // ← ESTÁTICO: Gemini falló (429, sin key, etc.)

    return new Response(
      JSON.stringify({ risk, temperature: temp, rain, title, message }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      }
    );
  }
});
