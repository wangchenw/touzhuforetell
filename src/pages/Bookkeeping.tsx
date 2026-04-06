import { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, Settings, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { formatPassType } from '@/lib/ticket-display';
import { getTicket, listTickets } from '@/lib/api';
import type { Sport, TicketLeg, TicketListItem, TicketRecord, TicketType } from '@/lib/api';

type SportFilter = 'all' | Sport;
type TicketTypeFilter = 'all' | TicketType;

interface DashboardStats {
  totalStake: number;
  totalMaxPayout: number;
  totalTickets: number;
  avgLegCount: number;
  parlayRate: number;
  singleCount: number;
  parlayCount: number;
  curve: { date: string; value: number }[];
}

function parseAmount(value: string) {
  const amount = Number.parseFloat(value);
  return Number.isNaN(amount) ? 0 : amount;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hours}:${minutes}`;
}

function formatSport(sport: Sport) {
  return sport === 'football' ? '足球' : '篮球';
}

function formatTicketType(ticketType: TicketType) {
  return ticketType === 'single' ? '单关' : '串关';
}

function extractTeams(match?: string | null): string[] {
  if (typeof match !== 'string' || !match.trim()) {
    return [];
  }

  const sanitized = match
    .replace(/主队[:：]/g, '')
    .replace(/客队[:：]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  const parts = sanitized.split(/\s+v(?:s)?\s+/i).map((part) => part.trim()).filter(Boolean);
  return parts.length > 0 ? parts : [sanitized];
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value?.trim())).map((value) => value.trim())));
}

function buildTeamSummary(legs: TicketLeg[]): string {
  const teams = uniqueStrings(legs.flatMap((leg) => extractTeams(leg.match)));
  if (teams.length === 0) {
    return '赛事摘要加载中';
  }

  return `${teams.slice(0, 3).join(' ')}${teams.length > 3 ? ` +${teams.length - 3}` : ''}`;
}

function buildLeagueSummary(legs: TicketLeg[]): string {
  const leagues = uniqueStrings(legs.map((leg) => leg.league));
  if (leagues.length === 0) {
    return '';
  }

  return `${leagues.slice(0, 3).join(' · ')}${leagues.length > 3 ? ` +${leagues.length - 3}` : ''}`;
}

function buildStats(records: TicketListItem[]): DashboardStats {
  const totalStake = records.reduce((sum, record) => sum + parseAmount(record.amount), 0);
  const totalMaxPayout = records.reduce((sum, record) => sum + record.maxPayout, 0);
  const totalTickets = records.length;
  const totalLegCount = records.reduce((sum, record) => sum + record.legCount, 0);
  const singleCount = records.filter((record) => record.ticketType === 'single').length;
  const parlayCount = records.filter((record) => record.ticketType === 'parlay').length;
  const avgLegCount = totalTickets === 0 ? 0 : totalLegCount / totalTickets;
  const parlayRate = totalTickets === 0 ? 0 : Math.round((parlayCount / totalTickets) * 100);

  const curve = records
    .slice()
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .reduce<{ date: string; value: number }[]>((points, record) => {
      const lastValue = points.at(-1)?.value ?? 0;
      const date = formatDateTime(record.createdAt).slice(0, 5);
      points.push({
        date,
        value: Number((lastValue + record.maxPayout).toFixed(2)),
      });
      return points;
    }, []);

  return {
    totalStake,
    totalMaxPayout,
    totalTickets,
    avgLegCount,
    parlayRate,
    singleCount,
    parlayCount,
    curve,
  };
}

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

function FluidSparkline({ data, height = 120 }: { data: { date: string; value: number }[]; height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  if (data.length < 2) return null;

  const width = 320;
  const values = data.map((item) => item.value);
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;
  const padTop = 24;
  const padBottom = 24;
  const padX = 16;
  const innerWidth = width - padX * 2;
  const innerHeight = height - padTop - padBottom;

  const points = data.map((item, index) => ({
    x: padX + (index / (data.length - 1)) * innerWidth,
    y: padTop + innerHeight - ((item.value - minValue) / range) * innerHeight,
  }));

  const path = points.reduce((accumulator, point, index) => {
    if (index === 0) return `M ${point.x},${point.y}`;
    const previous = points[index - 1];
    const controlX = (previous.x + point.x) / 2;
    return `${accumulator} C ${controlX},${previous.y} ${controlX},${point.y} ${point.x},${point.y}`;
  }, '');

  const areaPath = `${path} L ${points[points.length - 1].x},${height - padBottom} L ${points[0].x},${height - padBottom} Z`;
  const lastPoint = points[points.length - 1];

  const resolveIndex = useCallback((clientX: number) => {
    const element = containerRef.current;
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    const relativeX = (clientX - rect.left) / rect.width;
    const index = Math.round(relativeX * (data.length - 1));
    return Math.max(0, Math.min(data.length - 1, index));
  }, [data.length]);

  const activePoint = activeIdx !== null ? points[activeIdx] : null;
  const activeData = activeIdx !== null ? data[activeIdx] : null;

  return (
    <div
      ref={containerRef}
      className="relative select-none touch-none"
      onPointerDown={(event) => {
        setIsDragging(true);
        setActiveIdx(resolveIndex(event.clientX));
        (event.target as HTMLElement).setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!isDragging) return;
        setActiveIdx(resolveIndex(event.clientX));
      }}
      onPointerUp={() => {
        setIsDragging(false);
        setTimeout(() => setActiveIdx(null), 1500);
      }}
      onPointerLeave={() => {
        if (!isDragging) setActiveIdx(null);
      }}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
        <defs>
          <linearGradient id="ticketSparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((ratio) => {
          const guideY = padTop + innerHeight * (1 - ratio);
          return (
            <line
              key={ratio}
              x1={padX}
              y1={guideY}
              x2={width - padX}
              y2={guideY}
              stroke="#e5e7eb"
              strokeWidth="0.4"
              strokeOpacity="0.5"
            />
          );
        })}

        <motion.path
          d={areaPath}
          fill="url(#ticketSparkGrad)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.3 }}
        />

        <motion.path
          d={path}
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease: 'easeInOut' }}
        />

        {data.map((item, index) => (
          <text
            key={`${item.date}-${index}`}
            x={points[index].x}
            y={height - 4}
            textAnchor="middle"
            fill={activeIdx === index ? '#374151' : '#d1d5db'}
            fontSize="8"
            fontWeight={activeIdx === index ? '600' : '400'}
            letterSpacing="0.02em"
          >
            {item.date}
          </text>
        ))}

        {activePoint && activeData ? (
          <>
            <line
              x1={activePoint.x}
              y1={padTop}
              x2={activePoint.x}
              y2={height - padBottom}
              stroke="#10b981"
              strokeWidth="0.8"
              strokeDasharray="3 3"
              opacity="0.25"
            />
            <circle cx={activePoint.x} cy={activePoint.y} r="12" fill="#10b981" opacity="0.06" />
            <circle cx={activePoint.x} cy={activePoint.y} r="5" fill="white" stroke="#10b981" strokeWidth="1.5" />
          </>
        ) : (
          <>
            <circle cx={lastPoint.x} cy={lastPoint.y} r="10" fill="#10b981" opacity="0.08" />
            <circle cx={lastPoint.x} cy={lastPoint.y} r="4" fill="white" stroke="#10b981" strokeWidth="1.5" />
          </>
        )}
      </svg>

      {!isDragging && activeIdx === null && (
        <div className="absolute bottom-7 left-0 right-0 flex justify-center pointer-events-none">
          <span className="text-[11px] text-gray-400/80 font-medium tracking-widest">← 拖动查看 →</span>
        </div>
      )}
    </div>
  );
}

function MinimalistDonut({ value, size = 80 }: { value: number; size?: number }) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (value / 100) * circumference;
  const center = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={center} cy={center} r={radius} fill="none" stroke="#f3f4f6" strokeWidth="2" />
      <motion.circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#10b981"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference - filled}`}
        strokeDashoffset={circumference * 0.25}
        initial={{ strokeDasharray: `0 ${circumference}` }}
        animate={{ strokeDasharray: `${filled} ${circumference - filled}` }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
      />
      <text x={center} y={center - 1} textAnchor="middle" fill="#111827" fontSize="16" fontWeight="700" letterSpacing="-0.03em">
        {value}%
      </text>
      <text x={center} y={center + 13} textAnchor="middle" fill="#c9cdd4" fontSize="8" fontWeight="500" letterSpacing="0.08em">
        串关占比
      </text>
    </svg>
  );
}

