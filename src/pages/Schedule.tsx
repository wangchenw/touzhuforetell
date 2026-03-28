import { useState } from 'react';
import { Settings, ChevronLeft, ChevronRight, Zap, Clock, Trophy, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
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

// ─── SVG Team Logo Component ───
function TeamLogo({ name, size = 40 }: { name: string; size?: number }) {
  const [primary, secondary] = teamColors[name] || ['#6B7280', '#E5E7EB'];
  const r = size / 2;
  const initial = name.charAt(0);

  // Football teams → shield shape, basketball → circle
  const isBasketball = ['凯尔特人','雷霆','湖人','勇士','独行侠','太阳','广东','辽宁'].includes(name);

  if (isBasketball) {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="19" fill={primary} stroke={secondary} strokeWidth="2" />
        {/* Basketball seam lines */}
        <path d="M5 20 Q20 12, 35 20" stroke={secondary} strokeWidth="1.2" fill="none" opacity="0.5" />
        <path d="M5 20 Q20 28, 35 20" stroke={secondary} strokeWidth="1.2" fill="none" opacity="0.5" />
        <line x1="20" y1="1" x2="20" y2="39" stroke={secondary} strokeWidth="1.2" opacity="0.3" />
        <text x="20" y="24" textAnchor="middle" fill={secondary} fontSize="14" fontWeight="900" fontFamily="system-ui">{initial}</text>
      </svg>
    );
  }

  // Football shield
  return (
    <svg width={size} height={size} viewBox="0 0 40 44" fill="none">
      <path d="M20 2 L36 8 L36 24 Q36 36, 20 42 Q4 36, 4 24 L4 8 Z" fill={primary} stroke={primary} strokeWidth="0.5" />
      <path d="M20 6 L33 11 L33 24 Q33 33, 20 39 Q7 33, 7 24 L7 11 Z" fill={secondary} opacity="0.15" />
      {/* Vertical stripe accent */}
      <rect x="18" y="2" width="4" height="40" fill={secondary} opacity="0.2" rx="1" />
      <text x="20" y="26" textAnchor="middle" fill="#FFFFFF" fontSize="14" fontWeight="900" fontFamily="system-ui" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>{initial}</text>
    </svg>
  );
}

// ─── League SVG Icons (replacing emoji) ───
function LeagueIcon({ league, size = 16 }: { league: string; size?: number }) {
  const cfgMap: Record<string, { color: string }> = {
    '英超': { color: '#3D195B' },
    '西甲': { color: '#EE8707' },
    '意甲': { color: '#024494' },
    '欧冠': { color: '#091442' },
    'NBA':  { color: '#C8102E' },
    'CBA':  { color: '#0D6E3E' },
  };
  const cfg = cfgMap[league] || { color: '#6B7280' };

  if (league === 'NBA' || league === 'CBA') {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" fill={cfg.color} />
        <path d="M3 8 Q8 4, 13 8" stroke="white" strokeWidth="1" fill="none" opacity="0.8" />
        <path d="M3 8 Q8 12, 13 8" stroke="white" strokeWidth="1" fill="none" opacity="0.8" />
        <line x1="8" y1="1" x2="8" y2="15" stroke="white" strokeWidth="0.8" opacity="0.6" />
      </svg>
    );
  }

  // Football leagues → mini shield
  return (
    <svg width={size} height={size} viewBox="0 0 16 18" fill="none">
      <path d="M8 1 L14.5 3.5 L14.5 10 Q14.5 15, 8 17 Q1.5 15, 1.5 10 L1.5 3.5 Z" fill={cfg.color} />
      {league === '欧冠' && <circle cx="8" cy="9" r="2.5" fill="none" stroke="white" strokeWidth="1" opacity="0.9" />}
      {league === '欧冠' && <circle cx="8" cy="9" r="1" fill="white" opacity="0.9" />}
      {league !== '欧冠' && <circle cx="8" cy="9" r="2" fill="white" opacity="0.3" />}
    </svg>
  );
}

// ─── Match Card: Team Column ───
function TeamColumn({ name, score, isWinner, isDim, status }: {
  name: string; score?: number; isWinner?: boolean; isDim?: boolean; status: Match['status'];
}) {
  return (
    <div className="flex flex-col items-center gap-1 w-[80px]">
      <div className={cn(
        "rounded-2xl p-1 transition-all",
        status === 'live' ? "bg-red-50 shadow-sm shadow-red-100" :
        isWinner ? "bg-gray-50" : ""
      )}>
        <TeamLogo name={name} size={42} />
      </div>
      <span className={cn(
        "text-[12px] font-bold text-center leading-tight",
        isDim ? "text-gray-400" : "text-gray-800"
      )}>
        {name}
      </span>
    </div>
  );
}

