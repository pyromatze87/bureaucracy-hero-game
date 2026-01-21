/*
 * DESIGN PHILOSOPHY: Retro-Arcade Cabinet
 * - 80er Arcade-Ästhetik mit Neon-Lichtern und CRT-Glow
 * - Synthwave-Vibes kombiniert mit klassischen Spielautomaten-UI-Elementen
 * - Neon-Glow: Jedes wichtige Element hat einen leuchtenden Rand
 * - Scanline-Authentizität: Subtile horizontale Linien wie auf alten Monitoren
 * - Cabinet-Frame: Die gesamte UI wirkt wie ein Spielautomat
 */

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ==================== GAME DATA ====================
const BIASES = {
  "loss-aversion": {
    name: "Verlust-Aversion",
    explanation: "Die Angst vor Verlusten wiegt schwerer als die Freude über Gewinne. Der Fokus auf 'Ruf zerstören' zeigt klassische Verlust-Aversion."
  },
  "zero-risk": {
    name: "Zero-Risk Bias",
    explanation: "Der Wunsch, Risiken vollständig zu eliminieren (0%), anstatt sie zu managen. 100% Sicherheit ist in der IT-Welt unrealistisch."
  },
  "omission": {
    name: "Omission Bias",
    explanation: "Das Risiko einer Handlung wird höher bewertet als das Risiko des 'Nicht-Handelns', obwohl Stillstand oft genauso schädlich sein kann."
  }
};

const DATA_QUESTIONS = [
  {
    question: "Der CDO fragt nach dem ROI. Welche Visualisierung wählst du?",
    options: [
      { id: "roi", icon: "📈", label: "Zeitersparnis pro Vorgang: 47 Min → 12 Min", correct: true },
      { id: "tech", icon: "🔧", label: "Technische Architektur-Diagramm", correct: false }
    ],
    feedback: {
      correct: "Richtig! Konkrete Zahlen überzeugen. Zeit = Geld in der Verwaltung.",
      wrong: "Technische Details langweilen Entscheider. Zeige den Business-Impact!"
    }
  },
  {
    question: "Wie präsentierst du die Sicherheitsmaßnahmen?",
    options: [
      { id: "compare", icon: "⚖️", label: "Vergleich: BärGPT-Filter vs. Schatten-IT Risiken", correct: true },
      { id: "list", icon: "📋", label: "Liste aller technischen Sicherheitsfeatures", correct: false }
    ],
    feedback: {
      correct: "Perfekt! Der Vergleich zeigt: Die Alternative (Schatten-IT) ist RISKANTER.",
      wrong: "Feature-Listen überzeugen nicht. Zeige den relativen Vorteil!"
    }
  },
  {
    question: "Der CDO fragt nach dem Risiko von Schatten-IT. Wie antwortest du?",
    options: [
      { id: "risk", icon: "⚠️", label: "Risiko-Matrix: Schatten-IT = Hohe Wahrscheinlichkeit + Hoher Schaden", correct: true },
      { id: "ignore", icon: "🤷", label: "Das Thema herunterspielen", correct: false }
    ],
    feedback: {
      correct: "Richtig! Du nutzt Pre-Suasion: Der Stillstand IST das Risiko. Das reframt die Diskussion.",
      wrong: "Gefährlich! Ignorierte Risiken kommen zurück. Nutze sie als Argument FÜR die Änderung!"
    }
  }
];

const ENEMY_ATTACKS = [
  { name: "DSGVO-Panik", text: "Die DSGVO verbietet das! Wir riskieren Millionen-Strafen!", damage: 15 },
  { name: "Presse-Angst", text: "Stellen Sie sich die Schlagzeilen vor: Berlin leakt Bürgerdaten!", damage: 20 },
  { name: "Status-Quo", text: "Das haben wir noch nie so gemacht. Warum jetzt ändern?", damage: 10 },
  { name: "Verantwortungs-Ping-Pong", text: "Wer übernimmt die Verantwortung, wenn etwas schiefgeht?", damage: 15 }
];

const PLAYER_CARDS = [
  { id: "premortem", name: "Pre-Mortem Analyse", icon: "🔮", effect: "+25 Überzeugung", power: 25, description: "Wir simulieren Fehler vorher und bauen Filter ein." },
  { id: "fomo", name: "FOMO-Karte", icon: "🏃", effect: "+20 Überzeugung", power: 20, description: "Hamburg macht es schon. Wollen wir zurückbleiben?" },
  { id: "pilot", name: "Pilot-Plan", icon: "🧪", effect: "+15 Überzeugung", power: 15, description: "Begrenzter Rollout als Reallabor. Geringes Risiko." },
  { id: "sabine", name: "Sabines Geschichte", icon: "👩‍💼", effect: "+20 Überzeugung", power: 20, description: "Eine echte Mitarbeiterin erzählt von ihrer Frustration." },
  { id: "schatten", name: "Schatten-IT Warnung", icon: "👻", effect: "+15 Überzeugung", power: 15, description: "Mitarbeiter nutzen bereits private ChatGPT-Accounts!" },
  { id: "technik", name: "Technik-Jargon", icon: "🔧", effect: "Wirkungslos", power: 0, description: "API-Endpoints, TLS 1.3, OAuth 2.0..." }
];

