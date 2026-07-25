import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, X, Send, ShoppingBag } from 'lucide-react';
import { aiChatApi } from '../../api/aiChat.api';
import { extractError } from '../../api/client';
import Price from '../ui/Price';

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: "Hi, I'm Zesty \u2014 ZestMart's shopping assistant. Tell me what you're looking for (a product, a gift idea, a budget) and I'll find it for you.",
  products: [],
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const history = messages
      .filter((m) => m !== WELCOME_MESSAGE)
      .slice(-12)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    setSending(true);

    try {
      const res = await aiChatApi.send(text, history);
      const { reply, products } = res.data.data;
      setMessages((prev) => [...prev, { role: 'assistant', content: reply, products }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: extractError(err) || "Sorry, I'm having trouble right now \u2014 try again in a moment.", products: [] },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-ivory shadow-glow transition-transform duration-200 hover:scale-110 active:scale-95"
        aria-label="Open ZestMart assistant"
      >
        {open ? <X size={22} /> : <Sparkles size={22} />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[32rem] w-[22rem] max-w-[calc(100vw-2.5rem)] animate-scale-in flex-col overflow-hidden rounded-xl2 border border-ink/10 bg-paper shadow-glass">
          <div className="flex items-center gap-2 border-b border-ink/10 bg-teal-700 px-4 py-3 text-ivory">
            <Sparkles size={16} className="text-marigold-400" />
            <div>
              <p className="text-sm font-semibold">Zesty</p>
              <p className="text-[11px] text-teal-50/70">ZestMart shopping assistant</p>
            </div>
          </div>

          <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${m.role === 'user' ? 'bg-teal-600 text-ivory' : 'bg-sand text-ink'}`}>
                  <p className="whitespace-pre-line">{m.content}</p>
                  {m.products?.length > 0 && (
                    <div className="mt-2.5 space-y-2">
                      {m.products.map((p) => (
                        <Link
                          key={p._id}
                          to={`/products/${p.slug}`}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-2.5 rounded-lg bg-paper/80 p-2 transition hover:bg-paper"
                        >
                          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md bg-ivory">
                            {p.primaryImage && <img src={p.primaryImage} alt={p.title} className="h-full w-full object-cover" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-ink">{p.title}</p>
                            <Price value={p.price} compareAt={p.compareAtPrice} size="sm" />
                          </div>
                          <ShoppingBag size={14} className="shrink-0 text-teal-700" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-sand px-3.5 py-2.5">
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/40 [animation-delay:-0.2s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/40 [animation-delay:-0.1s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink/40" />
                  </span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={send} className="flex items-center gap-2 border-t border-ink/10 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for a product, gift idea…"
              className="input flex-1 text-sm"
              disabled={sending}
            />
            <button type="submit" disabled={sending || !input.trim()} className="btn-primary !px-3 !py-2.5">
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}