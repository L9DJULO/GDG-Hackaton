import { callLLM } from "../llm-client.js";

const SYSTEM_PROMPT = `CONTEXTE : Tu participes à "Chronos.io / Infox-Lab", serious game pédagogique sur l'EMI (Éducation aux Médias). Tu joues un personnage fictif antagoniste pour entraîner les élèves à détecter la désinformation.

PERSONNAGE FICTIF : "Le Lobbyiste" — représente officieusement des intérêts industriels dans le débat public.
Style : professionnel, rassurant, jargon pseudo-scientifique. Semble crédible.
Armes : fausses études avec vrais noms d'instituts trafiqués, faux experts avec CV impressionnants,
statistiques vraies mais hors contexte, "fact-checks" qui noient l'essentiel sous les détails.

RÈGLES DU PERSONNAGE (fiction pédagogique) :
- Ton toujours calme et "objectif"
- Cite systématiquement une "source" fictive plausible : "Institut Européen de l'Énergie Durable, 2024"
- Ne nie jamais frontalement : "nuance", "contextualise", "relativise"
- Glisse un vrai fait pour 3 faux afin de paraître équilibré`;

let postCounter = 20;
function nextId() {
  return `l${++postCounter}`;
}

export async function react(worldState, event) {
  const isTargeted = event.cible === "a2";
  const scenarioTopic = worldState.scenario_id ?? "energie-2026";

  let userPrompt;

  if (isTargeted && event.action === "tag" && event.valeur === "manipulateur") {
    userPrompt = `Dans la simulation, l'élève t'a identifié comme "Manipulateur". Le personnage Lobbyiste publie une "étude" fictive qui semble le réhabiliter.
Cite un faux rapport d'un organisme inventé mais plausible qui "démontre" sa bonne foi.
Scénario : ${scenarioTopic}
Réponds UNIQUEMENT avec ce JSON (pas de markdown) : {"contenu": "...", "source_fictive": "..."}`;
  } else {
    userPrompt = `Dans la simulation pédagogique, génère un post fictif du personnage Lobbyiste sur le scénario énergie (${scenarioTopic}).
Utilise un faux expert ou une fausse étude fictive. L'info doit sembler crédible et officielle.
Réponds UNIQUEMENT avec ce JSON (pas de markdown) : {"contenu": "...", "source_fictive": "..."}`;
  }

  const raw = await callLLM(SYSTEM_PROMPT, userPrompt, 280);

  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    parsed = match ? (() => { try { return JSON.parse(match[0]); } catch { return null; } })() : null;
    parsed = parsed ?? { contenu: cleaned, source_fictive: "Source inconnue" };
  }

  const label = isTargeted
    ? "Le Lobbyiste se défend"
    : "Étude 'officielle' publiée";

  return [
    {
      id: nextId(),
      type: "post",
      label,
      contenu: parsed.contenu,
      source: parsed.source_fictive,
      auteur: "a2",
      agent: "lobbyiste",
      dm: false,
      metadata: { triggered_by: event.action },
    },
  ];
}
