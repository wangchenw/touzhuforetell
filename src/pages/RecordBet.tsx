import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronDown, ChevronLeft, ChevronUp, Camera, Check, Flame, ImagePlus, ScanText, Sigma } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { formatPassType } from '@/lib/ticket-display';
import { createTicket, recognizeTicketFull } from '@/lib/api';
import type {
  RecognizeAndCalculateResponse,
  Sport,
  TicketLeg,
  TicketPayoutScenario,
} from '@/lib/api';

type PageMode = 'choose' | 'camera';
type ScanPhase = 'idle' | 'scanning' | 'done';

function toNumeric(value: number | string) {
  return typeof value === 'number' ? value : Number.parseFloat(value);
}

function formatNumber(
  value: number | string,
  options: Intl.NumberFormatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },
) {
  const amount = toNumeric(value);
  if (Number.isNaN(amount)) return String(value);

  return new Intl.NumberFormat('zh-CN', options).format(amount);
}

function formatCurrency(value: number | string) {
  return formatNumber(value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatSport(sport: Sport) {
  return sport === 'football' ? '足球' : '篮球';
}

function formatTicketType(ticketType: string) {
  return ticketType === 'single' ? '单关' : '串关';
}

function getPotentialSingleReturn(odds: number | string, unitStake: number) {
  return toNumeric(odds) * unitStake;
}

function getWinningLegs(
  scenario: Partial<TicketPayoutScenario> | null | undefined,
  legs: TicketLeg[],
) {
  const winningLegIndices = Array.isArray(scenario?.winningLegIndices) ? scenario.winningLegIndices : [];

  return winningLegIndices
    .map((index) => legs.find((leg) => leg.index === index))
    .filter((leg): leg is TicketLeg => Boolean(leg));
}

function formatScenarioTitle(scenario: TicketPayoutScenario, legs: TicketLeg[]) {
  const winningLegs = getWinningLegs(scenario, legs);

  if (winningLegs.length === legs.length) {
    return `${legs.length}场全部命中`;
  }

  return winningLegs
    .map((leg) => leg.league || leg.match)
    .join(' + ');
}

function formatScenarioSubtitle(scenario: TicketPayoutScenario, legs: TicketLeg[]) {
  const winningLegs = getWinningLegs(scenario, legs);
  return winningLegs.map((leg) => leg.match).join(' · ');
}

function SuccessToast({
  legCount,
  scenarioCount,
}: {
  legCount: number;
  scenarioCount: number;
}) {
  return (
    <div className="rounded-2xl bg-emerald-50/95 backdrop-blur-xl border border-emerald-500/10 shadow-[0_4px_20px_rgba(16,185,129,0.06)] px-3.5 py-2.5 flex items-center gap-2.5">
      <div className="w-6 h-6 rounded-full bg-emerald-500/12 flex items-center justify-center shrink-0">
        <Check size={14} strokeWidth={2.8} className="text-emerald-600" />
      </div>
      <div className="min-w-0">
        <div className="text-[12px] font-semibold text-emerald-700 tracking-tight">识别并计算完成</div>
        <div className="text-[11px] text-emerald-700/70 tracking-wide">
          已拆分 {legCount} 场比赛，并生成 {scenarioCount} 种中奖场景
        </div>
      </div>
    </div>
  );
}

function OverviewBanner({
  recognized,
  betCount,
  unitStake,
  maxPayout,
}: {
  recognized: RecognizeAndCalculateResponse['recognized'];
  betCount: number;
  unitStake: number;
  maxPayout: number;
}) {
  return (
    <div className="rounded-[28px] bg-gradient-to-br from-emerald-50/95 via-white to-white backdrop-blur-[40px] border border-emerald-500/8 shadow-[0_10px_30px_rgba(16,185,129,0.06)] p-4">
      <div className="grid grid-cols-3 items-stretch rounded-2xl overflow-hidden border border-emerald-500/8 bg-white/72">
        {[
          {
            label: '类型',
            value: formatTicketType(recognized.ticketType),
            note: formatPassType(recognized.passType, recognized.legs.length, recognized.ticketType),
          },
          {
            label: '票面',
            value: `¥${formatCurrency(recognized.amount)}`,
            note: formatSport(recognized.sport),
          },
          {
            label: '注数',
            value: `${betCount}注`,
            note: `¥${formatCurrency(unitStake)}/注`,
          },
        ].map((item, index) => (
          <div
            key={item.label}
            className={cn(
              'px-3 py-3 min-w-0',
              index !== 0 && 'border-l border-emerald-500/10',
            )}
          >
            <div className="text-[10px] text-gray-400 tracking-[0.14em] uppercase">{item.label}</div>
            <div className="mt-2 text-[15px] font-semibold text-gray-800 tracking-tight [font-variant-numeric:tabular-nums]">
              {item.value}
            </div>
            <div className="mt-1 text-[11px] text-gray-400 tracking-wide">{item.note}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/12 px-3.5 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-700 bg-emerald-500/8 rounded-full px-2 py-1">
            <Flame size={10} strokeWidth={2} />
            最高可中
          </div>
          <div className="text-[11px] text-emerald-700/70 tracking-wide">实际奖金测算</div>
        </div>
        <div className="mt-2 text-[26px] leading-none font-bold text-emerald-600 tracking-[-0.03em] [font-variant-numeric:tabular-nums] whitespace-nowrap">
          ¥{formatCurrency(maxPayout)}
        </div>
      </div>
    </div>
  );
}

function TicketImagePreview({
  imageUrl,
  expanded,
  onToggle,
}: {
  imageUrl: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full rounded-2xl bg-white/55 backdrop-blur-[40px] border border-white/35 shadow-[0_2px_20px_rgba(0,0,0,0.02)] overflow-hidden text-left"
    >
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-gray-100/60">
        <div>
          <div className="text-[12px] font-semibold text-gray-700 tracking-wide">票据原图</div>
          <div className="text-[11px] text-gray-400 tracking-wide">
            {expanded ? '点击收起原图' : '点击展开查看原图'}
          </div>
        </div>
        <div className="w-7 h-7 rounded-full bg-gray-100/80 flex items-center justify-center text-gray-400 shrink-0">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      <motion.div
        initial={false}
        animate={{ height: expanded ? 148 : 60 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
        className="overflow-hidden"
      >
        <img src={imageUrl} alt="scanned ticket" className="w-full h-full object-cover" />
      </motion.div>
    </button>
  );
}

function LegCard({
  leg,
  unitStake,
}: {
  leg: TicketLeg;
  unitStake: number;
}) {
  const expectedReturn = getPotentialSingleReturn(leg.odds, unitStake);

  return (
    <div className="rounded-2xl bg-white/65 backdrop-blur-[40px] border border-white/40 shadow-[0_2px_18px_rgba(0,0,0,0.02)] px-3.5 py-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-gray-100/80 text-gray-500 font-medium tracking-wide">
            第 {leg.index} 场
          </span>
          <span className="text-[11px] text-gray-400 tracking-wide">{leg.league || '未识别编号'}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-gray-400 tracking-wide">{leg.playType}</span>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-500/20 text-emerald-700 font-semibold tracking-wide">
            {leg.selection}
          </span>
        </div>
      </div>

      <div className="mt-2 text-[17px] font-semibold text-gray-800 tracking-tight">{leg.match}</div>

      <div className="mt-3 pt-3 border-t border-gray-100/70 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[10px] text-gray-400 tracking-[0.12em] uppercase">预期单注收益</div>
          <div className="mt-1 text-[14px] font-medium text-gray-700 [font-variant-numeric:tabular-nums]">
            ¥{formatCurrency(expectedReturn)}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] text-gray-400 tracking-[0.12em] uppercase">单场赔率</div>
          <div className="mt-1 text-[24px] leading-none font-bold text-emerald-600 tracking-tight [font-variant-numeric:tabular-nums]">
            ×{formatCurrency(leg.odds)}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScenarioTable({
  scenarios,
  legs,
  expandedScenarioKey,
  onToggle,
}: {
  scenarios: TicketPayoutScenario[];
  legs: TicketLeg[];
  expandedScenarioKey: string | null;
  onToggle: (key: string) => void;
}) {
  const highestPayout = scenarios.length > 0
    ? Math.max(...scenarios.map((scenario) => scenario.payout ?? 0))
    : 0;

  return (
    <div className="rounded-[28px] bg-white/60 backdrop-blur-[40px] border border-white/40 shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12px] font-semibold text-gray-700 tracking-wide">中奖场景金额</span>
        <span className="text-[11px] text-gray-400 tracking-wide">{scenarios.length} 种</span>
      </div>

      <div className="rounded-2xl bg-gray-50/70 border border-gray-100/90 overflow-hidden">
        <div className="grid grid-cols-[1.5fr_0.72fr_1fr_20px] gap-3 px-3.5 py-2.5 text-[10px] text-gray-400 tracking-[0.14em] uppercase border-b border-gray-100/90">
          <span>中奖场景</span>
          <span className="text-center">命中</span>
          <span className="text-right">可中金额</span>
          <span />
        </div>

        {scenarios.filter(Boolean).map((scenario, index) => {
          const winningLegs = getWinningLegs(scenario, legs);
          const winningLegIndices = Array.isArray(scenario.winningLegIndices) ? scenario.winningLegIndices : [];
          const rowKey = `${scenario.condition ?? 'scenario'}-${winningLegIndices.join('-')}-${index}`;
          const isExpanded = expandedScenarioKey === rowKey;
          const isHighest = (scenario.payout ?? 0) === highestPayout;

          return (
            <div
              key={rowKey}
              className={cn(
                'px-3.5',
                index !== scenarios.length - 1 && 'border-b border-gray-100/90',
                isHighest && 'bg-emerald-50/85',
              )}
            >
              <button
                type="button"
                onClick={() => onToggle(rowKey)}
                className="w-full grid grid-cols-[1.5fr_0.72fr_1fr_20px] gap-3 items-center py-3 text-left"
                aria-expanded={isExpanded}
              >
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold text-gray-800 tracking-tight truncate">
                    {formatScenarioTitle(scenario, legs)}
                  </div>
                  <div className="mt-1 text-[11px] text-gray-400 tracking-wide truncate">
                    {formatScenarioSubtitle(scenario, legs)}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-1">
                  {Array.from({ length: scenario.hitCount }).map((_, dotIndex) => (
                    <span key={dotIndex} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  ))}
                  <span className="text-[11px] text-gray-500 ml-1 [font-variant-numeric:tabular-nums]">
                    {scenario.hitCount}中
                  </span>
                </div>

                <div className="text-right [font-variant-numeric:tabular-nums]">
                  <div className={cn(
                    'font-semibold tracking-tight text-emerald-600',
                    isHighest ? 'text-[20px]' : 'text-[16px]',
                  )}>
                    ¥{formatCurrency(scenario.payout ?? 0)}
                  </div>
                </div>

                <div className="text-gray-300 flex justify-end">
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="overflow-hidden"
                  >
                    <div className="pb-3 space-y-2">
                      {winningLegs.map((leg) => (
                        <div
                          key={`${rowKey}-${leg.index}`}
                          className="rounded-2xl bg-white/85 border border-white/60 px-3 py-2.5"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[11px] font-medium text-gray-400 tracking-wide">
                              {leg.league || `第 ${leg.index} 场`}
                            </span>
                            <span className="text-[11px] text-gray-300 tracking-wide">
                              {leg.playType} · {leg.selection}
                            </span>
                          </div>
                          <div className="mt-1 text-[13px] font-medium text-gray-700 tracking-tight">
                            {leg.match}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScanAnimation({ imageUrl, onComplete }: { imageUrl: string; onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const particleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const particleIdRef = useRef(0);

  const startScan = useCallback(() => {
    let currentProgress = 0;
    setProgress(0);
    setParticles([]);
    particleIdRef.current = 0;

    timerRef.current = setInterval(() => {
      currentProgress += 2;
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        clearInterval(timerRef.current);
        clearInterval(particleRef.current);
        setTimeout(onComplete, 500);
      }
    }, 50);

    particleRef.current = setInterval(() => {
      particleIdRef.current += 1;
      setParticles((previous) => [
        ...previous.slice(-12),
        { id: particleIdRef.current, x: Math.random() * 100, y: Math.random() * 100 },
      ]);
    }, 120);
  }, [onComplete]);

  useEffect(() => {
    startScan();

    return () => {
      clearInterval(timerRef.current);
      clearInterval(particleRef.current);
    };
  }, [startScan]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center justify-center flex-1 px-6"
    >
      <div className="text-[16px] font-semibold text-gray-800 tracking-tight mb-6">AI 正在拆票并计算</div>

      <div className="relative w-[260px] h-[180px] rounded-2xl overflow-hidden shadow-lg">
        <img src={imageUrl} alt="ticket" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />

        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{ opacity: 0, scale: 0.3 }}
            transition={{ duration: 0.6 }}
            className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400/60"
            style={{ left: `${particle.x}%`, top: `${particle.y}%` }}
          />
        ))}

        <motion.div
          className="absolute left-0 right-0 h-[2px] z-10"
          style={{ top: `${progress}%` }}
        >
          <div className="w-full h-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
          <div className="w-full h-8 bg-gradient-to-b from-emerald-500/10 to-transparent" />
        </motion.div>

        <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-emerald-400/80 rounded-tl-md" />
        <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-emerald-400/80 rounded-tr-md" />
        <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-emerald-400/80 rounded-bl-md" />
        <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-emerald-400/80 rounded-br-md" />
      </div>

      <div className="w-[260px] mt-5">
        <div className="flex justify-between mb-1.5">
          <span className="text-[11px] text-gray-400 tracking-wide">
            {progress < 30 ? '识别票面内容...' : progress < 60 ? '拆分赛事选项...' : progress < 90 ? '计算中奖场景...' : '处理完成'}
          </span>
          <span className="text-[11px] text-emerald-500 font-medium">{progress}%</span>
        </div>
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default function RecordBet() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<PageMode>('choose');
  const [scanPhase, setScanPhase] = useState<ScanPhase>('idle');
  const [imageUrl, setImageUrl] = useState('');
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [scanAnimationDone, setScanAnimationDone] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [ticketPreview, setTicketPreview] = useState<RecognizeAndCalculateResponse | null>(null);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [expandedScenarioKey, setExpandedScenarioKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  useEffect(() => {
    if (scanAnimationDone && !isRecognizing && ticketPreview) {
      setScanPhase('done');
    }
  }, [isRecognizing, scanAnimationDone, ticketPreview]);

  const resetFlow = () => {
    setMode('choose');
    setScanPhase('idle');
    setImageUrl('');
    setIsRecognizing(false);
    setScanAnimationDone(false);
    setTicketPreview(null);
    setShowSparkles(false);
    setIsImageExpanded(false);
    setExpandedScenarioKey(null);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }

    setImageUrl(URL.createObjectURL(file));
    setTicketPreview(null);
    setMode('camera');
    setScanPhase('scanning');
    setScanAnimationDone(false);
    setIsRecognizing(true);
    setIsImageExpanded(false);
    setExpandedScenarioKey(null);

    try {
      const preview = await recognizeTicketFull(file);
      setTicketPreview(preview);
    } catch (error) {
      const message = error instanceof Error ? error.message : '识别失败，请稍后重试';
      alert(message);
      resetFlow();
    } finally {
      setIsRecognizing(false);
      event.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!ticketPreview) {
      alert('请先完成票据识别');
      return;
    }

    setIsSaving(true);

    try {
      await createTicket(ticketPreview);
      setShowSparkles(true);
      setTimeout(() => navigate('/bookkeeping'), 650);
    } catch (error) {
      const message = error instanceof Error ? error.message : '保存失败，请稍后重试';
      alert(message);
      setShowSparkles(false);
    } finally {
      setIsSaving(false);
    }
  };

  const recognized = ticketPreview?.recognized;
  const calculation = ticketPreview?.calculation;

  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-[#FAFBFC]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="aurora-1 absolute -top-20 -left-16 w-72 h-72 rounded-full bg-gradient-to-br from-emerald-200/20 via-teal-100/12 to-transparent blur-3xl" />
        <div className="aurora-2 absolute top-1/2 -right-16 w-60 h-60 rounded-full bg-gradient-to-bl from-sky-200/15 via-blue-100/8 to-transparent blur-3xl" />
      </div>
      <div className="noise-overlay" />

      <header className="relative z-20 px-4 py-3 flex items-center shrink-0">
        <button
          onClick={() => {
            if (scanPhase === 'scanning') return;
            if (mode !== 'choose') {
              resetFlow();
            } else {
              navigate(-1);
            }
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/50 backdrop-blur-xl border border-white/30 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft size={18} strokeWidth={2} />
        </button>
        <h1 className="flex-1 text-center text-[16px] font-semibold text-gray-900 tracking-tight">识别彩票</h1>
        <div className="w-8" />
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />

      <AnimatePresence mode="wait">
        {mode === 'choose' && (
          <motion.div
            key="choose"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="flex-1 flex flex-col items-center justify-center px-8 relative z-10"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="w-20 h-20 rounded-3xl bg-emerald-500/8 backdrop-blur-2xl border border-emerald-500/10 flex items-center justify-center mb-8"
            >
              <ScanText size={32} strokeWidth={1.5} className="text-emerald-500" />
            </motion.div>

            <h2 className="text-[22px] font-bold text-gray-900 tracking-tight mb-2">上传彩票票据</h2>
            <p className="text-[13px] text-gray-400 tracking-wide text-center mb-10 leading-relaxed">
              自动拆分每场比赛，并计算不同命中结果对应的金额
            </p>

            <div className="w-full space-y-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-4 p-5 rounded-3xl bg-white/60 backdrop-blur-2xl border border-white/40 shadow-[0_4px_24px_rgba(0,0,0,0.04)] active:bg-white/70 transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Camera size={22} strokeWidth={1.8} className="text-emerald-600" />
                </div>
                <div className="text-left flex-1">
                  <div className="text-[15px] font-semibold text-gray-800 tracking-tight">拍照识别</div>
                  <div className="text-[11px] text-gray-400 mt-0.5 tracking-wide">识别票面、拆分赛事、计算可中金额</div>
                </div>
                <ImagePlus size={18} className="text-gray-300" />
              </motion.button>

              <div className="w-full flex items-center gap-4 p-5 rounded-3xl bg-white/35 backdrop-blur-2xl border border-white/30 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                <div className="w-12 h-12 rounded-2xl bg-gray-500/8 flex items-center justify-center shrink-0">
                  <Sigma size={20} strokeWidth={1.8} className="text-gray-500" />
                </div>
                <div className="text-left flex-1">
                  <div className="text-[15px] font-semibold text-gray-700 tracking-tight">自动计算场景</div>
                  <div className="text-[11px] text-gray-400 mt-0.5 tracking-wide">上传后可查看每种命中组合对应金额</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {mode === 'camera' && scanPhase === 'scanning' && (
          <ScanAnimation
            key="scanning"
            imageUrl={imageUrl}
            onComplete={() => {
              setScanAnimationDone(true);
              if (!isRecognizing && ticketPreview) {
                setScanPhase('done');
              }
            }}
          />
        )}

        {mode === 'camera' && scanPhase === 'done' && recognized && calculation && (
          <motion.div
            key="scan-result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-1 overflow-y-auto no-scrollbar relative z-10 px-5 pb-24 space-y-3.5"
          >
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <SuccessToast legCount={recognized.legs.length} scenarioCount={calculation.scenarios.length} />
            </motion.div>

            {imageUrl && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <TicketImagePreview
                  imageUrl={imageUrl}
                  expanded={isImageExpanded}
                  onToggle={() => setIsImageExpanded((previous) => !previous)}
                />
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
              <OverviewBanner
                recognized={recognized}
                betCount={calculation.betCount}
                unitStake={calculation.unitStake}
                maxPayout={calculation.maxPayout}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="rounded-[28px] bg-white/60 backdrop-blur-[40px] border border-white/40 shadow-[0_2px_20px_rgba(0,0,0,0.02)] p-3.5"
            >
              <div className="flex items-center justify-between mb-2.5 px-0.5">
                <span className="text-[12px] font-semibold text-gray-700 tracking-wide">赛事拆分</span>
                <span className="text-[11px] text-gray-400 tracking-wide">{recognized.legs.length} 场</span>
              </div>
              <div className="space-y-2.5">
                {recognized.legs.map((leg) => (
                  <LegCard
                    key={`${leg.index}-${leg.match}`}
                    leg={leg}
                    unitStake={calculation.unitStake}
                  />
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
              <ScenarioTable
                scenarios={calculation.scenarios}
                legs={recognized.legs}
                expandedScenarioKey={expandedScenarioKey}
                onToggle={(key) => setExpandedScenarioKey((previous) => (previous === key ? null : key))}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {mode === 'camera' && scanPhase === 'done' && ticketPreview && (
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-6 bg-gradient-to-t from-[#FAFBFC] via-[#FAFBFC]/92 to-transparent z-20">
          <div className="relative flex justify-center">
            {showSparkles && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                {Array.from({ length: 8 }, (_, index) => (
                  <div
                    key={index}
                    className="sparkle-particle"
                    style={{
                      backgroundColor: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#fbbf24', '#fcd34d', '#10b981', '#34d399'][index],
                      left: `calc(50% + ${(Math.random() - 0.5) * 80}px)`,
                      top: '40%',
                      animationDelay: `${index * 0.04}s`,
                    }}
                  />
                ))}
              </div>
            )}
            <motion.button
              onClick={() => void handleSave()}
              disabled={isSaving}
              whileTap={{ scale: 0.97 }}
              className="shiny-btn w-[80%] max-w-[280px] h-12 rounded-2xl bg-gray-900/92 backdrop-blur-2xl text-white text-[14px] font-medium tracking-wide shadow-[0_4px_24px_rgba(0,0,0,0.08)] flex items-center justify-center gap-2 disabled:opacity-70"
            >
              <span className="check-pulse">
                <Check size={17} strokeWidth={2.5} className="text-emerald-400" />
              </span>
              {isSaving ? '保存中...' : '保存票据'}
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
