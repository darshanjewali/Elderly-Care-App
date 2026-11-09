import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  X,
  Clock,
  Pill,
  Loader2,
  ChevronDown,
  Volume2,
  VolumeX,
  BarChart3,
  History,
  CalendarCheck,
  Download,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  Medication,
  MedHistoryEntry,
  TimeSlot,
  TIME_SLOT_LABELS,
  TIME_SLOT_DEFAULTS,
  PILL_COLORS,
  RELATIONSHIP_EMOJIS,
} from "../utils/types";
import { LANGUAGES, stopSpeaking } from "../utils/voice";
import { api, todayDate } from "../utils/api";
import { ModalPortal } from "../components/ModalPortal";

const TIME_SLOT_ICONS: Record<TimeSlot, string> = {
  morning: "🌅",
  afternoon: "☀️",
  evening: "🌆",
  night: "🌙",
};

const SLOT_COLORS: Record<TimeSlot, string> = {
  morning: "#f59e0b",
  afternoon: "#3b82f6",
  evening: "#8b5cf6",
  night: "#1e293b",
};

// ── PDF Generator ──────────────────────────────────────────────────────────────
async function downloadSummaryPDF(
  medications: Medication[],
  takenToday: string[],
  memberName: string
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const takenCount = medications.filter((m) => takenToday.includes(m.id)).length;
  const totalCount = medications.length;
  const pct = totalCount === 0 ? 0 : Math.round((takenCount / totalCount) * 100);
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  // ── Header band ──
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 0, 210, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("💊 Medication Summary", 15, 15);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Patient: ${memberName}   |   Date: ${today}`, 15, 25);

  // ── Progress section ──
  let y = 44;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(`Overall Progress: ${takenCount} of ${totalCount} taken (${pct}%)`, 15, y);
  y += 7;

  // Progress bar background
  doc.setFillColor(226, 232, 240);
  doc.roundedRect(15, y, 180, 7, 3, 3, "F");
  // Progress bar fill
  if (pct > 0) {
    const fillColor = pct === 100 ? [34, 197, 94] : pct >= 50 ? [59, 130, 246] : [245, 158, 11];
    doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
    doc.roundedRect(15, y, 180 * (pct / 100), 7, 3, 3, "F");
  }
  y += 14;

  // Stats row
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(15, y, 56, 14, 3, 3, "F");
  doc.setTextColor(22, 163, 74);
  doc.setFont("helvetica", "bold");
  doc.text(`✓ ${takenCount} Consumed`, 19, y + 9);

  doc.setFillColor(255, 251, 235);
  doc.roundedRect(77, y, 56, 14, 3, 3, "F");
  doc.setTextColor(217, 119, 6);
  doc.text(`⏳ ${totalCount - takenCount} Remaining`, 81, y + 9);

  doc.setFillColor(239, 246, 255);
  doc.roundedRect(139, y, 56, 14, 3, 3, "F");
  doc.setTextColor(37, 99, 235);
  doc.text(`📋 ${totalCount} Total`, 143, y + 9);
  y += 22;

  // ── Medication table by time slot ──
  const slots: TimeSlot[] = ["morning", "afternoon", "evening", "night"];
  const slotBgColors: Record<TimeSlot, [number, number, number]> = {
    morning:   [245, 158, 11],
    afternoon: [59,  130, 246],
    evening:   [139, 92,  246],
    night:     [30,  41,  59],
  };

  for (const slot of slots) {
    const meds = medications.filter((m) => m.timeSlot === slot);
    if (meds.length === 0) continue;

    const slotTaken = meds.filter((m) => takenToday.includes(m.id)).length;

    // Slot header
    const [r, g, b] = slotBgColors[slot];
    doc.setFillColor(r, g, b);
    doc.roundedRect(15, y, 180, 10, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(
      `${TIME_SLOT_ICONS[slot]}  ${TIME_SLOT_LABELS[slot]}  —  ${TIME_SLOT_DEFAULTS[slot]}`,
      20, y + 7
    );
    doc.text(`${slotTaken}/${meds.length}`, 185, y + 7, { align: "right" });
    y += 13;

    // Column headers
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "bold");
    doc.text("MEDICATION", 18, y);
    doc.text("DOSAGE", 85, y);
    doc.text("TYPE", 125, y);
    doc.text("SCHEDULED", 152, y);
    doc.text("STATUS", 178, y);
    y += 3;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(15, y, 195, y);
    y += 5;

    // Rows
    for (const med of meds) {
      const isTaken = takenToday.includes(med.id);
      const colorEntry = PILL_COLORS.find((c) => c.value === med.pillColor);

      // Row background for taken
      if (isTaken) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, y - 4, 180, 9, "F");
      }

      doc.setFontSize(10);
      doc.setFont("helvetica", isTaken ? "normal" : "bold");
      doc.setTextColor(isTaken ? 148 : 30, isTaken ? 163 : 41, isTaken ? 175 : 59);
      doc.text(med.name.substring(0, 28), 18, y);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(med.dosage.substring(0, 14), 85, y);
      doc.text(med.pillType, 125, y);
      doc.text(med.scheduledTime, 152, y);

      // Status
      if (isTaken) {
        doc.setTextColor(22, 163, 74);
        doc.setFont("helvetica", "bold");
        doc.text("✓ Taken", 178, y);
      } else {
        doc.setTextColor(217, 119, 6);
        doc.setFont("helvetica", "bold");
        doc.text("Pending", 178, y);
      }

      // Pill color dot (as text approximation)
      const hex = med.pillColor.replace("#", "");
      const pr = parseInt(hex.substring(0, 2), 16);
      const pg = parseInt(hex.substring(2, 4), 16);
      const pb = parseInt(hex.substring(4, 6), 16);
      doc.setFillColor(pr, pg, pb);
      doc.circle(82, y - 2, 1.5, "F");

      y += 9;

      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    }

    y += 4;
  }

  // ── Footer ──
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 175);
    doc.setFont("helvetica", "normal");
    doc.text("Generated by Health Tracker App", 15, 290);
    doc.text(
      `Page ${p} of ${pageCount}  |  ${new Date().toLocaleString()}`,
      195, 290, { align: "right" }
    );
  }

  const fileName = `medications-${memberName.toLowerCase().replace(/\s+/g, "-")}-${todayDate()}.pdf`;
  doc.save(fileName);
}

// ── Pill visual ────────────────────────────────────────────────────────────────
function PillIcon({ color, taken }: { color: string; taken: boolean }) {
  const c = taken ? "#94a3b8" : color;
  return (
    <div
      className="w-14 h-14 rounded-full flex items-center justify-center border-4 shadow-sm flex-shrink-0"
      style={{ backgroundColor: c + "22", borderColor: c + "55" }}
    >
      <Pill size={26} style={{ color: c }} />
    </div>
  );
}

// ── Medication Summary Modal ───────────────────────────────────────────────────
function SummaryModal({ onClose }: { onClose: () => void }) {
  const { medications, takenToday, currentMember } = useApp();
  const [downloading, setDownloading] = useState(false);

  const takenCount = medications.filter((m) => takenToday.includes(m.id)).length;
  const totalCount = medications.length;
  const progressPct = totalCount === 0 ? 0 : Math.round((takenCount / totalCount) * 100);

  const grouped: Record<TimeSlot, Medication[]> = {
    morning:   medications.filter((m) => m.timeSlot === "morning"),
    afternoon: medications.filter((m) => m.timeSlot === "afternoon"),
    evening:   medications.filter((m) => m.timeSlot === "evening"),
    night:     medications.filter((m) => m.timeSlot === "night"),
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadSummaryPDF(medications, takenToday, currentMember.name);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setDownloading(false);
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
          className="bg-white rounded-t-3xl w-full max-w-md p-6 pb-10 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">📊 Medication Summary</h2>
              <p className="text-sm text-slate-500 mt-0.5">{currentMember.name}'s today report</p>
            </div>
            <div className="flex items-center gap-2">
              {/* PDF Download */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleDownload}
                disabled={downloading || totalCount === 0}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-3 py-2 rounded-xl font-bold text-sm transition-colors"
              >
                {downloading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                {downloading ? "…" : "PDF"}
              </motion.button>
              <button onClick={onClose} className="p-2 rounded-full bg-slate-100 hover:bg-slate-200">
                <X size={22} />
              </button>
            </div>
          </div>

          {/* Progress Overview */}
          <div
            className={`rounded-2xl p-4 mb-5 ${
              progressPct === 100
                ? "bg-emerald-50 border-2 border-emerald-300"
                : progressPct >= 50
                ? "bg-blue-50 border-2 border-blue-200"
                : "bg-amber-50 border-2 border-amber-200"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-bold text-slate-700">Today's Progress</span>
              <span
                className={`text-2xl font-black ${
                  progressPct === 100 ? "text-emerald-600" : progressPct >= 50 ? "text-blue-600" : "text-amber-600"
                }`}
              >
                {progressPct}%
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-4 mb-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-4 rounded-full ${
                  progressPct === 100 ? "bg-emerald-500" : progressPct >= 50 ? "bg-blue-500" : "bg-amber-500"
                }`}
              />
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span className="text-emerald-700 flex items-center gap-1">
                <CheckCircle2 size={18} /> {takenCount} Consumed
              </span>
              <span className="text-slate-500 flex items-center gap-1">
                <Circle size={18} /> {totalCount - takenCount} Remaining
              </span>
            </div>
          </div>

          {/* Grouped by time slot */}
          {totalCount === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Pill size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-lg font-medium">No medications scheduled</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {(["morning", "afternoon", "evening", "night"] as TimeSlot[]).map((slot) => {
                const meds = grouped[slot];
                if (meds.length === 0) return null;
                const slotTaken = meds.filter((m) => takenToday.includes(m.id)).length;
                return (
                  <div key={slot}>
                    <div
                      className="flex items-center justify-between px-3 py-2 rounded-xl mb-2"
                      style={{ backgroundColor: SLOT_COLORS[slot] + "18" }}
                    >
                      <span className="font-bold text-base" style={{ color: SLOT_COLORS[slot] }}>
                        {TIME_SLOT_ICONS[slot]} {TIME_SLOT_LABELS[slot]}
                        <span className="text-sm font-normal ml-2 opacity-70">
                          {TIME_SLOT_DEFAULTS[slot]}
                        </span>
                      </span>
                      <span className="text-sm font-bold" style={{ color: SLOT_COLORS[slot] }}>
                        {slotTaken}/{meds.length}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {meds.map((med) => {
                        const taken = takenToday.includes(med.id);
                        const colorEntry = PILL_COLORS.find((c) => c.value === med.pillColor);
                        return (
                          <div
                            key={med.id}
                            className={`flex items-center gap-3 p-3 rounded-2xl border ${
                              taken ? "bg-slate-50 border-slate-100 opacity-70" : "bg-white border-slate-200"
                            }`}
                          >
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: (taken ? "#94a3b8" : med.pillColor) + "22",
                                border: `2px solid ${taken ? "#94a3b8" : med.pillColor}55`,
                              }}
                            >
                              <Pill size={18} style={{ color: taken ? "#94a3b8" : med.pillColor }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`font-bold text-base truncate ${
                                  taken ? "text-slate-400 line-through" : "text-slate-800"
                                }`}
                              >
                                {med.name}
                              </p>
                              <p className="text-sm text-slate-500 flex items-center gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: med.pillColor }}
                                />
                                {med.dosage} · {colorEntry?.label} {med.pillType}
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              {taken ? (
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-bold rounded-xl">
                                  ✓ Taken
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-bold rounded-xl">
                                  Pending
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer stats */}
          {totalCount > 0 && (
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="bg-emerald-50 rounded-2xl p-3 text-center">
                <p className="text-2xl font-black text-emerald-600">{takenCount}</p>
                <p className="text-xs font-semibold text-emerald-700">Consumed</p>
              </div>
              <div className="bg-amber-50 rounded-2xl p-3 text-center">
                <p className="text-2xl font-black text-amber-600">{totalCount - takenCount}</p>
                <p className="text-xs font-semibold text-amber-700">Remaining</p>
              </div>
              <div className="bg-blue-50 rounded-2xl p-3 text-center">
                <p className="text-2xl font-black text-blue-600">{totalCount}</p>
                <p className="text-xs font-semibold text-blue-700">Total</p>
              </div>
            </div>
          )}

          {/* Download hint */}
          {totalCount > 0 && (
            <p className="text-center text-xs text-slate-400 mt-4">
              Tap <strong>PDF</strong> to download a printable copy
            </p>
          )}
        </motion.div>
      </motion.div>
    </ModalPortal>
  );
}

// ── Medication History View ────────────────────────────────────────────────────
function HistoryView({ memberId }: { memberId: string }) {
  const [history, setHistory] = useState<MedHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .getMedHistory(memberId)
      .then((data) => {
        const sorted = [...(data as MedHistoryEntry[])].sort(
          (a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime()
        );
        setHistory(sorted);
      })
      .catch((err) => {
        console.error("Error loading med history:", err);
        setError("Could not load history.");
      })
      .finally(() => setLoading(false));
  }, [memberId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
        <Loader2 size={36} className="animate-spin text-blue-400" />
        <p className="text-lg font-medium">Loading history…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <p className="text-lg font-medium text-rose-500">{error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16 gap-4 text-center"
      >
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center">
          <History size={40} className="text-slate-300" />
        </div>
        <p className="text-2xl font-bold text-slate-600">No history yet</p>
        <p className="text-lg text-slate-400">Mark medications as taken to build your history</p>
      </motion.div>
    );
  }

  const grouped = history.reduce<Record<string, MedHistoryEntry[]>>((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {});

  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const formatDate = (dateStr: string) => {
    const today = todayDate();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    if (dateStr === today) return "Today";
    if (dateStr === yesterdayStr) return "Yesterday";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
  };

  const formatTime = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-4 text-white">
        <p className="text-base font-semibold opacity-80 mb-1">Total Medications Taken</p>
        <p className="text-4xl font-black">{history.length}</p>
        <p className="text-sm opacity-70 mt-1">
          across {dates.length} day{dates.length !== 1 ? "s" : ""}
        </p>
      </div>

      {dates.map((date) => {
        const entries = grouped[date];
        return (
          <motion.div key={date} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 rounded-xl px-3 py-1.5">
                <p className="text-sm font-bold text-blue-700">{formatDate(date)}</p>
              </div>
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-sm text-slate-400 font-medium">{entries.length} taken</span>
            </div>

            {entries.map((entry) => {
              const colorEntry = PILL_COLORS.find((c) => c.value === entry.pillColor);
              return (
                <div key={entry.id} className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 p-3 shadow-sm">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: entry.pillColor + "22", border: `2px solid ${entry.pillColor}55` }}
                  >
                    <Pill size={22} style={{ color: entry.pillColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-base truncate">{entry.medName}</p>
                    <p className="text-sm text-slate-500 flex items-center gap-1.5 flex-wrap">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.pillColor }} />
                      {entry.dosage}
                      <span className="text-slate-300">·</span>
                      <span className="capitalize">{colorEntry?.label ?? ""} {entry.pillType}</span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span
                      className="text-xs font-bold px-2 py-1 rounded-lg"
                      style={{ backgroundColor: SLOT_COLORS[entry.timeSlot] + "18", color: SLOT_COLORS[entry.timeSlot] }}
                    >
                      {TIME_SLOT_ICONS[entry.timeSlot]} {TIME_SLOT_LABELS[entry.timeSlot]}
                    </span>
                    <span className="text-xs text-slate-400">{formatTime(entry.takenAt)}</span>
                  </div>
                </div>
              );
            })}
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Add Medication Modal ────────────────────────────────────────────────────────
function AddMedicationModal({ onClose }: { onClose: () => void }) {
  const { addMedication } = useApp();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    dosage: "",
    timeSlot: "morning" as TimeSlot,
    scheduledTime: "08:00",
    pillColor: "#3b82f6",
    pillType: "tablet" as "tablet" | "capsule" | "liquid",
    notes: "",
  });

  const handleSlotChange = (slot: TimeSlot) => {
    setForm((f) => ({ ...f, timeSlot: slot, scheduledTime: TIME_SLOT_DEFAULTS[slot] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.dosage.trim()) return;
    setSaving(true);
    try {
      await addMedication(form);
      onClose();
    } catch {
      /* handled in context */
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
          className="bg-white rounded-t-3xl w-full max-w-md p-6 pb-10 max-h-[92vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-bold text-slate-800">Add Medication</h2>
            <button onClick={onClose} className="p-2 rounded-full bg-slate-100 hover:bg-slate-200">
              <X size={22} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-base font-bold text-slate-700 mb-2">Medication Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g., Metformin, Aspirin"
                className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-lg focus:border-blue-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-base font-bold text-slate-700 mb-2">Dosage *</label>
              <input
                type="text"
                value={form.dosage}
                onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))}
                placeholder="e.g., 500mg, 1 tablet, 5ml"
                className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-lg focus:border-blue-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-base font-bold text-slate-700 mb-2">When to take it?</label>
              <div className="grid grid-cols-2 gap-2">
                {(["morning", "afternoon", "evening", "night"] as TimeSlot[]).map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => handleSlotChange(slot)}
                    className={`py-3 px-4 rounded-2xl font-bold text-base border-2 transition-all ${
                      form.timeSlot === slot
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-700 border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    {TIME_SLOT_ICONS[slot]} {TIME_SLOT_LABELS[slot]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-base font-bold text-slate-700 mb-2">
                <Clock size={16} className="inline mr-1" /> Scheduled Time
              </label>
              <input
                type="time"
                value={form.scheduledTime}
                onChange={(e) => setForm((f) => ({ ...f, scheduledTime: e.target.value }))}
                className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-lg focus:border-blue-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-base font-bold text-slate-700 mb-2">Type</label>
              <div className="flex gap-2">
                {["tablet", "capsule", "liquid"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, pillType: type as any }))}
                    className={`flex-1 py-2.5 rounded-xl font-semibold capitalize border-2 text-sm transition-all ${
                      form.pillType === type
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-600 border-slate-200"
                    }`}
                  >
                    {type === "tablet" ? "💊" : type === "capsule" ? "💉" : "🧴"} {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-base font-bold text-slate-700 mb-2">Pill Color</label>
              <div className="flex flex-wrap gap-3">
                {PILL_COLORS.map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, pillColor: value }))}
                    title={label}
                    className={`w-10 h-10 rounded-full border-4 transition-all ${
                      form.pillColor === value ? "border-slate-700 scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: value }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-base font-bold text-slate-700 mb-2">Notes (optional)</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="e.g., Take with food, Avoid grapefruit"
                rows={2}
                className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-base focus:border-blue-400 focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving || !form.name.trim() || !form.dosage.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-5 rounded-2xl font-bold text-xl transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <><Loader2 size={22} className="animate-spin" /> Saving…</>
              ) : (
                <><Plus size={22} /> Add Medication</>
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </ModalPortal>
  );
}

// ── Voice Button ───────────────────────────────────────────────────────────────
function VoiceButton({ med }: { med: Medication }) {
  const { speakMedication, selectedLanguage } = useApp();
  const [speaking, setSpeaking] = useState(false);
  const currentLang = LANGUAGES.find((l) => l.code === selectedLanguage);

  const handleSpeak = useCallback(
    (e: React.MouseEvent) => {
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
      title={`Speak in ${currentLang?.nativeName ?? "English"}`}
      className={`p-2.5 rounded-xl transition-all flex-shrink-0 ${
        speaking
          ? "bg-blue-100 text-blue-600 ring-2 ring-blue-300"
          : "bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-500"
      }`}
    >
      {speaking ? (
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>
          <Volume2 size={20} />
        </motion.div>
      ) : (
        <VolumeX size={20} />
      )}
    </motion.button>
  );
}

// ── Medication Card ────────────────────────────────────────────────────────────
function MedCard({
  med, taken, onToggle, onDelete,
}: {
  med: Medication; taken: boolean; onToggle: () => void; onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const colorEntry = PILL_COLORS.find((c) => c.value === med.pillColor);

  return (
    <div
      className={`rounded-3xl border-2 transition-all overflow-hidden ${
        taken ? "bg-slate-50 border-slate-200 opacity-80" : "bg-white border-slate-200 shadow-md"
      }`}
    >
      <div className="flex items-center gap-3 p-4">
        <PillIcon color={med.pillColor} taken={taken} />
        <button onClick={onToggle} className="flex-1 text-left min-w-0">
          <h3 className={`text-xl font-bold truncate ${taken ? "text-slate-400 line-through" : "text-slate-800"}`}>
            {med.name}
          </h3>
          <p className={`text-base font-semibold ${taken ? "text-slate-400" : "text-blue-600"}`}>{med.dosage}</p>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: med.pillColor }} />
            {colorEntry?.label ?? ""} {med.pillType}
            {med.notes ? ` · ${med.notes}` : ""}
          </p>
        </button>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <VoiceButton med={med} />
          <button onClick={() => setExpanded((v) => !v)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors">
            <ChevronDown size={18} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
          <button onClick={onToggle}>
            {taken ? (
              <CheckCircle2 size={38} className="text-emerald-500" />
            ) : (
              <Circle size={38} className="text-slate-300 hover:text-blue-300 transition-colors" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-slate-500 space-y-0.5">
                  <p className="flex items-center gap-1.5">
                    <Clock size={14} />
                    <span className="font-medium">{med.scheduledTime}</span>
                    <span>·</span>
                    <span className="capitalize">{med.pillType}</span>
                  </p>
                  {med.notes && <p className="italic text-slate-400">{med.notes}</p>}
                </div>
                <button
                  onClick={onDelete}
                  className="flex items-center gap-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 px-3 py-2 rounded-xl font-bold text-sm transition-colors"
                >
                  <Trash2 size={15} /> Remove
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Schedule View ──────────────────────────────────────────────────────────────
function ScheduleView({ onAddClick }: { onAddClick: () => void }) {
  const { medications, takenToday, toggleTaken, deleteMedication, loadingMeds, currentMember, selectedLanguage } = useApp();
  const currentLang = LANGUAGES.find((l) => l.code === selectedLanguage);
  const pendingCount = medications.filter((m) => !takenToday.includes(m.id)).length;

  const grouped = {
    morning:   medications.filter((m) => m.timeSlot === "morning"),
    afternoon: medications.filter((m) => m.timeSlot === "afternoon"),
    evening:   medications.filter((m) => m.timeSlot === "evening"),
    night:     medications.filter((m) => m.timeSlot === "night"),
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Member + voice language info bar */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-3 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0"
            style={{ backgroundColor: currentMember.avatarColor + "20", border: `2px solid ${currentMember.avatarColor}` }}
          >
            {RELATIONSHIP_EMOJIS[currentMember.relationship] ?? "👥"}
          </span>
          <div>
            <p className="text-sm font-bold text-slate-700">{currentMember.name}'s Medications</p>
            <p className="text-xs text-slate-400">{loadingMeds ? "Loading…" : `${medications.length} scheduled`}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 rounded-xl">
          <Volume2 size={14} className="text-blue-500" />
          <span className="text-sm font-bold text-blue-600">{currentLang?.flag} {currentLang?.nativeName}</span>
        </div>
      </div>

      {/* Summary banner */}
      <div className={`border-l-4 p-4 rounded-r-2xl ${pendingCount === 0 && medications.length > 0 ? "bg-emerald-50 border-emerald-500" : "bg-blue-50 border-blue-500"}`}>
        {loadingMeds ? (
          <p className="text-xl text-slate-500 font-medium flex items-center gap-2"><Loader2 size={18} className="animate-spin" /> Loading…</p>
        ) : medications.length === 0 ? (
          <p className="text-xl text-blue-900 font-medium">No medications yet. Tap <strong>+</strong> to add one.</p>
        ) : pendingCount === 0 ? (
          <p className="text-xl text-emerald-900 font-bold">✅ All medications taken for today!</p>
        ) : (
          <p className="text-xl text-blue-900 font-medium">
            <strong className="font-bold">{pendingCount}</strong>{" "}
            medication{pendingCount > 1 ? "s" : ""} left today. Tap 🔊 to hear a reminder.
          </p>
        )}
      </div>

      {/* Grouped by time slot */}
      {(["morning", "afternoon", "evening", "night"] as TimeSlot[]).map((slot) => {
        const meds = grouped[slot];
        if (meds.length === 0) return null;
        return (
          <motion.div key={slot} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-3">
            <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2">
              <span className="py-1.5 px-4 rounded-xl text-white text-base" style={{ backgroundColor: SLOT_COLORS[slot] }}>
                {TIME_SLOT_ICONS[slot]} {TIME_SLOT_LABELS[slot]} · {TIME_SLOT_DEFAULTS[slot]}
              </span>
            </h2>
            <div className="flex flex-col gap-3">
              {meds.map((med) => (
                <MedCard
                  key={med.id}
                  med={med}
                  taken={takenToday.includes(med.id)}
                  onToggle={() => toggleTaken(med.id)}
                  onDelete={() => deleteMedication(med.id)}
                />
              ))}
            </div>
          </motion.div>
        );
      })}

      {/* Empty state */}
      {medications.length === 0 && !loadingMeds && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center">
            <Pill size={44} className="text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-slate-600">No medications yet</p>
          <p className="text-lg text-slate-400">
            Add {currentMember.name === "Me" ? "your" : `${currentMember.name}'s`} first medication below
          </p>
        </motion.div>
      )}

      {/* FAB — rendered outside transformed contexts */}
      <button
        onClick={onAddClick}
        className="fixed bottom-24 right-6 w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xl flex items-center justify-center z-30 transition-colors"
        style={{ position: "fixed" }}
      >
        <Plus size={30} />
      </button>
    </div>
  );
}

