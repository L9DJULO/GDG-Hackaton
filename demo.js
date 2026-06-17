/**
 * DÉMO — séquence de démonstration pour le jury.
 *
 * Scénario : l'élève tague le Gourou comme Manipulateur
 *            → Gourou riposte + Lanceur d'alerte envoie un DM
 *
 * Run : node demo.js
 */

import "dotenv/config";
import { dispatch } from "./dispatcher.js";
import { INITIAL_WORLD_STATE, MOCK_EVENTS } from "./mock-data.js";

const SEPARATOR = "─".repeat(60);

function printItem(item) {
  const dmTag = item.dm ? " [DM PRIVÉ]" : "";
  console.log(`\n  📌 ${item.label}${dmTag}`);
  console.log(`     Auteur : ${item.auteur} (${item.agent})`);
  console.log(`     ID     : ${item.id}`);
  console.log(`     Contenu: ${item.contenu}`);
  if (item.source) console.log(`     Source : ${item.source}`);
  if (item.hint) console.log(`     Indice : ${item.hint}`);
}

async function runDemo() {
  console.log(SEPARATOR);
  console.log("  CHRONOS.IO — Infox-Lab | Démo Partie C");
  console.log("  Agents Persona + Game Master");
  console.log(SEPARATOR);

  let worldState = {
    ...INITIAL_WORLD_STATE,
    // Simuler que l'élève a déjà fait 1 bonne identification (pour déclencher le Lanceur)
    actions_elève: [{ action: "tag", cible: "a2", valeur: "manipulateur", timestamp: Date.now() - 5000 }],
  };

  // ─── SÉQUENCE 1 : Élève tague le Gourou comme Manipulateur ───
  console.log("\n[TOUR 1] Action de l'élève :");
  console.log("  → L'élève tague l'Agent Gourou (a1) comme « Manipulateur »\n");

  const event1 = MOCK_EVENTS.tag_gourou_manipulateur;
  const result1 = await dispatch(worldState, event1);

  console.log(`  Routing décidé : [${result1.routing.agents.join(", ")}]`);
  console.log(`  Raison         : ${result1.routing.reason}`);
  console.log(`  Mode difficile : ${result1.routing.difficultyBoost}`);
  console.log("\n  Nouveaux items générés :");
  result1.newItems.forEach(printItem);

  worldState = result1.worldState;

  // ─── SÉQUENCE 2 : Élève ouvre les DMs ───
  console.log(`\n${SEPARATOR}`);
  console.log("\n[TOUR 2] Action de l'élève :");
  console.log("  → L'élève ouvre la boîte de DMs\n");

  const event2 = MOCK_EVENTS.open_dm;
  const result2 = await dispatch(worldState, event2);

  console.log(`  Routing décidé : [${result2.routing.agents.join(", ")}]`);
  console.log(`  Raison         : ${result2.routing.reason}`);
  console.log("\n  Nouveaux items générés :");
  result2.newItems.forEach(printItem);

  worldState = result2.worldState;

  // ─── RÉSUMÉ ───
  console.log(`\n${SEPARATOR}`);
  console.log("\n  RÉSUMÉ DE LA DÉMO");
  console.log(`  Tours joués        : ${worldState.tour}`);
  console.log(`  Items dans le feed : ${worldState.feed.length}`);
  console.log(`  Actions de l'élève : ${worldState.actions_elève.length}`);
  console.log(SEPARATOR);
}

runDemo().catch((err) => {
  console.error("\n[ERREUR]", err.message);
  if (err.message.includes("API") || err.message.includes("key")) {
    console.error(
      "→ Vérifiez votre fichier .env : MULEROUTER_API_KEY et MULEROUTER_BASE_URL"
    );
  }
  process.exit(1);
});
