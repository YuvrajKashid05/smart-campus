import { useEffect, useMemo, useState } from "react";
import {
  MdCheckCircle,
  MdSchool,
  MdTrendingUp,
  MdWarningAmber,
} from "react-icons/md";
import * as attendanceService from "../../services/attendance";
import { Alert, PAGE } from "../../ui";

function AttendanceRing({ percentage }) {
  const safe = Math.max(0, Math.min(100, Number(percentage || 0)));
  const color = safe >= 85 ? "#10b981" : safe >= 75 ? "#6366f1" : "#ef4444";

  return (
    <div className="relative w-36 h-36 mx-auto">
      <div
        className="w-36 h-36 rounded-full"
        style={{
          background: `conic-gradient(${color} ${safe * 3.6}deg, #e5e7eb 0deg)`,
        }}
      />
      <div className="absolute inset-3 rounded-full bg-white flex flex-col items-center justify-center shadow-sm">
        <div className="text-3xl font-extrabold text-slate-900 leading-none">
          {safe}%
        </div>
        <div className="mt-1 text-[10px] font-semibold tracking-[0.18em] uppercase text-slate-500 text-center">
          Overall
        </div>
      </div>
    </div>
  );
}

function MiniStatCard({ icon, title, value, subtitle, tone = "indigo" }) {
  const toneMap = {
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide font-semibold text-slate-500">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-xl ${toneMap[tone]}`}>{icon}</div>
      </div>
    </div>
  );
}

function SubjectCard({ subject }) {
  const pct = Math.max(0, Math.min(100, Number(subject.percentage || 0)));
  const low = pct < 75;
  const excellent = pct >= 85;

  const badgeClass = excellent
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : low
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-indigo-50 text-indigo-700 border-indigo-200";

  const progressClass = excellent
    ? "bg-emerald-500"
    : low
      ? "bg-red-500"
      : "bg-indigo-500";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold text-slate-900 truncate">
            {subject.course || subject.subject || subject.name || "Subject"}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {subject.present} present • {subject.total} total
          </p>
        </div>

        <span
          className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full border ${badgeClass}`}
        >
          {pct}%
        </span>
      </div>

      <div className="mt-4">
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full ${progressClass}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="text-slate-500">
          Missed:{" "}
          <span className="font-semibold text-slate-800">
            {Math.max(0, subject.total - subject.present)}
          </span>
        </div>
        <div
          className={`font-semibold ${
            low
              ? "text-red-600"
              : excellent
                ? "text-emerald-600"
                : "text-indigo-600"
          }`}
        >
          {low ? "Low" : excellent ? "Excellent" : "Safe"}
        </div>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [records, setRecords] = useState([]);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      setLoading(true);
      setError("");

      try {
        let res = null;

        if (attendanceService.getMyAttendanceSummary) {
          res = await attendanceService.getMyAttendanceSummary();
        } else if (attendanceService.getMyAttendance) {
          res = await attendanceService.getMyAttendance();
        } else if (attendanceService.myAttendance) {
          res = await attendanceService.myAttendance();
        }

        const data =
          res?.summary ||
          res?.data?.summary ||
          res?.attendance ||
          res?.data?.attendance ||
          res?.records ||
          res?.data?.records ||
          res?.subjects ||
          res?.data?.subjects ||
          [];

        if (mounted) {
          setRecords(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (mounted) {
          setError(err?.response?.data?.error || "Failed to load dashboard.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const subjectStats = useMemo(() => {
    return records.map((item) => {
      const present = Number(
        item.presentClasses ?? item.present ?? item.attended ?? 0,
      );
      const total = Number(
        item.totalClasses ?? item.total ?? item.held ?? item.classes ?? 0,
      );

      const percentage =
        total > 0
          ? Math.round((present / total) * 100)
          : Number(item.percentage ?? 0);

      return {
        ...item,
        present,
        total,
        percentage,
      };
    });
  }, [records]);

  const overall = useMemo(() => {
    const totalPresent = subjectStats.reduce((sum, s) => sum + s.present, 0);
    const totalClasses = subjectStats.reduce((sum, s) => sum + s.total, 0);
    return totalClasses > 0
      ? Math.round((totalPresent / totalClasses) * 100)
      : 0;
  }, [subjectStats]);

  const totalSubjects = subjectStats.length;
  const lowSubjects = subjectStats.filter((s) => s.percentage < 75).length;
  const safeSubjects = subjectStats.filter((s) => s.percentage >= 75).length;

  return (
    <div className={`${PAGE} min-h-screen bg-slate-50`}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] font-semibold text-indigo-600">
            Student Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
            Attendance Overview
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Clean summary of your overall and subject-wise attendance
          </p>
        </div>

        {error && (
          <div className="mb-5">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
            <div className="w-10 h-10 mx-auto rounded-full border-4 border-slate-200 border-t-indigo-500 animate-spin" />
            <p className="mt-4 text-sm text-slate-500">Loading dashboard...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
              <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide font-semibold text-slate-500">
                      Overall
                    </p>
                    <h2 className="text-lg font-bold text-slate-900">
                      Attendance
                    </h2>
                  </div>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      overall >= 75
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {overall >= 75 ? "Good" : "Low"}
                  </span>
                </div>

                <AttendanceRing percentage={overall} />

                <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-center">
                  <p className="text-sm text-slate-600">
                    {overall >= 85
                      ? "Excellent consistency."
                      : overall >= 75
                        ? "Attendance is in safe range."
                        : "Needs improvement."}
                  </p>
                </div>
              </div>

              <div className="xl:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MiniStatCard
                  icon={<MdSchool size={22} />}
                  title="Total Subjects"
                  value={totalSubjects}
                  subtitle="Subjects tracked"
                  tone="indigo"
                />
                <MiniStatCard
                  icon={<MdCheckCircle size={22} />}
                  title="Safe Subjects"
                  value={safeSubjects}
                  subtitle="At or above 75%"
                  tone="green"
                />
                <MiniStatCard
                  icon={<MdWarningAmber size={22} />}
                  title="Low Attendance"
                  value={lowSubjects}
                  subtitle="Below 75%"
                  tone="red"
                />
                <MiniStatCard
                  icon={<MdTrendingUp size={22} />}
                  title="Overall Rate"
                  value={`${overall}%`}
                  subtitle="Current total attendance"
                  tone="slate"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-[11px] uppercase tracking-wide font-semibold text-slate-500">
                    Subject Overview
                  </p>
                  <h2 className="text-xl font-bold text-slate-900">
                    Subject-wise Attendance
                  </h2>
                </div>
              </div>

              {subjectStats.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {subjectStats.map((subject, index) => (
                    <SubjectCard key={index} subject={subject} />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 p-10 text-center">
                  <p className="font-semibold text-slate-700">
                    No attendance data found
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Your subject attendance will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
