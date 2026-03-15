import { useContext, useEffect, useState } from "react";
import {
  MdAutoAwesome,
  MdCheck,
  MdClose,
  MdDelete,
  MdEdit,
} from "react-icons/md";
import { AuthContext } from "../../context/AuthContext";
import { generateAnnouncement } from "../../services/ai";
import * as announcementsService from "../../services/announcements";
import {
  Alert,
  BTN_GHOST,
  BTN_PRIMARY,
  INPUT,
  PAGE,
  SELECT,
  SectionCard,
} from "../../ui";

const LABEL =
  "block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide";

export default function CreateAnnouncement() {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    message: "",
    audience: "ALL",
    dept: user?.dept || "",
    semester: "",
    section: "",
  });
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = () => {
    announcementsService
      .getAnnouncements()
      .then((d) => setItems(d?.announcements || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(load, []);
  const flash = (m, t = "success") => {
    if (t === "success") {
      setSuccess(m);
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setError(m);
      setTimeout(() => setError(""), 4000);
    }
  };
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleAIGenerate = async () => {
    if (!aiTopic.trim()) {
      flash("Enter a topic for AI to generate from.", "error");
      return;
    }
    setAiLoading(true);
    try {
      const res = await generateAnnouncement(aiTopic, form.audience, form.dept);
      if (res.ok) {
        set("message", res.text);
        flash("✨ AI generated announcement!");
      } else flash(res.error || "AI generation failed.", "error");
    } catch (err) {
      flash(err.response?.data?.error || "AI generation failed.", "error");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      flash("Title and message required.", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        semester: form.semester ? parseInt(form.semester) : undefined,
      };
      if (editId) {
        await announcementsService.updateAnnouncement(editId, payload);
        flash("Updated!");
        setEditId(null);
      } else {
        await announcementsService.createAnnouncement(payload);
        flash("Published!");
      }
      setForm({
        title: "",
        message: "",
        audience: "ALL",
        dept: user?.dept || "",
        semester: "",
        section: "",
      });
      setAiTopic("");
      load();
    } catch (err) {
      flash(err.response?.data?.error || "Failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (a) => {
    setEditId(a._id);
    setForm({
      title: a.title,
      message: a.message,
      audience: a.audience,
      dept: a.dept || "",
      semester: a.semester ? String(a.semester) : "",
      section: a.section || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const handleDelete = async (id) => {
    if (!confirm("Delete?")) return;
    try {
      await announcementsService.deleteAnnouncement(id);
      flash("Deleted!");
      load();
    } catch {
      flash("Failed.", "error");
    }
  };

  const mine = items.filter(
    (a) =>
      a.createdBy?._id === user?._id || a.createdBy?.toString() === user?._id,
  );

  return (
    <div className={PAGE + " fade-up"}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            {editId ? "Edit Announcement" : "Create Announcement"}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Target by dept, section or semester — AI can write it for you ✨
          </p>
        </div>
        {error && (
          <div className="mb-4">
            <Alert type="error">{error}</Alert>
          </div>
        )}
        {success && (
          <div className="mb-4">
            <Alert type="success">{success}</Alert>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className={LABEL}>Title</label>
              <input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Announcement title"
                className={INPUT}
                required
              />
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className={LABEL}>Audience</label>
                <select
                  value={form.audience}
                  onChange={(e) => set("audience", e.target.value)}
                  className={SELECT}
                >
                  <option value="ALL">Everyone</option>
                  <option value="STUDENT">Students</option>
                  <option value="FACULTY">Faculty</option>
                </select>
              </div>
              <div>
                <label className={LABEL}>
                  Dept{" "}
                  <span className="normal-case font-normal text-slate-400">
                    (opt)
                  </span>
                </label>
                <input
                  value={form.dept}
                  onChange={(e) => set("dept", e.target.value)}
                  placeholder="CS"
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>
                  Section{" "}
                  <span className="normal-case font-normal text-slate-400">
                    (opt)
                  </span>
                </label>
                <input
                  value={form.section}
                  onChange={(e) => set("section", e.target.value)}
                  placeholder="A"
                  className={INPUT}
                />
              </div>
            </div>
            <div>
              <label className={LABEL}>
                Semester{" "}
                <span className="normal-case font-normal text-slate-400">
                  (opt)
                </span>
              </label>
              <select
                value={form.semester}
                onChange={(e) => set("semester", e.target.value)}
                className={SELECT}
              >
                <option value="">All semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            {/* AI Generator */}
            <div className="p-4 rounded-2xl bg-linear-to-r from-violet-50 to-indigo-50 border border-violet-100">
              <p className="text-xs font-bold text-violet-700 mb-2 flex items-center gap-1.5">
                <MdAutoAwesome size={14} />✨ AI Announcement Generator
              </p>
              <div className="flex gap-2">
                <input
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g. Sports day event this Saturday, Project submission deadline…"
                  className="flex-1 px-3 py-2 rounded-xl border border-violet-200 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-50 outline-none bg-white"
                />
                <button
                  type="button"
                  onClick={handleAIGenerate}
                  disabled={aiLoading || !aiTopic.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 transition shrink-0"
                >
                  {aiLoading ? (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  ) : (
                    <MdAutoAwesome size={15} />
                  )}
                  {aiLoading ? "Generating…" : "Generate"}
                </button>
              </div>
            </div>

            <div>
              <label className={LABEL}>Message</label>
              <textarea
                value={form.message}
                onChange={(e) => set("message", e.target.value)}
                rows={4}
                placeholder="Write the announcement or use AI generator above…"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 outline-none text-sm resize-none placeholder:text-slate-400"
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className={BTN_PRIMARY}>
                {saving ? (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                ) : (
                  <>
                    <MdCheck size={15} />
                    {editId ? "Update" : "Publish"}
                  </>
                )}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditId(null);
                    setForm({
                      title: "",
                      message: "",
                      audience: "ALL",
                      dept: user?.dept || "",
                      semester: "",
                      section: "",
                    });
                    setAiTopic("");
                  }}
                  className={BTN_GHOST}
                >
                  <MdClose size={15} />
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <SectionCard title={`My Announcements (${mine.length})`}>
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-indigo-500 animate-spin" />
            </div>
          ) : mine.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">
              No announcements yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {mine.map((a) => (
                <div
                  key={a._id}
                  className="flex items-start gap-3 p-4 hover:bg-slate-50 transition"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">
                      {a.title}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full font-semibold">
                        {a.audience}
                      </span>
                      {a.dept && a.dept !== "ALL" && (
                        <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                          {a.dept}
                        </span>
                      )}
                      {a.semester && (
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                          Sem {a.semester}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleEdit(a)}
                      className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                    >
                      <MdEdit size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(a._id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                    >
                      <MdDelete size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
