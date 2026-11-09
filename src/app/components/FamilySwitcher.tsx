import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Plus, Trash2, X, UserPlus, Check, Loader2 } from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  FamilyMember,
  RELATIONSHIP_EMOJIS,
  RELATIONSHIP_LABELS,
  RELATIONSHIP_COLORS,
  RELATIONSHIPS,
} from "../utils/types";
import { ModalPortal } from "./ModalPortal";

// ── Small avatar circle ────────────────────────────────────────────────────────
function Avatar({
  member,
  size = 36,
  isActive = false,
}: {
  member: FamilyMember;
  size?: number;
  isActive?: boolean;
}) {
  const emoji = RELATIONSHIP_EMOJIS[member.relationship] ?? "👥";
  return (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 font-bold transition-all ${
        isActive ? "ring-2 ring-white ring-offset-1" : ""
      }`}
      style={{
        width: size,
        height: size,
        backgroundColor: member.avatarColor + "25",
        border: `2.5px solid ${member.avatarColor}`,
        fontSize: size * 0.45,
      }}
    >
      {emoji}
    </div>
  );
}

// ── Add Member Form ────────────────────────────────────────────────────────────
function AddMemberForm({ onClose }: { onClose: () => void }) {
  const { addFamilyMember } = useApp();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    relationship: "father" as string,
    age: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await addFamilyMember({
        name: form.name.trim(),
        relationship: form.relationship,
        age: form.age ? Number(form.age) : null,
        avatarColor: RELATIONSHIP_COLORS[form.relationship] ?? "#64748b",
      });
      onClose();
    } catch {
      // error handled in context
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <UserPlus size={20} className="text-blue-600" />
        </div>
        <div>
          <p className="text-lg font-bold text-slate-800">Add Family Member</p>
          <p className="text-sm text-slate-500">They'll have their own medication list</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-bold text-slate-600 mb-1">Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g., Dad, Mom, Grandpa"
            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base focus:border-blue-400 focus:outline-none"
            required
          />
        </div>

        {/* Relationship */}
        <div>
          <label className="block text-sm font-bold text-slate-600 mb-2">Relationship</label>
          <div className="grid grid-cols-3 gap-2">
            {RELATIONSHIPS.filter((r) => r !== "self").map((rel) => (
              <button
                key={rel}
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    relationship: rel,
                  }))
                }
                className={`py-2 px-1 rounded-xl text-sm font-semibold border-2 transition-all flex flex-col items-center gap-0.5 ${
                  form.relationship === rel
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                <span className="text-lg">{RELATIONSHIP_EMOJIS[rel]}</span>
                <span>{RELATIONSHIP_LABELS[rel]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Age */}
        <div>
          <label className="block text-sm font-bold text-slate-600 mb-1">Age (optional)</label>
          <input
            type="number"
            min="1"
            max="120"
            value={form.age}
            onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
            placeholder="e.g., 65"
            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-base focus:border-blue-400 focus:outline-none"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !form.name.trim()}
            className="flex-1 py-3 rounded-xl bg-blue-600 disabled:bg-slate-300 text-white font-bold flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            Add
          </button>
        </div>
      </form>
    </motion.div>
  );
}

// ── Member Row ─────────────────────────────────────────────────────────────────
function MemberRow({
  member,
  isActive,
  onSelect,
  onDelete,
}: {
  member: FamilyMember;
  isActive: boolean;
  onSelect: () => void;
  onDelete?: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${
        isActive ? "bg-blue-50 border-2 border-blue-200" : "border-2 border-transparent"
      }`}
    >
      <button className="flex-1 flex items-center gap-3 text-left" onClick={onSelect}>
        <Avatar member={member} size={44} isActive={isActive} />
        <div className="flex-1 min-w-0">
          <p className={`text-lg font-bold truncate ${isActive ? "text-blue-700" : "text-slate-800"}`}>
            {member.name}
            {member.id === "self" && (
              <span className="text-sm font-normal text-slate-400 ml-1">(You)</span>
            )}
          </p>
          <p className="text-sm text-slate-500">
            {RELATIONSHIP_EMOJIS[member.relationship]} {RELATIONSHIP_LABELS[member.relationship]}
            {member.age ? ` · ${member.age} yrs` : ""}
          </p>
        </div>
        {isActive && <Check size={22} className="text-blue-600 flex-shrink-0" />}
      </button>

      {member.id !== "self" && onDelete && (
        <>
          {confirmDelete ? (
            <div className="flex gap-1">
              <button
                onClick={() => { onDelete(); setConfirmDelete(false); }}
                className="px-2 py-1 bg-rose-500 text-white text-xs font-bold rounded-lg"
              >
                Remove
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 bg-slate-200 text-slate-600 text-xs font-bold rounded-lg"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-2 rounded-xl text-slate-300 hover:text-rose-400 hover:bg-rose-50 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── Main FamilySwitcher component ──────────────────────────────────────────────
export function FamilySwitcher() {
  const { familyMembers, currentMember, currentMemberId, switchMember, deleteFamilyMember } =
    useApp();
  const [open, setOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <>
      {/* Header trigger */}
      <button
        onClick={() => { setOpen(true); setShowAddForm(false); }}
        className="flex items-center gap-2 py-1.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 transition-colors"
      >
        <Avatar member={currentMember} size={28} />
        <span className="text-sm font-bold text-slate-700 max-w-[90px] truncate">
          {currentMember.name}
        </span>
        <ChevronDown size={16} className="text-slate-500" />
      </button>

      {/* Bottom sheet overlay — rendered via portal */}
      <AnimatePresence>
        {open && (
          <ModalPortal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-[9999] flex items-end justify-center"
              onClick={(e) => e.target === e.currentTarget && setOpen(false)}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 280 }}
                className="bg-white rounded-t-3xl w-full max-w-md px-5 pb-10 pt-4 max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Handle + header */}
                <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4" />

                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-slate-800">
                    {showAddForm ? "New Member" : "Family Members"}
                  </h2>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {showAddForm ? (
                    <AddMemberForm
                      key="add-form"
                      onClose={() => setShowAddForm(false)}
                    />
                  ) : (
                    <motion.div
                      key="member-list"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col gap-2"
                    >
                      {/* Current member banner */}
                      <div
                        className="p-3 rounded-2xl mb-2 text-sm text-center font-semibold"
                        style={{ backgroundColor: currentMember.avatarColor + "15", color: currentMember.avatarColor }}
                      >
                        Viewing medications for{" "}
                        <span className="font-bold">{currentMember.name}</span>
                      </div>

                      {/* Member list */}
                      {familyMembers.map((member) => (
                        <MemberRow
                          key={member.id}
                          member={member}
                          isActive={member.id === currentMemberId}
                          onSelect={() => {
                            switchMember(member);
                            setOpen(false);
                          }}
                          onDelete={() => deleteFamilyMember(member.id)}
                        />
                      ))}

                      {/* Add member button */}
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="mt-3 w-full py-4 rounded-2xl border-2 border-dashed border-blue-300 text-blue-600 font-bold text-base flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors"
                      >
                        <Plus size={22} />
                        Add Family Member
                      </button>

                      <p className="text-center text-sm text-slate-400 mt-2">
                        Each member has their own private medication list
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          </ModalPortal>
        )}
      </AnimatePresence>
    </>
  );
}