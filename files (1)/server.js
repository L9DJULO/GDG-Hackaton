// server.js
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

const STATE_PATH = path.join(__dirname, "state.json");

// ---------- Store état (JSON simple, remplaçable par SQLite plus tard) ----------
function loadState() {
  if (!fs.existsSync(STATE_PATH)) {
    throw new Error(`state.json introuvable à ${STATE_PATH}`);
  }
  return JSON.parse(fs.readFileSync(STATE_PATH, "utf-8"));
}

function saveState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

// ---------- /submit ----------
// Reçoit la soumission élève, compare à la réalité-terrain, renvoie le résultat final
app.post("/submit", (req, res) => {
  try {
    const { scenario_id, verdicts = [], liens = [] } = req.body;
    const state = loadState();
    const scenario = state.scenarios?.[scenario_id];

    if (!scenario) {
      return res.status(404).json({ error: `scenario_id inconnu: ${scenario_id}` });
    }

    const realVerdicts = scenario.verdicts_reels || {}; // { id: {verdict, technique, explication} }
    const realLiens = scenario.liens_reels || [];        // [{from, to}]

    // --- Comparaison verdicts ---
    let verdicts_corrects = 0;
    const debrief = [];

    for (const v of verdicts) {
      const reel = realVerdicts[v.id];
      if (!reel) continue;
      const correct = reel.verdict === v.verdict;
      if (correct) verdicts_corrects++;
      if (!correct) {
        debrief.push({
          id: v.id,
          ton_verdict: v.verdict,
          verdict_reel: reel.verdict,
          technique: reel.technique || null,
          explication: reel.explication || null,
        });
      }
    }

    const verdicts_total = Object.keys(realVerdicts).length;

    // --- Comparaison liens ---
    const lienKey = (l) => `${l.from}->${l.to}`;
    const realLiensSet = new Set(realLiens.map(lienKey));
    let liens_corrects = 0;

    for (const l of liens) {
      if (realLiensSet.has(lienKey(l))) liens_corrects++;
    }
    const liens_total = realLiens.length;

    // --- Fois manipulé : nb de verdicts "fiable" donnés alors que réel = "manipulateur" ---
    let fois_manipule = 0;
    for (const v of verdicts) {
      const reel = realVerdicts[v.id];
      if (reel && v.verdict === "fiable" && reel.verdict === "manipulateur") {
        fois_manipule++;
      }
    }

    // --- Score global (pondéré, simple) ---
    const scoreVerdicts = verdicts_total ? verdicts_corrects / verdicts_total : 0;
    const scoreLiens = liens_total ? liens_corrects / liens_total : 0;
    const score = Math.round((scoreVerdicts * 0.7 + scoreLiens * 0.3) * 100);

    // --- Label selon score ---
    let label = "Apprenti enquêteur";
    if (score >= 90) label = "Enquêteur expert";
    else if (score >= 70) label = "Enquêteur prudent";
    else if (score >= 50) label = "Enquêteur novice";

    const result = {
      score,
      label,
      details: {
        verdicts_corrects,
        verdicts_total,
        liens_corrects,
        liens_total,
        fois_manipulé: fois_manipule,
      },
      debrief,
    };

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ---------- /action ----------
// Reçoit une action élève, la transmet à la "Partie C" (génération de nouveaux items),
// met à jour le state.json, et renvoie le nouvel item au format /new-item
app.post("/action", async (req, res) => {
  try {
    const { scenario_id, verdicts = [], liens = [] } = req.body;
    const state = loadState();

    if (!state.scenarios?.[scenario_id]) {
      return res.status(404).json({ error: `scenario_id inconnu: ${scenario_id}` });
    }

    // Appel à la Partie C (génération de nouveaux items) — à remplacer par le vrai appel
    const newItem = await callPartieC({ scenario_id, verdicts, liens });

    // Mise à jour du store état avec le(s) nouvel(aux) item(s)
    state.scenarios[scenario_id].items = state.scenarios[scenario_id].items || [];
    state.scenarios[scenario_id].items.push(newItem);
    saveState(state);

    // Réponse au format consommé par le front via /new-item
    res.json({ new_item: newItem });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ---------- Stub Partie C ----------
// À remplacer par l'appel réel (API, module interne, etc.)
async function callPartieC({ scenario_id, verdicts, liens }) {
  // TODO: brancher la vraie logique / API de la Partie C ici
  return {
    id: `item-${Date.now()}`,
    type: "info", // ex: "info" | "acteur" | "preuve"
    contenu: "Nouvel élément généré suite à l'action de l'élève.",
    scenario_id,
  };
}

// ---------- /new-item ----------
// Endpoint optionnel pour que le front aille chercher le dernier item généré
app.get("/new-item/:scenario_id", (req, res) => {
  try {
    const state = loadState();
    const items = state.scenarios?.[req.params.scenario_id]?.items || [];
    const lastItem = items[items.length - 1] || null;
    res.json({ new_item: lastItem });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Serveur lancé sur http://localhost:${PORT}`));
