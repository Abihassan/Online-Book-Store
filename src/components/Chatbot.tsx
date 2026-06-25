/**
 * Chatbot.tsx
 */

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { sendChatMessage, ChatBook, ChatHistoryItem } from '../lib/chatApi';

interface Message {
  id: string;
  role: 'bot' | 'user';
  text: string;
  bookCards?: ChatBook[];
  quickReplies?: string[];
  timestamp: Date;
}

const FAQ_RESPONSES: Record<string, { text: string; quickReplies?: string[] }> = {
  shipping: {
    text: "📦 We offer free shipping! Delivery takes 5–7 days.",
    quickReplies: ['Returns policy', 'Payment methods', 'Recommend a book'],
  },
  returns: {
    text: "↩️ 30-day return policy available.",
    quickReplies: ['Shipping info', 'Payment methods'],
  },
  payment: {
    text: "💳 We accept all major cards securely.",
    quickReplies: ['Shipping info', 'Recommend a book'],
  },
};

const GENRE_MAP: Record<string, string> = {
  fiction: 'Fiction',
  science: 'Science',
  history: 'History',
  selfhelp: 'Self-Help',
  nonfiction: 'Non-Fiction',
};

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'bot',
  text: "👋 Hi! I'm BookBot — your smart reading assistant.",
  quickReplies: ['Shipping info', 'Returns policy', 'Recommend a book'],
  timestamp: new Date(),
};

export const Chatbot = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [typingSeconds, setTypingSeconds] = useState(0);
  const typingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    };
  }, []);

  const addBotMessage = (msg: Omit<Message, 'id' | 'role' | 'timestamp'>) => {
    setMessages(prev => [
      ...prev,
      {
        ...msg,
        id: `msg-${Date.now()}`,
        role: 'bot',
        timestamp: new Date(),
      },
    ]);
  };

  // ─────────────────────────────────────────────
  // RESPONSE ENGINE (API + fallback ONLY text, no DB usage)
  // ─────────────────────────────────────────────
  const getResponse = async (text: string) => {
    const lower = text.toLowerCase().trim();

    const history = messages.slice(-6).map(
      (m): ChatHistoryItem => ({
        role: m.role === 'bot' ? 'assistant' : 'user',
        content: m.text,
      })
    );

    setTyping(true);
    setTypingSeconds(0);
    typingTimerRef.current = setInterval(() => {
      setTypingSeconds((s) => s + 1);
    }, 1000);

    try {
      const res = await sendChatMessage(text, user?.id ?? null, history);

      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      setTyping(false);

      addBotMessage({
        text: res.reply,
        bookCards: res.books || [],
        quickReplies: ['Recommend a book', 'Back to menu'],
      });

      return;
    } catch {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      setTyping(false);
    }

    // ───────── CODE 2 FEATURES (NO DB FALLBACK) ─────────

    const matchedGenre = Object.keys(GENRE_MAP).find(g => lower.includes(g));

    if (matchedGenre) {
      const genre = GENRE_MAP[matchedGenre];

      addBotMessage({
        text: `📚 I can’t load live recommendations right now, but you can browse ${genre} books in the Books section.`,
        quickReplies: ['Recommend a book', 'Back to menu'],
      });

      return;
    }

    if (lower.includes('find') || lower.includes('search')) {
      addBotMessage({
        text: "🔎 I couldn’t search books right now. Please try the Books page search bar.",
        quickReplies: ['Recommend a book', 'Back to menu'],
      });

      return;
    }

    const faqKey = Object.keys(FAQ_RESPONSES).find(k => lower.includes(k));
    if (faqKey) {
      addBotMessage(FAQ_RESPONSES[faqKey]);
      return;
    }

    if (['hi', 'hello', 'hey'].some(g => lower.startsWith(g))) {
      addBotMessage({
        text: `Hello${user ? `, ${user.name}` : ''}! 😊`,
        quickReplies: ['Recommend a book', 'Shipping info', 'Returns policy'],
      });
      return;
    }

    addBotMessage({
      text: "I can help with books, orders, shipping, or recommendations 📚",
      quickReplies: ['Recommend a book', 'Shipping info'],
    });
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    setInput('');

    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        text,
        timestamp: new Date(),
      },
    ]);

    await getResponse(text);
  };

  const handleQuickReply = async (reply: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        text: reply,
        timestamp: new Date(),
      },
    ]);

    await getResponse(reply);
  };

  const renderText = (text: string) =>
    text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        <span key={i}>{part}</span>
      )
    );

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-orange-500 text-white shadow-lg flex items-center justify-center"
      >
        {open ? <X /> : <MessageCircle />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 w-[380px] bg-white border rounded-2xl shadow-xl flex flex-col">

          {/* Header */}
          <div className="p-3 bg-orange-500 text-white flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <span>BookBot</span>
            <button className="ml-auto" onClick={() => setOpen(false)}>
              <X />
            </button>
          </div>

          {/* Messages */}
          <div className="p-3 flex-1 overflow-y-auto space-y-3 bg-orange-50">

            {messages.map(msg => (
              <div key={msg.id} className={msg.role === 'user' ? 'text-right' : ''}>
                <div className="inline-block p-2 rounded bg-white border">
                  {renderText(msg.text)}
                </div>

                {msg.bookCards?.map(book => (
                  <div
                    key={book.id}
                    onClick={() => navigate(`/books/${book.id}`)}
                    className="border p-2 mt-2 rounded cursor-pointer"
                  >
                    📚 {book.title}
                  </div>
                ))}

                {msg.quickReplies && msg.role === 'bot' && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {msg.quickReplies.map(reply => (
                      <button
                        key={reply}
                        onClick={() => handleQuickReply(reply)}
                        className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded-full border border-orange-200 hover:bg-orange-200 transition-colors"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {typing && (
              <div className="inline-block p-2 rounded bg-white border text-sm text-gray-500">
                {typingSeconds < 5 ? (
                  'BookBot is thinking…'
                ) : typingSeconds < 20 ? (
                  'Still working on it — generating a reply locally…'
                ) : (
                  `Still going (${typingSeconds}s) — local replies can take a bit longer than usual, hang tight…`
                )}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-2 flex gap-2 border-t">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              className="flex-1 border p-2 rounded"
            />
            <button onClick={handleSend} className="bg-orange-500 text-white px-3 rounded">
              <Send />
            </button>
          </div>

        </div>
      )}
    </>
  );
};