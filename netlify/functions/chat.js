// Netlify Function: chat.js
// -------------------------
// Este handler recebe um POST com a pergunta do usuário
// Aceita tanto JSON (application/json) quanto form-urlencoded (application/x-www-form-urlencoded)
// e devolve { resposta: "..." } chamando a API Chat Completions da OpenAI.
// -------------------------------------------------------------
// ➜  Pré‑requisitos
//     • Definir a variável de ambiente OPENAI_API_KEY no painel da Netlify
//     • Opcional: ajustar SYSTEM_PROMPT e model conforme a sua necessidade
// -------------------------------------------------------------

const SYSTEM_PROMPT = "Você é um assistente que responde perguntas sobre o manual do produto X.";

exports.handler = async (event, context) => {
  try {
    // 1. Apenas POST é permitido
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ erro: "Método não permitido" }),
      };
    }

    // 2. Tentamos ler o corpo como JSON
    let body = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch (_) {
        body = {};
      }
    }

    // 2a. Se não conseguimos a pergunta via JSON, tentamos form‑urlencoded
    if (!body.pergunta && event.headers["content-type"]?.includes("application/x-www-form-urlencoded")) {
      const params = new URLSearchParams(event.body);
      if (params.has("pergunta")) {
        body.pergunta = params.get("pergunta");
      }
    }

    const pergunta = body.pergunta?.trim();
    if (!pergunta) {
      return {
        statusCode: 400,
        body: JSON.stringify({ erro: "Campo 'pergunta' é obrigatório" }),
      };
    }

    // 3. Checamos a chave da OpenAI
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("Variável OPENAI_API_KEY não configurada no ambiente");
    }

    // 4. Chamamos a API da OpenAI
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo", // troque para o modelo disponível na sua conta
        temperature: 0.3,
        messages: [
          ...(SYSTEM_PROMPT ? [{ role: "system", content: SYSTEM_PROMPT }] : []),
          { role: "user", content: pergunta },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const errorText = await openaiRes.text();
      throw new Error(`OpenAI API error: ${openaiRes.status} – ${errorText}`);
    }

    const data = await openaiRes.json();
    const resposta = data.choices?.[0]?.message?.content?.trim() || "";

    return {
      statusCode: 200,
      body: JSON.stringify({ resposta }),
    };
  } catch (error) {
    console.error("Function chat.js error:", error);
    return {
      statusCode: 502,
      body: JSON.stringify({ erro: error.message || "Erro inesperado" }),
    };
  }
};
