import { useState } from "react";
import { MdMessage, MdSend, MdCheckCircle, MdInfo } from "react-icons/md";
import * as complaintsService from "../../services/complaints";
import { PAGE, Alert } from "../../ui";

const CATS = [
  { v:"ACADEMIC", l:"Academic",      emoji:"📚", desc:"Exams, grades, curriculum" },
  { v:"IT",       l:"IT / Technical",emoji:"💻", desc:"Software, network, hardware" },
  { v:"FACILITY", l:"Facility",      emoji:"🏛️", desc:"Classrooms, labs, infra" },
  { v:"OTHER",    l:"Other",         emoji:"📋", desc:"Anything else" },
];

export default function SubmitComplaint() {
  const [form, setForm] = useState({ category:"ACADEMIC", message:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.message.trim().length < 10) { setError("Please describe your complaint in at least 10 characters."); return; }
    setLoading(true); setError("");
    try {
      const res = await complaintsService.submitComplaint(form);
      if (res.ok) { setSubmitted(res.complaint); setForm({ category:"ACADEMIC", message:"" }); }
      else setError(res.error || "Failed to submit");
    } catch(err) { setError(err.response?.data?.error || "Failed to submit complaint"); }
    finally { setLoading(false); }
  };

  return (
    <div className={PAGE + " fade-up"}>
      <div className="max-w-xl mx-auto">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-slate-900">Submit a Complaint</h1>
          <p className="text-slate-500 text-sm mt-0.5">All complaints are reviewed confidentially by administration.</p>
        </div>

        {submitted && (
          <div className="mb-5 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <MdCheckCircle size={22} className="text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-800 text-sm">Complaint submitted successfully!</p>
              <p className="text-emerald-700 text-xs mt-0.5">Reference ID: {submitted._id}</p>
              <button onClick={() => setSubmitted(null)} className="text-xs text-emerald-700 underline mt-1">Submit another</button>
            </div>
          </div>
        )}

        {error && <div className="mb-5"><Alert type="error">{error}</Alert></div>}

        {!submitted && (
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2.5 uppercase tracking-wide">Category</label>
              <div className="grid grid-cols-2 gap-2">
                {CATS.map(c => (
                  <button key={c.v} type="button" onClick={() => setForm(p => ({ ...p, category: c.v }))}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border-2 text-left transition ${form.category === c.v ? "border-indigo-500 bg-indigo-50" : "border-slate-100 hover:border-slate-200"}`}>
                    <span className="text-base mt-0.5">{c.emoji}</span>
                    <div>
                      <p className={`text-sm font-semibold ${form.category === c.v ? "text-indigo-700" : "text-slate-700"}`}>{c.l}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{c.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Description <span className="normal-case font-normal text-slate-400">({form.message.length}/1000)</span>
              </label>
              <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                placeholder="Describe your complaint in detail — include dates, locations and people involved…"
                rows={6} maxLength={1000} required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 outline-none text-sm text-slate-800 bg-white transition resize-none placeholder:text-slate-400" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition text-sm disabled:opacity-50">
              {loading ? <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" /> : <><MdSend size={15} />Submit Complaint</>}
            </button>
          </form>
        )}

        <div className="mt-5 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
          <MdInfo size={17} className="text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">What happens next?</p>
            <ul className="space-y-1 text-xs text-blue-700 list-disc list-inside">
              <li>Your complaint is reviewed by administration</li>
              <li>We aim to respond within 7 working days</li>
              <li>For urgent matters, contact the office directly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
