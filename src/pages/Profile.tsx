import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChevronLeft, Bell, Clock, Shield, ChevronRight,
  Wallet, Target, Sparkles, Check, RotateCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'motion/react';
import {
  loadPreferences, savePreferences, UserPreferences,
  LEAGUE_OPTIONS, SPORT_OPTIONS, EVENT_OPTIONS
} from '@/lib/preferences';

// ─── Glass Orb Avatar ───
function GlassOrb({
  name, risk,
}: {
  name: string; risk: UserPreferences['risk'];
}) {
  const glowColor = risk === 'aggressive'
    ? 'rgba(245,158,11,0.25)'
    : risk === 'conservative'
    ? 'rgba(16,185,129,0.25)'
    : 'rgba(56,189,248,0.2)';

  const gradientFrom = risk === 'aggressive'
    ? 'from-amber-300/30'
    : risk === 'conservative'
    ? 'from-emerald-300/30'
    : 'from-sky-300/25';

  const gradientTo = risk === 'aggressive'
    ? 'to-orange-400/15'
    : risk === 'conservative'
    ? 'to-teal-400/15'
    : 'to-blue-400/12';

  return (
    <div className="relative flex flex-col items-center">
      {/* Background gradient animation */}
      <div className="absolute -top-8 w-48 h-48 pointer-events-none">
        <div className={cn('aurora-1 absolute inset-0 rounded-full blur-3xl bg-gradient-to-br opacity-60', gradientFrom, gradientTo)} />
        <div className={cn('aurora-2 absolute inset-4 rounded-full blur-2xl bg-gradient-to-tl opacity-40', gradientFrom, gradientTo)} />
      </div>

      {/* Orb */}
      <div className="relative orb-breathe">
        <div
          className="w-20 h-20 rounded-full bg-white/40 backdrop-blur-[40px] border-[0.5px] border-white/50 flex items-center justify-center shadow-[0_8px_40px_rgba(0,0,0,0.06)] icon-glow"
          style={{ '--glow-color': glowColor } as React.CSSProperties}
        >
          <span className="text-[28px] font-light text-gray-800 tracking-tight">
            {name.charAt(0) || '绿'}
          </span>
        </div>
        {/* Status badge */}
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white/70 backdrop-blur-xl border-[0.5px] border-white/40 flex items-center justify-center">
          <Sparkles size={11} strokeWidth={2} className="text-emerald-500" />
        </div>
      </div>
    </div>
  );
}

// ─── Text Reveal ───
function TextReveal({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    <motion.span
      className={cn('inline-block', className)}
      initial={{ opacity: 0, filter: 'blur(6px)', y: 4 }}
      animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {text}
    </motion.span>
  );
}

// ─── Apple Toggle with micro-scale ───
function PremiumToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <motion.label
      className="relative inline-flex items-center cursor-pointer touch-none select-none"
      whileTap={{ scale: 0.95 }}
    >
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <motion.div
        animate={{
          backgroundColor: checked ? 'rgb(16,185,129)' : 'rgb(229,231,235)',
        }}
        transition={{ duration: 0.3 }}
        className="w-[44px] h-[26px] rounded-full relative"
      >
        <motion.div
          animate={{ x: checked ? 19 : 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-[2px] w-[22px] h-[22px] bg-white rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.12)]"
        />
      </motion.div>
    </motion.label>
  );
}

