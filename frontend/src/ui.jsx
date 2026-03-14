// ─── Shared design tokens ────────────────────────────────────────────
export const PAGE = "p-5 pt-16 lg:pt-6 min-h-screen bg-slate-50";
export const CARD = "bg-white rounded-2xl border border-slate-100 shadow-sm";
export const INPUT =
  "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 outline-none text-sm text-slate-800 bg-white transition placeholder:text-slate-400";
export const SELECT =
  "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 outline-none text-sm text-slate-800 bg-white transition";
export const BTN_PRIMARY =
  "inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 active:scale-95 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed";
export const BTN_DANGER =
  "inline-flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 active:scale-95 transition text-sm disabled:opacity-50";
export const BTN_GHOST =
  "inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-slate-600 hover:bg-slate-100 active:scale-95 transition text-sm";
export const BTN_OUTLINE =
  "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 font-medium text-slate-700 hover:bg-slate-50 active:scale-95 transition text-sm";

export const BADGE = {
  blue: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700",
  green:
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700",
  red: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600",
  yellow:
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700",
  purple:
    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-violet-50 text-violet-700",
  gray: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600",
};

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6 gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Spinner({ size = 20 }) {
  return (
    <div
      className="animate-spin rounded-full border-2 border-slate-200"
      style={{ width: size, height: size, borderTopColor: "#6366f1" }}
    />
  );
}

export function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size={40} />
    </div>
  );
}

export function Empty({ icon: Icon, title, sub }) {
  return (
    <div className="text-center py-20">
      {Icon && <Icon size={48} className="text-slate-200 mx-auto mb-3" />}
      <p className="text-slate-500 font-medium">{title}</p>
      {sub && <p className="text-slate-400 text-sm mt-1">{sub}</p>}
    </div>
  );
}

export function Alert({ type = "error", children }) {
  const s = {
    error: "bg-red-50 border-red-200 text-red-800",
    success: "bg-emerald-50 border-emerald-200 text-emerald-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
  }[type];
  return (
    <div
      className={`flex items-start gap-2 p-3.5 rounded-xl border text-sm font-medium ${s}`}
    >
      {children}
    </div>
  );
}

export function SectionCard({ title, action, children, className = "" }) {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden ${className}`}
    >
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          {title && (
            <h2 className="font-semibold text-slate-900 text-sm">{title}</h2>
          )}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, color = "#6366f1", sub }) {
  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
          {label}
        </p>
        {Icon && <Icon size={16} style={{ color }} />}
      </div>
      <p className="text-2xl font-extrabold" style={{ color }}>
        {value}
      </p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}
