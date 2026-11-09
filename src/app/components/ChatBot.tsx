import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Send, Bot, Sparkles, Search, Clock, AlertTriangle,
  ShieldAlert, Info, Pill, Zap, BookOpen, ChevronDown, ChevronUp,
  ArrowLeft, Utensils, Moon, Sun, Sunset, ThumbsUp,
} from "lucide-react";
import { ModalPortal } from "./ModalPortal";
import { useApp } from "../context/AppContext";
import {
  MEDICATION_DB,
  HEALTH_TOPICS,
  findMedicationInfo,
  findHealthTopic,
  type MedInfo,
} from "../data/medicationKnowledge";

// ── Types ──────────────────────────────────────────────────────────────────────
type MsgKind = "text" | "med-card" | "health-card";

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  kind: MsgKind;
  text?: string;
  medInfo?: MedInfo;
  healthTitle?: string;
  healthBody?: string;
  timestamp: Date;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const MED_NAMES_FLAT: { display: string; key: string }[] = Object.entries(MEDICATION_DB).map(
  ([key, info]) => ({ display: info.genericName, key })
);

function getSuggestions(q: string): { display: string; key: string }[] {
  if (!q.trim()) return [];
  const lq = q.toLowerCase();
  const byGeneric = MED_NAMES_FLAT.filter((m) => m.display.toLowerCase().includes(lq));
  const byBrand: { display: string; key: string }[] = [];
  Object.entries(MEDICATION_DB).forEach(([key, info]) => {
    info.brandNames.forEach((bn) => {
      if (bn.toLowerCase().includes(lq) && !byGeneric.find((m) => m.key === key)) {
        byBrand.push({ display: `${bn} (${info.genericName})`, key });
      }
    });
  });
  return [...byGeneric, ...byBrand].slice(0, 6);
}

function detectIntent(q: string): string {
  if (/side effect|adverse|reaction|problem/.test(q)) return "sideEffects";
  if (/timing|when to take|morning|evening|food|meal|empty stomach/.test(q)) return "timing";
  if (/interact|combine|mix|together|along with/.test(q)) return "interactions";
  if (/warn|caution|avoid|dangerous|safe/.test(q)) return "warnings";
  if (/what is|used for|treat|purpose/.test(q)) return "uses";
  return "overview";
}

function buildBotResponse(
  q: string,
  userMeds: { name: string; dosage: string; timeSlot: string; scheduledTime: string; notes: string }[]
): { kind: MsgKind; text?: string; medInfo?: MedInfo; healthTitle?: string; healthBody?: string } {
  const lq = q.toLowerCase().trim();

  // Greeting
  if (/^(hi|hello|hey|good |namaste|hola|bonjour)/.test(lq)) {
    return { kind: "text", text: `Hi! 👋 I'm **MediBot**.\n\nSearch any medicine name or ask a health question — I'll show you everything about it.\n\nTry: *"Metformin"*, *"Aspirin side effects"*, or *"Blood pressure levels"*` };
  }

  // User's own meds
  if (/my medication|my medicine|my tablet|what am i taking/.test(lq)) {
    if (userMeds.length === 0) return { kind: "text", text: "You haven't added any medications yet. Go to the **Pills** section to add them!" };
    const list = userMeds.map((m) => `• **${m.name}** ${m.dosage} — ${m.timeSlot} at ${m.scheduledTime}`).join("\n");
    return { kind: "text", text: `You have **${userMeds.length}** medication(s):\n\n${list}\n\nTap any name to see full details!` };
  }

  // Check user's own meds first
  for (const med of userMeds) {
    if (lq.includes(med.name.toLowerCase())) {
      const dbInfo = findMedicationInfo(med.name);
      if (dbInfo) return { kind: "med-card", medInfo: dbInfo };
      return {
        kind: "text",
        text: `**${med.name}** (${med.dosage})\n\nYou take this at **${med.timeSlot}** (${med.scheduledTime}).\n${med.notes ? `\n📝 *${med.notes}*` : ""}\n\nI don't have detailed data for this one — ask your pharmacist for full info.`,
      };
    }
  }

  // Check med database
  const medInfo = findMedicationInfo(lq);
  if (medInfo) return { kind: "med-card", medInfo };

  // Health topics
  const topic = findHealthTopic(lq);
  if (topic) return { kind: "health-card", healthTitle: topic.title, healthBody: topic.response };

  // Emergency
  if (/emergency|urgent|ambulance|911|chest pain|can't breathe/.test(lq)) {
    return { kind: "text", text: `⚠️ **If this is a medical emergency, call emergency services immediately.**\n\nDo not wait — call your local emergency number now.` };
  }

  // Unknown
  return {
    kind: "text",
    text: `I couldn't find specific info for that. Try:\n\n• A medication name (e.g., *"Metformin"*)\n• A question (e.g., *"Side effects of aspirin"*)\n• A health topic (e.g., *"Blood pressure"*)`,
  };
}

