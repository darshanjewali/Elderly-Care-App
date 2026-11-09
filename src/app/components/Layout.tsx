import { useState } from "react";
import { Outlet, useLocation, Link } from "react-router";
import {
  Home, Pill, HeartPulse, Watch, Globe, X, Check, CalendarDays,
  Settings, Bell, BellOff, Palette, Target, ChevronRight,
  AlertTriangle, User, Sparkles, MoreHorizontal,
} from "lucide-react";
import { Toaster } from "sonner";
import { FamilySwitcher } from "./FamilySwitcher";
import { useApp } from "../context/AppContext";
import { LANGUAGES } from "../utils/voice";
import { AnimatePresence, motion } from "motion/react";
import { ModalPortal } from "./ModalPortal";
import { ChatBot } from "./ChatBot";

// ── Notification Themes ────────────────────────────────────────────────────────
export const NOTIF_THEMES: Record<
  string,
  { name: string; emoji: string; description: string; toasterStyle: React.CSSProperties; richColors: boolean }
> = {
  classic: {
    name: "Classic Blue",
    emoji: "💙",
    description: "Clean blue tones",
    richColors: true,
    toasterStyle: {},
  },
  calm: {
    name: "Calm Green",
    emoji: "🌿",
    description: "Soft, easy on the eyes",
    richColors: false,
    toasterStyle: {
      "--normal-bg": "#f0fdf4",
      "--normal-border": "#bbf7d0",
      "--normal-text": "#14532d",
      "--success-bg": "#dcfce7",
      "--success-border": "#86efac",
      "--success-text": "#14532d",
      "--error-bg": "#fef2f2",
      "--error-border": "#fca5a5",
      "--error-text": "#7f1d1d",
      "--warning-bg": "#fffbeb",
      "--warning-border": "#fde68a",
      "--warning-text": "#78350f",
    } as React.CSSProperties,
  },
  vivid: {
    name: "Vivid Contrast",
    emoji: "🔆",
    description: "High contrast, easy to see",
    richColors: false,
    toasterStyle: {
      "--normal-bg": "#1e293b",
      "--normal-border": "#334155",
      "--normal-text": "#f1f5f9",
      "--success-bg": "#14532d",
      "--success-border": "#166534",
      "--success-text": "#dcfce7",
      "--error-bg": "#7f1d1d",
      "--error-border": "#991b1b",
      "--error-text": "#fef2f2",
      "--warning-bg": "#78350f",
      "--warning-border": "#92400e",
      "--warning-text": "#fffbeb",
    } as React.CSSProperties,
  },
  warm: {
    name: "Warm Sunset",
    emoji: "🌅",
    description: "Warm amber tones",
    richColors: false,
    toasterStyle: {
      "--normal-bg": "#fff7ed",
      "--normal-border": "#fed7aa",
      "--normal-text": "#7c2d12",
      "--success-bg": "#f0fdf4",
      "--success-border": "#bbf7d0",
      "--success-text": "#14532d",
      "--error-bg": "#fef2f2",
      "--error-border": "#fca5a5",
      "--error-text": "#7f1d1d",
      "--warning-bg": "#fffbeb",
      "--warning-border": "#fde68a",
      "--warning-text": "#78350f",
    } as React.CSSProperties,
  },
  purple: {
    name: "Gentle Purple",
    emoji: "💜",
    description: "Soft violet palette",
    richColors: false,
    toasterStyle: {
      "--normal-bg": "#faf5ff",
      "--normal-border": "#d8b4fe",
      "--normal-text": "#3b0764",
      "--success-bg": "#f0fdf4",
      "--success-border": "#86efac",
      "--success-text": "#14532d",
      "--error-bg": "#fef2f2",
      "--error-border": "#fca5a5",
      "--error-text": "#7f1d1d",
      "--warning-bg": "#fffbeb",
      "--warning-border": "#fde68a",
      "--warning-text": "#78350f",
    } as React.CSSProperties,
  },
};

