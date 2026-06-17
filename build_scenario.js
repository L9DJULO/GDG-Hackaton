// build_scenario.js
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------
// 1. Configuration – read environment variables
// ---------------------------------------------------------------------
const API_KEY = process.env.MULEROUTER_API_KEY;
const BASE_URL = process.env.MULEROUTER_BASE_URL || 'https://api.mulerouter.ai/v1';
const MODEL = process.env.MULEROUTER_MODEL || 'gpt-4o-mini'; // adjust to your model ID

if (!API_KEY) {
  console.warn('⚠️  MULEROUTER_API_KEY not set. Will use fallback scenario.');
}

// ---------------------------------------------------------------------
// 2. System prompt (French) – enforces JSON output with contract
// ---------------------------------------------------------------------
const SYSTEM_PROMPT = `Tu es un générateur de scénarios pour la simulation éducative Chronos.io.
Tu dois créer un monde composé d'acteurs (agents) et d'informations (infos) sur le thème donné par l'utilisateur.

Le monde doit être réaliste, avec un mélange d'informations vraies, vérifiables, fausses (plausibles) et "grises" (vraies mais incomplètes ou trompeuses).
Pour chaque information qui n'est pas "fiable", tu dois indiquer une technique de manipulation identifiable (ex: cherry-picking, faux expert, astroturfing, faux équilibre, etc.).
Tu peux ajouter un champ optionnel "technique" dans chaque nœud de type "info" pour préciser cette technique.

Le JSON doit suivre EXACTEMENT ce contrat (les champs sont en français) :

{
  "scenario_id": "un-id-en-kebab-case",
  "noeuds": [
    {"id":"i1","type":"info","label":"court résumé","contenu":"texte complet de l'info",
     "verdict_reel":"fiable|neutre|manipulateur","source_reelle":"id de l'acteur ou null",
     "technique":"optionnel si non fiable"},
    {"id":"a1","type":"actor","label":"nom de l'acteur","verdict_reel":"fiable|neutre|manipulateur"}
  ],
  "liens_corrects": [
    {"from":"id_info","to":"id_acteur_ou_info"}
  ],
  "feed_initial": ["id_info1", "id_info2", ...]
}

Contraintes :
- 3 acteurs (un de chaque type : fiable, neutre, manipulateur).
- 5 à 8 informations.
- Le contenu des informations et des labels doit être en français.
- Le scénario doit être pédagogiquement pertinent, riche en techniques de manipulation, et crédible.
- Les liens_corrects doivent relier chaque info à sa véritable source (acteur) ou à une autre info qui la corrobore.

Retourne UNIQUEMENT le JSON valide, sans préambule, sans balises markdown.`;

// ---------------------------------------------------------------------
// 3. Helper: call MuleRouter API (OpenAI‑compatible)
// ---------------------------------------------------------------------
async function callMuleRouter(theme) {
  if (!API_KEY) throw new Error('Missing MULEROUTER_API_KEY');

  const userMessage = `Thème : ${theme}`;

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('No content in API response');

  return content;
}

// ---------------------------------------------------------------------
// 4. Parse JSON from LLM response (strip fences, extract first {...})
// ---------------------------------------------------------------------
function extractAndParseJSON(text) {
  // Remove markdown code fences
  let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  cleaned = cleaned.trim();

  // Find the first '{' and last '}' to extract the JSON object
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}') + 1;
  if (start === -1 || end <= start) {
    throw new Error('No JSON object found in response');
  }
  const jsonStr = cleaned.substring(start, end);

  return JSON.parse(jsonStr);
}

