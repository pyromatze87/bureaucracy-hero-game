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
const playAttackSound = () => {
  [1000, 800, 600, 400].forEach((freq, i) => {
    setTimeout(() => createSound(freq, 0.05, 'square')(), i * 30);
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
    explanation: "Die Verlust-Aversion ist ein zentrales Konzept der Prospect Theory von Kahneman & Tversky (1979). Menschen empfinden Verluste etwa 2-2,5x stärker als gleichwertige Gewinne. Der Fokus auf 'Ruf unwiederbringlich zerstören' aktiviert diese kognitive Verzerrung – die Angst vor dem Verlust überwiegt die potenziellen Vorteile der Innovation. In Organisationen führt dies oft zu übermäßiger Risikovermeidung. Praktische Anwendung: Reframe den Diskurs von 'Was können wir verlieren?' zu 'Was verlieren wir, wenn wir NICHT handeln?'",
    source: "Kahneman, D. & Tversky, A. (1979). Prospect Theory: An Analysis of Decision under Risk. Econometrica, 47(2), 263-291."
  },
  "zero-risk": {
    name: "Zero-Risk Bias",
    explanation: "Der Zero-Risk Bias beschreibt die irrationale Präferenz für die vollständige Eliminierung eines Risikos, selbst wenn eine Reduktion eines größeren Risikos objektiv sinnvoller wäre. Die Forderung nach '100% Sicherheit' ist in komplexen IT-Systemen unrealistisch – selbst Offline-Systeme haben Risiken (z.B. veraltete Daten, Schatten-IT, menschliche Fehler). Baron (2000) zeigt: Menschen zahlen überproportional viel für 'Zero Risk', auch wenn dies ineffizient ist. In der Verwaltung manifestiert sich dies in überzogenen Sicherheitsanforderungen, die Innovation blockieren.",
    source: "Baron, J. (2000). Thinking and Deciding (3rd ed.). Cambridge University Press."
  },
  "omission": {
    name: "Omission Bias",
    explanation: "Der Omission Bias ist die Tendenz, schädliche Handlungen als schlimmer zu bewerten als gleich schädliche Unterlassungen. 'Beim aktuellen System bleiben' erscheint sicherer, obwohl der Status Quo eigene Risiken birgt (veraltete Prozesse, Schatten-IT, Frustration der Beschäftigten). Spranca, Minsk & Baron (1991) zeigen: In der Verwaltung verstärkt sich dieser Bias durch Rechenschaftspflicht – für aktive Entscheidungen muss man sich rechtfertigen, für Nicht-Handeln seltener. Das führt zu systematischer Innovationsblockade.",
    source: "Spranca, M., Minsk, E., & Baron, J. (1991). Omission and Commission in Judgment and Choice. Journal of Experimental Social Psychology, 27(1), 76-105."
  }
};

// Personalrat-Level Daten
const PERSONALRAT_ATTACKS = [
  { 
    name: "Mitbestimmungs-Paragraf", 
    text: "§75 Abs. 3 Nr. 17 PersVG! KI-Systeme sind mitbestimmungspflichtig!", 
    damage: 15,
    bias: "authority-bias",
    explanation: "Der Authority Bias: Verweis auf Paragrafen wirkt einschüchternd, auch wenn die Rechtslage komplexer ist. Milgram (1963) zeigte: Menschen folgen Autoritäten oft unkritisch."
  },
  { 
    name: "Überlastungs-Klage", 
    text: "Die Kolleg*innen sind jetzt schon überlastet! Noch ein neues System?!", 
    damage: 20,
    bias: "status-quo",
    explanation: "Status-Quo Bias (Samuelson & Zeckhauser, 1988): Veränderung wird als zusätzliche Belastung wahrgenommen, nicht als Entlastung. Der Ist-Zustand wird überbewertet."
  },
  { 
    name: "Arbeitsplatz-Angst", 
    text: "Wollen Sie unsere Mitarbeiter*innen durch Maschinen ersetzen?!", 
    damage: 25,
    bias: "loss-aversion",
    explanation: "Verlust-Aversion: Die Angst vor Jobverlust ist emotional stärker als die Aussicht auf bessere Arbeitsbedingungen. Kahneman zeigt: Verluste wiegen 2x schwerer als Gewinne."
  },
  { 
    name: "Schulungs-Forderung", 
    text: "Wer bezahlt die Schulungen? Wer hat Zeit dafür?!", 
    damage: 15,
    bias: "present-bias",
    explanation: "Present Bias (O'Donoghue & Rabin, 1999): Kurzfristige Kosten (Schulung) werden überbewertet, langfristige Vorteile (Effizienz) systematisch unterschätzt."
  },
  { 
    name: "Betriebsvereinbarungs-Forderung", 
    text: "Ohne Betriebsvereinbarung läuft hier gar nichts! Das dauert mindestens 18 Monate!", 
    damage: 18,
    bias: "anchoring",
    explanation: "Anchoring Bias (Tversky & Kahneman, 1974): Die genannte Zeitspanne von 18 Monaten setzt einen Anker, der die Erwartungen prägt – auch wenn kürzere Zeiträume möglich wären."
  },
  { 
    name: "Datenschutz-Bedenken", 
    text: "Und was passiert mit den Daten unserer Beschäftigten? Wer garantiert den Schutz?!", 
    damage: 22,
    bias: "availability",
    explanation: "Availability Heuristic (Tversky & Kahneman, 1973): Datenschutzskandale sind medial präsent und werden daher als wahrscheinlicher eingeschätzt, als sie statistisch sind."
  },
  { 
    name: "Gewerkschafts-Drohung", 
    text: "Die Gewerkschaft wird das nicht einfach hinnehmen! Wir haben Kontakte!", 
    damage: 20,
    bias: "social-proof",
    explanation: "Social Proof (Cialdini, 1984): Der Verweis auf die Gewerkschaft als Autorität soll Druck ausüben. Menschen orientieren sich an dem, was andere (wichtige Gruppen) tun oder denken."
  },
  { 
    name: "Präzedenzfall-Warnung", 
    text: "Wenn wir hier nachgeben, kommt als nächstes die komplette Automatisierung!", 
    damage: 18,
    bias: "slippery-slope",
    explanation: "Slippery Slope Fallacy: Die Annahme, dass ein kleiner Schritt unweigerlich zu extremen Konsequenzen führt. Logisch nicht zwingend, aber emotional wirksam."
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
      correct: "Richtig! Die Beschäftigten artikulieren einen konkreten Pain Point, den BärGPT adressieren kann. Das ist ein starkes Argument für die Einführung – direkt aus der Basis!",
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
      correct: "Exzellent! Du nutzt das Pre-Suasion-Prinzip (Cialdini, 2016): Das Risiko besteht BEREITS. BärGPT ist nicht das Risiko, sondern die Lösung. Das reframt die gesamte Diskussion!",
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
      correct: "Sehr gut! Emotionen treiben Entscheidungen (Damasio's Somatic Marker Hypothesis, 1994). Geschichten über frustrierte Mitarbeiter*innen wirken stärker als abstrakte Effizienzgewinne.",
      wrong: "Zahlen allein überzeugen selten. Die emotionale Komponente (Frustration, Zeitdruck) macht das Problem greifbar und dringlich."
    }
  }
];

