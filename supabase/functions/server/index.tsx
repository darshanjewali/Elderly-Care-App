import { Hono } from "npm:hono";
import * as kv from "./kv_store.tsx";

// ── App with basePath (all routes are relative to this) ────────────────────────
const app = new Hono().basePath("/make-server-def98a55");

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
  "Access-Control-Max-Age": "600",
};

// ── KV key helper ─────────────────────────────────────────────────────────────
function mk(memberId: string, suffix: string): string {
  const safe = memberId.replace(/[^a-zA-Z0-9]/g, "_");
  return `${safe}__${suffix}`;
}

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/health", (c) => c.json({ status: "ok" }));

// ── Family Members (global) ───────────────────────────────────────────────────
app.get("/family", async (c) => {
  try {
    const members = (await kv.get("family_members")) ?? [];
    return c.json(members);
  } catch (err) {
    console.error("GET /family error:", err);
    return c.json({ error: String(err) }, 500);
  }
});

app.post("/family", async (c) => {
  try {
    const body = await c.req.json();
    const members: any[] = ((await kv.get("family_members")) ?? []) as any[];
    const member = {
      id: body.id ?? `m_${Date.now()}`,
      name: body.name ?? "Member",
      relationship: body.relationship ?? "other",
      age: body.age ?? null,
      avatarColor: body.avatarColor ?? "#64748b",
      createdAt: new Date().toISOString(),
    };
    const idx = members.findIndex((m: any) => m.id === member.id);
    if (idx >= 0) {
      members[idx] = { ...members[idx], ...member };
    } else {
      members.push(member);
    }
    await kv.set("family_members", members);
    return c.json(member, 201);
  } catch (err) {
    console.error("POST /family error:", err);
    return c.json({ error: String(err) }, 500);
  }
});

app.put("/family/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const members: any[] = ((await kv.get("family_members")) ?? []) as any[];
    const idx = members.findIndex((m: any) => m.id === id);
    if (idx === -1) return c.json({ error: "Not found" }, 404);
    members[idx] = { ...members[idx], ...body };
    await kv.set("family_members", members);
    return c.json(members[idx]);
  } catch (err) {
    console.error("PUT /family/:id error:", err);
    return c.json({ error: String(err) }, 500);
  }
});

app.delete("/family/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const members: any[] = ((await kv.get("family_members")) ?? []) as any[];
    await kv.set("family_members", members.filter((m: any) => m.id !== id));
    return c.json({ success: true });
  } catch (err) {
    console.error("DELETE /family/:id error:", err);
    return c.json({ error: String(err) }, 500);
  }
});

// ── Medications (member-scoped) ───────────────────────────────────────────────
app.get("/medications", async (c) => {
  try {
    const memberId = c.req.query("member") || "self";
    let meds = ((await kv.get(mk(memberId, "medications"))) ?? []) as any[];
    if (memberId === "self" && meds.length === 0) {
      const old = await kv.get("medications");
      if (old) {
        meds = old as any[];
        await kv.set(mk("self", "medications"), meds);
      }
    }
    return c.json(meds);
  } catch (err) {
    console.error("GET /medications error:", err);
    return c.json({ error: String(err) }, 500);
  }
});

app.post("/medications", async (c) => {
  try {
    const memberId = c.req.query("member") || "self";
    const body = await c.req.json();
    const meds: any[] = ((await kv.get(mk(memberId, "medications"))) ?? []) as any[];
    const med = {
      id: `med_${Date.now()}`,
      name: body.name,
      dosage: body.dosage,
      timeSlot: body.timeSlot,
      scheduledTime: body.scheduledTime,
      pillColor: body.pillColor ?? "#3b82f6",
      pillType: body.pillType ?? "tablet",
      notes: body.notes ?? "",
      createdAt: new Date().toISOString(),
    };
    meds.push(med);
    await kv.set(mk(memberId, "medications"), meds);
    return c.json(med, 201);
  } catch (err) {
    console.error("POST /medications error:", err);
    return c.json({ error: String(err) }, 500);
  }
});

app.put("/medications/:id", async (c) => {
  try {
    const memberId = c.req.query("member") || "self";
    const id = c.req.param("id");
    const body = await c.req.json();
    const meds: any[] = ((await kv.get(mk(memberId, "medications"))) ?? []) as any[];
    const idx = meds.findIndex((m: any) => m.id === id);
    if (idx === -1) return c.json({ error: "Not found" }, 404);
    meds[idx] = { ...meds[idx], ...body };
    await kv.set(mk(memberId, "medications"), meds);
    return c.json(meds[idx]);
  } catch (err) {
    console.error("PUT /medications/:id error:", err);
    return c.json({ error: String(err) }, 500);
  }
});

app.delete("/medications/:id", async (c) => {
  try {
    const memberId = c.req.query("member") || "self";
    const id = c.req.param("id");
    const meds: any[] = ((await kv.get(mk(memberId, "medications"))) ?? []) as any[];
    await kv.set(mk(memberId, "medications"), meds.filter((m: any) => m.id !== id));
    return c.json({ success: true });
  } catch (err) {
    console.error("DELETE /medications/:id error:", err);
    return c.json({ error: String(err) }, 500);
  }
});

