/** 현재 날짜를 YYYY-MM-DD 형식으로 반환 */
export const toDateStr = (date: Date = new Date()): string =>
  date.toISOString().slice(0, 10);

/** 이메일 형식 검증 (RFC 5322 간소화) */
export const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
