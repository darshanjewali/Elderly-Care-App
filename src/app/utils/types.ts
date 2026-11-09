export interface Medication {
  id: string;
  name: string;
  dosage: string;
  timeSlot: "morning" | "afternoon" | "evening" | "night";
  scheduledTime: string;
  pillColor: string;
  pillType: "tablet" | "capsule" | "liquid";
  notes: string;
  createdAt: string;
}

export interface BloodSugarEntry {
  id: string;
  value: number;
  note: string;
  timestamp: string;
}

export interface BPEntry {
  id: string;
  systolic: number;
  diastolic: number;
  pulse: number | null;
  note: string;
  timestamp: string;
}

export interface StepsEntry {
  date: string;
  steps: number;
  day: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  age?: number | null;
  avatarColor: string;
  createdAt: string;
}

export type TimeSlot = "morning" | "afternoon" | "evening" | "night";

export const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  night: "Night",
};

export const TIME_SLOT_DEFAULTS: Record<TimeSlot, string> = {
  morning: "08:00",
  afternoon: "13:00",
  evening: "18:00",
  night: "21:00",
};

export const PILL_COLORS = [
  { label: "Blue", value: "#3b82f6" },
  { label: "Red", value: "#ef4444" },
  { label: "Green", value: "#22c55e" },
  { label: "Yellow", value: "#eab308" },
  { label: "Purple", value: "#a855f7" },
  { label: "Pink", value: "#ec4899" },
  { label: "Orange", value: "#f97316" },
  { label: "White", value: "#e2e8f0" },
];

export const RELATIONSHIPS = [
  "self",
  "father",
  "mother",
  "son",
  "daughter",
  "grandfather",
  "grandmother",
  "spouse",
  "sibling",
  "other",
] as const;

export const RELATIONSHIP_LABELS: Record<string, string> = {
  self: "Me",
  father: "Father",
  mother: "Mother",
  son: "Son",
  daughter: "Daughter",
  grandfather: "Grandfather",
  grandmother: "Grandmother",
  spouse: "Spouse",
  sibling: "Sibling",
  other: "Other",
};

export const RELATIONSHIP_EMOJIS: Record<string, string> = {
  self: "👤",
  father: "👨",
  mother: "👩",
  son: "👦",
  daughter: "👧",
  grandfather: "👴",
  grandmother: "👵",
  spouse: "💑",
  sibling: "🧑",
  other: "👥",
};

export const RELATIONSHIP_COLORS: Record<string, string> = {
  self: "#3b82f6",
  father: "#22c55e",
  mother: "#ec4899",
  son: "#06b6d4",
  daughter: "#a855f7",
  grandfather: "#f59e0b",
  grandmother: "#f43f5e",
  spouse: "#6366f1",
  sibling: "#f97316",
  other: "#64748b",
};

export const DEFAULT_MEMBER: FamilyMember = {
  id: "self",
  name: "Me",
  relationship: "self",
  avatarColor: "#3b82f6",
  createdAt: new Date().toISOString(),
};

export interface MedHistoryEntry {
  id: string;
  medId: string;
  medName: string;
  dosage: string;
  timeSlot: TimeSlot;
  pillColor: string;
  pillType: "tablet" | "capsule" | "liquid";
  date: string; // YYYY-MM-DD
  takenAt: string; // ISO timestamp
}

export type AppointmentStatus = "upcoming" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  notes: string;
  status: AppointmentStatus;
  createdAt: string;
}