const STORY_BLOCKS = [
  { id: "world", story: "world", text: "📋 Sabine bearbeitet einen Bürgerantrag zur Solargesetz-Novelle", correct: true },
  { id: "call", story: "call", text: "❓ BärGPT kennt das neue Gesetz nicht (Daten-Cutoff)", correct: true },
  { id: "refusal", story: "refusal", text: "🚫 Datenschutz warnt, Sabine nutzt unsichere Workarounds", correct: true },
  { id: "mentor", story: "mentor", text: "💡 CityLAB präsentiert den Datenschutz-Filter", correct: true },
  { id: "reward", story: "reward", text: "✅ Sabine erhält Antwort mit Quellenangabe in Sekunden", correct: true },
  { id: "wrong1", story: "wrong1", text: "📊 Technische API-Spezifikation (Langweilig!)", correct: false },
  { id: "wrong2", story: "wrong2", text: "📈 Kostenaufstellung Q3/2024", correct: false }
];

const TIMELINE_SLOTS = [
  { id: 1, label: "1. Gewohnte Welt", correct: "world" },
  { id: 2, label: "2. Der Ruf", correct: "call" },
  { id: 3, label: "3. Die Weigerung", correct: "refusal" },
  { id: 4, label: "4. Der Mentor", correct: "mentor" },
  { id: 5, label: "5. Die Belohnung", correct: "reward" }
];

// ==================== TYPES ====================
type GameScreen = "start" | "level1" | "level2" | "level3" | "level4" | "win";

interface GameState {
  currentLevel: number;
  approval: number;
  level1: { biasesFound: number; completed: boolean };
  level2: { storiesPlaced: number; completed: boolean };
  level3: { currentQuestion: number; correctChoices: number; completed: boolean };
  level4: { playerHP: number; enemyHP: number; cdoMeter: number; round: number; completed: boolean };
}

// ==================== COMPONENTS ====================

