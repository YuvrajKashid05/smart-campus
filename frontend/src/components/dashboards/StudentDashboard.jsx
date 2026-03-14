import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MdBarChart, MdCalendarMonth, MdCampaign, MdCheckCircle, MdChevronLeft, MdChevronRight, MdDescription, MdMessage, MdQrCode2, MdSchedule, MdWarning } from "react-icons/md";
import { AuthContext } from "../../context/AuthContext";
import * as timetableService from "../../services/timetable";
import * as noticeService from "../../services/notices";
import * as announcementService from "../../services/announcements";
import * as attendanceService from "../../services/attendance";

const DAYS = ["MON","TUE","WED","THU","FRI"];
const TODAY_MAP = { 1:"MON",2:"TUE",3:"WED",4:"THU",5:"FRI" };
const PALETTE = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#ec4899"];
const colorMemo = {};
function getColor(name) { if(colorMemo[name]) return colorMemo[name]; let h=0; for(let i=0;i<name.length;i++) h=(h*31+name.charCodeAt(i))%PALETTE.length; return (colorMemo[name]=PALETTE[h]); }

function MiniCalendar({ timetable }) {
  const [cur, setCur] = useState(new Date());
  const today = new Date();
  const year=cur.getFullYear(), month=cur.getMonth();
  const firstDow = new Date(year,month,1).getDay();
  const daysInMonth = new Date(year,month+1,0).getDate();
  const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const classDows = new Set(timetable.map(t=>DAYS.indexOf(t.day)+1).filter(n=>n>0));
  const offset=(firstDow+6)%7;
  const cells=[...Array(offset).fill(null),...Array.from({length:daysInMonth},(_,i)=>i+1)];
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="font-bold text-slate-900 text-sm">{MON[month]} {year}</p>
        <div className="flex gap-1">
          <button onClick={()=>setCur(new Date(year,month-1,1))} className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition"><MdChevronLeft size={16}/></button>
          <button onClick={()=>setCur(new Date(year,month+1,1))} className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition"><MdChevronRight size={16}/></button>
        </div>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {["Mo","Tu","We","Th","Fr","Sa","Su"].map(d=><div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day,i)=>{
          if(!day) return <div key={i}/>;
          const d=new Date(year,month,day);
          const dow=d.getDay(); // 0=Sun
          const isToday=d.toDateString()===today.toDateString();
          const hasClass=classDows.has(dow===0?7:dow);
          return (
            <div key={i} className="flex items-center justify-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-medium relative ${isToday?"bg-indigo-600 text-white":"text-slate-600 hover:bg-slate-50"}`}>
                {day}
                {hasClass&&!isToday&&<span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-400"/>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const { user } = useContext(AuthContext);
  const todayKey = TODAY_MAP[new Date().getDay()];
  const [timetable, setTimetable] = useState([]);
  const [notices, setNotices] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    const load = async () => {
      const r = await Promise.allSettled([timetableService.getStudentTimetable(), noticeService.getNotices(), announcementService.getAnnouncements(), attendanceService.getMyAttendanceSummary()]);
      if(r[0].status==="fulfilled") setTimetable(r[0].value?.timetables||[]);
      if(r[1].status==="fulfilled") setNotices((r[1].value?.notices||[]).slice(0,4));
      if(r[2].status==="fulfilled") setAnnouncements((r[2].value?.announcements||[]).slice(0,4));
      if(r[3].status==="fulfilled") setAttendance(r[3].value);
      setLoading(false);
    };
    load();
  },[]);

  const todayClasses = timetable.filter(t=>t.day===todayKey&&t.slotType!=="BREAK").sort((a,b)=>a.startTime.localeCompare(b.startTime));
  const overall = attendance?.overallPercentage ?? null;
  const h = new Date().getHours();
  const greet = h<12?"Good morning":h<17?"Good afternoon":"Good evening";

  return (
    <div className="p-4 sm:p-6 pt-14 lg:pt-6 min-h-screen bg-slate-50 fade-up">
      {/* Welcome */}
      <div className="rounded-2xl p-5 mb-5 text-white relative overflow-hidden" style={{ background:"linear-gradient(135deg,#4f46e5,#6366f1)" }}>
        <div className="absolute inset-0 pointer-events-none opacity-[0.06]" style={{ backgroundImage:"linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)",backgroundSize:"30px 30px" }}/>
        <p className="text-indigo-200 text-xs font-semibold">{greet} 👋</p>
        <h1 className="text-xl font-extrabold mt-0.5">{user?.name}</h1>
        <div className="flex flex-wrap gap-2 mt-3">
          {[user?.dept, user?.section&&`Sec ${user.section}`, user?.semester&&`Sem ${user.semester}`, user?.rollNo].filter(Boolean).map((tag,i)=>(
            <span key={i} className="text-xs bg-white/15 text-indigo-100 px-3 py-1 rounded-full font-medium">{tag}</span>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[
          { l:"Attendance", v:overall!=null?`${overall}%`:"—", icon:MdCheckCircle, color:overall==null?"#94a3b8":overall>=75?"#10b981":"#ef4444", to:"/student/my-attendance", warn:overall!=null&&overall<75 },
          { l:"Today",      v:todayClasses.length, icon:MdSchedule,     color:"#6366f1", to:"/student/timetable" },
          { l:"Notices",    v:notices.length,       icon:MdDescription,  color:"#f59e0b", to:"/student/notices" },
          { l:"Updates",    v:announcements.length, icon:MdCampaign,     color:"#8b5cf6", to:"/student/announcements" },
        ].map(c=>{
          const Icon=c.icon;
          return (
            <Link key={c.l} to={c.to} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:border-slate-200 hover:shadow-md transition">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{c.l}</span>
                <Icon size={18} style={{ color:c.color }}/>
              </div>
              <p className="text-2xl font-extrabold" style={{ color:c.color }}>{c.v}</p>
              {c.warn&&<p className="text-[10px] text-red-500 mt-0.5 flex items-center gap-0.5"><MdWarning size={10}/>Below 75%</p>}
            </Link>
          );
        })}
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">

          {/* Today's schedule */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MdSchedule size={17} className="text-indigo-500"/>
                <h2 className="font-bold text-slate-900 text-sm">Today's Schedule</h2>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">{new Date().toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"})}</span>
              </div>
              <Link to="/student/timetable" className="text-xs text-indigo-600 font-semibold hover:underline">Full →</Link>
            </div>
            {loading?<div className="p-8 flex justify-center"><div className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-indigo-500 animate-spin"/></div>
            :todayClasses.length===0?<div className="py-10 text-center"><MdCalendarMonth size={32} className="text-slate-200 mx-auto mb-2"/><p className="text-slate-400 text-sm">No classes today</p></div>
            :<div className="divide-y divide-slate-50">
              {todayClasses.map((cls,i)=>{
                const [sh,sm]=cls.startTime.split(":").map(Number);
                const [eh,em]=cls.endTime.split(":").map(Number);
                const cur=new Date().getHours()*60+new Date().getMinutes();
                const start=sh*60+sm, end=eh*60+em;
                const status=cur<start?"upcoming":cur<=end?"ongoing":"done";
                const color=getColor(cls.title||cls.subject||"x");
                return (
                  <div key={cls._id||i} className={`flex items-center gap-3 px-5 py-3.5 ${status==="done"?"opacity-40":""}`}>
                    <div className="w-1 h-9 rounded-full shrink-0" style={{ backgroundColor:color }}/>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm">{cls.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{cls.startTime}–{cls.endTime}{cls.room?` · ${cls.room}`:""}{cls.faculty?.name?` · ${cls.faculty.name}`:""}</p>
                    </div>
                    {status==="ongoing"&&<span className="shrink-0 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold animate-pulse">● LIVE</span>}
                    {status==="upcoming"&&<span className="shrink-0 text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">Soon</span>}
                  </div>
                );
              })}
            </div>}
          </div>

          {/* Announcements */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2"><MdCampaign size={17} className="text-violet-500"/><h2 className="font-bold text-slate-900 text-sm">Announcements</h2></div>
              <Link to="/student/announcements" className="text-xs text-violet-600 font-semibold hover:underline">View all →</Link>
            </div>
            {loading?<div className="p-6 flex justify-center"><div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-violet-500 animate-spin"/></div>
            :announcements.length===0?<p className="p-6 text-center text-slate-400 text-sm">No announcements</p>
            :<div className="divide-y divide-slate-50">
              {announcements.map((a,i)=>(
                <div key={a._id||i} className="px-5 py-3.5 hover:bg-slate-50 transition">
                  <p className="font-semibold text-slate-900 text-sm">{a.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{a.message}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{a.createdBy?.name} · {new Date(a.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>}
          </div>

          {/* Notices */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2"><MdDescription size={17} className="text-amber-500"/><h2 className="font-bold text-slate-900 text-sm">Latest Notices</h2></div>
              <Link to="/student/notices" className="text-xs text-amber-600 font-semibold hover:underline">View all →</Link>
            </div>
            {loading?<div className="p-6 flex justify-center"><div className="w-4 h-4 rounded-full border-2 border-slate-200 border-t-amber-500 animate-spin"/></div>
            :notices.length===0?<p className="p-6 text-center text-slate-400 text-sm">No notices</p>
            :<div className="divide-y divide-slate-50">
              {notices.map((n,i)=>(
                <div key={n._id||i} className="px-5 py-3.5 hover:bg-slate-50 transition">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-900 text-sm">{n.title}</p>
                    <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold shrink-0">{n.audience}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{n.body}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{n.createdBy?.name} · {new Date(n.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <MiniCalendar timetable={timetable}/>

          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { to:"/student/attendance",    icon:MdQrCode2,      label:"Scan QR",           color:"#6366f1",bg:"#eef2ff" },
                { to:"/student/my-attendance", icon:MdBarChart,     label:"My Attendance",     color:"#10b981",bg:"#ecfdf5" },
                { to:"/student/timetable",     icon:MdCalendarMonth,label:"Full Timetable",    color:"#8b5cf6",bg:"#f5f3ff" },
                { to:"/student/complaint",     icon:MdMessage,      label:"Submit Complaint",  color:"#ef4444",bg:"#fef2f2" },
              ].map(a=>{
                const Icon=a.icon;
                return (
                  <Link key={a.to} to={a.to} className="flex items-center gap-3 p-3 rounded-xl hover:opacity-80 transition" style={{ background:a.bg }}>
                    <Icon size={17} style={{ color:a.color }}/><span className="text-sm font-semibold" style={{ color:a.color }}>{a.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Weekly summary */}
          {timetable.length>0&&(
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Week at a glance</h3>
              <div className="space-y-1.5">
                {DAYS.map(d=>{
                  const classes=timetable.filter(t=>t.day===d&&t.slotType!=="BREAK");
                  const isToday=d===todayKey;
                  return (
                    <div key={d} className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isToday?"bg-indigo-50":"bg-slate-50"}`}>
                      <span className={`text-[10px] font-extrabold w-8 ${isToday?"text-indigo-600":"text-slate-400"}`}>{d}</span>
                      <div className="flex gap-1 flex-1 overflow-hidden">
                        {classes.slice(0,5).map((c,i)=><div key={i} className="h-1.5 rounded-full flex-1" style={{ backgroundColor:getColor(c.title||"x") }}/>)}
                        {classes.length===0&&<div className="h-1.5 rounded-full flex-1 bg-slate-200"/>}
                      </div>
                      <span className={`text-[10px] font-bold w-4 text-right ${isToday?"text-indigo-600":"text-slate-400"}`}>{classes.length}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
