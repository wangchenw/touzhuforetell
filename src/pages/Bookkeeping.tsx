import { useState, useRef, useCallback } from 'react';
import { Plus, Settings, Filter, Trophy, CheckCircle2, XCircle, Timer, TrendingUp, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

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

// ── Interactive Sparkline with touch/mouse drag ──
function ProfitSparkline({ data, height = 130 }: { data: { date: string; value: number }[]; height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  if (data.length < 2) return null;

  const width = 320; // SVG viewBox width, scales responsively
  const values = data.map(d => d.value);
  const minV = Math.min(...values, 0);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;
  const padTop = 30;
  const padBottom = 22;
  const padX = 12;
  const innerW = width - padX * 2;
  const innerH = height - padTop - padBottom;

  const points = data.map((d, i) => ({
    x: padX + (i / (data.length - 1)) * innerW,
    y: padTop + innerH - ((d.value - minV) / range) * innerH,
  }));

  // Smooth curve
  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x},${p.y}`;
    const prev = points[i - 1];
    const cpx = (prev.x + p.x) / 2;
    return acc + ` C ${cpx},${prev.y} ${cpx},${p.y} ${p.x},${p.y}`;
  }, '');

  const areaD = pathD + ` L ${points[points.length - 1].x},${height - padBottom} L ${points[0].x},${height - padBottom} Z`;
  const zeroY = padTop + innerH - ((0 - minV) / range) * innerH;
  const lastValue = data[data.length - 1].value;
  const lineColor = lastValue >= 0 ? '#10b981' : '#ef4444';

  // Resolve which data index the pointer is closest to
  const resolveIndex = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const relX = (clientX - rect.left) / rect.width; // 0..1
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
    // Keep the selected point visible for a moment, then hide
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
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.22" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0.25, 0.5, 0.75].map(pct => {
          const gy = padTop + innerH * (1 - pct);
          return <line key={pct} x1={padX} y1={gy} x2={width - padX} y2={gy} stroke="#f3f4f6" strokeWidth="0.8" />;
        })}

        {/* Zero baseline */}
        <line x1={padX} y1={zeroY} x2={width - padX} y2={zeroY} stroke="#d1d5db" strokeWidth="1" strokeDasharray="4 3" />
        <text x={padX - 1} y={zeroY - 4} fill="#d1d5db" fontSize="8" fontWeight="500">0</text>

        {/* Area fill */}
        <path d={areaD} fill="url(#sparkGrad)" />

        {/* Curve line */}
        <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Static dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={activeIdx === i ? 0 : (i === points.length - 1 ? 3.5 : 2)}
            fill={lineColor}
            opacity={i === points.length - 1 ? 1 : 0.35}
          />
        ))}

        {/* Date labels along bottom */}
        {data.map((d, i) => (
          <text
            key={i}
            x={points[i].x}
            y={height - 4}
            textAnchor="middle"
            fill={activeIdx === i ? '#111827' : '#d1d5db'}
            fontSize="8"
            fontWeight={activeIdx === i ? '700' : '400'}
            fontFamily="sans-serif"
          >
            {d.date}
          </text>
        ))}

        {/* ── Active crosshair + tooltip ── */}
        {activePoint && activeData && (
          <>
            {/* Vertical crosshair line */}
            <line
              x1={activePoint.x}
              y1={padTop - 4}
              x2={activePoint.x}
              y2={height - padBottom}
              stroke={lineColor}
              strokeWidth="1"
              strokeDasharray="3 2"
              opacity="0.5"
            />
            {/* Horizontal crosshair line */}
            <line
              x1={padX}
              y1={activePoint.y}
              x2={width - padX}
              y2={activePoint.y}
              stroke={lineColor}
              strokeWidth="0.8"
              strokeDasharray="3 2"
              opacity="0.3"
            />
            {/* Outer glow ring */}
            <circle cx={activePoint.x} cy={activePoint.y} r="10" fill={lineColor} opacity="0.12" />
            {/* Active dot */}
            <circle cx={activePoint.x} cy={activePoint.y} r="5" fill="white" stroke={lineColor} strokeWidth="2.5" />
            {/* Tooltip bubble */}
            {(() => {
              const tooltipW = 80;
              const tooltipH = 36;
              // Flip tooltip direction if near edge
              let tx = activePoint.x - tooltipW / 2;
              if (tx < 4) tx = 4;
              if (tx + tooltipW > width - 4) tx = width - 4 - tooltipW;
              const ty = activePoint.y - tooltipH - 14;
              const tyFinal = ty < 2 ? activePoint.y + 16 : ty;

              return (
                <>
                  <rect x={tx} y={tyFinal} width={tooltipW} height={tooltipH} rx="10" fill="#111827" opacity="0.92" />
                  {/* Small arrow */}
                  {ty >= 2 && (
                    <polygon
                      points={`${activePoint.x - 4},${tyFinal + tooltipH} ${activePoint.x + 4},${tyFinal + tooltipH} ${activePoint.x},${tyFinal + tooltipH + 5}`}
                      fill="#111827"
                      opacity="0.92"
                    />
                  )}
                  <text x={tx + tooltipW / 2} y={tyFinal + 14} textAnchor="middle" fill="#9ca3af" fontSize="8" fontWeight="500">
                    {activeData.date}
                  </text>
                  <text x={tx + tooltipW / 2} y={tyFinal + 28} textAnchor="middle" fill="white" fontSize="13" fontWeight="800">
                    {activeData.value >= 0 ? '+' : ''}{activeData.value}
                  </text>
                </>
              );
            })()}
          </>
        )}

        {/* Default end-point label when not dragging */}
        {activeIdx === null && (() => {
          const lp = points[points.length - 1];
          const lv = data[data.length - 1].value;
          let rx = lp.x - 24;
          if (rx + 52 > width - 4) rx = width - 56;
          return (
            <>
              <rect x={rx} y={lp.y - 22} width="52" height="18" rx="9" fill={lineColor} />
              <text x={rx + 26} y={lp.y - 10} textAnchor="middle" fill="white" fontSize="10" fontWeight="700">
                {lv >= 0 ? '+' : ''}{lv}
              </text>
            </>
          );
        })()}
      </svg>

      {/* Drag hint */}
      {!isDragging && activeIdx === null && (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none">
          <span className="text-[10px] text-gray-300 font-medium flex items-center gap-1">
            ← 拖动查看详情 →
          </span>
        </div>
      )}
    </div>
  );
}

// ── Win Rate Ring (胜率环形图) ──
function WinRateRing({ winRate, size = 68 }: { winRate: number; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (winRate / 100) * circ;
  const center = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={center} cy={center} r={r} fill="none" stroke="#f3f4f6" strokeWidth="6" />
      <circle
        cx={center} cy={center} r={r} fill="none"
        stroke="#10b981" strokeWidth="6" strokeLinecap="round"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeDashoffset={circ * 0.25}
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
      <text x={center} y={center - 4} textAnchor="middle" fill="#111827" fontSize="15" fontWeight="800">{winRate}%</text>
      <text x={center} y={center + 10} textAnchor="middle" fill="#9ca3af" fontSize="8" fontWeight="500">胜率</text>
    </svg>
  );
}

// ── Sport Distribution Bars (运动分布) ──
function SportBars({ football, basketball }: { football: number; basketball: number }) {
  const total = football + basketball || 1;
  const fPct = Math.round((football / total) * 100);
  const bPct = 100 - fPct;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-gray-500 w-8 shrink-0">⚽</span>
        <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${fPct}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"
          />
        </div>
        <span className="text-[11px] text-gray-700 font-bold w-8 text-right">{football}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-gray-500 w-8 shrink-0">🏀</span>
        <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${bPct}%` }}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
            className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"
          />
        </div>
        <span className="text-[11px] text-gray-700 font-bold w-8 text-right">{basketball}</span>
      </div>
    </div>
  );
}

