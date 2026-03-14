import { useContext, useEffect, useState } from "react";
import { MdCalendarMonth, MdAccessTime, MdRoom, MdPerson } from "react-icons/md";
import { AuthContext } from "../../context/AuthContext";
import * as timetableService from "../../services/timetable";
import { PAGE, Loading, Empty, SectionCard } from "../../ui";

const DAYS = ["MON","TUE","WED","THU","FRI"];
const DAY_FULL = { MON:"Monday", TUE:"Tuesday", WED:"Wednesday", THU:"Thursday", FRI:"Friday" };
const TODAY_MAP = { 1:"MON", 2:"TUE", 3:"WED", 4:"THU", 5:"FRI" };
const PALETTE = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899"];
const colorMemo = {};
function subjectColor(name) {
  if (!name) return PALETTE[0];
  if (colorMemo[name]) return colorMemo[name];
  let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % PALETTE.length;
  return (colorMemo[name] = PALETTE[h]);
}

export default function ViewTimetable() {
  const { user } = useContext(AuthContext);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(TODAY_MAP[new Date().getDay()] || "MON");

  useEffect(() => {
    timetableService.getStudentTimetable()
      .then(d => setTimetable(d?.timetables || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const todayKey = TODAY_MAP[new Date().getDay()];
  const now = new Date();
  const curMin = now.getHours() * 60 + now.getMinutes();

  if (loading) return <div className={PAGE}><Loading /></div>;

  const daySlots = timetable.filter(t => t.day === activeDay).sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className={PAGE + " fade-up"}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Class Timetable</h1>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {[user?.dept, `Sem ${user?.semester}`, `Sec ${user?.section}`].filter(v => v && !v.includes("undefined")).map((t, i) => (
              <span key={i} className="text-xs bg-slate-100 text-slate-600 font-medium px-3 py-1 rounded-full">{t}</span>
            ))}
          </div>
        </div>

        {timetable.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <Empty icon={MdCalendarMonth} title="No timetable assigned yet" sub="Your faculty hasn't created a schedule for your class yet." />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { l:"Classes / Week", v:timetable.filter(t => t.slotType !== "BREAK").length, c:"#6366f1" },
                { l:"Today",          v:timetable.filter(t => t.day === todayKey && t.slotType !== "BREAK").length, c:"#10b981" },
                { l:"Days Active",    v:new Set(timetable.map(t => t.day)).size, c:"#f59e0b" },
              ].map(s => (
                <div key={s.l} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4" style={{ borderLeft:`3px solid ${s.c}` }}>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{s.l}</p>
                  <p className="text-2xl font-extrabold mt-0.5" style={{ color: s.c }}>{s.v}</p>
                </div>
              ))}
            </div>

            {/* Day tabs */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
              {DAYS.map(d => {
                const count = timetable.filter(t => t.day === d && t.slotType !== "BREAK").length;
                const isActive = activeDay === d;
                const isToday = d === todayKey;
                return (
                  <button key={d} onClick={() => setActiveDay(d)}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition ${isActive ? "border-indigo-500 bg-indigo-50 text-indigo-700" : isToday ? "border-indigo-200 text-indigo-500 bg-white" : "border-slate-100 text-slate-600 bg-white hover:border-slate-200"}`}>
                    {DAY_FULL[d].slice(0, 3)}
                    <span className={`ml-1.5 text-xs ${isActive ? "text-indigo-500" : "text-slate-400"}`}>{count}</span>
                    {isToday && <span className="ml-1 text-[10px] text-indigo-400">●</span>}
                  </button>
                );
              })}
            </div>

            {/* Slot list */}
            <SectionCard
              title={<span>{DAY_FULL[activeDay]} {activeDay === todayKey && <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-semibold ml-2">Today</span>}</span>}
            >
              {daySlots.length === 0
                ? <div className="py-10 text-center text-slate-400 text-sm">No classes on {DAY_FULL[activeDay]}</div>
                : <div className="divide-y divide-slate-50 p-2">
                    {daySlots.map((slot, i) => {
                      const [sh, sm] = slot.startTime.split(":").map(Number);
                      const [eh, em] = slot.endTime.split(":").map(Number);
                      const startM = sh * 60 + sm, endM = eh * 60 + em;
                      const isOngoing = activeDay === todayKey && curMin >= startM && curMin <= endM;
                      const isDone    = activeDay === todayKey && curMin > endM;
                      const color = slot.slotType === "BREAK" ? "#94a3b8" : subjectColor(slot.title || slot.subject || "x");
                      return (
                        <div key={slot._id || i} className={`flex gap-4 p-4 rounded-xl transition ${isOngoing ? "bg-indigo-50" : isDone ? "opacity-40" : "hover:bg-slate-50"}`}>
                          <div className="w-16 shrink-0 text-right">
                            <p className="text-xs font-bold text-slate-700">{slot.startTime}</p>
                            <p className="text-xs text-slate-400">{slot.endTime}</p>
                          </div>
                          <div className="w-1 rounded-full shrink-0 self-stretch" style={{ backgroundColor: color }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-semibold text-slate-900 text-sm">{slot.slotType === "BREAK" ? "☕ " : ""}{slot.title}</p>
                                {slot.subject && slot.subject !== slot.title && <p className="text-xs text-slate-500 mt-0.5">{slot.subject}</p>}
                              </div>
                              {slot.slotType === "BREAK" && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full shrink-0">Break</span>}
                              {isOngoing && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold animate-pulse shrink-0">● LIVE</span>}
                            </div>
                            <div className="flex flex-wrap gap-3 mt-1.5">
                              {slot.room && <span className="flex items-center gap-1 text-xs text-slate-500"><MdRoom size={11} />{slot.room}</span>}
                              {slot.faculty?.name && <span className="flex items-center gap-1 text-xs text-slate-500"><MdPerson size={11} />{slot.faculty.name}</span>}
                              <span className="flex items-center gap-1 text-xs text-slate-400"><MdAccessTime size={11} />{slot.startTime}–{slot.endTime}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>}
            </SectionCard>

            {/* Subject legend */}
            <div className="mt-4 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Subjects</p>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(timetable.filter(t => t.slotType !== "BREAK").map(t => t.title || t.subject).filter(Boolean))).map(name => (
                  <span key={name} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 border border-slate-100 text-slate-700">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: subjectColor(name) }} />
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