// ─── Segment Slider (Apple-style with spring pill) ───
function SegmentSlider({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const activeIdx = options.findIndex(o => o.id === value);

  return (
    <div className="relative flex bg-white/30 backdrop-blur-2xl border-[0.5px] border-white/30 rounded-2xl p-1">
      <motion.div
        className="absolute top-1 bottom-1 rounded-[14px] bg-white/80 backdrop-blur-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border-[0.5px] border-white/50"
        initial={false}
        animate={{
          left: `calc(${(activeIdx / options.length) * 100}% + 4px)`,
          width: `calc(${100 / options.length}% - 8px)`,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
      {options.map((opt) => (
        <motion.button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'relative z-10 flex-1 py-2 text-[12px] font-medium rounded-[14px] transition-colors duration-300 tracking-[0.04em]',
            value === opt.id ? 'text-gray-900' : 'text-gray-400'
          )}
        >
          {opt.label}
        </motion.button>
      ))}
    </div>
  );
}

// ─── Meteors Background ───
function MeteorsBackground({ speed = 1 }: { speed?: number }) {
  const duration = Math.max(2, 8 / speed);
  const meteors = [
    { left: '15%', delay: 0 },
    { left: '40%', delay: 1.5 },
    { left: '65%', delay: 3 },
    { left: '85%', delay: 4.5 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {meteors.map((m, i) => (
        <div
          key={i}
          className="meteor"
          style={{
            left: m.left,
            top: '-10%',
            animation: `meteor-fall ${duration}s linear infinite`,
            animationDelay: `${m.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Success Sparkle Particles ───
function SuccessSparkles({ active }: { active: boolean }) {
  if (!active) return null;

  const particles = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 60,
    delay: Math.random() * 0.3,
    color: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#fbbf24', '#fcd34d'][i % 6],
  }));

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {particles.map((p) => (
        <div
          key={p.id}
          className="sparkle-particle"
          style={{
            backgroundColor: p.color,
            left: `calc(50% + ${p.x}px)`,
            top: '40%',
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Main Component ───
export default function Profile() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<UserPreferences>(() => loadPreferences());
  const [saved, setSaved] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);

  const updatePrefs = (patch: Partial<UserPreferences>) => {
    setPrefs(prev => ({ ...prev, ...patch }));
    setSaved(false);
  };

  const handleSave = () => {
    savePreferences(prefs);
    setSaved(true);
    setShowSparkles(true);
    setTimeout(() => setShowSparkles(false), 1000);
    setTimeout(() => navigate(-1), 900);
  };

  const handleResetOnboarding = () => {
    const reset = { ...prefs, isOnboarded: false };
    savePreferences(reset);
    navigate('/');
  };

  const toggleSport = (sport: string) => {
    const next = prefs.sports.includes(sport)
      ? prefs.sports.filter(s => s !== sport)
      : [...prefs.sports, sport];
    updatePrefs({ sports: next });
  };

  const toggleLeague = (league: string) => {
    const next = prefs.leagues.includes(league)
      ? prefs.leagues.filter(l => l !== league)
      : [...prefs.leagues, league];
    updatePrefs({ leagues: next });
  };

  // Notification intensity (count of enabled events) drives meteor speed
  const enabledEventCount = Object.values(prefs.pushEvents).filter(Boolean).length;
  const meteorSpeed = 0.5 + (enabledEventCount / EVENT_OPTIONS.length) * 2;

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-[#FAFBFC]">

      {/* ═══ Aurora Background ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="aurora-1 absolute -top-20 -left-16 w-72 h-72 rounded-full bg-gradient-to-br from-emerald-200/20 via-teal-100/12 to-transparent blur-3xl" />
        <div className="aurora-2 absolute top-1/3 -right-20 w-64 h-64 rounded-full bg-gradient-to-bl from-sky-200/15 via-blue-100/8 to-transparent blur-3xl" />
      </div>

      {/* Noise */}
      <div className="noise-overlay" />

      {/* Meteors — speed driven by notification settings */}
      <MeteorsBackground speed={meteorSpeed} />

      {/* ═══ Header ═══ */}
      <header className="relative z-20 px-4 py-3 flex justify-between items-center shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/50 backdrop-blur-xl border border-white/30 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft size={18} strokeWidth={2} />
        </button>
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[16px] font-semibold text-gray-900 tracking-tight"
        >
          小助手定制
        </motion.h1>
        <div className="w-8" />
      </header>

      {/* ═══ Scrollable Content ═══ */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 px-5 pb-28 space-y-5">

        {/* ═══ 1. Immersive Preview — Glass Orb + Name ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center pt-4 pb-6"
        >
          <GlassOrb name={prefs.name} risk={prefs.risk} />

          <div className="mt-5 text-center">
            <input
              type="text"
              value={prefs.name}
              onChange={(e) => updatePrefs({ name: e.target.value })}
              className="text-[22px] font-light text-center text-gray-800 tracking-tight border-none outline-none bg-transparent w-full placeholder:text-gray-300 focus:ring-0"
              placeholder="输入助手昵称"
            />
            <TextReveal
              text="专属智能助手"
              className="text-[11px] text-gray-300 font-medium tracking-[0.1em] mt-1 block"
              delay={0.3}
            />
          </div>
        </motion.div>

        {/* ═══ 2. Bento Grid Settings ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="grid grid-cols-2 gap-2.5"
        >
          {/* ── Risk Strategy — Full Width (Personality Segment) ── */}
          <div className="col-span-2 rounded-3xl bg-white/50 backdrop-blur-[40px] border-[0.5px] border-white/40 shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={13} strokeWidth={1.8} className="text-gray-400" />
              <span className="text-[10px] text-gray-300 font-medium tracking-[0.14em] uppercase">风险策略</span>
            </div>
            <SegmentSlider
              options={[
                { id: 'conservative', label: '保守' },
                { id: 'steady', label: '稳健' },
                { id: 'aggressive', label: '激进' },
              ]}
              value={prefs.risk}
              onChange={(id) => updatePrefs({ risk: id as UserPreferences['risk'] })}
            />
            <motion.p
              key={prefs.risk}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] text-gray-300 mt-2.5 text-center tracking-wide font-light"
            >
              {prefs.risk === 'conservative' ? '稳扎稳打，低风险低回报' :
               prefs.risk === 'steady' ? '攻守兼备，风险适中' :
               '高风险高回报，追求大赔率'}
            </motion.p>
          </div>

          {/* ── Sports — Left Card ── */}
          <div className="rounded-3xl bg-white/50 backdrop-blur-[40px] border-[0.5px] border-white/40 shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-4">
            <span className="text-[10px] text-gray-300 font-medium tracking-[0.14em] uppercase block mb-3">关注运动</span>
            <div className="space-y-2">
              {SPORT_OPTIONS.map(s => {
                const selected = prefs.sports.includes(s.id);
                return (
                  <motion.button
                    key={s.id}
                    onClick={() => toggleSport(s.id)}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      'w-full py-2 px-3 text-[12px] font-medium rounded-xl border-[0.5px] transition-all flex items-center justify-between tracking-wide',
                      selected
                        ? 'bg-emerald-500/5 border-emerald-500/15 text-emerald-600'
                        : 'bg-white/30 border-white/30 text-gray-400'
                    )}
                  >
                    {s.label}
                    {selected && <Check size={12} strokeWidth={2.5} className="text-emerald-500" />}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* ── Quick Actions — Right Card ── */}
          <div className="rounded-3xl bg-white/50 backdrop-blur-[40px] border-[0.5px] border-white/40 shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-4 flex flex-col justify-between">
            <span className="text-[10px] text-gray-300 font-medium tracking-[0.14em] uppercase block mb-3">快捷功能</span>
            <div className="space-y-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/bookkeeping')}
                className="w-full flex items-center gap-2 py-2 px-3 rounded-xl bg-white/30 border-[0.5px] border-white/30 text-gray-500 hover:border-emerald-500/10 transition-all"
              >
                <Wallet size={13} strokeWidth={1.8} className="text-gray-400" />
                <span className="text-[12px] font-medium tracking-wide flex-1 text-left">记账本</span>
                <ChevronRight size={13} className="text-gray-300" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleResetOnboarding}
                className="w-full flex items-center gap-2 py-2 px-3 rounded-xl bg-white/30 border-[0.5px] border-white/30 text-gray-500 hover:border-amber-500/10 transition-all"
              >
                <RotateCcw size={13} strokeWidth={1.8} className="text-gray-400" />
                <span className="text-[12px] font-medium tracking-wide flex-1 text-left">重新定制</span>
                <ChevronRight size={13} className="text-gray-300" />
              </motion.button>
            </div>
          </div>

          {/* ── Leagues — Full Width ── */}
          <div className="col-span-2 rounded-3xl bg-white/50 backdrop-blur-[40px] border-[0.5px] border-white/40 shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target size={13} strokeWidth={1.8} className="text-gray-400" />
              <span className="text-[10px] text-gray-300 font-medium tracking-[0.14em] uppercase">兴趣赛事</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {LEAGUE_OPTIONS.map(e => {
                const isSelected = prefs.leagues.includes(e.id);
                return (
                  <motion.button
                    key={e.id}
                    onClick={() => toggleLeague(e.id)}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      'px-3 py-1.5 text-[11px] font-medium rounded-xl border-[0.5px] transition-all flex items-center gap-1 tracking-wide',
                      isSelected
                        ? 'bg-gray-900/85 backdrop-blur-xl border-gray-800 text-white'
                        : 'bg-white/30 border-white/30 text-gray-400 hover:text-gray-600'
                    )}
                  >
                    {e.label}
                    {isSelected && <Check size={11} className="text-emerald-400" />}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* ═══ 3. Push Timing — Bento Cards ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-2 gap-2.5"
        >
          {/* Morning Report */}
          <div className="rounded-3xl bg-white/50 backdrop-blur-[40px] border-[0.5px] border-white/40 shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <Clock size={12} strokeWidth={1.8} className="text-amber-400" />
              <span className="text-[10px] text-gray-300 font-medium tracking-[0.12em] uppercase">早报</span>
            </div>
            <input
              type="time"
              value={prefs.morningTime}
              onChange={(e) => updatePrefs({ morningTime: e.target.value })}
              className="text-[18px] font-light text-gray-800 bg-transparent border-none outline-none w-full mono-time tracking-tight focus:ring-0"
            />
            <TextReveal
              text="前日复盘 · 今日关注"
              className="text-[9px] text-gray-300/60 font-light tracking-widest mt-1 block"
              delay={0.5}
            />
          </div>

          {/* Strategy Times */}
          <div className="rounded-3xl bg-white/50 backdrop-blur-[40px] border-[0.5px] border-white/40 shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <Clock size={12} strokeWidth={1.8} className="text-blue-400" />
              <span className="text-[10px] text-gray-300 font-medium tracking-[0.12em] uppercase">策略</span>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-[9px] text-gray-300/50 tracking-[0.1em] uppercase block mb-0.5">早场</span>
                <input
                  type="time"
                  value={prefs.strategyTimes[0]}
                  onChange={(e) => updatePrefs({ strategyTimes: [e.target.value, prefs.strategyTimes[1]] })}
                  className="text-[14px] font-light text-gray-800 bg-transparent border-none outline-none w-full mono-time tracking-tight focus:ring-0"
                />
              </div>
              <div>
                <span className="text-[9px] text-gray-300/50 tracking-[0.1em] uppercase block mb-0.5">晚场</span>
                <input
                  type="time"
                  value={prefs.strategyTimes[1]}
                  onChange={(e) => updatePrefs({ strategyTimes: [prefs.strategyTimes[0], e.target.value] })}
                  className="text-[14px] font-light text-gray-800 bg-transparent border-none outline-none w-full mono-time tracking-tight focus:ring-0"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══ 4. Event Notifications — with Lamp Effect on enabled items ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="rounded-3xl bg-white/50 backdrop-blur-[40px] border-[0.5px] border-white/40 shadow-[0_2px_20px_rgba(0,0,0,0.02)] overflow-hidden relative"
        >
          <div className="px-5 pt-5 pb-2">
            <div className="flex items-center gap-2 mb-1">
              <Bell size={13} strokeWidth={1.8} className="text-red-400" />
              <span className="text-[10px] text-gray-300 font-medium tracking-[0.14em] uppercase">实时事件推送</span>
            </div>
            <TextReveal
              text="您投注比赛的重点事件将实时推送"
              className="text-[10px] text-gray-300/50 font-light tracking-wide block mb-3"
              delay={0.4}
            />
          </div>

          <div className="divide-y divide-gray-100/20">
            {EVENT_OPTIONS.map((event) => {
              const isEnabled = prefs.pushEvents[event.id as keyof typeof prefs.pushEvents];
              return (
                <div
                  key={event.id}
                  className={cn(
                    'relative px-5 py-3.5 flex items-center justify-between transition-all duration-500',
                    isEnabled && 'lamp-effect'
                  )}
                  style={isEnabled ? { '--lamp-color': 'rgba(16,185,129,0.08)' } as React.CSSProperties : undefined}
                >
                  <div className="relative z-10 flex-1 min-w-0 mr-3">
                    <span className="text-[13px] font-medium text-gray-700 tracking-tight block">{event.label}</span>
                    <TextReveal
                      text={event.desc || ''}
                      className="text-[10px] text-gray-300/70 font-light tracking-wide mt-0.5 block"
                      delay={0.1}
                    />
                  </div>
                  <div className="relative z-10">
                    <PremiumToggle
                      checked={isEnabled}
                      onChange={(val) => updatePrefs({
                        pushEvents: { ...prefs.pushEvents, [event.id]: val }
                      })}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <div className="h-4" />
      </div>

      {/* ═══ 5. Save Button — Shiny Button with Success Particles ═══ */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-10 bg-gradient-to-t from-[#FAFBFC] via-[#FAFBFC]/90 to-transparent z-20">
        <div className="relative">
          <SuccessSparkles active={showSparkles} />
          <motion.button
            onClick={handleSave}
            whileTap={{ scale: 0.97 }}
            className={cn(
              'shiny-btn w-full py-3.5 rounded-2xl text-[14px] font-medium tracking-wide transition-all duration-500',
              saved
                ? 'bg-emerald-500/10 text-emerald-600 border-[0.5px] border-emerald-500/20'
                : 'bg-gray-900/90 backdrop-blur-xl text-white shadow-[0_4px_20px_rgba(0,0,0,0.08)]'
            )}
          >
            {saved ? '已保存' : '应用更改'}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