// ── Taken (member-scoped) ─────────────────────────────────────────────────────
app.get("/taken/:date", async (c) => {
  try {
    const memberId = c.req.query("member") || "self";
    const date = c.req.param("date");
    let taken = ((await kv.get(mk(memberId, `taken_${date}`))) ?? []) as string[];
    if (memberId === "self" && taken.length === 0) {
      const old = await kv.get(`taken_${date}`);
      if (old) {
        taken = old as string[];
        await kv.set(mk("self", `taken_${date}`), taken);
      }
    }
    return c.json(taken);
  } catch (err) {
    console.error("GET /taken/:date error:", err);
    return c.json({ error: String(err) }, 500);
  }
});

app.post("/taken/:date", async (c) => {
  try {
    const memberId = c.req.query("member") || "self";
    const date = c.req.param("date");
    const { medId, taken } = await c.req.json();
    let list: string[] = ((await kv.get(mk(memberId, `taken_${date}`))) ?? []) as string[];
    list = taken
      ? [...new Set([...list, medId])]
      : list.filter((id: string) => id !== medId);
    await kv.set(mk(memberId, `taken_${date}`), list);
    return c.json({ success: true, taken: list });
  } catch (err) {
    console.error("POST /taken/:date error:", err);
    return c.json({ error: String(err) }, 500);
  }
});

// ── Vitals (member-scoped) ────────────────────────────────────────────────────
app.get("/vitals", async (c) => {
  try {
    const memberId = c.req.query("member") || "self";
    const [bs, bp] = await Promise.all([
      kv.get(mk(memberId, "vitals_bs")),
      kv.get(mk(memberId, "vitals_bp")),
    ]);
    const bloodSugar =
      (bs as any[] | null) ??
      (memberId === "self" ? ((await kv.get("vitals_bs")) as any[] | null) : null) ??
      [];
    const bloodPressure =
      (bp as any[] | null) ??
      (memberId === "self" ? ((await kv.get("vitals_bp")) as any[] | null) : null) ??
      [];
    return c.json({ bloodSugar, bloodPressure });
  } catch (err) {
    console.error("GET /vitals error:", err);
    return c.json({ error: String(err) }, 500);
  }
});

app.post("/vitals/blood-sugar", async (c) => {
  try {
    const memberId = c.req.query("member") || "self";
    const body = await c.req.json();
    const entries: any[] = ((await kv.get(mk(memberId, "vitals_bs"))) ?? []) as any[];
    const entry = {
      id: `bs_${Date.now()}`,
      value: Number(body.value),
      note: body.note ?? "",
      timestamp: new Date().toISOString(),
    };
    entries.push(entry);
    await kv.set(mk(memberId, "vitals_bs"), entries.slice(-50));
    return c.json(entry, 201);
  } catch (err) {
    console.error("POST /vitals/blood-sugar error:", err);
    return c.json({ error: String(err) }, 500);
  }
});

app.post("/vitals/blood-pressure", async (c) => {
  try {
    const memberId = c.req.query("member") || "self";
    const body = await c.req.json();
    const entries: any[] = ((await kv.get(mk(memberId, "vitals_bp"))) ?? []) as any[];
    const entry = {
      id: `bp_${Date.now()}`,
      systolic: Number(body.systolic),
      diastolic: Number(body.diastolic),
      pulse: body.pulse != null ? Number(body.pulse) : null,
      note: body.note ?? "",
      timestamp: new Date().toISOString(),
    };
    entries.push(entry);
    await kv.set(mk(memberId, "vitals_bp"), entries.slice(-50));
    return c.json(entry, 201);
  } catch (err) {
    console.error("POST /vitals/blood-pressure error:", err);
    return c.json({ error: String(err) }, 500);
  }
});

// ── Steps (member-scoped) ─────────────────────────────────────────────────────
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function utcDateStr(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

app.get("/steps", async (c) => {
  try {
    const memberId = c.req.query("member") || "self";
    const today = new Date();
    const dates: string[] = [];
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      dates.push(utcDateStr(d));
      days.push(DAY_NAMES[d.getUTCDay()]);
    }
    const counts = await Promise.all(
      dates.map((dt) => kv.get(mk(memberId, `steps_${dt}`)))
    );
    return c.json(
      dates.map((date, i) => ({ date, day: days[i], steps: Number(counts[i] ?? 0) }))
    );
  } catch (err) {
    console.error("GET /steps error:", err);
    return c.json({ error: String(err) }, 500);
  }
});

app.get("/steps/:date", async (c) => {
  try {
    const memberId = c.req.query("member") || "self";
    const date = c.req.param("date");
    const steps = (await kv.get(mk(memberId, `steps_${date}`))) ?? 0;
    return c.json({ date, steps: Number(steps) });
  } catch (err) {
    console.error("GET /steps/:date error:", err);
    return c.json({ error: String(err) }, 500);
  }
});

