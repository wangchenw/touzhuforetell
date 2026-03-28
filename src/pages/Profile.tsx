import { useState } from 'react';
import { 
  ChevronLeft, User, Bell, Clock, Shield, Activity, ChevronRight, 
  Wallet, Trophy, Target, Smartphone, Sparkles, SlidersHorizontal, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

export default function Profile() {
  const navigate = useNavigate();
  const [name, setName] = useState('小绿');
  const [risk, setRisk] = useState('steady');
  const [sports, setSports] = useState(['football']);
  const [events, setEvents] = useState(['premier_league', 'nba']);
  const [morningTime, setMorningTime] = useState('08:00');
  const [strategyTimes, setStrategyTimes] = useState(['10:30', '18:00']);
  const [pushEvents, setPushEvents] = useState({
    start: true,
    goal: true,
    card: false,
    half: true,
    end: true,
  });

  const handleSave = () => {
    alert('定制保存成功！小绿将按照您的偏好为您服务。');
    navigate('/');
  };

  const toggleSport = (sport: string) => {
    setSports(prev => prev.includes(sport) ? prev.filter(s => s !== sport) : [...prev, sport]);
  };

  const toggleEvent = (event: string) => {
    setEvents(prev => prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]);
  };

  // ─── Reusable List Item Components ───
  
  const Section = ({ title, children, icon: Icon, color }: any) => (
    <div className="mb-5">
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <Icon size={14} className={color} />
        <h2 className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">{title}</h2>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100/80 overflow-hidden shadow-sm">
        {children}
      </div>
    </div>
  );

  const ListItem = ({ children, border = true, onClick }: any) => (
    <div 
      onClick={onClick}
      className={cn(
        "flex items-center justify-between px-4 py-3.5 bg-white transition-colors",
        border && "border-b border-gray-50",
        onClick && "cursor-pointer active:bg-gray-50"
      )}
    >
      {children}
    </div>
  );

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <label className="relative inline-flex items-center cursor-pointer touch-none">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
    </label>
  );

  return (
    <div className="flex flex-col h-full bg-[#F7F8FA]">
      {/* ── Header ── */}
      <header className="bg-white/90 backdrop-blur-md px-3 py-2 flex justify-between items-center sticky top-0 z-20 shadow-[0_1px_8px_rgba(0,0,0,0.03)] shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 text-gray-500 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-[17px] font-bold text-gray-900">小助手定制</h1>
        <button onClick={handleSave} className="px-3 py-1.5 bg-emerald-500 text-white rounded-full text-[13px] font-bold shadow-sm active:scale-95 transition-all">
          保存
        </button>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2 pb-12">
        
        {/* ── User Profile Hero ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100/80 mb-6 flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-black text-xl shadow-md shadow-emerald-200/50">
              {name.charAt(0) || '绿'}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
              <div className="bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center">
                <Sparkles size={10} />
              </div>
            </div>
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-[18px] font-black border-none outline-none text-gray-900 w-full bg-transparent placeholder:text-gray-300 p-0 m-0 leading-tight focus:ring-0"
              placeholder="输入助手昵称"
            />
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">专属智能助手</span>
              <span className="text-[11px] text-gray-400 font-medium">随时为您服务</span>
            </div>
          </div>
        </motion.div>

        {/* ── Navigation Links ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Section title="快捷功能" icon={Activity} color="text-blue-500">
            <ListItem border={false} onClick={() => navigate('/bookkeeping')}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Wallet size={16} />
                </div>
                <span className="text-[15px] font-semibold text-gray-800">我的记账本</span>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </ListItem>
          </Section>
        </motion.div>

        {/* ── Preferences ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Section title="投注偏好" icon={SlidersHorizontal} color="text-purple-500">
            {/* Risk */}
            <ListItem>
              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-gray-400" />
                  <span className="text-[14px] font-semibold text-gray-800">风险策略</span>
                </div>
                <div className="flex bg-gray-100/80 p-1 rounded-xl w-full">
                  {[
                    { id: 'conservative', label: '保守' },
                    { id: 'steady', label: '稳健' },
                    { id: 'aggressive', label: '激进' }
                  ].map(r => (
                    <button
                      key={r.id}
                      onClick={() => setRisk(r.id)}
                      className={cn(
                        "flex-1 py-1.5 text-[13px] font-bold rounded-lg transition-all",
                        risk === r.id ? "bg-white text-purple-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </ListItem>

            {/* Sports */}
            <ListItem>
              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-gray-400" />
                    <span className="text-[14px] font-semibold text-gray-800">关注运动</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {[
                    { id: 'football', label: '足球', icon: '⚽' },
                    { id: 'basketball', label: '篮球', icon: '🏀' }
                  ].map(s => (
                    <button
                      key={s.id}
                      onClick={() => toggleSport(s.id)}
                      className={cn(
                        "flex-1 py-2 px-3 text-[13px] font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5",
                        sports.includes(s.id) 
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                          : "bg-white border-gray-200 text-gray-500"
                      )}
                    >
                      <span>{s.icon}</span> {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </ListItem>

            {/* Leagues (Dense Chips) */}
            <ListItem border={false}>
              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-gray-400" />
                  <span className="text-[14px] font-semibold text-gray-800">兴趣赛事</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'premier_league', label: '英超' },
                    { id: 'la_liga', label: '西甲' },
                    { id: 'serie_a', label: '意甲' },
                    { id: 'champions_league', label: '欧冠' },
                    { id: 'nba', label: 'NBA' },
                    { id: 'cba', label: 'CBA' }
                  ].map(e => {
                    const isSelected = events.includes(e.id);
                    return (
                      <button
                        key={e.id}
                        onClick={() => toggleEvent(e.id)}
                        className={cn(
                          "px-3 py-1.5 text-[12px] font-bold rounded-lg border transition-all flex items-center gap-1",
                          isSelected 
                            ? "bg-gray-900 border-gray-900 text-white" 
                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        )}
                      >
                        {e.label}
                        {isSelected && <Check size={12} className="text-emerald-400" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </ListItem>
          </Section>
        </motion.div>

        {/* ── Schedule & Timing ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Section title="推送时间" icon={Clock} color="text-amber-500">
            <ListItem>
              <div className="flex flex-col w-full">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-semibold text-gray-800">早报推送</span>
                  <input
                    type="time"
                    value={morningTime}
                    onChange={(e) => setMorningTime(e.target.value)}
                    className="text-[14px] font-bold bg-gray-100/80 border-none rounded-lg px-2.5 py-1 text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none w-auto"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">包含前日复盘与今日关注</p>
              </div>
            </ListItem>
            
            <ListItem border={false}>
              <div className="flex flex-col w-full gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-semibold text-gray-800">策略推送 <span className="text-[11px] text-gray-400 font-normal ml-1">每日2次</span></span>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase pl-1">早场</span>
                    <input
                      type="time"
                      value={strategyTimes[0]}
                      onChange={(e) => setStrategyTimes([e.target.value, strategyTimes[1]])}
                      className="text-[14px] font-bold bg-gray-100/80 border-none rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none text-center"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase pl-1">晚场</span>
                    <input
                      type="time"
                      value={strategyTimes[1]}
                      onChange={(e) => setStrategyTimes([strategyTimes[0], e.target.value])}
                      className="text-[14px] font-bold bg-gray-100/80 border-none rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none text-center"
                    />
                  </div>
                </div>
              </div>
            </ListItem>
          </Section>
        </motion.div>

        {/* ── Real-time Notifications ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Section title="事件通知" icon={Bell} color="text-red-500">
            {[
              { id: 'start', label: '比赛开赛', desc: '首发阵容与开赛提醒' },
              { id: 'goal', label: '进球提醒', desc: '关键进球实时播报' },
              { id: 'card', label: '红黄牌', desc: '场上重大判罚事件' },
              { id: 'half', label: '半场赛果', desc: '半场比分及数据统计' },
              { id: 'end', label: '全场结束', desc: '最终比分与盈亏结算' }
            ].map((event, idx, arr) => (
              <ListItem key={event.id} border={idx !== arr.length - 1}>
                <div className="flex flex-col">
                  <span className="text-[14px] font-semibold text-gray-800">{event.label}</span>
                  <span className="text-[11px] text-gray-400 mt-0.5">{event.desc}</span>
                </div>
                <Toggle 
                  checked={pushEvents[event.id as keyof typeof pushEvents]} 
                  onChange={(val) => setPushEvents(prev => ({ ...prev, [event.id]: val }))}
                />
              </ListItem>
            ))}
          </Section>
        </motion.div>

        {/* Extra safe space at bottom */}
        <div className="h-6"></div>
      </div>
    </div>
  );
}