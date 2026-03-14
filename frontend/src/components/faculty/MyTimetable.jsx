import { useEffect, useMemo, useState } from "react";
import { MdRefresh } from "react-icons/md";
import * as timetableService from "../../services/timetable";
import { Alert, PAGE } from "../../ui";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];
const DAY_LABEL = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
};

function toMinutes(time = "") {
  const [h = "0", m = "0"] = String(time).split(":");
  return Number(h) * 60 + Number(m);
}

function sortByTime(slots = []) {
  return [...slots].sort(
    (a, b) =>
      toMinutes(a.startTime || "00:00") - toMinutes(b.startTime || "00:00"),
  );
}

function badgeClass(slotType = "") {
  return String(slotType).toUpperCase() === "BREAK"
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-emerald-50 text-emerald-700 border-emerald-200";
}

export default function MyTimetable() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [slots, setSlots] = useState([]);

  const loadTimetable = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await timetableService.getFacultyTimetable();
      setSlots(Array.isArray(res?.timetables) ? res.timetables : []);
    } catch (err) {
      setError(
        err?.response?.data?.error || "Failed to load faculty timetable.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetable();
  }, []);

  const grouped = useMemo(() => {
    const map = { MON: [], TUE: [], WED: [], THU: [], FRI: [] };
    sortByTime(slots).forEach((slot) => {
      if (map[slot.day]) map[slot.day].push(slot);
    });
    return map;
  }, [slots]);

  return (
    <div className={`${PAGE} min-h-screen bg-slate-50 pb-24`}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] font-semibold text-indigo-600">
              Faculty Panel
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
              My Timetable
            </h1>
          </div>

          <button
            onClick={loadTimetable}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 font-semibold text-slate-700"
          >
            <MdRefresh size={18} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-5">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center">
            <div className="w-10 h-10 mx-auto rounded-full border-4 border-slate-200 border-t-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {DAYS.map((day) => (
              <div
                key={day}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
                  <h2 className="text-lg font-bold text-slate-900">
                    {DAY_LABEL[day]}
                  </h2>
                </div>

                <div className="p-4 space-y-3">
                  {grouped[day]?.length ? (
                    grouped[day].map((slot) => (
                      <div
                        key={slot._id}
                        className="rounded-2xl border border-slate-200 p-4 bg-white"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-slate-900">
                            {slot.title}
                          </h3>
                          <span
                            className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${badgeClass(
                              slot.slotType,
                            )}`}
                          >
                            {slot.slotType}
                          </span>
                        </div>

                        <p className="mt-2 text-xs text-slate-600">
                          <span className="font-semibold">Time:</span>{" "}
                          {slot.startTime} - {slot.endTime}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          <span className="font-semibold">Subject:</span>{" "}
                          {slot.subject || "—"}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          <span className="font-semibold">Class:</span>{" "}
                          {slot.dept} / Sem {slot.semester} / Sec {slot.section}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          <span className="font-semibold">Room:</span>{" "}
                          {slot.room || "—"}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-6 text-center text-sm text-slate-400">
                      No lecture assigned
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
