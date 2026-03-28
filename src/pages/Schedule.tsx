import { useState, useRef, useEffect } from 'react';
import { Settings, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { cn } from '@/lib/utils';

type LeagueFilter = 'all' | 'premier' | 'laliga' | 'seriea' | 'ucl' | 'nba' | 'cba';
type DayTab = 'yesterday' | 'today' | 'tomorrow';

interface Match {
  id: number;
  league: string;
  leagueKey: LeagueFilter;
  time: string;
  home: string;
  away: string;
  homeScore?: number;
  awayScore?: number;
  status: 'finished' | 'live' | 'upcoming';
  minute?: number;
  sport: 'football' | 'basketball';
}

// ─── Team brand colors ───
const teamColors: Record<string, [string, string]> = {
  '阿森纳': ['#EF0107', '#FFFFFF'],
  '曼城':   ['#6CABDD', '#1C2C5B'],
  '利物浦': ['#C8102E', '#F6EB61'],
  '切尔西': ['#034694', '#FFFFFF'],
  '曼联':   ['#DA291C', '#FBE122'],
  '纽卡斯尔':['#241F20', '#FFFFFF'],
  '皇马':   ['#FEBE10', '#00529F'],
  '巴萨':   ['#A50044', '#004D98'],
  '马竞':   ['#CB3524', '#272E61'],
  '毕尔巴鄂':['#EE2523', '#FFFFFF'],
  '塞维利亚':['#D4001E', '#FFFFFF'],
  '瓦伦西亚':['#EE3524', '#000000'],
  '国米':   ['#010E80', '#FCBB09'],
  '尤文图斯':['#000000', '#FFFFFF'],
  'AC米兰': ['#FB090B', '#000000'],
  '那不勒斯':['#12A0D7', '#FFFFFF'],
  '拜仁':   ['#DC052D', '#0066B2'],
  '巴黎':   ['#004170', '#DA291C'],
  '凯尔特人':['#007A33', '#FFFFFF'],
  '雷霆':   ['#007AC1', '#EF6100'],
  '湖人':   ['#552583', '#FDB927'],
  '勇士':   ['#1D428A', '#FFC72C'],
  '独行侠': ['#00538C', '#B8C4CA'],
  '太阳':   ['#E56020', '#1D1160'],
  '广东':   ['#C8102E', '#FDB927'],
  '辽宁':   ['#002D72', '#C8102E'],
};

// ─── SVG Team Logo with Glass Reflection ───
function TeamLogo({ name, size = 40 }: { name: string; size?: number }) {
  const [primary, secondary] = teamColors[name] || ['#6B7280', '#E5E7EB'];
  const initial = name.charAt(0);
  const isBasketball = ['凯尔特人','雷霆','湖人','勇士','独行侠','太阳','广东','辽宁'].includes(name);

  if (isBasketball) {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="19" fill={primary} stroke={secondary} strokeWidth="2" />
        <path d="M5 20 Q20 12, 35 20" stroke={secondary} strokeWidth="1.2" fill="none" opacity="0.5" />
        <path d="M5 20 Q20 28, 35 20" stroke={secondary} strokeWidth="1.2" fill="none" opacity="0.5" />
        <line x1="20" y1="1" x2="20" y2="39" stroke={secondary} strokeWidth="1.2" opacity="0.3" />
        <text x="20" y="24" textAnchor="middle" fill={secondary} fontSize="14" fontWeight="900" fontFamily="system-ui">{initial}</text>
        {/* Glass reflection overlay */}
        <ellipse cx="14" cy="12" rx="8" ry="5" fill="white" opacity="0.12" transform="rotate(-15 14 12)" />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 40 44" fill="none">
      <path d="M20 2 L36 8 L36 24 Q36 36, 20 42 Q4 36, 4 24 L4 8 Z" fill={primary} stroke={primary} strokeWidth="0.5" />
      <path d="M20 6 L33 11 L33 24 Q33 33, 20 39 Q7 33, 7 24 L7 11 Z" fill={secondary} opacity="0.15" />
      <rect x="18" y="2" width="4" height="40" fill={secondary} opacity="0.2" rx="1" />
      <text x="20" y="26" textAnchor="middle" fill="#FFFFFF" fontSize="14" fontWeight="900" fontFamily="system-ui">{initial}</text>
      {/* Glass reflection overlay */}
      <ellipse cx="14" cy="12" rx="8" ry="6" fill="white" opacity="0.15" transform="rotate(-20 14 12)" />
    </svg>
  );
}

// ─── League Icons — Monochrome outlines, color on hover/active ───
function LeagueIcon({ league, size = 14, active = false }: { league: string; size?: number; active?: boolean }) {
  const colorMap: Record<string, string> = {
    '英超': '#3D195B', '西甲': '#EE8707', '意甲': '#024494',
    '欧冠': '#091442', 'NBA': '#C8102E', 'CBA': '#0D6E3E',
  };
  const color = active ? (colorMap[league] || '#6B7280') : '#C9CDD4';

  if (league === 'NBA' || league === 'CBA') {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="transition-all duration-300">
        <circle cx="8" cy="8" r="7" fill={active ? color : 'transparent'} stroke={color} strokeWidth="1" />
        <path d="M3 8 Q8 4, 13 8" stroke={active ? 'white' : color} strokeWidth="0.8" fill="none" opacity="0.7" />
        <path d="M3 8 Q8 12, 13 8" stroke={active ? 'white' : color} strokeWidth="0.8" fill="none" opacity="0.7" />
        <line x1="8" y1="1" x2="8" y2="15" stroke={active ? 'white' : color} strokeWidth="0.6" opacity="0.5" />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 16 18" fill="none" className="transition-all duration-300">
      <path
        d="M8 1 L14.5 3.5 L14.5 10 Q14.5 15, 8 17 Q1.5 15, 1.5 10 L1.5 3.5 Z"
        fill={active ? color : 'transparent'}
        stroke={color}
        strokeWidth="1"
      />
      {active && league === '欧冠' && <circle cx="8" cy="9" r="2.5" fill="none" stroke="white" strokeWidth="0.8" opacity="0.9" />}
      {active && league === '欧冠' && <circle cx="8" cy="9" r="1" fill="white" opacity="0.9" />}
    </svg>
  );
}

// ─── Background Beams ───
function BackgroundBeams() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="bg-beam-1 absolute left-[20%] w-[1px] h-[50%] bg-gradient-to-b from-transparent via-emerald-400/15 to-transparent" />
      <div className="bg-beam-2 absolute left-[55%] w-[1px] h-[45%] bg-gradient-to-b from-transparent via-sky-400/10 to-transparent" />
      <div className="bg-beam-3 absolute left-[80%] w-[1px] h-[40%] bg-gradient-to-b from-transparent via-emerald-300/8 to-transparent" />
    </div>
  );
}