app.post("/steps/:date", async (c) => {
  try {
    const memberId = c.req.query("member") || "self";
    const date = c.req.param("date");
    const { steps } = await c.req.json();
    await kv.set(mk(memberId, `steps_${date}`), Number(steps));
    return c.json({ date, steps: Number(steps) });
  } catch (err) {
    console.error("POST /steps/:date error:", err);
    return c.json({ error: String(err) }, 500);
  }
});

// ── Medication History (member-scoped) ────────────────────────────────────────
app.get("/med-history", async (c) => {
  try {
    const memberId = c.req.query("member") || "self";
    const history = ((await kv.get(mk(memberId, "med_history"))) ?? []) as any[];
    return c.json(history);
  } catch (err) {
    console.error("GET /med-history error:", err);
    return c.json({ error: String(err) }, 500);
  }
});

app.post("/med-history", async (c) => {
  try {
    const memberId = c.req.query("member") || "self";
    const body = await c.req.json();
    const history: any[] = ((await kv.get(mk(memberId, "med_history"))) ?? []) as any[];
    const entry = {
      id: `mh_${Date.now()}`,
      medId: body.medId,
      medName: body.medName,
      dosage: body.dosage,
      timeSlot: body.timeSlot,
      pillColor: body.pillColor ?? "#3b82f6",
      pillType: body.pillType ?? "tablet",
      date: body.date,
      takenAt: new Date().toISOString(),
    };
    // Remove existing entry for same medId+date before inserting
    const filtered = history.filter(
      (h: any) => !(h.medId === entry.medId && h.date === entry.date)
    );
    filtered.push(entry);
    await kv.set(mk(memberId, "med_history"), filtered.slice(-300));
    return c.json(entry, 201);
  } catch (err) {
    console.error("POST /med-history error:", err);
    return c.json({ error: String(err) }, 500);
  }
});

app.delete("/med-history", async (c) => {
  try {
    const memberId = c.req.query("member") || "self";
    const medId = c.req.query("medId");
    const date = c.req.query("date");
    const history: any[] = ((await kv.get(mk(memberId, "med_history"))) ?? []) as any[];
    await kv.set(
      mk(memberId, "med_history"),
      history.filter((h: any) => !(h.medId === medId && h.date === date))
    );
    return c.json({ success: true });
  } catch (err) {
    console.error("DELETE /med-history error:", err);
    return c.json({ error: String(err) }, 500);
  }
});

// ── Doctor Appointments (member-scoped) ───────────────────────────────────────
app.get("/appointments", async (c) => {
  try {
    const memberId = c.req.query("member") || "self";
    const appointments = ((await kv.get(mk(memberId, "appointments"))) ?? []) as any[];
    return c.json(appointments);
  } catch (err) {
    console.error("GET /appointments error:", err);
    return c.json({ error: String(err) }, 500);
  }
});

app.post("/appointments", async (c) => {
  try {
    const memberId = c.req.query("member") || "self";
    const body = await c.req.json();
    const appointments: any[] = ((await kv.get(mk(memberId, "appointments"))) ?? []) as any[];
    const appt = {
      id: `appt_${Date.now()}`,
      doctorName: body.doctorName ?? "Unknown Doctor",
      specialty: body.specialty ?? "",
      date: body.date,
      time: body.time ?? "",
      location: body.location ?? "",
      notes: body.notes ?? "",
      status: body.status ?? "upcoming",
      createdAt: new Date().toISOString(),
    };
    appointments.push(appt);
    await kv.set(mk(memberId, "appointments"), appointments);
    return c.json(appt, 201);
  } catch (err) {
    console.error("POST /appointments error:", err);
    return c.json({ error: String(err) }, 500);
  }
});

app.put("/appointments/:id", async (c) => {
  try {
    const memberId = c.req.query("member") || "self";
    const id = c.req.param("id");
    const body = await c.req.json();
    const appointments: any[] = ((await kv.get(mk(memberId, "appointments"))) ?? []) as any[];
    const idx = appointments.findIndex((a: any) => a.id === id);
    if (idx === -1) return c.json({ error: "Not found" }, 404);
    appointments[idx] = { ...appointments[idx], ...body };
    await kv.set(mk(memberId, "appointments"), appointments);
    return c.json(appointments[idx]);
  } catch (err) {
    console.error("PUT /appointments/:id error:", err);
    return c.json({ error: String(err) }, 500);
  }
});

app.delete("/appointments/:id", async (c) => {
  try {
    const memberId = c.req.query("member") || "self";
    const id = c.req.param("id");
    const appointments: any[] = ((await kv.get(mk(memberId, "appointments"))) ?? []) as any[];
    await kv.set(mk(memberId, "appointments"), appointments.filter((a: any) => a.id !== id));
    return c.json({ success: true });
  } catch (err) {
    console.error("DELETE /appointments/:id error:", err);
    return c.json({ error: String(err) }, 500);
  }
});

// ── Deno.serve with CORS wrapper ──────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  const res = await app.fetch(req);
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS)) {
    headers.set(k, v);
  }
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
});
