/**
 * Dispatcher — point d'entrée unique de la Partie C.
 *
 * Usage :
 *   import { dispatch } from "./dispatcher.js";
 *   const result = await dispatch(worldState, event);
 *   // result.newItems  → nouveaux items de feed à envoyer au front
 *   // result.worldState → état mis à jour
 */

import { route, nextWorldState } from "./game-master.js";
import { react as gourouReact } from "./agents/gourou.js";
import { react as lobbyisteReact } from "./agents/lobbyiste.js";
import { react as lanceurAlerteReact } from "./agents/lanceur-alerte.js";

const AGENTS = {
  gourou: gourouReact,
  lobbyiste: lobbyisteReact,
  "lanceur-alerte": lanceurAlerteReact,
};

/**
 * @param {object} worldState  État du monde courant (produit par la Partie B)
 * @param {object} event       Action de l'élève {"action":"tag","cible":"a1","valeur":"manipulateur"}
 * @returns {Promise<{newItems: object[], worldState: object, routing: object}>}
 */
export async function dispatch(worldState, event) {
  const routing = route(worldState, event);

  if (routing.agents.length === 0) {
    return {
      newItems: [],
      worldState: nextWorldState(worldState, event, []),
      routing,
    };
  }

  // Appels parallèles si 2 agents, séquentiels sinon (ordre important pour la narration)
  let newItems;
  if (routing.agents.length === 1) {
    const agentFn = AGENTS[routing.agents[0]];
    newItems = await agentFn(worldState, event);
  } else {
    // Max 2 agents — on les appelle en parallèle pour la perf
    const results = await Promise.all(
      routing.agents.map((name) => AGENTS[name](worldState, event))
    );
    newItems = results.flat();
  }

  const updatedWorld = nextWorldState(worldState, event, newItems);

  return { newItems, worldState: updatedWorld, routing };
}
