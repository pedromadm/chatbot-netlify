// Netlify Function: chat.js
// -------------------------
// Este handler recebe um POST com JSON { pergunta: "..." }
// e devolve { resposta: "..." } chamando a API Chat Completions da OpenAI.
// -------------------------------------------------------------
// ➜  Pré‑requisitos
//     • Definir a variável de ambiente OPENAI_API_KEY no painel da Netlify
//     • Opcional: ajustar SYSTEM_PROMPT e model conforme a sua necessidade
// -------------------------------------------------------------

// Instruções básicas do sistema (contexto que sempre vai antes da pergunta do usuário)
// Se não precisar, deixe como string vazia "" ou apague a mensagem system no array
const SYSTEM_PROMPT = "Você é um assistente que responde perguntas sobre o manual do produto X.";

exports.handler = async (event, context) => {
  try {
    // 1. Só aceitamos POST
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ erro: "Método não permitido" }),
      };
    }

    // 2. Parse do corpo da requisição
    let body;
    try {
      body = JSON.parse(event.body || "{}");
    } catch (err) {
      return {
        statusCode: 400,
        body: JSON.stringify({ erro: "Corpo da requisição não é JSON válido" }),
      };
    }

    const pergunta = body.pergunta?.trim();
    if (!pergunta) {
      return {
        statusCode: 400,
        body: JSON.stringify({ erro: "Campo 'pergunta' é obrigatório" }),
      };
    }

    // 3. Checamos se a chave da API existe
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("Variável OPENAI_API_KEY não configurada no ambiente");
    }

    // 4. Fazemos a chamada à OpenAI
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",           // troque para o modelo que tiver acesso (ex.: "gpt-4o-mini")
        temperature: 0.3,
        messages: [
          ...(SYSTEM_PROMPT ? [{ role: "system", content: SYSTEM_PROMPT }] : []),
          { role: "user", content: pergunta },
        ],
      }),
    });

    if (!openaiRes.ok) {
      // Captura o texto de erro pra facilitar debug
      const errorText = await openaiRes.text();
      throw new Error(`OpenAI API error: ${openaiRes.status} – ${errorText}`);
    }

    const data = await openaiRes.json();
    const resposta = data.choices?.[0]?.message?.content?.trim() || "";

    // 5. Enviamos a resposta para o front‑end
    return {
      statusCode: 200,
      body: JSON.stringify({ resposta }),
    };
  } catch (error) {
    // Qualquer erro cai aqui; logamos no Netlify e devolvemos mensagem para o browser
    console.error("Function chat.js error:", error);
    return {
      statusCode: 502, // Bad Gateway é mais apropriado para falhas internas de serviço
      body: JSON.stringify({ erro: error.message || "Erro inesperado" }),
    };
  }
};
