export type Sport = 'football' | 'basketball';
export type BetStatus = 'won' | 'lost' | 'pending';
export type RiskLevel = 'conservative' | 'steady' | 'aggressive';

export interface PushEvents {
  goal: boolean;
  redCard: boolean;
  settle: boolean;
}

export interface UserPreferences {
  name: string;
  risk: RiskLevel;
  sports: Sport[];
  leagues: string[];
  morningTime: string;
  strategyTimes: [string, string];
  pushEvents: PushEvents;
  isOnboarded: boolean;
}

export interface TicketLeg {
  index: number;
  league?: string | null;
  match: string;
  playType: string;
  selection: string;
  odds: string;
  matchCode?: string;
  matchId?: number | null;
  homeTeam?: string | null;
  awayTeam?: string | null;
  leagueName?: string | null;
  matchTime?: string | null;
}

export type TicketType = 'single' | 'parlay';

export interface TicketRecognitionResult {
  issueId?: string;
  ticketType: TicketType;
  betMode?: string;
  playType?: string;
  multiplier?: string;
  sport: Sport;
  amount: string;
  currency: string;
  passType?: string | null;
  legs: TicketLeg[];
  rawText?: string | null;
}

export interface TicketCalculationLeg {
  index: number;
  match: string;
  playType: string;
  selection: string;
  odds: number;
}

export interface TicketCalculatePayload {
  ticketType: TicketType;
  sport: Sport;
  amount: number;
  currency?: string;
  passType?: string | null;
  legs: TicketCalculationLeg[];
}

export interface TicketPayoutScenario {
  condition: string;
  hitCount: number;
  payout: number;
  winningLegIndices: number[];
}

export interface TicketCalculationResult {
  totalStake: number;
  unitStake: number;
  betCount: number;
  maxPayout: number;
  scenarios: TicketPayoutScenario[];
}

export interface RecognizeAndCalculateResponse {
  recognized: TicketRecognitionResult;
  calculation: TicketCalculationResult;
}

interface BackendRecognizedLeg {
  index: number;
  matchCode: string;
  selection: string;
  odds: string;
  matchId?: number | null;
  homeTeam?: string | null;
  awayTeam?: string | null;
  leagueName?: string | null;
  matchTime?: string | null;
}

interface BackendRecognizedTicket {
  issueId?: string;
  ticketType: TicketType;
  betMode?: string;
  playType?: string;
  multiplier?: string;
  amount: string;
  currency: string;
  passType?: string | null;
  legs: BackendRecognizedLeg[];
  rawText?: string | null;
}

interface BackendParlayHitScenario {
  hitLegs: number[];
  hitCount: number;
  minPayout: number;
  maxPayout: number;
  description: string;
}

interface BackendRecognizeFullResponse {
  recognized: BackendRecognizedTicket;
  calculation: {
    totalStake: number;
    unitStake: number;
    betCount: number;
    maxPayout: number;
    scenarios: BackendParlayHitScenario[];
  };
}

export interface TicketSavePayload {
  recognized: TicketRecognitionResult;
  calculation: TicketCalculationResult;
}

export interface TicketRecord {
  id: number;
  recognized: TicketRecognitionResult;
  calculation: TicketCalculationResult;
}

export interface TicketListItem {
  id: number;
  ticketType: TicketType;
  sport: Sport;
  amount: string;
  currency: string;
  passType?: string | null;
  legCount: number;
  maxPayout: number;
  createdAt: string;
}

export interface TicketListResponse {
  records: TicketListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BetWritePayload {
  sport: Sport;
  league: string;
  match: string;
  playType: string;
  odds: number;
  amount: number;
  status: BetStatus;
  date: string;
  time: string;
}

export interface BetRecord extends BetWritePayload {
  id: number;
  userId: string;
}

export interface BetStats {
  totalProfit: number;
  wonCount: number;
  settledCount: number;
  winRate: number;
  pendingAmount: number;
  total: number;
}

export interface ProfitCurvePoint {
  date: string;
  value: number;
}

export interface BetFullStats extends BetStats {
  profitCurve: ProfitCurvePoint[];
}

export interface BetListResponse {
  records: BetRecord[];
  stats: BetStats;
}

export interface ChatContextMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type ChatAction =
  | 'navigate:/record-bet'
  | 'navigate:/dashboard'
  | 'navigate:/preferences'
  | null;

export interface ChatResponse {
  reply: string;
  action: ChatAction;
}

export interface ChatVoiceConfig {
  enabled: boolean;
  mode?: 'off' | 'assistant';
  voice?: string;
  sampleRate?: number;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const USER_ID_STORAGE_KEY = 'foretell_user_id';

function getApiUrl(path: string, query?: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') {
        search.set(key, String(value));
      }
    }
  }

  const suffix = search.size > 0 ? `?${search.toString()}` : '';
  return `${API_BASE_URL}${path}${suffix}`;
}

