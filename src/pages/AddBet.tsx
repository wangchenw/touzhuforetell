import { useState, useRef } from 'react';
import { ChevronLeft, Check, ScanLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, useMotionValue, useSpring } from 'motion/react';

// ─── Magnetic Scan Orb ───
function MagneticScanOrb({ onClick }: { onClick: () => void }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });
  const ref = useRef<HTMLButtonElement>(null);

  const handlePointerMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * 0.12);
    y.set((e.clientY - cy) * 0.12);
  };

  return (
    <motion.button
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => { x.set(0); y.set(0); }}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className="w-14 h-14 rounded-2xl bg-white/50 backdrop-blur-2xl border-[0.5px] border-white/40 flex items-center justify-center icon-glow"
      style={{ '--glow-color': 'rgba(16,185,129,0.15)', x: springX, y: springY } as any}
    >
      <ScanLine size={22} strokeWidth={1.8} className="text-emerald-500" />
    </motion.button>
  );
}

// ─── Sport Segment with fluid fill ───
function SportSegment({
  value,
  onChange,
}: {
  value: 'football' | 'basketball';
  onChange: (v: 'football' | 'basketball') => void;
}) {
  const options = [
    { id: 'football' as const, label: '足球', color: 'from-emerald-500/10 to-emerald-400/5', activeText: 'text-emerald-600' },
    { id: 'basketball' as const, label: '篮球', color: 'from-orange-500/10 to-orange-400/5', activeText: 'text-orange-600' },
  ];
  const activeIdx = options.findIndex(o => o.id === value);

  return (
    <div className="relative flex bg-white/30 backdrop-blur-2xl border-[0.5px] border-white/30 rounded-2xl p-1">
      {/* Sliding pill with fluid fill */}
      <motion.div
        className="absolute top-1 bottom-1 rounded-[14px] overflow-hidden"
        initial={false}
        animate={{
          left: `calc(${(activeIdx / options.length) * 100}% + 4px)`,
          width: `calc(${100 / options.length}% - 8px)`,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {/* Glass background */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-[0.5px] border-white/50 rounded-[14px] shadow-[0_2px_12px_rgba(0,0,0,0.04)]" />
        {/* Fluid color fill */}
        <motion.div
          key={value}
          initial={{ clipPath: 'inset(100% 0 0 0)' }}
          animate={{ clipPath: 'inset(0 0 0 0)' }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={cn('absolute inset-0 rounded-[14px] bg-gradient-to-b', options[activeIdx].color)}
        />
      </motion.div>

      {options.map((opt) => (
        <motion.button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'relative z-10 flex-1 py-2.5 text-[13px] font-medium rounded-[14px] transition-colors duration-300 flex items-center justify-center gap-1.5 tracking-[0.04em]',
            value === opt.id ? opt.activeText : 'text-gray-400'
          )}
        >
          {/* SF Symbols style sport icon */}
          {opt.id === 'football' ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transition-colors duration-300">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" fill="none" />
              <path d="M7 1 L9 4.5 L7 6 L5 4.5 Z" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.6" />
              <path d="M7 13 L9 9.5 L7 8 L5 9.5 Z" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.6" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transition-colors duration-300">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" fill="none" />
              <path d="M2 7 Q7 4, 12 7" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.6" />
              <path d="M2 7 Q7 10, 12 7" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.6" />
              <line x1="7" y1="1" x2="7" y2="13" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
            </svg>
          )}
          {opt.label}
        </motion.button>
      ))}
    </div>
  );
}

// ─── Glass Input Field with glow focus ───
function GlassInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  note,
  large,
  index = 0,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  note?: string;
  large?: boolean;
  index?: number;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-3xl bg-white/50 backdrop-blur-[40px] border-[0.5px] border-white/40 shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-4"
    >
      <div className="flex items-baseline gap-1.5 mb-2.5">
        <span className="text-[10px] text-gray-300 font-medium tracking-[0.14em] uppercase">{label}</span>
        {note && <span className="text-[9px] text-gray-300/50 font-normal tracking-wide">{note}</span>}
      </div>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className={cn(
            'w-full bg-transparent border-none outline-none text-gray-800 placeholder:text-gray-300/50 focus:ring-0 tracking-wide font-normal',
            large ? 'text-[22px]' : 'text-[15px]'
          )}
        />
        {/* Glowing underline on focus */}
        <motion.div
          animate={{
            width: focused ? '100%' : '0%',
            opacity: focused ? 1 : 0,
          }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="absolute bottom-0 left-0 h-[1px] bg-emerald-500/40 focus-glow"
        />
      </div>
    </motion.div>
  );
}

