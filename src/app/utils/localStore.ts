// localStorage-based fallback store — used when Supabase DB table is missing.

function lsKey(k: string) { return `hm_ls__${k}`; }

function lsGet<T>(k: string, def: T): T {
  try {
    const v = localStorage.getItem(lsKey(k));
    return v ? (JSON.parse(v) as T) : def;
  } catch { return def; }
}

function lsSet(k: string, v: unknown) {
  try { localStorage.setItem(lsKey(k), JSON.stringify(v)); } catch {}
}

function nowIso() { return new Date().toISOString(); }
function uid() { return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`; }

export const localStore = {
  // ── Family ──────────────────────────────────────────────────────────────────
  getFamily(): any[] { return lsGet("family", []); },

  upsertFamilyMember(data: any): any {
    const members = this.getFamily();
    const member = { id: data.id ?? uid(), name: data.name ?? "Member", relationship: data.relationship ?? "other", avatarColor: data.avatarColor ?? "#64748b", age: data.age ?? null, createdAt: nowIso(), ...data };
    const idx = members.findIndex((m: any) => m.id === member.id);
    if (idx >= 0) members[idx] = { ...members[idx], ...member }; else members.push(member);
    lsSet("family", members);
    return member;
  },

  updateFamilyMember(id: string, data: any): any {
    const members = this.getFamily();
    const idx = members.findIndex((m: any) => m.id === id);
    if (idx < 0) throw new Error("Member not found");
    members[idx] = { ...members[idx], ...data };
    lsSet("family", members);
    return members[idx];
  },

  deleteFamilyMember(id: string) {
    lsSet("family", this.getFamily().filter((m: any) => m.id !== id));
  },

  // ── Medications ──────────────────────────────────────────────────────────────
  getMedications(memberId: string): any[] { return lsGet(`meds_${memberId}`, []); },

  createMedication(memberId: string, data: any): any {
    const meds = this.getMedications(memberId);
    const med = { ...data, id: uid(), createdAt: nowIso() };
    meds.push(med);
    lsSet(`meds_${memberId}`, meds);
    return med;
  },

  updateMedication(memberId: string, id: string, data: any): any {
    const meds = this.getMedications(memberId);
    const idx = meds.findIndex((m: any) => m.id === id);
    if (idx < 0) throw new Error("Medication not found");
    meds[idx] = { ...meds[idx], ...data };
    lsSet(`meds_${memberId}`, meds);
    return meds[idx];
  },

  deleteMedication(memberId: string, id: string) {
    lsSet(`meds_${memberId}`, this.getMedications(memberId).filter((m: any) => m.id !== id));
  },

  // ── Taken ────────────────────────────────────────────────────────────────────
  getTaken(memberId: string, date: string): string[] { return lsGet(`taken_${memberId}_${date}`, []); },

  setTaken(memberId: string, date: string, medId: string, taken: boolean) {
    let arr = this.getTaken(memberId, date);
    arr = taken ? [...new Set([...arr, medId])] : arr.filter((id: string) => id !== medId);
    lsSet(`taken_${memberId}_${date}`, arr);
  },

  // ── Vitals ───────────────────────────────────────────────────────────────────
  getVitals(memberId: string): { bloodSugar: any[]; bloodPressure: any[] } {
    return { bloodSugar: lsGet(`bs_${memberId}`, []), bloodPressure: lsGet(`bp_${memberId}`, []) };
  },

  addBloodSugar(memberId: string, value: number, note?: string): any {
    const vitals = this.getVitals(memberId);
    const entry = { id: uid(), memberId, value, note: note ?? null, recordedAt: nowIso() };
    vitals.bloodSugar.push(entry);
    lsSet(`bs_${memberId}`, vitals.bloodSugar);
    return entry;
  },

  addBloodPressure(memberId: string, systolic: number, diastolic: number, pulse?: number | null, note?: string): any {
    const vitals = this.getVitals(memberId);
    const entry = { id: uid(), memberId, systolic, diastolic, pulse: pulse ?? null, note: note ?? null, recordedAt: nowIso() };
    vitals.bloodPressure.push(entry);
    lsSet(`bp_${memberId}`, vitals.bloodPressure);
    return entry;
  },

  // ── Steps ────────────────────────────────────────────────────────────────────
  getStepsHistory(memberId: string): any[] { return lsGet(`steps_${memberId}`, []); },

  getStepsForDate(memberId: string, date: string): { date: string; steps: number } {
    return this.getStepsHistory(memberId).find((s: any) => s.date === date) ?? { date, steps: 0 };
  },

  updateSteps(memberId: string, date: string, steps: number): any {
    const hist = this.getStepsHistory(memberId);
    const idx = hist.findIndex((s: any) => s.date === date);
    const entry = { memberId, date, steps, updatedAt: nowIso() };
    if (idx >= 0) hist[idx] = entry; else hist.push(entry);
    lsSet(`steps_${memberId}`, hist);
    return entry;
  },

  // ── Appointments ─────────────────────────────────────────────────────────────
  getAppointments(memberId: string): any[] { return lsGet(`appts_${memberId}`, []); },

  createAppointment(memberId: string, data: any): any {
    const appts = this.getAppointments(memberId);
    const appt = { ...data, id: uid(), createdAt: nowIso() };
    appts.push(appt);
    lsSet(`appts_${memberId}`, appts);
    return appt;
  },

  updateAppointment(memberId: string, id: string, data: any): any {
    const appts = this.getAppointments(memberId);
    const idx = appts.findIndex((a: any) => a.id === id);
    if (idx < 0) throw new Error("Appointment not found");
    appts[idx] = { ...appts[idx], ...data };
    lsSet(`appts_${memberId}`, appts);
    return appts[idx];
  },

  deleteAppointment(memberId: string, id: string) {
    lsSet(`appts_${memberId}`, this.getAppointments(memberId).filter((a: any) => a.id !== id));
  },

  // ── Med History ──────────────────────────────────────────────────────────────
  getMedHistory(memberId: string): any[] { return lsGet(`medhistory_${memberId}`, []); },

  logMedHistory(memberId: string, data: any): any {
    const hist = this.getMedHistory(memberId);
    const entry = { ...data, id: uid(), createdAt: nowIso() };
    hist.push(entry);
    lsSet(`medhistory_${memberId}`, hist);
    return entry;
  },

  removeMedHistory(memberId: string, medId: string, date: string) {
    lsSet(`medhistory_${memberId}`, this.getMedHistory(memberId).filter((h: any) => !(h.medId === medId && h.date === date)));
  },
};

export function isDbError(err: unknown): boolean {
  const msg = String(err);
  return msg.includes("kv_store_def98a55") || msg.includes("schema cache") || msg.includes("HTTP 500");
}
