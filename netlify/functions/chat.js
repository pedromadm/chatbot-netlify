try {
  // … chamada à OpenAI …
  return {
    statusCode: 200,
    body: JSON.stringify({ resposta: openaiReply }),
  };
} catch (error) {
  console.error(error);                 // aparece no log do Netlify
  return {
    statusCode: 500,
    // manda a mensagem original pro browser
    body: JSON.stringify({ erro: error.message || 'Erro inesperado' }),
  };
}
