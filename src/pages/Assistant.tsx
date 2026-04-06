import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Plus, Settings, Sparkles, Zap, ShieldCheck, Check, BarChart3, Volume2, VolumeX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { usePcmPlayer } from '@/hooks/usePcmPlayer';
import {
  getDisplayName, loadPreferences, savePreferences,
  RISK_LABELS, LEAGUE_OPTIONS, SPORT_OPTIONS, EVENT_OPTIONS, DEFAULT_PREFERENCES
} from '@/lib/preferences';
import type { UserPreferences } from '@/lib/preferences';
import {
  getPreferences as fetchPreferences,
  mapChatActionToRoute,
  streamChatMessage,
  updatePreferences as persistPreferences,
} from '@/lib/api';
import type { ChatContextMessage } from '@/lib/api';

// ─── Types ───
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  isWelcome?: boolean;
  isSummary?: boolean;
  options?: OnboardOption[];
  optionType?: 'single' | 'multi';
  stepKey?: string;
}

interface OnboardOption {
  id: string;
  label: string;
  desc?: string;
}

const DEFAULT_MATCH_ANALYSIS_PROMPT = '分析今晚焦点战';

function MarkdownMessage({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <div className={cn('break-words text-[13px] leading-[1.85] tracking-[0.01em] text-gray-600', className)}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="m-0 leading-[1.85]">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-gray-800">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          ul: ({ children }) => <ul className="my-2.5 list-disc space-y-2 pl-5 [&>li]:pl-1">{children}</ul>,
          ol: ({ children }) => <ol className="my-2.5 list-decimal space-y-2.5 pl-5 [&>li]:pl-1">{children}</ol>,
          li: ({ children }) => <li className="leading-[1.85] [&>p]:m-0 [&>p]:inline [&>p]:leading-[1.85]">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-2.5 rounded-2xl border-l-2 border-emerald-300/70 bg-emerald-50/60 px-4 py-3 text-gray-600">
              {children}
            </blockquote>
          ),
          code: ({ children, className: codeClassName }) => {
            const isInline = !codeClassName;
            if (isInline) {
              return <code className="rounded-md bg-gray-100/90 px-1.5 py-0.5 text-[0.92em] text-gray-700">{children}</code>;
            }

            return (
              <code className="block overflow-x-auto rounded-2xl bg-gray-900/92 px-4 py-3 text-[12px] leading-6 text-gray-100">
                {children}
              </code>
            );
          },
          pre: ({ children }) => <pre className="my-2.5 overflow-x-auto">{children}</pre>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-emerald-600 underline decoration-emerald-300 underline-offset-4"
            >
              {children}
            </a>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

// ─── Text Generate Effect ───
function TextGenerateEffect({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const chars = text.split('');
  return (
    <span className={cn('inline-block', className)}>
      {chars.map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, filter: 'blur(8px)', y: 4 }}
          animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
          transition={{
            duration: 0.35,
            delay: delay + i * 0.04,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className="inline-block"
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </span>
  );
}

// ─── Magnetic Button ───
function MagneticButton({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
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
    x.set((e.clientX - cx) * 0.15);
    y.set((e.clientY - cy) * 0.15);
  };

  const handlePointerLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      style={{ x: springX, y: springY }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={onClick}
      className={className}
      whileTap={{ scale: 0.97 }}
    >
      {children}
    </motion.button>
  );
}

// ─── HoverBorderGradient ───
function HoverBorderGradient({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className={cn('relative group overflow-hidden rounded-2xl', className)}
    >
      {/* Animated gradient border */}
      <div className={cn(
        'absolute inset-0 rounded-2xl transition-opacity duration-500',
        hovered ? 'opacity-100' : 'opacity-0',
      )}>
        <div className="absolute inset-0 rounded-2xl shimmer-border" />
      </div>
      {/* Static subtle border */}
      <div className="absolute inset-0 rounded-2xl border border-white/20" />
      {/* Inner content */}
      <div className="relative bg-white/50 backdrop-blur-2xl rounded-2xl m-[1px]">
        {children}
      </div>
    </button>
  );
}

// ─── Glowing Icon ───
function GlowingIcon({ icon: Icon, color, glowColor }: {
  icon: typeof Sparkles;
  color: string;
  glowColor: string;
}) {
  return (
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center icon-glow shrink-0"
      style={{ '--glow-color': glowColor, backgroundColor: `${glowColor}` } as React.CSSProperties}
    >
      <Icon size={17} strokeWidth={1.8} className={color} />
    </div>
  );
}

// ─── Background Beams ───
function BackgroundBeams() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Beams — tall narrow rectangles that drift upward */}
    </div>
  );
}