// Story Blocks für Level 4
const STORY_BLOCKS = [
  { id: "block1", story: "ordinary", text: "Sabine bearbeitet einen Bürgerantrag", correct: true },
  { id: "block2", story: "call", text: "BärGPT kennt das neue Gesetz nicht (offline!)", correct: true },
  { id: "block3", story: "refusal", text: "Sabine zögert – 'Das haben wir immer so gemacht'", correct: true },
  { id: "block4", story: "mentor", text: "Ein Kollege zeigt ihr die Online-Funktion", correct: true },
  { id: "block5", story: "reward", text: "Der Bürger erhält seine Antwort in 10 Minuten", correct: true },
  { id: "block6", story: "wrong1", text: "Technische Spezifikationen des Systems", correct: false },
  { id: "block7", story: "wrong2", text: "ROI-Berechnung in Excel", correct: false }
];

const TIMELINE_SLOTS = [
  { id: 1, label: "1. Gewohnte Welt", correct: "ordinary" },
  { id: 2, label: "2. Der Ruf", correct: "call" },
  { id: 3, label: "3. Weigerung", correct: "refusal" },
  { id: 4, label: "4. Mentor", correct: "mentor" },
  { id: 5, label: "5. Belohnung", correct: "reward" }
];

// Data Intelligence Fragen
const DATA_QUESTIONS = [
  {
    question: "Die CDO fragt nach dem ROI. Welche Visualisierung wählst du?",
    options: [
      { id: "roi", icon: "📈", label: "Zeitersparnis pro Vorgang: 47 Min → 12 Min", correct: true },
      { id: "tech", icon: "🔧", label: "Technische Architektur-Diagramm", correct: false }
    ],
    feedback: {
      correct: "Richtig! Konkrete Zahlen überzeugen. Zeit = Geld in der Verwaltung. Die Zeitersparnis von 35 Minuten pro Vorgang lässt sich direkt in eingesparte Personalkosten umrechnen.",
      wrong: "Technische Details langweilen Entscheider. Die CDO denkt in Business-Impact, nicht in Systemarchitektur. Zeige den ROI!"
    }
  },
  {
    question: "Wie präsentierst du die Sicherheitsmaßnahmen?",
    options: [
      { id: "compare", icon: "⚖️", label: "Vergleich: BärGPT-Filter vs. Schatten-IT Risiken", correct: true },
      { id: "list", icon: "📋", label: "Liste aller technischen Sicherheitsfeatures", correct: false }
    ],
    feedback: {
      correct: "Perfekt! Du nutzt das Kontrastprinzip (Cialdini, 2006): Im Vergleich zur unkontrollierten Schatten-IT erscheint BärGPT als die SICHERERE Option. Das reframt die Diskussion.",
      wrong: "Feature-Listen überzeugen nicht. Sie wirken defensiv. Zeige stattdessen den relativen Vorteil gegenüber dem Status Quo!"
    }
  },
  {
    question: "Die CDO fragt nach dem Risiko von Schatten-IT. Wie antwortest du?",
    options: [
      { id: "risk", icon: "⚠️", label: "Risiko-Matrix: Schatten-IT = Hohe Wahrscheinlichkeit + Hoher Schaden", correct: true },
      { id: "ignore", icon: "🤷", label: "Das Thema herunterspielen", correct: false }
    ],
    feedback: {
      correct: "Richtig! Du nutzt Pre-Suasion (Cialdini, 2016): Indem du das Risiko des NICHT-Handelns betonst, wird BärGPT zur Risiko-Reduktion, nicht zum Risiko. Der Stillstand IST das Risiko.",
      wrong: "Das Thema zu ignorieren ist gefährlich. Die CDO wird es selbst recherchieren – besser, du kontrollierst die Narrative!"
    }
  }
];

// Boss Battle Cards - Angepasst für längeren, spannenden Kampf
const PLAYER_CARDS = [
  { id: "evidence", name: "Evidenz-Karte", icon: "📊", effect: "+12", power: 12, description: "73% der Beschäftigten wünschen sich schnellere Recherche-Tools." },
  { id: "story", name: "Story-Karte", icon: "📖", effect: "+15", power: 15, description: "Sabine konnte dem Bürger in 10 statt 47 Minuten helfen." },
  { id: "risk", name: "Risiko-Reframe", icon: "⚠️", effect: "+12", power: 12, description: "45% nutzen bereits Schatten-IT – das ist das ECHTE Risiko!" },
  { id: "pilot", name: "Pilot-Angebot", icon: "🧪", effect: "+8", power: 8, description: "Starten wir mit 3 Ämtern – messbar, kontrolliert, reversibel." },
  { id: "social", name: "Social Proof", icon: "👥", effect: "+12", power: 12, description: "Hamburg und München haben es bereits erfolgreich eingeführt." },
  { id: "authority", name: "Experten-Zitat", icon: "🎓", effect: "+8", power: 8, description: "Prof. Dr. Müller (FU Berlin): 'Ein Meilenstein für die Verwaltung.'" },
  { id: "emotion", name: "Emotions-Appell", icon: "❤️", effect: "+10", power: 10, description: "Denken Sie an die frustrierten Mitarbeiter, die täglich kämpfen." },
  { id: "comparison", name: "Vergleichs-Karte", icon: "⚖️", effect: "+10", power: 10, description: "Im Vergleich zu Schatten-IT ist BärGPT die sichere Wahl." },
  { id: "jargon", name: "Bürokratie-Jargon", icon: "📜", effect: "0", power: 0, description: "Gemäß §3 Abs. 2 der Verwaltungsvorschrift..." },
  { id: "fear", name: "Angst-Appell", icon: "😱", effect: "-5", power: -5, description: "Wenn wir das nicht machen, werden wir abgehängt!" }
];