export function getOrCreateUserId(): string {
  const configuredUserId = import.meta.env.VITE_API_USER_ID;
  if (configuredUserId) {
    return configuredUserId;
  }

  const cachedUserId = localStorage.getItem(USER_ID_STORAGE_KEY);
  if (cachedUserId) {
    return cachedUserId;
  }

  const generatedUserId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `user-${Date.now()}`;

  localStorage.setItem(USER_ID_STORAGE_KEY, generatedUserId);
  return generatedUserId;
}

function toErrorMessage(payload: unknown, response: Response) {
  if (payload && typeof payload === 'object' && 'detail' in payload && typeof payload.detail === 'string') {
    return payload.detail;
  }

  return `${response.status} ${response.statusText}`;
}

function inferSportFromPlayType(playType?: string): Sport {
  if (playType?.startsWith('竞彩篮球')) {
    return 'basketball';
  }

  return 'football';
}

function normalizeRecognizeFullResponse(
  payload: BackendRecognizeFullResponse,
): RecognizeAndCalculateResponse {
  const recognized = payload.recognized;
  const playType = recognized.playType ?? '';

  return {
    recognized: {
      issueId: recognized.issueId,
      ticketType: recognized.ticketType,
      betMode: recognized.betMode,
      playType,
      multiplier: recognized.multiplier,
      sport: inferSportFromPlayType(playType),
      amount: recognized.amount,
      currency: recognized.currency,
      passType: recognized.passType,
      rawText: recognized.rawText,
      legs: (recognized.legs ?? []).map((leg) => ({
        index: leg.index,
        league: leg.leagueName ?? leg.matchCode ?? null,
        match:
          leg.homeTeam && leg.awayTeam
            ? `${leg.homeTeam} vs ${leg.awayTeam}`
            : leg.matchCode,
        playType,
        selection: leg.selection,
        odds: leg.odds,
        matchCode: leg.matchCode,
        matchId: leg.matchId ?? null,
        homeTeam: leg.homeTeam ?? null,
        awayTeam: leg.awayTeam ?? null,
        leagueName: leg.leagueName ?? null,
        matchTime: leg.matchTime ?? null,
      })),
    },
    calculation: {
      totalStake: payload.calculation.totalStake,
      unitStake: payload.calculation.unitStake,
      betCount: payload.calculation.betCount,
      maxPayout: payload.calculation.maxPayout,
      scenarios: (payload.calculation.scenarios ?? []).map((scenario) => ({
        condition: scenario.description,
        hitCount: scenario.hitCount,
        payout: scenario.maxPayout,
        winningLegIndices: scenario.hitLegs ?? [],
      })),
    },
  };
}

