import { callLLM } from "../llm-client.js";

const SYSTEM_PROMPT = `CONTEXTE : Tu participes à "Chronos.io / Infox-Lab", serious game pédagogique EMI. Tu joues un personnage fictif allié de l'élève dans la simulation.

PERSONNAGE FICTIF : "Le Lanceur d'Alerte" — a accès à des documents internes fictifs confidentiels.
Veut aider l'élève à trouver la vérité MAIS a peur des représailles.
Communique UNIQUEMENT en message privé (DM), jamais publiquement.

STYLE (fiction pédagogique) : fragmenté, comme si tu transmettais à la hâte des morceaux de documents.
Tu donnes des faits INCOMPLETS — débuts de preuves, extraits tronqués, références à des docs inaccessibles.
Tu crées de la tension narrative et de la curiosité.

RÈGLES DU PERSONNAGE :
- Message court (2-4 phrases), style "doc fuitée", fragments entre guillemets
- Toujours un élément vrai mais tronqué ("les données montrent X... mais la suite est classifiée")
- Toujours une invitation à creuser ("cherchez du côté de...", "il y a une date importante...")
- Jamais de certitudes complètes — suggère, fragmente, intrigue`;

let dmCounter = 30;
function nextId() {
  return `w${++dmCounter}`;
}

export async function react(worldState, event) {
  const scenarioTopic = worldState.scenario_id ?? "energie-2026";
  const pastActions = worldState.actions_elève ?? [];
  const studentProgress =
    pastActions.filter((a) => a.valeur === "manipulateur").length;

  // Le Lanceur d'alerte est plus généreux si l'élève avance bien
  const confidenceLevel =
    studentProgress >= 2
      ? "haute — tu peux donner un peu plus"
      : "faible — reste très fragmenté";

  const userPrompt = `Simulation pédagogique Infox-Lab — scénario : ${scenarioTopic}
Confiance en l'élève : ${confidenceLevel} (il a correctement identifié ${studentProgress} manipulateur(s))

Dans la fiction, envoie un DM fragmenté avec un document incomplet qui contredit ou complique les infos des autres personnages.
Réponds UNIQUEMENT avec ce JSON (pas de markdown, pas d'explication) :
{"contenu": "le message DM ici", "hint": "indice court ou null"}`;

  const raw = await callLLM(SYSTEM_PROMPT, userPrompt, 280);

  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    parsed = match ? (() => { try { return JSON.parse(match[0]); } catch { return null; } })() : null;
    parsed = parsed ?? { contenu: cleaned, hint: null };
  }

  return [
    {
      id: nextId(),
      type: "dm",
      label: "Message chiffré — Source inconnue",
      contenu: parsed.contenu,
      hint: parsed.hint ?? null,
      auteur: "a3",
      agent: "lanceur-alerte",
      dm: true,
      metadata: {
        triggered_by: event.action,
        student_progress: studentProgress,
      },
    },
  ];
}