// HUD Component
function HUD({ approval, level }: { approval: number; level: number }) {
  return (
    <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-50 pointer-events-none">
      <div className="bg-black/80 border-2 border-primary rounded-lg p-3 pointer-events-auto neon-glow-pink">
        <div className="font-pixel text-[10px] text-primary mb-2 uppercase tracking-wider">
          Zustimmung des CDO
        </div>
        <div className="w-48 h-5 bg-gray-800 rounded-full overflow-hidden border-2 border-gray-600">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, #e94560, #f39c12, #27ae60)",
              width: `${approval}%`
            }}
            animate={{ width: `${approval}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
      <div className="bg-black/80 border-2 border-accent rounded-lg px-4 py-3 pointer-events-auto neon-glow-gold">
        <div className="font-pixel text-xs text-accent">Level {level}/4</div>
      </div>
    </div>
  );
}

// Feedback Modal Component
function FeedbackModal({
  isOpen,
  success,
  title,
  text,
  onClose
}: {
  isOpen: boolean;
  success: boolean;
  title: string;
  text: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === "Space" || e.code === "Enter") && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="absolute inset-0 flex items-center justify-center z-[1000] bg-black/50"
          onClick={onClose}
        >
          <motion.div
            className={`bg-white text-gray-800 p-8 rounded-xl max-w-md text-center border-4 ${
              success ? "border-green-500" : "border-red-500"
            } shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
            initial={{ y: 20 }}
            animate={{ y: 0 }}
          >
            <div className="text-6xl mb-4">{success ? "✅" : "❌"}</div>
            <h3
              className={`font-pixel text-lg mb-4 ${
                success ? "text-green-600" : "text-red-600"
              }`}
            >
              {title}
            </h3>
            <p className="text-sm leading-relaxed mb-6">{text}</p>
            <button
              onClick={onClose}
              className="font-pixel text-xs bg-gradient-to-b from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-lg shadow-lg hover:scale-105 transition-transform"
            >
              WEITER
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Start Screen Component
function StartScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-[#1a1a2e]/95 to-[#0f3460]/95"
    >
      <motion.h1
        className="font-pixel text-2xl md:text-3xl text-primary text-center mb-2 neon-text-pink"
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2 }}
      >
        BUREAUCRACY HERO
      </motion.h1>
      <motion.h2
        className="font-pixel text-sm md:text-base text-accent mb-8 neon-text-gold"
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.3 }}
      >
        The BärGPT Protocol
      </motion.h2>

      <motion.div
        className="bg-white/95 text-gray-800 p-6 rounded-xl max-w-2xl border-4 border-primary shadow-2xl max-h-[50vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-primary font-bold text-lg mb-3">🎯 Deine Mission</h3>
        <p className="mb-3 text-sm leading-relaxed">
          Die Berliner Verwaltung braucht dich! BärGPT ist da, aber offline – und damit fast nutzlos.
          Deine Aufgabe: Überzeuge den CDO, die <strong>Online-Funktion</strong> freizuschalten.
        </p>
        <p className="mb-4 text-sm leading-relaxed">
          Aber Vorsicht: Der Datenschutzbeauftragte <strong>Herr D. S. Gvo</strong> steht dir im Weg.
          Du musst psychologische Barrieren erkennen, überzeugende Geschichten erzählen und mit Daten punkten.
        </p>

        <div className="grid grid-cols-2 gap-3 mt-4">
          {[
            { level: 1, title: "Die Diagnose", desc: "Erkenne die Biases" },
            { level: 2, title: "Storytelling", desc: "Baue die Heldenreise" },
            { level: 3, title: "Data Lab", desc: "Wähle die richtigen Daten" },
            { level: 4, title: "Boss-Kampf", desc: "Besiege den Datenschutz" }
          ].map((item) => (
            <div
              key={item.level}
              className="bg-gray-100 p-3 rounded-lg border-l-4 border-primary"
            >
              <strong className="text-primary">Level {item.level}:</strong> {item.title}
              <br />
              <small className="text-gray-600">{item.desc}</small>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.button
        onClick={onStart}
        className="mt-8 font-pixel text-sm bg-gradient-to-b from-yellow-400 to-orange-600 text-white px-10 py-5 rounded-lg shadow-[0_6px_0_#a04000,0_10px_20px_rgba(0,0,0,0.3)] hover:translate-y-[-2px] hover:shadow-[0_8px_0_#a04000,0_14px_25px_rgba(0,0,0,0.4)] active:translate-y-1 active:shadow-[0_2px_0_#a04000] transition-all neon-pulse"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        MISSION STARTEN
      </motion.button>
    </motion.div>
  );
}

// Level 1: Bias Scanner
function Level1({
  biasesFound,
  onBiasFound,
  onComplete
}: {
  biasesFound: number;
  onBiasFound: (bias: string, zone: string) => boolean;
  onComplete: () => void;
}) {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [foundBiases, setFoundBiases] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{ show: boolean; success: boolean; title: string; text: string }>({
    show: false,
    success: false,
    title: "",
    text: ""
  });

  const zones = [
    { id: "zone1", bias: "loss-aversion", text: "Das Risiko eines Datenlecks ist untragbar – ein einziger Vorfall würde unseren Ruf unwiederbringlich zerstören." },
    { id: "zone2", bias: "zero-risk", text: "Wir können nur Lösungen akzeptieren, die ein 100% sicheres System garantieren." },
    { id: "zone3", bias: "omission", text: "Es ist besser, beim aktuellen System zu bleiben, als durch voreilige Änderungen Probleme zu verursachen." }
  ];

  const biasOptions = [
    { id: "loss-aversion", label: "Verlust-Aversion" },
    { id: "zero-risk", label: "Zero-Risk Bias" },
    { id: "omission", label: "Omission Bias" },
    { id: "confirmation", label: "Confirmation Bias" },
    { id: "anchoring", label: "Anchoring Bias" }
  ];

  const handleZoneClick = (zoneId: string) => {
    if (foundBiases.has(zoneId)) return;
    setSelectedZone(zoneId);
  };

  const handleBiasClick = (biasId: string) => {
    if (!selectedZone) return;
    
    const zone = zones.find(z => z.id === selectedZone);
    if (!zone) return;

    if (zone.bias === biasId) {
      setFoundBiases(prev => new Set(Array.from(prev).concat(selectedZone)));
      const biasInfo = BIASES[biasId as keyof typeof BIASES];
      setFeedback({
        show: true,
        success: true,
        title: `${biasInfo.name} erkannt!`,
        text: biasInfo.explanation
      });
      onBiasFound(biasId, selectedZone);
      
      if (biasesFound + 1 >= 3) {
        setTimeout(onComplete, 100);
      }
    } else {
      setFeedback({
        show: true,
        success: false,
        title: "Nicht ganz...",
        text: "Lies den Text nochmal genau. Welcher psychologische Effekt steckt dahinter?"
      });
    }
    setSelectedZone(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center p-8 pt-24 bg-[#141428]/98"
    >
      <h2 className="font-pixel text-xl text-primary mb-2 neon-text-pink">Level 1: Die Diagnose</h2>
      <p className="text-gray-400 mb-6 text-center">Erkenne die psychologischen Barrieren in der E-Mail des Datenschutzes</p>

      <div className="bg-gradient-to-b from-[#3d3d5c] to-[#2d2d44] border-3 border-gray-600 rounded-xl p-6 w-full max-w-3xl">
        <div className="bg-white text-gray-800 p-5 rounded-lg mb-5 border-2 border-gray-300">
          <div className="border-b-2 border-gray-200 pb-3 mb-4 text-sm text-gray-600">
            <div className="font-bold text-primary">Von: Herr D. S. Gvo (Datenschutzbeauftragter)</div>
            <div>Betreff: RE: Anfrage Online-Funktion BärGPT</div>
          </div>
          <p className="mb-3">Sehr geehrte Kolleginnen und Kollegen,</p>
          <p className="mb-3">
            ich muss diese Anfrage leider ablehnen.{" "}
            <span
              onClick={() => handleZoneClick("zone1")}
              className={`px-1 py-0.5 rounded cursor-pointer transition-all inline ${
                foundBiases.has("zone1")
                  ? "bg-green-500 text-white"
                  : selectedZone === "zone1"
                  ? "bg-yellow-400 outline outline-3 outline-primary"
                  : "bg-yellow-100 hover:bg-yellow-300"
              }`}
            >
              {zones[0].text}
            </span>
          </p>
          <p className="mb-3">
            <span
              onClick={() => handleZoneClick("zone2")}
              className={`px-1 py-0.5 rounded cursor-pointer transition-all inline ${
                foundBiases.has("zone2")
                  ? "bg-green-500 text-white"
                  : selectedZone === "zone2"
                  ? "bg-yellow-400 outline outline-3 outline-primary"
                  : "bg-yellow-100 hover:bg-yellow-300"
              }`}
            >
              {zones[1].text}
            </span>{" "}
            Alles andere ist fahrlässig.
          </p>
          <p className="mb-3">
            <span
              onClick={() => handleZoneClick("zone3")}
              className={`px-1 py-0.5 rounded cursor-pointer transition-all inline ${
                foundBiases.has("zone3")
                  ? "bg-green-500 text-white"
                  : selectedZone === "zone3"
                  ? "bg-yellow-400 outline outline-3 outline-primary"
                  : "bg-yellow-100 hover:bg-yellow-300"
              }`}
            >
              {zones[2].text}
            </span>
          </p>
          <p>Mit freundlichen Grüßen,<br />D. S. Gvo</p>
        </div>

        <p className="text-accent font-bold mb-4 text-center">🎯 Aufgabe: Klicke auf die markierten Stellen und wähle den passenden Bias!</p>

        <div className="flex flex-wrap gap-3 justify-center">
          {biasOptions.map((bias) => (
            <motion.button
              key={bias.id}
              onClick={() => handleBiasClick(bias.id)}
              disabled={foundBiases.has(zones.find(z => z.bias === bias.id)?.id || "")}
              className={`px-5 py-3 rounded-full font-bold text-sm transition-all border-2 ${
                foundBiases.has(zones.find(z => z.bias === bias.id)?.id || "")
                  ? "bg-gray-500 text-gray-300 cursor-not-allowed border-gray-600"
                  : "bg-gradient-to-b from-secondary to-blue-700 text-white border-blue-900 hover:scale-105 hover:shadow-lg cursor-pointer"
              }`}
              whileHover={{ scale: foundBiases.has(zones.find(z => z.bias === bias.id)?.id || "") ? 1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {bias.label}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="mt-5 font-pixel text-sm text-accent">
        Erkannt: <span className="text-white">{biasesFound}</span>/3
      </div>

      <FeedbackModal
        isOpen={feedback.show}
        success={feedback.success}
        title={feedback.title}
        text={feedback.text}
        onClose={() => setFeedback({ ...feedback, show: false })}
      />
    </motion.div>
  );
}

// Level 2: Narrative Puzzle
function Level2({
  storiesPlaced,
  onStoryPlaced,
  onComplete
}: {
  storiesPlaced: number;
  onStoryPlaced: () => boolean;
  onComplete: () => void;
}) {
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [placedStories, setPlacedStories] = useState<Map<number, string>>(new Map());
  const [usedBlocks, setUsedBlocks] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{ show: boolean; success: boolean; title: string; text: string }>({
    show: false,
    success: false,
    title: "",
    text: ""
  });

  const handleBlockClick = (blockId: string) => {
    if (usedBlocks.has(blockId)) return;
    setSelectedBlock(blockId);
  };

  const handleSlotClick = (slotId: number) => {
    if (!selectedBlock || placedStories.has(slotId)) return;

    const slot = TIMELINE_SLOTS.find(s => s.id === slotId);
    const block = STORY_BLOCKS.find(b => b.id === selectedBlock);
    
    if (!slot || !block) return;

    if (block.story === slot.correct) {
      setPlacedStories(prev => new Map(Array.from(prev.entries()).concat([[slotId, selectedBlock]])));
      setUsedBlocks(prev => new Set(Array.from(prev).concat(selectedBlock)));
      setFeedback({
        show: true,
        success: true,
        title: "Perfekt platziert!",
        text: "Die Heldenreise nimmt Form an. Emotionale Bindung wird aufgebaut!"
      });
      onStoryPlaced();
      
      if (storiesPlaced + 1 >= 5) {
        setTimeout(onComplete, 100);
      }
    } else {
      const isWrongBlock = block.story.startsWith("wrong");
      setFeedback({
        show: true,
        success: false,
        title: isWrongBlock ? "Langweilig!" : "Falsche Reihenfolge!",
        text: isWrongBlock
          ? "Der CDO schläft fast ein. Technische Details gehören nicht an den Anfang einer Geschichte!"
          : "Die Heldenreise hat eine bestimmte Struktur. Überlege, was zuerst kommt."
      });
    }
    setSelectedBlock(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center p-8 pt-24 bg-[#141428]/98"
    >
      <h2 className="font-pixel text-xl text-primary mb-2 neon-text-pink">Level 2: Der Überzeugungs-Plan</h2>
      <p className="text-gray-400 mb-6 text-center">Baue die perfekte Heldenreise für deine Präsentation</p>

      <div className="w-full max-w-4xl">
        {/* Timeline Slots */}
        <div className="flex gap-3 bg-[#1a1a2e] p-5 rounded-xl border-3 border-primary mb-6 flex-wrap justify-center">
          {TIMELINE_SLOTS.map((slot) => {
            const placedBlockId = placedStories.get(slot.id);
            const placedBlock = placedBlockId ? STORY_BLOCKS.find(b => b.id === placedBlockId) : null;
            
            return (
              <motion.div
                key={slot.id}
                onClick={() => handleSlotClick(slot.id)}
                className={`w-36 h-24 rounded-lg flex items-center justify-center text-center p-2 text-xs cursor-pointer transition-all ${
                  placedBlock
                    ? "bg-green-500/30 border-2 border-green-500 text-green-400"
                    : "bg-primary/20 border-2 border-dashed border-primary text-primary hover:bg-primary/30"
                }`}
                whileHover={{ scale: placedBlock ? 1 : 1.05 }}
              >
                {placedBlock ? placedBlock.text : slot.label}
              </motion.div>
            );
          })}
        </div>

        {/* Story Blocks */}
        <div className="flex gap-3 flex-wrap justify-center mb-4">
          {STORY_BLOCKS.filter(b => b.correct).map((block) => (
            <motion.div
              key={block.id}
              onClick={() => handleBlockClick(block.id)}
              className={`w-40 p-3 rounded-lg text-xs cursor-pointer transition-all ${
                usedBlocks.has(block.id)
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed opacity-50"
                  : selectedBlock === block.id
                  ? "bg-purple-600 text-white outline outline-3 outline-accent"
                  : "bg-purple-500/80 text-white hover:bg-purple-400"
              }`}
              whileHover={{ scale: usedBlocks.has(block.id) ? 1 : 1.05 }}
            >
              {block.text}
            </motion.div>
          ))}
        </div>

        {/* Wrong Blocks */}
        <div className="flex gap-3 flex-wrap justify-center">
          {STORY_BLOCKS.filter(b => !b.correct).map((block) => (
            <motion.div
              key={block.id}
              onClick={() => handleBlockClick(block.id)}
              className={`w-40 p-3 rounded-lg text-xs cursor-pointer transition-all ${
                selectedBlock === block.id
                  ? "bg-purple-400 text-white outline outline-3 outline-accent"
                  : "bg-purple-300/60 text-white hover:bg-purple-300"
              }`}
              whileHover={{ scale: 1.05 }}
            >
              {block.text}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-5 font-pixel text-sm text-accent">
        Platziert: <span className="text-white">{storiesPlaced}</span>/5
      </div>

      <FeedbackModal
        isOpen={feedback.show}
        success={feedback.success}
        title={feedback.title}
        text={feedback.text}
        onClose={() => setFeedback({ ...feedback, show: false })}
      />
    </motion.div>
  );
}

// Level 3: Data Intelligence
function Level3({
  currentQuestion,
  correctChoices,
  onAnswer,
  onComplete
}: {
  currentQuestion: number;
  correctChoices: number;
  onAnswer: (correct: boolean) => void;
  onComplete: () => void;
}) {
  const [feedback, setFeedback] = useState<{ show: boolean; success: boolean; title: string; text: string }>({
    show: false,
    success: false,
    title: "",
    text: ""
  });
  const [answered, setAnswered] = useState(false);

  const question = DATA_QUESTIONS[currentQuestion];

  const handleOptionClick = (option: { correct: boolean }) => {
    if (answered) return;
    setAnswered(true);

    if (option.correct) {
      setFeedback({
        show: true,
        success: true,
        title: "Data Clarity Bonus!",
        text: question.feedback.correct
      });
    } else {
      setFeedback({
        show: true,
        success: false,
        title: "Nicht optimal...",
        text: question.feedback.wrong
      });
    }
    onAnswer(option.correct);
  };

  const handleFeedbackClose = () => {
    setFeedback({ ...feedback, show: false });
    setAnswered(false);
    
    if (currentQuestion + 1 >= DATA_QUESTIONS.length) {
      onComplete();
    }
  };

  if (!question) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center p-8 pt-24 bg-[#141428]/98"
    >
      <h2 className="font-pixel text-xl text-primary mb-2 neon-text-pink">Level 3: Data Intelligence</h2>
      <p className="text-gray-400 mb-6 text-center">Wähle die überzeugendsten Datenvisualisierungen</p>

      <div className="bg-gradient-to-b from-[#3d3d5c] to-[#2d2d44] border-3 border-gray-600 rounded-xl p-6 w-full max-w-2xl">
        <div className="bg-white text-gray-800 p-5 rounded-lg mb-5">
          <p className="font-bold text-lg">
            <span className="text-primary">Frage {currentQuestion + 1}/3:</span> {question.question}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {question.options.map((option, idx) => (
            <motion.div
              key={idx}
              onClick={() => handleOptionClick(option)}
              className={`bg-white p-5 rounded-lg cursor-pointer transition-all border-3 ${
                answered
                  ? option.correct
                    ? "border-green-500 bg-green-50"
                    : "border-red-500 bg-red-50"
                  : "border-gray-300 hover:border-primary hover:shadow-lg"
              }`}
              whileHover={{ scale: answered ? 1 : 1.03 }}
            >
              <div className="text-5xl text-center mb-3">{option.icon}</div>
              <p className="text-center text-sm font-medium text-gray-800">{option.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-5 font-pixel text-sm text-accent">
        Richtig: <span className="text-white">{correctChoices}</span>/3
      </div>

      <FeedbackModal
        isOpen={feedback.show}
        success={feedback.success}
        title={feedback.title}
        text={feedback.text}
        onClose={handleFeedbackClose}
      />
    </motion.div>
  );
}

// Level 4: Boss Battle
function Level4({
  gameState,
  onPlayCard,
  onWin,
  onReset
}: {
  gameState: GameState;
  onPlayCard: (card: typeof PLAYER_CARDS[0]) => void;
  onWin: () => void;
  onReset: () => void;
}) {
  const [currentAttack, setCurrentAttack] = useState<typeof ENEMY_ATTACKS[0] | null>(null);
  const [battleLog, setBattleLog] = useState<string>("");
  const [hand, setHand] = useState<typeof PLAYER_CARDS>([]);
  const [canPlay, setCanPlay] = useState(false);

  const { level4 } = gameState;

  useEffect(() => {
    // Initial setup
    drawCards();
    setTimeout(() => enemyTurn(), 1000);
  }, []);

  const drawCards = () => {
    const shuffled = [...PLAYER_CARDS].sort(() => Math.random() - 0.5);
    setHand(shuffled.slice(0, 4));
  };

  const enemyTurn = () => {
    const attack = ENEMY_ATTACKS[level4.round % ENEMY_ATTACKS.length];
    setCurrentAttack(attack);
    setBattleLog(`Herr D.S. Gvo spielt "${attack.name}" (-${attack.damage}% Überzeugung)`);
    setCanPlay(true);
  };

  const handleCardClick = (card: typeof PLAYER_CARDS[0]) => {
    if (!canPlay) return;
    setCanPlay(false);
    setCurrentAttack(null);

    if (card.power === 0) {
      setBattleLog(`Du spielst "${card.name}" - Der CDO gähnt. Wirkungslos!`);
    } else {
      setBattleLog(`Du spielst "${card.name}": "${card.description}" (+${card.power}% Überzeugung)`);
    }

    onPlayCard(card);

    // Check win/lose after state update
    setTimeout(() => {
      const newCdoMeter = card.power === 0 
        ? level4.cdoMeter - (currentAttack?.damage || 0)
        : Math.min(100, level4.cdoMeter - (currentAttack?.damage || 0) + card.power);
      
      if (newCdoMeter >= 100 || level4.enemyHP - card.power <= 0) {
        onWin();
      } else if (newCdoMeter <= 0 || (card.power === 0 && level4.playerHP - 10 <= 0)) {
        onReset();
        drawCards();
        setTimeout(() => enemyTurn(), 1500);
      } else {
        drawCards();
        setTimeout(() => enemyTurn(), 1000);
      }
    }, 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center p-8 pt-24 bg-[#141428]/98"
    >
      <h2 className="font-pixel text-xl text-primary mb-6 neon-text-pink">Level 4: Der Boss-Kampf</h2>

      <div className="w-full max-w-4xl grid grid-cols-3 gap-4 mb-6">
        {/* Player Panel */}
        <div className="bg-gradient-to-b from-[#2c3e50] to-[#1a252f] border-2 border-secondary rounded-xl p-4">
          <div className="text-center mb-3">
            <div className="text-4xl mb-2">👩‍💼</div>
            <div className="font-pixel text-xs text-secondary">SABINE</div>
          </div>
          <div className="text-xs text-gray-400 mb-1">Energie</div>
          <div className="h-4 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-green-400"
              animate={{ width: `${level4.playerHP}%` }}
            />
          </div>
          <div className="text-right text-xs text-gray-400 mt-1">{level4.playerHP}%</div>
        </div>

        {/* CDO Panel */}
        <div className="bg-gradient-to-b from-[#2c3e50] to-[#1a252f] border-2 border-accent rounded-xl p-4">
          <div className="text-center mb-3">
            <div className="text-4xl mb-2">👔</div>
            <div className="font-pixel text-xs text-accent">CDO</div>
          </div>
          <div className="text-xs text-gray-400 mb-1">Überzeugung</div>
          <div className="h-4 bg-gray-700 rounded-full overflow-hidden border border-accent">
            <motion.div
              className="h-full"
              style={{ background: "linear-gradient(90deg, #e74c3c, #f39c12, #27ae60)" }}
              animate={{ width: `${level4.cdoMeter}%` }}
            />
          </div>
          <div className="text-right text-xs text-gray-400 mt-1">{level4.cdoMeter}%</div>
        </div>

        {/* Enemy Panel */}
        <div className="bg-gradient-to-b from-[#2c3e50] to-[#1a252f] border-2 border-red-500 rounded-xl p-4">
          <div className="text-center mb-3">
            <div className="text-4xl mb-2">🛡️</div>
            <div className="font-pixel text-xs text-red-400">HERR D.S. GVO</div>
          </div>
          <div className="text-xs text-gray-400 mb-1">Widerstand</div>
          <div className="h-4 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
            <motion.div
              className="h-full bg-gradient-to-r from-red-600 to-red-400"
              animate={{ width: `${level4.enemyHP}%` }}
            />
          </div>
          <div className="text-right text-xs text-gray-400 mt-1">{level4.enemyHP}%</div>
        </div>
      </div>

      {/* Battle Area */}
      <div className="bg-white/95 text-gray-800 rounded-xl p-5 w-full max-w-4xl">
        <div className="bg-gray-100 rounded-lg p-4 mb-4 text-sm border-2 border-gray-300">
          {battleLog || "Das Meeting beginnt..."}
        </div>

        {currentAttack && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 border-2 border-red-500 rounded-lg p-4 mb-4"
          >
            <strong className="text-red-700">{currentAttack.name}:</strong>
            <br />
            <span className="text-red-600">😤 "{currentAttack.text}"</span>
          </motion.div>
        )}

        {/* Card Hand */}
        <div className="flex flex-wrap gap-3 justify-center">
          {hand.map((card) => (
            <motion.div
              key={card.id}
              onClick={() => handleCardClick(card)}
              className={`bg-gradient-to-b from-white to-gray-100 border-3 border-gray-800 rounded-lg p-3 w-32 text-center cursor-pointer transition-all ${
                !canPlay ? "opacity-50 cursor-not-allowed" : "hover:border-primary hover:-translate-y-2 hover:shadow-xl"
              }`}
              whileHover={{ scale: canPlay ? 1.05 : 1 }}
            >
              <div className="text-3xl mb-2">{card.icon}</div>
              <div className="font-bold text-xs text-gray-800 mb-1">{card.name}</div>
              <div className="text-xs text-gray-600">{card.effect}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Win Screen
function WinScreen({ onRestart }: { onRestart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-green-600/95 to-teal-700/95"
    >
      <motion.h1
        className="font-pixel text-3xl text-white mb-6"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        style={{ textShadow: "4px 4px 0 rgba(0,0,0,0.3)" }}
      >
        🎉 MISSION ERFOLGREICH! 🎉
      </motion.h1>

      <motion.div
        className="bg-white/95 text-gray-800 p-8 rounded-xl max-w-xl text-center"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <p className="text-lg leading-relaxed mb-4">
          <strong>Der CDO ist überzeugt!</strong> Die Online-Funktion von BärGPT wird freigeschaltet.
        </p>
        <p className="text-lg leading-relaxed mb-4">
          Sabine kann jetzt aktuelle Gesetze abfragen, Bürgeranträge schneller bearbeiten und muss keine unsicheren Workarounds mehr nutzen.
        </p>
        <p className="text-lg leading-relaxed">
          <strong>Die Berliner Verwaltung macht einen großen Schritt in die digitale Zukunft!</strong>
        </p>
      </motion.div>

      <motion.button
        onClick={onRestart}
        className="mt-8 font-pixel text-sm bg-gradient-to-b from-yellow-400 to-orange-600 text-white px-10 py-5 rounded-lg shadow-lg hover:scale-105 transition-transform"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        NOCHMAL SPIELEN
      </motion.button>
    </motion.div>
  );
}

// ==================== MAIN GAME COMPONENT ====================
export default function Home() {
  const [screen, setScreen] = useState<GameScreen>("start");
  const [gameState, setGameState] = useState<GameState>({
    currentLevel: 1,
    approval: 50,
    level1: { biasesFound: 0, completed: false },
    level2: { storiesPlaced: 0, completed: false },
    level3: { currentQuestion: 0, correctChoices: 0, completed: false },
    level4: { playerHP: 100, enemyHP: 100, cdoMeter: 50, round: 0, completed: false }
  });

  const startGame = useCallback(() => {
    setScreen("level1");
  }, []);

  const handleBiasFound = useCallback((bias: string, zone: string) => {
    setGameState(prev => ({
      ...prev,
      approval: Math.min(100, prev.approval + 5),
      level1: { ...prev.level1, biasesFound: prev.level1.biasesFound + 1 }
    }));
    return true;
  }, []);

  const handleLevel1Complete = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      level1: { ...prev.level1, completed: true }
    }));
    setTimeout(() => setScreen("level2"), 500);
  }, []);

  const handleStoryPlaced = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      approval: Math.min(100, prev.approval + 5),
      level2: { ...prev.level2, storiesPlaced: prev.level2.storiesPlaced + 1 }
    }));
    return true;
  }, []);

  const handleLevel2Complete = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      level2: { ...prev.level2, completed: true }
    }));
    setTimeout(() => setScreen("level3"), 500);
  }, []);

  const handleDataAnswer = useCallback((correct: boolean) => {
    setGameState(prev => ({
      ...prev,
      approval: correct ? Math.min(100, prev.approval + 10) : Math.max(0, prev.approval - 5),
      level3: {
        ...prev.level3,
        currentQuestion: prev.level3.currentQuestion + 1,
        correctChoices: correct ? prev.level3.correctChoices + 1 : prev.level3.correctChoices
      }
    }));
  }, []);

  const handleLevel3Complete = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      level3: { ...prev.level3, completed: true },
      level4: { ...prev.level4, cdoMeter: prev.approval }
    }));
    setTimeout(() => setScreen("level4"), 500);
  }, []);

  const handlePlayCard = useCallback((card: typeof PLAYER_CARDS[0]) => {
    setGameState(prev => {
      const newState = { ...prev };
      if (card.power === 0) {
        newState.level4.playerHP = Math.max(0, prev.level4.playerHP - 10);
      } else {
        newState.level4.cdoMeter = Math.min(100, prev.level4.cdoMeter + card.power);
        newState.level4.enemyHP = Math.max(0, prev.level4.enemyHP - card.power);
      }
      newState.level4.round = prev.level4.round + 1;
      return newState;
    });
  }, []);

  const handleWin = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      level4: { ...prev.level4, completed: true },
      approval: prev.level4.cdoMeter
    }));
    setScreen("win");
  }, []);

  const handleLevel4Reset = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      level4: { playerHP: 100, enemyHP: 100, cdoMeter: 50, round: 0, completed: false }
    }));
  }, []);

  const restartGame = useCallback(() => {
    setGameState({
      currentLevel: 1,
      approval: 50,
      level1: { biasesFound: 0, completed: false },
      level2: { storiesPlaced: 0, completed: false },
      level3: { currentQuestion: 0, correctChoices: 0, completed: false },
      level4: { playerHP: 100, enemyHP: 100, cdoMeter: 50, round: 0, completed: false }
    });
    setScreen("start");
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
      <div className="relative w-full max-w-5xl h-[700px] max-h-[95vh] arcade-frame scanlines overflow-hidden">
        {screen !== "start" && screen !== "win" && (
          <HUD
            approval={screen === "level4" ? gameState.level4.cdoMeter : gameState.approval}
            level={
              screen === "level1" ? 1 :
              screen === "level2" ? 2 :
              screen === "level3" ? 3 : 4
            }
          />
        )}

        <AnimatePresence mode="wait">
          {screen === "start" && <StartScreen key="start" onStart={startGame} />}
          
          {screen === "level1" && (
            <Level1
              key="level1"
              biasesFound={gameState.level1.biasesFound}
              onBiasFound={handleBiasFound}
              onComplete={handleLevel1Complete}
            />
          )}
          
          {screen === "level2" && (
            <Level2
              key="level2"
              storiesPlaced={gameState.level2.storiesPlaced}
              onStoryPlaced={handleStoryPlaced}
              onComplete={handleLevel2Complete}
            />
          )}
          
          {screen === "level3" && (
            <Level3
              key="level3"
              currentQuestion={gameState.level3.currentQuestion}
              correctChoices={gameState.level3.correctChoices}
              onAnswer={handleDataAnswer}
              onComplete={handleLevel3Complete}
            />
          )}
          
          {screen === "level4" && (
            <Level4
              key="level4"
              gameState={gameState}
              onPlayCard={handlePlayCard}
              onWin={handleWin}
              onReset={handleLevel4Reset}
            />
          )}
          
          {screen === "win" && <WinScreen key="win" onRestart={restartGame} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