// Erweiterte Gegner-Angriffe - MEHR RUNDEN für spannenden Boss-Kampf
const ENEMY_ATTACKS = [
  { name: "DSGVO-Keule", text: "Artikel 22 DSGVO verbietet automatisierte Entscheidungen!", damage: 10 },
  { name: "Datenleck-Panik", text: "Ein einziges Datenleck und wir sind in der Presse!", damage: 12 },
  { name: "Präzedenzfall-Angst", text: "Was, wenn andere Behörden das auch wollen?", damage: 8 },
  { name: "Budget-Blockade", text: "Wer bezahlt die Server? Die Wartung? Den Support?", damage: 10 },
  { name: "Haftungs-Frage", text: "Wer haftet, wenn BärGPT einen Fehler macht?", damage: 12 },
  { name: "Kontroll-Verlust", text: "Wir verlieren die Kontrolle über unsere Daten!", damage: 15 },
  { name: "Vendor-Lock-In", text: "Wir machen uns abhängig von einem Anbieter!", damage: 8 },
  { name: "Komplexitäts-Argument", text: "Das ist viel zu komplex für unsere IT-Abteilung!", damage: 10 },
  { name: "Personalrats-Veto", text: "Der Personalrat wird das niemals durchwinken!", damage: 12 },
  { name: "Schulungs-Tsunami", text: "Wer schult 5000 Mitarbeiter? Das dauert Jahre!", damage: 10 },
  { name: "Altsystem-Argument", text: "Unsere Systeme sind dafür nicht ausgelegt!", damage: 8 },
  { name: "Bürger-Bedenken", text: "Die Bürger wollen keine KI-generierten Bescheide!", damage: 12 }
];

// CDO Counter-Attacks (für erweiterten Boss-Fight)
const CDO_QUESTIONS = [
  { question: "Wie stellen Sie die Qualität der KI-Antworten sicher?", damage: 10 },
  { question: "Was passiert bei einem Systemausfall?", damage: 8 },
  { question: "Wie schulen wir 5000 Mitarbeiter?", damage: 12 }
];

// ==================== TYPES ====================
type GameScreen = "start" | "level1" | "level1complete" | "level2" | "level3" | "level4" | "level5" | "level6" | "win";

interface GameState {
  currentLevel: number;
  approval: number;
  energy: number;
  coffeeFound: boolean;
  faxTriggered: boolean;
  level1: { biasesFound: number; completed: boolean };
  level2: { round: number; personalratHP: number; playerHP: number; completed: boolean };
  level3: { currentQuestion: number; correctChoices: number; completed: boolean };
  level4: { storiesPlaced: number; completed: boolean };
  level5: { currentQuestion: number; correctChoices: number; completed: boolean };
  level6: { playerHP: number; enemyHP: number; cdoMeter: number; round: number; completed: boolean };
}

// ==================== COMPONENTS ====================

// Easter Egg: Versteckter Kaffee
function CoffeeEasterEgg({ onFind }: { onFind: () => void }) {
  const [found, setFound] = useState(false);

  const handleClick = () => {
    if (!found) {
      playCoffeeSound();
      setFound(true);
      onFind();
    }
  };

  if (found) return null;

  return (
    <motion.div
      className="absolute bottom-4 right-4 cursor-pointer opacity-30 hover:opacity-100 transition-opacity z-10"
      onClick={handleClick}
      whileHover={{ scale: 1.2 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.3 }}
      transition={{ delay: 2 }}
      title="☕ Versteckter Kaffee!"
    >
      <span className="text-2xl">☕</span>
    </motion.div>
  );
}

// Easter Egg: Fax Modal - FIXED: Lesbare Buttons
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
        <p className="text-gray-600 mb-4">Möchten Sie Ihre Präsentation per Fax an die CDO senden?</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => { playFaxSound(); onClose(); }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
          >
            📞 Fax senden (Dauer: 47 Min)
          </button>
          <button
            onClick={() => { playFaxSound(); onClose(); }}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium"
          >
            🐦 Per Brieftaube
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 text-sm font-medium"
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

