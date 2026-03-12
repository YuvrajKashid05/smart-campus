import { useState } from "react";
import {
  MdCheckCircle,
  MdCloud,
  MdEmail,
  MdLock,
  MdNotifications,
  MdSave,
  MdSettings,
  MdStorage,
} from "react-icons/md";

const SettingRow = ({ label, description, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b last:border-b-0">
    <div>
      <p className="font-medium text-gray-900">{label}</p>
      {description && (
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      )}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

const Toggle = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-gray-300"}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${checked ? "translate-x-6" : "translate-x-1"}`}
    />
  </button>
);

const SystemSettings = () => {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    allowRegistration: true,
    emailNotifications: true,
    maintenanceMode: false,
    autoDeleteExpiredSessions: true,
    maxLoginAttempts: "5",
    sessionTimeout: "24",
    smtpHost: "smtp.gmail.com",
    smtpPort: "587",
    adminEmail: "admin@smartcampus.edu",
    instituteName: "Smart Campus University",
    academicYear: "2025-26",
  });

  const update = (key, value) => setSettings((p) => ({ ...p, [key]: value }));

  const handleSave = () => {
    // In production, this would POST to /api/settings
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <MdSettings className="text-gray-600" /> System Settings
          </h1>
          <p className="text-gray-600 mt-1">
            Configure system-wide parameters and preferences
          </p>
        </div>

        {saved && (
          <div className="mb-6 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-4">
            <MdCheckCircle className="text-green-500" size={20} />
            <p className="text-green-800 font-medium">
              Settings saved successfully!
            </p>
          </div>
        )}

        <div className="space-y-6">
          {/* General */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MdSettings className="text-blue-500" /> General
            </h2>
            <SettingRow
              label="Institution Name"
              description="Displayed across all pages"
            >
              <input
                type="text"
                value={settings.instituteName}
                onChange={(e) => update("instituteName", e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
              />
            </SettingRow>
            <SettingRow label="Academic Year">
              <input
                type="text"
                value={settings.academicYear}
                onChange={(e) => update("academicYear", e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-32"
              />
            </SettingRow>
            <SettingRow
              label="Allow New Registrations"
              description="Students and faculty can self-register"
            >
              <Toggle
                checked={settings.allowRegistration}
                onChange={(v) => update("allowRegistration", v)}
              />
            </SettingRow>
            <SettingRow
              label="Maintenance Mode"
              description="Block all users except admins"
            >
              <div className="flex items-center gap-2">
                <Toggle
                  checked={settings.maintenanceMode}
                  onChange={(v) => update("maintenanceMode", v)}
                />
                {settings.maintenanceMode && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-semibold">
                    ON
                  </span>
                )}
              </div>
            </SettingRow>
          </div>

          {/* Security */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MdLock className="text-red-500" /> Security
            </h2>
            <SettingRow
              label="Max Login Attempts"
              description="Before account is temporarily locked"
            >
              <select
                value={settings.maxLoginAttempts}
                onChange={(e) => update("maxLoginAttempts", e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {["3", "5", "10"].map((v) => (
                  <option key={v} value={v}>
                    {v} attempts
                  </option>
                ))}
              </select>
            </SettingRow>
            <SettingRow
              label="Session Timeout"
              description="Auto-logout after inactivity"
            >
              <select
                value={settings.sessionTimeout}
                onChange={(e) => update("sessionTimeout", e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {[
                  ["1", "1 hour"],
                  ["8", "8 hours"],
                  ["24", "24 hours"],
                  ["168", "7 days"],
                ].map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </SettingRow>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MdNotifications className="text-yellow-500" /> Notifications
            </h2>
            <SettingRow
              label="Email Notifications"
              description="Send emails for notices and announcements"
            >
              <Toggle
                checked={settings.emailNotifications}
                onChange={(v) => update("emailNotifications", v)}
              />
            </SettingRow>
            <SettingRow label="Admin Email">
              <input
                type="email"
                value={settings.adminEmail}
                onChange={(e) => update("adminEmail", e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
              />
            </SettingRow>
          </div>

          {/* Email / SMTP */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MdEmail className="text-indigo-500" /> Email (SMTP)
            </h2>
            <SettingRow label="SMTP Host">
              <input
                type="text"
                value={settings.smtpHost}
                onChange={(e) => update("smtpHost", e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
              />
            </SettingRow>
            <SettingRow label="SMTP Port">
              <input
                type="text"
                value={settings.smtpPort}
                onChange={(e) => update("smtpPort", e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-24"
              />
            </SettingRow>
          </div>

          {/* Data Management */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MdStorage className="text-green-500" /> Data Management
            </h2>
            <SettingRow
              label="Auto-delete Expired Attendance Sessions"
              description="Remove sessions older than 30 days automatically"
            >
              <Toggle
                checked={settings.autoDeleteExpiredSessions}
                onChange={(v) => update("autoDeleteExpiredSessions", v)}
              />
            </SettingRow>
            <SettingRow
              label="Database"
              description="MongoDB connection status"
            >
              <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded text-sm font-semibold">
                <MdCloud size={14} /> Connected
              </span>
            </SettingRow>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition shadow"
            >
              <MdSave size={20} /> Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
