import { useState } from "react";
import { MdClose, MdSend, MdSmartToy } from "react-icons/md";
import { askCampusBot } from "../../services/chatbot";

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi! I’m the Smart Campus assistant. Ask about attendance, timetable, notices, announcements, complaints, or your profile.",
    },
  ]);

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed || loading) return;

    const nextMessages = [...messages, { role: "user", text: trimmed }];
    setMessages(nextMessages);
    setMessage("");
    setLoading(true);

    try {
      const response = await askCampusBot(trimmed);
      setMessages([
        ...nextMessages,
        {
          role: "bot",
          text:
            response?.answer ||
            response?.error ||
            "I could not answer that right now.",
        },
      ]);
    } catch (err) {
      setMessages([
        ...nextMessages,
        {
          role: "bot",
          text:
            err.response?.data?.error ||
            err.message ||
            "Chatbot request failed.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 w-[92vw] max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-slate-900 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <MdSmartToy size={20} />
              <div>
                <p className="font-semibold text-sm">Campus Assistant</p>
                <p className="text-[11px] text-slate-300">
                  Connected to backend chatbot
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 hover:bg-white/10"
            >
              <MdClose size={18} />
            </button>
          </div>

          <div className="h-96 overflow-y-auto bg-slate-50 px-3 py-3 space-y-3">
            {messages.map((item, idx) => (
              <div
                key={`${item.role}-${idx}`}
                className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={[
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                    item.role === "user"
                      ? "bg-indigo-600 text-white"
                      : "bg-white border border-slate-200 text-slate-700",
                  ].join(" ")}
                >
                  {item.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-xs text-slate-400 px-1">Thinking…</div>
            )}
          </div>

          <div className="border-t border-slate-200 p-3 bg-white">
            <div className="flex items-end gap-2">
              <textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask something…"
                className="flex-1 resize-none rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={loading || !message.trim()}
                className="h-11 w-11 rounded-2xl bg-indigo-600 text-white grid place-items-center disabled:opacity-50"
              >
                <MdSend size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="h-14 w-14 rounded-full bg-indigo-600 text-white shadow-xl grid place-items-center hover:bg-indigo-700 transition"
        aria-label="Open campus chatbot"
      >
        <MdSmartToy size={28} />
      </button>
    </div>
  );
}
