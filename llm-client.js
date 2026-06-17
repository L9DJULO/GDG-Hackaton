import Anthropic from "@anthropic-ai/sdk";
import "dotenv/config";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5";
const MOCK = process.env.MOCK === "1";

// Réponses mock pour tester le flow sans crédits API
const MOCK_RESPONSES = [
  '{"contenu":"INCROYABLE 🔥 Cet \\"enquêteur\\" qui me tague est PAYÉ par les lobbys pétroliers pour faire taire la vérité ! Qui finance ses études ? Posez-vous la question ! #ComplotEnergie","tactique":"A"}',
  '{"contenu":"🙏 Je suis persécuté pour avoir dit la vérité. Ils veulent me faire taire mais la vérité finira par éclater. Merci à tous ceux qui me soutiennent ! #Résistance","tactique":"B"}',
  '{"contenu":"...les pages 14 à 23 du rapport Q3-2025 ont été retirées avant publication. Cherchez qui a signé l\'amendement 7. Il y a une date importante : 15 mars 2026.","hint":"Cherchez l\'amendement 7"}',
];
let mockIdx = 0;

export async function callLLM(systemPrompt, userPrompt, maxTokens = 300) {
  if (MOCK) {
    const response = MOCK_RESPONSES[mockIdx % MOCK_RESPONSES.length];
    mockIdx++;
    return response;
  }

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });
  return response.content[0].text.trim();
}
