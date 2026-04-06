import type { PushEvents, RiskLevel, Sport, UserPreferences } from '@/lib/api';

export type { PushEvents, RiskLevel, Sport, UserPreferences } from '@/lib/api';

type LegacyPushEvents = Partial<PushEvents> & {
  start?: boolean;
  card?: boolean;
  half?: boolean;
  end?: boolean;
};

type StoredPreferences = Partial<UserPreferences> & {
  sports?: string[];
  leagues?: string[];
  strategyTimes?: string[];
  pushEvents?: LegacyPushEvents;
};

const STORAGE_KEY = 'foretell_preferences';

const VALID_RISKS: RiskLevel[] = ['conservative', 'steady', 'aggressive'];
const VALID_SPORTS: Sport[] = ['football', 'basketball'];
const LEGACY_LEAGUE_MAP: Record<string, string> = {
  premier_league: 'epl',
  la_liga: 'laliga',
  serie_a: 'seriea',
  champions_league: 'ucl',
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  name: '',
  risk: 'steady',
  sports: [],
  leagues: [],
  morningTime: '08:00',
  strategyTimes: ['10:30', '18:00'],
  pushEvents: {
    goal: false,
    redCard: false,
    settle: false,
  },
  isOnboarded: false,
};

function normalizeTime(value: unknown, fallback: string) {
  if (typeof value === 'string' && /^\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  return fallback;
}

function normalizeStrategyTimes(value: unknown): [string, string] {
  if (!Array.isArray(value)) {
    return [...DEFAULT_PREFERENCES.strategyTimes];
  }

  const first = normalizeTime(value[0], DEFAULT_PREFERENCES.strategyTimes[0]);
  const second = normalizeTime(value[1], DEFAULT_PREFERENCES.strategyTimes[1]);
  return [first, second];
}

function normalizeSports(value: unknown): Sport[] {
  if (!Array.isArray(value)) {
    return [...DEFAULT_PREFERENCES.sports];
  }

  const sports = value.filter((item): item is Sport => VALID_SPORTS.includes(item as Sport));
  return Array.from(new Set(sports));
}

function normalizeLeagues(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [...DEFAULT_PREFERENCES.leagues];
  }

  const leagues = value
    .map((item) => (typeof item === 'string' ? LEGACY_LEAGUE_MAP[item] || item : null))
    .filter((item): item is string => Boolean(item));

  return Array.from(new Set(leagues));
}

function normalizePushEvents(value: unknown): PushEvents {
  const pushEvents = (value && typeof value === 'object' ? value : {}) as LegacyPushEvents;

  return {
    goal: Boolean(pushEvents.goal),
    redCard: Boolean(pushEvents.redCard ?? pushEvents.card),
    settle: Boolean(pushEvents.settle ?? pushEvents.end),
  };
}

function normalizeRisk(value: unknown): RiskLevel {
  if (typeof value === 'string' && VALID_RISKS.includes(value as RiskLevel)) {
    return value as RiskLevel;
  }

  return DEFAULT_PREFERENCES.risk;
}

export function normalizePreferences(raw?: StoredPreferences | null): UserPreferences {
  return {
    name: typeof raw?.name === 'string' ? raw.name : DEFAULT_PREFERENCES.name,
    risk: normalizeRisk(raw?.risk),
    sports: normalizeSports(raw?.sports),
    leagues: normalizeLeagues(raw?.leagues),
    morningTime: normalizeTime(raw?.morningTime, DEFAULT_PREFERENCES.morningTime),
    strategyTimes: normalizeStrategyTimes(raw?.strategyTimes),
    pushEvents: normalizePushEvents(raw?.pushEvents),
    isOnboarded: Boolean(raw?.isOnboarded),
  };
}

export function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return normalizePreferences(JSON.parse(raw) as StoredPreferences);
    }
  } catch {
    // ignore corrupted data
  }

  return normalizePreferences();
}

export function savePreferences(preferences: UserPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizePreferences(preferences)));
  } catch {
    // storage full or unavailable
  }
}

export function getDisplayName(preferences: Pick<UserPreferences, 'name'>): string {
  return preferences.name.trim() || '小绿';
}

export const RISK_LABELS: Record<RiskLevel, string> = {
  conservative: '保守',
  steady: '稳健',
  aggressive: '激进',
};

export const LEAGUE_OPTIONS = [
  { id: 'epl', label: '英超' },
  { id: 'laliga', label: '西甲' },
  { id: 'seriea', label: '意甲' },
  { id: 'ucl', label: '欧冠' },
  { id: 'nba', label: 'NBA' },
  { id: 'cba', label: 'CBA' },
] as const;

export const SPORT_OPTIONS = [
  { id: 'football', label: '足球' },
  { id: 'basketball', label: '篮球' },
] as const;

export const EVENT_OPTIONS = [
  { id: 'goal', label: '进球提醒', desc: '关键进球实时播报' },
  { id: 'redCard', label: '红牌提醒', desc: '重大判罚和人员变化' },
  { id: 'settle', label: '结算提醒', desc: '比赛结束后同步盈亏结算' },
] as const;