// ── Main Page ──
export default function Bookkeeping() {
  const navigate = useNavigate();
  const [sportFilter, setSportFilter] = useState<SportFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  const records: BetRecord[] = [
    { id: 1, sport: 'football', league: '英超', match: '曼联 vs 阿森纳', play: '胜平负 - 主胜', odds: 2.10, amount: 500, status: 'won', prize: 1050, date: '03-28', time: '20:00' },
    { id: 2, sport: 'basketball', league: 'NBA', match: '湖人 vs 勇士', play: '让分 - 湖人+5.5', odds: 1.85, amount: 300, status: 'lost', prize: 0, date: '03-27', time: '10:30' },
    { id: 3, sport: 'football', league: '西甲', match: '皇马 vs 巴萨', play: '比分 - 2:1', odds: 8.50, amount: 100, status: 'pending', prize: 0, date: '03-29', time: '03:00' },
    { id: 4, sport: 'football', league: '欧冠', match: '拜仁 vs 巴黎', play: '大小球 - 大2.5', odds: 1.72, amount: 800, status: 'won', prize: 1376, date: '03-26', time: '04:00' },
    { id: 5, sport: 'basketball', league: 'CBA', match: '广东 vs 辽宁', play: '胜负 - 主胜', odds: 1.55, amount: 400, status: 'won', prize: 620, date: '03-26', time: '19:35' },
    { id: 6, sport: 'football', league: '意甲', match: '国米 vs 尤文', play: '让球 - 主-1', odds: 2.25, amount: 200, status: 'lost', prize: 0, date: '03-25', time: '03:45' },
    { id: 7, sport: 'basketball', league: 'NBA', match: '凯尔特人 vs 雷霆', play: '总分 - 大220.5', odds: 1.90, amount: 350, status: 'pending', prize: 0, date: '03-29', time: '08:00' },
    { id: 8, sport: 'football', league: '英超', match: '利物浦 vs 切尔西', play: '半全场 - 主/主', odds: 3.20, amount: 150, status: 'lost', prize: 0, date: '03-24', time: '23:30' },
  ];

  // ── Computed Stats ──
  const filtered = records
    .filter(r => sportFilter === 'all' || r.sport === sportFilter)
    .filter(r => statusFilter === 'all' || r.status === statusFilter);

  const totalProfit = records.reduce((sum, r) => {
    if (r.status === 'won') return sum + (r.prize - r.amount);
    if (r.status === 'lost') return sum - r.amount;
    return sum;
  }, 0);

  const wonCount = records.filter(r => r.status === 'won').length;
  const settledCount = records.filter(r => r.status !== 'pending').length;
  const winRate = settledCount > 0 ? Math.round((wonCount / settledCount) * 100) : 0;
  const pendingAmount = records.filter(r => r.status === 'pending').reduce((s, r) => s + r.amount, 0);

  const footballCount = records.filter(r => r.sport === 'football').length;
  const basketballCount = records.filter(r => r.sport === 'basketball').length;

  // ── Profit Curve Data (cumulative by date) ──
  const profitCurve = (() => {
    const settled = records
      .filter(r => r.status !== 'pending')
      .sort((a, b) => a.date.localeCompare(b.date));
    let cum = 0;
    const map = new Map<string, number>();
    // seed a starting zero point
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

  const statusIcon = (status: string) => {
    if (status === 'won') return <CheckCircle2 size={14} className="text-emerald-500" />;
    if (status === 'lost') return <XCircle size={14} className="text-gray-400" />;
    return <Timer size={14} className="text-amber-500" />;
  };

  const statusLabel = (status: string) => {
    if (status === 'won') return '已中';
    if (status === 'lost') return '未中';
    return '待开';
  };

  return (
    <div className="flex flex-col h-full bg-[#F7F8FA] relative">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md px-5 py-3 flex justify-between items-center sticky top-0 z-20 shadow-[0_2px_10px_rgba(0,0,0,0.02)] shrink-0">
        <h1 className="text-xl font-bold text-gray-900">我的投注</h1>
        <button onClick={() => navigate('/profile')} className="p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100">
          <Settings size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 pb-24">

        {/* ═══════ Stats Hero Card ═══════ */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-5 text-white shadow-lg shadow-emerald-200/40"
        >
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-teal-900/15 rounded-full blur-xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[13px] font-medium opacity-90 flex items-center gap-1.5">
                <Activity size={14} />
                累计盈亏
              </span>
              <span className="text-[11px] bg-white/20 px-2.5 py-0.5 rounded-full">本月</span>
            </div>
            <div className="text-[36px] font-black tracking-tight leading-tight">
              {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(0)}
              <span className="text-[14px] font-medium opacity-70 ml-1">元</span>
            </div>
            <div className="flex justify-between items-center bg-black/10 rounded-2xl p-3 mt-4 backdrop-blur-sm">
              <div className="flex-1 text-center">
                <div className="text-[10px] opacity-70 mb-0.5">胜率</div>
                <div className="font-bold text-[16px]">{winRate}%</div>
              </div>
              <div className="w-px h-7 bg-white/20" />
              <div className="flex-1 text-center">
                <div className="text-[10px] opacity-70 mb-0.5">总单数</div>
                <div className="font-bold text-[16px]">{records.length}单</div>
              </div>
              <div className="w-px h-7 bg-white/20" />
              <div className="flex-1 text-center">
                <div className="text-[10px] opacity-70 mb-0.5">待开奖</div>
                <div className="font-bold text-[16px]">{pendingAmount}</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ═══════ Profit Trend Chart ═══════ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/50"
        >
          <div className="flex items-center justify-between mb-2 px-0.5">
            <h3 className="text-[13px] font-bold text-gray-800 flex items-center gap-1.5">
              <TrendingUp size={14} className="text-emerald-500" />
              盈亏走势
            </h3>
            <span className="text-[10px] text-gray-400 font-medium">近7日</span>
          </div>
          <ProfitSparkline data={profitCurve} height={140} />
        </motion.div>

        {/* ═══════ Win Rate + Sport Distribution ═══════ */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="grid grid-cols-2 gap-3"
        >
          {/* Win Rate Ring */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/50 flex flex-col items-center justify-center">
            <WinRateRing winRate={winRate} size={72} />
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-gray-500">{wonCount}胜</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-300" />
                <span className="text-[10px] text-gray-500">{settledCount - wonCount}负</span>
              </div>
            </div>
          </div>
          {/* Sport Distribution */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100/50 flex flex-col justify-center">
            <h3 className="text-[11px] font-semibold text-gray-500 mb-3">投注分布</h3>
            <SportBars football={footballCount} basketball={basketballCount} />
            <div className="text-[10px] text-gray-400 mt-2.5 text-center">共 {records.length} 注</div>
          </div>
        </motion.div>

        {/* ═══════ Filter Bar ═══════ */}
        <div className="flex items-center justify-between">
          <div className="flex bg-gray-200/50 p-1 rounded-xl flex-1 mr-3">
            {(['all', 'football', 'basketball'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSportFilter(tab)}
                className={cn(
                  "flex-1 py-1.5 text-[13px] font-medium rounded-lg transition-all duration-300",
                  sportFilter === tab
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500"
                )}
              >
                {tab === 'all' ? '全部' : tab === 'football' ? '足球' : '篮球'}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-xl text-[13px] font-medium border transition-all",
              showFilters ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200"
            )}
          >
            <Filter size={14} />
            筛选
          </button>
        </div>

        {/* Status Filter (collapsible) */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 pb-1">
                {([
                  { key: 'all', label: '全部状态' },
                  { key: 'won', label: '已中奖' },
                  { key: 'lost', label: '未中奖' },
                  { key: 'pending', label: '待开奖' },
                ] as const).map(s => (
                  <button
                    key={s.key}
                    onClick={() => setStatusFilter(s.key)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[12px] font-medium border transition-all",
                      statusFilter === s.key
                        ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                        : "bg-white border-gray-200 text-gray-500"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Records Header */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[13px] font-bold text-gray-800">投注记录</span>
          <span className="text-[11px] text-gray-400">共 {filtered.length} 条 · 按时间倒序</span>
        </div>

        {/* ═══════ Bet Records List ═══════ */}
        <div className="space-y-2.5">
          {filtered.map((record, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              key={record.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden"
            >
              {/* Top Row */}
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                    {record.sport === 'football' ? '⚽' : '🏀'} {record.league}
                  </span>
                  <span className="text-[11px] text-gray-400">{record.date} {record.time}</span>
                </div>
                <div className="flex items-center gap-1">
                  {statusIcon(record.status)}
                  <span className={cn(
                    "text-[11px] font-semibold",
                    record.status === 'won' ? "text-emerald-600" : record.status === 'lost' ? "text-gray-400" : "text-amber-500"
                  )}>
                    {statusLabel(record.status)}
                  </span>
                </div>
              </div>

              {/* Match + Play */}
              <div className="px-4 py-2">
                <div className="font-bold text-[15px] text-gray-900">{record.match}</div>
                <div className="text-[13px] text-gray-500 mt-0.5">{record.play} · 赔率 {record.odds.toFixed(2)}</div>
              </div>

              {/* Bottom Row */}
              <div className={cn(
                "flex items-center justify-between px-4 py-2.5 border-t",
                record.status === 'won' ? "bg-emerald-50/50 border-emerald-100/50" :
                record.status === 'lost' ? "bg-gray-50/50 border-gray-100/50" :
                "bg-amber-50/30 border-amber-100/30"
              )}>
                <span className="text-[13px] text-gray-500">投入 <span className="font-semibold text-gray-700">{record.amount}</span></span>
                <span className={cn(
                  "text-[15px] font-bold",
                  record.status === 'won' ? "text-emerald-600" : record.status === 'lost' ? "text-gray-400" : "text-amber-500"
                )}>
                  {record.status === 'won' ? `+${(record.prize - record.amount).toFixed(0)}` :
                   record.status === 'lost' ? `-${record.amount}` :
                   `待开 ${(record.amount * record.odds).toFixed(0)}`}
                </span>
              </div>
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <Trophy size={40} className="mx-auto mb-3 opacity-30" />
              <div className="text-[15px] font-medium">暂无符合条件的投注记录</div>
              <div className="text-[13px] mt-1">试试调整筛选条件</div>
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/add-bet')}
        className="absolute bottom-6 right-5 w-14 h-14 bg-emerald-500 text-white rounded-full shadow-[0_8px_20px_rgba(16,185,129,0.3)] flex items-center justify-center z-30"
      >
        <Plus size={28} strokeWidth={2.5} />
      </motion.button>
    </div>
  );
}
