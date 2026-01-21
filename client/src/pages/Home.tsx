/*
 * DESIGN PHILOSOPHY: Retro-Arcade Cabinet
 * - 80er Arcade-Ästhetik mit Neon-Lichtern und CRT-Glow
 * - Synthwave-Vibes kombiniert mit klassischen Spielautomaten-UI-Elementen
 * - Neon-Glow: Jedes wichtige Element hat einen leuchtenden Rand
 * - Scanline-Authentizität: Subtile horizontale Linien wie auf alten Monitoren
 * - Cabinet-Frame: Die gesamte UI wirkt wie ein Spielautomat
 */

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ==================== SOUND SYSTEM ====================
const createSound = (frequency: number, duration: number, type: OscillatorType = 'square') => {
  return () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio not supported
    }
  };
};

const playClickSound = createSound(800, 0.1);
const playCorrectSound = () => {
  createSound(523, 0.1)();
  setTimeout(() => createSound(659, 0.1)(), 100);
  setTimeout(() => createSound(784, 0.15)(), 200);
};
const playWrongSound = () => {
  createSound(200, 0.3, 'sawtooth')();
};
const playLevelUpSound = () => {
  createSound(392, 0.1)();
  setTimeout(() => createSound(523, 0.1)(), 100);
  setTimeout(() => createSound(659, 0.1)(), 200);
  setTimeout(() => createSound(784, 0.2)(), 300);
};
const playVictorySound = () => {
  [523, 659, 784, 1047].forEach((freq, i) => {
    setTimeout(() => createSound(freq, 0.2)(), i * 150);
  });
};
const playCoffeeSound = () => {
  createSound(1200, 0.05)();
  setTimeout(() => createSound(1400, 0.05)(), 50);
  setTimeout(() => createSound(1600, 0.1)(), 100);
};
const playFaxSound = () => {
  [400, 600, 400, 800, 400].forEach((freq, i) => {
    setTimeout(() => createSound(freq, 0.15, 'sawtooth')(), i * 100);
  });
};

// ==================== UTILITY FUNCTIONS ====================
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// ==================== GAME DATA ====================
const BIASES = {
  "loss-aversion": {
    name: "Verlust-Aversion",
    explanation: "Die Verlust-Aversion ist ein zentrales Konzept der Prospect Theory von Kahneman & Tversky (1979). Menschen empfinden Verluste etwa 2-2,5x stärker als gleichwertige Gewinne. Der Fokus auf 'Ruf unwiederbringlich zerstören' aktiviert diese kognitive Verzerrung – die Angst vor dem Verlust überwiegt die potenziellen Vorteile der Innovation. In Organisationen führt dies oft zu übermäßiger Risikovermeidung.",
    source: "Kahneman, D. & Tversky, A. (1979). Prospect Theory: An Analysis of Decision under Risk."
  },
  "zero-risk": {
    name: "Zero-Risk Bias",
    explanation: "Der Zero-Risk Bias beschreibt die irrationale Präferenz für die vollständige Eliminierung eines Risikos, selbst wenn eine Reduktion eines größeren Risikos objektiv sinnvoller wäre. Die Forderung nach '100% Sicherheit' ist in komplexen IT-Systemen unrealistisch – selbst Offline-Systeme haben Risiken (z.B. veraltete Daten, Schatten-IT). Studien zeigen: Menschen zahlen überproportional viel für 'Zero Risk', auch wenn dies ineffizient ist.",
    source: "Baron, J. (2000). Thinking and Deciding. Cambridge University Press."
  },
  "omission": {
    name: "Omission Bias",
    explanation: "Der Omission Bias ist die Tendenz, schädliche Handlungen als schlimmer zu bewerten als gleich schädliche Unterlassungen. 'Beim aktuellen System bleiben' erscheint sicherer, obwohl der Status Quo eigene Risiken birgt (veraltete Prozesse, Schatten-IT, Frustration). In der Verwaltung verstärkt sich dieser Bias durch Rechenschaftspflicht: Für aktive Entscheidungen muss man sich rechtfertigen, für Nicht-Handeln seltener.",
    source: "Spranca, M., Minsk, E., & Baron, J. (1991). Omission and Commission in Judgment and Choice."
  }
};

// Personalrat-Level Daten
const PERSONALRAT_ATTACKS = [
  { 
    name: "Mitbestimmungs-Paragraf", 
    text: "§75 Abs. 3 Nr. 17 PersVG! KI-Systeme sind mitbestimmungspflichtig!", 
    damage: 15,
    bias: "authority-bias",
    explanation: "Der Authority Bias: Verweis auf Paragrafen wirkt einschüchternd, auch wenn die Rechtslage komplexer ist."
  },
  { 
    name: "Überlastungs-Klage", 
    text: "Die Kolleg*innen sind jetzt schon überlastet! Noch ein neues System?!", 
    damage: 20,
    bias: "status-quo",
    explanation: "Status-Quo Bias: Veränderung wird als zusätzliche Belastung wahrgenommen, nicht als Entlastung."
  },
  { 
    name: "Arbeitsplatz-Angst", 
    text: "Wollen Sie unsere Mitarbeiter*innen durch Maschinen ersetzen?!", 
    damage: 25,
    bias: "loss-aversion",
    explanation: "Verlust-Aversion: Die Angst vor Jobverlust ist emotional stärker als die Aussicht auf bessere Arbeitsbedingungen."
  },
  { 
    name: "Schulungs-Forderung", 
    text: "Wer bezahlt die Schulungen? Wer hat Zeit dafür?!", 
    damage: 15,
    bias: "present-bias",
    explanation: "Present Bias: Kurzfristige Kosten (Schulung) werden überbewertet, langfristige Vorteile unterschätzt."
  }
];

const PERSONALRAT_COUNTERS = [
  { id: "entlastung", name: "Entlastungs-Argument", icon: "⚖️", effect: "+20", power: 20, description: "BärGPT übernimmt Routine-Recherchen – mehr Zeit für echte Bürgerberatung!" },
  { id: "mitbestimmung", name: "Mitbestimmungs-Angebot", icon: "🤝", effect: "+25", power: 25, description: "Wir laden den Personalrat in die Pilotgruppe ein – echte Mitgestaltung!" },
  { id: "qualifizierung", name: "Qualifizierungs-Versprechen", icon: "📚", effect: "+15", power: 15, description: "Schulungen während der Arbeitszeit, keine Überstunden." },
  { id: "pilotphase", name: "Freiwillige Pilotphase", icon: "🧪", effect: "+20", power: 20, description: "Nur interessierte Kolleg*innen testen zuerst – kein Zwang." },
  { id: "jargon", name: "Verwaltungs-Jargon", icon: "📜", effect: "0", power: 0, description: "Gemäß §3 Abs. 2 der Verwaltungsvorschrift..." }
];

