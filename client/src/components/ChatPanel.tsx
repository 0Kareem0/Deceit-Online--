import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useSound } from '../context/SoundContext';
import { ChatMessage } from '@deceit/shared';
import {
  MessageSquare,
  Send,
  ChevronLeft,
  ChevronRight,
  Shield,
  Activity,
  Users,
  Bell,
  Sparkles,
  Info,
} from 'lucide-react';

export const ChatPanel: React.FC = () => {
  const { messages, sendMessage, roomCode, playerId } = useSocket();
  const { playSfx } = useSound();
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'chat' | 'events'>('all');
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const prevMessagesCount = useRef<number>(messages.length);

  useEffect(() => {
    // Auto-scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    // Track unread when collapsed
    if (messages.length > prevMessagesCount.current) {
      if (!isOpen) {
        setUnreadCount((prev) => prev + (messages.length - prevMessagesCount.current));
      }
      playSfx('click', 0.2);
    }
    prevMessagesCount.current = messages.length;
  }, [messages, isOpen, playSfx]);

  const handleToggle = () => {
    if (!isOpen) {
      setUnreadCount(0);
    }
    setIsOpen(!isOpen);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    sendMessage(inputMessage.trim());
    setInputMessage('');
    playSfx('click', 0.3);
  };

  if (!roomCode) return null;

  const filteredMessages = messages.filter((m) => {
    if (activeTab === 'chat') return m.type === 'user';
    if (activeTab === 'events') return m.type !== 'user';
    return true;
  });

  return (
    <>
      {/* Floating Toggle Button (Mobile & Collapsed) */}
      <button
        onClick={handleToggle}
        className={`fixed bottom-6 left-6 z-40 p-3.5 rounded-full glass-panel border-2 border-gold/40 text-gold shadow-[0_0_25px_rgba(212,175,55,0.3)] transition-all duration-300 hover:scale-110 ${
          isOpen ? 'bg-stone-900/90' : 'bg-gold/20 text-gold'
        }`}
        title={isOpen ? 'إغلاق اللوحة الجانبية' : 'فتح الشات والأحداث'}
      >
        <div className="relative">
          <MessageSquare className="w-6 h-6" />
          {!isOpen && unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border border-white animate-bounce">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </button>

      {/* Side Chat Drawer Container */}
      <div
        className={`fixed top-16 bottom-0 left-0 z-30 w-full sm:w-96 glass-panel border-r border-gold/30 bg-stone-950/95 shadow-2xl transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-800/80 flex items-center justify-between bg-stone-900/60">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-gold animate-pulse" />
            <h3 className="text-base font-bold font-kufi gold-gradient-text">سجل الأحداث والمحادثة</h3>
          </div>

          <button
            onClick={handleToggle}
            className="p-1.5 rounded-lg border border-stone-800 text-stone-400 hover:text-gold hover:border-gold/30 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center border-b border-stone-800/80 p-2 gap-1 bg-void/60 text-xs font-cairo">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-gold/20 text-gold border border-gold/40'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            الكل ({messages.length})
          </button>
          <button
            onClick={() => setActiveTab('events')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'events'
                ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            الأحداث ({messages.filter((m) => m.type !== 'user').length})
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-1.5 rounded-lg font-bold transition-all ${
              activeTab === 'chat'
                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            الدردشة ({messages.filter((m) => m.type === 'user').length})
          </button>
        </div>

        {/* Messages List Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 font-cairo text-xs">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-10 text-stone-500 space-y-2">
              <Sparkles className="w-8 h-8 text-stone-600 mx-auto" />
              <p>لا توجد رسائل في هذا القسم حالياً...</p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isMe = msg.senderId === playerId;
              const isSystem = msg.type !== 'user';

              if (isSystem) {
                return (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-xl border text-xs leading-relaxed space-y-1 ${
                      msg.type === 'phase'
                        ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200'
                        : msg.type === 'action'
                        ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                        : msg.type === 'elimination'
                        ? 'bg-red-950/50 border-red-500/50 text-red-200'
                        : 'bg-stone-900/80 border-gold/30 text-gold-light'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold font-kufi">
                      <span className="flex items-center gap-1.5">
                        <span>{msg.icon || '📜'}</span>
                        <span>إشعار النظام</span>
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="font-cairo">{msg.text}</p>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-start' : 'items-end'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] text-stone-400">
                    <span className="font-bold text-gold-light">{msg.senderName}</span>
                    <span className="text-[9px] text-stone-500">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl max-w-[85%] leading-relaxed ${
                      isMe
                        ? 'bg-emerald-950/80 text-emerald-100 border border-emerald-500/40 rounded-tr-none'
                        : 'bg-stone-900 text-stone-200 border border-stone-800 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-3 border-t border-stone-800 bg-stone-900/80 flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="اكتب رسالتك للمجلس..."
            className="flex-1 bg-void/90 border border-stone-700 rounded-xl px-3.5 py-2.5 text-stone-100 font-cairo text-xs focus:outline-none focus:border-gold transition-colors text-right"
            maxLength={150}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim()}
            className="p-2.5 rounded-xl bg-gold text-void font-bold shadow-gold-glow hover:bg-gold-light transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4 transform rotate-180" />
          </button>
        </form>
      </div>
    </>
  );
};
