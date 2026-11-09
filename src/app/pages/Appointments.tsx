import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar,
  Plus,
  X,
  Clock,
  MapPin,
  Stethoscope,
  FileText,
  Loader2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Pencil,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { Appointment, AppointmentStatus, RELATIONSHIP_EMOJIS } from "../utils/types";
import { api, todayDate } from "../utils/api";
import { toast } from "sonner";
import { ModalPortal } from "../components/ModalPortal";

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; color: string; bg: string; icon: string }
> = {
  upcoming: { label: "Upcoming", color: "#3b82f6", bg: "#eff6ff", icon: "🗓️" },
  completed: { label: "Completed", color: "#22c55e", bg: "#f0fdf4", icon: "✅" },
  cancelled: { label: "Cancelled", color: "#ef4444", bg: "#fef2f2", icon: "❌" },
};

const SPECIALTIES = [
  "General Physician",
  "Cardiologist",
  "Diabetologist / Endocrinologist",
  "Neurologist",
  "Orthopedist",
  "Ophthalmologist",
  "Dermatologist",
  "Nephrologist",
  "Pulmonologist",
  "Gastroenterologist",
  "Dentist",
  "Physiotherapist",
  "Nutritionist",
  "Other",
];

// ── Format helpers ─────────────────────────────────────────────────────────────
function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  const today = todayDate();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (dateStr === today) return "Today";
  if (dateStr === tomorrowStr) return "Tomorrow";
  if (dateStr === yesterdayStr) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(timeStr: string): string {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 || 12;
  return `${displayH}:${String(m).padStart(2, "0")} ${ampm}`;
}

