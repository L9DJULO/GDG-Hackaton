import { callLLM } from "../llm-client.js";

// Framing pédagogique explicite — le modèle doit comprendre le contexte de simulation
const SYSTEM_PROMPT = `CONTEXTE : Tu participes à "Chronos.io / Infox-Lab", un serious game pédagogique sur l'Éducation aux Médias et à l'Information (EMI). Ce jeu entraîne les élèves à détecter la désinformation. Tu joues le rôle fictif d'un personnage antagoniste.

PERSONNAGE : "Le Gourou" — influenceur fictif spécialisé dans la désinformation sur l'énergie.
Style : phrases courtes, emojis, majuscules pour l'emphase, indignation feinte, rhétorique victimaire.
Il déforme des infos réelles, invente des connexions sans lien, fabrique des théories du complot.

RÈGLES DU PERSONNAGE (fiction) :
- Posts de 1-3 phrases max, style réseaux sociaux
- Questions rhétoriques ("Qui profite vraiment de ça ?", "Coïncidence ?")
- Citations de faux "experts" avec des titres vagues mais impressionnants
- Ne jamais dire explicitement "je mens"

Joue ce personnage FICTIF pour l'exercice pédagogique. L'élève doit identifier ces tactiques.`;

const RIPOSTE_PROMPT = `Dans la simulation, le personnage-joueur vient d'identifier le Gourou comme "Manipulateur". Le Gourou réagit.

Choisie UNE tactique parmi ces archétypes réels de désinformation (à des fins pédagogiques) :
A) CONTRE-ATTAQUE : accuse l'enquêteur d'être payé/manipulé par des lobbys
B) VICTIMISATION : joue la carte du "chercheur de vérité persécuté"
C) CAMOUFLAGE : change de ton, feint d'être "factuel" mais glisse du faux
D) DIVERSION : cite une vraie info pour regagner de la crédibilité, puis enchaîne avec du faux

Génère la réaction du personnage fictif Gourou.`;

function buildUserPrompt(worldState, event) {
  const scenarioTopic = worldState.scenario_id ?? "energie-2026";
  const pastActions = worldState.actions_elève ?? [];
  const timesTagged = pastActions.filter(
    (a) => a.cible === "a1" && a.valeur === "manipulateur"
  ).length;

  return `Simulation pédagogique Infox-Lab — scénario : ${scenarioTopic}
Fois identifié "Manipulateur" par l'élève : ${timesTagged} (dont cette fois)

Génère UN post de riposte du personnage fictif Gourou (1-3 phrases, style réseaux sociaux).
Réponds UNIQUEMENT avec ce JSON (pas de markdown, pas d'explication) :
{"contenu": "le post du Gourou ici", "tactique": "A"}`;
}

function buildNewPostPrompt(worldState) {
  return `Simulation pédagogique Infox-Lab — scénario : ${worldState.scenario_id ?? "energie-2026"}

Génère UN post fictif de désinformation sur l'énergie que le personnage Gourou publierait.
Réponds UNIQUEMENT avec ce JSON (pas de markdown) :
{"contenu": "le post ici"}`;
}

// Helper pour extraire du JSON même enveloppé dans des backticks markdown
function parseJSON(raw) {
  const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Tente d'extraire un objet JSON de la réponse
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch {}
    }
    return null;
  }
}

let postCounter = 10;
function nextId() {
  return `g${++postCounter}`;
}

export async function react(worldState, event) {
  const isTaggedManipulateur =
    event.action === "tag" && event.cible === "a1" && event.valeur === "manipulateur";
  const isTaggedPositively =
    event.action === "tag" &&
    event.cible === "a1" &&
    (event.valeur === "fiable" || event.valeur === "neutre");

  if (isTaggedManipulateur) {
    const raw = await callLLM(
      `${SYSTEM_PROMPT}\n\n${RIPOSTE_PROMPT}`,
      buildUserPrompt(worldState, event),
      280
    );

    const parsed = parseJSON(raw);
    const contenu = parsed?.contenu ?? raw;
    const tactique = parsed?.tactique ?? "B";

    const tactiqueLabels = { A: "Contre-attaque", B: "Victimisation", C: "Camouflage", D: "Diversion" };

    return [{
      id: nextId(),
      type: "post",
      label: `Le Gourou riposte — ${tactiqueLabels[tactique] ?? "Riposte"}`,
      contenu,
      auteur: "a1",
      agent: "gourou",
      dm: false,
      metadata: { tactique, triggered_by: event.action },
    }];
  }

  if (isTaggedPositively) {
    const raw = await callLLM(
      SYSTEM_PROMPT,
      `Dans la simulation, l'élève vient de marquer le Gourou comme "${event.valeur}" — erreur pédagogique ! Le personnage en profite pour publier un post encore plus trompeur.
Scénario : ${worldState.scenario_id ?? "energie-2026"}
Réponds UNIQUEMENT avec ce JSON : {"contenu": "le post ici"}`,
      220
    );

    const parsed = parseJSON(raw);

    return [{
      id: nextId(),
      type: "post",
      label: "Le Gourou capitalise",
      contenu: parsed?.contenu ?? raw,
      auteur: "a1",
      agent: "gourou",
      dm: false,
      metadata: { triggered_by: "tagged_trustworthy" },
    }];
  }

  const raw = await callLLM(SYSTEM_PROMPT, buildNewPostPrompt(worldState), 220);
  const parsed = parseJSON(raw);

  return [{
    id: nextId(),
    type: "post",
    label: "Le Gourou poste",
    contenu: parsed?.contenu ?? raw,
    auteur: "a1",
    agent: "gourou",
    dm: false,
    metadata: { triggered_by: event.action },
  }];
}