async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  query?: Record<string, string | number | undefined>,
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('X-User-Id', getOrCreateUserId());

  if (!(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(getApiUrl(path, query), {
    ...init,
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(toErrorMessage(payload, response));
  }

  return payload as T;
}

export function mapChatActionToRoute(action: ChatAction): string | null {
  switch (action) {
    case 'navigate:/record-bet':
      return '/record-bet';
    case 'navigate:/dashboard':
      return '/bookkeeping';
    case 'navigate:/preferences':
      return '/profile';
    default:
      return null;
  }
}

export async function getPreferences(): Promise<UserPreferences> {
  return apiRequest<UserPreferences>('/api/preferences');
}

export async function updatePreferences(preferences: UserPreferences): Promise<UserPreferences> {
  return apiRequest<UserPreferences>('/api/preferences', {
    method: 'PUT',
    body: JSON.stringify(preferences),
  });
}

export async function recognizeTicket(image: File): Promise<TicketRecognitionResult> {
  const formData = new FormData();
  formData.append('image', image);

  return apiRequest<TicketRecognitionResult>('/api/recognize-ticket', {
    method: 'POST',
    body: formData,
  });
}

export async function calculateTicket(payload: TicketCalculatePayload): Promise<TicketCalculationResult> {
  return apiRequest<TicketCalculationResult>('/api/tickets/calculate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function recognizeTicketFull(image: File): Promise<RecognizeAndCalculateResponse> {
  const formData = new FormData();
  formData.append('image', image);

  const response = await apiRequest<BackendRecognizeFullResponse>('/api/tickets/recognize', {
    method: 'POST',
    body: formData,
  });

  return normalizeRecognizeFullResponse(response);
}

export async function recognizeCalculateSaveTicket(image: File): Promise<TicketRecord> {
  const formData = new FormData();
  formData.append('image', image);

  return apiRequest<TicketRecord>('/api/tickets/recognize-calculate-save', {
    method: 'POST',
    body: formData,
  });
}

export async function createTicket(payload: TicketSavePayload): Promise<TicketRecord> {
  return apiRequest<TicketRecord>('/api/tickets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listTickets(options: {
  page?: number;
  pageSize?: number;
} = {}): Promise<TicketListResponse> {
  return apiRequest<TicketListResponse>('/api/tickets', undefined, {
    page: options.page ?? 1,
    pageSize: options.pageSize ?? 20,
  });
}

export async function getTicket(id: number): Promise<TicketRecord> {
  return apiRequest<TicketRecord>(`/api/tickets/${id}`);
}

export async function createBet(payload: BetWritePayload): Promise<BetRecord> {
  return apiRequest<BetRecord>('/api/bets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listBets(filters: {
  sport?: Sport;
  status?: BetStatus;
  page?: number;
  pageSize?: number;
} = {}): Promise<BetListResponse> {
  return apiRequest<BetListResponse>('/api/bets', undefined, {
    sport: filters.sport,
    status: filters.status,
    page: filters.page ?? 1,
    pageSize: filters.pageSize ?? 20,
  });
}

export async function getBet(id: number): Promise<BetRecord> {
  return apiRequest<BetRecord>(`/api/bets/${id}`);
}

export async function updateBet(id: number, payload: BetWritePayload): Promise<BetRecord> {
  return apiRequest<BetRecord>(`/api/bets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteBet(id: number): Promise<void> {
  return apiRequest<void>(`/api/bets/${id}`, {
    method: 'DELETE',
  });
}

export async function getBetStats(sport: Sport | 'all' = 'all'): Promise<BetFullStats> {
  return apiRequest<BetFullStats>('/api/bets/stats', undefined, {
    sport,
  });
}

export async function sendChatMessage(payload: {
  message: string;
  context?: ChatContextMessage[];
}): Promise<ChatResponse> {
  return apiRequest<ChatResponse>('/api/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export type ChatStreamEvent =
  | { type: 'delta'; text: string; channel?: 'assistant' | 'thinking' }
  | { type: 'audio_delta'; data: string; format: 'pcm16'; sampleRate: number }
  | { type: 'audio_done' }
  | { type: 'audio_error'; message: string }
  | { type: 'done'; reply: string; action: ChatAction }
  | { type: 'error'; message: string };

export async function streamChatMessage(
  payload: {
    message: string;
    context?: ChatContextMessage[];
    voice?: ChatVoiceConfig;
  },
  handlers: {
    onDelta: (text: string) => void;
    onAudioDelta?: (payload: { data: string; format: 'pcm16'; sampleRate: number }) => void;
    onAudioDone?: () => void;
    onAudioError?: (message: string) => void;
    onDone: (payload: { reply: string; action: ChatAction }) => void;
    onError?: (message: string) => void;
  },
  options?: {
    signal?: AbortSignal;
  },
): Promise<void> {
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'text/event-stream');
  headers.set('X-User-Id', getOrCreateUserId());

  const response = await fetch(getApiUrl('/api/chat'), {
    method: 'POST',
    headers,
    signal: options?.signal,
    body: JSON.stringify({
      message: payload.message,
      context: payload.context ?? [],
      stream: true,
      voice: payload.voice,
    }),
  }).catch((error: unknown) => {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return null;
    }
    throw error;
  });

  if (!response) {
    return;
  }

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);
    const message = toErrorMessage(errorPayload, response);
    handlers.onError?.(message);
    return;
  }

  if (!response.body) {
    handlers.onError?.('response body is empty');
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';

    for (const eventBlock of events) {
      const line = eventBlock.split('\n').find((l) => l.startsWith('data: '));
      if (!line) continue;

      const jsonText = line.slice(6).trim();
      if (!jsonText) continue;

      let event: ChatStreamEvent;
      try {
        event = JSON.parse(jsonText);
      } catch {
        continue;
      }

      if (event.type === 'delta') {
        handlers.onDelta(event.text);
      } else if (event.type === 'audio_delta') {
        handlers.onAudioDelta?.({
          data: event.data,
          format: event.format,
          sampleRate: event.sampleRate,
        });
      } else if (event.type === 'audio_done') {
        handlers.onAudioDone?.();
      } else if (event.type === 'audio_error') {
        handlers.onAudioError?.(event.message);
      } else if (event.type === 'done') {
        handlers.onDone({ reply: event.reply, action: event.action });
      } else if (event.type === 'error') {
        handlers.onError?.(event.message);
      }
    }
  }
}
