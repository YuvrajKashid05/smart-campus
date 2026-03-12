import { useContext, useEffect, useState } from "react";
import { MdCalendarMonth, MdInfo, MdSchool } from "react-icons/md";
import { AuthContext } from "../../context/AuthContext";
import * as timetableService from "../../services/timetable";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];
const DAY_FULL = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
};
const DAY_SHORT = {
  MON: "Mon",
  TUE: "Tue",
  WED: "Wed",
  THU: "Thu",
  FRI: "Fri",
};

const SLOT_COLORS = [
  "bg-blue-100 border-blue-400 text-blue-900",
  "bg-green-100 border-green-400 text-green-900",
  "bg-purple-100 border-purple-400 text-purple-900",
  "bg-orange-100 border-orange-400 text-orange-900",
  "bg-pink-100 border-pink-400 text-pink-900",
  "bg-teal-100 border-teal-400 text-teal-900",
];

const parseTime = (t) => {
  if (!t) return "00:00";
  const m = t.match(/^(\d{1,2}):(\d{2})/);
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : t;
};

const ViewTimetable = () => {
  const { user } = useContext(AuthContext);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await timetableService.getStudentTimetable();
        setTimetable(data?.timetables || []);
      } catch {
        setError("Could not load timetable.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const todayIdx = new Date().getDay();
  const todayAbbr = DAYS[todayIdx - 1] || null;

  const allSlots = Array.from(
    new Set(timetable.map((t) => `${t.startTime}|${t.endTime}`)),
  ).sort((a, b) =>
    parseTime(a.split("|")[0]).localeCompare(parseTime(b.split("|")[0])),
  );

  const subjectColors = {};
  let ci = 0;
  timetable.forEach((t) => {
    const key = t.subject || t.title;
    if (key && !subjectColors[key])
      subjectColors[key] = SLOT_COLORS[ci++ % SLOT_COLORS.length];
  });

  const slotMap = {};
  timetable.forEach((t) => {
    slotMap[`${t.startTime}|${t.endTime}|${t.day}`] = t;
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <MdCalendarMonth className="text-blue-500" /> Class Timetable
          </h1>
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            <MdSchool size={16} />
            {user?.dept || "—"} &nbsp;·&nbsp; Semester {user?.semester || "—"}{" "}
            &nbsp;·&nbsp; Section {user?.section || "—"}
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {timetable.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-16 text-center">
            <MdCalendarMonth className="text-gray-300 mx-auto mb-4" size={64} />
            <p className="text-xl text-gray-500 font-medium">
              No timetable assigned yet
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Your faculty hasn't created a schedule for your class yet.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-160 border-collapse">
                  <thead>
                    <tr>
                      <th className="w-28 bg-gray-800 text-white py-4 px-4 text-sm font-semibold text-left border-r border-gray-700">
                        Time
                      </th>
                      {DAYS.map((d) => (
                        <th
                          key={d}
                          className={`py-4 px-3 text-sm font-semibold text-center border-r border-gray-700 last:border-r-0 ${d === todayAbbr ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-200"}`}
                        >
                          <span className="hidden sm:block">{DAY_FULL[d]}</span>
                          <span className="sm:hidden">{DAY_SHORT[d]}</span>
                          {d === todayAbbr && (
                            <span className="block text-xs font-normal text-blue-200 mt-0.5">
                              Today
                            </span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allSlots.map((slot, rowIdx) => {
                      const [start, end] = slot.split("|");
                      return (
                        <tr
                          key={slot}
                          className={
                            rowIdx % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }
                        >
                          <td className="py-3 px-4 text-xs font-semibold text-gray-600 border-r border-gray-200 whitespace-nowrap align-top pt-4">
                            <div>{start}</div>
                            <div className="text-gray-400">– {end}</div>
                          </td>
                          {DAYS.map((d) => {
                            const entry = slotMap[`${start}|${end}|${d}`];
                            return (
                              <td
                                key={d}
                                className={`py-2 px-2 border-r border-gray-200 last:border-r-0 align-top ${d === todayAbbr ? "bg-blue-50" : ""}`}
                              >
                                {entry ? (
                                  <div
                                    className={`rounded-lg border-l-4 p-2 text-xs ${subjectColors[entry.subject || entry.title] || "bg-gray-100 border-gray-400 text-gray-800"}`}
                                  >
                                    <div className="font-bold text-sm leading-tight">
                                      {entry.subject || entry.title}
                                    </div>
                                    {entry.title &&
                                      entry.subject &&
                                      entry.title !== entry.subject && (
                                        <div className="text-xs opacity-75 mt-0.5">
                                          {entry.title}
                                        </div>
                                      )}
                                    {entry.faculty?.name && (
                                      <div className="mt-1 opacity-80">
                                        {entry.faculty.name}
                                      </div>
                                    )}
                                    {entry.room && (
                                      <div className="mt-0.5 font-medium">
                                        Room: {entry.room}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="h-12 flex items-center justify-center text-gray-200 text-2xl">
                                    —
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 bg-white rounded-xl shadow p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1">
                <MdInfo size={16} className="text-blue-500" /> Subject Legend
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(subjectColors).map(([subj, cls]) => (
                  <span
                    key={subj}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border-l-4 ${cls}`}
                  >
                    {subj}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow p-4 text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {timetable.length}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Total Classes / Week
                </p>
              </div>
              <div className="bg-white rounded-xl shadow p-4 text-center">
                <p className="text-3xl font-bold text-green-600">
                  {timetable.filter((t) => t.day === todayAbbr).length}
                </p>
                <p className="text-sm text-gray-600 mt-1">Classes Today</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ViewTimetable;
