'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Bot, User, AlertCircle, BookOpen, Heart, Clock, Globe,
  Plus, ChevronDown, Mic, MicOff
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';
import { useI18n } from '@/lib/i18n';
import { aiApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import type { AIConversation, AIReference } from '@/types';

const CATEGORIES = [
  { key: 'general',  icon: Globe,     label_ar: 'عام',       label_ru: 'Общее' },
  { key: 'prayer',   icon: Heart,     label_ar: 'الصلاة',    label_ru: 'Намаз' },
  { key: 'quran',    icon: BookOpen,  label_ar: 'القرآن',    label_ru: 'Коран' },
  { key: 'hadith',   icon: Clock,     label_ar: 'الحديث',    label_ru: 'Хадис' },
  { key: 'fiqh',     icon: Globe,     label_ar: 'الفقه',     label_ru: 'Фикх' },
  { key: 'history',  icon: Clock,     label_ar: 'التاريخ',   label_ru: 'История' },
  { key: 'arabic',   icon: BookOpen,  label_ar: 'العربية',   label_ru: 'Арабский' },
  { key: 'aqeedah',  icon: Heart,     label_ar: 'العقيدة',   label_ru: 'Акыда' },
];

const SUGGESTED: Record<string, string[]> = {
  ar: ['ما هي أركان الإسلام الخمسة؟', 'كيف أؤدي صلاة الفجر؟', 'ما فضل قراءة القرآن الكريم؟', 'ما هي شروط الصيام؟', 'ما معنى التوحيد؟'],
  ru: ['Каковы пять столпов ислама?', 'Как совершать намаз Фаджр?', 'В чём достоинство чтения Корана?', 'Каковы условия поста?'],
  en: ['What are the five pillars of Islam?', 'How to perform Fajr prayer?', 'What is the virtue of reading Quran?'],
};

interface LocalMessage { id: string; role: 'user' | 'assistant'; content: string; references?: AIReference[]; timestamp: Date; }

export default function AIChat() {
  const { t, locale } = useI18n();
  const { isAuthenticated } = useAuthStore();
  const qc = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [messages, setMessages] = useState<LocalMessage[]>([{
    id: '0', role: 'assistant', timestamp: new Date(),
    content: locale === 'ar'
      ? 'السلام عليكم ورحمة الله وبركاته 🌙\n\nأنا **الإمام الذكي**، مساعدك الإسلامي التعليمي. يمكنني مساعدتك في الأسئلة المتعلقة بالإسلام والقرآن الكريم والحديث النبوي والتاريخ الإسلامي واللغة العربية.\n\n**تنبيه:** هذا المساعد للتوجيه التعليمي فقط.'
      : locale === 'ru'
      ? 'Ассаляму алейкум ва рахматуллахи ва баракатух 🌙\n\nЯ **ИИ-Имам**, ваш исламский образовательный помощник. Я могу помочь с вопросами об исламе, Коране, хадисах, исламской истории и арабском языке.\n\n**Примечание:** Этот помощник предназначен только для образовательного руководства.'
      : 'Assalamu Alaikum wa Rahmatullahi wa Barakatuh 🌙\n\nI am the **AI Imam**, your Islamic educational assistant. I can help with questions about Islam, Quran, Hadith, Islamic history, and Arabic language.\n\n**Note:** This assistant is for educational guidance only.',
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [category, setCategory] = useState('general');
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const { data: conversationsData } = useQuery({
    queryKey: ['ai-conversations'],
    queryFn: () => aiApi.getConversations(),
    enabled: isAuthenticated,
  });

  const conversations: AIConversation[] = (conversationsData as { conversations?: AIConversation[] })?.conversations || [];

  const sendMessage = useCallback(async (text?: string) => {
    const content = text || input.trim();
    if (!content || isLoading) return;

    const userMsg: LocalMessage = { id: Date.now().toString(), role: 'user', content, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await aiApi.chat({ message: content, language: locale, category, conversationId });
      const data = (response as unknown) as { message: string; references?: AIReference[]; conversationId?: string };

      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
        qc.invalidateQueries({ queryKey: ['ai-conversations'] });
      }

      const assistantMsg: LocalMessage = {
        id: (Date.now() + 1).toString(), role: 'assistant',
        content: data.message, references: data.references, timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      const errMsg: LocalMessage = {
        id: (Date.now() + 1).toString(), role: 'assistant', timestamp: new Date(),
        content: locale === 'ar' ? 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.' : locale === 'ru' ? 'Извините, произошла ошибка. Попробуйте снова.' : 'Sorry, an error occurred. Please try again.',
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, isLoading, locale, category, conversationId, qc]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const newConversation = () => {
    setMessages([{
      id: '0', role: 'assistant', timestamp: new Date(),
      content: locale === 'ar' ? 'السلام عليكم! كيف يمكنني مساعدتك اليوم؟' : locale === 'ru' ? 'Ассаляму алейкум! Чем могу помочь?' : 'Assalamu Alaikum! How can I help you today?',
    }]);
    setConversationId(undefined);
    setInput('');
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-background">
      {/* Sidebar */}
      {isAuthenticated && (
        <div className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 overflow-hidden bg-card border-r border-border flex flex-col`}>
          <div className="p-4 border-b border-border">
            <button onClick={newConversation} className="btn-primary w-full justify-center text-sm arabic-text">
              <Plus className="w-4 h-4" />{locale === 'ar' ? 'محادثة جديدة' : 'New Chat'}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
            {conversations.map(conv => (
              <button key={conv.id} onClick={() => setConversationId(conv.id)}
                className={`w-full text-right px-3 py-2.5 rounded-xl text-sm transition-colors mb-1 arabic-text ${conversationId === conv.id ? 'bg-primary-50 dark:bg-primary-950/30 text-primary-600' : 'hover:bg-muted text-muted-foreground'}`}>
                <p className="font-medium truncate">{conv.title || (locale === 'ar' ? 'محادثة' : 'Conversation')}</p>
                <p className="text-xs opacity-60">{conv.messageCount} {locale === 'ar' ? 'رسالة' : 'messages'}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-islamic-dark to-islamic-navy border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white">
                <ChevronDown className={`w-4 h-4 transition-transform ${sidebarOpen ? 'rotate-90' : '-rotate-90'}`} />
              </button>
            )}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-islamic-green to-primary-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm arabic-text">{t('askImam.title')}</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <p className="text-gray-400 text-xs">{locale === 'ar' ? 'متصل' : locale === 'ru' ? 'Онлайн' : 'Online'}</p>
              </div>
            </div>
          </div>

          {/* Category selector */}
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            {CATEGORIES.slice(0, 5).map(({ key, icon: Icon, label_ar, label_ru }) => (
              <button key={key} onClick={() => setCategory(key)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${category === key ? 'bg-primary-600 text-white' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}>
                <Icon className="w-3 h-3" />
                {locale === 'ar' ? label_ar : label_ru}
              </button>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-amber-800 dark:text-amber-300 text-xs arabic-text">{t('askImam.disclaimer')}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6">
          <div className="max-w-4xl mx-auto space-y-5">
            <AnimatePresence>
              {messages.map(msg => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${msg.role === 'assistant' ? 'bg-gradient-to-br from-islamic-green to-primary-600' : 'bg-gradient-to-br from-gold-500 to-gold-600'}`}>
                    {msg.role === 'assistant' ? <Bot className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-white" />}
                  </div>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${msg.role === 'assistant' ? 'bg-card border border-border rounded-tl-sm' : 'bg-primary-600 text-white rounded-tr-sm'}`}>
                    <div className={`text-sm leading-relaxed arabic-text prose prose-sm max-w-none ${msg.role === 'user' ? 'text-white prose-invert' : 'text-foreground'}`}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    {/* References */}
                    {msg.references && msg.references.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap gap-1.5">
                        {msg.references.map((ref, i) => (
                          <span key={i} className="badge badge-primary text-xs arabic-text">
                            {ref.type === 'quran' ? `القرآن ${ref.surah}:${ref.verse}` : ref.collection}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className={`text-xs mt-1.5 ${msg.role === 'user' ? 'text-white/60' : 'text-muted-foreground'}`}>
                      {msg.timestamp.toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-islamic-green to-primary-600 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1.5 items-center h-5">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Suggested questions */}
            {messages.length <= 1 && (
              <div className="mt-4">
                <p className="text-muted-foreground text-xs arabic-text mb-3">
                  {locale === 'ar' ? 'أسئلة مقترحة:' : locale === 'ru' ? 'Предлагаемые вопросы:' : 'Suggested questions:'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(SUGGESTED[locale] || SUGGESTED.ar).map(q => (
                    <button key={q} onClick={() => sendMessage(q)}
                      className="px-3 py-1.5 bg-muted hover:bg-primary-50 dark:hover:bg-primary-950/30 border border-border hover:border-primary-300 rounded-full text-xs text-muted-foreground hover:text-primary-600 transition-all arabic-text">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-border p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-end bg-card border border-border rounded-2xl p-3 shadow-lg focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-all">
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder={t('askImam.placeholder')} rows={1}
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm resize-none focus:outline-none arabic-text max-h-32"
                style={{ minHeight: '24px' }} />
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setIsListening(!isListening)}
                  className={`p-2 rounded-lg transition-colors ${isListening ? 'bg-red-100 text-red-600' : 'hover:bg-muted text-muted-foreground'}`}>
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <button onClick={() => sendMessage()} disabled={!input.trim() || isLoading}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-islamic-green to-primary-600 flex items-center justify-center text-white hover:from-primary-600 hover:to-islamic-green transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
