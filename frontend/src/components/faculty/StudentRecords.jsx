import { useContext, useEffect, useState } from "react";
import { MdSearch, MdRefresh, MdGroup } from "react-icons/md";
import { AuthContext } from "../../context/AuthContext";
import * as usersService from "../../services/users";
import { PAGE, Loading, Empty, SectionCard, StatCard } from "../../ui";

export default function StudentRecords() {
  const { user } = useContext(AuthContext);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSem, setFilterSem] = useState("ALL");
  const [filterDept, setFilterDept] = useState(user?.dept?.toUpperCase() || "ALL");

  const load = () => {
    setLoading(true);
    usersService.getAllUsers().then(d => setStudents((d?.users || []).filter(u => u.role === "STUDENT"))).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const depts = ["ALL", ...Array.from(new Set(students.map(s => s.dept).filter(Boolean)))];
  const filtered = students.filter(s => {
    const t = search.toLowerCase();
    if (filterDept !== "ALL" && s.dept !== filterDept) return false;
    if (filterSem !== "ALL" && String(s.semester) !== filterSem) return false;
    return !t || s.name?.toLowerCase().includes(t) || s.rollNo?.toLowerCase().includes(t) || s.email?.toLowerCase().includes(t);
  });

  if (loading) return <div className={PAGE}><Loading /></div>;

  return (
    <div className={PAGE + " fade-up"}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Student Records</h1>
            <p className="text-slate-500 text-sm mt-0.5">{filtered.length} students shown</p>
          </div>
          <button onClick={load} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition">
            <MdRefresh size={15} />Refresh
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <StatCard label="Total Students" value={students.length}                                color="#6366f1" icon={MdGroup} />
          <StatCard label="Showing"        value={filtered.length}                               color="#10b981" icon={MdGroup} />
          <StatCard label="Active"         value={students.filter(s => s.isActive !== false).length} color="#f59e0b" icon={MdGroup} />
        </div>

        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative">
            <MdSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, roll or email…"
              className="pl-8 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 outline-none bg-white w-52" />
          </div>
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:border-indigo-500 outline-none">
            {depts.map(d => <option key={d} value={d}>{d === "ALL" ? "All Depts" : d}</option>)}
          </select>
          <select value={filterSem} onChange={e => setFilterSem(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:border-indigo-500 outline-none">
            <option value="ALL">All Semesters</option>
            {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={String(s)}>Semester {s}</option>)}
          </select>
        </div>

        <SectionCard>
          {filtered.length === 0 ? <Empty icon={MdGroup} title="No students found" />
          : <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-100">
                  {["Student","Roll No","Department","Sem · Sec","Contact","Status"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map(s => (
                    <tr key={s._id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                            {s.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{s.name}</p>
                            <p className="text-xs text-slate-400">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-mono text-xs">{s.rollNo || "—"}</td>
                      <td className="px-4 py-3"><span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">{s.dept || "—"}</span></td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{s.semester ? `Sem ${s.semester}` : "—"}{s.section ? ` · ${s.section}` : ""}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{s.mobileNumber || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.isActive !== false ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                          {s.isActive !== false ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}
        </SectionCard>
      </div>
    </div>
  );
}
