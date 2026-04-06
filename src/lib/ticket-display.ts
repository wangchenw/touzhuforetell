const CHINESE_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

function toChineseNumber(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    return String(value);
  }

  if (value < 10) {
    return CHINESE_DIGITS[value];
  }

  if (value < 20) {
    return value === 10 ? '十' : `十${CHINESE_DIGITS[value - 10]}`;
  }

  if (value < 100) {
    const tens = Math.floor(value / 10);
    const ones = value % 10;
    return `${CHINESE_DIGITS[tens]}十${ones === 0 ? '' : CHINESE_DIGITS[ones]}`;
  }

  if (value < 1000) {
    const hundreds = Math.floor(value / 100);
    const rest = value % 100;

    if (rest === 0) {
      return `${CHINESE_DIGITS[hundreds]}百`;
    }

    if (rest < 10) {
      return `${CHINESE_DIGITS[hundreds]}百零${CHINESE_DIGITS[rest]}`;
    }

    return `${CHINESE_DIGITS[hundreds]}百${toChineseNumber(rest)}`;
  }

  return String(value);
}

function combinationCount(total: number, size: number): number {
  if (size < 0 || size > total) {
    return 0;
  }

  if (size === 0 || size === total) {
    return 1;
  }

  const limit = Math.min(size, total - size);
  let result = 1;

  for (let index = 1; index <= limit; index += 1) {
    result = (result * (total - limit + index)) / index;
  }

  return Math.round(result);
}

export function formatPassType(
  passType?: string | null,
  legCount?: number,
  ticketType?: 'single' | 'parlay',
): string {
  if (!passType) {
    return ticketType === 'single' ? '单关' : '串关';
  }

  const normalized = passType.replace(/\s+/g, '');
  const standardMatch = normalized.match(/^(\d+)串(\d+)$/);
  if (standardMatch) {
    const [, left, right] = standardMatch;
    return `${toChineseNumber(Number(left))}串${toChineseNumber(Number(right))}`;
  }

  const guanMatch = normalized.match(/^(\d+(?:,\d+)*)关$/);
  if (!guanMatch) {
    return normalized;
  }

  const sizes = guanMatch[1]
    .split(',')
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item > 0);

  if (sizes.length === 0) {
    return normalized;
  }

  const totalLegs = legCount ?? Math.max(...sizes);
  const betCount = sizes.reduce((sum, size) => sum + combinationCount(totalLegs, size), 0);

  if (!Number.isFinite(totalLegs) || totalLegs <= 0 || betCount <= 0) {
    return normalized;
  }

  return `${toChineseNumber(totalLegs)}串${toChineseNumber(betCount)}`;
}