// ── Timing badge ───────────────────────────────────────────────────────────────
function TimingIcon({ withFood }: { withFood: "yes" | "no" | "either" }) {
  if (withFood === "yes") return <span className="flex items-center gap-1 text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full text-xs font-bold"><Utensils size={11} /> With food</span>;
  if (withFood === "no") return <span className="flex items-center gap-1 text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full text-xs font-bold"><Zap size={11} /> Empty stomach</span>;
  return <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full text-xs font-bold"><ThumbsUp size={11} /> With or without food</span>;
}

// ── Expandable section ─────────────────────────────────────────────────────────
function Section({
  icon, title, color, children, defaultOpen = false,
}: {
  icon: React.ReactNode; title: string; color: string;
  children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`rounded-2xl border overflow-hidden ${color}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <span className="flex items-center gap-2 font-bold text-sm">{icon}{title}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Medication Knowledge Card (Google-style) ───────────────────────────────────
function MedCard({ info }: { info: MedInfo }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 text-white">
        <div className="flex items-start gap-3">
          <div className="bg-white/20 rounded-xl p-2.5 flex-shrink-0">
            <Pill size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-0.5">{info.drugClass}</p>
            <h3 className="text-xl font-black text-white leading-tight">{info.genericName}</h3>
            {info.brandNames.length > 0 && (
              <p className="text-sm text-blue-200 mt-0.5">
                {info.emoji} Also sold as: {info.brandNames.slice(0, 3).join(", ")}
              </p>
            )}
          </div>
        </div>
        <p className="text-sm text-blue-100 mt-3 leading-relaxed">{info.uses}</p>
      </div>

      {/* Quick timing badge */}
      <div className="flex flex-wrap gap-2 px-1">
        <TimingIcon withFood={info.withFood} />
        <span className="flex items-center gap-1 text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full text-xs font-bold">
          <Clock size={11} /> {info.timing.split(".")[0].slice(0, 45)}{info.timing.length > 45 ? "…" : ""}
        </span>
      </div>

      {/* When to take */}
      <Section
        defaultOpen
        icon={<Clock size={15} className="text-teal-600" />}
        title="When to Take"
        color="border-teal-200 bg-teal-50 text-teal-900"
      >
        <p className="text-sm leading-relaxed">{info.timing}</p>
        <div className="mt-2">
          <TimingIcon withFood={info.withFood} />
        </div>
      </Section>

      {/* Common side effects */}
      <Section
        defaultOpen
        icon={<Info size={15} className="text-orange-600" />}
        title={`Common Side Effects (${info.sideEffects.common.length})`}
        color="border-orange-200 bg-orange-50 text-orange-900"
      >
        <div className="flex flex-wrap gap-1.5 mt-1">
          {info.sideEffects.common.map((s, i) => (
            <span key={i} className="bg-orange-200 text-orange-900 text-xs font-semibold px-2.5 py-1 rounded-full">
              {s}
            </span>
          ))}
        </div>
      </Section>

      {/* Serious side effects */}
      <Section
        icon={<AlertTriangle size={15} className="text-rose-600" />}
        title={`Serious Reactions — Seek Help (${info.sideEffects.serious.length})`}
        color="border-rose-200 bg-rose-50 text-rose-900"
      >
        <ul className="flex flex-col gap-1.5 mt-1">
          {info.sideEffects.serious.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="text-rose-500 mt-0.5 flex-shrink-0">⚠</span>
              {s}
            </li>
          ))}
        </ul>
      </Section>

      {/* Drug Interactions */}
      <Section
        icon={<Zap size={15} className="text-purple-600" />}
        title={`Drug Interactions (${info.interactions.length})`}
        color="border-purple-200 bg-purple-50 text-purple-900"
      >
        <ul className="flex flex-col gap-1.5 mt-1">
          {info.interactions.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="text-purple-500 flex-shrink-0">⚡</span> {s}
            </li>
          ))}
        </ul>
        <p className="text-xs text-purple-600 mt-2 italic">Always check with your pharmacist before starting any new medication.</p>
      </Section>

      {/* Warnings */}
      <Section
        icon={<ShieldAlert size={15} className="text-amber-600" />}
        title={`Warnings & Precautions (${info.warnings.length})`}
        color="border-amber-200 bg-amber-50 text-amber-900"
      >
        <ul className="flex flex-col gap-1.5 mt-1">
          {info.warnings.map((w, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="text-amber-500 flex-shrink-0">🛡</span> {w}
            </li>
          ))}
        </ul>
      </Section>

      {/* Notes */}
      {info.notes && (
        <Section
          icon={<BookOpen size={15} className="text-slate-600" />}
          title="Important Notes"
          color="border-slate-200 bg-slate-50 text-slate-700"
        >
          <p className="text-sm leading-relaxed">{info.notes}</p>
        </Section>
      )}

      <p className="text-[10px] text-slate-400 text-center px-2">
        ⚠ This information is educational only. Always follow your doctor's and pharmacist's advice.
      </p>
    </div>
  );
}

// ── Health topic card ──────────────────────────────────────────────────────────
function HealthCard({ title, body }: { title: string; body: string }) {
  const lines = body.split("\n");
  return (
    <div className="bg-white rounded-2xl border border-blue-100 overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-4 py-3 text-white">
        <p className="text-xs font-semibold text-blue-100 uppercase tracking-wider">Health Info</p>
        <h3 className="text-lg font-black">{title}</h3>
      </div>
      <div className="px-4 py-4">
        {lines.map((line, i) => {
          if (line.startsWith("**") && line.endsWith("**")) {
            return <p key={i} className="font-bold text-slate-800 text-sm mt-3 mb-1">{line.slice(2, -2)}</p>;
          }
          if (line.startsWith("• ")) {
            return <p key={i} className="text-sm text-slate-700 leading-relaxed pl-2">{line}</p>;
          }
          if (line.trim() === "") return <div key={i} className="h-1" />;
          return <p key={i} className="text-sm text-slate-700 leading-relaxed">{line}</p>;
        })}
      </div>
    </div>
  );
}

// ── Plain text bubble renderer (bold/italic) ───────────────────────────────────
function TextBubble({ text }: { text: string }) {
  return (
    <div className="text-sm leading-relaxed whitespace-pre-line">
      {text.split("\n").map((line, i) => {
        const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
        return (
          <span key={i}>
            {parts.map((p, j) => {
              if (p.startsWith("**") && p.endsWith("**")) return <strong key={j}>{p.slice(2, -2)}</strong>;
              if (p.startsWith("*") && p.endsWith("*")) return <em key={j}>{p.slice(1, -1)}</em>;
              return p;
            })}
            {i < text.split("\n").length - 1 ? "\n" : ""}
          </span>
        );
      })}
    </div>
  );
}

// ── Popular searches ───────────────────────────────────────────────────────────
const POPULAR = [
  { label: "💊 Metformin", q: "Metformin" },
  { label: "❤️ Atorvastatin", q: "Atorvastatin" },
  { label: "🩸 Lisinopril", q: "Lisinopril" },
  { label: "🟠 Ibuprofen", q: "Ibuprofen" },
  { label: "⚡ Warfarin", q: "Warfarin" },
  { label: "🌤 Sertraline", q: "Sertraline" },
  { label: "💧 Furosemide", q: "Furosemide" },
  { label: "💊 Aspirin", q: "Aspirin" },
  { label: "🩺 Blood pressure", q: "What is normal blood pressure?" },
  { label: "🩸 Blood sugar", q: "What is normal blood sugar?" },
  { label: "🍊 Grapefruit warning", q: "Grapefruit interactions" },
  { label: "⏰ Missed dose", q: "I forgot to take my medicine" },
];

// ── Main ChatBot Component ─────────────────────────────────────────────────────
export function ChatBot() {
  const { medications } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<{ display: string; key: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasMessages = messages.length > 0;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  const handleInputChange = (val: string) => {
    setInput(val);
    const sugg = getSuggestions(val);
    setSuggestions(sugg);
    setShowSuggestions(sugg.length > 0 && val.length >= 2);
  };

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setShowSuggestions(false);
      setInput("");
      setSuggestions([]);

      const userMsg: ChatMessage = {
        id: `u_${Date.now()}`,
        role: "user",
        kind: "text",
        text: trimmed,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsTyping(true);

      const delay = Math.min(900, 400 + trimmed.length * 6);
      await new Promise((r) => setTimeout(r, delay));

      const medContext = medications.map((m) => ({
        name: m.name, dosage: m.dosage, timeSlot: m.timeSlot,
        scheduledTime: m.scheduledTime, notes: m.notes,
      }));

      const result = buildBotResponse(trimmed, medContext);

      const botMsg: ChatMessage = {
        id: `b_${Date.now()}`,
        role: "bot",
        kind: result.kind,
        text: result.text,
        medInfo: result.medInfo,
        healthTitle: result.healthTitle,
        healthBody: result.healthBody,
        timestamp: new Date(),
      };

      setIsTyping(false);
      setMessages((prev) => [...prev, botMsg]);
    },
    [medications]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) sendMessage(input);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.06 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-[5.5rem] right-4 z-30 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-xl shadow-blue-500/30 border-2 border-white"
        title="MediBot — Ask about any medicine"
      >
        <Bot size={26} />
        <motion.span
          className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white"
          animate={{ scale: [1, 1.35, 1] }}
          transition={{ repeat: Infinity, duration: 2.2 }}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <ModalPortal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[9999] flex items-end justify-center"
              onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="bg-slate-50 rounded-t-3xl w-full max-w-md flex flex-col overflow-hidden"
                style={{ height: "92vh" }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* ── Header ── */}
                <div className="bg-white border-b border-slate-100 px-4 py-3 flex-shrink-0">
                  <div className="flex items-center gap-3 mb-3">
                    {hasMessages && (
                      <button onClick={() => setMessages([])} className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 flex-shrink-0">
                        <ArrowLeft size={18} className="text-slate-600" />
                      </button>
                    )}
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot size={17} className="text-white" />
                      </div>
                      <div>
                        <p className="text-base font-black text-slate-800 flex items-center gap-1">
                          MediBot <Sparkles size={12} className="text-amber-400" />
                        </p>
                        <p className="text-[10px] text-emerald-600 font-semibold leading-none">
                          ● Online · {Object.keys(MEDICATION_DB).length}+ medicines
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="p-2 rounded-full bg-slate-100 hover:bg-slate-200">
                      <X size={18} />
                    </button>
                  </div>

                  {/* Search bar */}
                  <form onSubmit={handleSubmit} className="relative">
                    <div className="flex items-center gap-2 bg-slate-100 rounded-2xl px-3 py-2.5 border-2 border-transparent focus-within:border-blue-400 focus-within:bg-white transition-all">
                      <Search size={18} className="text-slate-400 flex-shrink-0" />
                      <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onFocus={() => input.length >= 2 && setShowSuggestions(suggestions.length > 0)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                        placeholder="Search any medicine or health topic…"
                        className="flex-1 bg-transparent text-base text-slate-800 placeholder-slate-400 focus:outline-none"
                      />
                      {input && (
                        <button type="button" onClick={() => { setInput(""); setSuggestions([]); setShowSuggestions(false); }}>
                          <X size={16} className="text-slate-400" />
                        </button>
                      )}
                      <motion.button
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        whileTap={{ scale: 0.9 }}
                        className="bg-blue-600 disabled:bg-slate-300 text-white rounded-xl p-1.5 transition-colors flex-shrink-0"
                      >
                        <Send size={14} />
                      </motion.button>
                    </div>

                    {/* Autocomplete dropdown */}
                    <AnimatePresence>
                      {showSuggestions && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden z-10"
                        >
                          {suggestions.map((s) => (
                            <button
                              key={s.key}
                              type="button"
                              onMouseDown={() => sendMessage(s.display)}
                              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-left border-b border-slate-50 last:border-0 transition-colors"
                            >
                              <Search size={14} className="text-slate-400 flex-shrink-0" />
                              <span className="text-sm font-semibold text-slate-700">{s.display}</span>
                              <span className="ml-auto text-xs text-slate-400">{MEDICATION_DB[s.key]?.drugClass}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </form>
                </div>

                {/* ── Content area ── */}
                <div className="flex-1 overflow-y-auto">
                  {!hasMessages ? (
                    /* ── Home screen (no messages yet) ── */
                    <div className="px-4 py-5">
                      <p className="text-center text-slate-500 text-sm mb-4">
                        Search any medicine to get instant details
                      </p>

                      {/* Category pills */}
                      <div className="grid grid-cols-2 gap-2 mb-5">
                        {[
                          { icon: <Sun size={16} />, label: "Diabetes Meds", color: "bg-rose-50 text-rose-700 border-rose-200", q: "Metformin" },
                          { icon: <Sunset size={16} />, label: "Heart & BP", color: "bg-purple-50 text-purple-700 border-purple-200", q: "Lisinopril" },
                          { icon: <Moon size={16} />, label: "Pain Relief", color: "bg-amber-50 text-amber-700 border-amber-200", q: "Ibuprofen" },
                          { icon: <Pill size={16} />, label: "Cholesterol", color: "bg-blue-50 text-blue-700 border-blue-200", q: "Atorvastatin" },
                        ].map((cat) => (
                          <button
                            key={cat.label}
                            onClick={() => sendMessage(cat.q)}
                            className={`flex items-center gap-2 p-3 rounded-2xl border-2 font-bold text-sm transition-all hover:scale-[1.02] active:scale-95 ${cat.color}`}
                          >
                            {cat.icon} {cat.label}
                          </button>
                        ))}
                      </div>

                      {/* Popular searches */}
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Popular Searches</p>
                      <div className="flex flex-wrap gap-2">
                        {POPULAR.map((p) => (
                          <button
                            key={p.q}
                            onClick={() => sendMessage(p.q)}
                            className="bg-white border border-slate-200 text-slate-700 text-sm font-semibold px-3 py-2 rounded-xl hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all"
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* ── Chat messages ── */
                    <div className="px-4 py-4 flex flex-col gap-4">
                      {messages.map((msg) => (
                        <div key={msg.id}>
                          {msg.role === "user" ? (
                            /* User bubble */
                            <div className="flex justify-end">
                              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[80%] text-sm font-semibold shadow-sm">
                                {msg.text}
                              </div>
                            </div>
                          ) : (
                            /* Bot response */
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 mb-1">
                                <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                                  <Bot size={11} className="text-white" />
                                </div>
                                <span className="text-xs font-bold text-slate-500">MediBot</span>
                              </div>

                              {msg.kind === "med-card" && msg.medInfo && (
                                <MedCard info={msg.medInfo} />
                              )}
                              {msg.kind === "health-card" && msg.healthTitle && msg.healthBody && (
                                <HealthCard title={msg.healthTitle} body={msg.healthBody} />
                              )}
                              {msg.kind === "text" && msg.text && (
                                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-slate-100">
                                  <TextBubble text={msg.text} />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Typing indicator */}
                      {isTyping && (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot size={11} className="text-white" />
                          </div>
                          <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1 border border-slate-100">
                            {[0, 1, 2].map((i) => (
                              <motion.div
                                key={i}
                                className="w-2 h-2 bg-blue-400 rounded-full"
                                animate={{ y: [0, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Related searches after bot responds */}
                      {!isTyping && messages.length > 0 && messages[messages.length - 1].role === "bot" && (
                        <div className="mt-1">
                          <p className="text-xs text-slate-400 font-semibold mb-2">People also search:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {POPULAR.slice(0, 5).map((p) => (
                              <button
                                key={p.q}
                                onClick={() => sendMessage(p.q)}
                                className="bg-white border border-slate-200 text-slate-600 text-xs font-semibold px-2.5 py-1.5 rounded-xl hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all"
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Disclaimer */}
                <div className="bg-white border-t border-slate-100 px-4 py-2 flex-shrink-0">
                  <p className="text-[10px] text-slate-400 text-center">
                    ⚕️ For informational use only — not a substitute for professional medical advice.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </ModalPortal>
        )}
      </AnimatePresence>
    </>
  );
}
