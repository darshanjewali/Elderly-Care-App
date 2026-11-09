import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity,
  Droplet,
  Heart,
  Plus,
  X,
  Play,
  Pause,
  RotateCcw,
  Smartphone,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Pencil,
  Check,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";
import { useApp } from "../context/AppContext";
import { useStepCounter } from "../hooks/useStepCounter";
import { ModalPortal } from "../components/ModalPortal";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getBSStatus(v: number) {
  if (v < 70) return { label: "Low", bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-300" };
  if (v <= 99) return { label: "Normal", bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-300" };
  if (v <= 125) return { label: "Pre-diabetic", bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300" };
  return { label: "High", bg: "bg-rose-100", text: "text-rose-700", border: "border-rose-300" };
}

function getBPStatus(s: number, d: number) {
  if (s >= 140 || d >= 90) return { label: "Stage 2 HTN", bg: "bg-rose-100", text: "text-rose-700" };
  if (s >= 130 || d >= 80) return { label: "Stage 1 HTN", bg: "bg-orange-100", text: "text-orange-700" };
  if (s >= 120) return { label: "Elevated", bg: "bg-amber-100", text: "text-amber-700" };
  return { label: "Normal", bg: "bg-emerald-100", text: "text-emerald-700" };
}

// ─── Blood Sugar Modal ────────────────────────────────────────────────────────
function BloodSugarModal({ onClose }: { onClose: () => void }) {
  const { addBloodSugar } = useApp();
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [context, setContext] = useState("fasting");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(value);
    if (!n || n < 30 || n > 600) return;
    setSaving(true);
    try {
      await addBloodSugar(n, `${context}${note ? " – " + note : ""}`);
      onClose();
    } catch {
      /* handled */
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalPortal>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[9999] flex items-end justify-center"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          className="bg-white rounded-t-3xl w-full max-w-md p-6 pb-10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Droplet className="text-rose-500" size={28} /> Log Blood Sugar
            </h2>
            <button onClick={onClose} className="p-2 rounded-full bg-slate-100">
              <X size={22} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="text-center">
              <div className="flex items-end justify-center gap-2">
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="105"
                  min={30}
                  max={600}
                  className="w-40 text-6xl font-black text-center text-rose-700 border-b-4 border-rose-300 focus:outline-none focus:border-rose-500 bg-transparent"
                  required
                  autoFocus
                />
                <span className="text-2xl font-bold text-slate-500 mb-2">mg/dL</span>
              </div>
              {value && Number(value) >= 30 && (
                <div className="mt-3">
                  <span
                    className={`text-sm font-bold px-3 py-1 rounded-full ${
                      getBSStatus(Number(value)).bg
                    } ${getBSStatus(Number(value)).text}`}
                  >
                    {getBSStatus(Number(value)).label}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-base font-bold text-slate-700 mb-2">When measured?</label>
              <div className="flex gap-2 flex-wrap">
                {["fasting", "before meal", "after meal", "bedtime"].map((ctx) => (
                  <button
                    key={ctx}
                    type="button"
                    onClick={() => setContext(ctx)}
                    className={`px-3 py-2 rounded-xl font-semibold text-sm capitalize border-2 transition-all ${
                      context === ctx
                        ? "bg-rose-500 text-white border-rose-500"
                        : "bg-white text-slate-600 border-slate-200"
                    }`}
                  >
                    {ctx}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-base font-bold text-slate-700 mb-2">Note (optional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Any additional notes…"
                className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-base focus:border-rose-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving || !value || Number(value) < 30}
              className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-slate-200 text-white py-4 rounded-2xl font-bold text-xl transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={22} className="animate-spin" /> : <Plus size={22} />}
              {saving ? "Saving…" : "Log Blood Sugar"}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </ModalPortal>
  );
}

// ─── Blood Pressure Modal ─────────────────────────────────────────────────────
function BloodPressureModal({ onClose }: { onClose: () => void }) {
  const { addBloodPressure } = useApp();
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [pulse, setPulse] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const s = Number(systolic);
    const d = Number(diastolic);
    if (!s || !d || s < 60 || d < 40) return;
    setSaving(true);
    try {
      await addBloodPressure(s, d, pulse ? Number(pulse) : null, note);
      onClose();
    } catch {
      /* handled */
    } finally {
      setSaving(false);
    }
  };

  const s = Number(systolic);
  const d = Number(diastolic);
  const status = s && d ? getBPStatus(s, d) : null;

  return (
    <ModalPortal>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[9999] flex items-end justify-center"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          className="bg-white rounded-t-3xl w-full max-w-md p-6 pb-10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Heart className="text-purple-500" size={28} /> Log Blood Pressure
            </h2>
            <button onClick={onClose} className="p-2 rounded-full bg-slate-100">
              <X size={22} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex items-center justify-center gap-3">
              <div className="text-center">
                <label className="block text-sm font-bold text-purple-600 mb-1">SYSTOLIC</label>
                <input
                  type="number"
                  value={systolic}
                  onChange={(e) => setSystolic(e.target.value)}
                  placeholder="120"
                  min={60}
                  max={250}
                  className="w-28 text-5xl font-black text-center text-purple-700 border-b-4 border-purple-300 focus:outline-none focus:border-purple-500 bg-transparent"
                  required
                  autoFocus
                />
              </div>
              <span className="text-4xl font-black text-slate-400 mt-4">/</span>
              <div className="text-center">
                <label className="block text-sm font-bold text-purple-600 mb-1">DIASTOLIC</label>
                <input
                  type="number"
                  value={diastolic}
                  onChange={(e) => setDiastolic(e.target.value)}
                  placeholder="80"
                  min={40}
                  max={160}
                  className="w-28 text-5xl font-black text-center text-purple-700 border-b-4 border-purple-300 focus:outline-none focus:border-purple-500 bg-transparent"
                  required
                />
              </div>
              <span className="text-xl font-bold text-slate-400 mt-4">mmHg</span>
            </div>

            {status && (
              <div className="text-center">
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${status.bg} ${status.text}`}>
                  {status.label}
                </span>
              </div>
            )}

            <div>
              <label className="block text-base font-bold text-slate-700 mb-2">Pulse (optional)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  placeholder="72"
                  min={30}
                  max={220}
                  className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-lg focus:border-purple-400 focus:outline-none"
                />
                <span className="font-bold text-slate-500 whitespace-nowrap">bpm</span>
              </div>
            </div>

            <div>
              <label className="block text-base font-bold text-slate-700 mb-2">Note (optional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., After exercise, Sitting, Stressed"
                className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-base focus:border-purple-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving || !systolic || !diastolic}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 text-white py-4 rounded-2xl font-bold text-xl transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={22} className="animate-spin" /> : <Plus size={22} />}
              {saving ? "Saving…" : "Log Blood Pressure"}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </ModalPortal>
  );
}

// ─── Steps Section ─────────────────────────────────────────────────────────────
function StepsSection() {
  const { stepsToday, stepsHistory, setStepsToday, syncStepsToServer, stepGoal, setStepGoal } = useApp();
  const [manualInput, setManualInput] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(stepGoal));

  const counter = useStepCounter(stepsToday);
  const GOAL = stepGoal;
  const progress = Math.min(100, (counter.steps / GOAL) * 100);

  const handleGoalSave = () => {
    const val = parseInt(goalInput, 10);
    if (!val || val < 100) return;
    setStepGoal(val);
    setEditingGoal(false);
  };
  const calories = Math.round(counter.steps * 0.04);
  const distanceKm = (counter.steps * 0.0008).toFixed(2);

  // Sync step counter steps up to context
  useEffect(() => {
    if (counter.state === "active" || counter.state === "paused") {
      setStepsToday(counter.steps);
    }
  }, [counter.steps, counter.state, setStepsToday]);

  const handleManualAdd = () => {
    const added = Number(manualInput);
    if (!added || added < 0) return;
    const newTotal = counter.steps + added;
    counter.setSteps(newTotal);
    setStepsToday(newTotal);
    syncStepsToServer(newTotal);
    setManualInput("");
    setShowManual(false);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600">
            <Activity size={34} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Steps Today</h2>
            {editingGoal ? (
              <div className="flex items-center gap-1 mt-0.5">
                <input
                  type="number"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  className="w-24 border border-emerald-300 rounded-xl px-2 py-1 text-sm font-bold text-emerald-800 focus:outline-none focus:border-emerald-500"
                  min={100}
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleGoalSave()}
                />
                <button
                  onClick={handleGoalSave}
                  className="p-1 rounded-lg bg-emerald-500 text-white"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => { setEditingGoal(false); setGoalInput(String(stepGoal)); }}
                  className="p-1 rounded-lg bg-slate-200 text-slate-600"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setEditingGoal(true); setGoalInput(String(stepGoal)); }}
                className="flex items-center gap-1 text-base text-slate-500 hover:text-emerald-600 transition-colors"
              >
                Goal: {GOAL.toLocaleString()} steps
                <Pencil size={12} className="opacity-60" />
              </button>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowManual((v) => !v)}
          className="p-2 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
          title="Add steps manually"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Big step count */}
      <div className="text-center mb-4">
        <p className="text-7xl font-black text-emerald-700">
          {counter.steps.toLocaleString()}
        </p>
        <p className="text-lg text-slate-500 font-medium">steps</p>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-4 bg-emerald-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="flex justify-between text-sm text-slate-500 mt-1">
          <span>{progress.toFixed(0)}% of goal</span>
          <span>{Math.max(0, GOAL - counter.steps).toLocaleString()} to go</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-emerald-50 rounded-2xl p-3 text-center">
          <p className="text-2xl font-black text-emerald-800">{calories}</p>
          <p className="text-sm text-emerald-600 font-medium">Calories burned</p>
        </div>
        <div className="bg-blue-50 rounded-2xl p-3 text-center">
          <p className="text-2xl font-black text-blue-800">{distanceKm} km</p>
          <p className="text-sm text-blue-600 font-medium">Distance walked</p>
        </div>
      </div>

      {/* Status & Controls */}
      {counter.state === "no-sensor" ? (
        <div className="bg-amber-50 rounded-2xl p-4 flex items-center gap-3 mb-4">
          <Smartphone size={22} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm font-medium text-amber-800">
            Motion sensor not available on this device. Use manual input to add steps.
          </p>
        </div>
      ) : counter.state === "permission-denied" ? (
        <div className="bg-rose-50 rounded-2xl p-4 mb-4">
          <p className="text-sm font-medium text-rose-800">
            Motion sensor permission denied. Please allow it in your device settings.
          </p>
        </div>
      ) : (
        <div className="flex gap-3 mb-4">
          {counter.state !== "active" ? (
            <button
              onClick={counter.start}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-bold text-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Play size={22} fill="white" /> Start Walking
            </button>
          ) : (
            <button
              onClick={counter.pause}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-4 rounded-2xl font-bold text-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Pause size={22} fill="white" /> Pause
            </button>
          )}
          <button
            onClick={() => {
              counter.reset();
              setStepsToday(0);
              syncStepsToServer(0);
            }}
            className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-5 py-4 rounded-2xl font-bold transition-colors"
          >
            <RotateCcw size={22} />
          </button>
        </div>
      )}

      {counter.state === "active" && (
        <div className="bg-emerald-50 rounded-2xl p-3 flex items-center gap-2 mb-4">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
          <p className="text-base font-bold text-emerald-700">Counting your steps…</p>
        </div>
      )}

      {/* Manual input */}
      <AnimatePresence>
        {showManual && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 border-t border-slate-100 flex gap-2">
              <input
                type="number"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Add steps manually"
                min={1}
                className="flex-1 border-2 border-emerald-200 rounded-2xl px-4 py-3 text-lg focus:border-emerald-400 focus:outline-none"
              />
              <button
                onClick={handleManualAdd}
                disabled={!manualInput || Number(manualInput) <= 0}
                className="bg-emerald-600 text-white px-5 rounded-2xl font-bold disabled:bg-slate-200 transition-colors"
              >
                Add
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weekly chart */}
      {stepsHistory.length > 0 && (
        <div className="mt-5">
          <h3 className="text-base font-bold text-slate-600 mb-3">This Week</h3>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stepsHistory}
                margin={{ top: 0, right: 0, left: -25, bottom: 0 }}
              >
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 13 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "#f0fdf4" }}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    fontSize: "14px",
                  }}
                  formatter={(v: number) => [v.toLocaleString(), "Steps"]}
                />
                <ReferenceLine y={GOAL} stroke="#10b981" strokeDasharray="4 4" label="Goal" />
                <Bar dataKey="steps" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </motion.section>
  );
}

// ─── Blood Sugar Section ──────────────────────────────────────────────────────
function BloodSugarSection() {
  const { bloodSugarHistory } = useApp();
  const [showModal, setShowModal] = useState(false);

  const latest = bloodSugarHistory[bloodSugarHistory.length - 1];
  const prev = bloodSugarHistory[bloodSugarHistory.length - 2];
  const trend = latest && prev
    ? latest.value - prev.value
    : null;

  const chartData = bloodSugarHistory.slice(-10).map((e) => ({
    time: format(new Date(e.timestamp), "MM/dd HH:mm"),
    value: e.value,
  }));

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-rose-100 p-3 rounded-2xl text-rose-600">
            <Droplet size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Blood Sugar</h2>
            {latest && (
              <p className="text-sm text-slate-400">
                <Clock size={12} className="inline mr-1" />
                {format(new Date(latest.timestamp), "MMM d, h:mm a")}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-3 rounded-2xl font-bold flex items-center gap-2 transition-colors text-base"
        >
          <Plus size={20} /> Log
        </button>
      </div>

      {latest ? (
        <>
          <div className="flex items-end gap-3 mb-3">
            <p className="text-6xl font-black text-rose-700">{latest.value}</p>
            <div className="mb-1">
              <p className="text-xl font-bold text-rose-400">mg/dL</p>
              {trend !== null && (
                <p
                  className={`text-base font-bold flex items-center gap-1 ${
                    trend > 0 ? "text-rose-500" : trend < 0 ? "text-emerald-500" : "text-slate-400"
                  }`}
                >
                  {trend > 0 ? (
                    <TrendingUp size={18} />
                  ) : trend < 0 ? (
                    <TrendingDown size={18} />
                  ) : (
                    <Minus size={18} />
                  )}
                  {Math.abs(trend)} from last
                </p>
              )}
            </div>
            <div className="ml-auto">
              <span
                className={`text-base font-bold px-3 py-1.5 rounded-full ${
                  getBSStatus(latest.value).bg
                } ${getBSStatus(latest.value).text}`}
              >
                {getBSStatus(latest.value).label}
              </span>
            </div>
          </div>

          {latest.note && (
            <p className="text-sm text-slate-500 italic mb-3">{latest.note}</p>
          )}

          {/* Reference ranges */}
          <div className="bg-slate-50 rounded-2xl p-3 mb-4 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="text-rose-500 font-bold">{"< 70"}</div>
              <div className="text-slate-500">Low</div>
            </div>
            <div>
              <div className="text-emerald-600 font-bold">70–99</div>
              <div className="text-slate-500">Normal</div>
            </div>
            <div>
              <div className="text-rose-500 font-bold">{"> 125"}</div>
              <div className="text-slate-500">High</div>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 1 && (
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "none", fontSize: "13px" }}
                    formatter={(v: number) => [v + " mg/dL", "Blood Sugar"]}
                  />
                  <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" />
                  <ReferenceLine y={126} stroke="#ef4444" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="value" stroke="#f43f5e" strokeWidth={2.5} dot={{ fill: "#f43f5e", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-xl font-bold text-slate-400">No readings yet</p>
          <p className="text-base text-slate-400 mt-1">Tap Log to add your first reading</p>
        </div>
      )}

      {/* History list */}
      {bloodSugarHistory.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <h3 className="text-base font-bold text-slate-600 mb-3">Recent Readings</h3>
          <div className="flex flex-col gap-2">
            {[...bloodSugarHistory].reverse().slice(0, 5).map((e) => {
              const s = getBSStatus(e.value);
              return (
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-slate-50">
                  <div>
                    <p className="text-base font-bold text-slate-700">{e.value} mg/dL</p>
                    {e.note && <p className="text-xs text-slate-400">{e.note}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>
                    <p className="text-xs text-slate-400">{format(new Date(e.timestamp), "MMM d, h:mm a")}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showModal && <BloodSugarModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </motion.section>
  );
}

// ─── Blood Pressure Section ───────────────────────────────────────────────────
function BloodPressureSection() {
  const { bpHistory } = useApp();
  const [showModal, setShowModal] = useState(false);

  const latest = bpHistory[bpHistory.length - 1];
  const chartData = bpHistory.slice(-10).map((e) => ({
    time: format(new Date(e.timestamp), "MM/dd HH:mm"),
    systolic: e.systolic,
    diastolic: e.diastolic,
  }));

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-purple-100 p-3 rounded-2xl text-purple-600">
            <Heart size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Blood Pressure</h2>
            {latest && (
              <p className="text-sm text-slate-400">
                <Clock size={12} className="inline mr-1" />
                {format(new Date(latest.timestamp), "MMM d, h:mm a")}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-2xl font-bold flex items-center gap-2 transition-colors text-base"
        >
          <Plus size={20} /> Log
        </button>
      </div>

      {latest ? (
        <>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-6xl font-black text-purple-800">
                {latest.systolic}
                <span className="text-4xl text-purple-400">/{latest.diastolic}</span>
              </p>
              <p className="text-xl font-bold text-purple-400">mmHg</p>
              {latest.pulse && (
                <p className="text-base text-slate-500 mt-1">
                  ❤️ Pulse: <strong>{latest.pulse} bpm</strong>
                </p>
              )}
            </div>
            <span
              className={`text-base font-bold px-3 py-1.5 rounded-full ${
                getBPStatus(latest.systolic, latest.diastolic).bg
              } ${getBPStatus(latest.systolic, latest.diastolic).text}`}
            >
              {getBPStatus(latest.systolic, latest.diastolic).label}
            </span>
          </div>

          {latest.note && (
            <p className="text-sm text-slate-500 italic mb-3">{latest.note}</p>
          )}

          {/* Reference ranges */}
          <div className="bg-slate-50 rounded-2xl p-3 mb-4 grid grid-cols-2 gap-2 text-center text-xs">
            <div>
              <div className="text-emerald-600 font-bold">{"< 120/80"}</div>
              <div className="text-slate-500">Normal</div>
            </div>
            <div>
              <div className="text-rose-500 font-bold">{"≥ 140/90"}</div>
              <div className="text-slate-500">Stage 2 HTN</div>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 1 && (
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} domain={[40, 200]} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "none", fontSize: "13px" }}
                    formatter={(v: number, name: string) => [v + " mmHg", name === "systolic" ? "Systolic" : "Diastolic"]}
                  />
                  <ReferenceLine y={120} stroke="#f59e0b" strokeDasharray="3 3" />
                  <ReferenceLine y={140} stroke="#ef4444" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="systolic" stroke="#7c3aed" strokeWidth={2.5} dot={{ fill: "#7c3aed", r: 4 }} />
                  <Line type="monotone" dataKey="diastolic" stroke="#a78bfa" strokeWidth={2} dot={{ fill: "#a78bfa", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-xl font-bold text-slate-400">No readings yet</p>
          <p className="text-base text-slate-400 mt-1">Tap Log to add your first reading</p>
        </div>
      )}

      {/* History list */}
      {bpHistory.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <h3 className="text-base font-bold text-slate-600 mb-3">Recent Readings</h3>
          <div className="flex flex-col gap-2">
            {[...bpHistory].reverse().slice(0, 5).map((e) => {
              const s = getBPStatus(e.systolic, e.diastolic);
              return (
                <div key={e.id} className="flex items-center justify-between py-2 border-b border-slate-50">
                  <div>
                    <p className="text-base font-bold text-slate-700">
                      {e.systolic}/{e.diastolic} mmHg
                      {e.pulse ? <span className="text-slate-400 text-sm ml-2">· {e.pulse} bpm</span> : null}
                    </p>
                    {e.note && <p className="text-xs text-slate-400">{e.note}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>
                    <p className="text-xs text-slate-400">{format(new Date(e.timestamp), "MMM d, h:mm a")}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showModal && <BloodPressureModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </motion.section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function Vitals() {
  return (
    <div className="flex flex-col gap-6 pb-6">
      <StepsSection />
      <BloodSugarSection />
      <BloodPressureSection />
    </div>
  );
}