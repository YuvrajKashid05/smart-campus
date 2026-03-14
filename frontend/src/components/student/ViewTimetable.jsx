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

export default function ViewTimetable() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [slots, setSlots] = useState([]);

  const loadTimetable = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await timetableService.getMyTimetable();
      setSlots(Array.isArray(res?.timetables) ? res.timetables : []);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to load timetable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimetable();
  }, []);

  const sessionRows = useMemo(() => {
    const unique = new Map();
    slots.forEach((slot) => {
      const key = `${slot.startTime}-${slot.endTime}`;
      if (!unique.has(key)) {
        unique.set(key, {
          key,
          label: `${slot.startTime} - ${slot.endTime}`,
          startTime: slot.startTime,
        });
      }
    });
    return [...unique.values()].sort(
      (a, b) => toMinutes(a.startTime) - toMinutes(b.startTime),
    );
  }, [slots]);

  const gridMap = useMemo(() => {
    const map = { MON: {}, TUE: {}, WED: {}, THU: {}, FRI: {} };
    sortByTime(slots).forEach((slot) => {
      const key = `${slot.startTime}-${slot.endTime}`;
      if (map[slot.day]) map[slot.day][key] = slot;
    });
    return map;
  }, [slots]);

  return (
    <div className={`${PAGE} min-h-screen bg-slate-50 pb-24`}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] font-semibold text-indigo-600">
              Weekly Schedule
            </p>
            <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
              Student Timetable
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Fetched from your class timetable
            </p>
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

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 px-5 sm:px-6 py-5 bg-linear-to-r from-slate-50 to-white">
            <h2 className="text-2xl font-bold text-slate-900">
              Weekly Timetable
            </h2>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="py-16 text-center">
                <div className="w-10 h-10 mx-auto rounded-full border-4 border-slate-200 border-t-indigo-500 animate-spin" />
              </div>
            ) : sessionRows.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-12 text-center">
                <p className="text-lg font-semibold text-slate-700">
                  No timetable found
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-245">
                  <div className="grid grid-cols-6 gap-3 mb-3">
                    <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700">
                      Time
                    </div>
                    {DAYS.map((day) => (
                      <div
                        key={day}
                        className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 text-center"
                      >
                        {DAY_LABEL[day]}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {sessionRows.map((row) => (
                      <div key={row.key} className="grid grid-cols-6 gap-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                          <p className="text-sm font-bold text-slate-900">
                            {row.label}
                          </p>
                        </div>

                        {DAYS.map((day) => {
                          const slot = gridMap[day]?.[row.key];

                          return (
                            <div
                              key={`${day}-${row.key}`}
                              className={`rounded-2xl border px-4 py-4 min-h-32.5 ${
                                slot
                                  ? "bg-white border-slate-200 shadow-sm"
                                  : "bg-slate-50 border-slate-100"
                              }`}
                            >
                              {slot ? (
                                <div className="h-full flex flex-col">
                                  <div className="flex items-start justify-between gap-2">
                                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                                      {slot.title || "Class"}
                                    </h3>
                                    <span
                                      className={`shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full border ${badgeClass(
                                        slot.slotType,
                                      )}`}
                                    >
                                      {slot.slotType}
                                    </span>
                                  </div>

                                  <p className="mt-2 text-xs text-slate-600">
                                    <span className="font-semibold">
                                      Subject:
                                    </span>{" "}
                                    {slot.subject || "—"}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-600">
                                    <span className="font-semibold">
                                      Faculty:
                                    </span>{" "}
                                    {slot.faculty?.name || "—"}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-600">
                                    <span className="font-semibold">Room:</span>{" "}
                                    {slot.room || "—"}
                                  </p>
                                </div>
                              ) : (
                                <div className="h-full flex items-center justify-center text-sm text-slate-400">
                                  —
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
