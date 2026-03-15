import { useEffect, useRef, useState } from "react";
import { MdAutoAwesome, MdClose, MdSend, MdSmartToy } from "react-icons/md";
import { getStudyHelp } from "../../services/ai";
import { askCampusBot } from "../../services/chatbot";

const SUGGESTIONS = [
  "What are my classes today?",
  "Show my attendance",
  "Latest notices",
  "My complaint status",
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ item }) {
  const isUser = item.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mr-2 mt-1">
          <MdSmartToy size={14} className="text-white" />
        </div>
      )}
      <div
        className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap
        ${isUser ? "bg-indigo-600 text-white rounded-br-sm" : "bg-white border border-slate-200 text-slate-700 rounded-bl-sm shadow-sm"}`}
      >
        {item.text}
        {item.intent && item.intent !== "general" && (
          <div
            className={`mt-1.5 text-[10px] font-semibold uppercase tracking-wide ${isUser ? "text-indigo-200" : "text-indigo-400"}`}
          >
            📊 {item.intent.replace("_", " ")}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi! I'm your Smart Campus AI assistant 🎓\n\nI can help with your timetable, attendance, notices, complaints, and even explain subjects. What would you like to know?",
    },
  ]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = async (text) => {
    const trimmed = (text || message).trim();
    if (!trimmed || loading) return;

    const userMsg = { role: "user", text: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setMessage("");
    setLoading(true);

    try {
      let answer, intent;

      if (studyMode) {
        // Study help mode — dedicated endpoint
        const res = await getStudyHelp(trimmed);
        answer = res.answer || "I couldn't answer that. Try rephrasing.";
        intent = "study_help";
      } else {
        // Pass full history for multi-turn context
        const history = messages
          .slice(-6)
          .map((m) => ({ role: m.role, text: m.text }));
        const res = await askCampusBot(trimmed, history);
        answer =
          res.answer || res.error || "I could not answer that right now.";
        intent = res.intent;
      }

      setMessages([...next, { role: "bot", text: answer, intent }]);
    } catch (err) {
      setMessages([
        ...next,
        {
          role: "bot",
          text:
            err.response?.data?.error ||
            err.message ||
            "Request failed. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () =>
    setMessages([{ role: "bot", text: "Chat cleared! How can I help you?" }]);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* Chat window */}
      {open && (
        <div
          className="mb-3 w-[92vw] max-w-sm flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
          style={{ height: "calc(min(600px, 85vh))" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ background: "linear-gradient(135deg,#4f46e5,#6366f1)" }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center">
                <MdSmartToy size={20} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-sm leading-tight">
                  Campus AI
                </p>
                <p className="text-[11px] text-indigo-200 leading-tight">
                  Powered by Gemini
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setStudyMode((s) => !s)}
                title="Toggle study mode"
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${studyMode ? "bg-white text-indigo-600" : "bg-white/10 text-white hover:bg-white/20"}`}
              >
                {studyMode ? "📚 Study" : "📚"}
              </button>
              <button
                onClick={clearChat}
                className="p-1.5 rounded-lg text-white/70 hover:bg-white/10 text-[11px]"
                title="Clear chat"
              >
                ↺
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10"
              >
                <MdClose size={18} className="text-white" />
              </button>
            </div>
          </div>

          {studyMode && (
            <div className="px-3 py-1.5 bg-amber-50 border-b border-amber-100 text-xs text-amber-700 font-medium flex items-center gap-1.5 shrink-0">
              <MdAutoAwesome size={13} /> Study mode — ask anything academic
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-slate-50 px-3 pt-3 pb-1">
            {messages.map((item, i) => (
              <MessageBubble key={i} item={item} />
            ))}
            {loading && (
              <div className="flex justify-start mb-3">
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 mr-2 mt-1">
                  <MdSmartToy size={14} className="text-white" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm shadow-sm">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions — only show if fresh chat */}
          {messages.length <= 1 && !loading && (
            <div className="px-3 py-2 flex gap-1.5 flex-wrap shrink-0 bg-slate-50 border-t border-slate-100">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-[11px] font-medium px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="border-t border-slate-200 p-3 bg-white shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={
                  studyMode
                    ? "Ask any academic question…"
                    : "Ask about timetable, attendance, notices…"
                }
                className="flex-1 resize-none rounded-2xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition"
              />
              <button
                onClick={() => send()}
                disabled={loading || !message.trim()}
                className="h-11 w-11 rounded-2xl bg-indigo-600 text-white grid place-items-center hover:bg-indigo-700 disabled:opacity-40 transition shrink-0"
              >
                <MdSend size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen((p) => !p)}
        aria-label="Open campus AI"
        className="h-14 w-14 rounded-full text-white shadow-xl grid place-items-center hover:scale-105 active:scale-95 transition-transform"
        style={{ background: "linear-gradient(135deg,#4f46e5,#6366f1)" }}
      >
        {open ? <MdClose size={26} /> : <MdSmartToy size={28} />}
      </button>
    </div>
  );
}
