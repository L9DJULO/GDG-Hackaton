/**
 * Game Master — orchestrateur rule-based (0 tokens LLM).
 * Décide quels personas réagissent à l'action de l'élève.
 * Règle d'or : 1 action = 1-2 appels LLM max.
 */

const MAX_TURNS = 15;

/**
 * Décide quels agents doivent réagir et dans quel ordre.
 * @returns {{ agents: string[], difficultyBoost: boolean }}
 */
export function route(worldState, event) {
  const pastActions = worldState.actions_elève ?? [];
  const turnCount = worldState.tour ?? 0;

  if (turnCount >= MAX_TURNS) {
    return { agents: [], difficultyBoost: false, reason: "max_turns_reached" };
  }

  const studentScore = computeStudentScore(pastActions);
  const difficultyBoost = studentScore >= 3;

  switch (event.action) {
    case "tag": {
      const { cible, valeur } = event;

      if (cible === "a1") {
        if (valeur === "manipulateur") {
          // Moment clé : Gourou riposte toujours + Lanceur d'alerte si élève avance bien
          const agents = ["gourou"];
          if (studentScore >= 2 || difficultyBoost) agents.push("lanceur-alerte");
          return { agents, difficultyBoost, reason: "gourou_tagged_manipulateur" };
        }
        if (valeur === "fiable" || valeur === "neutre") {
          // Erreur de l'élève → Gourou profite
          return { agents: ["gourou"], difficultyBoost, reason: "gourou_tagged_wrong" };
        }
      }

      if (cible === "a2") {
        if (valeur === "manipulateur") {
          // Lobbyiste se défend + éventuellement Lanceur d'alerte
          const agents = ["lobbyiste"];
          if (difficultyBoost) agents.push("lanceur-alerte");
          return { agents, difficultyBoost, reason: "lobbyiste_tagged_manipulateur" };
        }
        return { agents: ["lobbyiste"], difficultyBoost, reason: "lobbyiste_tagged" };
      }

      if (cible === "a3") {
        // Tagger le lanceur d'alerte → il envoie un DM de clarification
        return { agents: ["lanceur-alerte"], difficultyBoost, reason: "whistleblower_tagged" };
      }

      return { agents: [], difficultyBoost, reason: "unknown_target" };
    }

    case "open_dm": {
      // L'élève ouvre les DMs → Lanceur d'alerte répond
      return { agents: ["lanceur-alerte"], difficultyBoost, reason: "dm_opened" };
    }

    case "lien": {
      // L'élève relie des noeuds → selon la pertinence, réaction des agents
      if (difficultyBoost) {
        // Mode difficile : Gourou contre-attaque pour brouiller les pistes
        return { agents: ["gourou"], difficultyBoost, reason: "link_created_hard_mode" };
      }
      // Mode normal : Lobbyiste noie le signal avec une "étude"
      return { agents: ["lobbyiste"], difficultyBoost, reason: "link_created" };
    }

    case "soumettre": {
      // L'élève soumet sa carte → Game Over, pas de réaction
      return { agents: [], difficultyBoost, reason: "game_submitted" };
    }

    case "reveler_source": {
      // L'élève clique sur la source d'un item → Lanceur d'alerte donne un indice
      return { agents: ["lanceur-alerte"], difficultyBoost, reason: "source_revealed" };
    }

    default:
      return { agents: [], difficultyBoost, reason: "unknown_action" };
  }
}

function computeStudentScore(pastActions) {
  // +1 par bonne identification (manipulateur correctement taggé sur a1/a2)
  // -1 par erreur (fiable/neutre sur a1/a2)
  return pastActions.reduce((score, a) => {
    if ((a.cible === "a1" || a.cible === "a2") && a.valeur === "manipulateur")
      return score + 1;
    if ((a.cible === "a1" || a.cible === "a2") && a.valeur !== "manipulateur")
      return score - 1;
    return score;
  }, 0);
}

export function nextWorldState(worldState, event, newItems) {
  return {
    ...worldState,
    tour: (worldState.tour ?? 0) + 1,
    feed: [...(worldState.feed ?? []), ...newItems],
    actions_elève: [
      ...(worldState.actions_elève ?? []),
      { ...event, timestamp: Date.now() },
    ],
  };
}