function getDaysUntil(dateStr: string): number {
  const today = new Date(todayDate() + "T00:00:00");
  const apptDate = new Date(dateStr + "T00:00:00");
  return Math.round((apptDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// ── Add / Edit Appointment Modal ───────────────────────────────────────────────
function AppointmentModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: Appointment;
  onClose: () => void;
  onSave: (data: Omit<Appointment, "id" | "createdAt">) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    doctorName: initial?.doctorName ?? "",
    specialty: initial?.specialty ?? "General Physician",
    date: initial?.date ?? "",
    time: initial?.time ?? "",
    location: initial?.location ?? "",
    notes: initial?.notes ?? "",
    status: (initial?.status ?? "upcoming") as AppointmentStatus,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.doctorName.trim() || !form.date) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch {
      /* handled upstream */
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
            <h2 className="text-2xl font-bold text-slate-800">
              {initial ? "✏️ Edit Appointment" : "➕ New Appointment"}
            </h2>
            <button onClick={onClose} className="p-2 rounded-full bg-slate-100 hover:bg-slate-200">
              <X size={22} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-base font-bold text-slate-700 mb-2">
                <Stethoscope size={15} className="inline mr-1" /> Doctor Name *
              </label>
              <input
                type="text"
                value={form.doctorName}
                onChange={(e) => setForm((f) => ({ ...f, doctorName: e.target.value }))}
                placeholder="e.g., Dr. Sharma, Dr. Patel"
                className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-lg focus:border-blue-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-base font-bold text-slate-700 mb-2">Specialty / Department</label>
              <select
                value={form.specialty}
                onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))}
                className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-base focus:border-blue-400 focus:outline-none bg-white"
              >
                {SPECIALTIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-base font-bold text-slate-700 mb-2">
                <Calendar size={15} className="inline mr-1" /> Appointment Date *
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-lg focus:border-blue-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-base font-bold text-slate-700 mb-2">
                <Clock size={15} className="inline mr-1" /> Appointment Time
              </label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-lg focus:border-blue-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-base font-bold text-slate-700 mb-2">
                <MapPin size={15} className="inline mr-1" /> Hospital / Clinic
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="e.g., Apollo Hospital, City Clinic"
                className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-base focus:border-blue-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-base font-bold text-slate-700 mb-2">Status</label>
              <div className="flex gap-2">
                {(["upcoming", "completed", "cancelled"] as AppointmentStatus[]).map((s) => {
                  const cfg = STATUS_CONFIG[s];
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, status: s }))}
                      className={`flex-1 py-2.5 rounded-xl font-semibold text-sm border-2 transition-all capitalize ${
                        form.status === s ? "border-current" : "bg-white text-slate-500 border-slate-200"
                      }`}
                      style={
                        form.status === s
                          ? { backgroundColor: cfg.bg, color: cfg.color, borderColor: cfg.color }
                          : {}
                      }
                    >
                      {cfg.icon} {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-base font-bold text-slate-700 mb-2">
                <FileText size={15} className="inline mr-1" /> Notes (optional)
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="e.g., Bring previous reports, Fasting required"
                rows={2}
                className="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-base focus:border-blue-400 focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving || !form.doctorName.trim() || !form.date}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white py-5 rounded-2xl font-bold text-xl transition-colors flex items-center justify-center gap-2"
            >
              {saving ? (
                <><Loader2 size={22} className="animate-spin" /> Saving…</>
              ) : (
                <><CheckCircle2 size={22} /> {initial ? "Update" : "Add"} Appointment</>
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </ModalPortal>
  );
}

// ── Appointment Card ───────────────────────────────────────────────────────────
function AppointmentCard({
  appt,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  appt: Appointment;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: AppointmentStatus) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[appt.status];
  const daysUntil = getDaysUntil(appt.date);
  const isToday = appt.date === todayDate();
  const isFuture = daysUntil > 0;

  return (
    <div
      className="bg-white rounded-3xl border-2 shadow-md overflow-hidden transition-all"
      style={{ borderColor: cfg.color + "40" }}
    >
      <div className="p-4">
        {/* Top row: doctor + status badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
              style={{ backgroundColor: cfg.bg }}
            >
              🩺
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-slate-800 truncate">{appt.doctorName}</h3>
              {appt.specialty && (
                <p className="text-sm font-semibold text-slate-500 truncate">{appt.specialty}</p>
              )}
            </div>
          </div>
          <span
            className="px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: cfg.bg, color: cfg.color }}
          >
            {cfg.icon} {cfg.label}
          </span>
        </div>

        {/* Date & Time row */}
        <div className="flex items-center gap-4 mb-2">
          <div className="flex items-center gap-2 text-slate-700">
            <Calendar size={16} className="text-blue-500" />
            <span className="font-bold text-base">{formatDisplayDate(appt.date)}</span>
          </div>
          {appt.time && (
            <div className="flex items-center gap-1.5 text-slate-600">
              <Clock size={15} className="text-slate-400" />
              <span className="font-semibold text-base">{formatTime(appt.time)}</span>
            </div>
          )}
        </div>

        {/* Days badge for upcoming */}
        {appt.status === "upcoming" && (
          <div className="mb-2">
            {isToday ? (
              <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-xl text-sm font-bold">
                <AlertCircle size={14} /> Appointment Today!
              </span>
            ) : isFuture ? (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1 rounded-xl text-sm font-semibold">
                📅 In {daysUntil} day{daysUntil !== 1 ? "s" : ""}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 px-3 py-1 rounded-xl text-sm font-semibold">
                ⏰ {Math.abs(daysUntil)} day{Math.abs(daysUntil) !== 1 ? "s" : ""} ago
              </span>
            )}
          </div>
        )}

        {/* Location */}
        {appt.location && (
          <div className="flex items-center gap-1.5 text-slate-500 text-sm mb-1">
            <MapPin size={14} className="text-slate-400 flex-shrink-0" />
            <span className="truncate">{appt.location}</span>
          </div>
        )}

        {/* Expand button */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1 text-slate-400 text-sm mt-2 hover:text-slate-600 transition-colors"
        >
          <ChevronDown
            size={16}
            className={`transition-transform ${expanded ? "rotate-180" : ""}`}
          />
          {expanded ? "Less" : "More options"}
        </button>
      </div>

      {/* Expanded actions */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-slate-100 flex flex-col gap-3">
              {/* Notes */}
              {appt.notes && (
                <div className="bg-slate-50 rounded-2xl p-3">
                  <p className="text-sm font-bold text-slate-600 mb-1 flex items-center gap-1">
                    <FileText size={13} /> Notes
                  </p>
                  <p className="text-sm text-slate-500 italic">{appt.notes}</p>
                </div>
              )}

              {/* Quick status change for upcoming */}
              {appt.status === "upcoming" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => onStatusChange("completed")}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 py-2.5 rounded-xl font-bold text-sm transition-colors"
                  >
                    <CheckCircle2 size={16} /> Mark Done
                  </button>
                  <button
                    onClick={() => onStatusChange("cancelled")}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-amber-100 text-amber-700 hover:bg-amber-200 py-2.5 rounded-xl font-bold text-sm transition-colors"
                  >
                    <X size={16} /> Cancel
                  </button>
                </div>
              )}

              {/* Edit / Delete */}
              <div className="flex gap-2">
                <button
                  onClick={onEdit}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 py-2.5 rounded-xl font-bold text-sm transition-colors"
                >
                  <Pencil size={15} /> Edit
                </button>
                <button
                  onClick={onDelete}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 py-2.5 rounded-xl font-bold text-sm transition-colors"
                >
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Appointments Page ─────────────────────────────────────────────────────
export function Appointments() {
  const { currentMemberId, currentMember } = useApp();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAppt, setEditingAppt] = useState<Appointment | undefined>(undefined);
  const [activeSection, setActiveSection] = useState<"upcoming" | "past">("upcoming");

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getAppointments(currentMemberId);
      setAppointments(data as Appointment[]);
    } catch (err) {
      console.error("Error loading appointments:", err);
      toast.error("Could not load appointments.");
    } finally {
      setLoading(false);
    }
  }, [currentMemberId]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleSave = useCallback(
    async (data: Omit<Appointment, "id" | "createdAt">) => {
      try {
        if (editingAppt) {
          const updated = (await api.updateAppointment(
            currentMemberId,
            editingAppt.id,
            data
          )) as Appointment;
          setAppointments((prev) => prev.map((a) => (a.id === editingAppt.id ? updated : a)));
          toast.success("Appointment updated!");
        } else {
          const created = (await api.createAppointment(currentMemberId, data)) as Appointment;
          setAppointments((prev) => [...prev, created]);
          toast.success(`Appointment with ${data.doctorName} added!`);
        }
        setEditingAppt(undefined);
      } catch (err) {
        console.error("Error saving appointment:", err);
        toast.error("Failed to save appointment.");
        throw err;
      }
    },
    [currentMemberId, editingAppt]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const appt = appointments.find((a) => a.id === id);
      try {
        await api.deleteAppointment(currentMemberId, id);
        setAppointments((prev) => prev.filter((a) => a.id !== id));
        toast.success(`Appointment with ${appt?.doctorName ?? "doctor"} removed.`);
      } catch (err) {
        console.error("Error deleting appointment:", err);
        toast.error("Failed to delete appointment.");
      }
    },
    [appointments, currentMemberId]
  );

  const handleStatusChange = useCallback(
    async (id: string, status: AppointmentStatus) => {
      try {
        const updated = (await api.updateAppointment(currentMemberId, id, { status })) as Appointment;
        setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
        toast.success(`Appointment marked as ${status}!`);
      } catch (err) {
        console.error("Error updating appointment status:", err);
        toast.error("Failed to update status.");
      }
    },
    [currentMemberId]
  );

  // Split appointments
  const today = todayDate();
  const upcoming = appointments
    .filter(
      (a) =>
        a.status === "upcoming" && a.date >= today
    )
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const past = appointments
    .filter((a) => a.status !== "upcoming" || a.date < today)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="flex flex-col gap-4 pb-10">
      {/* Member info bar */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-3 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg flex-shrink-0"
            style={{
              backgroundColor: currentMember.avatarColor + "20",
              border: `2px solid ${currentMember.avatarColor}`,
            }}
          >
            {RELATIONSHIP_EMOJIS[currentMember.relationship] ?? "👥"}
          </span>
          <div>
            <p className="text-sm font-bold text-slate-700">{currentMember.name}'s Appointments</p>
            <p className="text-xs text-slate-400">
              {loading ? "Loading…" : `${upcoming.length} upcoming · ${past.length} past`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 rounded-xl">
          <Calendar size={14} className="text-indigo-500" />
          <span className="text-sm font-bold text-indigo-600">{appointments.length} total</span>
        </div>
      </div>

      {/* Next appointment highlight */}
      {upcoming.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-5 text-white"
        >
          <p className="text-sm font-semibold opacity-80 mb-1">🔔 Next Appointment</p>
          <h2 className="text-2xl font-black mb-1">{upcoming[0].doctorName}</h2>
          {upcoming[0].specialty && (
            <p className="text-base font-semibold opacity-80 mb-2">{upcoming[0].specialty}</p>
          )}
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 bg-white/20 rounded-xl px-3 py-1.5 text-sm font-bold">
              <Calendar size={14} /> {formatDisplayDate(upcoming[0].date)}
            </span>
            {upcoming[0].time && (
              <span className="flex items-center gap-1.5 bg-white/20 rounded-xl px-3 py-1.5 text-sm font-bold">
                <Clock size={14} /> {formatTime(upcoming[0].time)}
              </span>
            )}
            {upcoming[0].location && (
              <span className="flex items-center gap-1.5 bg-white/20 rounded-xl px-3 py-1.5 text-sm font-bold">
                <MapPin size={14} /> {upcoming[0].location}
              </span>
            )}
          </div>
          {getDaysUntil(upcoming[0].date) === 0 ? (
            <p className="mt-2 text-sm font-bold text-yellow-300">⚠️ This is today!</p>
          ) : getDaysUntil(upcoming[0].date) === 1 ? (
            <p className="mt-2 text-sm font-bold text-yellow-200">📅 Tomorrow — Don't forget!</p>
          ) : null}
        </motion.div>
      )}

      {/* Section tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1">
        <button
          onClick={() => setActiveSection("upcoming")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
            activeSection === "upcoming"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          📅 Upcoming
          {upcoming.length > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
              {upcoming.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSection("past")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
            activeSection === "past"
              ? "bg-white text-slate-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          🗂️ Previous
          {past.length > 0 && (
            <span className="bg-slate-400 text-white text-xs px-2 py-0.5 rounded-full">
              {past.length}
            </span>
          )}
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 size={36} className="animate-spin text-blue-400" />
          <p className="text-lg font-medium text-slate-400">Loading appointments…</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeSection === "upcoming" ? (
            <motion.div
              key="upcoming"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-4"
            >
              {upcoming.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 gap-4 text-center"
                >
                  <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center">
                    <Calendar size={44} className="text-blue-300" />
                  </div>
                  <p className="text-2xl font-bold text-slate-600">No upcoming appointments</p>
                  <p className="text-lg text-slate-400">Tap + to schedule one</p>
                </motion.div>
              ) : (
                upcoming.map((appt) => (
                  <motion.div
                    key={appt.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <AppointmentCard
                      appt={appt}
                      onEdit={() => {
                        setEditingAppt(appt);
                        setShowModal(true);
                      }}
                      onDelete={() => handleDelete(appt.id)}
                      onStatusChange={(status) => handleStatusChange(appt.id, status)}
                    />
                  </motion.div>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="past"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-4"
            >
              {past.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-16 gap-4 text-center"
                >
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center">
                    <Calendar size={44} className="text-slate-300" />
                  </div>
                  <p className="text-2xl font-bold text-slate-600">No previous appointments</p>
                  <p className="text-lg text-slate-400">Past appointments will appear here</p>
                </motion.div>
              ) : (
                past.map((appt) => (
                  <motion.div
                    key={appt.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <AppointmentCard
                      appt={appt}
                      onEdit={() => {
                        setEditingAppt(appt);
                        setShowModal(true);
                      }}
                      onDelete={() => handleDelete(appt.id)}
                      onStatusChange={(status) => handleStatusChange(appt.id, status)}
                    />
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* FAB */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.93 }}
        onClick={() => {
          setEditingAppt(undefined);
          setShowModal(true);
        }}
        className="fixed bottom-24 right-6 w-16 h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl flex items-center justify-center z-30 transition-colors"
      >
        <Plus size={30} />
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <AppointmentModal
            initial={editingAppt}
            onClose={() => {
              setShowModal(false);
              setEditingAppt(undefined);
            }}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}