// ─── Onboarding step definitions ───
type OnboardStep = 'risk' | 'sports' | 'leagues' | 'morning_time' | 'strategy_times' | 'push_events' | 'done';

const STEP_ORDER: OnboardStep[] = ['risk', 'sports', 'leagues', 'morning_time', 'strategy_times', 'push_events', 'done'];

function getStepMessage(step: OnboardStep, prefs: UserPreferences): Omit<Message, 'id' | 'timestamp'> {
  switch (step) {
    case 'risk':
      return {
        sender: 'assistant',
        text: '您好！我是小绿，您的专属智能助手。\n\n在开始之前，让我了解一下您的投注风格，请选择您的风险偏好：',
        options: [
          { id: 'conservative', label: '保守', desc: '稳扎稳打，低风险低回报' },
          { id: 'steady', label: '稳健', desc: '攻守兼备，风险适中' },
          { id: 'aggressive', label: '激进', desc: '高风险高回报，追求大赔率' },
        ],
        optionType: 'single',
        stepKey: 'risk',
      };
    case 'sports':
      return {
        sender: 'assistant',
        text: '明白了！接下来，您平时主要关注哪些运动？（可多选）',
        options: SPORT_OPTIONS.map(s => ({ id: s.id, label: s.label })),
        optionType: 'multi',
        stepKey: 'sports',
      };
    case 'leagues':
      return {
        sender: 'assistant',
        text: '请选择您感兴趣的赛事联赛：（可多选）',
        options: LEAGUE_OPTIONS.map(l => ({ id: l.id, label: l.label })),
        optionType: 'multi',
        stepKey: 'leagues',
      };
    case 'morning_time':
      return {
        sender: 'assistant',
        text: `早报推送时间默认为 ${prefs.morningTime}，包含前一日投注复盘、当前盈利情况和今日关注比赛。\n\n是否使用默认时间？`,
        options: [
          { id: 'default', label: `使用默认 ${prefs.morningTime}` },
          { id: 'custom', label: '自定义时间' },
        ],
        optionType: 'single',
        stepKey: 'morning_time',
      };
    case 'strategy_times':
      return {
        sender: 'assistant',
        text: `投注策略每日推送 2 次：\n- 早场：${prefs.strategyTimes[0]}\n- 晚场：${prefs.strategyTimes[1]}\n\n是否使用默认时间？`,
        options: [
          { id: 'default', label: '使用默认时间' },
          { id: 'custom', label: '自定义时间' },
        ],
        optionType: 'single',
        stepKey: 'strategy_times',
      };
    case 'push_events':
      return {
        sender: 'assistant',
        text: '最后，您希望接收哪些比赛重点事件的实时推送？（可多选）',
        options: EVENT_OPTIONS.map(e => ({ id: e.id, label: e.label, desc: e.desc })),
        optionType: 'multi',
        stepKey: 'push_events',
      };
    default:
      return { sender: 'assistant', text: '' };
  }
}

// ─── Generate the summary report ───
function buildSummaryText(prefs: UserPreferences): string {
  const sportsText = prefs.sports.map(s => SPORT_OPTIONS.find(o => o.id === s)?.label).filter(Boolean).join('、');
  const leaguesText = prefs.leagues.map(l => LEAGUE_OPTIONS.find(o => o.id === l)?.label).filter(Boolean).join('、');
  const riskText = RISK_LABELS[prefs.risk];
  const enabledEvents = EVENT_OPTIONS.filter(e => prefs.pushEvents[e.id as keyof typeof prefs.pushEvents]).map(e => e.label).join('、');

  return `我是您的小助手，${getDisplayName(prefs)}。

每天早上 ${prefs.morningTime}，我将发送早报给您：
1. 复盘前一日您投注的比赛情况
2. 当前投注盈利情况
3. 今日关注比赛

每天 ${prefs.strategyTimes[0]} 和 ${prefs.strategyTimes[1]}，我将根据您的偏好（${riskText}策略 · ${sportsText || '待补充运动'} · ${leaguesText || '待补充联赛'}），分别推送今日早场、晚场投注策略。您可以和我探讨或修改，同时支持添加至您的记账本。

您可以点击"帮我记账"记录您的投注。

另外，您投注比赛的重点事件（${enabledEvents || '暂未开启'}），也将实时推送给您。

比赛结束，我将立即统计当前盈利情况告诉您。`;
}

function buildChatContext(messages: Message[]): ChatContextMessage[] {
  return messages
    .filter((message) => !message.isWelcome && !message.options && message.text.trim())
    .slice(-10)
    .map((message) => ({
      role: message.sender,
      content: message.text,
    }));
}

