import { Link } from "react-router";
import {
  Pill,
  Activity,
  Watch,
  ChevronRight,
  AlertCircle,
  Droplet,
  Heart,
  Clock,
  CheckCircle2,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { format } from "date-fns";
import { motion } from "motion/react";
import { useApp } from "../context/AppContext";
import { useMemo, useState, useCallback } from "react";
import { TIME_SLOT_LABELS } from "../utils/types";
import { LANGUAGES, stopSpeaking } from "../utils/voice";

function getNextMedication(medications: any[], takenToday: string[]) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return (
    medications
      .filter((m) => !takenToday.includes(m.id))
      .map((m) => {
        const [h, min] = m.scheduledTime.split(":").map(Number);
        const totalMin = h * 60 + min;
        return { ...m, totalMin };
      })
      .sort((a, b) => {
        const aFuture = a.totalMin >= nowMinutes ? a.totalMin - nowMinutes : a.totalMin + 1440 - nowMinutes;
        const bFuture = b.totalMin >= nowMinutes ? b.totalMin - nowMinutes : b.totalMin + 1440 - nowMinutes;
        return aFuture - bFuture;
      })[0] ?? null
  );
}

function formatScheduledTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${m.toString().padStart(2, "0")} ${period}`;
}

function getBloodSugarStatus(value: number) {
  if (value < 70)   return { label: "Low",          color: "text-rose-600 bg-rose-100" };
  if (value <= 99)  return { label: "Normal",        color: "text-emerald-600 bg-emerald-100" };
  if (value <= 125) return { label: "Pre-diabetic",  color: "text-amber-600 bg-amber-100" };
  return               { label: "High",          color: "text-rose-600 bg-rose-100" };
}

function getBPStatus(systolic: number, diastolic: number) {
  if (systolic >= 140 || diastolic >= 90) return { label: "Stage 2", color: "text-rose-600 bg-rose-100" };
  if (systolic >= 130 || diastolic >= 80) return { label: "Stage 1", color: "text-orange-600 bg-orange-100" };
  if (systolic >= 120)                    return { label: "Elevated", color: "text-amber-600 bg-amber-100" };
  return                                  { label: "Normal",   color: "text-emerald-600 bg-emerald-100" };
}

// ── Voice Reminder Button (Dashboard) ─────────────────────────────────────────
function DashboardVoiceButton({ med }: { med: any }) {
  const { speakMedication, selectedLanguage } = useApp();
  const [speaking, setSpeaking] = useState(false);
  const currentLang = LANGUAGES.find((l) => l.code === selectedLanguage);

  const handleSpeak = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (speaking) {
        stopSpeaking();
        setSpeaking(false);
        return;
      }
      setSpeaking(true);
      speakMedication(med);
      const estimatedDuration = Math.max(3000, med.name.length * 100 + 4000);
      setTimeout(() => setSpeaking(false), estimatedDuration);
    },
    [speaking, speakMedication, med]
  );

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={handleSpeak}
      title={`Speak reminder in ${currentLang?.nativeName ?? "English"}`}
      className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-base transition-all border-2 ${
        speaking
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
      }`}
    >
      {speaking ? (
        <>
          <motion.div animate={{ scale: [1, 1.25, 1] }} transition={{ repeat: Infinity, duration: 0.7 }}>
            <Volume2 size={22} />
          </motion.div>
          <span>Speaking…</span>
        </>
      ) : (
        <>
          <VolumeX size={22} />
          <span>🔊 Remind Me {currentLang?.flag}</span>
        </>
      )}
    </motion.button>
  );
}

