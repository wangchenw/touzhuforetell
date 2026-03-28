export interface PushEventSettings {
  start: boolean;
  goal: boolean;
  card: boolean;
  half: boolean;
  end: boolean;
}

export interface UserPreferences {
  name: string;
  risk: 'conservative' | 'steady' | 'aggressive';
  sports: string[];
  leagues: string[];
  morningTime: string;
  strategyTimes: [string, string];
  pushEvents: PushEventSettings;
  isOnboarded: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  name: '小绿',
  risk: 'steady',
  sports: ['football'],
  leagues: ['premier_league', 'nba'],
  morningTime: '08:00',
  strategyTimes: ['10:30', '18:00'],
  pushEvents: {
    start: true,
    goal: true,
    card: false,
    half: true,
    end: true,
  },
  isOnboarded: false,
};

const STORAGE_KEY = 'foretell_preferences';

export function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
    }
  } catch {
    // ignore corrupted data
  }
  return { ...DEFAULT_PREFERENCES };
}

export function savePreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // storage full or unavailable
  }
}

export const RISK_LABELS: Record<string, string> = {
  conservative: '保守',
  steady: '稳健',
  aggressive: '激进',
};

export const LEAGUE_OPTIONS = [
  { id: 'premier_league', label: '英超' },
  { id: 'la_liga', label: '西甲' },
  { id: 'serie_a', label: '意甲' },
  { id: 'champions_league', label: '欧冠' },
  { id: 'nba', label: 'NBA' },
  { id: 'cba', label: 'CBA' },
];

export const SPORT_OPTIONS = [
  { id: 'football', label: '足球' },
  { id: 'basketball', label: '篮球' },
];

export const EVENT_OPTIONS = [
  { id: 'start', label: '比赛开赛', desc: '首发阵容与开赛提醒' },
  { id: 'goal', label: '进球提醒', desc: '关键进球实时播报' },
  { id: 'card', label: '红黄牌', desc: '场上重大判罚事件' },
  { id: 'half', label: '半场赛果', desc: '半场比分及数据统计' },
  { id: 'end', label: '全场结束', desc: '最终比分与盈亏结算' },
];
