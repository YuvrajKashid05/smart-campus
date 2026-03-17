import { useEffect, useMemo, useState } from "react";
import {
  MdCheckCircle,
  MdDelete,
  MdGroups,
  MdOutlineHistory,
  MdPersonAdd,
  MdRefresh,
  MdSearch,
  MdWarning,
} from "react-icons/md";
import * as attendanceService from "../../services/attendance";
import * as usersService from "../../services/users";
import { Alert, BTN_GHOST, PAGE } from "../../ui";

function formatSessionLabel(session) {
  return [
    session?.dept,
    session?.section ? `Sec ${session.section}` : "",
    session?.semester ? `Sem ${session.semester}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

export default function AttendanceReport() {
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const [markingId, setMarkingId] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingSessionId, setDeletingSessionId] = useState("");
  const [unmarkingId, setUnmarkingId] = useState("");

  const flash = (message, type = "success") => {
    if (type === "success") {
      setSuccess(message);
      setTimeout(() => setSuccess(""), 2500);
    } else {
      setError(message);
      setTimeout(() => setError(""), 3500);
    }
  };

  const loadSessions = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await attendanceService.getMySessions();
      if (!res?.ok) throw new Error(res?.error || "Failed to load sessions.");
      const nextSessions = res.sessions || [];
      setSessions(nextSessions);

      if (!nextSessions.length) {
        setSelected(null);
        setRecords([]);
        return;
      }

      if (!selected?._id) {
        setSelected(nextSessions[0]);
        return;
      }

      const stillExists = nextSessions.find((s) => s._id === selected._id);
      setSelected(stillExists || nextSessions[0]);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load sessions.",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadRecords = async (session) => {
    if (!session?._id) return;
    setRecordsLoading(true);
    setError("");
    try {
      const res = await attendanceService.getSessionRecords(session._id);
      if (!res?.ok) throw new Error(res?.error || "Failed to load records.");
      setRecords(res.records || []);
    } catch (err) {
      setRecords([]);
      setError(
        err?.response?.data?.error || err?.message || "Failed to load records.",
      );
    } finally {
      setRecordsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (selected?._id) {
      loadRecords(selected);
    }
  }, [selected?._id]);

  const openManualMark = async () => {
    if (!selected?._id) return;
    setShowManual(true);
    if (students.length) return;

    setManualLoading(true);
    try {
      const res = await usersService.getAllUsers({
        role: "STUDENT",
        dept: selected?.dept || undefined,
      });

      const filtered = (res?.users || []).filter((student) => {
        const deptOk = !selected?.dept || student?.dept === selected.dept;
        const sectionOk =
          !selected?.section || student?.section === selected.section;
        const semesterOk =
          !selected?.semester ||
          Number(student?.semester) === Number(selected.semester);

        return student?.role === "STUDENT" && deptOk && sectionOk && semesterOk;
      });

      setStudents(filtered);
    } catch {
      flash("Failed to load students.", "error");
    } finally {
      setManualLoading(false);
    }
  };

  const handleManualMark = async (studentId) => {
    if (!selected?._id || !studentId) return;

    setMarkingId(studentId);
    try {
      const res = await attendanceService.manualMarkStudent(
        selected._id,
        studentId,
      );
      if (!res?.ok) throw new Error(res?.error || "Failed to mark attendance.");

      flash(
        res.alreadyMarked
          ? "Attendance already marked for this student."
          : "Student marked present.",
      );

      await loadRecords(selected);
    } catch (err) {
      flash(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to mark attendance.",
        "error",
      );
    } finally {
      setMarkingId("");
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!sessionId) return;

    const confirmed = window.confirm(
      "Delete this session? All attendance records of this session will also be deleted.",
    );
    if (!confirmed) return;

    setDeletingSessionId(sessionId);
    try {
      const res = await attendanceService.deleteSession(sessionId);
      if (!res?.ok) {
        throw new Error(res?.error || "Failed to delete session.");
      }

      const nextSessions = sessions.filter((s) => s._id !== sessionId);
      setSessions(nextSessions);

      if (selected?._id === sessionId) {
        setSelected(nextSessions[0] || null);
        setRecords([]);
        setShowManual(false);
      }

      flash("Session deleted successfully.");
    } catch (err) {
      flash(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to delete session.",
        "error",
      );
    } finally {
      setDeletingSessionId("");
    }
  };

  const handleUnmark = async (recordId) => {
    if (!selected?._id || !recordId) return;

    const confirmed = window.confirm("Unmark this flagged attendance record?");
    if (!confirmed) return;

    setUnmarkingId(recordId);
    try {
      const res = await attendanceService.unmarkAttendance(
        selected._id,
        recordId,
      );
      if (!res?.ok) {
        throw new Error(res?.error || "Failed to unmark attendance.");
      }

      setRecords((prev) => prev.filter((r) => r._id !== recordId));
      flash("Flagged attendance unmarked.");
    } catch (err) {
      flash(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to unmark attendance.",
        "error",
      );
    } finally {
      setUnmarkingId("");
    }
  };

  const markedIds = useMemo(
    () =>
      new Set(
        records.map((record) =>
          String(record?.student?._id || record?.student),
        ),
      ),
    [records],
  );

  const filteredStudents = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return students;

    return students.filter(
      (student) =>
        student?.name?.toLowerCase().includes(term) ||
        student?.rollNo?.toLowerCase().includes(term) ||
        student?.email?.toLowerCase().includes(term),
    );
  }, [students, query]);

  return (
    <div className={`${PAGE} fade-up`}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Attendance Report
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              View session-wise attendance, unmark flagged records, and delete
              accidental sessions.
            </p>
          </div>

          <button
            type="button"
            onClick={loadSessions}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <MdRefresh size={16} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        {success && (
          <div className="mb-4">
            <Alert type="success">{success}</Alert>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[330px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-900">
                My sessions
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Select a class session to see attendance records.
              </p>
            </div>

            <div className="max-h-170 overflow-y-auto p-3">
              {loading ? (
                <div className="p-4 text-sm text-slate-500">
                  Loading sessions…
                </div>
              ) : sessions.length === 0 ? (
                <div className="p-4 text-sm text-slate-500">
                  No attendance sessions found yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.map((session) => {
                    const active = selected?._id === session._id;
                    const expired =
                      new Date(session.expiresAt).getTime() < Date.now();

                    return (
                      <div
                        key={session._id}
                        className={`rounded-xl border px-4 py-3 transition ${
                          active
                            ? "border-indigo-200 bg-indigo-50"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(session);
                            setShowManual(false);
                          }}
                          className="w-full text-left"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {session.course}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {formatSessionLabel(session)}
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {new Date(session.createdAt).toLocaleString()}
                              </p>
                            </div>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                expired
                                  ? "bg-slate-100 text-slate-600"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {expired ? "Ended" : "Live"}
                            </span>
                          </div>
                        </button>

                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={() => handleDeleteSession(session._id)}
                            disabled={deletingSessionId === session._id}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                          >
                            <MdDelete size={15} />
                            {deletingSessionId === session._id
                              ? "Deleting..."
                              : "Delete Session"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            {!selected ? (
              <div className="p-10 text-center text-slate-500">
                Select a session to view records.
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {selected.course}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatSessionLabel(selected)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => loadRecords(selected)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <MdOutlineHistory size={16} />
                      Reload Records
                    </button>

                    <button
                      type="button"
                      onClick={openManualMark}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      <MdPersonAdd size={16} />
                      Manual Mark
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteSession(selected._id)}
                      disabled={deletingSessionId === selected._id}
                      className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                    >
                      <MdDelete size={16} />
                      {deletingSessionId === selected._id
                        ? "Deleting..."
                        : "Delete Session"}
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 border-b border-slate-200 px-5 py-4 md:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Present Count
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {records.length}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {new Date(selected.expiresAt).getTime() < Date.now()
                        ? "Closed"
                        : "Live"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Session Token
                    </p>
                    <p className="mt-2 truncate font-mono text-sm font-bold text-slate-900">
                      {selected.qrToken || selected.token || selected._id}
                    </p>
                  </div>
                </div>

                {!showManual ? (
                  <div className="overflow-x-auto p-5">
                    {recordsLoading ? (
                      <div className="py-8 text-sm text-slate-500">
                        Loading attendance records…
                      </div>
                    ) : records.length === 0 ? (
                      <div className="py-8 text-sm text-slate-500">
                        No students marked present in this session yet.
                      </div>
                    ) : (
                      <table className="min-w-full overflow-hidden rounded-xl border border-slate-200 text-sm">
                        <thead className="bg-slate-50 text-slate-700">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold">
                              #
                            </th>
                            <th className="px-4 py-3 text-left font-semibold">
                              Student
                            </th>
                            <th className="px-4 py-3 text-left font-semibold">
                              Roll No
                            </th>
                            <th className="px-4 py-3 text-left font-semibold">
                              Department
                            </th>
                            <th className="px-4 py-3 text-left font-semibold">
                              Section
                            </th>
                            <th className="px-4 py-3 text-left font-semibold">
                              Semester
                            </th>
                            <th className="px-4 py-3 text-left font-semibold">
                              Flags
                            </th>
                            <th className="px-4 py-3 text-left font-semibold">
                              Marked At
                            </th>
                            <th className="px-4 py-3 text-left font-semibold">
                              Action
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {records.map((record, index) => {
                            const flagged =
                              record?.proxyFlagged || record?.locationFlagged;

                            return (
                              <tr
                                key={record._id || index}
                                className="border-t border-slate-200"
                              >
                                <td className="px-4 py-3 text-slate-600">
                                  {index + 1}
                                </td>

                                <td className="px-4 py-3 font-medium text-slate-900">
                                  {record?.student?.name || "Unknown"}
                                </td>

                                <td className="px-4 py-3 text-slate-700">
                                  {record?.student?.rollNo || "—"}
                                </td>

                                <td className="px-4 py-3 text-slate-700">
                                  {record?.student?.dept || "—"}
                                </td>

                                <td className="px-4 py-3 text-slate-700">
                                  {record?.student?.section || "—"}
                                </td>

                                <td className="px-4 py-3 text-slate-700">
                                  {record?.student?.semester || "—"}
                                </td>

                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-2">
                                    {record?.proxyFlagged && (
                                      <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                                        Proxy
                                      </span>
                                    )}

                                    {record?.locationFlagged && (
                                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                        Outside Class
                                      </span>
                                    )}

                                    {!record?.proxyFlagged &&
                                      !record?.locationFlagged && (
                                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                          Clean
                                        </span>
                                      )}
                                  </div>
                                </td>

                                <td className="px-4 py-3 text-slate-700">
                                  {new Date(
                                    record?.markedAt || record?.createdAt,
                                  ).toLocaleString()}
                                </td>

                                <td className="px-4 py-3">
                                  {flagged ? (
                                    <button
                                      type="button"
                                      onClick={() => handleUnmark(record._id)}
                                      disabled={unmarkingId === record._id}
                                      className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                                    >
                                      <MdWarning size={14} />
                                      {unmarkingId === record._id
                                        ? "Unmarking..."
                                        : "Unmark"}
                                    </button>
                                  ) : (
                                    <span className="text-xs text-slate-400">
                                      —
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                ) : (
                  <div className="p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="relative min-w-65 flex-1">
                        <MdSearch
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          size={18}
                        />
                        <input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search by name, roll no, or email"
                          className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowManual(false)}
                        className={BTN_GHOST}
                      >
                        Back to Records
                      </button>
                    </div>

                    {manualLoading ? (
                      <div className="py-8 text-sm text-slate-500">
                        Loading students…
                      </div>
                    ) : filteredStudents.length === 0 ? (
                      <div className="py-8 text-sm text-slate-500">
                        No matching students found.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full overflow-hidden rounded-xl border border-slate-200 text-sm">
                          <thead className="bg-slate-50 text-slate-700">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold">
                                Student
                              </th>
                              <th className="px-4 py-3 text-left font-semibold">
                                Roll No
                              </th>
                              <th className="px-4 py-3 text-left font-semibold">
                                Email
                              </th>
                              <th className="px-4 py-3 text-left font-semibold">
                                Status
                              </th>
                              <th className="px-4 py-3 text-left font-semibold">
                                Action
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {filteredStudents.map((student) => {
                              const alreadyPresent = markedIds.has(
                                String(student._id),
                              );

                              return (
                                <tr
                                  key={student._id}
                                  className="border-t border-slate-200"
                                >
                                  <td className="px-4 py-3 font-medium text-slate-900">
                                    {student.name}
                                  </td>

                                  <td className="px-4 py-3 text-slate-700">
                                    {student.rollNo || "—"}
                                  </td>

                                  <td className="px-4 py-3 text-slate-700">
                                    {student.email || "—"}
                                  </td>

                                  <td className="px-4 py-3">
                                    {alreadyPresent ? (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                        <MdCheckCircle size={14} />
                                        Present
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                        <MdGroups size={14} />
                                        Not marked
                                      </span>
                                    )}
                                  </td>

                                  <td className="px-4 py-3">
                                    <button
                                      type="button"
                                      disabled={
                                        alreadyPresent ||
                                        markingId === student._id
                                      }
                                      onClick={() =>
                                        handleManualMark(student._id)
                                      }
                                      className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      {markingId === student._id
                                        ? "Marking…"
                                        : alreadyPresent
                                          ? "Marked"
                                          : "Mark Present"}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