// ── Language Picker ────────────────────────────────────────────────────────────
function LanguagePicker({ onClose }: { onClose: () => void }) {
  const { selectedLanguage, setSelectedLanguage } = useApp();

  return (
    <ModalPortal>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-[9999] flex items-end justify-center"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          className="bg-white rounded-t-3xl w-full max-w-md px-5 pb-10 pt-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Voice Language</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Medication reminders will be spoken in this language
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-slate-100 hover:bg-slate-200">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-[60vh] overflow-y-auto">
            {LANGUAGES.map((lang) => {
              const isSelected = selectedLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => { setSelectedLanguage(lang.code); onClose(); }}
                  className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left ${
                    isSelected ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm ${isSelected ? "text-blue-700" : "text-slate-700"}`}>
                      {lang.nativeName}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{lang.slangDesc}</p>
                  </div>
                  {isSelected && <Check size={16} className="text-blue-600 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </ModalPortal>
  );
}

// ── Settings Panel ─────────────────────────────────────────────────────────────
function SettingsPanel({ onClose }: { onClose: () => void }) {
  const {
    notifPermission, requestNotifPermission,
    notifTheme, setNotifTheme,
    stepGoal, setStepGoal,
  } = useApp();

  const [goalInput, setGoalInput] = useState(String(stepGoal));
  const [goalSaved, setGoalSaved] = useState(false);

  const handleGoalSave = () => {
    const val = parseInt(goalInput, 10);
    if (!val || val < 100 || val > 100000) return;
    setStepGoal(val);
    setGoalSaved(true);
    setTimeout(() => setGoalSaved(false), 2000);
  };

  const PRESET_GOALS = [3000, 5000, 7500, 10000];

  return (
    <ModalPortal>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-[9999] flex items-end justify-center"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          className="bg-white rounded-t-3xl w-full max-w-md px-5 pb-10 pt-4 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Settings size={24} className="text-slate-600" /> Settings
            </h2>
            <button onClick={onClose} className="p-2 rounded-full bg-slate-100 hover:bg-slate-200">
              <X size={20} />
            </button>
          </div>

          {/* ── Notification Reminders ── */}
          <section className="mb-7">
            <div className="flex items-center gap-2 mb-3">
              <Bell size={18} className="text-blue-600" />
              <h3 className="text-lg font-bold text-slate-700">Medication Reminders</h3>
            </div>
            <button
              onClick={requestNotifPermission}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                notifPermission === "granted"
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center gap-3">
                {notifPermission === "granted" ? (
                  <Bell size={22} className="text-emerald-600" />
                ) : (
                  <BellOff size={22} className="text-slate-400" />
                )}
                <div className="text-left">
                  <p className={`font-bold text-base ${notifPermission === "granted" ? "text-emerald-800" : "text-slate-700"}`}>
                    {notifPermission === "granted" ? "Reminders Enabled ✅" : "Enable Reminders"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {notifPermission === "granted"
                      ? "You'll get notified at medication times"
                      : "Tap to allow medication notifications"}
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400" />
            </button>
          </section>

          {/* ── Notification Theme ── */}
          <section className="mb-7">
            <div className="flex items-center gap-2 mb-3">
              <Palette size={18} className="text-purple-600" />
              <h3 className="text-lg font-bold text-slate-700">Notification Theme</h3>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(NOTIF_THEMES).map(([key, theme]) => {
                const isSelected = notifTheme === key;
                return (
                  <button
                    key={key}
                    onClick={() => setNotifTheme(key)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left ${
                      isSelected ? "border-purple-500 bg-purple-50" : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <span className="text-2xl">{theme.emoji}</span>
                    <div className="flex-1">
                      <p className={`font-bold text-sm ${isSelected ? "text-purple-800" : "text-slate-700"}`}>
                        {theme.name}
                      </p>
                      <p className="text-xs text-slate-400">{theme.description}</p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Step Goal ── */}
          <section className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Target size={18} className="text-emerald-600" />
              <h3 className="text-lg font-bold text-slate-700">Daily Step Goal</h3>
            </div>

            {/* Preset buttons */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {PRESET_GOALS.map((g) => (
                <button
                  key={g}
                  onClick={() => {
                    setGoalInput(String(g));
                    setStepGoal(g);
                    setGoalSaved(true);
                    setTimeout(() => setGoalSaved(false), 2000);
                  }}
                  className={`py-2.5 rounded-2xl font-bold text-sm border-2 transition-all ${
                    stepGoal === g
                      ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"
                  }`}
                >
                  {g.toLocaleString()}
                </button>
              ))}
            </div>

            {/* Custom input */}
            <div className="flex gap-2">
              <input
                type="number"
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="Custom goal"
                min={100}
                max={100000}
                className="flex-1 border-2 border-slate-200 rounded-2xl px-4 py-3 text-lg font-bold focus:border-emerald-400 focus:outline-none"
              />
              <button
                onClick={handleGoalSave}
                disabled={!goalInput || parseInt(goalInput) < 100}
                className={`px-5 rounded-2xl font-bold text-base transition-all ${
                  goalSaved
                    ? "bg-emerald-500 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white disabled:text-slate-400"
                }`}
              >
                {goalSaved ? "✓ Saved" : "Save"}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">
              Current goal: <strong>{stepGoal.toLocaleString()} steps/day</strong>
            </p>
          </section>
        </motion.div>
      </motion.div>
    </ModalPortal>
  );
}

// ── Layout ─────────────────────────────────────────────────────────────────────
export function Layout() {
  const location = useLocation();
  const { selectedLanguage, notifTheme, dbSetupNeeded } = useApp();
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const currentLang = LANGUAGES.find((l) => l.code === selectedLanguage) ?? LANGUAGES[0];
  const theme = NOTIF_THEMES[notifTheme] ?? NOTIF_THEMES.classic;

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/medications", label: "Pills", icon: Pill },
    { path: "/vitals", label: "Health", icon: HeartPulse },
    { path: "/appointments", label: "Doctors", icon: CalendarDays },
  ];

  const MORE_ITEMS = [
    { label: "Watch", icon: Watch, path: "/device", color: "bg-blue-100 text-blue-600" },
    { label: "Emergency", icon: AlertTriangle, path: "/emergency", color: "bg-red-100 text-red-600" },
    { label: "Profile", icon: User, path: "/profile", color: "bg-violet-100 text-violet-600" },
    { label: "AI Rx Scan", icon: Sparkles, path: "/rx-scanner", color: "bg-indigo-100 text-indigo-600" },
  ];

  const isMoreActive = ["/device", "/emergency", "/profile", "/rx-scanner"].includes(location.pathname);

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/": return "My Dashboard";
      case "/medications": return "My Medications";
      case "/vitals": return "Health Vitals";
      case "/appointments": return "Doctor Appointments";
      case "/device": return "My Smart Watch";
      case "/emergency": return "Emergency SOS";
      case "/profile": return "My Profile";
      case "/rx-scanner": return "AI Rx Scanner";
      default: return "ElderCare";
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans max-w-md mx-auto sm:border-x sm:border-slate-200 sm:shadow-xl relative overflow-hidden">
      {/* Header */}
      <header className="bg-white px-5 pt-10 pb-3 shadow-sm z-10 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <FamilySwitcher />
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLangPicker(true)}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <Globe size={16} className="text-slate-500" />
              <span className="text-sm font-bold text-slate-700">{currentLang.flag}</span>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <Settings size={18} className="text-slate-600" />
            </button>
          </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{getPageTitle()}</h1>
      </header>

      {/* Offline mode banner */}
      <AnimatePresence>
        {dbSetupNeeded && !bannerDismissed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-sky-50 border-b border-sky-200 px-4 py-2 flex items-center gap-2 z-10 flex-shrink-0 overflow-hidden"
          >
            <span className="text-sky-500 text-base flex-shrink-0">💾</span>
            <p className="flex-1 text-sky-700 text-xs font-semibold">Offline mode — data saved to this device</p>
            <button onClick={() => setBannerDismissed(true)} className="text-sky-400 flex-shrink-0">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 z-0">
        <div className="p-5">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-0 w-full bg-white border-t border-slate-200 flex justify-around items-center h-[4.5rem] px-1 z-20">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-colors ${
                isActive ? "text-sky-600" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? "bg-sky-100" : "bg-transparent"}`}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-semibold leading-tight ${isActive ? "text-sky-700" : ""}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
        <button
          onClick={() => setShowMore(true)}
          className={`flex flex-col items-center justify-center w-full h-full gap-0.5 transition-colors ${
            isMoreActive ? "text-sky-600" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <div className={`p-1.5 rounded-xl ${isMoreActive ? "bg-sky-100" : "bg-transparent"}`}>
            <MoreHorizontal size={24} strokeWidth={isMoreActive ? 2.5 : 2} />
          </div>
          <span className={`text-[10px] font-semibold leading-tight ${isMoreActive ? "text-sky-700" : ""}`}>More</span>
        </button>
      </nav>

      {/* Floating ChatBot button */}
      <ChatBot />

      {/* More panel */}
      <AnimatePresence>
        {showMore && (
          <ModalPortal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-[9999] flex items-end justify-center"
              onClick={() => setShowMore(false)}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 280 }}
                className="bg-white rounded-t-3xl w-full max-w-md px-5 pb-10 pt-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
                <h2 className="text-xl font-black text-slate-800 mb-4">More Options</h2>
                <div className="grid grid-cols-3 gap-3">
                  {MORE_ITEMS.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setShowMore(false)}
                      className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${item.color}`}>
                        <item.icon size={28} />
                      </div>
                      <span className="text-sm font-bold text-slate-700 text-center leading-tight">{item.label}</span>
                    </Link>
                  ))}
                  <button
                    onClick={() => { setShowMore(false); setShowLangPicker(true); }}
                    className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-teal-100 text-teal-600">
                      <Globe size={28} />
                    </div>
                    <span className="text-sm font-bold text-slate-700">Language</span>
                  </button>
                  <button
                    onClick={() => { setShowMore(false); setShowSettings(true); }}
                    className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-slate-200 text-slate-600">
                      <Settings size={28} />
                    </div>
                    <span className="text-sm font-bold text-slate-700">Settings</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </ModalPortal>
        )}
      </AnimatePresence>

      {/* Language Picker */}
      <AnimatePresence>
        {showLangPicker && <LanguagePicker onClose={() => setShowLangPicker(false)} />}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
      </AnimatePresence>

      {/* Global toast notifications — themed */}
      <Toaster
        position="top-center"
        richColors={theme.richColors}
        toastOptions={{
          style: { fontSize: "16px", fontWeight: "600", borderRadius: "16px", ...theme.toasterStyle },
        }}
      />
    </div>
  );
}
