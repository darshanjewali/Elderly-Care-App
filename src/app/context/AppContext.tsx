import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { api, todayDate } from "../utils/api";
import { localStore, isDbError } from "../utils/localStore";
import {
  Medication,
  BloodSugarEntry,
  BPEntry,
  StepsEntry,
  FamilyMember,
  DEFAULT_MEMBER,
} from "../utils/types";
import { buildAnnouncement, speakText } from "../utils/voice";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface AppContextType {
  dbSetupNeeded: boolean;

  // Family
  familyMembers: FamilyMember[];
  currentMemberId: string;
  currentMember: FamilyMember;
  switchMember: (member: FamilyMember) => void;
  addFamilyMember: (data: Omit<FamilyMember, "id" | "createdAt">) => Promise<void>;
  updateFamilyMember: (id: string, data: Partial<FamilyMember>) => Promise<void>;
  deleteFamilyMember: (id: string) => Promise<void>;

  // Voice / Language
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  speakMedication: (med: Medication) => void;

  // Medications
  medications: Medication[];
  takenToday: string[];
  loadingMeds: boolean;
  addMedication: (med: Omit<Medication, "id" | "createdAt">) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
  updateMedication: (id: string, data: Partial<Medication>) => Promise<void>;
  toggleTaken: (medId: string) => Promise<void>;

  // Vitals
  bloodSugarHistory: BloodSugarEntry[];
  bpHistory: BPEntry[];
  loadingVitals: boolean;
  addBloodSugar: (value: number, note?: string) => Promise<void>;
  addBloodPressure: (systolic: number, diastolic: number, pulse?: number | null, note?: string) => Promise<void>;

  // Steps
  stepsToday: number;
  stepsHistory: StepsEntry[];
  setStepsToday: (steps: number) => void;
  syncStepsToServer: (steps: number) => Promise<void>;
  stepGoal: number;
  setStepGoal: (goal: number) => void;

  // Notifications
  notifPermission: NotificationPermission | "not-supported";
  requestNotifPermission: () => Promise<void>;
  notifTheme: string;
  setNotifTheme: (theme: string) => void;

  // Reload
  refreshAll: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  // ── Family state ────────────────────────────────────────────────────────────
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [currentMemberId, setCurrentMemberId] = useState<string>(() =>
    localStorage.getItem("hm_currentMember") || "self"
  );

  const currentMember =
    familyMembers.find((m) => m.id === currentMemberId) || DEFAULT_MEMBER;

  // ── Language / Voice state ──────────────────────────────────────────────────
  const [selectedLanguage, setSelectedLanguageState] = useState<string>(() =>
    localStorage.getItem("hm_language") || "en-US"
  );

  const setSelectedLanguage = useCallback((lang: string) => {
    setSelectedLanguageState(lang);
    localStorage.setItem("hm_language", lang);
  }, []);

  const setStepGoal = useCallback((goal: number) => {
    setStepGoalState(goal);
    localStorage.setItem("hm_step_goal", String(goal));
  }, []);

  const setNotifTheme = useCallback((theme: string) => {
    setNotifThemeState(theme);
    localStorage.setItem("hm_notif_theme", theme);
  }, []);

  const speakMedication = useCallback(
    (med: Medication) => {
      const member = familyMembers.find((m) => m.id === currentMemberId) || DEFAULT_MEMBER;
      const text = buildAnnouncement(selectedLanguage, med, member.name);
      speakText(text, selectedLanguage);
    },
    [selectedLanguage, currentMemberId, familyMembers]
  );

  // ── Core data state ──────────────────────────────────────────────────────────
  const [medications, setMedications] = useState<Medication[]>([]);
  const [takenToday, setTakenToday] = useState<string[]>([]);
  const [loadingMeds, setLoadingMeds] = useState(true);

  const [bloodSugarHistory, setBloodSugarHistory] = useState<BloodSugarEntry[]>([]);
  const [bpHistory, setBpHistory] = useState<BPEntry[]>([]);
  const [loadingVitals, setLoadingVitals] = useState(true);

  const [stepsToday, setStepsTodayState] = useState(0);
  const [stepsHistory, setStepsHistory] = useState<StepsEntry[]>([]);
  const [stepGoal, setStepGoalState] = useState<number>(() => {
    const saved = localStorage.getItem("hm_step_goal");
    return saved ? parseInt(saved, 10) : 5000;
  });
  const [notifTheme, setNotifThemeState] = useState<string>(() =>
    localStorage.getItem("hm_notif_theme") || "classic"
  );

  const [notifPermission, setNotifPermission] = useState<
    NotificationPermission | "not-supported"
  >("default");

  const [dbSetupNeeded, setDbSetupNeeded] = useState(false);

  const stepSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notifIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Family loading ──────────────────────────────────────────────────────────
  const loadFamily = useCallback(async () => {
    try {
      const members = (await api.getFamily()) as FamilyMember[];
      if (members.length === 0) {
        // Auto-create the "self" member on first launch
        const self = (await api.addFamilyMember({
          id: "self",
          name: "Me",
          relationship: "self",
          avatarColor: "#3b82f6",
        })) as FamilyMember;
        setFamilyMembers([self]);
      } else {
        setFamilyMembers(members);
      }
    } catch (err) {
      if (isDbError(err)) {
        setDbSetupNeeded(true);
        let members = localStore.getFamily() as FamilyMember[];
        if (members.length === 0) {
          const self = localStore.upsertFamilyMember({ id: "self", name: "Me", relationship: "self", avatarColor: "#3b82f6" }) as FamilyMember;
          members = [self];
        }
        setFamilyMembers(members);
      } else {
        console.error("Error loading family:", err);
        setFamilyMembers([DEFAULT_MEMBER]);
      }
    }
  }, []);

  // ── Data loading (member-scoped) ────────────────────────────────────────────
  const loadMedications = useCallback(async () => {
    setLoadingMeds(true);
    try {
      const [meds, taken] = await Promise.all([
        api.getMedications(currentMemberId),
        api.getTaken(currentMemberId, todayDate()),
      ]);
      setMedications(meds as Medication[]);
      setTakenToday(taken as string[]);
    } catch (err) {
      if (isDbError(err)) {
        setDbSetupNeeded(true);
        setMedications(localStore.getMedications(currentMemberId) as Medication[]);
        setTakenToday(localStore.getTaken(currentMemberId, todayDate()));
      } else {
        console.error("Error loading medications:", err);
      }
    } finally {
      setLoadingMeds(false);
    }
  }, [currentMemberId]);

  const loadVitals = useCallback(async () => {
    setLoadingVitals(true);
    try {
      const { bloodSugar, bloodPressure } = await api.getVitals(currentMemberId);
      setBloodSugarHistory(bloodSugar as BloodSugarEntry[]);
      setBpHistory(bloodPressure as BPEntry[]);
    } catch (err) {
      if (isDbError(err)) {
        setDbSetupNeeded(true);
        const v = localStore.getVitals(currentMemberId);
        setBloodSugarHistory(v.bloodSugar as BloodSugarEntry[]);
        setBpHistory(v.bloodPressure as BPEntry[]);
      } else {
        console.error("Error loading vitals:", err);
      }
    } finally {
      setLoadingVitals(false);
    }
  }, [currentMemberId]);

  const loadSteps = useCallback(async () => {
    try {
      const [todayData, history] = await Promise.all([
        api.getStepsForDate(currentMemberId, todayDate()),
        api.getStepsHistory(currentMemberId),
      ]);
      setStepsTodayState(todayData.steps);
      setStepsHistory(history as StepsEntry[]);
    } catch (err) {
      if (isDbError(err)) {
        setDbSetupNeeded(true);
        setStepsTodayState(localStore.getStepsForDate(currentMemberId, todayDate()).steps);
        setStepsHistory(localStore.getStepsHistory(currentMemberId) as StepsEntry[]);
      } else {
        console.error("Error loading steps:", err);
      }
    }
  }, [currentMemberId]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadMedications(), loadVitals(), loadSteps()]);
  }, [loadMedications, loadVitals, loadSteps]);

  // ── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadFamily();
    if (!("Notification" in window)) {
      setNotifPermission("not-supported");
    } else {
      setNotifPermission(Notification.permission);
    }
  }, [loadFamily]);

  // Reload data whenever currentMemberId changes
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // ── Notification scheduler ───────────────────────────────────────────────────
  const setupNotificationScheduler = useCallback(
    (meds: Medication[], taken: string[]) => {
      if (notifIntervalRef.current) clearInterval(notifIntervalRef.current);
      if (Notification.permission !== "granted") return;

      const check = () => {
        const now = new Date();
        const h = now.getHours().toString().padStart(2, "0");
        const m = now.getMinutes().toString().padStart(2, "0");
        const currentTime = `${h}:${m}`;
        meds.forEach((med) => {
          if (med.scheduledTime === currentTime && !taken.includes(med.id)) {
            const n = new Notification(`💊 Time for ${med.name}`, {
              body: `Take ${med.dosage} now`,
              tag: `med-${med.id}`,
              icon: "/favicon.ico",
            });
            n.onclick = () => window.focus();
          }
        });
      };

      check();
      notifIntervalRef.current = setInterval(check, 60_000);
    },
    []
  );

  useEffect(() => {
    if (medications.length > 0) setupNotificationScheduler(medications, takenToday);
    return () => {
      if (notifIntervalRef.current) clearInterval(notifIntervalRef.current);
    };
  }, [medications, takenToday, setupNotificationScheduler]);

  // ── Family CRUD ──────────────────────────────────────────────────────────────
  const switchMember = useCallback((member: FamilyMember) => {
    setCurrentMemberId(member.id);
    localStorage.setItem("hm_currentMember", member.id);
    // State reset — useEffect with refreshAll will fire automatically
    setMedications([]);
    setTakenToday([]);
    setBpHistory([]);
    setBloodSugarHistory([]);
    setStepsHistory([]);
    setStepsTodayState(0);
  }, []);

  const addFamilyMember = useCallback(
    async (data: Omit<FamilyMember, "id" | "createdAt">) => {
      try {
        const member = (await api.addFamilyMember(data)) as FamilyMember;
        setFamilyMembers((prev) => [...prev, member]);
        toast.success(`${data.name} added to your family!`);
      } catch (err) {
        if (isDbError(err)) {
          const member = localStore.upsertFamilyMember(data) as FamilyMember;
          setFamilyMembers((prev) => [...prev.filter((m) => m.id !== member.id), member]);
          toast.success(`${data.name} added to your family!`);
        } else {
          console.error("Error adding family member:", err);
          toast.error("Failed to add family member.");
          throw err;
        }
      }
    },
    []
  );

  const updateFamilyMember = useCallback(
    async (id: string, data: Partial<FamilyMember>) => {
      try {
        const updated = (await api.updateFamilyMember(id, data)) as FamilyMember;
        setFamilyMembers((prev) => prev.map((m) => (m.id === id ? updated : m)));
        toast.success("Family member updated!");
      } catch (err) {
        if (isDbError(err)) {
          const updated = localStore.updateFamilyMember(id, data) as FamilyMember;
          setFamilyMembers((prev) => prev.map((m) => (m.id === id ? updated : m)));
          toast.success("Family member updated!");
        } else {
          console.error("Error updating family member:", err);
          toast.error("Failed to update family member.");
          throw err;
        }
      }
    },
    []
  );

  const deleteFamilyMember = useCallback(
    async (id: string) => {
      if (id === "self") { toast.error("You can't remove yourself!"); return; }
      try {
        await api.deleteFamilyMember(id);
        setFamilyMembers((prev) => prev.filter((m) => m.id !== id));
        if (currentMemberId === id) switchMember(familyMembers.find((m) => m.id === "self") || DEFAULT_MEMBER);
        toast.success("Family member removed.");
      } catch (err) {
        if (isDbError(err)) {
          localStore.deleteFamilyMember(id);
          setFamilyMembers((prev) => prev.filter((m) => m.id !== id));
          if (currentMemberId === id) switchMember(familyMembers.find((m) => m.id === "self") || DEFAULT_MEMBER);
          toast.success("Family member removed.");
        } else {
          console.error("Error deleting family member:", err);
          toast.error("Failed to remove family member.");
          throw err;
        }
      }
    },
    [currentMemberId, familyMembers, switchMember]
  );

  // ── Medications CRUD ─────────────────────────────────────────────────────────
  const addMedication = useCallback(
    async (med: Omit<Medication, "id" | "createdAt">) => {
      try {
        const created = (await api.createMedication(currentMemberId, med)) as Medication;
        setMedications((prev) => [...prev, created]);
        toast.success(`${med.name} added!`);
      } catch (err) {
        if (isDbError(err)) {
          const created = localStore.createMedication(currentMemberId, med) as Medication;
          setMedications((prev) => [...prev, created]);
          toast.success(`${med.name} added!`);
        } else {
          console.error("Error adding medication:", err);
          toast.error("Failed to add medication.");
          throw err;
        }
      }
    },
    [currentMemberId]
  );

  const deleteMedication = useCallback(
    async (id: string) => {
      const med = medications.find((m) => m.id === id);
      try {
        await api.deleteMedication(currentMemberId, id);
        setMedications((prev) => prev.filter((m) => m.id !== id));
        toast.success(`${med?.name ?? "Medication"} removed.`);
      } catch (err) {
        if (isDbError(err)) {
          localStore.deleteMedication(currentMemberId, id);
          setMedications((prev) => prev.filter((m) => m.id !== id));
          toast.success(`${med?.name ?? "Medication"} removed.`);
        } else {
          console.error("Error deleting medication:", err);
          toast.error("Failed to delete medication.");
          throw err;
        }
      }
    },
    [medications, currentMemberId]
  );

  const updateMedication = useCallback(
    async (id: string, data: Partial<Medication>) => {
      try {
        const updated = (await api.updateMedication(currentMemberId, id, data)) as Medication;
        setMedications((prev) => prev.map((m) => (m.id === id ? updated : m)));
        toast.success("Medication updated!");
      } catch (err) {
        if (isDbError(err)) {
          const updated = localStore.updateMedication(currentMemberId, id, data) as Medication;
          setMedications((prev) => prev.map((m) => (m.id === id ? updated : m)));
          toast.success("Medication updated!");
        } else {
          console.error("Error updating medication:", err);
          toast.error("Failed to update medication.");
          throw err;
        }
      }
    },
    [currentMemberId]
  );

  const toggleTaken = useCallback(
    async (medId: string) => {
      const nowTaken = !takenToday.includes(medId);
      const newTaken = nowTaken
        ? [...takenToday, medId]
        : takenToday.filter((id) => id !== medId);
      setTakenToday(newTaken);

      if (nowTaken && newTaken.length === medications.length && medications.length > 0) {
        setTimeout(() => {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
          toast.success("🎉 All medications taken today! Great job!");
        }, 300);
      }

      try {
        await api.setTaken(currentMemberId, todayDate(), medId, nowTaken);
        const med = medications.find((m) => m.id === medId);
        if (nowTaken) {
          toast.success(`${med?.name ?? "Medication"} marked as taken!`);
          if (med) {
            api.logMedHistory(currentMemberId, { medId: med.id, medName: med.name, dosage: med.dosage, timeSlot: med.timeSlot, pillColor: med.pillColor, pillType: med.pillType, date: todayDate() })
              .catch(() => localStore.logMedHistory(currentMemberId, { medId: med.id, medName: med.name, dosage: med.dosage, timeSlot: med.timeSlot, pillColor: med.pillColor, pillType: med.pillType, date: todayDate() }));
          }
        } else {
          if (med) {
            api.removeMedHistory(currentMemberId, med.id, todayDate())
              .catch(() => localStore.removeMedHistory(currentMemberId, med.id, todayDate()));
          }
        }
      } catch (err) {
        if (isDbError(err)) {
          localStore.setTaken(currentMemberId, todayDate(), medId, nowTaken);
          const med = medications.find((m) => m.id === medId);
          if (nowTaken) toast.success(`${med?.name ?? "Medication"} marked as taken!`);
        } else {
          setTakenToday(takenToday);
          console.error("Error toggling taken:", err);
          toast.error("Failed to update. Please try again.");
        }
      }
    },
    [takenToday, medications, currentMemberId]
  );

  // ── Vitals ───────────────────────────────────────────────────────────────────
  const addBloodSugar = useCallback(
    async (value: number, note?: string) => {
      try {
        const entry = (await api.addBloodSugar(currentMemberId, value, note)) as BloodSugarEntry;
        setBloodSugarHistory((prev) => [...prev, entry]);
        toast.success(`Blood sugar logged: ${value} mg/dL`);
      } catch (err) {
        if (isDbError(err)) {
          const entry = localStore.addBloodSugar(currentMemberId, value, note) as BloodSugarEntry;
          setBloodSugarHistory((prev) => [...prev, entry]);
          toast.success(`Blood sugar logged: ${value} mg/dL`);
        } else {
          console.error("Error logging blood sugar:", err);
          toast.error("Failed to log blood sugar.");
          throw err;
        }
      }
    },
    [currentMemberId]
  );

  const addBloodPressure = useCallback(
    async (systolic: number, diastolic: number, pulse?: number | null, note?: string) => {
      try {
        const entry = (await api.addBloodPressure(currentMemberId, systolic, diastolic, pulse, note)) as BPEntry;
        setBpHistory((prev) => [...prev, entry]);
        toast.success(`Blood pressure logged: ${systolic}/${diastolic} mmHg`);
      } catch (err) {
        if (isDbError(err)) {
          const entry = localStore.addBloodPressure(currentMemberId, systolic, diastolic, pulse, note) as BPEntry;
          setBpHistory((prev) => [...prev, entry]);
          toast.success(`Blood pressure logged: ${systolic}/${diastolic} mmHg`);
        } else {
          console.error("Error logging blood pressure:", err);
          toast.error("Failed to log blood pressure.");
          throw err;
        }
      }
    },
    [currentMemberId]
  );

  // ── Steps ─────────────────────────────────────────────────────────────────────
  const setStepsToday = useCallback(
    (steps: number) => {
      setStepsTodayState(steps);
      if (stepSyncTimerRef.current) clearTimeout(stepSyncTimerRef.current);
      stepSyncTimerRef.current = setTimeout(async () => {
        try {
          const saved = await api.updateSteps(currentMemberId, todayDate(), steps);
          setStepsHistory((prev) => prev.map((s) => (s.date === todayDate() ? { ...s, steps: saved.steps } : s)));
        } catch (err) {
          if (isDbError(err)) {
            localStore.updateSteps(currentMemberId, todayDate(), steps);
          } else {
            console.error("Error syncing steps:", err);
          }
        }
      }, 5000);
    },
    [currentMemberId]
  );

  const syncStepsToServer = useCallback(
    async (steps: number) => {
      if (stepSyncTimerRef.current) clearTimeout(stepSyncTimerRef.current);
      try {
        await api.updateSteps(currentMemberId, todayDate(), steps);
        setStepsHistory((prev) => prev.map((s) => (s.date === todayDate() ? { ...s, steps } : s)));
      } catch (err) {
        if (isDbError(err)) {
          localStore.updateSteps(currentMemberId, todayDate(), steps);
        } else {
          console.error("Error syncing steps:", err);
          toast.error("Failed to sync steps.");
        }
      }
    },
    [currentMemberId]
  );

  // ── Notifications ─────────────────────────────────────────────────────────────
  const requestNotifPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      setNotifPermission("not-supported");
      return;
    }
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    if (perm === "granted") {
      toast.success("Medication reminders enabled!");
      setupNotificationScheduler(medications, takenToday);
    } else {
      toast.error("Notification permission denied.");
    }
  }, [medications, takenToday, setupNotificationScheduler]);

  return (
    <AppContext.Provider
      value={{
        dbSetupNeeded,
        familyMembers,
        currentMemberId,
        currentMember,
        switchMember,
        addFamilyMember,
        updateFamilyMember,
        deleteFamilyMember,
        selectedLanguage,
        setSelectedLanguage,
        speakMedication,
        medications,
        takenToday,
        loadingMeds,
        addMedication,
        deleteMedication,
        updateMedication,
        toggleTaken,
        bloodSugarHistory,
        bpHistory,
        loadingVitals,
        addBloodSugar,
        addBloodPressure,
        stepsToday,
        stepsHistory,
        setStepsToday,
        syncStepsToServer,
        stepGoal,
        setStepGoal,
        notifPermission,
        requestNotifPermission,
        notifTheme,
        setNotifTheme,
        refreshAll,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}