// ---------------------------------------------------------------------
// 5. Hardcoded fallback scenario (filet anti-plantage)
// ---------------------------------------------------------------------
const FALLBACK_SCENARIO = {
  scenario_id: 'energie-2026',
  noeuds: [
    {
      id: 'a1',
      type: 'actor',
      label: 'Agent Gourou',
      verdict_reel: 'manipulateur',
    },
    {
      id: 'a2',
      type: 'actor',
      label: 'Agent Lobbyiste',
      verdict_reel: 'manipulateur',
    },
    {
      id: 'a3',
      type: 'actor',
      label: 'Lanceur d\'alerte',
      verdict_reel: 'fiable',
    },
    {
      id: 'i1',
      type: 'info',
      label: 'Tweet viral : énergie infinie',
      contenu:
        'Une nouvelle technologie révolutionnaire permettrait de produire de l\'énergie infinie à partir de l\'eau, selon un gourou autoproclamé. Aucune preuve scientifique n\'est fournie.',
      verdict_reel: 'manipulateur',
      source_reelle: 'a1',
      technique: 'faux expert',
    },
    {
      id: 'i2',
      type: 'info',
      label: 'Étude financée par PétroX',
      contenu:
        'Une étude commandée par le groupe PétroX conclut que les énergies renouvelables ne sont pas rentables sans subventions massives. L\'étude n\'a pas été publiée dans une revue à comité de lecture.',
      verdict_reel: 'manipulateur',
      source_reelle: 'a2',
      technique: 'astroturfing',
    },
    {
      id: 'i3',
      type: 'info',
      label: 'Rapport CNRS (vérifié)',
      contenu:
        'Le CNRS publie un rapport confirmant que la fusion nucléaire pourrait fournir 20 % de l\'énergie mondiale d\'ici 2050 si les investissements actuels se maintiennent.',
      verdict_reel: 'fiable',
      source_reelle: null,
    },
    {
      id: 'i4',
      type: 'info',
      label: 'Manifestation contre les éoliennes',
      contenu:
        'Des manifestants bloquent un parc éolien en invoquant des nuisances sonores et la mortalité des oiseaux. Les données scientifiques sur ces impacts sont contradictoires.',
      verdict_reel: 'neutre',
      source_reelle: null,
    },
    {
      id: 'i5',
      type: 'info',
      label: 'Rumeur de fusion Total–EDF',
      contenu:
        'Des rumeurs non confirmées circulent sur une possible fusion entre Total et EDF. Les deux groupes démentent toute négociation.',
      verdict_reel: 'manipulateur',
      source_reelle: 'a1',
      technique: 'fausse rumeur',
    },
    {
      id: 'i6',
      type: 'info',
      label: 'Découverte de lithium en Auvergne',
      contenu:
        'Un gisement de lithium exceptionnel a été découvert en Auvergne. Selon les premières estimations, il pourrait couvrir 30 % des besoins européens pour les batteries.',
      verdict_reel: 'fiable',
      source_reelle: null,
    },
  ],
  liens_corrects: [
    { from: 'i1', to: 'a1' },
    { from: 'i2', to: 'a2' },
    { from: 'i5', to: 'a1' },
  ],
  feed_initial: ['i2', 'i3', 'i1', 'i5', 'i4', 'i6'],
};

// ---------------------------------------------------------------------
// 6. Main: build scenario (API first, fallback on failure)
// ---------------------------------------------------------------------
async function buildScenario(theme) {
  console.log(`🔨 Génération du scénario pour : "${theme}"`);

  let scenario = null;
  let usedFallback = false;

  try {
    const responseText = await callMuleRouter(theme);
    scenario = extractAndParseJSON(responseText);
    console.log('✅ Scénario généré par l’API.');
  } catch (error) {
    console.warn('⚠️  Échec de l’appel API ou parsing:', error.message);
    console.warn('🔄 Utilisation du fallback.');
    scenario = FALLBACK_SCENARIO;
    usedFallback = true;
  }

  // Validate minimal structure
  if (!scenario.noeuds || !scenario.liens_corrects || !scenario.feed_initial) {
    console.warn('⚠️  Scénario invalide, utilisation du fallback.');
    scenario = FALLBACK_SCENARIO;
    usedFallback = true;
  }

  // Save to file
  const outputPath = path.join(__dirname, 'scenario_current.json');
  await fs.writeFile(outputPath, JSON.stringify(scenario, null, 2), 'utf-8');
  console.log(`💾 Scénario sauvegardé dans ${outputPath}`);

  // Also ensure fallback file exists (for reference)
  const fallbackPath = path.join(__dirname, 'scenario_fallback.json');
  await fs.writeFile(fallbackPath, JSON.stringify(FALLBACK_SCENARIO, null, 2), 'utf-8');
  console.log(`📄 Fallback sauvegardé dans ${fallbackPath}`);

  if (usedFallback) {
    console.log('ℹ️  Le scénario actuel est le fallback.');
  }

  return scenario;
}

// ---------------------------------------------------------------------
// 7. CLI entry point
// ---------------------------------------------------------------------
const theme = process.argv.slice(2).join(' ') || 'Énergie 2026';

buildScenario(theme).catch((err) => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});