// ── Main Medications Page ──────────────────────────────────────────────────────
export function Medications() {
  const { currentMemberId, medications, takenToday } = useApp();
  const [activeTab, setActiveTab] = useState<"schedule" | "history">("schedule");
  const [showSummary, setShowSummary] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const takenCount = medications.filter((m) => takenToday.includes(m.id)).length;
  const totalCount = medications.length;

  return (
    <div className="flex flex-col gap-4 pb-10">
      {/* Tab bar + Summary button */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 flex-1">
          <button
            onClick={() => setActiveTab("schedule")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === "schedule" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <CalendarCheck size={16} /> Schedule
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === "history" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <History size={16} /> History
          </button>
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowSummary(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-2xl font-bold text-sm shadow-md transition-colors flex-shrink-0"
        >
          <BarChart3 size={16} />
          <span>{takenCount}/{totalCount}</span>
        </motion.button>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === "schedule" ? (
          <motion.div key="schedule" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.15 }}>
            <ScheduleView onAddClick={() => setShowModal(true)} />
          </motion.div>
        ) : (
          <motion.div key="history" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.15 }}>
            <HistoryView memberId={currentMemberId} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals rendered via portal - escapes all stacking/transform contexts */}
      <AnimatePresence>
        {showSummary && <SummaryModal onClose={() => setShowSummary(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showModal && <AddMedicationModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
