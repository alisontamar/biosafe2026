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

    // ── Clima real ───────────────────────────────────────
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,precipitation`
    );
    const weather = await weatherRes.json();

    const temp = weather.current.temperature_2m;
    const rain = weather.current.precipitation > 0;

    // ── Riesgo calculado localmente ───────────────────────────────────────────
    let risk = "bajo";
    if (temp <= 5) risk = "alto";
    else if (temp < 17) risk = "moderado";
    if (rain && risk === "bajo") risk = "moderado";

    // ── Contexto climático estático ───────────────────────────────────────────
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

    const lluviaContext = rain
      ? "Está lloviendo. Recomienda evitar acumulación de agua estancada y extremar higiene para prevenir enfermedades de transmisión hídrica."
      : "";

    // ── IA con GROQ ───────────────────────────────────────────────────────
    // IMPORTANTE: Ahora la variable se llama GROQ_API_KEY
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    
    let aiErrorDebug = null;
    let rawText = "";

    if (!GROQ_API_KEY) {
        aiErrorDebug = "FALTA_API_KEY: La variable GROQ_API_KEY no está definida.";
    } else {
        const prompt = `Eres un asistente de salud preventiva para Bolivia.

Datos actuales:
- Temperatura: ${temp}°C
- Lluvia: ${rain ? "Sí" : "No"}
- Nivel de riesgo: ${risk}

Contexto:
${climaContext}
${lluviaContext}

Genera exactamente lo siguiente en español, incorporando las recomendaciones del contexto, sin asteríscos ni formato adicional:
TÍTULO: [título preventivo breve, máximo 8 palabras]
MENSAJE: [recomendación preventiva clara, máximo 60 palabras, enfocada en niños y familias]`;

        try {
            // Llamada a la API de Groq
            const groqRes = await fetch(
              "https://api.groq.com/openai/v1/chat/completions",
              {
                method: "POST",
                headers: { 
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify({
                 model: "llama-3.1-8b-instant", // Modelo súper rápido y capaz
                  messages: [{ role: "user", content: prompt }],
                  temperature: 0.3 // Baja temperatura para respuestas directas y consistentes
                }),
              }
            );

            if (!groqRes.ok) {
                const errorText = await groqRes.text();
                aiErrorDebug = `ERROR_HTTP_${groqRes.status}: ${errorText}`;
            } else {
                const groqData = await groqRes.json();
                // Groq usa la estructura de OpenAI para devolver el texto
                rawText = groqData.choices?.[0]?.message?.content ?? "";
                
                if (!rawText) {
                    aiErrorDebug = "RESPUESTA_VACIA: Groq respondió OK, pero sin texto.";
                }
            }
        } catch (networkErr) {
            aiErrorDebug = `ERROR_FETCH: ${(networkErr).message}`;
        }
    }

    const titleMatch = rawText.match(/TÍTULO:\s*(.+)/i);
    const messageMatch = rawText.match(/MENSAJE:\s*([\s\S]+)/i);

    const title = titleMatch?.[1]?.trim() ?? `Riesgo ${risk} detectado`;
    const message =
      messageMatch?.[1]?.trim() ||
      rawText.trim() ||
      climaContext + (lluviaContext ? " " + lluviaContext : "");

    return new Response(
      JSON.stringify({ 
          risk, 
          temperature: temp, 
          rain, 
          title, 
          message,
          debug: aiErrorDebug 
      }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      }
    );
  }
});