function normalizeIntentText(value: string) {
  return value.replace(/\s+/g, '').toLowerCase();
}

function resolveLocalAction(text: string): { reply: string; route: string } | null {
  const normalized = normalizeIntentText(text);

  if (
    normalized.includes('帮我记账')
    || normalized.includes('去记账')
    || normalized.includes('开始记账')
    || normalized.includes('记录投注')
    || normalized.includes('记录彩票')
  ) {
    return {
      reply: '已为您打开识别记账页面，请上传彩票开始拆分和计算。',
      route: '/record-bet',
    };
  }

  if (
    normalized.includes('记账本')
    || normalized.includes('账本')
    || normalized.includes('投注记录')
    || normalized.includes('查看记录')
  ) {
    return {
      reply: '已为您打开记账页面，您可以查看已保存的彩票记录。',
      route: '/bookkeeping',
    };
  }

  if (
    normalized.includes('设置')
    || normalized.includes('偏好')
    || normalized.includes('个人资料')
    || normalized.includes('个人设置')
  ) {
    return {
      reply: '已为您打开设置页面，您可以调整推送和偏好配置。',
      route: '/profile',
    };
  }

  return null;
}

// ─── Main Component ───
export default function Assistant() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<UserPreferences>(() => loadPreferences());
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [onboardStep, setOnboardStep] = useState<OnboardStep | null>(null);
  const [multiSelections, setMultiSelections] = useState<Set<string>>(new Set());
  const [inputFocused, setInputFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const streamingMessageIdRef = useRef<string | null>(null);
  const activeStreamRef = useRef<AbortController | null>(null);
  const assistantName = getDisplayName(prefs);
  const {
    voiceEnabled,
    isUnlocked,
    isPlaying: isVoicePlaying,
    unlock: unlockVoice,
    reset: resetVoice,
    setVoiceEnabled,
    enqueueBase64Pcm,
  } = usePcmPlayer(true);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  }, []);

  const syncInputHeight = useCallback(() => {
    const textarea = inputRef.current;
    if (!textarea) return;
    textarea.style.height = '0px';
    const nextHeight = Math.min(textarea.scrollHeight, 132);
    textarea.style.height = `${Math.max(nextHeight, 44)}px`;
  }, []);

  // ─── Initialize ───
  useEffect(() => {
    let isActive = true;

    (async () => {
      const cachedPreferences = loadPreferences();
      let initialPreferences = cachedPreferences;

      try {
        const remotePreferences = await fetchPreferences();

        if (!remotePreferences.isOnboarded && cachedPreferences.isOnboarded) {
          try { await persistPreferences(cachedPreferences); } catch { /* ignore sync failure */ }
          initialPreferences = cachedPreferences;
        } else {
          initialPreferences = remotePreferences;
          if (isActive) {
            setPrefs(remotePreferences);
            savePreferences(remotePreferences);
          }
        }
      } catch {
        if (isActive) {
          setPrefs(cachedPreferences);
        }
      }

      if (!isActive) return;

      if (initialPreferences.isOnboarded) {
        setOnboardStep(null);
        setMessages([buildWelcomeMessage()]);
        return;
      }

      setOnboardStep('risk');
      const step = getStepMessage('risk', initialPreferences);
      setMessages([{
        id: 'onboard-risk',
        timestamp: new Date(),
        ...step,
      }]);
    })();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isTyping, scrollToBottom]);
  useEffect(() => { syncInputHeight(); }, [input, syncInputHeight]);

  function buildWelcomeMessage(): Message {
    return {
      id: 'welcome',
      text: '',
      sender: 'assistant',
      timestamp: new Date(),
      isWelcome: true,
      isSummary: true,
    };
  }

  const addMessage = useCallback((msg: Omit<Message, 'id' | 'timestamp'>) => {
    const m: Message = { ...msg, id: Date.now().toString() + Math.random(), timestamp: new Date() };
    setMessages(prev => [...prev, m]);
    return m;
  }, []);

  const appendStreamingAssistantMessage = useCallback((text: string) => {
    const existingId = streamingMessageIdRef.current;

    if (!existingId) {
      const nextId = `${Date.now()}-${Math.random()}`;
      streamingMessageIdRef.current = nextId;
      setMessages(prev => [...prev, {
        id: nextId,
        text,
        sender: 'assistant',
        timestamp: new Date(),
      }]);
      return;
    }

    setMessages(prev => prev.map((message) => (
      message.id === existingId
        ? { ...message, text: message.text + text }
        : message
    )));
  }, []);

  const clearStreamingState = useCallback(() => {
    streamingMessageIdRef.current = null;
  }, []);

  const advanceOnboarding = useCallback((currentStep: OnboardStep, updatedPrefs: UserPreferences) => {
    const idx = STEP_ORDER.indexOf(currentStep);
    const nextStep = STEP_ORDER[idx + 1];

    if (nextStep === 'done') {
      const finalPrefs = { ...updatedPrefs, isOnboarded: true };
      setPrefs(finalPrefs);
      savePreferences(finalPrefs);
      setOnboardStep(null);

      setIsTyping(true);
      setTimeout(() => {
        void (async () => {
          try {
            const persistedPreferences = await persistPreferences(finalPrefs);
            setPrefs(persistedPreferences);
            savePreferences(persistedPreferences);
            addMessage({
              sender: 'assistant',
              text: buildSummaryText(persistedPreferences),
              isSummary: true,
            });
          } catch {
            addMessage({
              sender: 'assistant',
              text: '定制已完成，但同步后端失败了。您可以稍后在设置页重新保存一次。',
              isSummary: true,
            });
          } finally {
            setIsTyping(false);
          }
        })();
      }, 1200);
      return;
    }

    setOnboardStep(nextStep);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const step = getStepMessage(nextStep, updatedPrefs);
      addMessage(step);
      setMultiSelections(new Set());
    }, 800);
  }, [addMessage]);

  const handleOptionSelect = useCallback((option: OnboardOption, stepKey?: string) => {
    if (!onboardStep || !stepKey) return;

    addMessage({ sender: 'user', text: option.label });

    let updated: UserPreferences = {
      ...prefs,
      sports: [...prefs.sports],
      leagues: [...prefs.leagues],
      strategyTimes: [...prefs.strategyTimes] as UserPreferences['strategyTimes'],
      pushEvents: { ...prefs.pushEvents },
    };

    switch (stepKey) {
      case 'risk':
        updated.risk = option.id as UserPreferences['risk'];
        break;
      case 'morning_time':
        if (option.id === 'custom') {
          const time = prompt('请输入早报时间 (HH:MM)', prefs.morningTime);
          if (time) updated.morningTime = time;
        }
        break;
      case 'strategy_times':
        if (option.id === 'custom') {
          const t1 = prompt('请输入早场策略时间 (HH:MM)', prefs.strategyTimes[0]);
          const t2 = prompt('请输入晚场策略时间 (HH:MM)', prefs.strategyTimes[1]);
          if (t1) updated.strategyTimes[0] = t1;
          if (t2) updated.strategyTimes[1] = t2;
        }
        break;
    }

    setPrefs(updated);
    advanceOnboarding(onboardStep, updated);
  }, [onboardStep, prefs, addMessage, advanceOnboarding]);

  const handleMultiConfirm = useCallback((stepKey?: string) => {
    if (!onboardStep || !stepKey || multiSelections.size === 0) return;

    const selectedLabels = Array.from(multiSelections).map(id => {
      const all = [...SPORT_OPTIONS, ...LEAGUE_OPTIONS, ...EVENT_OPTIONS];
      return all.find(o => o.id === id)?.label || id;
    });
    addMessage({ sender: 'user', text: selectedLabels.join('、') });

    let updated: UserPreferences = {
      ...prefs,
      sports: [...prefs.sports],
      leagues: [...prefs.leagues],
      strategyTimes: [...prefs.strategyTimes] as UserPreferences['strategyTimes'],
      pushEvents: { ...prefs.pushEvents },
    };

    switch (stepKey) {
      case 'sports':
        updated.sports = Array.from(multiSelections) as UserPreferences['sports'];
        break;
      case 'leagues':
        updated.leagues = Array.from(multiSelections);
        break;
      case 'push_events': {
        const newEvents = { ...DEFAULT_PREFERENCES.pushEvents };
        Object.keys(newEvents).forEach(k => {
          newEvents[k as keyof typeof newEvents] = multiSelections.has(k);
        });
        updated.pushEvents = newEvents;
        break;
      }
    }

    setPrefs(updated);
    advanceOnboarding(onboardStep, updated);
  }, [onboardStep, prefs, multiSelections, addMessage, advanceOnboarding]);

  const handleSend = async (textInput?: string) => {
    const textToSend = (typeof textInput === 'string' ? textInput : input).trim();
    if (!textToSend) return;

    activeStreamRef.current?.abort();
    activeStreamRef.current = null;
    clearStreamingState();
    resetVoice();

    const context = buildChatContext(messages);
    const localAction = resolveLocalAction(textToSend);
    addMessage({ sender: 'user', text: textToSend });
    setInput('');

    if (localAction) {
      addMessage({ sender: 'assistant', text: localAction.reply });
      setTimeout(() => navigate(localAction.route), 400);
      return;
    }

    setIsTyping(true);

    const controller = new AbortController();
    activeStreamRef.current = controller;
    let hasDelta = false;

    try {
      if (voiceEnabled) {
        await unlockVoice();
      }

      await streamChatMessage(
        {
          message: textToSend,
          context,
          voice: {
            enabled: voiceEnabled,
            mode: voiceEnabled ? 'assistant' : 'off',
          },
        },
        {
          onDelta: (text) => {
            hasDelta = true;
            setIsTyping(false);
            appendStreamingAssistantMessage(text);
          },
          onAudioDelta: async ({ data, sampleRate }) => {
            await enqueueBase64Pcm(data, sampleRate);
          },
          onDone: ({ reply, action }) => {
            setIsTyping(false);

            if (!hasDelta && reply.trim()) {
              addMessage({ sender: 'assistant', text: reply });
            }

            clearStreamingState();
            const targetRoute = mapChatActionToRoute(action);
            if (targetRoute) {
              setTimeout(() => navigate(targetRoute), 1000);
            }
          },
          onAudioError: () => {
            resetVoice();
          },
          onError: (message) => {
            if (controller.signal.aborted) {
              return;
            }

            setIsTyping(false);
            clearStreamingState();
            addMessage({
              sender: 'assistant',
              text: `暂时无法连接助手服务：${message}`,
            });
          },
        },
        { signal: controller.signal },
      );
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      setIsTyping(false);
      const message = error instanceof Error ? error.message : '服务暂时不可用';
      addMessage({
        sender: 'assistant',
        text: `暂时无法连接助手服务：${message}`,
      });
    } finally {
      if (activeStreamRef.current === controller) {
        activeStreamRef.current = null;
      }
    }
  };

  useEffect(() => () => {
    activeStreamRef.current?.abort();
    resetVoice();
  }, [resetVoice]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  // ─── Render ───
  return (
    <div className="flex flex-col h-full relative overflow-hidden bg-[#FAFBFC]">

      {/* ═══ Aurora Background ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="aurora-1 absolute -top-24 -left-16 w-80 h-80 rounded-full bg-gradient-to-br from-emerald-200/25 via-teal-100/15 to-transparent blur-3xl" />
        <div className="aurora-2 absolute top-1/3 -right-20 w-72 h-72 rounded-full bg-gradient-to-bl from-sky-200/20 via-blue-100/10 to-transparent blur-3xl" />
        <div className="aurora-3 absolute bottom-32 left-8 w-60 h-60 rounded-full bg-gradient-to-tr from-emerald-100/15 via-cyan-100/10 to-transparent blur-3xl" />
      </div>

      {/* ═══ Background Beams ═══ */}
      <BackgroundBeams />

      {/* ═══ Noise Texture ═══ */}
      <div className="noise-overlay" />

      {/* ═══ Header — Minimal, Apple-style ═══ */}
      <header className="relative z-10 px-6 pt-4 pb-2 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="w-9 h-9 rounded-xl bg-white/60 backdrop-blur-2xl border border-white/30 flex items-center justify-center icon-glow"
              style={{ '--glow-color': 'rgba(16,185,129,0.12)' } as React.CSSProperties}
            >
              <Sparkles size={17} strokeWidth={1.8} className="text-emerald-500" />
            </div>
          </div>
          <div>
            <h1 className="text-[17px] font-semibold text-gray-900 tracking-tight leading-tight">{assistantName}</h1>
            <p className="text-[10px] text-gray-300 font-medium tracking-[0.08em]">Foretell Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void setVoiceEnabled(!voiceEnabled)}
            className={cn(
              'h-9 px-3 flex items-center gap-1.5 rounded-full backdrop-blur-xl border transition-colors',
              voiceEnabled
                ? 'bg-white/60 border-white/30 text-emerald-600'
                : 'bg-white/50 border-white/30 text-gray-400'
            )}
            title={voiceEnabled ? '关闭语音播报' : '开启语音播报'}
          >
            {voiceEnabled ? <Volume2 size={15} strokeWidth={1.9} /> : <VolumeX size={15} strokeWidth={1.9} />}
            <span className="text-[11px] font-medium tracking-[0.06em]">
              {isVoicePlaying ? '播报中' : voiceEnabled ? (isUnlocked ? '语音开' : '点按启用') : '语音关'}
            </span>
          </button>

        </div>
      </header>

      {/* ═══ Chat Area ═══ */}
      <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 px-5 pb-[110px] pt-2 space-y-5">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className={cn(
                'flex',
                msg.sender === 'user'
                  ? 'justify-end'
                  : 'flex-col items-start justify-start gap-2'
              )}
            >
              {/* Assistant Avatar */}
              {msg.sender === 'assistant' && !msg.isWelcome && (
                <div
                  className="w-7 h-7 rounded-lg bg-white/60 backdrop-blur-xl border border-white/30 flex items-center justify-center ml-1"
                >
                  <Sparkles size={13} strokeWidth={2} className="text-emerald-500" />
                </div>
              )}

              {/* ═══ Welcome / Bento Grid Card ═══ */}
              {msg.isWelcome ? (
                <div className="w-full max-w-[94%] mt-1">
                  {/* Greeting — Text Generate Effect */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-5 px-1"
                  >
                    <TextGenerateEffect
                      text={`我是您的小助手，${assistantName}`}
                      className="text-[20px] font-normal text-gray-800 tracking-tight"
                      delay={0.3}
                    />
                  </motion.div>

                  {/* ═══ Bento Grid ═══ */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Daily Report — spans full width (TextRevealCard style) */}
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8, duration: 0.5 }}
                      className="col-span-2 rounded-3xl bg-white/50 backdrop-blur-[40px] border-[0.5px] border-white/40 p-5 shadow-[0_2px_20px_rgba(0,0,0,0.02)] dot-matrix relative overflow-hidden group"
                    >
                      <div className="relative z-10 flex items-start gap-3.5">
                        <GlowingIcon icon={BarChart3} color="text-blue-500" glowColor="rgba(59,130,246,0.1)" />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[14px] font-semibold text-gray-800 tracking-tight">每日早报</h3>
                          <p className="text-[11px] text-gray-500 font-normal mt-1.5 leading-[1.7] tracking-wide">
                            每天 {prefs.morningTime} 准时送达
                          </p>
                          {/* TextReveal preview */}
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={{ delay: 1.4, duration: 0.6 }}
                            className="mt-3 pt-3 border-t border-gray-100/40"
                          >
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-gray-300 tracking-widest">昨日复盘</span>
                              <span className="text-emerald-500/70 font-medium">+328 元</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] mt-1.5">
                              <span className="text-gray-300 tracking-widest">今日关注</span>
                              <span className="text-gray-500 font-medium">3 场焦点</span>
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Strategy — small card */}
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.0, duration: 0.5 }}
                      className="rounded-3xl bg-white/50 backdrop-blur-[40px] border-[0.5px] border-white/40 p-4 shadow-[0_2px_20px_rgba(0,0,0,0.02)] dot-matrix relative overflow-hidden"
                    >
                      <GlowingIcon icon={Zap} color="text-amber-500" glowColor="rgba(245,158,11,0.1)" />
                      <h3 className="text-[13px] font-semibold text-gray-800 tracking-tight mt-3">早晚盘策略</h3>
                      <p className="text-[10px] text-gray-500/70 font-normal mt-1 leading-[1.6] tracking-wide">
                        {prefs.strategyTimes[0]} & {prefs.strategyTimes[1]}
                      </p>
                      <div className="mt-2.5 text-[10px] text-gray-300 tracking-widest">
                        {RISK_LABELS[prefs.risk]}策略
                      </div>
                    </motion.div>

                    {/* Live Monitor — small card */}
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.15, duration: 0.5 }}
                      className="rounded-3xl bg-white/50 backdrop-blur-[40px] border-[0.5px] border-white/40 p-4 shadow-[0_2px_20px_rgba(0,0,0,0.02)] dot-matrix relative overflow-hidden"
                    >
                      <GlowingIcon icon={ShieldCheck} color="text-rose-400" glowColor="rgba(244,63,94,0.08)" />
                      <h3 className="text-[13px] font-semibold text-gray-800 tracking-tight mt-3">赛况监控</h3>
                      <p className="text-[10px] text-gray-500/70 font-normal mt-1 leading-[1.6] tracking-wide">
                        进球 · 红牌 · 结算
                      </p>
                      <div className="mt-2.5 text-[10px] text-gray-300 tracking-widest">
                        秒级推送
                      </div>
                    </motion.div>
                  </div>

                  {/* ═══ Quick Actions — Magnetic Buttons ═══ */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4, duration: 0.5 }}
                    className="flex gap-2 mt-4 overflow-x-auto no-scrollbar"
                  >
                    <MagneticButton
                      onClick={() => handleSend('帮我记账')}
                      className="shrink-0 flex items-center gap-1.5 bg-white/50 backdrop-blur-2xl border-[0.5px] border-white/40 px-4 py-2.5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-colors"
                    >
                      <Plus size={14} className="text-emerald-500" strokeWidth={2} />
                      <span className="text-[13px] font-medium text-gray-700 tracking-tight">帮我记账</span>
                    </MagneticButton>

                    <HoverBorderGradient
                      onClick={() => handleSend(DEFAULT_MATCH_ANALYSIS_PROMPT)}
                    >
                      <div className="flex items-center gap-1.5 px-4 py-2.5">
                        <Sparkles size={14} className="text-emerald-500" strokeWidth={2} />
                        <span className="text-[13px] font-medium text-gray-700 tracking-tight">分析今晚焦点战</span>
                      </div>
                    </HoverBorderGradient>
                  </motion.div>
                </div>
              ) : msg.isSummary && !msg.isWelcome ? (
                /* ═══ Summary Report — Frosted Glass ═══ */
                <div className="max-w-[94%]">
                  <div className="rounded-3xl rounded-tl-lg bg-white/50 backdrop-blur-[40px] border-[0.5px] border-white/40 p-5 shadow-[0_2px_20px_rgba(0,0,0,0.02)] dot-matrix">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Check size={12} strokeWidth={3} className="text-emerald-500" />
                      </div>
                      <span className="text-[12px] font-semibold text-gray-500 tracking-wide">定制完成</span>
                    </div>
                    <MarkdownMessage text={msg.text} />
                  </div>

                  {/* Post-summary actions */}
                  <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
                    <MagneticButton
                      onClick={() => handleSend('帮我记账')}
                      className="shrink-0 flex items-center gap-1.5 bg-white/50 backdrop-blur-2xl border-[0.5px] border-white/40 px-4 py-2.5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
                    >
                      <Plus size={14} className="text-emerald-500" strokeWidth={2} />
                      <span className="text-[13px] font-medium text-gray-700 tracking-tight">帮我记账</span>
                    </MagneticButton>

                    <HoverBorderGradient onClick={() => handleSend(DEFAULT_MATCH_ANALYSIS_PROMPT)}>
                      <div className="flex items-center gap-1.5 px-4 py-2.5">
                        <Sparkles size={14} className="text-emerald-500" strokeWidth={2} />
                        <span className="text-[13px] font-medium text-gray-700 tracking-tight">分析今晚焦点战</span>
                      </div>
                    </HoverBorderGradient>
                  </div>
                </div>
              ) : (
                /* ═══ Regular Chat Bubbles — Frosted ═══ */
                <div className={cn(msg.sender === 'assistant' ? 'w-full max-w-[94%]' : 'w-fit max-w-[85%]')}>
                  <div
                    className={cn(
                      'px-4 py-3',
                      msg.sender === 'user'
                        ? 'inline-flex max-w-full bg-gray-900/90 backdrop-blur-xl text-white rounded-2xl rounded-tr-lg shadow-[0_4px_20px_rgba(0,0,0,0.08)]'
                        : 'bg-white/50 backdrop-blur-[40px] border-[0.5px] border-white/40 text-gray-700 rounded-2xl rounded-tl-lg shadow-[0_2px_16px_rgba(0,0,0,0.02)]'
                    )}
                  >
                    {msg.sender === 'assistant' ? (
                      <MarkdownMessage text={msg.text} className="text-gray-700" />
                    ) : (
                      <div className="whitespace-pre-wrap break-words text-[13px] leading-[1.8] tracking-wide font-normal">{msg.text}</div>
                    )}
                  </div>

                  {/* ═══ Onboarding Options — Glassmorphism ═══ */}
                  {msg.options && msg.sender === 'assistant' && onboardStep && msg.stepKey === onboardStep && (
                    <div className="mt-3 space-y-1.5 ml-1">
                      {msg.optionType === 'single' ? (
                        msg.options.map(opt => (
                          <button
                            key={opt.id}
                            onClick={() => handleOptionSelect(opt, msg.stepKey)}
                            className="w-full flex items-start gap-3 bg-white/50 backdrop-blur-2xl border-[0.5px] border-white/30 rounded-2xl px-4 py-3 hover:border-emerald-500/20 transition-all active:scale-[0.98] text-left"
                          >
                            <div className="w-4 h-4 rounded-full border-[1.5px] border-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-transparent" />
                            </div>
                            <div>
                              <div className="text-[13px] font-medium text-gray-700 tracking-tight">{opt.label}</div>
                              {opt.desc && <div className="text-[10px] text-gray-500/70 font-normal mt-0.5 tracking-wide">{opt.desc}</div>}
                            </div>
                          </button>
                        ))
                      ) : (
                        <>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.options.map(opt => {
                              const selected = multiSelections.has(opt.id);
                              return (
                                <button
                                  key={opt.id}
                                  onClick={() => {
                                    setMultiSelections(prev => {
                                      const next = new Set(prev);
                                      if (next.has(opt.id)) next.delete(opt.id);
                                      else next.add(opt.id);
                                      return next;
                                    });
                                  }}
                                  className={cn(
                                    'px-3.5 py-2 rounded-xl text-[12px] font-medium border-[0.5px] transition-all flex items-center gap-1.5 backdrop-blur-xl',
                                    selected
                                      ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-700'
                                      : 'bg-white/50 border-white/30 text-gray-500 hover:border-gray-200'
                                  )}
                                >
                                  {opt.label}
                                  {selected && <Check size={13} className="text-emerald-500" strokeWidth={2.5} />}
                                </button>
                              );
                            })}
                          </div>
                          <button
                            onClick={() => handleMultiConfirm(msg.stepKey)}
                            disabled={multiSelections.size === 0}
                            className={cn(
                              'mt-2.5 px-6 py-2.5 rounded-xl text-[13px] font-medium transition-all tracking-wide',
                              multiSelections.size > 0
                                ? 'bg-gray-900/90 backdrop-blur-xl text-white shadow-[0_4px_16px_rgba(0,0,0,0.08)] active:scale-[0.97]'
                                : 'bg-gray-100/50 text-gray-300 cursor-not-allowed'
                            )}
                          >
                            确认选择（{multiSelections.size}）
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-start justify-start gap-2 mt-2"
            >
              <div className="w-7 h-7 rounded-lg bg-white/60 backdrop-blur-xl border border-white/30 flex items-center justify-center ml-1">
                <Sparkles size={13} strokeWidth={2} className="text-emerald-500" />
              </div>
              <div className="bg-white/50 backdrop-blur-[40px] border-[0.5px] border-white/40 px-4 py-3.5 rounded-2xl rounded-tl-lg flex items-center gap-2 h-10 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.9, delay: 0, ease: 'easeInOut' }} className="w-1.5 h-1.5 bg-emerald-400/60 rounded-full" />
                <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.9, delay: 0.15, ease: 'easeInOut' }} className="w-1.5 h-1.5 bg-emerald-400/60 rounded-full" />
                <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.9, delay: 0.3, ease: 'easeInOut' }} className="w-1.5 h-1.5 bg-emerald-400/60 rounded-full" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* ═══ Input — Floating Capsule (Dynamic Island) ═══ */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-4 pt-14 bg-gradient-to-t from-[#FAFBFC] via-[#FAFBFC]/90 to-transparent z-10">
        <motion.div
          animate={{
            boxShadow: inputFocused
              ? '0 0 0 2px rgba(16,185,129,0.08), 0 8px 32px rgba(0,0,0,0.06)'
              : '0 4px 24px rgba(0,0,0,0.04)',
          }}
          transition={{ duration: 0.4 }}
          className={cn(
            'relative flex items-end rounded-[22px] pl-5 pr-1.5 py-1.5 bg-white/60 backdrop-blur-2xl border transition-all duration-500',
            inputFocused
              ? 'border-emerald-500/15'
              : 'border-white/40'
          )}
        >
          {/* Shimmer border on focus */}
          {inputFocused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-[22px] shimmer-border pointer-events-none"
              style={{ zIndex: -1 }}
            />
          )}

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder={onboardStep ? '请通过上方选项完成定制...' : `问${assistantName}任何问题...`}
            disabled={!!onboardStep}
            rows={1}
            className="max-h-[132px] min-h-[44px] flex-1 resize-none overflow-y-auto bg-transparent py-2.5 text-[14px] font-normal leading-6 text-gray-800 outline-none placeholder:text-gray-300 disabled:opacity-40 tracking-wide"
          />
          <motion.button
            onClick={() => void handleSend()}
            disabled={!input.trim() || !!onboardStep}
            whileTap={{ scale: 0.92 }}
            className={cn(
              'mb-0.5 ml-2 w-9 h-9 shrink-0 rounded-[14px] transition-all duration-500 flex items-center justify-center',
              input.trim() && !onboardStep
                ? 'bg-gray-900/90 text-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]'
                : 'bg-gray-100/40 text-gray-300'
            )}
          >
            <Send size={15} strokeWidth={2} />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