// Beschäftigten-Bedarfsabfrage Daten
const SURVEY_RESULTS = [
  {
    question: "Wie interpretierst du dieses Umfrageergebnis?",
    stat: "73% der Beschäftigten wünschen sich 'schnellere Antworten auf Rechtsfragen'",
    options: [
      { id: "bedarf", label: "Klarer Bedarf für ein Recherche-Tool wie BärGPT", correct: true },
      { id: "schulung", label: "Die Mitarbeiter brauchen mehr Schulungen", correct: false }
    ],
    feedback: {
      correct: "Richtig! Die Beschäftigten artikulieren einen konkreten Pain Point, den BärGPT adressieren kann. Das ist ein starkes Argument für die Einführung.",
      wrong: "Nicht ganz. Mehr Schulungen lösen nicht das Problem der zeitaufwändigen Recherche. Die Beschäftigten wollen schnellere Antworten, nicht mehr Wissen."
    }
  },
  {
    question: "Was bedeutet dieses Ergebnis für deine Argumentation?",
    stat: "45% geben an, bereits 'inoffizielle Hilfsmittel' (ChatGPT privat, Google) zu nutzen",
    options: [
      { id: "schatten", label: "Schatten-IT ist bereits Realität – BärGPT ist die sichere Alternative", correct: true },
      { id: "verbot", label: "Private Tools müssen strenger verboten werden", correct: false }
    ],
    feedback: {
      correct: "Exzellent! Du nutzt das Pre-Suasion-Prinzip: Das Risiko besteht BEREITS. BärGPT ist nicht das Risiko, sondern die Lösung. Das reframt die gesamte Diskussion.",
      wrong: "Verbote funktionieren selten, wenn der Bedarf real ist. Die Beschäftigten werden Wege finden. Besser: Eine sichere, offizielle Alternative anbieten."
    }
  },
  {
    question: "Welche Schlussfolgerung ziehst du aus diesem Feedback?",
    stat: "Freitext-Analyse: 'Frustration' und 'Zeitdruck' sind die häufigsten Begriffe",
    options: [
      { id: "emotion", label: "Emotionale Argumente (Frustration reduzieren) sind überzeugender als Zahlen", correct: true },
      { id: "zahlen", label: "Wir brauchen mehr quantitative Daten", correct: false }
    ],
    feedback: {
      correct: "Sehr gut! Emotionen treiben Entscheidungen (Damasio's Somatic Marker Hypothesis). Geschichten über frustrierte Mitarbeiter*innen wirken stärker als abstrakte Effizienzgewinne.",
      wrong: "Zahlen allein überzeugen selten. Die emotionale Komponente (Frustration, Zeitdruck) macht das Problem greifbar und dringlich."
    }
  }
];

const DATA_QUESTIONS = [
  {
    question: "Der CDO fragt nach dem ROI. Welche Visualisierung wählst du?",
    options: [
      { id: "roi", icon: "📈", label: "Zeitersparnis pro Vorgang: 47 Min → 12 Min", correct: true },
      { id: "tech", icon: "🔧", label: "Technische Architektur-Diagramm", correct: false }
    ],
    feedback: {
      correct: "Richtig! Konkrete Zahlen überzeugen. Zeit = Geld in der Verwaltung. Die Zeitersparnis von 35 Minuten pro Vorgang lässt sich direkt in eingesparte Personalkosten umrechnen.",
      wrong: "Technische Details langweilen Entscheider. Der CDO denkt in Business-Impact, nicht in Systemarchitektur. Zeige den ROI!"
    }
  },
  {
    question: "Wie präsentierst du die Sicherheitsmaßnahmen?",
    options: [
      { id: "compare", icon: "⚖️", label: "Vergleich: BärGPT-Filter vs. Schatten-IT Risiken", correct: true },
      { id: "list", icon: "📋", label: "Liste aller technischen Sicherheitsfeatures", correct: false }
    ],
    feedback: {
      correct: "Perfekt! Du nutzt das Kontrastprinzip (Cialdini): Im Vergleich zur unkontrollierten Schatten-IT erscheint BärGPT als die SICHERERE Option. Das reframt die Diskussion.",
      wrong: "Feature-Listen überzeugen nicht. Sie wirken defensiv. Zeige stattdessen den relativen Vorteil gegenüber dem Status Quo!"
    }
  },
  {
    question: "Der CDO fragt nach dem Risiko von Schatten-IT. Wie antwortest du?",
    options: [
      { id: "risk", icon: "⚠️", label: "Risiko-Matrix: Schatten-IT = Hohe Wahrscheinlichkeit + Hoher Schaden", correct: true },
      { id: "ignore", icon: "🤷", label: "Das Thema herunterspielen", correct: false }
    ],
    feedback: {
      correct: "Richtig! Du nutzt Pre-Suasion (Cialdini, 2016): Indem du das Risiko des NICHT-Handelns betonst, wird BärGPT zur Risiko-Reduktion, nicht zum Risiko. Der Stillstand IST das Risiko.",
      wrong: "Gefährlich! Ignorierte Risiken kommen zurück. Nutze sie als Argument FÜR die Änderung – das ist strategisch klüger."
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
  { id: "premortem", name: "Pre-Mortem Analyse", icon: "🔮", effect: "+25 Überzeugung", power: 25, description: "Wir simulieren Fehler vorher und bauen Filter ein. (Klein, 2007: Prospective Hindsight)" },
  { id: "fomo", name: "FOMO-Karte", icon: "🏃", effect: "+20 Überzeugung", power: 20, description: "Hamburg macht es schon. Wollen wir zurückbleiben? (Social Proof nach Cialdini)" },
  { id: "pilot", name: "Pilot-Plan", icon: "🧪", effect: "+15 Überzeugung", power: 15, description: "Begrenzter Rollout als Reallabor. Geringes Risiko, schnelles Lernen." },
  { id: "sabine", name: "Sabines Geschichte", icon: "👩‍💼", effect: "+20 Überzeugung", power: 20, description: "Eine echte Mitarbeiterin erzählt von ihrer Frustration. (Narrative Transportation)" },
  { id: "schatten", name: "Schatten-IT Warnung", icon: "👻", effect: "+15 Überzeugung", power: 15, description: "Mitarbeiter nutzen bereits private ChatGPT-Accounts! (Pre-Suasion: Das Risiko existiert bereits)" },
  { id: "technik", name: "Technik-Jargon", icon: "🔧", effect: "Wirkungslos", power: 0, description: "API-Endpoints, TLS 1.3, OAuth 2.0... (Curse of Knowledge: Experten überschätzen Verständnis)" }
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
type GameScreen = "start" | "level1" | "level2" | "level3" | "level4" | "level5" | "level6" | "win";

interface GameState {
  currentLevel: number;
  approval: number;
  energy: number;
  coffeeFound: boolean;
  faxTriggered: boolean;
  level1: { biasesFound: number; completed: boolean };
  level2: { round: number; personalratHP: number; completed: boolean };
  level3: { currentQuestion: number; correctChoices: number; completed: boolean };
  level4: { storiesPlaced: number; completed: boolean };
  level5: { currentQuestion: number; correctChoices: number; completed: boolean };
  level6: { playerHP: number; enemyHP: number; cdoMeter: number; round: number; completed: boolean };
}

// ==================== COMPONENTS ====================

// Easter Egg: Coffee Component
function CoffeeEasterEgg({ onFind }: { onFind: () => void }) {
  const [visible, setVisible] = useState(true);
  
  if (!visible) return null;
  
  return (
    <motion.div
      className="absolute bottom-4 right-4 cursor-pointer z-[100] opacity-30 hover:opacity-100 transition-opacity"
      whileHover={{ scale: 1.2, rotate: 10 }}
      onClick={() => {
        playCoffeeSound();
        onFind();
        setVisible(false);
      }}
      title="☕ Versteckter Kaffee!"
    >
      <span className="text-2xl">☕</span>
    </motion.div>
  );
}

// Easter Egg: Fax Modal
function FaxModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 flex items-center justify-center z-[2000] bg-black/70"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.5, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        className="bg-white p-8 rounded-xl max-w-md text-center border-4 border-gray-400 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-6xl mb-4">📠</div>
        <h3 className="font-pixel text-lg text-gray-800 mb-4">FAXGERÄT AKTIVIERT!</h3>
        <p className="text-gray-600 mb-4">Möchten Sie Ihre Präsentation per Fax an den CDO senden?</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => { playFaxSound(); onClose(); }}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm"
          >
            📞 Fax senden (Dauer: 47 Min)
          </button>
          <button
            onClick={() => { playFaxSound(); onClose(); }}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm"
          >
            🐦 Per Brieftaube
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 text-sm"
          >
            💻 Digital ist besser
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-4 italic">
          "Die Berliner Verwaltung: Wo Faxgeräte noch Zukunftsmusik sind."
        </p>
      </motion.div>
    </motion.div>
  );
}

