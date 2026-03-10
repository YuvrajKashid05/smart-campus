import { useContext, useEffect, useState } from "react";
import {
  MdCalendarMonth,
  MdCalendarViewDay,
  MdCheckCircle,
} from "react-icons/md";
import { AuthContext } from "../../context/AuthContext";
import * as timetableService from "../../services/timetable";

const DAY_MAP = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
};
const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];

const ViewTimetable = () => {
  const { user } = useContext(AuthContext);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("week");
  const [selectedDay, setSelectedDay] = useState(
    DAYS[new Date().getDay() - 1] || "MON",
  );

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const data = await timetableService.getStudentTimetable();
        setTimetable(data?.timetables || []);
      } catch (error) {
        console.error("Error fetching timetable:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, []);

  const todayAbbr = DAYS[new Date().getDay() - 1] || "MON";
  const todayClasses = timetable.filter((t) => t.day === todayAbbr);
  const filteredTimetable =
    view === "day"
      ? timetable.filter((cls) => cls.day === selectedDay)
      : timetable;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <MdCalendarMonth className="text-blue-500" /> Your Timetable
        </h1>
        <p className="text-gray-600 mb-8">
          {user?.dept} • Semester {user?.semester} • Section {user?.section}
        </p>

        {/* View Toggle */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex gap-4 items-center flex-wrap">
          <button
            onClick={() => setView("week")}
            className={`flex items-center gap-1 px-4 py-2 rounded-lg font-semibold transition ${
              view === "week"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            <MdCalendarMonth size={16} /> Weekly View
          </button>
          <button
            onClick={() => setView("day")}
            className={`flex items-center gap-1 px-4 py-2 rounded-lg font-semibold transition ${
              view === "day"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            <MdCalendarViewDay size={16} /> Daily View
          </button>

          {view === "day" && (
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {DAY_MAP[d]}
                </option>
              ))}
            </select>
          )}
        </div>

        {todayClasses.length > 0 && (
          <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 mb-6 flex items-center gap-2">
            <MdCheckCircle className="text-green-500" size={20} />
            <p className="font-semibold text-green-900">
              You have {todayClasses.length} class(es) today!
            </p>
          </div>
        )}

        {filteredTimetable.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-linear-to-r from-blue-600 to-blue-800 text-white">
                  <tr>
                    <th className="py-4 px-6 text-left">Day</th>
                    <th className="py-4 px-6 text-left">Time</th>
                    <th className="py-4 px-6 text-left">Title</th>
                    <th className="py-4 px-6 text-left">Subject</th>
                    <th className="py-4 px-6 text-left">Faculty</th>
                    <th className="py-4 px-6 text-left">Room</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTimetable.map((cls, idx) => {
                    const isToday = cls.day === todayAbbr;
                    return (
                      <tr
                        key={idx}
                        className={`border-b transition ${isToday ? "bg-yellow-50 hover:bg-yellow-100" : "hover:bg-gray-50"}`}
                      >
                        <td className="py-4 px-6">
                          <span className="font-semibold">
                            {DAY_MAP[cls.day] || cls.day}
                          </span>
                          {isToday && (
                            <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded">
                              Today
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {cls.startTime} – {cls.endTime}
                        </td>
                        <td className="py-4 px-6 font-semibold">{cls.title}</td>
                        <td className="py-4 px-6">{cls.subject || "—"}</td>
                        <td className="py-4 px-6">
                          {cls.faculty?.name || "-"}
                        </td>
                        <td className="py-4 px-6">
                          {cls.room ? (
                            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                              {cls.room}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-gray-100 rounded-lg p-12 text-center">
            <MdCalendarMonth className="text-gray-400 mx-auto mb-4" size={48} />
            <p className="text-lg text-gray-600">
              {view === "day"
                ? `No classes on ${DAY_MAP[selectedDay]}`
                : "No timetable available yet"}
            </p>
          </div>
        )}

        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm">Total Classes/Week</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {timetable.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <p className="text-gray-600 text-sm">Classes Today</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {todayClasses.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewTimetable;
