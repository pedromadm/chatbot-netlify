const fetch = require("node-fetch");

exports.handler = async (event) => {
  const body = JSON.parse(event.body || "{}");

  if (!body.prompt) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Prompt ausente" })
    };
  }

  try {
    const resposta = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "Responda com base no manual da declaração de conflitos." },
          { role: "user", content: body.prompt }
        ]
      })
    });

    const data = await resposta.json();
    const texto = data.choices?.[0]?.message?.content || "Erro na resposta da OpenAI.";

    return {
      statusCode: 200,
      body: JSON.stringify({ resposta: texto })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Erro ao contactar a API." })
    };
  }
};