export function Dashboard() {
  const {
    medications,
    takenToday,
    bloodSugarHistory,
    bpHistory,
    stepsToday,
    stepGoal,
    notifPermission,
    requestNotifPermission,
    loadingMeds,
  } = useApp();

  const now = new Date();
  const nextMed = useMemo(() => getNextMedication(medications, takenToday), [medications, takenToday]);
  const latestBS = bloodSugarHistory[bloodSugarHistory.length - 1];
  const latestBP = bpHistory[bpHistory.length - 1];
  const pendingCount = medications.filter((m) => !takenToday.includes(m.id)).length;

  return (
    <div className="flex flex-col gap-5 pb-4">
      {/* Date + Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-slate-800">{format(now, "EEEE")}</p>
          <p className="text-lg text-slate-500">{format(now, "MMMM do, yyyy")}</p>
        </div>
        <button
          onClick={requestNotifPermission}
          className={`p-3 rounded-2xl transition-colors ${
            notifPermission === "granted"
              ? "bg-emerald-100 text-emerald-600"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
          title={notifPermission === "granted" ? "Reminders ON" : "Enable medication reminders"}
        >
          {notifPermission === "granted" ? <Bell size={26} /> : <BellOff size={26} />}
        </button>
      </div>

      {/* Medication Progress Banner */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className={`rounded-3xl p-5 border ${
          pendingCount === 0 && medications.length > 0
            ? "bg-emerald-50 border-emerald-200"
            : "bg-amber-50 border-amber-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2 rounded-full ${
              pendingCount === 0 && medications.length > 0
                ? "bg-emerald-500 text-white"
                : "bg-amber-500 text-white"
            }`}
          >
            {pendingCount === 0 && medications.length > 0 ? (
              <CheckCircle2 size={26} />
            ) : (
              <AlertCircle size={26} />
            )}
          </div>
          <div>
            {loadingMeds ? (
              <p className="text-xl font-bold text-slate-600">Loading medications…</p>
            ) : medications.length === 0 ? (
              <p className="text-xl font-bold text-slate-700">No medications added yet</p>
            ) : pendingCount === 0 ? (
              <p className="text-xl font-bold text-emerald-900">All medications taken today! 🎉</p>
            ) : (
              <p className="text-xl font-bold text-amber-900">
                {pendingCount} medication{pendingCount > 1 ? "s" : ""} left today
              </p>
            )}
          </div>
        </div>

        {/* Next Medication card with Voice button */}
        {nextMed && (
          <div className="mt-4 bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center border-4"
                  style={{
                    backgroundColor: nextMed.pillColor + "30",
                    borderColor: nextMed.pillColor + "40",
                  }}
                >
                  <Pill size={26} style={{ color: nextMed.pillColor }} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{nextMed.name}</h3>
                  <p className="text-base text-slate-500">{nextMed.dosage}</p>
                  <p className="text-sm font-medium text-slate-400">
                    {TIME_SLOT_LABELS[nextMed.timeSlot as keyof typeof TIME_SLOT_LABELS]}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <Clock size={18} className="text-amber-500 ml-auto mb-1" />
                <span className="text-xl font-bold text-amber-600">
                  {formatScheduledTime(nextMed.scheduledTime)}
                </span>
              </div>
            </div>

            {/* Voice Reminder button */}
            <DashboardVoiceButton med={nextMed} />
          </div>
        )}

        <Link
          to="/medications"
          className={`mt-4 flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-xl transition-colors ${
            pendingCount === 0 && medications.length > 0
              ? "bg-emerald-500 hover:bg-emerald-600 text-white"
              : "bg-amber-500 hover:bg-amber-600 text-white"
          }`}
        >
          View All Medications
        </Link>
      </motion.div>

      {/* Quick Vitals Grid */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-2 gap-4"
      >
        {/* Steps */}
        <Link to="/vitals" className="bg-emerald-50 p-5 rounded-3xl border border-emerald-200 block shadow-sm">
          <Activity className="text-emerald-600 mb-2" size={32} />
          <p className="text-sm font-semibold text-emerald-700">Steps Today</p>
          <p className="text-3xl font-black text-emerald-900 mt-1">{stepsToday.toLocaleString()}</p>
          <div className="mt-2 h-2 bg-emerald-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${Math.min(100, (stepsToday / stepGoal) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-emerald-600 mt-1">Goal: {stepGoal.toLocaleString()}</p>
        </Link>

        {/* Blood Sugar */}
        <Link to="/vitals" className="bg-rose-50 p-5 rounded-3xl border border-rose-200 block shadow-sm">
          <Droplet className="text-rose-600 mb-2" size={32} />
          <p className="text-sm font-semibold text-rose-700">Blood Sugar</p>
          {latestBS ? (
            <>
              <p className="text-3xl font-black text-rose-900 mt-1">
                {latestBS.value}
                <span className="text-base font-bold ml-1">mg/dL</span>
              </p>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
                  getBloodSugarStatus(latestBS.value).color
                }`}
              >
                {getBloodSugarStatus(latestBS.value).label}
              </span>
            </>
          ) : (
            <p className="text-lg font-bold text-rose-400 mt-1">No data yet</p>
          )}
        </Link>
      </motion.div>

      {/* Blood Pressure */}
      {latestBP && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Link
            to="/vitals"
            className="bg-purple-50 p-5 rounded-3xl border border-purple-200 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <Heart className="text-purple-600" size={32} />
              <div>
                <p className="text-sm font-semibold text-purple-700">Blood Pressure</p>
                <p className="text-3xl font-black text-purple-900">
                  {latestBP.systolic}
                  <span className="text-xl">/{latestBP.diastolic}</span>
                  <span className="text-base font-bold ml-1">mmHg</span>
                </p>
              </div>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${getBPStatus(latestBP.systolic, latestBP.diastolic).color}`}>
              {getBPStatus(latestBP.systolic, latestBP.diastolic).label}
            </span>
          </Link>
        </motion.div>
      )}

      {/* Watch Status */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Link
          to="/device"
          className="bg-blue-50 p-5 rounded-3xl border border-blue-200 flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-full text-blue-600">
              <Watch size={30} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Smart Watch</h3>
              <p className="text-slate-500 font-medium">Tap to connect via Bluetooth</p>
            </div>
          </div>
          <ChevronRight size={26} className="text-slate-400" />
        </Link>
      </motion.div>
    </div>
  );
}