// ─── Segmented Day Picker with spring pill ───
function DaySegmentedControl({
  days,
  activeDay,
  onSelect,
  dayLabels,
  dayDates,
}: {
  days: DayTab[];
  activeDay: DayTab;
  onSelect: (d: DayTab) => void;
  dayLabels: Record<DayTab, string>;
  dayDates: Record<DayTab, string>;
}) {
  const activeIdx = days.indexOf(activeDay);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="relative flex bg-white/40 backdrop-blur-2xl border-[0.5px] border-white/30 rounded-2xl p-1"
    >
      {/* Sliding pill — spring animated */}
      <motion.div
        className="absolute top-1 bottom-1 rounded-[14px] bg-white/80 backdrop-blur-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border-[0.5px] border-white/50"
        initial={false}
        animate={{
          left: `calc(${(activeIdx / days.length) * 100}% + 4px)`,
          width: `calc(${100 / days.length}% - 8px)`,
        }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      />

      {days.map((day) => (
        <button
          key={day}
          onClick={() => onSelect(day)}
          className="relative z-10 flex-1 py-2 flex flex-col items-center transition-colors duration-300"
        >
          <span className={cn(
            'text-[13px] font-medium tracking-[0.06em] transition-colors duration-300',
            activeDay === day ? 'text-gray-900' : 'text-gray-400'
          )}>
            {dayLabels[day]}
          </span>
          <span className={cn(
            'text-[10px] font-medium tracking-[0.08em] transition-colors duration-300 mt-0.5 mono-time',
            activeDay === day ? 'text-gray-400' : 'text-gray-300/60'
          )}>
            {dayDates[day]}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── Hero Live Match Card ───
function HeroLiveCard({ match, onClick }: { match: Match; onClick: () => void }) {
  const [homeColor] = teamColors[match.home] || ['#6B7280'];
  const [awayColor] = teamColors[match.away] || ['#6B7280'];
  const homeWin = (match.homeScore ?? 0) > (match.awayScore ?? 0);
  const awayWin = (match.awayScore ?? 0) > (match.homeScore ?? 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={onClick}
      className="relative rounded-3xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
    >
      {/* Team color gradient background — 5% opacity */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.05] blur-2xl"
          style={{
            background: `linear-gradient(135deg, ${homeColor} 0%, transparent 50%, ${awayColor} 100%)`,
          }}
        />
      </div>

      {/* Glassmorphism card */}
      <div className="relative bg-white/55 backdrop-blur-[40px] border-[0.5px] border-white/40 rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.04)] p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <LeagueIcon league={match.league} size={13} active />
            <span className="text-[11px] font-medium text-gray-400 tracking-[0.06em]">{match.league}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2 live-pulse">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="text-[10px] font-bold text-red-500 tracking-[0.1em]">LIVE</span>
          </div>
        </div>

        {/* Teams + Score */}
        <div className="flex items-center justify-between">
          {/* Home */}
          <div className="flex flex-col items-center gap-1.5 w-[80px]">
            <div className="relative">
              <TeamLogo name={match.home} size={48} />
            </div>
            <span className={cn(
              'text-[12px] font-semibold text-center leading-tight tracking-tight',
              awayWin ? 'text-gray-300' : 'text-gray-800'
            )}>
              {match.home}
            </span>
          </div>

          {/* Score Center */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-3">
              <span className={cn(
                'text-[32px] font-black tabular-nums tracking-tighter',
                homeWin ? 'text-gray-900' : 'text-gray-400'
              )}>
                {match.homeScore}
              </span>
              <span className="text-[14px] font-light text-gray-200">:</span>
              <span className={cn(
                'text-[32px] font-black tabular-nums tracking-tighter',
                awayWin ? 'text-gray-900' : 'text-gray-400'
              )}>
                {match.awayScore}
              </span>
            </div>
            {/* Live minute with radiating glow */}
            <span className="text-[13px] font-bold text-red-500 minute-glow mono-time">
              {match.minute}'
            </span>
          </div>

          {/* Away */}
          <div className="flex flex-col items-center gap-1.5 w-[80px]">
            <div className="relative">
              <TeamLogo name={match.away} size={48} />
            </div>
            <span className={cn(
              'text-[12px] font-semibold text-center leading-tight tracking-tight',
              homeWin ? 'text-gray-300' : 'text-gray-800'
            )}>
              {match.away}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Regular Match Card (Grid style) ───
function MatchCard({ match, index, onClick }: { match: Match; index: number; onClick: () => void }) {
  const homeWin = match.status === 'finished' && (match.homeScore ?? 0) > (match.awayScore ?? 0);
  const awayWin = match.status === 'finished' && (match.awayScore ?? 0) > (match.homeScore ?? 0);
  const isUpcoming = match.status === 'upcoming';
  const isFinished = match.status === 'finished';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      onClick={onClick}
      className="group relative rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
    >
      {/* Hover border gradient — appears on interaction */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 rounded-2xl shimmer-border" />
      </div>

      <div className={cn(
        'relative bg-white/50 backdrop-blur-[40px] border-[0.5px] rounded-2xl p-4 transition-all duration-500',
        'border-white/30 group-hover:border-emerald-500/10',
        isFinished && 'opacity-70'
      )}>
        {/* League + Status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <LeagueIcon league={match.league} size={12} active={false} />
            <span className="text-[10px] font-medium text-gray-300 tracking-[0.08em]">{match.league}</span>
          </div>
          {isUpcoming ? (
            <span className="text-[10px] font-semibold text-emerald-500 tracking-[0.06em] upcoming-glow">
              {match.time} 开赛
            </span>
          ) : isFinished ? (
            <span className="text-[10px] font-medium text-gray-300 tracking-[0.06em]">完场</span>
          ) : null}
        </div>

        {/* Teams + Score row */}
        <div className="flex items-center justify-between">
          {/* Home */}
          <div className="flex flex-col items-center gap-1 w-[70px]">
            <TeamLogo name={match.home} size={36} />
            <span className={cn(
              'text-[11px] font-medium text-center leading-tight tracking-tight',
              awayWin ? 'text-gray-300' : 'text-gray-700'
            )}>
              {match.home}
            </span>
          </div>

          {/* Center */}
          <div className="flex flex-col items-center gap-0.5">
            {isUpcoming ? (
              <>
                <span className="text-[20px] font-bold text-gray-800 mono-time tracking-tight">{match.time}</span>
                <span className="text-[9px] text-gray-300 font-medium tracking-[0.1em]">未开赛</span>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-[22px] font-black tabular-nums tracking-tight',
                    homeWin ? 'text-gray-900' : 'text-gray-300'
                  )}>
                    {match.homeScore}
                  </span>
                  <span className="text-[10px] font-light text-gray-200">:</span>
                  <span className={cn(
                    'text-[22px] font-black tabular-nums tracking-tight',
                    awayWin ? 'text-gray-900' : 'text-gray-300'
                  )}>
                    {match.awayScore}
                  </span>
                </div>
                <span className="text-[9px] text-gray-300 font-medium tracking-[0.1em]">
                  {isFinished ? '完场' : `${match.minute}'`}
                </span>
              </>
            )}
          </div>

          {/* Away */}
          <div className="flex flex-col items-center gap-1 w-[70px]">
            <TeamLogo name={match.away} size={36} />
            <span className={cn(
              'text-[11px] font-medium text-center leading-tight tracking-tight',
              homeWin ? 'text-gray-300' : 'text-gray-700'
            )}>
              {match.away}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ───
export default function Schedule() {
  const navigate = useNavigate();
  const [leagueFilter, setLeagueFilter] = useState<LeagueFilter>('all');
  const [dayTab, setDayTab] = useState<DayTab>('today');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  // Track scroll for sticky header shrink
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => setScrolled(el.scrollTop > 20);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  const matchData: Record<DayTab, Match[]> = {
    yesterday: [
      { id: 101, league: '英超', leagueKey: 'premier', time: '21:00', home: '曼联', away: '纽卡斯尔', homeScore: 2, awayScore: 1, status: 'finished', sport: 'football' },
      { id: 102, league: '西甲', leagueKey: 'laliga', time: '23:00', home: '马竞', away: '毕尔巴鄂', homeScore: 0, awayScore: 0, status: 'finished', sport: 'football' },
      { id: 103, league: 'NBA', leagueKey: 'nba', time: '08:00', home: '独行侠', away: '太阳', homeScore: 118, awayScore: 105, status: 'finished', sport: 'basketball' },
      { id: 104, league: '意甲', leagueKey: 'seriea', time: '03:45', home: 'AC米兰', away: '那不勒斯', homeScore: 1, awayScore: 2, status: 'finished', sport: 'football' },
    ],
    today: [
      { id: 1, league: '英超', leagueKey: 'premier', time: '19:30', home: '阿森纳', away: '曼城', status: 'live', minute: 67, homeScore: 1, awayScore: 1, sport: 'football' },
      { id: 2, league: 'NBA', leagueKey: 'nba', time: '08:30', home: '凯尔特人', away: '雷霆', homeScore: 112, awayScore: 108, status: 'finished', sport: 'basketball' },
      { id: 3, league: '西甲', leagueKey: 'laliga', time: '23:00', home: '皇马', away: '巴萨', status: 'upcoming', sport: 'football' },
      { id: 4, league: '意甲', leagueKey: 'seriea', time: '23:00', home: '国米', away: '尤文图斯', status: 'upcoming', sport: 'football' },
      { id: 5, league: 'CBA', leagueKey: 'cba', time: '19:35', home: '广东', away: '辽宁', status: 'upcoming', sport: 'basketball' },
      { id: 6, league: '英超', leagueKey: 'premier', time: '22:00', home: '利物浦', away: '切尔西', status: 'upcoming', sport: 'football' },
    ],
    tomorrow: [
      { id: 201, league: '欧冠', leagueKey: 'ucl', time: '04:00', home: '拜仁', away: '巴黎', status: 'upcoming', sport: 'football' },
      { id: 202, league: '欧冠', leagueKey: 'ucl', time: '04:00', home: '曼城', away: '皇马', status: 'upcoming', sport: 'football' },
      { id: 203, league: 'NBA', leagueKey: 'nba', time: '09:00', home: '湖人', away: '勇士', status: 'upcoming', sport: 'basketball' },
      { id: 204, league: '西甲', leagueKey: 'laliga', time: '01:30', home: '塞维利亚', away: '瓦伦西亚', status: 'upcoming', sport: 'football' },
    ],
  };

  const matches = matchData[dayTab];
  const filtered = leagueFilter === 'all' ? matches : matches.filter(m => m.leagueKey === leagueFilter);
  const liveCount = matches.filter(m => m.status === 'live').length;

  const dayLabels: Record<DayTab, string> = { yesterday: '昨天', today: '今天', tomorrow: '明天' };
  const dayDates: Record<DayTab, string> = { yesterday: '3/27', today: '3/28', tomorrow: '3/29' };
  const days: DayTab[] = ['yesterday', 'today', 'tomorrow'];

  const leagueFilters = [
    { key: 'all' as const, label: '全部' },
    { key: 'premier' as const, label: '英超' },
    { key: 'laliga' as const, label: '西甲' },
    { key: 'seriea' as const, label: '意甲' },
    { key: 'ucl' as const, label: '欧冠' },
    { key: 'nba' as const, label: 'NBA' },
    { key: 'cba' as const, label: 'CBA' },
  ];

  // Group by status
  const liveMatches = filtered.filter(m => m.status === 'live');
  const upcomingMatches = filtered.filter(m => m.status === 'upcoming');
  const finishedMatches = filtered.filter(m => m.status === 'finished');

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-[#FAFBFC]">

      {/* ═══ Aurora Background ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="aurora-1 absolute -top-20 -right-16 w-72 h-72 rounded-full bg-gradient-to-br from-emerald-200/20 via-teal-100/12 to-transparent blur-3xl" />
        <div className="aurora-2 absolute top-1/2 -left-20 w-64 h-64 rounded-full bg-gradient-to-br from-sky-200/15 via-blue-100/8 to-transparent blur-3xl" />
        <div className="aurora-3 absolute bottom-24 right-8 w-56 h-56 rounded-full bg-gradient-to-tr from-emerald-100/12 via-cyan-100/8 to-transparent blur-3xl" />
      </div>

      {/* ═══ Background Beams ═══ */}
      <BackgroundBeams />

      {/* ═══ Noise Texture ═══ */}
      <div className="noise-overlay" />

      {/* ═══ Sticky Header — Frosted glass, shrinks on scroll ═══ */}
      <motion.header
        className="relative z-20 shrink-0 transition-all duration-500"
        animate={{
          paddingTop: scrolled ? 8 : 16,
          paddingBottom: scrolled ? 6 : 8,
        }}
      >
        <div className={cn(
          'px-6 flex justify-between items-center transition-all duration-500',
          scrolled && 'bg-white/60 backdrop-blur-2xl border-b border-white/30'
        )}>
          <div className="flex items-center gap-2.5">
            <motion.h1
              animate={{ fontSize: scrolled ? '17px' : '22px' }}
              transition={{ duration: 0.3 }}
              className="font-bold text-gray-900 tracking-tight"
            >
              赛程
            </motion.h1>
            {liveCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 tracking-[0.08em]">
                <span className="relative flex h-1.5 w-1.5 live-pulse">
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                </span>
                {liveCount} LIVE
              </span>
            )}
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/50 backdrop-blur-xl border border-white/30 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <Settings size={17} strokeWidth={1.8} />
          </button>
        </div>
      </motion.header>

      {/* ═══ Day Segmented Control ═══ */}
      <div className="relative z-10 px-5 pt-1 pb-2 shrink-0">
        <DaySegmentedControl
          days={days}
          activeDay={dayTab}
          onSelect={setDayTab}
          dayLabels={dayLabels}
          dayDates={dayDates}
        />
      </div>

      {/* ═══ League Filter Pills ═══ */}
      <div className="relative z-10 px-5 py-2 shrink-0">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {leagueFilters.map(l => {
            const isActive = leagueFilter === l.key;
            return (
              <button
                key={l.key}
                onClick={() => setLeagueFilter(l.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all duration-400 border-[0.5px]',
                  isActive
                    ? 'bg-white/70 backdrop-blur-xl border-white/40 text-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.03)]'
                    : 'bg-transparent border-transparent text-gray-400 hover:text-gray-600'
                )}
              >
                {l.key !== 'all' && <LeagueIcon league={l.label} size={11} active={isActive} />}
                <span className="tracking-[0.04em]">{l.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ Match List ═══ */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar relative z-10 px-5 pb-8 space-y-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={dayTab + leagueFilter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* ═══ Live Section — Hero Cards ═══ */}
            {liveMatches.length > 0 && (
              <section>
                <div className="flex items-center gap-1.5 mb-3 px-0.5">
                  <span className="relative flex h-1.5 w-1.5 live-pulse">
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                  </span>
                  <span className="text-[10px] font-bold text-red-500/80 tracking-[0.12em]">进行中</span>
                </div>
                <div className="space-y-3">
                  {liveMatches.map(m => (
                    <HeroLiveCard
                      key={m.id}
                      match={m}
                      onClick={() => navigate(`/match/${m.id}`, { state: m })}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ═══ Upcoming Section — Grid ═══ */}
            {upcomingMatches.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3 px-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 upcoming-glow" />
                    <span className="text-[10px] font-bold text-emerald-500/80 tracking-[0.12em]">即将开赛</span>
                  </div>
                  <span className="text-[10px] text-gray-300 font-medium tracking-wide">{upcomingMatches.length} 场</span>
                </div>
                <div className="grid grid-cols-1 gap-2.5">
                  {upcomingMatches.map((m, i) => (
                    <MatchCard
                      key={m.id}
                      match={m}
                      index={i}
                      onClick={() => navigate(`/match/${m.id}`, { state: m })}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ═══ Finished Section — Grid ═══ */}
            {finishedMatches.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3 px-0.5">
                  <span className="text-[10px] font-medium text-gray-300 tracking-[0.12em]">已结束</span>
                  <span className="text-[10px] text-gray-300/60 font-medium tracking-wide">{finishedMatches.length} 场</span>
                </div>
                <div className="grid grid-cols-1 gap-2.5">
                  {finishedMatches.map((m, i) => (
                    <MatchCard
                      key={m.id}
                      match={m}
                      index={i + (liveMatches.length + upcomingMatches.length)}
                      onClick={() => navigate(`/match/${m.id}`, { state: m })}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Empty State */}
            {filtered.length === 0 && (
              <div className="text-center py-24">
                <div className="w-14 h-14 bg-white/40 backdrop-blur-xl border-[0.5px] border-white/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CalendarDays size={24} className="text-gray-300" strokeWidth={1.5} />
                </div>
                <div className="text-[14px] font-medium text-gray-300 tracking-wide">暂无比赛</div>
                <div className="text-[11px] text-gray-200 mt-1 tracking-wide">换个日期或联赛看看</div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
