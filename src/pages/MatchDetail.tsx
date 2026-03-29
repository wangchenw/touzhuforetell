import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, TrendingUp, Users, Newspaper, BarChart3, AlertTriangle, Zap, Target, Activity, Shield, X, Swords, Trophy, Star } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'motion/react';
import { cn } from '@/lib/utils';

type DetailTab = 'analysis' | 'h2h' | 'lineup' | 'intel';

// ─── Team brand colors ───
const teamColors: Record<string, [string, string]> = {
  '阿森纳': ['#EF0107', '#FFFFFF'], '曼城': ['#6CABDD', '#1C2C5B'],
  '利物浦': ['#C8102E', '#F6EB61'], '切尔西': ['#034694', '#FFFFFF'],
  '曼联': ['#DA291C', '#FBE122'], '纽卡斯尔': ['#241F20', '#FFFFFF'],
  '皇马': ['#FEBE10', '#00529F'], '巴萨': ['#A50044', '#004D98'],
  '马竞': ['#CB3524', '#272E61'], '毕尔巴鄂': ['#EE2523', '#FFFFFF'],
  '塞维利亚': ['#D4001E', '#FFFFFF'], '瓦伦西亚': ['#EE3524', '#000000'],
  '国米': ['#010E80', '#FCBB09'], '尤文图斯': ['#000000', '#FFFFFF'],
  'AC米兰': ['#FB090B', '#000000'], '那不勒斯': ['#12A0D7', '#FFFFFF'],
  '拜仁': ['#DC052D', '#0066B2'], '巴黎': ['#004170', '#DA291C'],
  '凯尔特人': ['#007A33', '#FFFFFF'], '雷霆': ['#007AC1', '#EF6100'],
  '湖人': ['#552583', '#FDB927'], '勇士': ['#1D428A', '#FFC72C'],
  '独行侠': ['#00538C', '#B8C4CA'], '太阳': ['#E56020', '#1D1160'],
  '广东': ['#C8102E', '#FDB927'], '辽宁': ['#002D72', '#C8102E'],
};

// ─── Team Detail Data ───
interface TeamDetail {
  coach: string;
  coachYears: string;
  coachStyle: string;
  formation: string;
  tactics: string[];
  season: { wins: number; draws: number; losses: number; goals: number; conceded: number };
  radar: { label: string; value: number }[]; // 0-100
  strengths: string[];
  weaknesses: string[];
}

const teamDetailData: Record<string, TeamDetail> = {
  '阿森纳': {
    coach: '阿尔特塔', coachYears: '2019至今', coachStyle: '控球进攻型',
    formation: '4-3-3', tactics: ['高位逼抢', '边路传中', '控球导向', '定位球战术突出'],
    season: { wins: 22, draws: 5, losses: 3, goals: 68, conceded: 24 },
    radar: [{ label: '进攻', value: 88 }, { label: '防守', value: 82 }, { label: '控球', value: 85 }, { label: '体能', value: 78 }, { label: '纪律', value: 90 }, { label: '士气', value: 92 }],
    strengths: ['主场战绩联赛最佳', '定位球得分能力强', '后防线稳固'],
    weaknesses: ['客场偶有失稳', '板凳深度略显不足'],
  },
  '曼城': {
    coach: '瓜迪奥拉', coachYears: '2016至今', coachStyle: 'Tiki-Taka 传控体系',
    formation: '4-2-3-1', tactics: ['极致控球', '肋部渗透', '高位压迫', '伪9号战术'],
    season: { wins: 20, draws: 6, losses: 4, goals: 62, conceded: 28 },
    radar: [{ label: '进攻', value: 90 }, { label: '防守', value: 75 }, { label: '控球', value: 95 }, { label: '体能', value: 82 }, { label: '纪律', value: 85 }, { label: '士气', value: 80 }],
    strengths: ['中场控制力联赛顶级', '教练战术调整灵活', '进攻端多点开花'],
    weaknesses: ['罗德里伤缺影响中场', '防守端空中对抗偏弱'],
  },
  '利物浦': {
    coach: '斯洛特', coachYears: '2024至今', coachStyle: '高强度压迫反击',
    formation: '4-3-3', tactics: ['极限反击', '两翼齐飞', '中场绞杀', '全场紧逼'],
    season: { wins: 21, draws: 4, losses: 5, goals: 70, conceded: 30 },
    radar: [{ label: '进攻', value: 92 }, { label: '防守', value: 78 }, { label: '控球', value: 76 }, { label: '体能', value: 90 }, { label: '纪律', value: 82 }, { label: '士气', value: 88 }],
    strengths: ['反击速度联赛最快', '前场三叉戟火力猛', '安菲尔德主场氛围'],
    weaknesses: ['高位压迫后防线身后空当', '伤病轮换管理压力'],
  },
  '切尔西': {
    coach: '马雷斯卡', coachYears: '2024至今', coachStyle: '攻守均衡型',
    formation: '4-2-3-1', tactics: ['快速转换', '边后卫内收', '中路渗透', '灵活变阵'],
    season: { wins: 16, draws: 8, losses: 6, goals: 55, conceded: 35 },
    radar: [{ label: '进攻', value: 78 }, { label: '防守', value: 72 }, { label: '控球', value: 80 }, { label: '体能', value: 85 }, { label: '纪律', value: 75 }, { label: '士气', value: 76 }],
    strengths: ['年轻球员冲击力强', '替补席深度充足', '定位球防守扎实'],
    weaknesses: ['阵容磨合尚在进行', '关键比赛经验不足'],
  },
};

// Default fallback for teams not in the map
const defaultTeamDetail = (name: string): TeamDetail => ({
  coach: '主教练', coachYears: '2023至今', coachStyle: '均衡型',
  formation: '4-4-2', tactics: ['稳固防守', '中路进攻', '定位球', '控球导向'],
  season: { wins: 15, draws: 8, losses: 7, goals: 48, conceded: 32 },
  radar: [{ label: '进攻', value: 72 }, { label: '防守', value: 70 }, { label: '控球', value: 68 }, { label: '体能', value: 75 }, { label: '纪律', value: 78 }, { label: '士气', value: 74 }],
  strengths: ['团队配合默契', '整体战术执行力强'],
  weaknesses: ['缺少绝对核心球星', '客场战绩有待提升'],
});