export default function Bookkeeping() {
  const navigate = useNavigate();
  const [sportTab, setSportTab] = useState<SportFilter>('all');
  const [ticketTypeFilter, setTicketTypeFilter] = useState<TicketTypeFilter>('all');
  const [records, setRecords] = useState<TicketListItem[]>([]);
  const [ticketDetails, setTicketDetails] = useState<Record<number, TicketRecord>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    (async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await listTickets({ page: 1, pageSize: 100 });
        if (!isActive) return;
        setRecords(response.records);
        setTicketDetails({});

        const detailEntries = await Promise.all(
          response.records.map(async (record) => {
            try {
              const detail = await getTicket(record.id);
              return [record.id, detail] as const;
            } catch {
              return null;
            }
          }),
        );

        if (!isActive) return;
        setTicketDetails(
          Object.fromEntries(
            detailEntries.filter((entry): entry is readonly [number, TicketRecord] => Boolean(entry)),
          ),
        );
      } catch (error) {
        if (!isActive) return;
        setRecords([]);
        setTicketDetails({});
        setLoadError(error instanceof Error ? error.message : '加载失败，请稍后重试');
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, []);

  const sportRecords = sportTab === 'all'
    ? records
    : records.filter((record) => record.sport === sportTab);
  const filteredRecords = ticketTypeFilter === 'all'
    ? sportRecords
    : sportRecords.filter((record) => record.ticketType === ticketTypeFilter);
  const stats = buildStats(sportRecords);
  const footballCount = records.filter((record) => record.sport === 'football').length;
  const basketballCount = records.filter((record) => record.sport === 'basketball').length;

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-[#FAFBFC]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="aurora-1 absolute -top-20 -left-20 w-72 h-72 rounded-full bg-gradient-to-br from-emerald-200/30 via-teal-100/20 to-transparent blur-3xl" />
        <div className="aurora-2 absolute top-40 -right-16 w-64 h-64 rounded-full bg-gradient-to-bl from-blue-200/20 via-indigo-100/15 to-transparent blur-3xl" />
      </div>

      <header className="relative z-10 px-6 pt-4 pb-2 flex justify-between items-center shrink-0">
        <h1 className="text-[22px] font-bold text-gray-900 tracking-tight">票据</h1>
        <button
          onClick={() => navigate('/profile')}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/60 backdrop-blur-xl border border-white/30 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <Settings size={17} strokeWidth={1.8} />
        </button>
      </header>

      <div className="relative z-10 px-6 pt-1 pb-3 shrink-0">
        <div className="flex gap-1.5">
          {([
            { key: 'all' as const, label: '全部' },
            { key: 'football' as const, label: '足球' },
            { key: 'basketball' as const, label: '篮球' },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setSportTab(tab.key);
                setTicketTypeFilter('all');
              }}
              className={cn(
                'px-4 py-1.5 rounded-full text-[13px] font-medium transition-all duration-400 border',
                sportTab === tab.key
                  ? 'bg-white/70 backdrop-blur-xl border-white/40 text-gray-900 shadow-sm shadow-gray-200/30'
                  : 'bg-transparent border-transparent text-gray-500 hover:text-gray-600',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 pb-28">
        <div className="px-5 space-y-5">
          {loadError && (
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-[12px] text-amber-700">
              {loadError}
            </div>
          )}

          <motion.div
            key={`${sportTab}-hero`}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative rounded-3xl bg-white/60 backdrop-blur-2xl border border-white/30 shadow-[0_8px_40px_rgba(0,0,0,0.04)] p-6 overflow-hidden"
          >
            <div className="absolute inset-0 rounded-3xl border border-white/5 pointer-events-none" />
            <div className="absolute top-8 left-4 w-36 h-20 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-1">
                <span className="text-[13px] font-semibold text-gray-500 tracking-widest uppercase">
                  {sportTab === 'all' ? '累计最高可中' : `${formatSport(sportTab)}最高可中`}
                </span>
                <span className="text-[14px] text-gray-400 font-medium tracking-wide">票据汇总</span>
              </div>

              <div className="mt-3 mb-8">
                <TextReveal
                  key={`${sportTab}-max-payout`}
                  text={formatCurrency(stats.totalMaxPayout)}
                  className="text-[48px] font-black tracking-tighter leading-none text-emerald-400"
                />
                <span className="text-[15px] font-medium text-gray-400 ml-1.5 tracking-wide">元</span>
              </div>

              <div className="flex items-center">
                <div className="flex-1">
                  <div className="text-[14px] text-gray-500 font-medium tracking-widest mb-1">票数</div>
                  <div className="text-[18px] font-bold text-gray-800 tracking-tight">
                    {stats.totalTickets}<span className="text-[11px] text-gray-400 ml-0.5">张</span>
                  </div>
                </div>
                <div className="w-px h-8 bg-gray-200/70" />
                <div className="flex-1 pl-5">
                  <div className="text-[14px] text-gray-500 font-medium tracking-widest mb-1">总投入</div>
                  <div className="text-[18px] font-bold text-gray-800 tracking-tight">
                    {formatCurrency(stats.totalStake)}<span className="text-[11px] text-gray-400 ml-0.5">元</span>
                  </div>
                </div>
                <div className="w-px h-8 bg-gray-200/70" />
                <div className="flex-1 pl-5">
                  <div className="text-[14px] text-gray-500 font-medium tracking-widest mb-1">平均场次</div>
                  <div className="text-[18px] font-bold text-gray-800 tracking-tight">
                    {stats.avgLegCount.toFixed(1)}<span className="text-[11px] text-gray-400 ml-0.5">场</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            key={`${sportTab}-chart`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="rounded-3xl bg-white/60 backdrop-blur-2xl border border-white/30 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[14px] font-bold text-gray-700 tracking-wide flex items-center gap-1.5">
                <TrendingUp size={13} className="text-emerald-500/70" />
                最高可中走势
              </span>
              <span className="text-[14px] text-gray-400 font-medium tracking-wide">累计</span>
            </div>
            {stats.curve.length >= 2 ? (
              <FluidSparkline data={stats.curve} height={120} />
            ) : (
              <div className="h-[120px] flex items-center justify-center text-[12px] text-gray-400">
                {isLoading ? '走势加载中...' : '暂无足够的票据数据'}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.5 }}
            className="grid grid-cols-2 gap-3"
          >
            <div className="rounded-3xl bg-white/60 backdrop-blur-2xl border border-white/30 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-5 flex flex-col items-center justify-center">
              <MinimalistDonut value={stats.parlayRate} size={80} />
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[12px] text-gray-600">{stats.parlayCount} 串</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                  <span className="text-[12px] text-gray-600">{stats.singleCount} 单</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white/60 backdrop-blur-2xl border border-white/30 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-center">
              <span className="text-[14px] text-gray-500 font-medium tracking-widest mb-4">运动分布</span>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[13px] text-gray-600 font-medium">足球</span>
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
                    <span className="text-[13px] text-gray-600 font-medium">篮球</span>
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

          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {([
              { key: 'all' as const, label: '全部' },
              { key: 'single' as const, label: '单关' },
              { key: 'parlay' as const, label: '串关' },
            ]).map((option) => (
              <button
                key={option.key}
                onClick={() => setTicketTypeFilter(option.key)}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all duration-300 whitespace-nowrap border',
                  ticketTypeFilter === option.key
                    ? 'bg-white/80 backdrop-blur-xl border-emerald-500/20 text-gray-800 shadow-sm'
                    : 'bg-transparent border-transparent text-gray-500',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between px-0.5">
            <span className="text-[14px] font-bold text-gray-700 tracking-wide">票据记录</span>
            <span className="text-[14px] text-gray-600">{filteredRecords.length} 条</span>
          </div>

          <div className="space-y-2">
            {filteredRecords.map((record, index) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index, duration: 0.4 }}
                key={record.id}
                className="rounded-2xl bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_2px_16px_rgba(0,0,0,0.02)] hover:border-emerald-500/10 transition-all duration-500 overflow-hidden"
              >
                {(() => {
                  const detail = ticketDetails[record.id];
                  const legs = detail?.recognized.legs ?? [];
                  const teamSummary = legs.length > 0 ? buildTeamSummary(legs) : '赛事摘要加载中...';
                  const leagueSummary = legs.length > 0 ? buildLeagueSummary(legs) : '';

                  return (
                    <div className="p-3.5">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100/60 text-gray-500 font-medium tracking-wide shrink-0">
                            {formatSport(record.sport)}
                          </span>
                          <span className="text-[12px] text-gray-500 truncate">{formatDateTime(record.createdAt)}</span>
                        </div>
                        <span className={cn(
                          'text-[10px] font-semibold tracking-wide shrink-0',
                          record.ticketType === 'parlay' ? 'text-emerald-500' : 'text-sky-500',
                        )}>
                          {formatTicketType(record.ticketType)}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-[16px] font-semibold text-gray-800 tracking-tight truncate">
                            {teamSummary}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[12px] text-gray-500 min-w-0">
                            <span className="shrink-0">{formatPassType(record.passType, record.legCount, record.ticketType)}</span>
                            {leagueSummary && (
                              <>
                                <span className="text-gray-300 shrink-0">·</span>
                                <span className="truncate">{leagueSummary}</span>
                              </>
                            )}
                          </div>
                          <div className="mt-1.5 text-[12px] text-gray-400">
                            {record.legCount} 场 · 票面 ¥{formatCurrency(parseAmount(record.amount))}
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-2">
                          <div className="text-[22px] leading-none font-bold tracking-[-0.03em] text-emerald-500 [font-variant-numeric:tabular-nums]">
                            ¥{formatCurrency(record.maxPayout)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            ))}

            {!isLoading && filteredRecords.length === 0 && (
              <div className="text-center py-20">
                <div className="text-[14px] font-medium text-gray-300">暂无票据</div>
                <div className="text-[12px] text-gray-200 mt-1.5">先去上传一张彩票试试</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => navigate('/record-bet')}
        className="absolute bottom-24 right-5 w-[52px] h-[52px] rounded-2xl bg-white/70 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.06)] flex items-center justify-center z-30 hover:border-emerald-500/20 transition-all duration-500"
      >
        <Plus size={22} strokeWidth={2} className="text-emerald-500" />
      </motion.button>
    </div>
  );
}
