import { useEffect, useState } from "react";
import {
  MdBarChart,
  MdCalendarMonth,
  MdCheckCircle,
  MdGroup,
  MdPerson,
  MdRefresh,
} from "react-icons/md";
import * as attendanceService from "../../services/attendance";

const AttendanceReport = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await attendanceService.getMySessions();
      setSessions(data?.sessions || []);
    } catch (err) {
      setError("Failed to load attendance sessions.");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const viewRecords = async (session) => {
    setSelectedSession(session);
    setRecordsLoading(true);
    setError("");
    try {
      const data = await attendanceService.getSessionRecords(session._id);
      setRecords(data?.records || []);
    } catch (err) {
      setRecords([]);
      setError("Failed to load attendance records.");
    } finally {
      setRecordsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <MdBarChart className="text-indigo-500" /> Attendance Report
            </h1>
            <p className="text-gray-600 mt-1">
              View all sessions and student attendance records
            </p>
          </div>

          <button
            onClick={fetchSessions}
            className="flex items-center gap-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            <MdRefresh size={18} /> Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <MdCalendarMonth className="text-blue-500" /> My Sessions (
              {sessions.length})
            </h2>

            {sessions.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-10 text-center">
                <MdBarChart className="text-gray-200 mx-auto mb-3" size={48} />
                <p className="text-gray-500">
                  No sessions found. Generate QR codes first.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((s) => {
                  const expired = new Date(s.expiresAt) < new Date();
                  const isSelected = selectedSession?._id === s._id;

                  return (
                    <div
                      key={s._id}
                      onClick={() => viewRecords(s)}
                      className={`bg-white rounded-lg shadow p-4 cursor-pointer border-2 transition ${
                        isSelected
                          ? "border-blue-500"
                          : "border-transparent hover:border-blue-200"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-900">{s.course}</p>
                          <p className="text-sm text-gray-600">{s.dept}</p>
                        </div>

                        <span
                          className={`text-xs px-2 py-1 rounded font-semibold ${
                            expired
                              ? "bg-gray-100 text-gray-600"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {expired ? "Expired" : "Active"}
                        </span>
                      </div>

                      <div className="mt-2 flex gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MdCalendarMonth size={12} />
                          {new Date(s.createdAt).toLocaleDateString()}
                        </span>
                        <span>
                          {new Date(s.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <MdGroup className="text-green-500" /> Students Present
              {selectedSession && (
                <span className="text-base font-normal text-gray-500">
                  {" "}
                  – {selectedSession.course}
                </span>
              )}
            </h2>

            {!selectedSession ? (
              <div className="bg-white rounded-lg shadow p-10 text-center">
                <MdPerson className="text-gray-200 mx-auto mb-3" size={48} />
                <p className="text-gray-500">
                  Click a session to view attendance records
                </p>
              </div>
            ) : recordsLoading ? (
              <div className="bg-white rounded-lg shadow p-10 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-indigo-600 text-white px-4 py-3 flex justify-between items-center">
                  <span className="font-semibold">
                    {selectedSession.course} — {selectedSession.dept}
                  </span>
                  <span className="bg-white text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">
                    {records.length} present
                  </span>
                </div>

                {records.length === 0 ? (
                  <div className="p-10 text-center">
                    <p className="text-gray-500">
                      No students marked attendance for this session.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {records.map((r, i) => (
                      <div
                        key={r._id}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <span className="text-gray-400 text-sm w-6">
                          {i + 1}
                        </span>

                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {r.student?.name || "—"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {r.student?.rollNo} · {r.student?.dept} · Sem{" "}
                            {r.student?.semester}
                          </p>
                        </div>

                        <div className="text-right">
                          <MdCheckCircle
                            className="text-green-500 ml-auto"
                            size={20}
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceReport;
