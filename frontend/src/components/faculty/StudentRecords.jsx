import { useContext, useEffect, useState } from "react";
import {
  MdError,
  MdPerson,
  MdRefresh,
  MdSchool,
  MdSearch,
} from "react-icons/md";
import { AuthContext } from "../../context/AuthContext";
import * as usersService from "../../services/users";

const StudentRecords = () => {
  const { user } = useContext(AuthContext);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSemester, setFilterSemester] = useState("ALL");
  const [filterDept, setFilterDept] = useState(
    user?.dept?.toUpperCase() || "ALL",
  );

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await usersService.getAllUsers();
      // service spreads response.data so users is at top-level
      const allUsers = res?.users || res?.data || [];
      const onlyStudents = allUsers.filter((u) => u.role === "STUDENT");
      setStudents(onlyStudents);
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.error || err.message || "Unknown error";
      if (status === 401) setError("Session expired. Please log in again.");
      else if (status === 403)
        setError("Access denied. Faculty role required.");
      else setError(`Failed to load students: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const depts = [
    ...new Set(students.map((s) => s.dept).filter(Boolean)),
  ].sort();
  const semesters = [
    ...new Set(students.map((s) => s.semester).filter(Boolean)),
  ].sort((a, b) => a - b);

  const filtered = students.filter((s) => {
    const matchDept =
      filterDept === "ALL" || s.dept?.toUpperCase() === filterDept;
    const matchSem =
      filterSemester === "ALL" || String(s.semester) === filterSemester;
    const matchSearch =
      !searchTerm ||
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchDept && matchSem && matchSearch;
  });

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <MdSchool className="text-pink-500" /> Student Records
            </h1>
            <p className="text-gray-600 mt-1">
              {user?.dept ? `Your dept: ${user.dept}` : "All departments"} —{" "}
              {students.length} total students
            </p>
          </div>
          <button
            onClick={fetchStudents}
            className="flex items-center gap-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
          >
            <MdRefresh size={18} /> Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
            <MdError className="text-red-500 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-red-800 font-semibold text-sm">
                Error loading student records
              </p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 flex-1 min-w-48">
            <MdSearch size={20} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, roll no, email…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>

          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          >
            <option value="ALL">All Departments</option>
            {depts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={filterSemester}
            onChange={(e) => setFilterSemester(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          >
            <option value="ALL">All Semesters</option>
            {semesters.map((s) => (
              <option key={s} value={String(s)}>
                Semester {s}
              </option>
            ))}
          </select>

          <span className="text-sm text-gray-500 whitespace-nowrap">
            Showing {filtered.length}
          </span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  {[
                    "#",
                    "Name",
                    "Roll No",
                    "Email",
                    "Dept",
                    "Semester",
                    "Section",
                    "Mobile",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                          <MdPerson className="text-blue-500" size={16} />
                        </div>
                        <span className="font-semibold text-gray-900">
                          {s.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-blue-700">
                      {s.rollNo || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.email}</td>
                    <td className="px-4 py-3 text-gray-700">{s.dept || "—"}</td>
                    <td className="px-4 py-3">
                      {s.semester ? (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                          Sem {s.semester}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">{s.section || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {s.mobileNumber || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${s.isActive !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                      >
                        {s.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && !error && (
              <div className="text-center py-12">
                <MdSchool className="text-gray-200 mx-auto mb-3" size={48} />
                <p className="text-gray-500">
                  {students.length === 0
                    ? "No students registered yet."
                    : "No students match your filters."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentRecords;
