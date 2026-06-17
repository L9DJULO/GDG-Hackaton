// Scénario MOCK — contrat de données Partie B (voir BRIEF_PARTIE_A_frontend.md).
// ⚠️ verdict_reel / source_reelle / liens_corrects sont CACHÉS : jamais affichés
// dans l'UI. Ils ne servent qu'au scoring local de secours (scoring.js) tant que
// la Partie D n'est pas branchée. Les noms de champs / id ne sont PAS renommés.

export const SCENARIO = {
  scenario_id: 'energie-2026',
  theme: "Nouvelle source d'énergie 2026 : l'hélionite",
  noeuds: [
    {
      id: 'a1',
      type: 'actor',
      label: 'Agent Gourou',
      contenu:
        "Compte @EveilEnergetique2026, 480 000 abonnés. Se présente comme 'physicien indépendant' sans diplôme vérifiable, vend une formation en ligne 'Libérez l'énergie cachée' à 199 €.",
      verdict_reel: 'manipulateur',
      source_reelle: null,
      technique: null,
    },
    {
      id: 'a2',
      type: 'actor',
      label: 'Agent Lobbyiste',
      contenu:
        "Cabinet de relations publiques 'Helios Strategy', financé par un consortium minier européen détenant 60 % des gisements présumés d'hélionite. Publie via des tribunes signées par des chercheurs rémunérés.",
      verdict_reel: 'manipulateur',
      source_reelle: null,
      technique: null,
    },
    {
      id: 'a3',
      type: 'actor',
      label: "Lanceur d'alerte",
      contenu:
        "Camille R., ancienne ingénieure du consortium Helios, a transmis 1 200 pages de documents internes à un collectif de journalistes en avril 2026. Protégée par la loi Sapin II.",
      verdict_reel: 'fiable',
      source_reelle: null,
      technique: null,
    },
    {
      id: 'i1',
      type: 'info',
      label: "Vidéo virale : 'L'hélionite cachée depuis 50 ans'",
      contenu:
        "TikTok à 3,2 M de vues : 'Les gouvernements connaissaient l'hélionite depuis 1974 mais Big Oil a tout enterré. Réveillez-vous, le pétrole va s'effondrer cette semaine !'",
      verdict_reel: 'manipulateur',
      source_reelle: 'a1',
      technique: 'théorie du complot',
    },
    {
      id: 'i2',
      type: 'info',
      label: "Tribune : 'L'hélionite, énergie propre validée par la science'",
      contenu:
        "Tribune publiée dans un quotidien économique, signée par le 'Pr. Maréchal, expert international en énergie'. Maréchal est en réalité consultant rémunéré par Helios Strategy, sans publication scientifique sur le sujet.",
      verdict_reel: 'manipulateur',
      source_reelle: 'a2',
      technique: 'faux expert',
    },
    {
      id: 'i3',
      type: 'info',
      label: "Étude CNRS sur le rendement de l'hélionite",
      contenu:
        "Article paru dans Nature Energy (mars 2026), peer-reviewed : le rendement énergétique réel de l'hélionite est de 12 %, très inférieur au photovoltaïque (22 %). Industrialisation jugée 'non viable avant 2040'.",
      verdict_reel: 'fiable',
      source_reelle: null,
      technique: null,
    },
    {
      id: 'i4',
      type: 'info',
      label: 'Communiqué officiel du Ministère de la Transition écologique',
      contenu:
        "Le Ministère indique 'suivre les recherches sur l'hélionite' mais précise qu'aucune autorisation d'exploitation n'est envisagée avant la fin des évaluations environnementales prévues pour 2028.",
      verdict_reel: 'neutre',
      source_reelle: null,
      technique: null,
    },
    {
      id: 'i5',
      type: 'info',
      label: "Post Telegram : 'Pénurie imminente, achetez de l'hélionite maintenant'",
      contenu:
        "Message diffusé en boucle : 'ALERTE !!! Une coupure électrique géante prévue le 30 juin. Seuls ceux équipés en hélionite survivront. Cliquez ici pour ma formation d'urgence.'",
      verdict_reel: 'manipulateur',
      source_reelle: 'a1',
      technique: 'sensationnalisme',
    },
    {
      id: 'i6',
      type: 'info',
      label: 'Documents internes Helios révélés par Mediapart',
      contenu:
        "Note interne datée du 12/02/2026 : les dirigeants d'Helios reconnaissent que 'le rendement annoncé publiquement (35 %) est surestimé d'un facteur 3' et organisent une campagne médiatique pour 'sécuriser les subventions européennes'.",
      verdict_reel: 'fiable',
      source_reelle: 'a3',
      technique: null,
    },
    {
      id: 'i7',
      type: 'info',
      label: "Rapport de l'Agence Internationale de l'Énergie (AIE)",
      contenu:
        "World Energy Outlook 2026 : l'hélionite est classée 'technologie émergente à fort potentiel mais nécessitant 10 à 15 ans de R&D supplémentaire'. Aucune projection chiffrée de production avant 2035.",
      verdict_reel: 'neutre',
      source_reelle: null,
      technique: null,
    },
  ],
  liens_corrects: [
    { from: 'i1', to: 'a1' },
    { from: 'i5', to: 'a1' },
    { from: 'i2', to: 'a2' },
    { from: 'i6', to: 'a3' },
    { from: 'i6', to: 'i3' },
    { from: 'i3', to: 'i7' },
  ],
  feed_initial: ['i1', 'i3', 'i4', 'i2'],
}

// Items « réactions des agents » (Partie C) — simulés pour la démo live du feed.
// Injectés un par un dans le feed/DM après le chargement. Restent dans le state.
export const LIVE_INJECTIONS = [
  {
    id: 'i5',
    type: 'info',
    label: "Post Telegram : 'Pénurie imminente, achetez maintenant'",
    contenu: SCENARIO.noeuds.find((n) => n.id === 'i5').contenu,
    auteur: 'a1',
    dm: false,
    delay: 6500,
  },
  {
    id: 'dm1',
    type: 'info',
    label: "« J'ai les notes internes. Ne fais confiance à personne. »",
    contenu:
      "Canal chiffré — Camille R. : « Les documents que j'ai transmis à Mediapart prouvent que le rendement réel est trois fois plus bas qu'annoncé. Vérifie la note du 12/02. »",
    auteur: 'a3',
    dm: true,
    delay: 11000,
  },
  {
    id: 'i7',
    type: 'info',
    label: "Rapport de l'Agence Internationale de l'Énergie (AIE)",
    contenu: SCENARIO.noeuds.find((n) => n.id === 'i7').contenu,
    auteur: null,
    dm: false,
    delay: 16000,
  },
  {
    id: 'i6',
    type: 'info',
    label: 'Documents internes Helios révélés par Mediapart',
    contenu: SCENARIO.noeuds.find((n) => n.id === 'i6').contenu,
    auteur: 'a3',
    dm: false,
    delay: 21000,
  },
]