// ─── Main ───
export default function AddBet() {
  const navigate = useNavigate();
  const [sport, setSport] = useState<'football' | 'basketball'>('football');
  const [match, setMatch] = useState('');
  const [playType, setPlayType] = useState('');
  const [amount, setAmount] = useState('');
  const [odds, setOdds] = useState('');
  const [showSparkles, setShowSparkles] = useState(false);

  const handleSave = () => {
    if (!match || !amount) {
      alert('请填写完整信息');
      return;
    }
    setShowSparkles(true);
    setTimeout(() => {
      navigate('/bookkeeping');
    }, 600);
  };

  const handlePhotoUpload = () => {
    setMatch('曼城 vs 利物浦');
    setPlayType('胜平负 - 主胜');
    setOdds('1.85');
    setAmount('1000');
  };

  const prize = amount && odds ? (parseFloat(amount) * parseFloat(odds)).toFixed(2) : null;

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-[#FAFBFC]">

      {/* ═══ Aurora Background ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="aurora-1 absolute -top-20 -left-16 w-72 h-72 rounded-full bg-gradient-to-br from-emerald-200/20 via-teal-100/12 to-transparent blur-3xl" />
        <div className="aurora-2 absolute top-1/2 -right-16 w-60 h-60 rounded-full bg-gradient-to-bl from-sky-200/15 via-blue-100/8 to-transparent blur-3xl" />
      </div>

      {/* Noise */}
      <div className="noise-overlay" />

      {/* Background Beams */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      </div>

      {/* ═══ Header ═══ */}
      <header className="relative z-20 px-4 py-3 flex items-center shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/50 backdrop-blur-xl border border-white/30 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft size={18} strokeWidth={2} />
        </button>
        <h1 className="flex-1 text-center text-[16px] font-semibold text-gray-900 tracking-tight">添加记账</h1>
        <div className="w-8" />
      </header>

      {/* ═══ Scrollable Content ═══ */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 px-5 pb-28 space-y-4">

        {/* ═══ 1. Smart Lens — Frosted Glass Scanner ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          onClick={handlePhotoUpload}
          className="relative rounded-3xl bg-white/45 backdrop-blur-[40px] border-[0.5px] border-white/40 shadow-[0_4px_32px_rgba(0,0,0,0.03)] p-6 cursor-pointer active:scale-[0.98] transition-transform overflow-hidden"
        >
          {/* Noise texture inside the lens */}
          <div className="noise-overlay !opacity-[0.05]" style={{ zIndex: 0 }} />

          {/* Scan laser line */}
          <div className="scan-laser" />

          <div className="relative z-10 flex items-center gap-4">
            <MagneticScanOrb onClick={handlePhotoUpload} />
            <div className="flex-1 min-w-0">
              <span className="text-[16px] font-semibold text-gray-800 tracking-tight block leading-relaxed">
                拍照智能识别
              </span>
              <span className="text-[11px] text-gray-400/70 font-normal tracking-wide block mt-1 leading-[1.7]">
                支持竞彩网实体票一键导入
              </span>
            </div>
          </div>
        </motion.div>

        {/* ═══ 2. Beam Divider ═══ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-4 py-1"
        >
          <div className="beam-divider flex-1" />
          <span className="text-[10px] text-gray-300/50 font-normal tracking-[0.2em] uppercase">手动输入</span>
          <div className="beam-divider flex-1" />
        </motion.div>

        {/* ═══ 3. Bento Grid Form ═══ */}

        {/* Sport Type — Full Width Segment */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="rounded-3xl bg-white/50 backdrop-blur-[40px] border-[0.5px] border-white/40 shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-4"
        >
          <span className="text-[10px] text-gray-300 font-medium tracking-[0.14em] uppercase block mb-3">运动类型</span>
          <SportSegment value={sport} onChange={setSport} />
        </motion.div>

        {/* Match */}
        <GlassInput
          label="比赛"
          value={match}
          onChange={setMatch}
          placeholder="例如：曼联 vs 阿森纳"
          index={1}
        />

        {/* Play Type */}
        <GlassInput
          label="玩法"
          value={playType}
          onChange={setPlayType}
          placeholder="例如：胜平负 - 主胜"
          note="不支持超级大混投"
          index={2}
        />

        {/* Odds + Amount — Side by Side */}
        <div className="grid grid-cols-2 gap-2.5">
          <GlassInput
            label="赔率"
            value={odds}
            onChange={setOdds}
            placeholder="0.00"
            type="number"
            index={3}
          />
          <GlassInput
            label="投入金额"
            value={amount}
            onChange={setAmount}
            placeholder="0"
            type="number"
            large
            note="元"
            index={4}
          />
        </div>

        {/* ═══ Prize Preview ═══ */}
        {prize && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="rounded-3xl bg-white/50 backdrop-blur-[40px] border-[0.5px] border-white/40 shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-5 flex items-center justify-between"
          >
            <span className="text-[11px] text-gray-300 font-medium tracking-[0.1em] uppercase">预计最高奖金</span>
            <span className="text-[24px] font-normal text-gray-800 tracking-tighter mono-time">
              <span className="text-[13px] text-gray-300 mr-0.5">¥</span>
              {prize}
            </span>
          </motion.div>
        )}
      </div>

      {/* ═══ 4. Save Button — Deep Charcoal Glass + Shiny Effect ═══ */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-10 bg-gradient-to-t from-[#FAFBFC] via-[#FAFBFC]/90 to-transparent z-20">
        <div className="relative">
          {/* Success sparkles */}
          {showSparkles && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {Array.from({ length: 8 }, (_, i) => (
                <div
                  key={i}
                  className="sparkle-particle"
                  style={{
                    backgroundColor: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#fbbf24', '#fcd34d', '#10b981', '#34d399'][i],
                    left: `calc(50% + ${(Math.random() - 0.5) * 80}px)`,
                    top: '40%',
                    animationDelay: `${i * 0.04}s`,
                  }}
                />
              ))}
            </div>
          )}

          <motion.button
            onClick={handleSave}
            whileTap={{ scale: 0.97 }}
            className="shiny-btn w-full py-3.5 rounded-2xl bg-gray-900/92 backdrop-blur-2xl text-white text-[14px] font-medium tracking-wide shadow-[0_4px_24px_rgba(0,0,0,0.08)] flex items-center justify-center gap-2"
          >
            <span className="check-pulse">
              <Check size={17} strokeWidth={2.5} className="text-emerald-400" />
            </span>
            保存记录
          </motion.button>
        </div>
      </div>
    </div>
  );
}
