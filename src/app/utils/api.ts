import { projectId, publicAnonKey } from "/utils/supabase/info";

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-def98a55`;

const authHeaders = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${publicAnonKey}`,
  apikey: publicAnonKey,
};

function sleep(ms: number) {
  return new Promise<void>((res) => setTimeout(res, ms));
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  attempt = 0
): Promise<T> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: { ...authHeaders, ...(options.headers ?? {}) },
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`[${options.method ?? "GET"} ${path}] HTTP ${res.status}: ${errText}`);
    }
    return res.json() as Promise<T>;
  } catch (err) {
    if (attempt < 3 && err instanceof TypeError) {
      console.warn(`[API] Retry ${attempt + 1}/3 for ${path} after network error:`, err.message);
      await sleep(1000 * (attempt + 1));
      return request<T>(path, options, attempt + 1);
    }
    throw err;
  }
}

// ── Helper ─────────────────────────────────────────────────────────────────
function mp(memberId: string) {
  return `?member=${encodeURIComponent(memberId)}`;
}

export const api = {
  // ── Medications ──────────────────────────────────────────────────────────
  getMedications: (memberId: string) =>
    request<any[]>(`/medications${mp(memberId)}`),

  createMedication: (memberId: string, body: object) =>
    request<any>(`/medications${mp(memberId)}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateMedication: (memberId: string, id: string, body: object) =>
    request<any>(`/medications/${id}${mp(memberId)}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  deleteMedication: (memberId: string, id: string) =>
    request<any>(`/medications/${id}${mp(memberId)}`, { method: "DELETE" }),

  // ── Taken ─────────────────────────────────────────────────────────────────
  getTaken: (memberId: string, date: string) =>
    request<string[]>(`/taken/${date}${mp(memberId)}`),

  setTaken: (memberId: string, date: string, medId: string, taken: boolean) =>
    request<any>(`/taken/${date}${mp(memberId)}`, {
      method: "POST",
      body: JSON.stringify({ medId, taken }),
    }),

  // ── Vitals ────────────────────────────────────────────────────────────────
  getVitals: (memberId: string) =>
    request<{ bloodSugar: any[]; bloodPressure: any[] }>(`/vitals${mp(memberId)}`),

  addBloodSugar: (memberId: string, value: number, note?: string) =>
    request<any>(`/vitals/blood-sugar${mp(memberId)}`, {
      method: "POST",
      body: JSON.stringify({ value, note }),
    }),

  addBloodPressure: (
    memberId: string,
    systolic: number,
    diastolic: number,
    pulse?: number | null,
    note?: string
  ) =>
    request<any>(`/vitals/blood-pressure${mp(memberId)}`, {
      method: "POST",
      body: JSON.stringify({ systolic, diastolic, pulse, note }),
    }),

  // ── Steps ─────────────────────────────────────────────────────────────────
  getStepsHistory: (memberId: string) =>
    request<any[]>(`/steps${mp(memberId)}`),

  getStepsForDate: (memberId: string, date: string) =>
    request<{ date: string; steps: number }>(`/steps/${date}${mp(memberId)}`),

  updateSteps: (memberId: string, date: string, steps: number) =>
    request<any>(`/steps/${date}${mp(memberId)}`, {
      method: "POST",
      body: JSON.stringify({ steps }),
    }),

  // ── Family Members ────────────────────────────────────────────────────────
  getFamily: () =>
    request<any[]>("/family"),

  addFamilyMember: (body: object) =>
    request<any>("/family", { method: "POST", body: JSON.stringify(body) }),

  updateFamilyMember: (id: string, body: object) =>
    request<any>(`/family/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  deleteFamilyMember: (id: string) =>
    request<any>(`/family/${id}`, { method: "DELETE" }),

  // ── Medication History ────────────────────────────────────────────────────
  getMedHistory: (memberId: string) =>
    request<any[]>(`/med-history${mp(memberId)}`),

  logMedHistory: (memberId: string, body: object) =>
    request<any>(`/med-history${mp(memberId)}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  removeMedHistory: (memberId: string, medId: string, date: string) =>
    request<any>(
      `/med-history${mp(memberId)}&medId=${encodeURIComponent(medId)}&date=${encodeURIComponent(date)}`,
      { method: "DELETE" }
    ),

  // ── Appointments ──────────────────────────────────────────────────────────
  getAppointments: (memberId: string) =>
    request<any[]>(`/appointments${mp(memberId)}`),

  createAppointment: (memberId: string, body: object) =>
    request<any>(`/appointments${mp(memberId)}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateAppointment: (memberId: string, id: string, body: object) =>
    request<any>(`/appointments/${id}${mp(memberId)}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  deleteAppointment: (memberId: string, id: string) =>
    request<any>(`/appointments/${id}${mp(memberId)}`, { method: "DELETE" }),
};

/** Returns today's date as "YYYY-MM-DD" (UTC) */
export function todayDate(): string {
  return new Date().toISOString().split("T")[0];
}