// HUD Component - FIXED: CDO ist weiblich, Balken startet bei 30%
function HUD({ approval, level, energy, coffeeFound }: { approval: number; level: number; energy: number; coffeeFound: boolean }) {
  return (
    <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-50 pointer-events-none">
      <div className="bg-black/80 border-2 border-primary rounded-lg p-3 pointer-events-auto neon-glow-pink">
        <div className="font-pixel text-[10px] text-primary mb-2 uppercase tracking-wider">
          Zustimmung der CDO
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
      </div>
      {coffeeFound && (
        <div className="absolute top-20 left-4 bg-black/80 border border-green-500 rounded px-2 py-1 text-[10px] text-green-400 z-50">
          ☕ Kaffee-Boost aktiv!
        </div>
      )}
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
  onClose,
  showContinueButton = true
}: {
  isOpen: boolean;
  success: boolean;
  title: string;
  text: string;
  source?: string;
  onClose: () => void;
  showContinueButton?: boolean;
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
            {showContinueButton && (
              <button
                onClick={onClose}
                className="font-pixel text-xs bg-gradient-to-b from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-lg shadow-lg hover:scale-105 transition-transform"
              >
                WEITER
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Level Complete Modal - NEU
function LevelCompleteModal({
  isOpen,
  levelNumber,
  onContinue
}: {
  isOpen: boolean;
  levelNumber: number;
  onContinue: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center z-[1000] bg-black/70"
        >
          <motion.div
            className="bg-gradient-to-b from-green-500 to-green-700 text-white p-8 rounded-xl max-w-md text-center border-4 border-green-300 shadow-2xl"
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 15 }}
          >
            <motion.div 
              className="text-6xl mb-4"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              🎉
            </motion.div>
            <h3 className="font-pixel text-xl mb-4">
              Level {levelNumber} abgeschlossen!
            </h3>
            <p className="text-sm mb-6 opacity-90">
              Sehr gut! Du hast alle Aufgaben in diesem Level gemeistert.
            </p>
            <motion.button
              onClick={onContinue}
              className="font-pixel text-sm bg-white text-green-700 px-8 py-4 rounded-lg shadow-lg hover:bg-green-50 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              WEITER ZUM NÄCHSTEN LEVEL →
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Blitz-Animation Component
function LightningEffect({ show }: { show: boolean }) {
  if (!show) return null;
  
  return (
    <motion.div
      className="absolute inset-0 z-[500] pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0.5, 1, 0] }}
      transition={{ duration: 0.3 }}
    >
      <div className="absolute inset-0 bg-yellow-300/50" />
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <motion.path
          d="M50 0 L45 40 L55 40 L40 100 L55 55 L45 55 Z"
          fill="#FFD700"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 1] }}
          transition={{ duration: 0.3 }}
        />
      </svg>
    </motion.div>
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
          Deine Aufgabe: Überzeuge die <strong>CDO</strong>, die <strong>Online-Funktion</strong> freizuschalten.
        </p>
        <p className="mb-4 text-sm leading-relaxed">
          Aber Vorsicht: Die Datenschutzbeauftragte, der Personalrat und skeptische Beschäftigte stehen dir im Weg.
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

// Level 1: Bias Scanner - FIXED: Manueller Level-Wechsel
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
  const [showLevelComplete, setShowLevelComplete] = useState(false);
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

  const handleFeedbackClose = () => {
    setFeedback({ ...feedback, show: false });
    // Check if all biases found AFTER closing feedback - use foundBiases.size for accurate count
    if (foundBiases.size >= 3 && !showLevelComplete) {
      playLevelUpSound();
      setShowLevelComplete(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-start p-8 pt-32 pb-16 bg-[#141428]/98 overflow-y-auto"
    >
      <CoffeeEasterEgg onFind={onCoffeeFind} />
      
      <h2 className="font-pixel text-xl text-primary mb-2 mt-8 neon-text-pink">Level 1: Die Diagnose</h2>
      <p className="text-gray-400 mb-6 text-center text-sm max-w-lg">Erkenne die psychologischen Barrieren in der E-Mail der Datenschutzbeauftragten</p>

      <div className="bg-gradient-to-b from-[#3d3d5c] to-[#2d2d44] border-3 border-gray-600 rounded-xl p-6 w-full max-w-3xl">
        <div className="bg-white text-gray-800 p-5 rounded-lg mb-5 border-2 border-gray-300">
          <div className="border-b-2 border-gray-200 pb-3 mb-4 text-sm text-gray-600">
            <div className="font-bold text-primary">Von: Frau D. S. Gvo (Datenschutzbeauftragte)</div>
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

      <div className="mt-5 mb-8 font-pixel text-sm text-accent">
        Erkannt: <span className="text-white">{biasesFound}</span>/3
      </div>

      <FeedbackModal
        isOpen={feedback.show}
        success={feedback.success}
        title={feedback.title}
        text={feedback.text}
        source={feedback.source}
        onClose={handleFeedbackClose}
      />

      <LevelCompleteModal
        isOpen={showLevelComplete}
        levelNumber={1}
        onContinue={onComplete}
      />
    </motion.div>
  );
}

// Level 2: Personalrat Pokémon-Style - FIXED: HP-Balken Overflow + Charakterbilder + Blitz
function Level2({
  round,
  personalratHP,
  playerHP,
  onCounter,
  onComplete
}: {
  round: number;
  personalratHP: number;
  playerHP: number;
  onCounter: (power: number, damage: number) => void;
  onComplete: () => void;
}) {
  const [currentAttack, setCurrentAttack] = useState<typeof PERSONALRAT_ATTACKS[0] | null>(null);
  const [battleLog, setBattleLog] = useState<string>("Das Telefon klingelt...");
  const [canPlay, setCanPlay] = useState(false);
  const [showLightning, setShowLightning] = useState(false);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [feedback, setFeedback] = useState<{ show: boolean; success: boolean; title: string; text: string }>({
    show: false, success: false, title: "", text: ""
  });
  const usedAttacksRef = useRef<Set<number>>(new Set());

  // Randomize counters
  const counters = useMemo(() => shuffleArray([...PERSONALRAT_COUNTERS]), [round]);

  useEffect(() => {
    setTimeout(() => {
      // Wähle eine Attacke, die noch nicht verwendet wurde
      let availableIndices = PERSONALRAT_ATTACKS.map((_, i) => i).filter(i => !usedAttacksRef.current.has(i));
      
      // Wenn alle Attacken verwendet wurden, setze zurück
      if (availableIndices.length === 0) {
        usedAttacksRef.current = new Set();
        availableIndices = PERSONALRAT_ATTACKS.map((_, i) => i);
      }
      
      // Wähle zufällig eine verfügbare Attacke
      const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      const attack = PERSONALRAT_ATTACKS[randomIndex];
      
      usedAttacksRef.current.add(randomIndex);
      setCurrentAttack(attack);
      setBattleLog(`Frau Müller setzt "${attack.name}" ein!`);
      setCanPlay(true);
    }, 1500);
  }, [round]);

  const handleCounter = (counter: typeof PERSONALRAT_COUNTERS[0]) => {
    if (!canPlay || !currentAttack) return;
    playClickSound();
    setCanPlay(false);

    // Show lightning animation for attacks
    if (counter.power > 0) {
      playAttackSound();
      setShowLightning(true);
      setTimeout(() => setShowLightning(false), 300);
    }

    if (counter.power === 0) {
      playWrongSound();
      setBattleLog(`Du verwendest "${counter.name}" - Frau Müller verdreht die Augen. Wirkungslos!`);
      setFeedback({
        show: true,
        success: false,
        title: "Fehlschlag!",
        text: "Verwaltungsjargon überzeugt niemanden. Sprich die Sprache deines Gegenübers!"
      });
      onCounter(0, currentAttack.damage);
    } else {
      playCorrectSound();
      setBattleLog(`"${counter.description}" - Frau Müller nickt nachdenklich.`);
      onCounter(counter.power, Math.floor(currentAttack.damage / 2));
      
      if (personalratHP - counter.power <= 0) {
        setFeedback({
          show: true,
          success: true,
          title: "Überzeugend!",
          text: currentAttack.explanation
        });
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
    
    if (personalratHP <= 0) {
      playLevelUpSound();
      setShowLevelComplete(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center p-4 pt-20 bg-[#141428]/98 overflow-hidden"
    >
      <LightningEffect show={showLightning} />
      
      <h2 className="font-pixel text-lg text-primary mb-2 neon-text-pink">Level 2: Der Anruf</h2>
      <p className="text-gray-400 mb-4 text-center text-xs">Überzeuge die Vorsitzende des Hauptpersonalrats</p>

      {/* Battle Arena - FIXED: Contained HP bars */}
      <div className="w-full max-w-4xl grid grid-cols-2 gap-4 mb-4">
        {/* Enemy Panel - Frau Müller */}
        <div className="bg-gradient-to-b from-red-900/80 to-red-950/80 border-2 border-red-500 rounded-xl p-3 flex items-center gap-3">
          <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-red-400 flex-shrink-0">
            <img 
              src="/images/frau-mueller.png" 
              alt="Frau Müller"
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.src = ''; e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-pixel text-[10px] text-red-300 mb-1 truncate">FRAU MÜLLER</div>
            <div className="text-[8px] text-red-400 mb-2">Personalratsvorsitzende</div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden border border-red-600">
              <motion.div
                className="h-full bg-gradient-to-r from-red-600 to-red-400"
                animate={{ width: `${Math.max(0, personalratHP)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="text-[8px] text-red-300 mt-1">{personalratHP}/100 HP</div>
          </div>
        </div>

        {/* Player Panel */}
        <div className="bg-gradient-to-b from-blue-900/80 to-blue-950/80 border-2 border-blue-500 rounded-xl p-3 flex items-center gap-3">
          <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-blue-400 flex-shrink-0">
            <img 
              src="/images/player-character.png" 
              alt="Du"
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.src = ''; e.currentTarget.style.display = 'none'; }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-pixel text-[10px] text-blue-300 mb-1">DU</div>
            <div className="text-[8px] text-blue-400 mb-2">Change Agent</div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden border border-blue-600">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-green-400"
                animate={{ width: `${Math.max(0, playerHP)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="text-[8px] text-green-300 mt-1">{playerHP}/100 HP</div>
          </div>
        </div>
      </div>

      {/* Battle Log */}
      {currentAttack && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-100 border-2 border-red-500 rounded-lg p-3 mb-3 w-full max-w-4xl"
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">📞</span>
            <div>
              <strong className="text-red-700">{currentAttack.name}</strong>
              <p className="text-red-600 text-sm">"{currentAttack.text}"</p>
            </div>
          </div>
          <p className="text-gray-600 text-xs mt-2 italic">{battleLog}</p>
        </motion.div>
      )}

      {/* Counter Options */}
      <div className="bg-[#1a1a2e] border-2 border-gray-600 rounded-xl p-4 w-full max-w-4xl">
        <p className="font-pixel text-xs text-accent mb-3">Wähle deinen Konter:</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {counters.map((counter) => (
            <motion.button
              key={counter.id}
              onClick={() => handleCounter(counter)}
              disabled={!canPlay}
              className={`p-3 rounded-lg text-left transition-all ${
                !canPlay
                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-b from-blue-600 to-blue-800 text-white hover:from-blue-500 hover:to-blue-700 cursor-pointer"
              }`}
              whileHover={{ scale: canPlay ? 1.02 : 1 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{counter.icon}</span>
                <span className="font-bold text-xs">{counter.name}</span>
              </div>
              <div className={`text-[10px] ${counter.power > 0 ? "text-green-300" : "text-gray-400"}`}>
                {counter.effect}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <FeedbackModal
        isOpen={feedback.show}
        success={feedback.success}
        title={feedback.title}
        text={feedback.text}
        onClose={handleFeedbackClose}
      />

      <LevelCompleteModal
        isOpen={showLevelComplete}
        levelNumber={2}
        onContinue={onComplete}
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
  const [showLevelComplete, setShowLevelComplete] = useState(false);

  const survey = SURVEY_RESULTS[currentQuestion];
  
  // Randomize options
  const options = useMemo(() => 
    survey ? shuffleArray([...survey.options]) : [], 
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
        title: "Richtig analysiert!",
        text: survey.feedback.correct
      });
    } else {
      playWrongSound();
      setFeedback({
        show: true,
        success: false,
        title: "Nicht ganz...",
        text: survey.feedback.wrong
      });
    }
    onAnswer(option.correct);
  };

  const handleFeedbackClose = () => {
    setFeedback({ ...feedback, show: false });
    setAnswered(false);
    
    // currentQuestion wurde bereits durch onAnswer erhöht, daher prüfen wir ob wir bei der letzten Frage sind
    // currentQuestion ist 0-basiert, SURVEY_RESULTS.length ist 3
    // Nach Frage 1 (Index 0): currentQuestion wird 1, noch 2 Fragen übrig
    // Nach Frage 2 (Index 1): currentQuestion wird 2, noch 1 Frage übrig  
    // Nach Frage 3 (Index 2): currentQuestion wird 3, keine Fragen mehr -> Level complete
    if (currentQuestion >= SURVEY_RESULTS.length) {
      playLevelUpSound();
      setShowLevelComplete(true);
    }
  };

  // Wenn alle Fragen beantwortet wurden, zeige das LevelCompleteModal direkt
  if (!survey) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 flex flex-col items-center justify-center p-8 pt-24 bg-[#141428]/98"
      >
        <LevelCompleteModal
          isOpen={true}
          levelNumber={3}
          onContinue={onComplete}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center p-8 pt-24 bg-[#141428]/98"
    >
      <h2 className="font-pixel text-xl text-primary mb-2 neon-text-pink">Level 3: Die Stimme der Basis</h2>
      <p className="text-gray-400 mb-6 text-center text-sm">Analysiere die Bedarfsabfrage der Beschäftigten</p>

      <div className="bg-gradient-to-b from-[#3d3d5c] to-[#2d2d44] border-3 border-gray-600 rounded-xl p-6 w-full max-w-2xl">
        <div className="bg-white text-gray-800 p-5 rounded-lg mb-5">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4">
            <p className="font-bold text-blue-800 text-lg">📊 {survey.stat}</p>
          </div>
          <p className="font-medium">{survey.question}</p>
        </div>

        <div className="grid gap-3">
          {options.map((option, idx) => (
            <motion.button
              key={idx}
              onClick={() => handleOptionClick(option)}
              disabled={answered}
              className={`p-4 rounded-lg text-left transition-all border-2 ${
                answered
                  ? option.correct
                    ? "bg-green-100 border-green-500 text-green-800"
                    : "bg-red-100 border-red-500 text-red-800"
                  : "bg-white border-gray-300 text-gray-800 hover:border-primary hover:bg-blue-50"
              }`}
              whileHover={{ scale: answered ? 1 : 1.02 }}
            >
              {option.label}
            </motion.button>
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

      <LevelCompleteModal
        isOpen={showLevelComplete}
        levelNumber={3}
        onContinue={onComplete}
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
  const [showLevelComplete, setShowLevelComplete] = useState(false);
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
      
      // Individuelle Feedback-Texte für jeden Heldenreise-Schritt
      const feedbackTexts: Record<string, { title: string; text: string }> = {
        ordinary: {
          title: "Die Gewöhnliche Welt!",
          text: "Perfekt! Du beginnst mit dem Alltag der Heldin. Campbell (1949) nennt dies die 'Ordinary World' – der Zuhörer muss zuerst verstehen, wie das Leben VOR der Veränderung aussah. Sabines tägliche Arbeit mit Bürgeranträgen schafft Identifikation."
        },
        call: {
          title: "Der Ruf zum Abenteuer!",
          text: "Genau richtig! Das Problem wird sichtbar: BärGPT ist offline und kann nicht helfen. Dies ist der 'Call to Adventure' (Campbell, 1949) – ein Ereignis, das die Heldin aus ihrer Komfortzone reißt und Veränderung fordert."
        },
        refusal: {
          title: "Die Weigerung!",
          text: "Exzellent! Sabines Zögern ist menschlich und macht die Geschichte glaubwürdig. Die 'Refusal of the Call' zeigt innere Konflikte und Bedenken – genau wie bei den echten Stakeholdern. Das schafft Empathie!"
        },
        mentor: {
          title: "Der Mentor erscheint!",
          text: "Sehr gut! Der hilfreiche Kollege ist der klassische Mentor (wie Gandalf oder Obi-Wan). Er gibt der Heldin das Werkzeug (die Online-Funktion) und das Wissen, um die Herausforderung zu meistern. Mentoren machen Veränderung möglich!"
        },
        reward: {
          title: "Die Belohnung!",
          text: "Perfekter Abschluss! Die 'Reward' zeigt den konkreten Nutzen: 10 statt 47 Minuten. Das ist 'Narrative Transportation' (Green & Brock, 2000) in Aktion – die CDO erlebt den Erfolg emotional mit und ist überzeugt!"
        }
      };
      
      const fb = feedbackTexts[block.story] || { title: "Gut gemacht!", text: "Die Geschichte nimmt Form an." };
      setFeedback({
        show: true,
        success: true,
        title: fb.title,
        text: fb.text
      });
      onStoryPlaced();
    } else {
      playWrongSound();
      const isWrongBlock = block.story.startsWith("wrong");
      setFeedback({
        show: true,
        success: false,
        title: isWrongBlock ? "Langweilig!" : "Falsche Reihenfolge!",
        text: isWrongBlock
          ? "Die CDO schläft fast ein. Technische Details und Zahlen gehören nicht an den Anfang einer Geschichte! Beginne mit dem Menschen, nicht mit der Technik."
          : "Die Heldenreise hat eine bestimmte Struktur: Gewohnte Welt → Ruf → Weigerung → Mentor → Belohnung. Überlege, was zuerst kommt."
      });
    }
    setSelectedBlock(null);
  };

  const handleFeedbackClose = () => {
    setFeedback({ ...feedback, show: false });
    // Prüfe ob alle 5 Slots gefüllt sind (placedStories.size wird nach dem Platzieren aktualisiert)
    if (placedStories.size >= 5 && !showLevelComplete) {
      playLevelUpSound();
      setShowLevelComplete(true);
    }
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
        onClose={handleFeedbackClose}
      />

      <LevelCompleteModal
        isOpen={showLevelComplete}
        levelNumber={4}
        onContinue={onComplete}
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
  const [showLevelComplete, setShowLevelComplete] = useState(false);

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
    
    // currentQuestion wurde bereits durch onAnswer erhöht, daher prüfen wir ob alle Fragen beantwortet sind
    if (currentQuestion >= DATA_QUESTIONS.length) {
      playLevelUpSound();
      setShowLevelComplete(true);
    }
  };

  // Wenn alle Fragen beantwortet wurden, zeige das LevelCompleteModal direkt
  if (!question) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 flex flex-col items-center justify-center p-8 pt-24 bg-[#141428]/98"
      >
        <LevelCompleteModal
          isOpen={true}
          levelNumber={5}
          onContinue={onComplete}
        />
      </motion.div>
    );
  }

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

      <LevelCompleteModal
        isOpen={showLevelComplete}
        levelNumber={5}
        onContinue={onComplete}
      />
    </motion.div>
  );
}

// Level 6: Boss Battle - ERWEITERT mit mehr Runden und Gegner-Angriffen
function Level6({
  gameState,
  onPlayCard,
  onEnemyAttack,
  onWin,
  onReset
}: {
  gameState: GameState;
  onPlayCard: (card: typeof PLAYER_CARDS[0]) => void;
  onEnemyAttack: (damage: number) => void;
  onWin: () => void;
  onReset: () => void;
}) {
  const [currentAttack, setCurrentAttack] = useState<typeof ENEMY_ATTACKS[0] | null>(null);
  const [battleLog, setBattleLog] = useState<string>("Das finale Meeting beginnt...");
  const [hand, setHand] = useState<typeof PLAYER_CARDS>([]);
  const [canPlay, setCanPlay] = useState(false);
  const [showLightning, setShowLightning] = useState(false);
  const [phase, setPhase] = useState<'enemy' | 'player' | 'cdo'>('enemy');
  const roundRef = useRef(0);
  const usedEnemyAttacksRef = useRef<Set<number>>(new Set());

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
    setPhase('enemy');
    
    // Wähle eine Attacke, die noch nicht verwendet wurde
    let availableIndices = ENEMY_ATTACKS.map((_, i) => i).filter(i => !usedEnemyAttacksRef.current.has(i));
    
    // Wenn alle Attacken verwendet wurden, setze zurück
    if (availableIndices.length === 0) {
      usedEnemyAttacksRef.current = new Set();
      availableIndices = ENEMY_ATTACKS.map((_, i) => i);
    }
    
    // Wähle zufällig eine verfügbare Attacke
    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    const attack = ENEMY_ATTACKS[randomIndex];
    usedEnemyAttacksRef.current.add(randomIndex);
    setCurrentAttack(attack);
    setBattleLog(`Frau D.S. Gvo spielt "${attack.name}"!`);
    
    // Enemy attack damages player
    setTimeout(() => {
      onEnemyAttack(attack.damage);
      setCanPlay(true);
      setPhase('player');
    }, 1000);
  };

  const handleCardClick = (card: typeof PLAYER_CARDS[0]) => {
    if (!canPlay) return;
    playClickSound();
    setCanPlay(false);
    setCurrentAttack(null);

    // Show lightning animation for attacks
    if (card.power > 0) {
      playAttackSound();
      setShowLightning(true);
      setTimeout(() => setShowLightning(false), 300);
    }

    if (card.power <= 0) {
      playWrongSound();
      setBattleLog(`Du spielst "${card.name}" - Die CDO schüttelt den Kopf. ${card.power < 0 ? 'Kontraproduktiv!' : 'Wirkungslos!'}`);
    } else {
      playCorrectSound();
      setBattleLog(`Du spielst "${card.name}": "${card.description}"`);
    }

    onPlayCard(card);
    roundRef.current++;

    setTimeout(() => {
      const newCdoMeter = level6.cdoMeter + card.power;
      const newEnemyHP = level6.enemyHP - Math.max(0, card.power);
      
      // Win condition: CDO convinced (85%+) AND enemy weakened (30% or less)
      if (newCdoMeter >= 85 && newEnemyHP <= 30) {
        playVictorySound();
        onWin();
      } 
      // Lose condition: Player HP depleted
      else if (level6.playerHP <= 0) {
        playWrongSound();
        setBattleLog("Du hast alle Energie verloren... Versuch es nochmal!");
        setTimeout(() => {
          roundRef.current = 0;
          onReset();
          drawCards();
          setTimeout(() => enemyTurn(), 1500);
        }, 2000);
      } 
      // Continue battle
      else {
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
      className="absolute inset-0 flex flex-col items-center justify-center p-4 pt-20 bg-[#141428]/98 overflow-hidden"
    >
      <LightningEffect show={showLightning} />
      
      <h2 className="font-pixel text-lg text-primary mb-2 neon-text-pink">Level 6: Der Boss-Kampf</h2>
      <p className="text-gray-400 mb-3 text-center text-xs">Überzeuge die CDO im finalen Showdown!</p>

      {/* Battle Arena */}
      <div className="w-full max-w-4xl grid grid-cols-3 gap-2 mb-3">
        {/* Player Panel */}
        <div className="bg-gradient-to-b from-blue-900/80 to-blue-950/80 border-2 border-blue-500 rounded-xl p-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-blue-400 flex-shrink-0">
              <img 
                src="/images/player-character.png" 
                alt="Du"
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-pixel text-[9px] text-blue-300">SABINE</div>
              <div className="text-[7px] text-blue-400">Change Agent</div>
            </div>
          </div>
          <div className="text-[8px] text-gray-400 mb-1">Energie</div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-blue-600">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-green-400"
              animate={{ width: `${Math.max(0, level6.playerHP)}%` }}
            />
          </div>
          <div className="text-[8px] text-green-300 mt-1">{level6.playerHP}/100</div>
        </div>

        {/* CDO Panel - Center */}
        <div className="bg-gradient-to-b from-teal-900/80 to-teal-950/80 border-2 border-teal-400 rounded-xl p-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-teal-400 flex-shrink-0">
              <img 
                src="/images/cdo-character.png" 
                alt="CDO"
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-pixel text-[9px] text-teal-300">CDO</div>
              <div className="text-[7px] text-teal-400">Richterin</div>
            </div>
          </div>
          <div className="text-[8px] text-gray-400 mb-1">Überzeugung</div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-teal-500">
            <motion.div
              className="h-full"
              style={{ background: "linear-gradient(90deg, #e74c3c, #f39c12, #27ae60)" }}
              animate={{ width: `${Math.max(0, level6.cdoMeter)}%` }}
            />
          </div>
          <div className="text-[8px] text-teal-300 mt-1">{level6.cdoMeter}/100</div>
        </div>

        {/* Enemy Panel */}
        <div className="bg-gradient-to-b from-purple-900/80 to-purple-950/80 border-2 border-purple-500 rounded-xl p-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-purple-400 flex-shrink-0">
              <img 
                src="/images/frau-dsgvo.png" 
                alt="Frau D.S. Gvo"
                className="w-full h-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-pixel text-[9px] text-purple-300">FRAU D.S. GVO</div>
              <div className="text-[7px] text-purple-400">Datenschutz</div>
            </div>
          </div>
          <div className="text-[8px] text-gray-400 mb-1">Widerstand</div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-purple-600">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-600 to-purple-400"
              animate={{ width: `${Math.max(0, level6.enemyHP)}%` }}
            />
          </div>
          <div className="text-[8px] text-purple-300 mt-1">{level6.enemyHP}/100</div>
        </div>
      </div>

      {/* Battle Area */}
      <div className="bg-white/95 text-gray-800 rounded-xl p-3 w-full max-w-4xl">
        <div className="bg-gray-100 rounded-lg p-2 mb-2 text-sm border-2 border-gray-300">
          {battleLog}
        </div>

        {currentAttack && phase === 'player' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-purple-100 border-2 border-purple-500 rounded-lg p-2 mb-2"
          >
            <strong className="text-purple-700 text-sm">{currentAttack.name}:</strong>
            <span className="text-purple-600 text-xs ml-2">"{currentAttack.text}"</span>
          </motion.div>
        )}

        {/* Card Hand */}
        <div className="flex flex-wrap gap-2 justify-center">
          {hand.map((card) => (
            <motion.div
              key={card.id}
              onClick={() => handleCardClick(card)}
              className={`bg-gradient-to-b from-white to-gray-100 border-2 border-gray-800 rounded-lg p-2 w-24 text-center cursor-pointer transition-all ${
                !canPlay ? "opacity-50 cursor-not-allowed" : "hover:border-primary hover:-translate-y-1 hover:shadow-lg"
              }`}
              whileHover={{ scale: canPlay ? 1.05 : 1 }}
            >
              <div className="text-xl mb-1">{card.icon}</div>
              <div className="font-bold text-[9px] text-gray-800 mb-1">{card.name}</div>
              <div className={`text-[9px] ${card.power > 0 ? "text-green-600" : card.power < 0 ? "text-red-600" : "text-gray-500"}`}>
                {card.effect}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="mt-2 font-pixel text-xs text-accent">
        Runde: <span className="text-white">{roundRef.current + 1}</span>
      </div>
    </motion.div>
  );
}

// Win Screen - ERWEITERT mit umfangreicherem Abspann
function WinScreen({ onRestart, gameState }: { onRestart: () => void; gameState: GameState }) {
  const [showCredits, setShowCredits] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-b from-green-600/95 to-teal-700/95 overflow-y-auto"
    >
      <motion.h1
        className="font-pixel text-xl text-white mb-4"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.2 }}
        style={{ textShadow: "4px 4px 0 rgba(0,0,0,0.3)" }}
      >
        🎉 MISSION ERFOLGREICH! 🎉
      </motion.h1>

      <motion.div
        className="bg-white/95 text-gray-800 p-5 rounded-xl max-w-2xl text-center max-h-[60vh] overflow-y-auto"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <p className="text-base leading-relaxed mb-3">
          <strong>Die CDO ist überzeugt!</strong> Die Online-Funktion von BärGPT wird freigeschaltet.
        </p>
        <p className="text-sm leading-relaxed mb-3">
          Sabine kann jetzt aktuelle Gesetze abfragen, Bürgeranträge schneller bearbeiten und muss keine unsicheren Workarounds mehr nutzen.
          <strong> Die Berliner Verwaltung macht einen großen Schritt in die digitale Zukunft!</strong>
        </p>
        
        {/* Statistiken */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 text-left text-sm mb-4">
          <h4 className="font-bold text-blue-800 mb-2">📊 Deine Statistiken:</h4>
          <div className="grid grid-cols-2 gap-2 text-blue-700 text-xs">
            <div>✅ Biases erkannt: {gameState.level1.biasesFound}/3</div>
            <div>📞 Personalrat überzeugt: ✓</div>
            <div>📋 Umfrage analysiert: {gameState.level3.correctChoices}/3</div>
            <div>📖 Heldenreise gebaut: {gameState.level4.storiesPlaced}/5</div>
            <div>📈 Daten präsentiert: {gameState.level5.correctChoices}/3</div>
            <div>🏆 Boss besiegt: ✓</div>
          </div>
        </div>

        {/* Learnings */}
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 text-left text-sm mb-4">
          <h4 className="font-bold text-green-800 mb-2">📚 Was du gelernt hast:</h4>
          <ul className="space-y-1 text-green-700 text-xs">
            <li>• <strong>Kognitive Verzerrungen erkennen</strong> – Verlust-Aversion, Zero-Risk Bias, Omission Bias (Kahneman & Tversky, 1979)</li>
            <li>• <strong>Stakeholder-Management</strong> – Verschiedene Gruppen haben verschiedene Bedenken</li>
            <li>• <strong>Narrative Transportation</strong> – Geschichten überzeugen mehr als Fakten (Green & Brock, 2000)</li>
            <li>• <strong>Pre-Suasion</strong> – Den Rahmen setzen, bevor man argumentiert (Cialdini, 2016)</li>
            <li>• <strong>Datenvisualisierung</strong> – Die richtige Darstellung für das richtige Publikum</li>
          </ul>
        </div>

        {/* Credits Toggle */}
        <button
          onClick={() => setShowCredits(!showCredits)}
          className="text-xs text-gray-500 hover:text-gray-700 mb-3"
        >
          {showCredits ? "▼ Credits ausblenden" : "▶ Credits anzeigen"}
        </button>

        {showCredits && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="bg-gray-100 rounded-lg p-3 text-left text-xs mb-4"
          >
            <h4 className="font-bold text-gray-800 mb-2">🎬 Credits</h4>
            <div className="text-gray-600 space-y-1">
              <p><strong>Konzept & Design:</strong> Universitäres Projekt</p>
              <p><strong>Wissenschaftliche Grundlagen:</strong></p>
              <ul className="ml-4 space-y-1">
                <li>• Kahneman, D. & Tversky, A. (1979). Prospect Theory</li>
                <li>• Cialdini, R. (2006). Influence: The Psychology of Persuasion</li>
                <li>• Cialdini, R. (2016). Pre-Suasion</li>
                <li>• Campbell, J. (1949). The Hero with a Thousand Faces</li>
                <li>• Green, M. & Brock, T. (2000). Narrative Transportation</li>
                <li>• Baron, J. (2000). Thinking and Deciding</li>
                <li>• Damasio, A. (1994). Descartes' Error</li>
              </ul>
              <p className="mt-2"><strong>Technologie:</strong> React, TypeScript, Framer Motion</p>
              <p><strong>Inspiration:</strong> Die echten Herausforderungen der Verwaltungsdigitalisierung</p>
            </div>
          </motion.div>
        )}

        {/* Easter Egg Hinweis */}
        {gameState.coffeeFound && (
          <p className="text-xs text-amber-600 mb-3">☕ Du hast den versteckten Kaffee gefunden!</p>
        )}
        {gameState.faxTriggered && (
          <p className="text-xs text-amber-600 mb-3">📠 Du hast das Fax-Easter-Egg entdeckt!</p>
        )}
      </motion.div>

      <motion.button
        onClick={() => { playClickSound(); onRestart(); }}
        className="mt-4 font-pixel text-sm bg-gradient-to-b from-yellow-400 to-orange-600 text-white px-8 py-4 rounded-lg shadow-lg hover:scale-105 transition-transform"
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
    approval: 30, // FIXED: Startet bei 30% (orange) statt 50%
    energy: 100,
    coffeeFound: false,
    faxTriggered: false,
    level1: { biasesFound: 0, completed: false },
    level2: { round: 0, personalratHP: 100, playerHP: 100, completed: false },
    level3: { currentQuestion: 0, correctChoices: 0, completed: false },
    level4: { storiesPlaced: 0, completed: false },
    level5: { currentQuestion: 0, correctChoices: 0, completed: false },
    level6: { playerHP: 100, enemyHP: 100, cdoMeter: 30, round: 0, completed: false }
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
      // CDO-Zustimmung darf vor dem Boss-Fight maximal 80% erreichen
      approval: Math.min(80, prev.approval + 5),
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

  const handlePersonalratCounter = useCallback((power: number, damage: number) => {
    setGameState(prev => ({
      ...prev,
      // CDO-Zustimmung darf vor dem Boss-Fight maximal 80% erreichen
      approval: Math.min(80, prev.approval + Math.floor(power / 2)),
      level2: { 
        ...prev.level2, 
        round: prev.level2.round + 1,
        personalratHP: Math.max(0, prev.level2.personalratHP - power),
        playerHP: Math.max(0, prev.level2.playerHP - damage)
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
      // CDO-Zustimmung darf vor dem Boss-Fight maximal 80% erreichen
      approval: correct ? Math.min(80, prev.approval + 8) : Math.max(0, prev.approval - 3),
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
      // CDO-Zustimmung darf vor dem Boss-Fight maximal 80% erreichen
      approval: Math.min(80, prev.approval + 5),
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
      // CDO-Zustimmung darf vor dem Boss-Fight maximal 80% erreichen
      approval: correct ? Math.min(80, prev.approval + 10) : Math.max(0, prev.approval - 5),
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
      newState.level6.cdoMeter = Math.min(100, Math.max(0, prev.level6.cdoMeter + card.power));
      newState.level6.enemyHP = Math.max(0, prev.level6.enemyHP - Math.max(0, card.power));
      newState.level6.round = prev.level6.round + 1;
      return newState;
    });
  }, []);

  const handleEnemyAttack = useCallback((damage: number) => {
    setGameState(prev => ({
      ...prev,
      level6: {
        ...prev.level6,
        playerHP: Math.max(0, prev.level6.playerHP - damage),
        cdoMeter: Math.max(0, prev.level6.cdoMeter - Math.floor(damage / 2))
      }
    }));
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
      level6: { playerHP: 100, enemyHP: 100, cdoMeter: 30, round: 0, completed: false }
    }));
  }, []);

  const restartGame = useCallback(() => {
    setGameState({
      currentLevel: 1,
      approval: 30,
      energy: 100,
      coffeeFound: false,
      faxTriggered: false,
      level1: { biasesFound: 0, completed: false },
      level2: { round: 0, personalratHP: 100, playerHP: 100, completed: false },
      level3: { currentQuestion: 0, correctChoices: 0, completed: false },
      level4: { storiesPlaced: 0, completed: false },
      level5: { currentQuestion: 0, correctChoices: 0, completed: false },
      level6: { playerHP: 100, enemyHP: 100, cdoMeter: 30, round: 0, completed: false }
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
              playerHP={gameState.level2.playerHP}
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
              onEnemyAttack={handleEnemyAttack}
              onWin={handleWin}
              onReset={handleLevel6Reset}
            />
          )}
          
          {screen === "win" && <WinScreen key="win" onRestart={restartGame} gameState={gameState} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