// ─── Score Center ───
function ScoreCenter({ match }: { match: Match }) {
  const homeWin = (match.homeScore ?? 0) > (match.awayScore ?? 0);
  const awayWin = (match.awayScore ?? 0) > (match.homeScore ?? 0);

  if (match.status === 'upcoming') {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[22px] font-black text-emerald-600 tabular-nums tracking-tight">{match.time}</span>
        <span className="text-[10px] text-gray-400 font-medium">未开赛</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-2.5">
        <span className={cn(
          "text-[24px] font-black tabular-nums",
          match.status === 'live' ? "text-red-500" : homeWin ? "text-gray-900" : "text-gray-300"
        )}>
          {match.homeScore}
        </span>
        <span className={cn(
          "text-[11px] font-bold",
          match.status === 'live' ? "text-red-300" : "text-gray-200"
        )}>:</span>
        <span className={cn(
          "text-[24px] font-black tabular-nums",
          match.status === 'live' ? "text-red-500" : awayWin ? "text-gray-900" : "text-gray-300"
        )}>
          {match.awayScore}
        </span>
      </div>
      {match.status === 'live' && (
        <span className="flex items-center gap-1 text-[11px] font-bold text-red-500">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
          </span>
          {match.minute}'
        </span>
      )}
      {match.status === 'finished' && (
        <span className="text-[10px] text-gray-400 font-medium">完场</span>
      )}
    </div>
  );
}

