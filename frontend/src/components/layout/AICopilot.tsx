'use client';

import { useState } from 'react';
import { Bot, MessageSquare, Send, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { analyseQuery } from '@/lib/api';
import { useAnalysis } from '@/contexts/AnalysisContext';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
}

export default function AICopilot() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'ai', content: 'SYS.CORE online. Ask me anything about historical player and team performance. \n\n**Note**: This platform only contains datasets for specific historical seasons (e.g. World Cup 2022, Champions League 18/19, Euro 2024). Current or real-time players/matches are not applicable for analysis.' }
  ]);
  const [input, setInput] = useState('');
  
  const { data, setData, isLoading, setIsLoading } = useAnalysis();

  const sendQuery = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: queryText.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await analyseQuery(userMsg.content, data);
      
      if (res.is_full_analysis !== false) {
        setData(res);
      }
      
      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'ai', 
        content: res.analysis || 'Analysis complete, but no summary was generated.'
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'ai', content: 'SYS.ERROR: Failed to connect to analysis cluster.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sendQuery(input);
  };

  const QUICK_PROMPTS = [
    "How did Messi perform in World Cup 2022?",
    "What tactical weakness did Argentina expose?",
    "Analyze Kevin De Bruyne in the 18/19 Champions League"
  ];

  return (
    <aside className="fixed top-0 right-0 w-96 h-screen bg-[#060d14]/90 backdrop-blur-xl border-l border-emerald-500/20 shadow-[-20px_0_50px_rgba(0,0,0,0.3)] z-40 flex flex-col">
      {/* Header */}
      <div className="h-20 border-b border-emerald-500/20 flex items-center justify-between px-6 bg-gradient-to-r from-transparent to-emerald-500/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bot className="w-6 h-6 text-emerald-400" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div>
            <h2 className="font-bold text-emerald-400 font-[var(--font-space)] tracking-wider">AI CO-PILOT</h2>
            <p className="text-[10px] uppercase tracking-widest text-emerald-500/50">GPT-5 Synthesis</p>
          </div>
        </div>
        <MessageSquare className="w-5 h-5 text-emerald-500/40" />
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map(msg => (
          <motion.div 
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] rounded-2xl p-4 ${
              msg.role === 'user' 
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-100 rounded-tr-sm' 
                : 'bg-white/5 border border-white/10 text-white/80 rounded-tl-sm'
            }`}>
              {msg.role === 'ai' && (
                <div className="flex items-center gap-2 mb-2 text-emerald-500/60">
                  <Sparkles className="w-3 h-3" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">SYS.RESPONSE</span>
                </div>
              )}
              <div className="text-sm leading-relaxed text-emerald-50 whitespace-pre-wrap">
                <ReactMarkdown
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-lg font-bold text-emerald-400 mt-4 mb-2 uppercase tracking-wide" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-base font-bold text-emerald-300 mt-4 mb-2 uppercase tracking-wider" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-sm font-bold text-emerald-200 mt-3 mb-1 uppercase" {...props} />,
                    p: ({node, ...props}) => <p className="mb-3 leading-relaxed" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 space-y-1 text-emerald-100/90 marker:text-emerald-500" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 space-y-1 text-emerald-100/90 marker:text-emerald-500" {...props} />,
                    li: ({node, ...props}) => <li className="pl-1" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-bold text-emerald-300" {...props} />,
                    em: ({node, ...props}) => <em className="italic text-emerald-200/80" {...props} />,
                    blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-emerald-500/50 pl-3 py-1 my-3 bg-emerald-500/5 rounded-r-md italic text-emerald-100/70" {...props} />
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          </motion.div>
        ))}
        
        {messages.length === 1 && !isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col gap-2 mt-4"
          >
            <p className="text-[10px] uppercase tracking-widest text-emerald-500/50 mb-2 font-bold px-1">Suggested Queries</p>
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => sendQuery(prompt)}
                className="text-left p-3 rounded-xl border border-emerald-500/20 bg-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all text-xs text-emerald-100/70 hover:text-emerald-400 group"
              >
                <span className="text-emerald-500/40 mr-2 group-hover:text-emerald-400 transition-colors">&gt;</span>
                {prompt}
              </button>
            ))}
          </motion.div>
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm p-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-emerald-500/20 bg-[#060d14]">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask for tactical analysis..."
            className="w-full bg-white/5 border border-emerald-500/20 rounded-xl py-3 pl-4 pr-12 text-sm text-emerald-100 placeholder:text-emerald-500/30 focus:outline-none focus:border-emerald-500 focus:bg-white/10 transition-all"
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-500 hover:bg-emerald-400 text-[#060d14] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-center text-emerald-500/30 mt-3 font-mono">
          AI CAN MAKE MISTAKES. VERIFY TACTICAL INSIGHTS.
        </p>
      </div>
    </aside>
  );
}
