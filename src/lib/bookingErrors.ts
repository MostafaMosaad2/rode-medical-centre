/** Messages that must never be shown to patients. */
export function isTechnicalErrorMessage(message: string): boolean {
  return /fetch failed|network|ECONN|ETIMEDOUT|IMDAD|session expired|login failed|Failed to|retry|TypeError|socket|UND_ERR/i.test(
    message,
  );
}

export function userSafeError(
  message: string | undefined,
  fallback: string,
): string {
  if (!message || isTechnicalErrorMessage(message)) return fallback;
  return message;
}
