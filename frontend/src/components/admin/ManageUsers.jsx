import { useEffect, useState } from "react";
import { MdSearch, MdEdit, MdDelete, MdCheck, MdClose, MdRefresh, MdGroup } from "react-icons/md";
import * as usersService from "../../services/users";
import { PAGE, INPUT, BTN_PRIMARY, Loading, SectionCard, Alert, StatCard } from "../../ui";

const LABEL = "block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide";
const ROLE_BADGE = { STUDENT:"bg-blue-50 text-blue-700", FACULTY:"bg-emerald-50 text-emerald-700", ADMIN:"bg-violet-50 text-violet-700" };
const ROLE_COLOR = { STUDENT:"#6366f1", FACULTY:"#10b981", ADMIN:"#8b5cf6" };

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("ALL");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const load = () => {
    setLoading(true);
    usersService.getAllUsers().then(d => setUsers(d?.users || [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const flash = (m, t = "success") => {
    if (t === "success") { setSuccess(m); setTimeout(() => setSuccess(""), 3000); }
    else { setError(m); setTimeout(() => setError(""), 4000); }
  };
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const filtered = users.filter(u => {
    if (role !== "ALL" && u.role !== role) return false;
    const t = search.toLowerCase();
    return !t || u.name?.toLowerCase().includes(t) || u.email?.toLowerCase().includes(t) || u.rollNo?.toLowerCase().includes(t);
  });

  const openEdit = (u) => {
    setEditing(u);
    setForm({ name: u.name || "", dept: u.dept || "", semester: u.semester || "", section: u.section || "", rollNo: u.rollNo || "", mobileNumber: u.mobileNumber || "", isActive: u.isActive !== false });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await usersService.updateStudent(editing._id, { ...form, semester: form.semester ? parseInt(form.semester) : undefined });
      flash("User updated!"); setEditing(null); load();
    } catch (err) { flash(err.response?.data?.error || "Failed to update.", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this user permanently?")) return;
    setDeletingId(id);
    try { await usersService.deleteUser(id); flash("Deleted!"); setUsers(p => p.filter(u => u._id !== id)); }
    catch (err) { flash(err.response?.data?.error || "Failed.", "error"); }
    finally { setDeletingId(null); }
  };

  const counts = { ALL: users.length, STUDENT: users.filter(u => u.role === "STUDENT").length, FACULTY: users.filter(u => u.role === "FACULTY").length, ADMIN: users.filter(u => u.role === "ADMIN").length };

  return (
    <div className={PAGE + " fade-up"}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Manage Users</h1>
          <p className="text-slate-500 text-sm mt-0.5">{users.length} total users</p>
        </div>

        {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}
        {success && <div className="mb-4"><Alert type="success">{success}</Alert></div>}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <StatCard label="Students"  value={counts.STUDENT} color={ROLE_COLOR.STUDENT}  icon={MdGroup} />
          <StatCard label="Faculty"   value={counts.FACULTY}  color={ROLE_COLOR.FACULTY}  icon={MdGroup} />
          <StatCard label="Admins"    value={counts.ADMIN}    color={ROLE_COLOR.ADMIN}    icon={MdGroup} />
          <StatCard label="Inactive"  value={users.filter(u => u.isActive === false).length} color="#94a3b8" icon={MdGroup} />
        </div>

        <div className="flex flex-wrap gap-3 mb-5">
          {["ALL","STUDENT","FACULTY","ADMIN"].map(r => (
            <button key={r} onClick={() => setRole(r)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition ${role === r ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"}`}>
              {r === "ALL" ? "All Users" : r.charAt(0) + r.slice(1).toLowerCase() + "s"}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${role === r ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>{counts[r]}</span>
            </button>
          ))}
          <div className="relative ml-auto">
            <MdSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…"
              className="pl-8 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 outline-none bg-white w-48" />
          </div>
          <button onClick={load} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">
            <MdRefresh size={15} />
          </button>
        </div>

        <SectionCard>
          {loading ? <div className="p-10 flex justify-center"><div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-indigo-500 animate-spin" /></div>
          : <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-100">
                  {["User","Role","Info","Status","Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400 text-sm">No users found.</td></tr>}
                  {filtered.map(u => (
                    <tr key={u._id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ background: ROLE_COLOR[u.role] || "#6366f1" }}>
                            {u.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{u.name}</p>
                            <p className="text-xs text-slate-400 truncate max-w-[160px]">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_BADGE[u.role] || ""}`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {u.role === "STUDENT" && <>{u.dept} · Sem {u.semester} · {u.section}<br />{u.rollNo}</>}
                        {u.role === "FACULTY" && <>ID: {u.employeeId || "—"}<br />{u.dept || "—"}</>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.isActive !== false ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                          {u.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {u.role === "STUDENT" && (
                            <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"><MdEdit size={15} /></button>
                          )}
                          <button onClick={() => handleDelete(u._id)} disabled={deletingId === u._id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition">
                            {deletingId === u._id ? <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-200 border-t-red-500 animate-spin" /> : <MdDelete size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
        </SectionCard>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:"rgba(15,23,42,0.5)", backdropFilter:"blur(4px)" }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Edit Student</h2>
              <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition"><MdClose size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><label className={LABEL}>Name</label><input value={form.name || ""} onChange={e => set("name", e.target.value)} className={INPUT} /></div>
              <div className="grid grid-cols-3 gap-2">
                <div><label className={LABEL}>Dept</label><input value={form.dept || ""} onChange={e => set("dept", e.target.value.toUpperCase())} className={INPUT} /></div>
                <div><label className={LABEL}>Sem</label>
                  <select value={form.semester || ""} onChange={e => set("semester", e.target.value)} className={INPUT}>
                    <option value="">—</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div><label className={LABEL}>Sec</label><input value={form.section || ""} onChange={e => set("section", e.target.value.toUpperCase())} className={INPUT} /></div>
              </div>
              <div><label className={LABEL}>Roll No</label><input value={form.rollNo || ""} onChange={e => set("rollNo", e.target.value)} className={INPUT} /></div>
              <div><label className={LABEL}>Mobile</label><input value={form.mobileNumber || ""} onChange={e => set("mobileNumber", e.target.value)} className={INPUT} /></div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                <span className="text-sm font-medium text-slate-700">Active account</span>
                <button type="button" onClick={() => set("isActive", !form.isActive)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${form.isActive ? "bg-indigo-600" : "bg-slate-300"}`}>
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isActive ? "left-5" : "left-1"}`} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-slate-100">
              <button onClick={handleSave} disabled={saving} className={BTN_PRIMARY + " flex-1 justify-center"}>
                {saving ? <><div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />Saving…</> : <><MdCheck size={15} />Save</>}
              </button>
              <button onClick={() => setEditing(null)} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