// ─── SVG Radar Chart ───
function RadarChart({ data, color, size = 200 }: { data: { label: string; value: number }[]; color: string; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const n = data.length;
  const angleStep = (2 * Math.PI) / n;
  const levels = [0.25, 0.5, 0.75, 1];

  const getPoint = (i: number, scale: number) => {
    const angle = angleStep * i - Math.PI / 2;
    return [cx + r * scale * Math.cos(angle), cy + r * scale * Math.sin(angle)];
  };

  const polygonPoints = data.map((d, i) => getPoint(i, d.value / 100).join(',')).join(' ');
  const gridPolygons = levels.map(l => data.map((_, i) => getPoint(i, l).join(',')).join(' '));

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
      {/* Grid polygons */}
      {gridPolygons.map((pts, li) => (
        <polygon key={li} points={pts} fill="none" stroke="rgba(156,163,175,0.15)" strokeWidth="0.8" />
      ))}
      {/* Axis lines */}
      {data.map((_, i) => {
        const [px, py] = getPoint(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={px} y2={py} stroke="rgba(156,163,175,0.1)" strokeWidth="0.5" />;
      })}
      {/* Data polygon */}
      <polygon points={polygonPoints} fill={`${color}18`} stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      {/* Data points */}
      {data.map((d, i) => {
        const [px, py] = getPoint(i, d.value / 100);
        return <circle key={`dot-${i}`} cx={px} cy={py} r="3" fill={color} opacity="0.9" />;
      })}
      {/* Labels */}
      {data.map((d, i) => {
        const [px, py] = getPoint(i, 1.2);
        return (
          <text key={`label-${i}`} x={px} y={py} textAnchor="middle" dominantBaseline="central"
            fontSize="10" fontWeight="500" fill="#9CA3AF" className="tracking-wide"
          >
            {d.label}
          </text>
        );
      })}
      {/* Values */}
      {data.map((d, i) => {
        const [px, py] = getPoint(i, 1.2);
        return (
          <text key={`val-${i}`} x={px} y={py + 12} textAnchor="middle" dominantBaseline="central"
            fontSize="11" fontWeight="700" fill={color}
          >
            {d.value}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Team Detail Modal ───
function TeamDetailModal({ team, onClose }: { team: string; onClose: () => void }) {
  const detail = teamDetailData[team] || defaultTeamDetail(team);
  const [primary] = teamColors[team] || ['#6B7280'];
  const { season } = detail;
  const totalGames = season.wins + season.draws + season.losses;
  const winRate = Math.round((season.wins / totalGames) * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 350, damping: 35 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[390px] max-h-[85vh] bg-[#F7F8FA] rounded-t-[28px] overflow-hidden shadow-2xl"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-9 h-1 rounded-full bg-gray-300/50" />
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto max-h-[calc(85vh-40px)] no-scrollbar px-5 pb-8 space-y-4">

          {/* Header: Badge + Team Name + Close */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <TeamBadge name={team} size={44} />
              <div>
                <h2 className="text-[18px] font-bold text-gray-900 tracking-tight">{team}</h2>
                <p className="text-[11px] text-gray-400 font-medium tracking-wide mt-0.5">
                  {season.wins}胜 {season.draws}平 {season.losses}负 · 胜率 {winRate}%
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/60 backdrop-blur-xl border border-white/30 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors">
              <X size={16} strokeWidth={2} />
            </button>
          </div>

          {/* ═══ Radar Chart Card ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl bg-white/55 backdrop-blur-[40px] border-[0.5px] border-white/40 shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-5"
          >
            <h3 className="text-[10px] text-gray-300 font-medium tracking-[0.14em] uppercase mb-2">能力雷达 · RADAR</h3>
            <RadarChart data={detail.radar} color={primary} size={220} />
          </motion.div>

          {/* ═══ Coach & Tactics Card ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl bg-white/55 backdrop-blur-[40px] border-[0.5px] border-white/40 shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-5"
          >
            <h3 className="text-[10px] text-gray-300 font-medium tracking-[0.14em] uppercase mb-4">教练 · COACH</h3>
            <div className="flex items-center gap-4 mb-4">
              {/* Coach avatar placeholder */}
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${primary}15` }}
              >
                <Star size={20} strokeWidth={1.5} style={{ color: primary }} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[15px] font-semibold text-gray-800 tracking-tight block">{detail.coach}</span>
                <span className="text-[11px] text-gray-400 font-normal tracking-wide block mt-0.5">{detail.coachYears}</span>
                <span className="text-[11px] font-medium tracking-wide mt-1 block" style={{ color: primary }}>{detail.coachStyle}</span>
              </div>
            </div>

            {/* Formation */}
            <div className="flex items-center gap-2 mb-3">
              <Swords size={13} strokeWidth={1.8} className="text-gray-400" />
              <span className="text-[10px] text-gray-300 font-medium tracking-[0.1em] uppercase">常用阵型</span>
              <span className="text-[13px] font-semibold text-gray-700 ml-auto tracking-tight">{detail.formation}</span>
            </div>

            {/* Tactics tags */}
            <h4 className="text-[10px] text-gray-300 font-medium tracking-[0.14em] uppercase mb-2 mt-4">技战术特点</h4>
            <div className="flex flex-wrap gap-1.5">
              {detail.tactics.map((t, i) => (
                <span key={i} className="text-[11px] font-medium px-3 py-1.5 rounded-xl border-[0.5px] tracking-wide"
                  style={{ backgroundColor: `${primary}08`, borderColor: `${primary}20`, color: primary }}
                >
                  {t}
                </span>
              ))}
            </div>
          </motion.div>

          {/* ═══ Season Stats Card ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-3xl bg-white/55 backdrop-blur-[40px] border-[0.5px] border-white/40 shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-5"
          >
            <h3 className="text-[10px] text-gray-300 font-medium tracking-[0.14em] uppercase mb-3">赛季数据 · SEASON</h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: '进球', val: season.goals, icon: '⚽' },
                { label: '失球', val: season.conceded, icon: '🥅' },
                { label: '胜率', val: `${winRate}%`, icon: '📊' },
              ].map((s, i) => (
                <div key={i} className="text-center rounded-2xl bg-gray-50/60 py-3">
                  <span className="text-[16px] block mb-0.5">{s.icon}</span>
                  <span className="text-[16px] font-bold text-gray-800 mono-time block">{s.val}</span>
                  <span className="text-[9px] text-gray-400 font-medium tracking-[0.1em] uppercase">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Win/Draw/Loss bar */}
            <div className="flex rounded-full overflow-hidden h-2 bg-gray-100/60">
              <div className="bg-emerald-500/70 rounded-l-full" style={{ width: `${(season.wins / totalGames) * 100}%` }} />
              <div className="bg-gray-300/60" style={{ width: `${(season.draws / totalGames) * 100}%` }} />
              <div className="bg-red-400/70 rounded-r-full" style={{ width: `${(season.losses / totalGames) * 100}%` }} />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[9px] text-emerald-500 font-medium">{season.wins}胜</span>
              <span className="text-[9px] text-gray-400 font-medium">{season.draws}平</span>
              <span className="text-[9px] text-red-400 font-medium">{season.losses}负</span>
            </div>
          </motion.div>

          {/* ═══ Strengths & Weaknesses ═══ */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-3xl bg-white/55 backdrop-blur-[40px] border-[0.5px] border-white/40 shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-5"
          >
            <h3 className="text-[10px] text-gray-300 font-medium tracking-[0.14em] uppercase mb-3">优劣势分析 · SWOT</h3>
            <div className="space-y-2">
              {detail.strengths.map((s, i) => (
                <div key={`s-${i}`} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-emerald-500/10 flex items-center justify-center mt-0.5 shrink-0">
                    <Trophy size={11} strokeWidth={2} className="text-emerald-500" />
                  </div>
                  <span className="text-[12px] text-gray-700 font-normal leading-relaxed tracking-wide">{s}</span>
                </div>
              ))}
              {detail.weaknesses.map((w, i) => (
                <div key={`w-${i}`} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-amber-500/10 flex items-center justify-center mt-0.5 shrink-0">
                    <AlertTriangle size={11} strokeWidth={2} className="text-amber-500" />
                  </div>
                  <span className="text-[12px] text-gray-600 font-normal leading-relaxed tracking-wide">{w}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Team Badge with glass reflection ───
function TeamBadge({ name, size = 48 }: { name: string; size?: number }) {
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
      <ellipse cx="14" cy="12" rx="8" ry="6" fill="white" opacity="0.15" transform="rotate(-20 14 12)" />
    </svg>
  );
}

// ─── Number Ticker — counts up from 0 ───
function NumberTicker({ value, suffix = '', delay = 0 }: { value: string; suffix?: string; delay?: number }) {
  const numericPart = parseFloat(value.replace(/[^0-9.]/g, ''));
  const hasPercent = value.includes('%');
  const [displayed, setDisplayed] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const duration = 800;
    const startTime = Date.now() + delay;
    const step = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed < 0) { requestAnimationFrame(step); return; }
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(numericPart * eased);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, numericPart, delay]);

  const formatted = Number.isInteger(numericPart)
    ? Math.round(displayed).toString()
    : displayed.toFixed(1);

  return (
    <span ref={ref} className="mono-time">
      {formatted}{hasPercent ? '%' : ''}{suffix}
    </span>
  );
}

// ─── Typewriter Effect ───
function TypewriterText({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const [displayedCount, setDisplayedCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayedCount(prev => {
          if (prev >= text.length) { clearInterval(interval); return prev; }
          return prev + 1;
        });
      }, 30);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [started, text.length, delay]);

  return (
    <span ref={ref} className={className}>
      {text.slice(0, displayedCount)}
      {displayedCount < text.length && (
        <span className="inline-block w-[2px] h-[1em] bg-amber-400/60 ml-0.5 align-text-bottom animate-pulse" />
      )}
    </span>
  );
}

// ─── Magnetic Tab Button ───
function MagneticTab({
  children, active, onClick,
}: {
  children: React.ReactNode; active: boolean; onClick: () => void;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 400, damping: 25 });
  const springY = useSpring(y, { stiffness: 400, damping: 25 });
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
      style={{ x: springX, y: springY }}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => { x.set(0); y.set(0); }}
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={cn(
        'relative flex-1 py-2 text-[12px] font-medium rounded-[14px] transition-colors duration-300 flex items-center justify-center gap-1 tracking-[0.04em]',
        active ? 'text-gray-900' : 'text-gray-400'
       )}
    >
      {children}
    </motion.button>
  );
}

// ─── Formation Position Maps ───
const formationMap: Record<string, { positions: [number, number][]; rows: number[][] }> = {
  '4-3-3': {
    positions: [
      [50, 93],                                       // GK
      [83, 80], [63, 83], [37, 83], [17, 80],        // DEF
      [67, 68], [50, 64], [33, 68],                   // MID
      [80, 54], [50, 49], [20, 54],                   // FWD
    ],
    rows: [[0], [1,2,3,4], [5,6,7], [8,9,10]],
  },
  '4-2-3-1': {
    positions: [
      [50, 93],                                       // GK
      [83, 80], [63, 83], [37, 83], [17, 80],        // DEF
      [61, 69], [39, 69],                             // DM
      [78, 56], [50, 52], [22, 56],                   // AM
      [50, 42],                                       // ST
    ],
    rows: [[0], [1,2,3,4], [5,6], [7,8,9], [10]],
  },
};

// ─── Visual Football Pitch ───
function VisualPitch({
  homeLineup, awayLineup, homeTeam, awayTeam,
}: {
  homeLineup: { formation: string; players: string[] };
  awayLineup: { formation: string; players: string[] };
  homeTeam: string;
  awayTeam: string;
}) {
  const [activePlayer, setActivePlayer] = useState<{ side: 'home' | 'away'; idx: number } | null>(null);
  const pitchRef = useRef<HTMLDivElement>(null);
  const [pointer, setPointer] = useState({ x: -200, y: -200 });
  const [formRevealed, setFormRevealed] = useState(false);

  useEffect(() => { const t = setTimeout(() => setFormRevealed(true), 200); return () => clearTimeout(t); }, []);

  const homeForm = formationMap[homeLineup.formation] || formationMap['4-3-3'];
  const awayForm = formationMap[awayLineup.formation] || formationMap['4-2-3-1'];

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const el = pitchRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPointer({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, []);

  const parsePlayers = (players: string[]) =>
    players.map(p => { const [pos, name] = p.split(' · '); return { pos, name }; });

  const homePlayers = parsePlayers(homeLineup.players);
  const awayPlayers = parsePlayers(awayLineup.players);
  const mirrorPos = (p: [number, number]): [number, number] => [100 - p[0], 100 - p[1]];

  const handleTap = (side: 'home' | 'away', idx: number) => {
    setActivePlayer(prev => (prev?.side === side && prev?.idx === idx) ? null : { side, idx });
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
      {/* Formation label with text reveal */}
      <div className="flex items-center justify-center gap-3 mb-3 overflow-hidden">
        <motion.span
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: formRevealed ? 1 : 0, y: formRevealed ? 0 : 10 }}
          transition={{ duration: 0.5 }}
          className="text-[11px] font-semibold text-emerald-500/80 tracking-tight"
        >{homeTeam}</motion.span>
        <motion.span
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: formRevealed ? 1 : 0, y: formRevealed ? 0 : 10 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-[10px] text-gray-300 font-normal tracking-[0.12em]"
        >{homeLineup.formation} vs {awayLineup.formation}</motion.span>
        <motion.span
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: formRevealed ? 1 : 0, y: formRevealed ? 0 : 10 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-[11px] font-semibold text-blue-500/80 tracking-tight"
        >{awayTeam}</motion.span>
      </div>

      {/* Pitch container with 3D perspective tilt */}
      <div
        ref={pitchRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setPointer({ x: -200, y: -200 })}
        className="relative rounded-3xl overflow-hidden bg-white/50 backdrop-blur-[40px] border-[0.5px] border-white/40 shadow-[0_4px_32px_rgba(0,0,0,0.03)]"
        style={{ perspective: '800px', aspectRatio: '3 / 4' }}
      >
        {/* Subtle 3D tilt pitch background */}
        <div className="absolute inset-0 pitch-field" style={{ transform: 'rotateX(2deg)', transformOrigin: 'center 60%' }} />

        {/* Follower pointer glow */}
        <div className="follower-glow" style={{ left: `${pointer.x}%`, top: `${pointer.y}%` }} />

        {/* Pitch markings */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <rect x="5" y="4" width="90" height="92" rx="1" fill="none" stroke="rgba(16,185,129,0.06)" strokeWidth="0.3" />
          <line x1="5" y1="50" x2="95" y2="50" stroke="rgba(16,185,129,0.1)" strokeWidth="0.3" />
          <circle cx="50" cy="50" r="12" fill="none" stroke="rgba(16,185,129,0.08)" strokeWidth="0.3" />
          <circle cx="50" cy="50" r="0.8" fill="rgba(16,185,129,0.15)" />
          <rect x="25" y="82" width="50" height="14" rx="0" fill="none" stroke="rgba(16,185,129,0.07)" strokeWidth="0.3" />
          <rect x="25" y="4" width="50" height="14" rx="0" fill="none" stroke="rgba(16,185,129,0.07)" strokeWidth="0.3" />
          <rect x="35" y="90" width="30" height="6" rx="0" fill="none" stroke="rgba(16,185,129,0.05)" strokeWidth="0.25" />
          <rect x="35" y="4" width="30" height="6" rx="0" fill="none" stroke="rgba(16,185,129,0.05)" strokeWidth="0.25" />
          {/* Penalty arcs */}
          <path d="M 38 82 Q 50 76, 62 82" fill="none" stroke="rgba(16,185,129,0.06)" strokeWidth="0.25" />
          <path d="M 38 18 Q 50 24, 62 18" fill="none" stroke="rgba(16,185,129,0.06)" strokeWidth="0.25" />
        </svg>

        {/* Formation connection lines */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ zIndex: 2 }}>
          {homeForm.rows.map((row, ri) =>
            row.length > 1 ? (
              <line key={`hr-${ri}`}
                x1={homeForm.positions[row[0]][0]} y1={homeForm.positions[row[0]][1]}
                x2={homeForm.positions[row[row.length - 1]][0]} y2={homeForm.positions[row[row.length - 1]][1]}
                stroke="rgba(16,185,129,0.1)" strokeWidth="0.25" strokeDasharray="1 1"
              />
            ) : null
          )}
          {awayForm.rows.map((row, ri) => {
            if (row.length <= 1) return null;
            const p1 = mirrorPos(awayForm.positions[row[0]]);
            const p2 = mirrorPos(awayForm.positions[row[row.length - 1]]);
            return (
              <line key={`ar-${ri}`}
                x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]}
                stroke="rgba(59,130,246,0.1)" strokeWidth="0.25" strokeDasharray="1 1"
              />
            );
          })}
        </svg>

        {/* Home players — emerald glow, bottom half */}
        {homeForm.positions.map((pos, i) => {
          if (i >= homePlayers.length) return null;
          const p = homePlayers[i];
          const active = activePlayer?.side === 'home' && activePlayer?.idx === i;
          return (
            <motion.div
              key={`h-${i}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 20 }}
              className="absolute flex flex-col items-center cursor-pointer"
              style={{ left: `${pos[0]}%`, top: `${pos[1]}%`, transform: 'translate(-50%, -50%)', zIndex: active ? 20 : 10 }}
              onClick={() => handleTap('home', i)}
            >
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 border-[0.5px]',
                active
                  ? 'bg-emerald-500/30 border-emerald-400/50 shadow-[0_0_14px_rgba(16,185,129,0.45)] scale-110'
                  : 'bg-emerald-500/15 border-emerald-500/25 shadow-[0_0_6px_rgba(16,185,129,0.15)]'
              )} style={{ backdropFilter: 'blur(8px)' }}>
                <span className="text-[9px] text-emerald-700/80 jersey-num" style={{ fontWeight: 200 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <span className="text-[7px] text-emerald-800/70 font-medium whitespace-nowrap mt-0.5 tracking-tight drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]">
                {p.name}
              </span>
              <AnimatePresence>
                {active && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="absolute -bottom-9 whitespace-nowrap bg-gray-900/85 backdrop-blur-xl text-white text-[9px] px-2.5 py-1 rounded-full shadow-lg z-30"
                  >
                    {p.name}
                    <span className="text-emerald-300/60 ml-1.5 text-[8px]">{p.pos}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {/* Away players — blue glow, top half (mirrored) */}
        {awayForm.positions.map((pos, i) => {
          if (i >= awayPlayers.length) return null;
          const p = awayPlayers[i];
          const [mx, my] = mirrorPos(pos);
          const active = activePlayer?.side === 'away' && activePlayer?.idx === i;
          return (
            <motion.div
              key={`a-${i}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 + i * 0.04, type: 'spring', stiffness: 300, damping: 20 }}
              className="absolute flex flex-col items-center cursor-pointer"
              style={{ left: `${mx}%`, top: `${my}%`, transform: 'translate(-50%, -50%)', zIndex: active ? 20 : 10 }}
              onClick={() => handleTap('away', i)}
            >
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 border-[0.5px]',
                active
                  ? 'bg-blue-500/30 border-blue-400/50 shadow-[0_0_14px_rgba(59,130,246,0.45)] scale-110'
                  : 'bg-blue-500/15 border-blue-500/25 shadow-[0_0_6px_rgba(59,130,246,0.15)]'
              )} style={{ backdropFilter: 'blur(8px)' }}>
                <span className="text-[9px] text-blue-700/80 jersey-num" style={{ fontWeight: 200 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <span className="text-[7px] text-blue-800/70 font-medium whitespace-nowrap mt-0.5 tracking-tight drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]">
                {p.name}
              </span>
              <AnimatePresence>
                {active && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="absolute -top-9 whitespace-nowrap bg-gray-900/85 backdrop-blur-xl text-white text-[9px] px-2.5 py-1 rounded-full shadow-lg z-30"
                  >
                    {p.name}
                    <span className="text-blue-300/60 ml-1.5 text-[8px]">{p.pos}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border-[0.5px] border-emerald-500/30" />
          <span className="text-[10px] text-gray-400 tracking-tight">{homeTeam}</span>
        </div>
        <span className="text-[8px] text-gray-200">|</span>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500/20 border-[0.5px] border-blue-500/30" />
          <span className="text-[10px] text-gray-400 tracking-tight">{awayTeam}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Match Progress Bar (1px with glowing tip) ───
function MatchProgressBar({ minute }: { minute: number }) {
  const progress = Math.min((minute / 90) * 100, 100);

  return (
    <div className="relative w-full h-[1px] bg-gray-100/60">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500/60 to-red-500"
      />
      <motion.div
        initial={{ left: 0 }}
        animate={{ left: `${progress}%` }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="absolute top-1/2 -translate-y-1/2 w-[6px] h-[6px] rounded-full bg-red-500 progress-tip -ml-[3px]"
      />
    </div>
  );
}

// ─── Liquid Fill Win Probability ───
function LiquidFillProbBar({ home, draw, away, homeTeam, awayTeam }: { home: number; draw: number; away: number; homeTeam: string; awayTeam: string }) {
  const total = home + draw + away;
  const homeP = (home / total) * 100;
  const drawP = (draw / total) * 100;
  const awayP = (away / total) * 100;
  const needlePos = homeP;

  return (
    <div>
      {/* Large hero numbers row */}
      <div className="flex items-end justify-between mb-5">
        <div className="flex flex-col items-start">
          <span className="text-[9px] text-gray-300 font-medium tracking-[0.16em] uppercase mb-1">主胜</span>
          <span className="text-[28px] font-semibold text-emerald-500 mono-time leading-none tracking-tighter">
            <NumberTicker value={`${home}`} delay={0} />
            <span className="text-[16px] font-normal text-emerald-400/60 ml-0.5">%</span>
          </span>
          <span className="text-[10px] text-gray-300 font-normal mt-1 tracking-tight">{homeTeam}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-[9px] text-gray-300 font-medium tracking-[0.16em] uppercase mb-1">平局</span>
          <span className="text-[20px] font-normal text-gray-400 mono-time leading-none tracking-tighter">
            <NumberTicker value={`${draw}`} delay={200} />
            <span className="text-[12px] font-normal text-gray-300/50 ml-0.5">%</span>
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] text-gray-300 font-medium tracking-[0.16em] uppercase mb-1">客胜</span>
          <span className="text-[28px] font-semibold text-sky-500 mono-time leading-none tracking-tighter">
            <NumberTicker value={`${away}`} delay={100} />
            <span className="text-[16px] font-normal text-sky-400/60 ml-0.5">%</span>
          </span>
          <span className="text-[10px] text-gray-300 font-normal mt-1 tracking-tight">{awayTeam}</span>
        </div>
      </div>

      {/* Liquid fill bar with blooming gradients */}
      <div className="relative h-3 rounded-full overflow-hidden bg-gray-100/30 backdrop-blur-sm">
        {/* Emerald liquid fill — home */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${homeP}%` }}
          transition={{ duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="absolute top-0 left-0 h-full liquid-fill-home"
          style={{
            borderRadius: '9999px 0 0 9999px',
            background: 'linear-gradient(90deg, rgba(16,185,129,0.25) 0%, rgba(16,185,129,0.55) 40%, rgba(16,185,129,0.8) 80%, rgba(52,211,153,0.95) 100%)',
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), 0 0 12px rgba(16,185,129,0.15)',
          }}
        />
        {/* Neutral draw fill */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${drawP}%`, left: `${homeP}%` }}
          transition={{ duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 }}
          className="absolute top-0 h-full"
          style={{
            background: 'linear-gradient(90deg, rgba(209,213,219,0.2), rgba(209,213,219,0.35), rgba(209,213,219,0.2))',
          }}
        />
        {/* Sky blue liquid fill — away */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${awayP}%` }}
          transition={{ duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.25 }}
          className="absolute top-0 right-0 h-full"
          style={{
            borderRadius: '0 9999px 9999px 0',
            background: 'linear-gradient(270deg, rgba(56,189,248,0.25) 0%, rgba(56,189,248,0.55) 40%, rgba(56,189,248,0.8) 80%, rgba(125,211,252,0.95) 100%)',
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), 0 0 12px rgba(56,189,248,0.15)',
          }}
        />

        {/* Liquid shimmer overlay */}
        <div className="absolute inset-0 liquid-shimmer" />

        {/* Vibrating needle */}
        <motion.div
          initial={{ left: '0%' }}
          animate={{ left: `${needlePos}%` }}
          transition={{ duration: 1.6, ease: 'easeOut' }}
          className="absolute top-1/2 -translate-y-1/2 -ml-[1px] needle-vibrate z-10"
        >
          <div className="w-[2px] h-5 bg-gray-900/80 rounded-full" style={{ boxShadow: '0 0 4px rgba(0,0,0,0.15)' }} />
        </motion.div>
      </div>

      {/* Multi-step gradient legend bar */}
      <div className="flex items-center gap-0 mt-2 h-[2px] rounded-full overflow-hidden">
        <div style={{ width: `${homeP}%` }} className="h-full bg-gradient-to-r from-emerald-300/30 to-emerald-500/50 rounded-l-full" />
        <div style={{ width: `${drawP}%` }} className="h-full bg-gray-200/30" />
        <div style={{ width: `${awayP}%` }} className="h-full bg-gradient-to-l from-sky-300/30 to-sky-500/50 rounded-r-full" />
      </div>
    </div>
  );
}

// ─── Possession Donut (Apple Watch Activity Ring) ───
function PossessionDonut({ home, away, homeTeam, awayTeam }: { home: number; away: number; homeTeam: string; awayTeam: string }) {
  const outerR = 42;
  const innerR = 34;
  const strokeOuter = 5;
  const strokeInner = 4;
  const circumOuter = 2 * Math.PI * outerR;
  const circumInner = 2 * Math.PI * innerR;
  const homeArc = (home / 100) * circumOuter;
  const awayArc = (away / 100) * circumInner;

  return (
    <div className="flex items-center gap-5">
      {/* SVG Donut */}
      <div className="relative w-[100px] h-[100px] shrink-0">
        <svg width="100" height="100" viewBox="0 0 100 100">
          {/* Background rings */}
          <circle cx="50" cy="50" r={outerR} fill="none" stroke="rgba(0,0,0,0.03)" strokeWidth={strokeOuter} />
          <circle cx="50" cy="50" r={innerR} fill="none" stroke="rgba(0,0,0,0.03)" strokeWidth={strokeInner} />
          {/* Home ring — emerald */}
          <motion.circle
            cx="50" cy="50" r={outerR} fill="none"
            stroke="url(#emeraldGrad)"
            strokeWidth={strokeOuter}
            strokeLinecap="round"
            strokeDasharray={`${homeArc} ${circumOuter}`}
            initial={{ strokeDashoffset: circumOuter }}
            animate={{ strokeDashoffset: circumOuter - homeArc }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
            transform="rotate(-90 50 50)"
          />
          {/* Away ring — sky blue */}
          <motion.circle
            cx="50" cy="50" r={innerR} fill="none"
            stroke="url(#skyGrad)"
            strokeWidth={strokeInner}
            strokeLinecap="round"
            strokeDasharray={`${awayArc} ${circumInner}`}
            initial={{ strokeDashoffset: circumInner }}
            animate={{ strokeDashoffset: circumInner - awayArc }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.4 }}
            transform="rotate(-90 50 50)"
          />
          {/* Glow endpoints */}
          <motion.circle
            cx="50" cy={50 - outerR} r="3" fill="rgba(16,185,129,0.6)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.3 }}
            style={{ filter: 'blur(1px)' }}
            transform={`rotate(${(home / 100) * 360 - 90} 50 50)`}
          />
          <motion.circle
            cx="50" cy={50 - innerR} r="2.5" fill="rgba(56,189,248,0.6)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            style={{ filter: 'blur(1px)' }}
            transform={`rotate(${(away / 100) * 360 - 90} 50 50)`}
          />
          <defs>
            <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(16,185,129,0.9)" />
              <stop offset="100%" stopColor="rgba(52,211,153,0.6)" />
            </linearGradient>
            <linearGradient id="skyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(56,189,248,0.9)" />
              <stop offset="100%" stopColor="rgba(125,211,252,0.6)" />
            </linearGradient>
          </defs>
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[8px] text-gray-300 font-medium tracking-[0.14em] uppercase">控球</span>
        </div>
      </div>

      {/* Labels */}
      <div className="flex-1 space-y-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500/60" style={{ boxShadow: '0 0 4px rgba(16,185,129,0.4)' }} />
            <span className="text-[10px] text-gray-400 font-normal tracking-tight">{homeTeam}</span>
          </div>
          <span className="text-[22px] font-semibold text-emerald-500 mono-time leading-none ml-4">
            <NumberTicker value={`${home}`} delay={400} />
            <span className="text-[13px] font-normal text-emerald-400/50 ml-0.5">%</span>
          </span>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-2 h-2 rounded-full bg-sky-500/60" style={{ boxShadow: '0 0 4px rgba(56,189,248,0.4)' }} />
            <span className="text-[10px] text-gray-400 font-normal tracking-tight">{awayTeam}</span>
          </div>
          <span className="text-[22px] font-semibold text-sky-500 mono-time leading-none ml-4">
            <NumberTicker value={`${away}`} delay={600} />
            <span className="text-[13px] font-normal text-sky-400/50 ml-0.5">%</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Row with Glow Sparkline + Frosted Tooltip ───
function StatSparkRow({ label, home, away, index }: { label: string; home: string; away: string; index: number }) {
  const homeNum = parseFloat(home.replace(/[^0-9.]/g, ''));
  const awayNum = parseFloat(away.replace(/[^0-9.]/g, ''));
  const max = Math.max(homeNum, awayNum) || 1;
  const homeW = (homeNum / max) * 100;
  const awayW = (awayNum / max) * 100;
  const delay = index * 0.08;
  const homeLeads = homeNum >= awayNum;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="py-3.5 border-b border-gray-100/20 last:border-0 relative"
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {/* Label — centered, caps-style */}
      <div className="text-center mb-3">
        <span className="text-[9px] text-gray-300 font-medium tracking-[0.16em] uppercase">{label}</span>
      </div>

      {/* Sparkline bars + numbers */}
      <div className="flex items-center gap-3">
        {/* Home number */}
        <span className="text-[14px] font-semibold text-emerald-500 w-[52px] text-right mono-time leading-none">
          <NumberTicker value={home} delay={delay * 1000} />
        </span>

        {/* Dual sparkline with glow point */}
        <div className="flex-1 flex flex-col gap-1.5">
          {/* Home bar */}
          <div className="relative h-[3px] rounded-full bg-gray-100/40">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${homeW}%` }}
              transition={{ duration: 0.9, delay, ease: 'easeOut' }}
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: 'linear-gradient(90deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.55) 60%, rgba(16,185,129,0.9) 100%)',
              }}
            />
            {homeLeads && (
              <motion.div
                initial={{ left: 0, opacity: 0 }}
                animate={{ left: `${homeW}%`, opacity: 1 }}
                transition={{ duration: 0.9, delay: delay + 0.1, ease: 'easeOut' }}
                className="absolute top-1/2 -translate-y-1/2 -ml-[2.5px] w-[5px] h-[5px] rounded-full bg-emerald-400"
                style={{ boxShadow: '0 0 8px rgba(16,185,129,0.6), 0 0 3px rgba(16,185,129,0.8)' }}
              />
            )}
          </div>
          {/* Away bar */}
          <div className="relative h-[3px] rounded-full bg-gray-100/40">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${awayW}%` }}
              transition={{ duration: 0.9, delay: delay + 0.05, ease: 'easeOut' }}
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: 'linear-gradient(90deg, rgba(56,189,248,0.12) 0%, rgba(56,189,248,0.55) 60%, rgba(56,189,248,0.9) 100%)',
              }}
            />
            {!homeLeads && (
              <motion.div
                initial={{ left: 0, opacity: 0 }}
                animate={{ left: `${awayW}%`, opacity: 1 }}
                transition={{ duration: 0.9, delay: delay + 0.15, ease: 'easeOut' }}
                className="absolute top-1/2 -translate-y-1/2 -ml-[2.5px] w-[5px] h-[5px] rounded-full bg-sky-400"
                style={{ boxShadow: '0 0 8px rgba(56,189,248,0.6), 0 0 3px rgba(56,189,248,0.8)' }}
              />
            )}
          </div>
        </div>

        {/* Away number */}
        <span className="text-[14px] font-semibold text-sky-500 w-[52px] text-left mono-time leading-none">
          <NumberTicker value={away} delay={(delay + 0.05) * 1000} />
        </span>
      </div>

      {/* Frosted glass tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.18 }}
            className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur-2xl text-white text-[9px] px-3 py-1.5 rounded-xl shadow-lg z-30 whitespace-nowrap border-[0.5px] border-white/10"
          >
            <span className="text-emerald-300">{home}</span>
            <span className="text-gray-500 mx-2">vs</span>
            <span className="text-sky-300">{away}</span>
            <span className="text-gray-500 ml-2">· {homeLeads ? '主队占优' : '客队占优'}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Mock data ───
function getMockAnalysis(home: string, away: string, sport: string) {
  const isFootball = sport === 'football';
  return {
    winProb: { home: 42, draw: 26, away: 32 },
    stats: isFootball ? [
      { label: '近10场胜率', home: '70%', away: '60%' },
      { label: '场均进球', home: '2.1', away: '1.8' },
      { label: '场均失球', home: '0.8', away: '1.1' },
      { label: '控球率', home: '58%', away: '52%' },
      { label: '射正率', home: '45%', away: '38%' },
      { label: '角球/场', home: '6.2', away: '5.1' },
    ] : [
      { label: '近10场胜率', home: '70%', away: '55%' },
      { label: '场均得分', home: '112.5', away: '108.2' },
      { label: '场均失分', home: '104.3', away: '106.8' },
      { label: '三分命中率', home: '38.2%', away: '35.6%' },
      { label: '篮板/场', home: '44.5', away: '42.1' },
      { label: '助攻/场', home: '26.3', away: '24.8' },
    ],
    h2h: [
      { date: '2025-12-15', score: `${home} 2 - 1 ${away}`, result: 'home', stat: '控球率 55%', league: '英超' },
      { date: '2025-09-22', score: `${away} 3 - 2 ${home}`, result: 'away', stat: '射正 6次', league: '英超' },
      { date: '2025-04-08', score: `${home} 1 - 1 ${away}`, result: 'draw', stat: '控球率 51%', league: '足总杯' },
      { date: '2024-11-30', score: `${away} 0 - 1 ${home}`, result: 'home', stat: '角球 7个', league: '英超' },
      { date: '2024-08-12', score: `${home} 2 - 2 ${away}`, result: 'draw', stat: '射正 5次', league: '社区盾' },
    ],
    recentHome: [
      { vs: '对手A', score: '3-1', result: 'win' as const },
      { vs: '对手B', score: '2-0', result: 'win' as const },
      { vs: '对手C', score: '1-1', result: 'draw' as const },
      { vs: '对手D', score: '2-1', result: 'win' as const },
      { vs: '对手E', score: '0-1', result: 'lose' as const },
    ],
    recentAway: [
      { vs: '对手F', score: '2-1', result: 'win' as const },
      { vs: '对手G', score: '0-2', result: 'lose' as const },
      { vs: '对手H', score: '1-0', result: 'win' as const },
      { vs: '对手I', score: '1-3', result: 'lose' as const },
      { vs: '对手J', score: '2-2', result: 'draw' as const },
    ],
    homeLineup: isFootball
      ? { formation: '4-3-3', players: ['GK · 拉亚', 'RB · 萨利巴', 'CB · 加布里埃尔', 'CB · 基维奥尔', 'LB · 津琴科', 'CM · 厄德高', 'CM · 赖斯', 'CM · 哈弗茨', 'RW · 萨卡', 'ST · 热苏斯', 'LW · 特罗萨德'] }
      : { formation: '首发5人', players: ['PG · 怀特', 'SG · 布朗', 'SF · 塔图姆', 'PF · 波尔津吉斯', 'C · 霍福德'] },
    awayLineup: isFootball
      ? { formation: '4-2-3-1', players: ['GK · 埃德森', 'RB · 沃克', 'CB · 迪亚斯', 'CB · 斯通斯', 'LB · 格瓦迪奥尔', 'DM · 罗德里', 'DM · 科瓦契奇', 'RW · 席尔瓦', 'AM · 德布劳内', 'LW · 格拉利什', 'ST · 哈兰德'] }
      : { formation: '首发5人', players: ['PG · 吉迪', 'SG · 亚历山大', 'SF · 多特', 'PF · 威廉姆斯', 'C · 霍尔姆格伦'] },
    intel: [
      { type: 'injury' as const, team: home, text: `${home}核心球员膝伤未愈，出战成疑，主帅表示将赛前评估决定。` },
      { type: 'form' as const, team: home, text: `${home}近5场4胜1平保持不败，主场气势正盛。` },
      { type: 'injury' as const, team: away, text: `${away}中场核心因国家队赛事轻伤，预计可出战但状态存疑。` },
      { type: 'tactic' as const, team: away, text: `${away}客场近3轮采用防守反击战术，场均控球仅42%。` },
      { type: 'weather' as const, team: 'neutral', text: '比赛日预计多云，气温18°C，微风，场地状况良好。' },
      { type: 'referee' as const, team: 'neutral', text: '主裁判本赛季场均出示黄牌3.8张，判罚尺度偏严。' },
    ],
    strategyText: `综合数据模型分析，建议关注「${home}不败」方向。${home}近期主场强势，核心数据全面占优。可关注胜平双选或让球主+1。`,
  };
}

// ─── Main Component ───
export default function MatchDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const match = location.state as any;
  const [tab, setTab] = useState<DetailTab>('analysis');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [beamProgress, setBeamProgress] = useState(0.1);
  const [expandedH2H, setExpandedH2H] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => setScrolled(el.scrollTop > 10);
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  // Tracing beam scroll tracking for H2H timeline
  useEffect(() => {
    if (tab !== 'h2h') { setBeamProgress(0.1); return; }
    const scrollEl = scrollRef.current;
    const timelineEl = timelineRef.current;
    if (!scrollEl || !timelineEl) return;

    const track = () => {
      const timelineTop = timelineEl.offsetTop;
      const timelineH = timelineEl.offsetHeight;
      if (timelineH === 0) return;
      const visibleLine = scrollEl.scrollTop + scrollEl.clientHeight * 0.6;
      const p = (visibleLine - timelineTop) / timelineH;
      setBeamProgress(Math.max(0.06, Math.min(1, p)));
    };

    const t = setTimeout(() => {
      track();
      scrollEl.addEventListener('scroll', track, { passive: true });
    }, 60);
    return () => { clearTimeout(t); scrollEl.removeEventListener('scroll', track); };
  }, [tab]);

  if (!match) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-[#FAFBFC]">
        <p className="text-gray-300 text-[14px] font-normal tracking-wide">无比赛数据</p>
        <button onClick={() => navigate('/schedule')} className="mt-4 text-emerald-500 text-[13px] font-medium tracking-wide">返回赛程</button>
      </div>
    );
  }

  const data = getMockAnalysis(match.home, match.away, match.sport);
  const [homeColor] = teamColors[match.home] || ['#6B7280'];
  const [awayColor] = teamColors[match.away] || ['#6B7280'];
  const isLive = match.status === 'live';
  const isUpcoming = match.status === 'upcoming';

  const tabs: { key: DetailTab; label: string; icon: React.ReactNode }[] = [
    { key: 'analysis', label: '分析', icon: <BarChart3 size={13} strokeWidth={1.8} /> },
    { key: 'h2h', label: '战绩', icon: <TrendingUp size={13} strokeWidth={1.8} /> },
    { key: 'lineup', label: '阵容', icon: <Users size={13} strokeWidth={1.8} /> },
    { key: 'intel', label: '情报', icon: <Newspaper size={13} strokeWidth={1.8} /> },
  ];

  const resultDot = (r: string) => {
    if (r === 'win' || r === 'home') return 'bg-emerald-500';
    if (r === 'lose' || r === 'away') return 'bg-red-400';
    return 'bg-gray-200';
  };

  const intelIcon = (type: string) => {
    if (type === 'injury') return <AlertTriangle size={13} strokeWidth={1.8} className="text-red-400" />;
    if (type === 'form') return <Zap size={13} strokeWidth={1.8} className="text-emerald-500" />;
    if (type === 'tactic') return <Target size={13} strokeWidth={1.8} className="text-blue-400" />;
    return <Activity size={13} strokeWidth={1.8} className="text-gray-300" />;
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-[#FAFBFC]">

      {/* ═══ Dynamic Blur Background — team colors bleeding ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute -top-20 -left-16 w-80 h-80 rounded-full blur-[80px] opacity-[0.06]"
          style={{ backgroundColor: homeColor }}
        />
        <div
          className="absolute -top-16 -right-20 w-80 h-80 rounded-full blur-[80px] opacity-[0.06]"
          style={{ backgroundColor: awayColor }}
        />
        <div className="aurora-3 absolute bottom-40 left-1/4 w-60 h-60 rounded-full bg-gradient-to-tr from-emerald-100/8 via-cyan-100/5 to-transparent blur-3xl" />
      </div>

      {/* Noise */}
      <div className="noise-overlay" />

      {/* ═══ Match Progress Bar (top 1px) ═══ */}
      {isLive && match.minute && (
        <div className="relative z-30 shrink-0">
          <MatchProgressBar minute={match.minute} />
        </div>
      )}

      {/* ═══ Header — Frosted glass, shrinks on scroll ═══ */}
      <motion.header
        className={cn(
          'relative z-20 shrink-0 px-4 flex items-center transition-all duration-500',
          scrolled
            ? 'py-2 bg-white/60 backdrop-blur-2xl border-b border-white/30'
            : 'py-3'
        )}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/50 backdrop-blur-xl border border-white/30 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft size={18} strokeWidth={2} />
        </button>
        <motion.h1
          animate={{ fontSize: scrolled ? '14px' : '16px' }}
          transition={{ duration: 0.3 }}
          className="flex-1 text-center font-semibold text-gray-900 tracking-tight"
        >
          {match.league}
        </motion.h1>
        <div className="w-8" />
      </motion.header>

      {/* ═══ Hero Scoreboard — Frosted Glass ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mx-5 mb-1 rounded-3xl bg-white/50 backdrop-blur-[40px] border-[0.5px] border-white/40 shadow-[0_4px_32px_rgba(0,0,0,0.03)] overflow-hidden shrink-0"
      >
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between">
            {/* Home */}
            <div className="flex flex-col items-center gap-1.5 w-[85px] cursor-pointer active:scale-95 transition-transform" onClick={() => setSelectedTeam(match.home)}>
              <TeamBadge name={match.home} size={52} />
              <span className="text-[13px] font-semibold text-gray-800 text-center leading-tight tracking-tight">{match.home}</span>
            </div>

            {/* Score Center */}
            <div className="flex flex-col items-center gap-1">
              {isUpcoming ? (
                <>
                  <span className="text-[26px] font-bold text-gray-800 mono-time tracking-tight">{match.time}</span>
                  <span className="text-[10px] text-gray-300 font-medium tracking-[0.1em]">未开赛</span>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <motion.span
                      key={`h-${match.homeScore}`}
                      initial={{ scale: 1.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                      className="text-[36px] font-extralight text-gray-900 tabular-nums tracking-tighter"
                      style={{ fontWeight: 200 }}
                    >
                      {match.homeScore}
                    </motion.span>
                    <span className="text-[16px] font-extralight text-gray-200">:</span>
                    <motion.span
                      key={`a-${match.awayScore}`}
                      initial={{ scale: 1.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                      className="text-[36px] font-extralight text-gray-900 tabular-nums tracking-tighter"
                      style={{ fontWeight: 200 }}
                    >
                      {match.awayScore}
                    </motion.span>
                  </div>
                  {isLive ? (
                    <span className="flex items-center gap-1.5 text-[12px] font-bold text-red-500 minute-glow mono-time">
                      <span className="relative flex h-1.5 w-1.5 live-pulse">
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
                      </span>
                      {match.minute}'
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-300 font-medium tracking-[0.1em]">完场</span>
                  )}
                </>
              )}
            </div>

            {/* Away */}
            <div className="flex flex-col items-center gap-1.5 w-[85px] cursor-pointer active:scale-95 transition-transform" onClick={() => setSelectedTeam(match.away)}>
              <TeamBadge name={match.away} size={52} />
              <span className="text-[13px] font-semibold text-gray-800 text-center leading-tight tracking-tight">{match.away}</span>
            </div>
          </div>

          {/* Meta */}
          <div className="flex items-center justify-center gap-3 mt-3">
            <span className="text-[10px] text-gray-300 tracking-[0.08em]">{match.league}</span>
            <span className="w-[3px] h-[3px] rounded-full bg-gray-200" />
            <span className="text-[10px] text-gray-300 tracking-[0.08em] mono-time">{match.time}</span>
          </div>
        </div>
      </motion.div>

      {/* ═══ Tab Bar — Magnetic Tabs with spring pill ═══ */}
      <div className="relative z-10 px-5 pt-3 pb-1 shrink-0">
        <div className="relative flex bg-white/40 backdrop-blur-2xl border-[0.5px] border-white/30 rounded-2xl p-1">
          {/* Sliding pill */}
          <motion.div
            className="absolute top-1 bottom-1 rounded-[14px] bg-white/80 backdrop-blur-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border-[0.5px] border-white/50"
            initial={false}
            animate={{
              left: `calc(${(tabs.findIndex(t => t.key === tab) / tabs.length) * 100}% + 4px)`,
              width: `calc(${100 / tabs.length}% - 8px)`,
            }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          />
          {tabs.map(t => (
            <MagneticTab key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
              {t.icon} {t.label}
            </MagneticTab>
          ))}
        </div>
      </div>

      {/* ═══ Tab Content — Scrollable ═══ */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar relative z-10 px-5 pb-8 pt-3 space-y-3">
        <AnimatePresence mode="wait">
          {/* ═══ Analysis Tab — Precision Data Dashboard ═══ */}
          {tab === 'analysis' && (
            <motion.div key="analysis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2.5">

              {/* ── Bento Row 1: Win Probability — Liquid Fill ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="rounded-3xl bg-white/50 backdrop-blur-[40px] border-[0.5px] border-white/40 shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-5"
              >
                <h3 className="text-[9px] font-medium text-gray-300 tracking-[0.16em] uppercase mb-5">FORETELL AI 胜率预测</h3>
                <LiquidFillProbBar home={data.winProb.home} draw={data.winProb.draw} away={data.winProb.away} homeTeam={match.home} awayTeam={match.away} />
              </motion.div>

              {/* ── Bento Row 2: 2-column grid — Possession Donut + Key Metric ── */}
              {(() => {
                const possessionStat = data.stats.find(s => s.label === '控球率');
                const possHome = possessionStat ? parseFloat(possessionStat.home) : 55;
                const possAway = possessionStat ? parseFloat(possessionStat.away) : 45;
                const shotStat = data.stats.find(s => s.label === '射正率' || s.label === '三分命中率');
                return (
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Possession Donut */}
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.06 }}
                      className="col-span-2 rounded-3xl bg-white/50 backdrop-blur-[40px] border-[0.5px] border-white/40 shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-5"
                    >
                      <h3 className="text-[9px] font-medium text-gray-300 tracking-[0.16em] uppercase mb-4">控球率 · POSSESSION</h3>
                      <PossessionDonut home={possHome} away={possAway} homeTeam={match.home} awayTeam={match.away} />
                    </motion.div>
                  </div>
                );
              })()}

              {/* ── Bento Row 3: Stats Comparison — Glow Sparklines ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.12 }}
                className="rounded-3xl bg-white/50 backdrop-blur-[40px] border-[0.5px] border-white/40 shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-5"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-semibold text-emerald-500 tracking-tight">{match.home}</span>
                  <h3 className="text-[9px] font-medium text-gray-300 tracking-[0.16em] uppercase">核心数据对比</h3>
                  <span className="text-[10px] font-semibold text-sky-500 tracking-tight">{match.away}</span>
                </div>
                {data.stats.filter(s => s.label !== '控球率').map((s, i) => (
                  <StatSparkRow key={i} label={s.label} home={s.home} away={s.away} index={i} />
                ))}
              </motion.div>

              {/* ── Bento Row 4: AI Strategy — Charcoal Glass with Rotating Gold Glow ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.18 }}
                className="relative rounded-3xl overflow-hidden"
              >
                {/* Rotating gradient glow border */}
                <div className="absolute inset-0 rounded-3xl rotating-glow-border" />
                {/* Inner card */}
                <div className="relative m-[1px] rounded-[23px] bg-gray-900/92 backdrop-blur-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center icon-glow"
                      style={{ '--glow-color': 'rgba(245,158,11,0.15)', backgroundColor: 'rgba(245,158,11,0.1)' } as React.CSSProperties}
                    >
                      <Zap size={13} strokeWidth={2} className="text-amber-400" />
                    </div>
                    <span className="text-[9px] text-amber-400/80 font-medium tracking-[0.14em] uppercase">FORETELL 策略建议</span>
                  </div>
                  <div className="text-[13px] leading-[2] text-gray-400 font-normal tracking-wide">
                    <TypewriterText
                      text={data.strategyText}
                      delay={300}
                    />
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ═══ H2H Tab — Tracing Beam Timeline ═══ */}
          {tab === 'h2h' && (
            <motion.div key="h2h" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

              {/* ── Dot matrix background overlay ── */}
              <div className="absolute inset-0 dot-matrix pointer-events-none z-0" />

              {/* ── Recent Form Summary — Floating 3D Glass Pills ── */}
              <div className="mb-5">
                <h3 className="text-[9px] font-medium text-gray-300 tracking-[0.16em] uppercase mb-3">近5场走势 · RECENT FORM</h3>
                <div className="flex gap-2">
                  {data.h2h.map((m, i) => {
                    const r = m.result;
                    const label = r === 'home' ? '胜' : r === 'away' ? '负' : '平';
                    return (
                      <motion.button
                        key={i}
                        initial={{ scale: 0, opacity: 0, rotateX: -20 }}
                        animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                        transition={{ delay: i * 0.07, type: 'spring', stiffness: 350, damping: 22 }}
                        onClick={() => {
                          setExpandedH2H(i);
                          const card = document.getElementById(`h2h-card-${i}`);
                          card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className={cn(
                          'flex-1 py-2.5 rounded-2xl text-[11px] font-bold tracking-tight transition-all duration-300',
                          'backdrop-blur-xl border-[0.5px] shadow-[0_4px_16px_rgba(0,0,0,0.04)]',
                          r === 'home'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-[0_4px_16px_rgba(16,185,129,0.08)]'
                            : r === 'away'
                            ? 'bg-red-400/10 border-red-400/20 text-red-400 shadow-[0_4px_16px_rgba(248,113,113,0.08)]'
                            : 'bg-gray-200/20 border-gray-200/30 text-gray-400 shadow-[0_4px_16px_rgba(0,0,0,0.02)]'
                        )}
                        style={{ perspective: '600px', transformStyle: 'preserve-3d' }}
                        whileTap={{ scale: 0.93, rotateX: 5 }}
                      >
                        {label}
                      </motion.button>
                    );
                  })}
                </div>
                {/* Win/Draw/Loss legend pills */}
                <div className="flex items-center justify-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" style={{ boxShadow: '0 0 4px rgba(16,185,129,0.5)' }} />
                    <span className="text-[9px] text-gray-400 tracking-tight">{match.home}胜</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                    <span className="text-[9px] text-gray-400 tracking-tight">平</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" style={{ boxShadow: '0 0 4px rgba(248,113,113,0.5)' }} />
                    <span className="text-[9px] text-gray-400 tracking-tight">{match.away}胜</span>
                  </div>
                </div>
              </div>

              {/* ── Tracing Beam Timeline ── */}
              <div ref={timelineRef} className="relative pl-6 pb-4">
                {/* Vertical tracing beam line */}
                <div className="absolute left-[7px] top-0 bottom-0 w-[1px] bg-gray-100/50" />
                <motion.div
                  className="absolute left-[7px] top-0 w-[1px] origin-top tracing-beam-line"
                  style={{
                    background: 'linear-gradient(180deg, rgba(16,185,129,0.5) 0%, rgba(56,189,248,0.3) 60%, transparent 100%)',
                  }}
                  initial={{ height: '0%' }}
                  animate={{ height: `${beamProgress * 100}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />

                {/* Timeline nodes + cards */}
                {data.h2h.map((m, i) => {
                  const isExpanded = expandedH2H === i;
                  const nodeProgress = (i + 0.5) / data.h2h.length;
                  const isReached = beamProgress >= nodeProgress;
                  const r = m.result;
                  const glowColor = r === 'home'
                    ? 'rgba(16,185,129,0.7)'
                    : r === 'away'
                    ? 'rgba(248,113,113,0.7)'
                    : 'rgba(156,163,175,0.5)';
                  const bgDot = r === 'home'
                    ? 'bg-emerald-500'
                    : r === 'away'
                    ? 'bg-red-400'
                    : 'bg-gray-300';

                  return (
                    <div key={i} id={`h2h-card-${i}`} className="relative mb-4 last:mb-0">
                      {/* Glowing node dot */}
                      <motion.div
                        className={cn(
                          'absolute -left-6 top-5 w-[15px] h-[15px] rounded-full flex items-center justify-center z-10',
                        )}
                        initial={{ scale: 0.8, opacity: 0.6 }}
                        animate={{
                          scale: isReached ? 1 : 0.8,
                          opacity: isReached ? 1 : 0.6,
                        }}
                        transition={{ duration: 0.4, delay: i * 0.1, type: 'spring', stiffness: 300 }}
                      >
                        <div
                          className={cn('w-[7px] h-[7px] rounded-full', bgDot)}
                          style={{
                            boxShadow: isReached
                              ? `0 0 8px ${glowColor}, 0 0 16px ${glowColor}`
                              : 'none',
                            transition: 'box-shadow 0.5s ease',
                          }}
                        />
                      </motion.div>

                      {/* Match card — frosted glass with hover border gradient */}
                      <motion.div
                        initial={{ opacity: 0.7, x: 12 }}
                        animate={{
                          opacity: isReached ? 1 : 0.7,
                          x: isReached ? 0 : 12,
                        }}
                        transition={{ duration: 0.5, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
                        onClick={() => setExpandedH2H(isExpanded ? null : i)}
                        className={cn(
                          'relative rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300',
                          isExpanded ? 'ring-[0.5px] ring-white/30' : ''
                        )}
                      >
                        {/* Hover border gradient */}
                        <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 hover-border-gradient" />

                        <div className="relative rounded-2xl bg-white/45 backdrop-blur-[20px] border-[0.5px] border-white/40 shadow-[0_2px_16px_rgba(0,0,0,0.02)] p-4 m-[1px]">
                          {/* Top row: Score + Date */}
                          <div className="flex items-start justify-between mb-1.5">
                            <span className="text-[13px] font-semibold text-gray-800 tracking-tight leading-snug">{m.score}</span>
                            <span className="text-[9px] text-gray-300 font-normal tracking-[0.1em] mono-time uppercase shrink-0 ml-3 mt-0.5">{m.date}</span>
                          </div>

                          {/* League + Quick stat */}
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-gray-300 font-medium tracking-[0.08em] bg-gray-100/40 px-2 py-0.5 rounded-full">{m.league}</span>
                            <span className="text-[9px] text-gray-400 font-normal tracking-tight">{m.stat}</span>
                          </div>

                          {/* Expanded detail — TextRevealCard logic */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                className="overflow-hidden"
                              >
                                <div className="pt-3 mt-3 border-t border-gray-100/25 space-y-2">
                                  {/* Detailed stats grid */}
                                  <div className="grid grid-cols-3 gap-2">
                                    {[
                                      { label: '控球率', val: r === 'home' ? '55%' : r === 'away' ? '42%' : '51%' },
                                      { label: '射正', val: r === 'home' ? '6' : r === 'away' ? '3' : '4' },
                                      { label: '角球', val: r === 'home' ? '7' : r === 'away' ? '4' : '5' },
                                    ].map((s, si) => (
                                      <motion.div
                                        key={si}
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: si * 0.06 + 0.15 }}
                                        className="text-center"
                                      >
                                        <span className="text-[8px] text-gray-300 font-medium tracking-[0.12em] uppercase block mb-1">{s.label}</span>
                                        <span className="text-[15px] font-semibold text-gray-700 mono-time leading-none">{s.val}</span>
                                      </motion.div>
                                    ))}
                                  </div>
                                  {/* Result badge */}
                                  <div className="flex justify-center pt-1">
                                    <span className={cn(
                                      'text-[9px] font-medium px-3 py-1 rounded-full tracking-[0.08em]',
                                      r === 'home' ? 'bg-emerald-500/8 text-emerald-500 border-[0.5px] border-emerald-500/15'
                                        : r === 'away' ? 'bg-red-400/8 text-red-400 border-[0.5px] border-red-400/15'
                                        : 'bg-gray-200/30 text-gray-400 border-[0.5px] border-gray-200/30'
                                    )}>
                                      {r === 'home' ? `${match.home} 获胜` : r === 'away' ? `${match.away} 获胜` : '双方战平'}
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    </div>
                  );
                })}

                {/* Timeline end dot */}
                <motion.div
                  className="absolute left-[3.5px] bottom-0 w-[8px] h-[8px] rounded-full bg-gray-200/40"
                  initial={{ scale: 0 }}
                  animate={{ scale: beamProgress > 0.9 ? 1 : 0 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                />
              </div>

              {/* ── Record Summary Bar ── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-3 rounded-2xl bg-white/40 backdrop-blur-[20px] border-[0.5px] border-white/30 p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-gray-300 font-medium tracking-[0.16em] uppercase">总战绩</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-semibold text-emerald-500 mono-time">
                      {data.h2h.filter(m => m.result === 'home').length}胜
                    </span>
                    <span className="text-[11px] font-normal text-gray-300 mono-time">
                      {data.h2h.filter(m => m.result === 'draw').length}平
                    </span>
                    <span className="text-[11px] font-semibold text-red-400 mono-time">
                      {data.h2h.filter(m => m.result === 'away').length}负
                    </span>
                  </div>
                </div>
              </motion.div>

            </motion.div>
          )}

          {/* ═══ Lineup Tab — Visual Pitch (football) / Text List (basketball) ═══ */}
          {tab === 'lineup' && (
            <motion.div key="lineup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {match.sport === 'football' ? (
                <VisualPitch
                  homeLineup={data.homeLineup}
                  awayLineup={data.awayLineup}
                  homeTeam={match.home}
                  awayTeam={match.away}
                />
              ) : (
                /* Basketball fallback — simple text list per team */
                [{team: match.home, lineup: data.homeLineup, accent: 'emerald'}, {team: match.away, lineup: data.awayLineup, accent: 'blue'}].map((side) => (
                  <div key={side.team} className="rounded-3xl bg-white/50 backdrop-blur-[40px] border-[0.5px] border-white/40 shadow-[0_2px_20px_rgba(0,0,0,0.02)] overflow-hidden">
                    <div className="px-5 py-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <TeamBadge name={side.team} size={28} />
                        <span className="text-[13px] font-semibold text-gray-800 tracking-tight">{side.team}</span>
                      </div>
                      <span className="text-[10px] font-medium text-gray-300 tracking-[0.1em] bg-gray-100/30 px-2.5 py-0.5 rounded-full">
                        {side.lineup.formation}
                      </span>
                    </div>
                    <div className="px-5 pb-4 space-y-0">
                      {side.lineup.players.map((player, i) => {
                        const [position, name] = player.split(' · ');
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04, duration: 0.3 }}
                            className="flex items-center gap-3 py-2.5 border-b border-gray-100/20 last:border-0"
                          >
                            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] jersey-num bg-gray-100/40 text-gray-500">
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="text-[13px] font-medium text-gray-700 tracking-tight">{name}</span>
                              <span className="text-[10px] text-gray-300 ml-2 tracking-[0.08em]">{position}</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* ═══ Intel Tab ═══ */}
          {tab === 'intel' && (
            <motion.div key="intel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2.5">
              {data.intel.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-2xl bg-white/50 backdrop-blur-[40px] border-[0.5px] border-white/40 shadow-[0_2px_16px_rgba(0,0,0,0.02)] p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">{intelIcon(item.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        {item.team !== 'neutral' && (
                          <span className={cn(
                            'text-[9px] px-2 py-0.5 rounded-full font-medium tracking-[0.06em]',
                            item.team === match.home
                              ? 'bg-emerald-500/5 text-emerald-500 border-[0.5px] border-emerald-500/10'
                              : 'bg-blue-500/5 text-blue-500 border-[0.5px] border-blue-500/10'
                          )}>
                            {item.team}
                          </span>
                        )}
                        <span className="text-[9px] text-gray-300 font-medium tracking-[0.08em]">
                          {item.type === 'injury' ? '伤病' : item.type === 'form' ? '状态' : item.type === 'tactic' ? '战术' : '场外'}
                        </span>
                      </div>
                      <p className="text-[12px] text-gray-600 leading-[1.8] font-normal tracking-wide">{item.text}</p>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Intel Rating — Frosted amber */}
              <div className="relative rounded-3xl overflow-hidden mt-1">
                <div className="absolute inset-0 rounded-3xl rotating-glow-border opacity-40" />
                <div className="relative m-[1px] rounded-[23px] bg-amber-50/40 backdrop-blur-2xl border-[0.5px] border-amber-200/20 p-5">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Shield size={13} strokeWidth={1.8} className="text-amber-500/70" />
                    <span className="text-[10px] text-amber-600/70 font-medium tracking-[0.1em]">FORETELL 情报评级</span>
                  </div>
                  <p className="text-[12px] text-amber-800/70 leading-[1.8] font-normal tracking-wide">
                    综合情报分析，本场比赛<span className="font-medium text-amber-900/80">利好{match.home}</span>。关键球员伤情需赛前关注，建议结合最终首发名单调整策略。
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ Team Detail Modal ═══ */}
      <AnimatePresence>
        {selectedTeam && (
          <TeamDetailModal team={selectedTeam} onClose={() => setSelectedTeam(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
