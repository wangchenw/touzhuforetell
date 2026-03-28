import { useState, useRef, useCallback } from 'react';
import { Plus, Settings, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

type SportFilter = 'all' | 'football' | 'basketball';
type StatusFilter = 'all' | 'won' | 'lost' | 'pending';

interface BetRecord {
  id: number;
  sport: 'football' | 'basketball';
  league: string;
  match: string;
  play: string;
  odds: number;
  amount: number;
  status: 'won' | 'lost' | 'pending';
  prize: number;
  date: string;
  time: string;
}

// ── Text Reveal Animation ──
function TextReveal({ text, className }: { text: string; className?: string }) {
  return (
    <motion.span
      className={cn('inline-block', className)}
      initial={{ opacity: 0, filter: 'blur(10px)', y: 8 }}
      animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
      transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {text}
    </motion.span>
  );
}

// ── Fluid Sparkline with touch/mouse drag ──
function FluidSparkline({ data, height = 120 }: { data: { date: string; value: number }[]; height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  if (data.length < 2) return null;

  const width = 320;
  const values = data.map(d => d.value);
  const minV = Math.min(...values, 0);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;
  const padTop = 24;
  const padBottom = 24;
  const padX = 16;
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;

  const points = data.map((d, i) => ({
    x: padX + (i / (data.length - 1)) * innerW,
    y: padTop + innerH - ((d.value - minV) / range) * innerH,
  }));

  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x},${p.y}`;
    const prev = points[i - 1];
    const cpx = (prev.x + p.x) / 2;
    return acc + ` C ${cpx},${prev.y} ${cpx},${p.y} ${p.x},${p.y}`;
  }, '');

  const areaD = pathD + ` L ${points[points.length - 1].x},${height - padBottom} L ${points[0].x},${height - padBottom} Z`;
  const lastPoint = points[points.length - 1];
  const lastValue = data[data.length - 1].value;
  const lineColor = lastValue >= 0 ? '#10b981' : '#ef4444';

  const resolveIndex = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const relX = (clientX - rect.left) / rect.width;
    const idx = Math.round(relX * (data.length - 1));
    return Math.max(0, Math.min(data.length - 1, idx));
  }, [data.length]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setActiveIdx(resolveIndex(e.clientX));
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setActiveIdx(resolveIndex(e.clientX));
  };
  const handlePointerUp = () => {
    setIsDragging(false);
    setTimeout(() => { if (!isDragging) setActiveIdx(null); }, 1500);
  };
  const handlePointerLeave = () => {
    if (!isDragging) setActiveIdx(null);
  };

  const activePoint = activeIdx !== null ? points[activeIdx] : null;
  const activeData = activeIdx !== null ? data[activeIdx] : null;

  return (
    <div
      ref={containerRef}
      className="relative select-none touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
        <defs>
          <linearGradient id="sparkGradPremium" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.08" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.0" />
          </linearGradient>
          <filter id="sparkGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Subtle horizontal guides */}
        {[0.25, 0.5, 0.75].map(pct => {
          const gy = padTop + innerH * (1 - pct);
          return <line key={pct} x1={padX} y1={gy} x2={width - padX} y2={gy} stroke="#e5e7eb" strokeWidth="0.4" strokeOpacity="0.5" />;
        })}

        {/* Area fill — very subtle */}
        <motion.path
          d={areaD}
          fill="url(#sparkGradPremium)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.4 }}
        />

        {/* Glow behind the curve */}
        <motion.path
          d={pathD}
          fill="none"
          stroke={lineColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.1"
          filter="url(#sparkGlow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.6, ease: 'easeInOut' }}
        />

        {/* Main curve — animated draw */}
        <motion.path
          d={pathD}
          fill="none"
          stroke={lineColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />

        {/* Date labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={points[i].x}
            y={height - 4}
            textAnchor="middle"
            fill={activeIdx === i ? '#374151' : '#d1d5db'}
            fontSize="8"
            fontWeight={activeIdx === i ? '600' : '400'}
            letterSpacing="0.02em"
          >
            {d.date}
          </text>
        ))}

        {/* Glowing endpoint — pulsing */}
        {activeIdx === null && (
          <>
            <circle cx={lastPoint.x} cy={lastPoint.y} r="10" fill={lineColor} opacity="0.08" className="glow-point" />
            <circle cx={lastPoint.x} cy={lastPoint.y} r="4" fill="white" stroke={lineColor} strokeWidth="1.5" />
          </>
        )}

        {/* Active crosshair + tooltip */}
        {activePoint && activeData && (
          <>
            <line
              x1={activePoint.x} y1={padTop}
              x2={activePoint.x} y2={height - padBottom}
              stroke={lineColor} strokeWidth="0.8" strokeDasharray="3 3" opacity="0.25"
            />
            <circle cx={activePoint.x} cy={activePoint.y} r="12" fill={lineColor} opacity="0.06" />
            <circle cx={activePoint.x} cy={activePoint.y} r="5" fill="white" stroke={lineColor} strokeWidth="1.5" />
            {(() => {
              const tooltipW = 68;
              const tooltipH = 30;
              let tx = activePoint.x - tooltipW / 2;
              if (tx < 4) tx = 4;
              if (tx + tooltipW > width - 4) tx = width - 4 - tooltipW;
              const ty = activePoint.y - tooltipH - 16;
              const tyFinal = ty < 2 ? activePoint.y + 16 : ty;
              return (
                <>
                  <rect x={tx} y={tyFinal} width={tooltipW} height={tooltipH} rx="10" fill="rgba(17,24,39,0.82)" />
                  <text x={tx + tooltipW / 2} y={tyFinal + 12} textAnchor="middle" fill="#9ca3af" fontSize="7" fontWeight="500">
                    {activeData.date}
                  </text>
                  <text x={tx + tooltipW / 2} y={tyFinal + 24} textAnchor="middle" fill="white" fontSize="11" fontWeight="700" letterSpacing="0.02em">
                    {activeData.value >= 0 ? '+' : ''}{activeData.value}
                  </text>
                </>
              );
            })()}
          </>
        )}
      </svg>

      {!isDragging && activeIdx === null && (
        <div className="absolute bottom-7 left-0 right-0 flex justify-center pointer-events-none">
          <span className="text-[9px] text-gray-300/50 font-medium tracking-widest">← 拖动查看 →</span>
        </div>
      )}
    </div>
  );
}

// ── Minimalist Donut (2px stroke, precise) ──
function MinimalistDonut({ winRate, size = 80 }: { winRate: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (winRate / 100) * circ;
  const center = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={center} cy={center} r={r} fill="none" stroke="#f3f4f6" strokeWidth="2" />
      <motion.circle
        cx={center} cy={center} r={r} fill="none"
        stroke="#10b981" strokeWidth="2" strokeLinecap="round"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeDashoffset={circ * 0.25}
        initial={{ strokeDasharray: `0 ${circ}` }}
        animate={{ strokeDasharray: `${filled} ${circ - filled}` }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
      />
      <text x={center} y={center - 1} textAnchor="middle" fill="#111827" fontSize="16" fontWeight="700" letterSpacing="-0.03em">
        {winRate}%
      </text>
      <text x={center} y={center + 13} textAnchor="middle" fill="#c9cdd4" fontSize="8" fontWeight="500" letterSpacing="0.08em">
        胜率
      </text>
    </svg>
  );
}

// ── Stats helper ──
function computeStats(records: BetRecord[]) {
  const totalProfit = records.reduce((sum, r) => {
    if (r.status === 'won') return sum + (r.prize - r.amount);
    if (r.status === 'lost') return sum - r.amount;
    return sum;
  }, 0);
  const wonCount = records.filter(r => r.status === 'won').length;
  const settledCount = records.filter(r => r.status !== 'pending').length;
  const winRate = settledCount > 0 ? Math.round((wonCount / settledCount) * 100) : 0;
  const pendingAmount = records.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0);
  return { totalProfit, wonCount, settledCount, winRate, pendingAmount, total: records.length };
}

// ── Main Page ──
export default function Bookkeeping() {
  const navigate = useNavigate();
  const [sportTab, setSportTab] = useState<SportFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const allRecords: BetRecord[] = [
    { id: 1, sport: 'football', league: '英超', match: '曼联 vs 阿森纳', play: '胜平负 - 主胜', odds: 2.10, amount: 500, status: 'won', prize: 1050, date: '03-28', time: '20:00' },
    { id: 2, sport: 'basketball', league: 'NBA', match: '湖人 vs 勇士', play: '让分 - 湖人+5.5', odds: 1.85, amount: 300, status: 'lost', prize: 0, date: '03-27', time: '10:30' },
    { id: 3, sport: 'football', league: '西甲', match: '皇马 vs 巴萨', play: '比分 - 2:1', odds: 8.50, amount: 100, status: 'pending', prize: 0, date: '03-29', time: '03:00' },
    { id: 4, sport: 'football', league: '欧冠', match: '拜仁 vs 巴黎', play: '大小球 - 大2.5', odds: 1.72, amount: 800, status: 'won', prize: 1376, date: '03-26', time: '04:00' },
    { id: 5, sport: 'basketball', league: 'CBA', match: '广东 vs 辽宁', play: '胜负 - 主胜', odds: 1.55, amount: 400, status: 'won', prize: 620, date: '03-26', time: '19:35' },
    { id: 6, sport: 'football', league: '意甲', match: '国米 vs 尤文', play: '让球 - 主-1', odds: 2.25, amount: 200, status: 'lost', prize: 0, date: '03-25', time: '03:45' },
    { id: 7, sport: 'basketball', league: 'NBA', match: '凯尔特人 vs 雷霆', play: '总分 - 大220.5', odds: 1.90, amount: 350, status: 'pending', prize: 0, date: '03-29', time: '08:00' },
    { id: 8, sport: 'football', league: '英超', match: '利物浦 vs 切尔西', play: '半全场 - 主/主', odds: 3.20, amount: 150, status: 'lost', prize: 0, date: '03-24', time: '23:30' },
  ];

  const sportRecords = sportTab === 'all' ? allRecords : allRecords.filter(r => r.sport === sportTab);
  const stats = computeStats(sportRecords);
  const filtered = sportRecords.filter(r => statusFilter === 'all' || r.status === statusFilter);

  const footballCount = allRecords.filter(r => r.sport === 'football').length;
  const basketballCount = allRecords.filter(r => r.sport === 'basketball').length;

  const profitCurve = (() => {
    const settled = sportRecords
      .filter(r => r.status !== 'pending')
      .sort((a, b) => a.date.localeCompare(b.date));
    let cum = 0;
    const map = new Map<string, number>();
    map.set('03-22', 0);
    map.set('03-23', 120);
    for (const r of settled) {
      cum = (map.size > 0 ? Array.from(map.values()).pop()! : 0);
      if (r.status === 'won') cum += (r.prize - r.amount);
      else cum -= r.amount;
      map.set(r.date, cum);
    }
    return Array.from(map.entries()).map(([date, value]) => ({ date, value }));
  })();

  const profitText = `${stats.totalProfit >= 0 ? '+' : ''}${stats.totalProfit.toFixed(0)}`;

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-[#FAFBFC]">

      {/* ═══ Aurora Background ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="aurora-1 absolute -top-20 -left-20 w-72 h-72 rounded-full bg-gradient-to-br from-emerald-200/30 via-teal-100/20 to-transparent blur-3xl" />
        <div className="aurora-2 absolute top-40 -right-16 w-64 h-64 rounded-full bg-gradient-to-bl from-blue-200/20 via-indigo-100/15 to-transparent blur-3xl" />
        <div className="aurora-3 absolute bottom-20 left-10 w-56 h-56 rounded-full bg-gradient-to-tr from-purple-200/15 via-pink-100/10 to-transparent blur-3xl" />
      </div>

      {/* ═══ Header ═══ */}
      <header className="relative z-10 px-6 pt-4 pb-2 flex justify-between items-center shrink-0">
        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">投注</h1>
        <button
          onClick={() => navigate('/profile')}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/60 backdrop-blur-xl border border-white/30 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <Settings size={17} strokeWidth={1.8} />
        </button>
      </header>

      {/* ═══ Sport Tabs — minimal capsules ═══ */}
      <div className="relative z-10 px-6 pt-1 pb-3 shrink-0">
        <div className="flex gap-1.5">
          {([
            { key: 'all' as const, label: '全部' },
            { key: 'football' as const, label: '足球' },
            { key: 'basketball' as const, label: '篮球' },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setSportTab(tab.key); setStatusFilter('all'); }}
              className={cn(
                "px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-400 border",
                sportTab === tab.key
                  ? "bg-white/70 backdrop-blur-xl border-white/40 text-gray-900 shadow-sm shadow-gray-200/30"
                  : "bg-transparent border-transparent text-gray-400 hover:text-gray-600"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Scrollable Content ═══ */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 pb-28">
        <div className="px-5 space-y-5">

          {/* ═══ Main Profit Card — Frosted Glass ═══ */}
          <motion.div
            key={sportTab + '-hero'}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative rounded-3xl bg-white/60 backdrop-blur-2xl border border-white/30 shadow-[0_8px_40px_rgba(0,0,0,0.04)] p-6 overflow-hidden"
          >
            {/* Radiant border glow */}
            <div className="absolute inset-0 rounded-3xl border border-emerald-500/[0.06] pointer-events-none" />
            {/* Subtle green aura behind the number */}
            {stats.totalProfit >= 0 && (
              <div className="absolute top-8 left-4 w-36 h-20 bg-emerald-400/[0.05] blur-3xl rounded-full pointer-events-none" />
            )}

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-1">
                <span className="text-[11px] font-medium text-gray-400 tracking-widest uppercase">
                  {sportTab === 'all' ? '累计盈亏' : sportTab === 'football' ? '足球盈亏' : '篮球盈亏'}
                </span>
                <span className="text-[10px] text-gray-300 font-medium tracking-wide">本月</span>
              </div>

              {/* Massive profit number — text reveal */}
              <div className="mt-3 mb-8">
                <TextReveal
                  key={sportTab + '-profit'}
                  text={profitText}
                  className="text-[48px] font-black tracking-tighter leading-none text-gray-900"
                />
                <span className="text-[13px] font-normal text-gray-300 ml-1.5 tracking-wide">元</span>
              </div>

              {/* Stats row — thin dividers, wide spacing */}
              <div className="flex items-center">
                <div className="flex-1">
                  <div className="text-[10px] text-gray-300 font-medium tracking-widest mb-1">胜率</div>
                  <div className="text-[18px] font-bold text-gray-800 tracking-tight">
                    {stats.winRate}<span className="text-[11px] text-gray-300 ml-0.5">%</span>
                  </div>
                </div>
                <div className="w-px h-8 bg-gray-200/40" />
                <div className="flex-1 pl-5">
                  <div className="text-[10px] text-gray-300 font-medium tracking-widest mb-1">总投注</div>
                  <div className="text-[18px] font-bold text-gray-800 tracking-tight">
                    {stats.total}<span className="text-[11px] text-gray-300 ml-0.5">单</span>
                  </div>
                </div>
                <div className="w-px h-8 bg-gray-200/40" />
                <div className="flex-1 pl-5">
                  <div className="text-[10px] text-gray-300 font-medium tracking-widest mb-1">待开奖</div>
                  <div className="text-[18px] font-bold text-gray-800 tracking-tight">
                    {stats.pendingAmount}<span className="text-[11px] text-gray-300 ml-0.5">元</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ═══ Sparkline Card — Frosted Glass ═══ */}
          <motion.div
            key={sportTab + '-chart'}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="rounded-3xl bg-white/60 backdrop-blur-2xl border border-white/30 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] font-semibold text-gray-500 tracking-wide flex items-center gap-1.5">
                <TrendingUp size={13} className="text-emerald-500/70" />
                盈亏走势
              </span>
              <span className="text-[10px] text-gray-300 font-medium tracking-wide">近7日</span>
            </div>
            <FluidSparkline data={profitCurve} height={120} />
          </motion.div>

          {/* ═══ Win Rate + Distribution — Two frosted cards ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.5 }}
            className="grid grid-cols-2 gap-3"
          >
            {/* Donut — minimal 2px ring */}
            <div className="rounded-3xl bg-white/60 backdrop-blur-2xl border border-white/30 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-5 flex flex-col items-center justify-center">
              <MinimalistDonut winRate={stats.winRate} size={80} />
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] text-gray-400">{stats.wonCount}胜</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                  <span className="text-[10px] text-gray-400">{stats.settledCount - stats.wonCount}负</span>
                </div>
              </div>
            </div>

            {/* Distribution — thin bars */}
            <div className="rounded-3xl bg-white/60 backdrop-blur-2xl border border-white/30 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-center">
              <span className="text-[10px] text-gray-300 font-medium tracking-widest mb-4">投注分布</span>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[11px] text-gray-500 font-medium">足球</span>
                    <span className="text-[11px] text-gray-800 font-bold">{footballCount}</span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round((footballCount / (footballCount + basketballCount || 1)) * 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                      className="h-full bg-gradient-to-r from-emerald-400/60 to-emerald-500/40 rounded-full"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[11px] text-gray-500 font-medium">篮球</span>
                    <span className="text-[11px] text-gray-800 font-bold">{basketballCount}</span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round((basketballCount / (footballCount + basketballCount || 1)) * 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.4 }}
                      className="h-full bg-gradient-to-r from-blue-400/50 to-blue-500/30 rounded-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ═══ Status Filter Pills ═══ */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {([
              { key: 'all' as const, label: '全部' },
              { key: 'won' as const, label: '已中奖' },
              { key: 'lost' as const, label: '未中奖' },
              { key: 'pending' as const, label: '待开奖' },
            ]).map(s => (
              <button
                key={s.key}
                onClick={() => setStatusFilter(s.key)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all duration-300 whitespace-nowrap border",
                  statusFilter === s.key
                    ? "bg-white/80 backdrop-blur-xl border-emerald-500/20 text-gray-800 shadow-sm"
                    : "bg-transparent border-transparent text-gray-400"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Records label */}
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[12px] font-semibold text-gray-500 tracking-wide">投注记录</span>
            <span className="text-[10px] text-gray-300">{filtered.length} 条</span>
          </div>

          {/* ═══ Bet Records — Frosted glass cards with hover glow ═══ */}
          <div className="space-y-2.5">
            {filtered.map((record, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * idx, duration: 0.4 }}
                key={record.id}
                className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_2px_16px_rgba(0,0,0,0.02)] overflow-hidden hover:border-emerald-500/10 transition-all duration-500"
              >
                <div className="p-4">
                  {/* Top info row */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100/60 text-gray-400 font-medium tracking-wide">
                        {record.league}
                      </span>
                      <span className="text-[10px] text-gray-300">{record.date} {record.time}</span>
                    </div>
                    <span className={cn(
                      "text-[10px] font-semibold tracking-wide",
                      record.status === 'won' ? "text-emerald-500" :
                      record.status === 'lost' ? "text-gray-300" :
                      "text-amber-400"
                    )}>
                      {record.status === 'won' ? '已中' : record.status === 'lost' ? '未中' : '待开'}
                    </span>
                  </div>

                  {/* Match name */}
                  <div className="font-semibold text-[15px] text-gray-800 tracking-tight">{record.match}</div>
                  <div className="text-[12px] text-gray-400 mt-0.5">{record.play} · {record.odds.toFixed(2)}</div>

                  {/* Bottom row */}
                  <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-gray-100/50">
                    <span className="text-[12px] text-gray-300">
                      投入 <span className="text-gray-500 font-medium">{record.amount}</span>
                    </span>
                    <span className={cn(
                      "text-[16px] font-bold tracking-tight",
                      record.status === 'won' ? "text-emerald-500" :
                      record.status === 'lost' ? "text-gray-300" :
                      "text-amber-400"
                    )}>
                      {record.status === 'won' ? `+${(record.prize - record.amount).toFixed(0)}` :
                       record.status === 'lost' ? `-${record.amount}` :
                       `${(record.amount * record.odds).toFixed(0)}`}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-20">
                <div className="text-[14px] font-medium text-gray-300">暂无记录</div>
                <div className="text-[12px] text-gray-200 mt-1.5">调整筛选条件试试</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ FAB — Frosted Glass (no solid green) ═══ */}
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => navigate('/add-bet')}
        className="absolute bottom-24 right-5 w-[52px] h-[52px] rounded-2xl bg-white/70 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.06)] flex items-center justify-center z-30 hover:border-emerald-500/20 transition-all duration-500"
      >
        <Plus size={22} strokeWidth={2} className="text-emerald-500" />
      </motion.button>
    </div>
  );
}
