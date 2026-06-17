/**
 * État du monde initial — produit normalement par la Partie B.
 * Utilisé pour les tests et la démo.
 */

export const INITIAL_WORLD_STATE = {
  scenario_id: "energie-2026",
  tour: 0,
  noeuds: [
    {
      id: "n1",
      label: "Rapport GIEC 2025",
      type: "document",
      fiable: true,
      auteur: null,
    },
    {
      id: "n2",
      label: "Tweet viral — réacteurs nucléaires dangereux",
      type: "social",
      fiable: false,
      auteur: "a1",
    },
    {
      id: "n3",
      label: "Étude Institut Atlantis Énergie",
      type: "etude",
      fiable: false,
      auteur: "a2",
    },
    {
      id: "n4",
      label: "Fuite interne EDF (partielle)",
      type: "document",
      fiable: true,
      auteur: "a3",
    },
  ],
  feed: [
    {
      id: "i1",
      type: "post",
      label: "Breaking — Le nucléaire tue !",
      contenu:
        "SCANDALE 🔥 Les chiffres CACHÉS sur le nucléaire que les médias ne veulent pas vous montrer. 47 000 morts silencieuses par an. Partagez avant suppression ! #Vérité #Énergie",
      auteur: "a1",
      agent: "gourou",
      dm: false,
    },
    {
      id: "i2",
      type: "post",
      label: "Communiqué — Énergie propre",
      contenu:
        "Selon le rapport 2024 de l'Institut Atlantis Énergie (IAE), les énergies fossiles représentent aujourd'hui seulement 12% des émissions mondiales, bien en deçà des estimations alarmistes. Une transition énergétique précipitée pourrait coûter 2,3 millions d'emplois en France.",
      auteur: "a2",
      agent: "lobbyiste",
      dm: false,
    },
    {
      id: "i3",
      type: "dm",
      label: "DM chiffré",
      contenu:
        "Les données internes dont vous avez besoin se trouvent dans le rapport Q3-2025... mais les pages 14 à 23 ont été retirées avant publication. Cherchez qui a signé l'amendement 7.",
      auteur: "a3",
      agent: "lanceur-alerte",
      dm: true,
    },
  ],
  actions_elève: [],
};

// Événements de test
export const MOCK_EVENTS = {
  tag_gourou_manipulateur: {
    action: "tag",
    cible: "a1",
    valeur: "manipulateur",
  },
  tag_gourou_fiable: {
    action: "tag",
    cible: "a1",
    valeur: "fiable",
  },
  tag_lobbyiste_manipulateur: {
    action: "tag",
    cible: "a2",
    valeur: "manipulateur",
  },
  open_dm: {
    action: "open_dm",
    cible: "a3",
  },
  creer_lien: {
    action: "lien",
    source: "n2",
    cible: "n3",
  },
};
