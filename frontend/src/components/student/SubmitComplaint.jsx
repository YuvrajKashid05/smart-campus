import { useState } from "react";
import { MdAutoAwesome, MdCheckCircle, MdSend } from "react-icons/md";
import * as complaintsService from "../../services/complaints";
import { Alert, PAGE } from "../../ui";

const CATS = [
  {
    v: "ACADEMIC",
    l: "Academic",
    emoji: "📚",
    desc: "Exams, grades, curriculum",
  },
  {
    v: "IT",
    l: "IT / Technical",
    emoji: "💻",
    desc: "Software, network, hardware",
  },
  {
    v: "FACILITY",
    l: "Facility",
    emoji: "🏛️",
    desc: "Classrooms, labs, infra",
  },
  { v: "OTHER", l: "Other", emoji: "📋", desc: "Anything else" },
];

const PRIORITY_STYLE = {
  HIGH: "bg-red-50 border-red-200 text-red-700",
  MEDIUM: "bg-amber-50 border-amber-200 text-amber-700",
  LOW: "bg-emerald-50 border-emerald-200 text-emerald-700",
};

export default function SubmitComplaint() {
  const [form, setForm] = useState({ category: "ACADEMIC", message: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.message.trim().length < 10) {
      setError("Please describe your complaint in at least 10 characters.");
      return;
    }
    setLoading(true);
    setError("");
    setAiAnalysis(null);
    try {
      const res = await complaintsService.submitComplaint(form);
      if (res.ok) {
        setSubmitted(res.complaint);
        if (res.aiAnalysis) setAiAnalysis(res.aiAnalysis);
        setForm({ category: "ACADEMIC", message: "" });
      } else setError(res.error || "Failed to submit");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit complaint");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={PAGE + " fade-up"}>
      <div className="max-w-xl mx-auto">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-slate-900">
            Submit a Complaint
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            AI will analyze your complaint and suggest priority & resolution
            time.
          </p>
        </div>

        {submitted && (
          <div className="mb-5 space-y-3">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
              <MdCheckCircle
                size={22}
                className="text-emerald-500 shrink-0 mt-0.5"
              />
              <div>
                <p className="font-semibold text-emerald-800 text-sm">
                  Complaint submitted successfully!
                </p>
                <p className="text-emerald-700 text-xs mt-0.5">
                  Reference ID: {submitted._id}
                </p>
                <button
                  onClick={() => {
                    setSubmitted(null);
                    setAiAnalysis(null);
                  }}
                  className="text-xs text-emerald-700 underline mt-1"
                >
                  Submit another
                </button>
              </div>
            </div>

            {/* AI Analysis card */}
            {aiAnalysis && (
              <div className="p-4 rounded-2xl border border-indigo-100 bg-linear-to-br from-indigo-50 to-purple-50">
                <p className="text-xs font-bold text-indigo-700 mb-3 flex items-center gap-1.5">
                  <MdAutoAwesome size={14} />
                  AI Analysis
                </p>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div
                    className={`p-2.5 rounded-xl border text-xs font-semibold text-center ${PRIORITY_STYLE[aiAnalysis.priority] || "bg-slate-50 border-slate-200 text-slate-700"}`}
                  >
                    <p className="text-[10px] opacity-70 mb-0.5">Priority</p>
                    {aiAnalysis.priority || "MEDIUM"}
                  </div>
                  <div className="p-2.5 rounded-xl border border-blue-200 bg-blue-50 text-xs font-semibold text-center text-blue-700">
                    <p className="text-[10px] opacity-70 mb-0.5">
                      Est. Resolution
                    </p>
                    {aiAnalysis.estimatedDays || "5"} days
                  </div>
                </div>
                {aiAnalysis.department && (
                  <p className="text-xs text-indigo-700 mb-2">
                    <span className="font-semibold">Assigned to:</span>{" "}
                    {aiAnalysis.department}
                  </p>
                )}
                {aiAnalysis.suggestedResponse && (
                  <div className="p-3 rounded-xl bg-white border border-indigo-100 text-xs text-slate-700 leading-relaxed">
                    <p className="text-[10px] font-bold text-indigo-500 mb-1">
                      SUGGESTED RESPONSE
                    </p>
                    {aiAnalysis.suggestedResponse}
                  </div>
                )}
                {aiAnalysis.tags?.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap mt-2">
                    {aiAnalysis.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mb-5">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        {!submitted && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7 space-y-5"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2.5 uppercase tracking-wide">
                Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CATS.map((c) => (
                  <button
                    key={c.v}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, category: c.v }))}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border-2 text-left transition ${form.category === c.v ? "border-indigo-500 bg-indigo-50" : "border-slate-100 hover:border-slate-200"}`}
                  >
                    <span className="text-base mt-0.5">{c.emoji}</span>
                    <div>
                      <p
                        className={`text-sm font-semibold ${form.category === c.v ? "text-indigo-700" : "text-slate-700"}`}
                      >
                        {c.l}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{c.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Description{" "}
                <span className="normal-case font-normal text-slate-400">
                  ({form.message.length}/1000)
                </span>
              </label>
              <textarea
                value={form.message}
                onChange={(e) =>
                  setForm((p) => ({ ...p, message: e.target.value }))
                }
                placeholder="Describe your complaint in detail — include dates, locations and people involved…"
                rows={6}
                maxLength={1000}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 outline-none text-sm text-slate-800 bg-white transition resize-none placeholder:text-slate-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition text-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Analyzing with AI…
                </>
              ) : (
                <>
                  <MdSend size={15} />
                  Submit Complaint
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-5 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-3">
          <MdAutoAwesome
            size={17}
            className="text-indigo-500 shrink-0 mt-0.5"
          />
          <div className="text-sm text-indigo-800">
            <p className="font-semibold mb-1">AI-Powered Analysis</p>
            <ul className="space-y-1 text-xs text-indigo-700 list-disc list-inside">
              <li>AI auto-detects priority (High/Medium/Low)</li>
              <li>Estimates resolution time based on complaint type</li>
              <li>Routes to the correct department automatically</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
