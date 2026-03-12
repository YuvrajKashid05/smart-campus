import { useEffect, useState } from "react";
import {
  MdBarChart,
  MdCalendarMonth,
  MdCheckCircle,
  MdClose,
  MdError,
  MdGroup,
  MdPerson,
  MdPersonAdd,
  MdRefresh,
  MdSearch,
} from "react-icons/md";
import * as attendanceService from "../../services/attendance";
import * as usersService from "../../services/users";

const AttendanceReport = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Manual mark state
  const [showManualPanel, setShowManualPanel] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [markingId, setMarkingId] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await attendanceService.getMySessions();
      if (data?.ok) setSessions(data.sessions || []);
      else setError(data?.error || "Failed to load sessions.");
    } catch (err) {
      const status = err.response?.status;
      if (status === 404)
        setError(
          "Backend not updated. Restart the server after replacing files.",
        );
      else
        setError(
          err.response?.data?.error ||
            err.message ||
            "Failed to load sessions.",
        );
    } finally {
      setLoading(false);
    }
  };

  const viewRecords = async (session) => {
    setSelectedSession(session);
    setShowManualPanel(false);
    setStudentSearch("");
    setRecordsLoading(true);
    try {
      const data = await attendanceService.getSessionRecords(session._id);
      setRecords(data?.records || []);
    } catch {
      setRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  };

  // Load all students for this session's dept/section/semester
  const openManualPanel = async () => {
    setShowManualPanel(true);
    if (allStudents.length > 0) return; // already loaded
    setStudentsLoading(true);
    try {
      const data = await usersService.getAllUsers();
      const students = (data?.users || []).filter((u) => {
        if (u.role !== "STUDENT") return false;
        if (
          selectedSession.dept &&
          u.dept?.toUpperCase() !== selectedSession.dept
        )
          return false;
        if (
          selectedSession.section &&
          u.section?.toUpperCase() !== selectedSession.section
        )
          return false;
        if (
          selectedSession.semester > 0 &&
          u.semester !== selectedSession.semester
        )
          return false;
        return true;
      });
      setAllStudents(students);
    } catch {
      setError("Failed to load student list.");
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleManualMark = async (student) => {
    setMarkingId(student._id);
    setError("");
    setSuccess("");
    try {
      const res = await attendanceService.manualMarkStudent(
        selectedSession._id,
        student._id,
      );
      if (res.ok) {
        if (res.alreadyMarked) {
          setSuccess(`${student.name} was already marked present.`);
        } else {
          setSuccess(`✅ ${student.name} marked present successfully!`);
          // Refresh records
          const updated = await attendanceService.getSessionRecords(
            selectedSession._id,
          );
          setRecords(updated?.records || []);
        }
        setTimeout(() => setSuccess(""), 4000);
      } else {
        setError(res.error || "Failed to mark attendance.");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to mark attendance.");
    } finally {
      setMarkingId(null);
    }
  };

  const markedIds = new Set(records.map((r) => String(r.student?._id)));

  const filteredStudents = allStudents.filter((s) => {
    if (!studentSearch) return true;
    return (
      s.name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.rollNo?.toLowerCase().includes(studentSearch.toLowerCase())
    );
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
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <MdBarChart className="text-indigo-500" /> Attendance Report
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              View sessions, records, and manually mark absent students
            </p>
          </div>
          <button
            onClick={fetchSessions}
            className="flex items-center gap-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
          >
            <MdRefresh size={18} /> Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-4">
            <MdError className="text-red-500 shrink-0 mt-0.5" size={20} />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-4">
            <MdCheckCircle className="text-green-500 shrink-0" size={20} />
            <p className="text-green-800 text-sm font-medium">{success}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sessions list — left column */}
          <div>
            <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              <MdCalendarMonth className="text-blue-500" /> My Sessions (
              {sessions.length})
            </h2>
            {sessions.length === 0 && !error ? (
              <div className="bg-white rounded-xl shadow p-8 text-center">
                <MdBarChart className="text-gray-200 mx-auto mb-2" size={40} />
                <p className="text-gray-500 text-sm">
                  No sessions yet. Generate a QR code first.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                {sessions.map((s) => {
                  const expired = new Date(s.expiresAt) < new Date();
                  const isSelected = selectedSession?._id === s._id;
                  return (
                    <div
                      key={s._id}
                      onClick={() => viewRecords(s)}
                      className={`bg-white rounded-xl shadow-sm p-4 cursor-pointer border-2 transition ${isSelected ? "border-blue-500 shadow-md" : "border-transparent hover:border-blue-200"}`}
                    >
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-gray-900 text-sm">
                          {s.course}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold ${expired ? "bg-gray-100 text-gray-500" : "bg-green-100 text-green-700"}`}
                        >
                          {expired ? "Ended" : "Active"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {s.dept}
                        {s.section ? ` · Sec ${s.section}` : ""}
                        {s.semester > 0 ? ` · Sem ${s.semester}` : ""}
                      </p>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <MdCalendarMonth size={11} />
                        {new Date(s.createdAt).toLocaleDateString()}{" "}
                        {new Date(s.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Records + manual mark — right 2 columns */}
          <div className="lg:col-span-2">
            {!selectedSession ? (
              <div className="bg-white rounded-xl shadow p-12 text-center">
                <MdGroup className="text-gray-200 mx-auto mb-3" size={56} />
                <p className="text-gray-500">
                  Select a session from the left to view attendance
                </p>
              </div>
            ) : (
              <>
                {/* Session info bar */}
                <div className="bg-indigo-600 text-white rounded-xl px-5 py-3 mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">{selectedSession.course}</p>
                    <p className="text-indigo-200 text-xs">
                      {selectedSession.dept}
                      {selectedSession.section
                        ? ` · Sec ${selectedSession.section}`
                        : ""}
                      {selectedSession.semester > 0
                        ? ` · Sem ${selectedSession.semester}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-white text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">
                      {records.length} present
                    </span>
                    {/* Manual mark button */}
                    <button
                      onClick={openManualPanel}
                      className="flex items-center gap-1 bg-white text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition"
                    >
                      <MdPersonAdd size={15} /> Mark Manually
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Present students */}
                  <div className="bg-white rounded-xl shadow overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b flex items-center gap-2">
                      <MdCheckCircle className="text-green-500" size={18} />
                      <h3 className="font-semibold text-gray-800 text-sm">
                        Present Students
                      </h3>
                    </div>
                    {recordsLoading ? (
                      <div className="p-8 flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                      </div>
                    ) : records.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 text-sm">
                        No students marked yet
                      </div>
                    ) : (
                      <div className="divide-y max-h-80 overflow-y-auto">
                        {records.map((r, i) => (
                          <div
                            key={r._id}
                            className="flex items-center gap-3 px-4 py-2.5"
                          >
                            <span className="text-gray-300 text-xs w-5">
                              {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-sm truncate">
                                {r.student?.name}
                              </p>
                              <p className="text-xs text-gray-400">
                                {r.student?.rollNo} · {r.student?.dept}
                              </p>
                            </div>
                            <div className="text-right">
                              <MdCheckCircle
                                className="text-green-500"
                                size={18}
                              />
                              <p className="text-xs text-gray-400">
                                {new Date(r.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Manual mark panel */}
                  <div className="bg-white rounded-xl shadow overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MdPersonAdd className="text-blue-500" size={18} />
                        <h3 className="font-semibold text-gray-800 text-sm">
                          Mark Manually
                        </h3>
                      </div>
                      {showManualPanel && (
                        <button
                          onClick={() => setShowManualPanel(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <MdClose size={16} />
                        </button>
                      )}
                    </div>

                    {!showManualPanel ? (
                      <div className="p-8 text-center">
                        <MdPersonAdd
                          className="text-gray-200 mx-auto mb-3"
                          size={40}
                        />
                        <p className="text-gray-500 text-sm mb-4">
                          If a student couldn't scan the QR, mark them present
                          here.
                        </p>
                        <button
                          onClick={openManualPanel}
                          className="flex items-center gap-2 mx-auto bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 text-sm font-semibold transition"
                        >
                          <MdPersonAdd size={16} /> Open Student List
                        </button>
                      </div>
                    ) : studentsLoading ? (
                      <div className="p-8 flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                      </div>
                    ) : (
                      <>
                        {/* Search */}
                        <div className="px-3 pt-3 pb-2 border-b">
                          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5">
                            <MdSearch size={16} className="text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search name or roll no…"
                              value={studentSearch}
                              onChange={(e) => setStudentSearch(e.target.value)}
                              className="flex-1 bg-transparent outline-none text-sm"
                            />
                          </div>
                        </div>

                        {filteredStudents.length === 0 ? (
                          <div className="p-6 text-center text-gray-400 text-sm">
                            No students found
                          </div>
                        ) : (
                          <div className="divide-y max-h-72 overflow-y-auto">
                            {filteredStudents.map((student) => {
                              const alreadyMarked = markedIds.has(
                                String(student._id),
                              );
                              const isMarking = markingId === student._id;
                              return (
                                <div
                                  key={student._id}
                                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50"
                                >
                                  <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                                    <MdPerson
                                      className="text-blue-500"
                                      size={14}
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm truncate">
                                      {student.name}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      {student.rollNo} · {student.section}
                                    </p>
                                  </div>
                                  {alreadyMarked ? (
                                    <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                                      <MdCheckCircle size={15} /> Present
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleManualMark(student)}
                                      disabled={isMarking}
                                      className="flex items-center gap-1 bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition whitespace-nowrap"
                                    >
                                      {isMarking ? (
                                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                                      ) : (
                                        <MdPersonAdd size={13} />
                                      )}
                                      {isMarking ? "" : "Mark"}
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceReport;
