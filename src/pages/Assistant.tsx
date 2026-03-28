import { useState, useRef, useEffect } from 'react';
import { Send, Plus, Settings, Sparkles, Zap, PieChart, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  isWelcome?: boolean;
}

export default function Assistant() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: '', // Text is ignored for the welcome card, we render it specifically
      sender: 'assistant',
      timestamp: new Date(),
      isWelcome: true,
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (textInput?: string) => {
    const textToSend = typeof textInput === 'string' ? textInput : input;
    if (!textToSend.trim()) return;
    
    const newUserMsg: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setIsTyping(true);
    
    // Mock assistant response
    setTimeout(() => {
      setIsTyping(false);
      let responseText = '收到您的指令，正在处理...';
      if (textToSend.includes('记账') || textToSend.includes('添加')) {
        responseText = '没问题，正在为您调起快捷记账面板...';
        setTimeout(() => navigate('/add-bet'), 1000);
      } else if (textToSend.includes('定制') || textToSend.includes('偏好')) {
        responseText = '好的，即将带您前往偏好设置中心...';
        setTimeout(() => navigate('/profile'), 1000);
      } else if (textToSend.includes('阿森纳') || textToSend.includes('胜率')) {
        responseText = '根据 Foretell 数据模型分析：\n\n今晚阿森纳对阵曼城的比赛，主队不败概率为 62.4%。\n\n核心数据：\n- 曼城核心罗德里因伤缺阵\n- 阿森纳近期主场 5 连胜\n\n建议关注【胜平负-主胜】或【让球-主+1】。';
      } else if (textToSend.includes('小绿')) {
        responseText = '小绿在呢！有什么可以帮您？您可以直接问我赛前分析，或者让我帮您记录投注。';
      }

      const newAssistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'assistant',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newAssistantMsg]);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full relative bg-[#F7F8FA]">
      {/* ── Header ── */}
      <header className="bg-white/80 backdrop-blur-md px-5 py-3 flex justify-between items-center sticky top-0 z-20 shadow-[0_2px_10px_rgba(0,0,0,0.02)] shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-200">
              <Sparkles size={18} strokeWidth={2.5} />
            </div>
            {/* Online indicator (Static, no pulse) */}
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3 items-center justify-center">
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-white"></span>
            </span>
          </div>
          <div>
            <h1 className="text-[16px] font-black text-gray-900 leading-tight tracking-tight">小绿助手</h1>
            <p className="text-[11px] text-emerald-500 font-medium flex items-center gap-1">
              Foretell AI 驱动
            </p>
          </div>
        </div>
        <button onClick={() => navigate('/profile')} className="p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100">
          <Settings size={20} />
        </button>
      </header>

      {/* ── Chat Area ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-[100px] space-y-5">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* Assistant Avatar */}
              {msg.sender === 'assistant' && !msg.isWelcome && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex-shrink-0 flex items-center justify-center text-white font-black text-[12px] mr-2.5 mt-1 shadow-sm">
                  绿
                </div>
              )}

              {/* Welcome Card */}
              {msg.isWelcome ? (
                <div className="w-full max-w-[92%] mt-2">
                  <div className="bg-white border border-gray-100/80 rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg">
                        <Sparkles size={16} />
                      </div>
                      <h2 className="text-[15px] font-bold text-gray-900">我是您的小助手，小绿</h2>
                    </div>
                    
                    <p className="text-[14px] text-gray-500 leading-relaxed mb-6">
                      我将基于 Foretell 数据模型，为您提供全方位的赛事决策与资金管理服务。
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3 bg-gray-50/80 p-3 rounded-2xl">
                        <div className="mt-0.5 bg-white shadow-sm p-1 rounded-md text-amber-500"><Zap size={14} /></div>
                        <div>
                          <h3 className="text-[13px] font-bold text-gray-800">早晚盘策略推送</h3>
                          <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">每日 10:30 & 18:00 定向推送高胜率策略，一键跟单。</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 bg-gray-50/80 p-3 rounded-2xl">
                        <div className="mt-0.5 bg-white shadow-sm p-1 rounded-md text-blue-500"><PieChart size={14} /></div>
                        <div>
                          <h3 className="text-[13px] font-bold text-gray-800">资金复盘早报</h3>
                          <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">每日 08:00 准时送达昨日盈亏简报及当月胜率走势。</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 bg-gray-50/80 p-3 rounded-2xl">
                        <div className="mt-0.5 bg-white shadow-sm p-1 rounded-md text-red-500"><ShieldCheck size={14} /></div>
                        <div>
                          <h3 className="text-[13px] font-bold text-gray-800">赛况实时监控</h3>
                          <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">进球、红牌等核心事件秒级推送，完场自动结算盈亏。</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Suggested Actions below welcome card */}
                  <div className="flex gap-2 mt-3 ml-2 overflow-x-auto no-scrollbar py-1">
                    <button 
                      onClick={() => handleSend('帮我记账')}
                      className="shrink-0 flex items-center gap-1.5 bg-white border border-gray-200 shadow-sm px-3.5 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <Plus size={14} className="text-emerald-500" />
                      <span className="text-[13px] font-bold text-gray-700">帮我记账</span>
                    </button>
                    <button 
                      onClick={() => handleSend('分析今晚阿森纳胜率')}
                      className="shrink-0 flex items-center gap-1.5 bg-white border border-gray-200 shadow-sm px-3.5 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <Sparkles size={14} className="text-blue-500" />
                      <span className="text-[13px] font-bold text-gray-700">分析今晚焦点战</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Regular Message Bubbles */
                <div
                  className={cn(
                    "max-w-[82%] px-4 py-3 shadow-sm",
                    msg.sender === 'user'
                      ? 'bg-emerald-500 text-white rounded-2xl rounded-tr-[4px] shadow-emerald-200/50'
                      : 'bg-white text-gray-800 rounded-2xl rounded-tl-[4px] border border-gray-100/80'
                  )}
                >
                  <div className="whitespace-pre-wrap text-[14px] leading-relaxed tracking-wide font-medium">{msg.text}</div>
                </div>
              )}
            </motion.div>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex justify-start mt-2"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex-shrink-0 flex items-center justify-center text-white font-black text-[12px] mr-2.5 mt-1 shadow-sm">
                绿
              </div>
              <div className="bg-white px-4 py-3.5 rounded-2xl rounded-tl-[4px] shadow-sm border border-gray-100/80 flex items-center gap-1.5 h-10">
                <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0, ease: "easeInOut" }} className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.15, ease: "easeInOut" }} className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.3, ease: "easeInOut" }} className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* ── Input Area ── */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-12 bg-gradient-to-t from-[#F7F8FA] via-[#F7F8FA] to-transparent z-10">
        <div className="flex items-center bg-white rounded-[20px] pl-4 pr-1.5 py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.08)] border border-gray-100/80">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="问问今晚的胜率，或输入“帮我记账”"
            className="flex-1 bg-transparent outline-none text-[14px] font-medium text-gray-800 placeholder:text-gray-400 py-2.5"
          />
          <button 
            onClick={() => handleSend()} 
            disabled={!input.trim()}
            className={cn(
              "ml-2 p-2.5 rounded-[14px] transition-all duration-300 flex items-center justify-center",
              input.trim() 
                ? "bg-gray-900 text-white shadow-md active:scale-95" 
                : "bg-gray-100 text-gray-400"
            )}
          >
            <Send size={16} className={cn(input.trim() && "ml-0.5")} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}