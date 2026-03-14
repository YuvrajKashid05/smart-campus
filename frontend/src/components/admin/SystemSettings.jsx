import { useState } from "react";
import { MdSettings, MdCheck, MdNotifications, MdSecurity, MdBusiness } from "react-icons/md";
import { PAGE, BTN_PRIMARY, INPUT, Alert } from "../../ui";

const LABEL = "block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide";
function Toggle({ checked, onChange }) {
  return (
    <button onClick={()=>onChange(!checked)} className={`relative w-10 h-6 rounded-full transition-colors ${checked?"bg-indigo-600":"bg-slate-200"}`}>
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked?"left-5":"left-1"}`}/>
    </button>
  );
}
function Row({ label, desc, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-slate-100 last:border-0">
      <div><p className="text-sm font-medium text-slate-800">{label}</p>{desc&&<p className="text-xs text-slate-500 mt-0.5">{desc}</p>}</div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SystemSettings() {
  const [settings, setSettings] = useState({ allowReg:true, emailNotif:true, maintenance:false, autoDelete:true, instituteName:"Smart Campus University", academicYear:"2025-26", maxAttempts:"5", sessionTimeout:"24", adminEmail:"admin@smartcampus.edu" });
  const [saved, setSaved] = useState(false);
  const set = (k,v) => setSettings(p=>({...p,[k]:v}));

  const handleSave = () => { setSaved(true); setTimeout(()=>setSaved(false), 3000); };

  return (
    <div className={PAGE+" fade-up"}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6"><h1 className="text-2xl font-bold text-slate-900">System Settings</h1><p className="text-slate-500 text-sm mt-0.5">Configure your Smart Campus platform</p></div>
        {saved&&<div className="mb-5"><Alert type="success"><MdCheck size={16}/>Settings saved successfully!</Alert></div>}

        {/* Institute info */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-4">
          <div className="flex items-center gap-2 mb-4"><MdBusiness size={18} className="text-indigo-500"/><h2 className="font-semibold text-slate-900 text-sm">Institute Information</h2></div>
          <div className="space-y-4">
            <div><label className={LABEL}>Institution Name</label><input value={settings.instituteName} onChange={e=>set("instituteName",e.target.value)} className={INPUT}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={LABEL}>Academic Year</label><input value={settings.academicYear} onChange={e=>set("academicYear",e.target.value)} placeholder="2025-26" className={INPUT}/></div>
              <div><label className={LABEL}>Admin Email</label><input type="email" value={settings.adminEmail} onChange={e=>set("adminEmail",e.target.value)} className={INPUT}/></div>
            </div>
          </div>
        </div>

        {/* Access */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-4">
          <div className="flex items-center gap-2 mb-2"><MdSecurity size={18} className="text-emerald-500"/><h2 className="font-semibold text-slate-900 text-sm">Access & Security</h2></div>
          <Row label="Open Registration" desc="Allow new users to create accounts"><Toggle checked={settings.allowReg} onChange={v=>set("allowReg",v)}/></Row>
          <Row label="Maintenance Mode" desc="Blocks all logins except admins"><Toggle checked={settings.maintenance} onChange={v=>set("maintenance",v)}/></Row>
          <Row label="Auto-delete Expired Sessions" desc="Remove old QR attendance sessions"><Toggle checked={settings.autoDelete} onChange={v=>set("autoDelete",v)}/></Row>
          <div className="grid grid-cols-2 gap-3 pt-4">
            <div><label className={LABEL}>Max Login Attempts</label><input type="number" value={settings.maxAttempts} onChange={e=>set("maxAttempts",e.target.value)} min="1" max="20" className={INPUT}/></div>
            <div><label className={LABEL}>Session Timeout (hours)</label><input type="number" value={settings.sessionTimeout} onChange={e=>set("sessionTimeout",e.target.value)} min="1" className={INPUT}/></div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-6">
          <div className="flex items-center gap-2 mb-2"><MdNotifications size={18} className="text-amber-500"/><h2 className="font-semibold text-slate-900 text-sm">Notifications</h2></div>
          <Row label="Email Notifications" desc="Send email alerts for complaints and announcements"><Toggle checked={settings.emailNotif} onChange={v=>set("emailNotif",v)}/></Row>
        </div>

        <button onClick={handleSave} className={BTN_PRIMARY + " px-8 py-3 text-base"}>
          <MdCheck size={17}/>Save Settings
        </button>
      </div>
    </div>
  );
}
