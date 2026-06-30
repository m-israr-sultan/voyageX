/**
 * Parses the display name from a MAIL_FROM value.
 * Supports: "VoyageX <email@example.com>" or plain email addresses.
 */
export function parseMailFromDisplayName(mailFrom: string): string {
  const match = mailFrom.match(/^(.+?)\s*<[^>]+>$/);
  if (match) {
    return match[1].trim().replace(/^"|"$/g, '');
  }
  return 'VoyageX';
}

export function parseMailSecure(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'true' || normalized === '1' || normalized === 'yes';
}
