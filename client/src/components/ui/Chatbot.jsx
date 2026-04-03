import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Icons from "./Icons";
import { useAuth } from "../../contexts/AuthContext";
import { useUI, useData, useActions } from "../../contexts/DashboardContext";

const Chatbot = () => {
  const { session } = useAuth();
  const { activeFile } = useData();
  const { isChatOpen: isOpen, language } = useUI();
  const { setIsChatOpen: setIsOpen } = useActions();

  const analysisId = activeFile?.id;
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: language === 'tl' 
        ? "Kumusta! Ako ang TIP AI Assistant. Magtanong ka tungkol sa pagsusuri, risk scores, o mga susunod na hakbang."
        : "Hello! I am the TIP AI Assistant. Feel free to ask about the analysis, risk scores, or next steps."
    }
  ]);

  // Sync initial message with language
  useEffect(() => {
    if (messages.length === 1 && messages[0].from === 'bot') {
        setMessages([
            {
                from: "bot",
                text: language === 'tl' 
                  ? "Kumusta! Ako ang TIP AI Assistant. Magtanong ka tungkol sa pagsusuri, risk scores, o mga susunod na hakbang."
                  : "Hello! I am the TIP AI Assistant. Feel free to ask about the analysis, risk scores, or next steps."
            }
        ]);
    }
  }, [language]);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || !session?.access_token) return;
    const userMsg = { from: "user", text: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const history = [...messages, userMsg]
      .filter((m) => m.from !== "system")
      .map((m) => ({
        role: m.from === "user" ? "user" : "assistant",
        content: m.text
      }));

    try {
      const res = await axios.post(
        (import.meta.env.VITE_API_BASE_URL || "") + "/api/chat",
        { 
          message: userMsg.text, 
          analysisId, 
          history,
          language: language // Explicitly send context language to backend
        },
        { headers: { Authorization: "Bearer " + session.access_token } }
      );
      setMessages((m) => [...m, { from: "bot", text: res.data.reply || (language === 'tl' ? "(walang sagot)" : "(no response)") }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { 
          from: "bot", 
          text: language === 'tl' 
            ? "Paumanhin, hindi ko maabot ang assistant ngayon. Subukan ulit mamaya." 
            : "Sorry, I can't reach the assistant right now. Please try again later."
        }
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

  const renderMessageContent = (text) => {
    const showcaseRegex = /<showcase\s+title="([^"]+)">([\s\S]*?)<\/showcase>/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = showcaseRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
      }
      parts.push({ type: 'showcase', title: match[1], content: match[2].trim() });
      lastIndex = showcaseRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIndex) });
    }

    if (parts.length === 0) return text;

    return (
      <div className="flex flex-col gap-3">
        {parts.map((part, i) => (
          part.type === 'text' ? (
            <span key={i} className="whitespace-pre-wrap">{part.content}</span>
          ) : (
            <ShowcaseCard key={i} title={part.title} content={part.content} />
          )
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[450px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-[100] flex flex-col font-sans antialiased animate-in slide-in-from-right duration-300">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-800/30 text-blue-600 dark:text-blue-400 shadow-sm">
            <Icons.MessageCircle size={18} className="stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-none tracking-tight">AI Assistant</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">Powered by Llama 3</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full p-2 transition-colors"
        >
          <Icons.X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/50 custom-scrollbar scroll-smooth">
        {messages.map((m, idx) => (
          <div key={idx} className={"flex flex-col gap-1.5 " + (m.from === "user" ? "items-end" : "items-start")}>
            {m.from === 'bot' && (
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">AI Assistant</span>
            )}
            <div className={"max-w-[95%] px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm " +
              (m.from === "user"
                ? "bg-blue-600 text-white rounded-br-sm whitespace-pre-wrap"
                : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-bl-sm"
              )
            }>
              {m.from === 'bot' ? renderMessageContent(m.text) : m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex flex-col gap-1.5 items-start">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">AI Assistant</span>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <div className="relative flex items-end gap-2 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 focus-within:ring-2 focus-within:ring-blue-500/10 focus-within:border-blue-500/50 transition-all">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            className="flex-1 bg-transparent text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none resize-none max-h-32 py-2 px-2 shadow-none border-none outline-none ring-0 w-full"
            placeholder="Type your message..."
            style={{ minHeight: '40px' }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="bg-blue-600 text-white rounded-lg p-2 w-10 h-10 flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors shadow-sm mb-0.5"
          >
            {loading ? <Icons.Loader size={18} className="animate-spin" /> : <Icons.Send size={18} className="ml-0.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

const ShowcaseCard = ({ title, content }) => {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 border border-emerald-200 dark:border-emerald-900/50 rounded-xl overflow-hidden shadow-md bg-emerald-50/30 dark:bg-emerald-900/10 animate-in fade-in zoom-in duration-300">
      <div className="bg-emerald-500/10 dark:bg-emerald-500/20 px-4 py-2 border-b border-emerald-200 dark:border-emerald-900/30 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Icons.Sparkles size={14} className="text-emerald-600 dark:text-emerald-400" />
          <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-300 uppercase tracking-tighter">{title}</span>
        </div>
        <button
          onClick={copy}
          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors p-1"
          title="Copy to clipboard"
        >
          {copied ? <Icons.Check size={14} /> : <Icons.Copy size={14} />}
        </button>
      </div>
      <div className="p-4 text-slate-800 dark:text-slate-100 font-serif italic leading-relaxed text-[13px] bg-white dark:bg-slate-900/50">
        {content}
      </div>
      <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-800/50 text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-800">
        <Icons.Info size={12} />
        <span>You can copy and manually apply this to your document.</span>
      </div>
    </div>
  );
};

export default Chatbot;