// ─── Main Page ───
export default function Schedule() {
  const navigate = useNavigate();
  const [leagueFilter, setLeagueFilter] = useState<LeagueFilter>('all');
  const [dayTab, setDayTab] = useState<DayTab>('today');

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
  const currentDayIdx = days.indexOf(dayTab);

  const leagueFilters = [
    { key: 'all' as const, label: '全部' },
    { key: 'premier' as const, label: '英超' },
    { key: 'laliga' as const, label: '西甲' },
    { key: 'seriea' as const, label: '意甲' },
    { key: 'ucl' as const, label: '欧冠' },
    { key: 'nba' as const, label: 'NBA' },
    { key: 'cba' as const, label: 'CBA' },
  ];

  const leagueNameMap: Record<string, string> = {
    all: '全部', premier: '英超', laliga: '西甲', seriea: '意甲', ucl: '欧冠', nba: 'NBA', cba: 'CBA'
  };

  // Group matches by status order: live → upcoming → finished
  const liveMatches = filtered.filter(m => m.status === 'live');
  const upcomingMatches = filtered.filter(m => m.status === 'upcoming');
  const finishedMatches = filtered.filter(m => m.status === 'finished');

  const renderMatchCard = (match: Match, idx: number) => {
    const homeWin = match.status === 'finished' && (match.homeScore ?? 0) > (match.awayScore ?? 0);
    const awayWin = match.status === 'finished' && (match.awayScore ?? 0) > (match.homeScore ?? 0);
    const isLive = match.status === 'live';

    return (
      <motion.div
        key={match.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.04, duration: 0.3 }}
        className={cn(
          "relative bg-white rounded-2xl overflow-hidden transition-shadow",
          isLive
            ? "shadow-[0_4px_24px_rgba(239,68,68,0.12)] border border-red-100"
            : "shadow-sm border border-gray-100/70 hover:shadow-md"
        )}
      >
        {/* Live top accent bar */}
        {isLive && (
          <div className="h-[3px] bg-gradient-to-r from-red-500 via-orange-400 to-red-500" />
        )}

        {/* Header: league + status */}
        <div className="flex items-center justify-between px-4 pt-3 pb-0">
          <div className="flex items-center gap-1.5">
            <LeagueIcon league={match.league} size={14} />
            <span className="text-[11px] font-semibold text-gray-500">{match.league}</span>
          </div>
          {isLive ? (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
              </span>
              LIVE
            </span>
          ) : match.status === 'finished' ? (
            <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">已结束</span>
          ) : (
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{match.time} 开赛</span>
          )}
        </div>

        {/* Main: teams + score */}
        <div className="flex items-center justify-between px-3 py-3">
          <TeamColumn
            name={match.home}
            score={match.homeScore}
            isWinner={homeWin}
            isDim={awayWin}
            status={match.status}
          />
          <ScoreCenter match={match} />
          <TeamColumn
            name={match.away}
            score={match.awayScore}
            isWinner={awayWin}
            isDim={homeWin}
            status={match.status}
          />
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#F7F8FA]">
      {/* ── Header ── */}
      <header className="bg-white/80 backdrop-blur-md px-5 py-3 flex justify-between items-center sticky top-0 z-20 shadow-[0_2px_10px_rgba(0,0,0,0.03)] shrink-0">
        <div className="flex items-center gap-2">
          <CalendarDays size={20} className="text-emerald-500" />
          <h1 className="text-[20px] font-black text-gray-900 tracking-tight">赛程</h1>
        </div>
        <div className="flex items-center gap-2">
          {liveCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-full">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
              </span>
              {liveCount}
            </span>
          )}
          <button onClick={() => navigate('/profile')} className="p-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100">
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* ── Day Switcher ── */}
      <div className="px-4 pt-3 pb-1 shrink-0">
        <div className="flex items-center bg-gray-100/80 rounded-2xl p-1">
          <button
            onClick={() => currentDayIdx > 0 && setDayTab(days[currentDayIdx - 1])}
            disabled={currentDayIdx === 0}
            className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-20 transition-colors rounded-xl"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex gap-0.5 flex-1 justify-center">
            {days.map(day => (
              <button
                key={day}
                onClick={() => setDayTab(day)}
                className={cn(
                  "relative flex-1 py-2 text-[13px] font-semibold rounded-xl transition-all duration-300",
                  dayTab === day
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                <span className="block">{dayLabels[day]}</span>
                <span className={cn(
                  "block text-[10px] -mt-0.5 font-medium transition-colors",
                  dayTab === day ? "text-gray-400" : "text-gray-400/60"
                )}>{dayDates[day]}</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => currentDayIdx < days.length - 1 && setDayTab(days[currentDayIdx + 1])}
            disabled={currentDayIdx === days.length - 1}
            className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-20 transition-colors rounded-xl"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ── League Filter ── */}
      <div className="px-4 py-2.5 shrink-0">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {leagueFilters.map(l => (
            <button
              key={l.key}
              onClick={() => setLeagueFilter(l.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap transition-all duration-200",
                leagueFilter === l.key
                  ? "bg-gray-900 text-white shadow-sm"
                  : "bg-white text-gray-500 border border-gray-200/80 hover:border-gray-300"
              )}
            >
              {l.key !== 'all' && <LeagueIcon league={l.label} size={12} />}
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Match List ── */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-8 space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={dayTab + leagueFilter}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Live section */}
            {liveMatches.length > 0 && (
              <section>
                <div className="flex items-center gap-1.5 mb-2 px-0.5">
                  <Zap size={12} className="text-red-500" />
                  <span className="text-[11px] font-bold text-red-500 tracking-wide">进行中</span>
                </div>
                <div className="space-y-2.5">
                  {liveMatches.map((m, i) => renderMatchCard(m, i))}
                </div>
              </section>
            )}

            {/* Upcoming section */}
            {upcomingMatches.length > 0 && (
              <section>
                <div className="flex items-center gap-1.5 mb-2 px-0.5">
                  <Clock size={12} className="text-emerald-500" />
                  <span className="text-[11px] font-bold text-emerald-600 tracking-wide">即将开赛</span>
                  <span className="text-[10px] text-gray-400 ml-auto">{upcomingMatches.length} 场</span>
                </div>
                <div className="space-y-2.5">
                  {upcomingMatches.map((m, i) => renderMatchCard(m, i))}
                </div>
              </section>
            )}

            {/* Finished section */}
            {finishedMatches.length > 0 && (
              <section>
                <div className="flex items-center gap-1.5 mb-2 px-0.5">
                  <Trophy size={12} className="text-gray-400" />
                  <span className="text-[11px] font-bold text-gray-400 tracking-wide">已结束</span>
                  <span className="text-[10px] text-gray-300 ml-auto">{finishedMatches.length} 场</span>
                </div>
                <div className="space-y-2.5">
                  {finishedMatches.map((m, i) => renderMatchCard(m, i))}
                </div>
              </section>
            )}

            {/* Empty */}
            {filtered.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CalendarDays size={28} className="text-gray-300" />
                </div>
                <div className="text-[15px] font-bold text-gray-400 mb-1">暂无比赛</div>
                <div className="text-[13px] text-gray-300">换个日期或联赛看看</div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