// HUD Component
function HUD({ approval, level, energy, coffeeFound }: { approval: number; level: number; energy: number; coffeeFound: boolean }) {
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
            }}
            animate={{ width: `${approval}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        {coffeeFound && (
          <div className="text-[10px] text-green-400 mt-1">☕ Kaffee-Boost aktiv!</div>
        )}
      </div>
      <div className="flex gap-2">
        <div className="bg-black/80 border-2 border-green-500 rounded-lg px-3 py-2 pointer-events-auto">
          <div className="font-pixel text-[10px] text-green-400">⚡ {energy}%</div>
        </div>
        <div className="bg-black/80 border-2 border-accent rounded-lg px-4 py-3 pointer-events-auto neon-glow-gold">
          <div className="font-pixel text-xs text-accent">Level {level}/6</div>
        </div>
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
  source,
  onClose
}: {
  isOpen: boolean;
  success: boolean;
  title: string;
  text: string;
  source?: string;
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
            className={`bg-white text-gray-800 p-8 rounded-xl max-w-lg text-center border-4 ${
              success ? "border-green-500" : "border-red-500"
            } shadow-2xl max-h-[80vh] overflow-y-auto`}
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
            <p className="text-sm leading-relaxed mb-4">{text}</p>
            {source && (
              <p className="text-xs text-gray-500 italic mb-4 border-t pt-3">
                📚 {source}
              </p>
            )}
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
function StartScreen({ onStart, onFaxTrigger }: { onStart: () => void; onFaxTrigger: () => void }) {
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
          Aber Vorsicht: Der Datenschutzbeauftragte, der Personalrat und skeptische Beschäftigte stehen dir im Weg.
          Du musst psychologische Barrieren erkennen, Stakeholder überzeugen und mit Daten punkten.
        </p>

        <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
          {[
            { level: 1, title: "Die Diagnose", desc: "Erkenne die Biases" },
            { level: 2, title: "Der Anruf", desc: "Personalrat überzeugen" },
            { level: 3, title: "Die Basis", desc: "Beschäftigte verstehen" },
            { level: 4, title: "Storytelling", desc: "Baue die Heldenreise" },
            { level: 5, title: "Data Lab", desc: "Wähle die richtigen Daten" },
            { level: 6, title: "Boss-Kampf", desc: "Finale Konfrontation" }
          ].map((item) => (
            <div
              key={item.level}
              className="bg-gray-100 p-2 rounded-lg border-l-4 border-primary"
            >
              <strong className="text-primary">L{item.level}:</strong> {item.title}
              <br />
              <small className="text-gray-600">{item.desc}</small>
            </div>
          ))}
        </div>
        
        {/* Hidden Fax Easter Egg Trigger */}
        <div 
          className="mt-4 text-center text-gray-400 text-xs cursor-pointer hover:text-gray-600"
          onClick={onFaxTrigger}
        >
          📠 Präsentation per Fax senden?
        </div>
      </motion.div>

      <motion.button
        onClick={() => { playClickSound(); onStart(); }}
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
  onComplete,
  onCoffeeFind
}: {
  biasesFound: number;
  onBiasFound: (bias: string, zone: string) => boolean;
  onComplete: () => void;
  onCoffeeFind: () => void;
}) {
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [foundBiases, setFoundBiases] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<{ show: boolean; success: boolean; title: string; text: string; source?: string }>({
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

  // Randomize bias options on mount
  const biasOptions = useMemo(() => shuffleArray([
    { id: "loss-aversion", label: "Verlust-Aversion" },
    { id: "zero-risk", label: "Zero-Risk Bias" },
    { id: "omission", label: "Omission Bias" },
    { id: "confirmation", label: "Confirmation Bias" },
    { id: "anchoring", label: "Anchoring Bias" }
  ]), []);

  const handleZoneClick = (zoneId: string) => {
    if (foundBiases.has(zoneId)) return;
    playClickSound();
    setSelectedZone(zoneId);
  };

  const handleBiasClick = (biasId: string) => {
    if (!selectedZone) return;
    playClickSound();
    
    const zone = zones.find(z => z.id === selectedZone);
    if (!zone) return;

    if (zone.bias === biasId) {
      playCorrectSound();
      setFoundBiases(prev => new Set(Array.from(prev).concat(selectedZone)));
      const biasInfo = BIASES[biasId as keyof typeof BIASES];
      setFeedback({
        show: true,
        success: true,
        title: `${biasInfo.name} erkannt!`,
        text: biasInfo.explanation,
        source: biasInfo.source
      });
      onBiasFound(biasId, selectedZone);
      
      if (biasesFound + 1 >= 3) {
        setTimeout(() => { playLevelUpSound(); onComplete(); }, 100);
      }
    } else {
      playWrongSound();
      setFeedback({
        show: true,
        success: false,
        title: "Nicht ganz...",
        text: "Lies den Text nochmal genau. Welcher psychologische Effekt steckt dahinter? Achte auf Schlüsselwörter wie 'zerstören', '100%' oder 'besser bleiben'."
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
      <CoffeeEasterEgg onFind={onCoffeeFind} />
      
      <h2 className="font-pixel text-xl text-primary mb-2 neon-text-pink">Level 1: Die Diagnose</h2>
      <p className="text-gray-400 mb-6 text-center text-sm">Erkenne die psychologischen Barrieren in der E-Mail des Datenschutzes</p>

      <div className="bg-gradient-to-b from-[#3d3d5c] to-[#2d2d44] border-3 border-gray-600 rounded-xl p-6 w-full max-w-3xl">
        <div className="bg-white text-gray-800 p-5 rounded-lg mb-5 border-2 border-gray-300">
          <div className="border-b-2 border-gray-200 pb-3 mb-4 text-sm text-gray-600">
            <div className="font-bold text-primary">Von: Herr D. S. Gvo (Datenschutzbeauftragter)</div>
            <div>Betreff: RE: Anfrage Online-Funktion BärGPT</div>
          </div>
          <p className="mb-3 text-sm">Sehr geehrte Kolleginnen und Kollegen,</p>
          <p className="mb-3 text-sm">
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
          <p className="mb-3 text-sm">
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
          <p className="mb-3 text-sm">
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
          <p className="text-sm">Mit freundlichen Grüßen,<br />D. S. Gvo</p>
        </div>

        <p className="text-accent font-bold mb-4 text-center text-sm">🎯 Klicke auf die markierten Stellen und wähle den passenden Bias!</p>

        <div className="flex flex-wrap gap-3 justify-center">
          {biasOptions.map((bias) => (
            <motion.button
              key={bias.id}
              onClick={() => handleBiasClick(bias.id)}
              disabled={foundBiases.has(zones.find(z => z.bias === bias.id)?.id || "")}
              className={`px-4 py-2 rounded-full font-bold text-xs transition-all border-2 ${
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
        source={feedback.source}
        onClose={() => setFeedback({ ...feedback, show: false })}
      />
    </motion.div>
  );
}

// Level 2: Personalrat Pokémon-Style
function Level2({
  round,
  personalratHP,
  onCounter,
  onComplete
}: {
  round: number;
  personalratHP: number;
  onCounter: (power: number) => void;
  onComplete: () => void;
}) {
  const [currentAttack, setCurrentAttack] = useState<typeof PERSONALRAT_ATTACKS[0] | null>(null);
  const [battleLog, setBattleLog] = useState<string>("Das Telefon klingelt...");
  const [canPlay, setCanPlay] = useState(false);
  const [playerHP, setPlayerHP] = useState(100);
  const [feedback, setFeedback] = useState<{ show: boolean; success: boolean; title: string; text: string }>({
    show: false, success: false, title: "", text: ""
  });

  // Randomize counters
  const counters = useMemo(() => shuffleArray([...PERSONALRAT_COUNTERS]), [round]);

  useEffect(() => {
    setTimeout(() => {
      const attack = PERSONALRAT_ATTACKS[round % PERSONALRAT_ATTACKS.length];
      setCurrentAttack(attack);
      setBattleLog(`Frau Müller setzt "${attack.name}" ein!`);
      setCanPlay(true);
    }, 1500);
  }, [round]);

  const handleCounter = (counter: typeof PERSONALRAT_COUNTERS[0]) => {
    if (!canPlay || !currentAttack) return;
    playClickSound();
    setCanPlay(false);

    if (counter.power === 0) {
      playWrongSound();
      setBattleLog(`Du verwendest "${counter.name}" - Frau Müller verdreht die Augen. Wirkungslos!`);
      setPlayerHP(prev => Math.max(0, prev - currentAttack.damage));
      setFeedback({
        show: true,
        success: false,
        title: "Fehlschlag!",
        text: "Verwaltungsjargon überzeugt niemanden. Sprich die Sprache deines Gegenübers!"
      });
    } else {
      playCorrectSound();
      setBattleLog(`"${counter.description}" - Frau Müller nickt nachdenklich.`);
      onCounter(counter.power);
      
      if (personalratHP - counter.power <= 0) {
        setTimeout(() => {
          playLevelUpSound();
          onComplete();
        }, 1000);
        return;
      }
      
      setFeedback({
        show: true,
        success: true,
        title: "Guter Konter!",
        text: currentAttack.explanation
      });
    }
  };

  const handleFeedbackClose = () => {
    setFeedback({ ...feedback, show: false });
    if (personalratHP > 0 && playerHP > 0) {
      setTimeout(() => {
        const nextAttack = PERSONALRAT_ATTACKS[(round + 1) % PERSONALRAT_ATTACKS.length];
        setCurrentAttack(nextAttack);
        setBattleLog(`Frau Müller setzt "${nextAttack.name}" ein!`);
        setCanPlay(true);
      }, 500);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center p-8 pt-24 bg-[#141428]/98"
    >
      <h2 className="font-pixel text-xl text-primary mb-2 neon-text-pink">Level 2: Der Anruf</h2>
      <p className="text-gray-400 mb-4 text-center text-sm">Überzeuge die Vorsitzende des Hauptpersonalrats</p>

      {/* Pokémon-Style Battle UI */}
      <div className="w-full max-w-4xl">
        {/* Opponent Side */}
        <div className="flex justify-end mb-4">
          <div className="bg-gradient-to-r from-red-900/80 to-red-800/80 border-2 border-red-500 rounded-xl p-4 w-64">
            <div className="flex items-center gap-3">
              <div className="text-4xl">👩‍💼</div>
              <div className="flex-1">
                <div className="font-pixel text-xs text-red-300">FRAU MÜLLER</div>
                <div className="font-pixel text-[10px] text-gray-400">Personalratsvorsitzende</div>
                <div className="h-3 bg-gray-700 rounded-full overflow-hidden mt-1">
                  <motion.div
                    className="h-full bg-gradient-to-r from-red-500 to-red-400"
                    animate={{ width: `${personalratHP}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Battle Area */}
        <div className="bg-gradient-to-b from-green-900/30 to-green-800/20 border-2 border-green-700 rounded-xl p-4 mb-4">
          {currentAttack && (
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="bg-red-100 border-2 border-red-400 rounded-lg p-4 mb-4 text-gray-800"
            >
              <div className="font-bold text-red-700">📞 {currentAttack.name}</div>
              <p className="text-sm mt-1">"{currentAttack.text}"</p>
            </motion.div>
          )}
          <div className="text-center text-gray-300 text-sm">{battleLog}</div>
        </div>

        {/* Player Side */}
        <div className="flex justify-start mb-4">
          <div className="bg-gradient-to-r from-blue-900/80 to-blue-800/80 border-2 border-blue-500 rounded-xl p-4 w-64">
            <div className="flex items-center gap-3">
              <div className="text-4xl">🧑‍💻</div>
              <div className="flex-1">
                <div className="font-pixel text-xs text-blue-300">DU</div>
                <div className="font-pixel text-[10px] text-gray-400">Change Agent</div>
                <div className="h-3 bg-gray-700 rounded-full overflow-hidden mt-1">
                  <motion.div
                    className="h-full bg-gradient-to-r from-green-500 to-green-400"
                    animate={{ width: `${playerHP}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Counter Options */}
        <div className="bg-black/50 border-2 border-gray-600 rounded-xl p-4">
          <div className="font-pixel text-xs text-gray-400 mb-3">Wähle deinen Konter:</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {counters.map((counter) => (
              <motion.button
                key={counter.id}
                onClick={() => handleCounter(counter)}
                disabled={!canPlay}
                className={`p-3 rounded-lg text-left transition-all ${
                  canPlay
                    ? "bg-gradient-to-b from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 cursor-pointer"
                    : "bg-gray-700 cursor-not-allowed opacity-50"
                }`}
                whileHover={canPlay ? { scale: 1.02 } : {}}
                whileTap={canPlay ? { scale: 0.98 } : {}}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{counter.icon}</span>
                  <div>
                    <div className="font-bold text-white text-xs">{counter.name}</div>
                    <div className="text-green-400 text-[10px]">{counter.effect}</div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
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

// Level 3: Beschäftigten-Bedarfsabfrage
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
    show: false, success: false, title: "", text: ""
  });
  const [answered, setAnswered] = useState(false);

  const question = SURVEY_RESULTS[currentQuestion];
  
  // Randomize options
  const options = useMemo(() => 
    question ? shuffleArray([...question.options]) : [], 
    [currentQuestion]
  );

  const handleOptionClick = (option: { correct: boolean }) => {
    if (answered) return;
    playClickSound();
    setAnswered(true);

    if (option.correct) {
      playCorrectSound();
      setFeedback({
        show: true,
        success: true,
        title: "Richtig interpretiert!",
        text: question.feedback.correct
      });
    } else {
      playWrongSound();
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
    
    if (currentQuestion + 1 >= SURVEY_RESULTS.length) {
      playLevelUpSound();
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
      <h2 className="font-pixel text-xl text-primary mb-2 neon-text-pink">Level 3: Die Stimme der Basis</h2>
      <p className="text-gray-400 mb-6 text-center text-sm">Analysiere die Ergebnisse der Beschäftigten-Bedarfsabfrage</p>

      <div className="bg-gradient-to-b from-[#3d3d5c] to-[#2d2d44] border-3 border-gray-600 rounded-xl p-6 w-full max-w-2xl">
        {/* Survey Result Display */}
        <div className="bg-white text-gray-800 p-5 rounded-lg mb-5">
          <div className="text-center mb-4">
            <div className="text-5xl mb-2">📊</div>
            <div className="font-bold text-primary text-lg">Umfrageergebnis</div>
          </div>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
            <p className="text-lg font-bold text-blue-800">{question.stat}</p>
          </div>
          <p className="mt-4 text-center font-medium">{question.question}</p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 gap-3">
          {options.map((option, idx) => (
            <motion.div
              key={idx}
              onClick={() => handleOptionClick(option)}
              className={`bg-white p-4 rounded-lg cursor-pointer transition-all border-3 ${
                answered
                  ? option.correct
                    ? "border-green-500 bg-green-50"
                    : "border-red-500 bg-red-50"
                  : "border-gray-300 hover:border-primary hover:shadow-lg"
              }`}
              whileHover={{ scale: answered ? 1 : 1.02 }}
            >
              <p className="text-center text-sm font-medium text-gray-800">{option.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-5 font-pixel text-sm text-accent">
        Frage: <span className="text-white">{currentQuestion + 1}</span>/3
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

// Level 4: Narrative Puzzle
function Level4({
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
    show: false, success: false, title: "", text: ""
  });

  // Randomize story blocks
  const correctBlocks = useMemo(() => shuffleArray(STORY_BLOCKS.filter(b => b.correct)), []);
  const wrongBlocks = useMemo(() => shuffleArray(STORY_BLOCKS.filter(b => !b.correct)), []);

  const handleBlockClick = (blockId: string) => {
    if (usedBlocks.has(blockId)) return;
    playClickSound();
    setSelectedBlock(blockId);
  };

  const handleSlotClick = (slotId: number) => {
    if (!selectedBlock || placedStories.has(slotId)) return;
    playClickSound();

    const slot = TIMELINE_SLOTS.find(s => s.id === slotId);
    const block = STORY_BLOCKS.find(b => b.id === selectedBlock);
    
    if (!slot || !block) return;

    if (block.story === slot.correct) {
      playCorrectSound();
      setPlacedStories(prev => new Map(Array.from(prev.entries()).concat([[slotId, selectedBlock]])));
      setUsedBlocks(prev => new Set(Array.from(prev).concat(selectedBlock)));
      setFeedback({
        show: true,
        success: true,
        title: "Perfekt platziert!",
        text: "Die Heldenreise (Campbell, 1949) ist ein universelles Narrativ-Muster. Emotionale Geschichten aktivieren das 'Narrative Transportation' – der Zuhörer wird Teil der Geschichte und ist offener für die Botschaft."
      });
      onStoryPlaced();
      
      if (storiesPlaced + 1 >= 5) {
        setTimeout(() => { playLevelUpSound(); onComplete(); }, 100);
      }
    } else {
      playWrongSound();
      const isWrongBlock = block.story.startsWith("wrong");
      setFeedback({
        show: true,
        success: false,
        title: isWrongBlock ? "Langweilig!" : "Falsche Reihenfolge!",
        text: isWrongBlock
          ? "Der CDO schläft fast ein. Technische Details und Zahlen gehören nicht an den Anfang einer Geschichte! Beginne mit dem Menschen, nicht mit der Technik."
          : "Die Heldenreise hat eine bestimmte Struktur: Gewohnte Welt → Ruf → Weigerung → Mentor → Belohnung. Überlege, was zuerst kommt."
      });
    }
    setSelectedBlock(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center p-8 pt-24 bg-[#141428]/98 overflow-y-auto"
    >
      <h2 className="font-pixel text-xl text-primary mb-2 neon-text-pink">Level 4: Der Überzeugungs-Plan</h2>
      <p className="text-gray-400 mb-4 text-center text-sm">Baue die perfekte Heldenreise für deine Präsentation</p>

      <div className="w-full max-w-4xl">
        {/* Timeline Slots */}
        <div className="flex gap-2 bg-[#1a1a2e] p-4 rounded-xl border-3 border-primary mb-4 flex-wrap justify-center">
          {TIMELINE_SLOTS.map((slot) => {
            const placedBlockId = placedStories.get(slot.id);
            const placedBlock = placedBlockId ? STORY_BLOCKS.find(b => b.id === placedBlockId) : null;
            
            return (
              <motion.div
                key={slot.id}
                onClick={() => handleSlotClick(slot.id)}
                className={`w-32 h-20 rounded-lg flex items-center justify-center text-center p-2 text-[10px] cursor-pointer transition-all ${
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
        <div className="flex gap-2 flex-wrap justify-center mb-3">
          {correctBlocks.map((block) => (
            <motion.div
              key={block.id}
              onClick={() => handleBlockClick(block.id)}
              className={`w-36 p-2 rounded-lg text-[10px] cursor-pointer transition-all ${
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
        <div className="flex gap-2 flex-wrap justify-center">
          {wrongBlocks.map((block) => (
            <motion.div
              key={block.id}
              onClick={() => handleBlockClick(block.id)}
              className={`w-36 p-2 rounded-lg text-[10px] cursor-pointer transition-all ${
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

      <div className="mt-4 font-pixel text-sm text-accent">
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

// Level 5: Data Intelligence
function Level5({
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
    show: false, success: false, title: "", text: ""
  });
  const [answered, setAnswered] = useState(false);

  const question = DATA_QUESTIONS[currentQuestion];
  
  // Randomize options
  const options = useMemo(() => 
    question ? shuffleArray([...question.options]) : [], 
    [currentQuestion]
  );

  const handleOptionClick = (option: { correct: boolean }) => {
    if (answered) return;
    playClickSound();
    setAnswered(true);

    if (option.correct) {
      playCorrectSound();
      setFeedback({
        show: true,
        success: true,
        title: "Data Clarity Bonus!",
        text: question.feedback.correct
      });
    } else {
      playWrongSound();
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
      playLevelUpSound();
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
      <h2 className="font-pixel text-xl text-primary mb-2 neon-text-pink">Level 5: Data Intelligence</h2>
      <p className="text-gray-400 mb-6 text-center text-sm">Wähle die überzeugendsten Datenvisualisierungen</p>

      <div className="bg-gradient-to-b from-[#3d3d5c] to-[#2d2d44] border-3 border-gray-600 rounded-xl p-6 w-full max-w-2xl">
        <div className="bg-white text-gray-800 p-5 rounded-lg mb-5">
          <p className="font-bold text-lg">
            <span className="text-primary">Frage {currentQuestion + 1}/3:</span> {question.question}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {options.map((option, idx) => (
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

// Level 6: Boss Battle
function Level6({
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
  const [battleLog, setBattleLog] = useState<string>("Das finale Meeting beginnt...");
  const [hand, setHand] = useState<typeof PLAYER_CARDS>([]);
  const [canPlay, setCanPlay] = useState(false);
  const roundRef = useRef(0);

  const { level6 } = gameState;

  useEffect(() => {
    drawCards();
    setTimeout(() => enemyTurn(), 1000);
  }, []);

  const drawCards = () => {
    const shuffled = shuffleArray([...PLAYER_CARDS]);
    setHand(shuffled.slice(0, 4));
  };

  const enemyTurn = () => {
    const attack = ENEMY_ATTACKS[roundRef.current % ENEMY_ATTACKS.length];
    setCurrentAttack(attack);
    setBattleLog(`Herr D.S. Gvo spielt "${attack.name}" (-${attack.damage}% Überzeugung)`);
    setCanPlay(true);
  };

  const handleCardClick = (card: typeof PLAYER_CARDS[0]) => {
    if (!canPlay) return;
    playClickSound();
    setCanPlay(false);
    setCurrentAttack(null);

    if (card.power === 0) {
      playWrongSound();
      setBattleLog(`Du spielst "${card.name}" - Der CDO gähnt. Wirkungslos!`);
    } else {
      playCorrectSound();
      setBattleLog(`Du spielst "${card.name}": "${card.description}"`);
    }

    onPlayCard(card);
    roundRef.current++;

    setTimeout(() => {
      const newCdoMeter = card.power === 0 
        ? level6.cdoMeter - (currentAttack?.damage || 0)
        : Math.min(100, level6.cdoMeter - (currentAttack?.damage || 0) + card.power);
      
      if (newCdoMeter >= 100 || level6.enemyHP - card.power <= 0) {
        playVictorySound();
        onWin();
      } else if (newCdoMeter <= 0 || (card.power === 0 && level6.playerHP - 10 <= 0)) {
        playWrongSound();
        roundRef.current = 0;
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
      <h2 className="font-pixel text-xl text-primary mb-4 neon-text-pink">Level 6: Der Boss-Kampf</h2>

      <div className="w-full max-w-4xl grid grid-cols-3 gap-3 mb-4">
        {/* Player Panel */}
        <div className="bg-gradient-to-b from-[#2c3e50] to-[#1a252f] border-2 border-secondary rounded-xl p-3">
          <div className="text-center mb-2">
            <div className="text-3xl mb-1">👩‍💼</div>
            <div className="font-pixel text-[10px] text-secondary">SABINE</div>
          </div>
          <div className="text-[10px] text-gray-400 mb-1">Energie</div>
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-green-400"
              animate={{ width: `${level6.playerHP}%` }}
            />
          </div>
        </div>

        {/* CDO Panel */}
        <div className="bg-gradient-to-b from-[#2c3e50] to-[#1a252f] border-2 border-accent rounded-xl p-3">
          <div className="text-center mb-2">
            <div className="text-3xl mb-1">👔</div>
            <div className="font-pixel text-[10px] text-accent">CDO</div>
          </div>
          <div className="text-[10px] text-gray-400 mb-1">Überzeugung</div>
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden border border-accent">
            <motion.div
              className="h-full"
              style={{ background: "linear-gradient(90deg, #e74c3c, #f39c12, #27ae60)" }}
              animate={{ width: `${level6.cdoMeter}%` }}
            />
          </div>
        </div>

        {/* Enemy Panel */}
        <div className="bg-gradient-to-b from-[#2c3e50] to-[#1a252f] border-2 border-red-500 rounded-xl p-3">
          <div className="text-center mb-2">
            <div className="text-3xl mb-1">🛡️</div>
            <div className="font-pixel text-[10px] text-red-400">HERR D.S. GVO</div>
          </div>
          <div className="text-[10px] text-gray-400 mb-1">Widerstand</div>
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
            <motion.div
              className="h-full bg-gradient-to-r from-red-600 to-red-400"
              animate={{ width: `${level6.enemyHP}%` }}
            />
          </div>
        </div>
      </div>

      {/* Battle Area */}
      <div className="bg-white/95 text-gray-800 rounded-xl p-4 w-full max-w-4xl">
        <div className="bg-gray-100 rounded-lg p-3 mb-3 text-sm border-2 border-gray-300">
          {battleLog}
        </div>

        {currentAttack && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 border-2 border-red-500 rounded-lg p-3 mb-3"
          >
            <strong className="text-red-700">{currentAttack.name}:</strong>
            <br />
            <span className="text-red-600 text-sm">😤 "{currentAttack.text}"</span>
          </motion.div>
        )}

        {/* Card Hand */}
        <div className="flex flex-wrap gap-2 justify-center">
          {hand.map((card) => (
            <motion.div
              key={card.id}
              onClick={() => handleCardClick(card)}
              className={`bg-gradient-to-b from-white to-gray-100 border-3 border-gray-800 rounded-lg p-2 w-28 text-center cursor-pointer transition-all ${
                !canPlay ? "opacity-50 cursor-not-allowed" : "hover:border-primary hover:-translate-y-2 hover:shadow-xl"
              }`}
              whileHover={{ scale: canPlay ? 1.05 : 1 }}
            >
              <div className="text-2xl mb-1">{card.icon}</div>
              <div className="font-bold text-[10px] text-gray-800 mb-1">{card.name}</div>
              <div className="text-[10px] text-gray-600">{card.effect}</div>
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
        className="font-pixel text-2xl text-white mb-6"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        style={{ textShadow: "4px 4px 0 rgba(0,0,0,0.3)" }}
      >
        🎉 MISSION ERFOLGREICH! 🎉
      </motion.h1>

      <motion.div
        className="bg-white/95 text-gray-800 p-6 rounded-xl max-w-xl text-center"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <p className="text-base leading-relaxed mb-3">
          <strong>Der CDO ist überzeugt!</strong> Die Online-Funktion von BärGPT wird freigeschaltet.
        </p>
        <p className="text-base leading-relaxed mb-3">
          Sabine kann jetzt aktuelle Gesetze abfragen, Bürgeranträge schneller bearbeiten und muss keine unsicheren Workarounds mehr nutzen.
        </p>
        <p className="text-base leading-relaxed mb-4">
          <strong>Die Berliner Verwaltung macht einen großen Schritt in die digitale Zukunft!</strong>
        </p>
        
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-left text-sm">
          <h4 className="font-bold text-blue-800 mb-2">📚 Was du gelernt hast:</h4>
          <ul className="space-y-1 text-blue-700">
            <li>• <strong>Kognitive Verzerrungen</strong> erkennen (Kahneman & Tversky)</li>
            <li>• <strong>Stakeholder-Management</strong> mit verschiedenen Gruppen</li>
            <li>• <strong>Narrative Transportation</strong> für überzeugende Geschichten</li>
            <li>• <strong>Pre-Suasion</strong> zur Reframung von Risiken (Cialdini)</li>
            <li>• <strong>Datenvisualisierung</strong> für Entscheider</li>
          </ul>
        </div>
      </motion.div>

      <motion.button
        onClick={() => { playClickSound(); onRestart(); }}
        className="mt-6 font-pixel text-sm bg-gradient-to-b from-yellow-400 to-orange-600 text-white px-10 py-5 rounded-lg shadow-lg hover:scale-105 transition-transform"
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
  const [showFaxModal, setShowFaxModal] = useState(false);
  const [gameState, setGameState] = useState<GameState>({
    currentLevel: 1,
    approval: 50,
    energy: 100,
    coffeeFound: false,
    faxTriggered: false,
    level1: { biasesFound: 0, completed: false },
    level2: { round: 0, personalratHP: 100, completed: false },
    level3: { currentQuestion: 0, correctChoices: 0, completed: false },
    level4: { storiesPlaced: 0, completed: false },
    level5: { currentQuestion: 0, correctChoices: 0, completed: false },
    level6: { playerHP: 100, enemyHP: 100, cdoMeter: 50, round: 0, completed: false }
  });

  const startGame = useCallback(() => {
    setScreen("level1");
  }, []);

  const handleCoffeeFind = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      coffeeFound: true,
      energy: Math.min(100, prev.energy + 10),
      approval: Math.min(100, prev.approval + 5)
    }));
  }, []);

  const handleFaxTrigger = useCallback(() => {
    playFaxSound();
    setShowFaxModal(true);
    setGameState(prev => ({ ...prev, faxTriggered: true }));
  }, []);

  const handleBiasFound = useCallback(() => {
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

  const handlePersonalratCounter = useCallback((power: number) => {
    setGameState(prev => ({
      ...prev,
      approval: Math.min(100, prev.approval + Math.floor(power / 2)),
      level2: { 
        ...prev.level2, 
        round: prev.level2.round + 1,
        personalratHP: Math.max(0, prev.level2.personalratHP - power)
      }
    }));
  }, []);

  const handleLevel2Complete = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      level2: { ...prev.level2, completed: true }
    }));
    setTimeout(() => setScreen("level3"), 500);
  }, []);

  const handleSurveyAnswer = useCallback((correct: boolean) => {
    setGameState(prev => ({
      ...prev,
      approval: correct ? Math.min(100, prev.approval + 8) : Math.max(0, prev.approval - 3),
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
      level3: { ...prev.level3, completed: true }
    }));
    setTimeout(() => setScreen("level4"), 500);
  }, []);

  const handleStoryPlaced = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      approval: Math.min(100, prev.approval + 5),
      level4: { ...prev.level4, storiesPlaced: prev.level4.storiesPlaced + 1 }
    }));
    return true;
  }, []);

  const handleLevel4Complete = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      level4: { ...prev.level4, completed: true }
    }));
    setTimeout(() => setScreen("level5"), 500);
  }, []);

  const handleDataAnswer = useCallback((correct: boolean) => {
    setGameState(prev => ({
      ...prev,
      approval: correct ? Math.min(100, prev.approval + 10) : Math.max(0, prev.approval - 5),
      level5: {
        ...prev.level5,
        currentQuestion: prev.level5.currentQuestion + 1,
        correctChoices: correct ? prev.level5.correctChoices + 1 : prev.level5.correctChoices
      }
    }));
  }, []);

  const handleLevel5Complete = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      level5: { ...prev.level5, completed: true },
      level6: { ...prev.level6, cdoMeter: prev.approval }
    }));
    setTimeout(() => setScreen("level6"), 500);
  }, []);

  const handlePlayCard = useCallback((card: typeof PLAYER_CARDS[0]) => {
    setGameState(prev => {
      const newState = { ...prev };
      if (card.power === 0) {
        newState.level6.playerHP = Math.max(0, prev.level6.playerHP - 10);
      } else {
        newState.level6.cdoMeter = Math.min(100, prev.level6.cdoMeter + card.power);
        newState.level6.enemyHP = Math.max(0, prev.level6.enemyHP - card.power);
      }
      newState.level6.round = prev.level6.round + 1;
      return newState;
    });
  }, []);

  const handleWin = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      level6: { ...prev.level6, completed: true },
      approval: prev.level6.cdoMeter
    }));
    setScreen("win");
  }, []);

  const handleLevel6Reset = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      level6: { playerHP: 100, enemyHP: 100, cdoMeter: 50, round: 0, completed: false }
    }));
  }, []);

  const restartGame = useCallback(() => {
    setGameState({
      currentLevel: 1,
      approval: 50,
      energy: 100,
      coffeeFound: false,
      faxTriggered: false,
      level1: { biasesFound: 0, completed: false },
      level2: { round: 0, personalratHP: 100, completed: false },
      level3: { currentQuestion: 0, correctChoices: 0, completed: false },
      level4: { storiesPlaced: 0, completed: false },
      level5: { currentQuestion: 0, correctChoices: 0, completed: false },
      level6: { playerHP: 100, enemyHP: 100, cdoMeter: 50, round: 0, completed: false }
    });
    setScreen("start");
  }, []);

  const currentLevel = screen === "level1" ? 1 : screen === "level2" ? 2 : screen === "level3" ? 3 : screen === "level4" ? 4 : screen === "level5" ? 5 : 6;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
      <div className="relative w-full max-w-5xl h-[700px] max-h-[95vh] arcade-frame scanlines overflow-hidden">
        {screen !== "start" && screen !== "win" && (
          <HUD
            approval={screen === "level6" ? gameState.level6.cdoMeter : gameState.approval}
            level={currentLevel}
            energy={gameState.energy}
            coffeeFound={gameState.coffeeFound}
          />
        )}

        <FaxModal isOpen={showFaxModal} onClose={() => setShowFaxModal(false)} />

        <AnimatePresence mode="wait">
          {screen === "start" && (
            <StartScreen 
              key="start" 
              onStart={startGame} 
              onFaxTrigger={handleFaxTrigger}
            />
          )}
          
          {screen === "level1" && (
            <Level1
              key="level1"
              biasesFound={gameState.level1.biasesFound}
              onBiasFound={handleBiasFound}
              onComplete={handleLevel1Complete}
              onCoffeeFind={handleCoffeeFind}
            />
          )}
          
          {screen === "level2" && (
            <Level2
              key="level2"
              round={gameState.level2.round}
              personalratHP={gameState.level2.personalratHP}
              onCounter={handlePersonalratCounter}
              onComplete={handleLevel2Complete}
            />
          )}
          
          {screen === "level3" && (
            <Level3
              key="level3"
              currentQuestion={gameState.level3.currentQuestion}
              correctChoices={gameState.level3.correctChoices}
              onAnswer={handleSurveyAnswer}
              onComplete={handleLevel3Complete}
            />
          )}
          
          {screen === "level4" && (
            <Level4
              key="level4"
              storiesPlaced={gameState.level4.storiesPlaced}
              onStoryPlaced={handleStoryPlaced}
              onComplete={handleLevel4Complete}
            />
          )}
          
          {screen === "level5" && (
            <Level5
              key="level5"
              currentQuestion={gameState.level5.currentQuestion}
              correctChoices={gameState.level5.correctChoices}
              onAnswer={handleDataAnswer}
              onComplete={handleLevel5Complete}
            />
          )}
          
          {screen === "level6" && (
            <Level6
              key="level6"
              gameState={gameState}
              onPlayCard={handlePlayCard}
              onWin={handleWin}
              onReset={handleLevel6Reset}
            />
          )}
          
          {screen === "win" && <WinScreen key="win" onRestart={restartGame} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
