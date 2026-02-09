import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Icons from "./Icons";
import { useAuth } from "../../contexts/AuthContext";

const Chatbot = ({ analysisId, hidden }) => {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hi! I\'m your TIP AI assistant. Ask me about this analysis, risk scores, or next steps."
    }
  ]);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open]);

  const sendMessage = async () => {
    if (!input.trim() || !session?.access_token) return;
    const userMsg = { from: "user", text: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/chat`,
        { message: userMsg.text, analysisId },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      setMessages((m) => [...m, { from: "bot", text: res.data.reply || "(no reply)" }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { from: "bot", text: "Sorry, I couldn\'t reach the assistant right now." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (hidden) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 text-slate-800 dark:text-slate-100">
      {open ? (
        <div className="w-80 h-96 bg-tip-surface border border-slate-200 dark:border-slate-800 shadow-xl rounded-2xl flex flex-col overflow-hidden">
          <div className="px-3 py-2 bg-blue-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Icons.MessageCircle size={16} /> TIP AI Chat
            </div>
            <button onClick={() => setOpen(false)} className="hover:opacity-80">
              <Icons.X size={16} />
            </button>
          </div>
          <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50 dark:bg-slate-900/60">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`max-w-[90%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                  m.from === "user"
                    ? "bg-blue-600 text-white ml-auto"
                    : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                }`}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="text-[11px] text-slate-500">Assistant is typing…</div>
            )}
          </div>
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-tip-surface flex items-center gap-2">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              className="flex-1 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Ask about this report…"
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg w-12 h-12 flex items-center justify-center"
          title="Open AI Chat"
        >
          <Icons.MessageCircle size={20} />
        </button>
      )}
    </div>
  );
};

export default Chatbot;
