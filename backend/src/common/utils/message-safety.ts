/**
 * Detects contact information in message text.
 * Used to prevent booking bypass through direct contact sharing.
 */

const PHONE_PATTERN   = /(?:\+?(?:92|0))?[0-9]{10,12}/g;
const EMAIL_PATTERN   = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/gi;
const WHATSAPP_PATTERN = /wa\.me|whatsapp|watsapp|wtsapp/gi;
const URL_PATTERN     = /https?:\/\/[^\s]+|www\.[^\s]+/gi;
const SOCIAL_PATTERN  = /instagram\.com|facebook\.com|tiktok\.com|twitter\.com|snapchat\.com/gi;

export interface SafetyCheckResult {
  isFlagged: boolean;
  reasons: string[];
}

export function checkMessageSafety(content: string): SafetyCheckResult {
  const reasons: string[] = [];

  if (PHONE_PATTERN.test(content))    reasons.push('phone_number');
  if (EMAIL_PATTERN.test(content))    reasons.push('email_address');
  if (WHATSAPP_PATTERN.test(content)) reasons.push('whatsapp_reference');
  if (URL_PATTERN.test(content))      reasons.push('external_url');
  if (SOCIAL_PATTERN.test(content))   reasons.push('social_media_link');

  // Reset lastIndex for global regexes
  [PHONE_PATTERN, EMAIL_PATTERN, WHATSAPP_PATTERN, URL_PATTERN, SOCIAL_PATTERN].forEach(r => { r.lastIndex = 0; });

  return {
    isFlagged: reasons.length > 0,
    reasons,
  };
}

/**
 * Returns a warning string appended to the message to alert the recipient
 * that contact details were detected. The original content is preserved.
 */
export const SAFETY_WARNING_PREFIX =
  '[VoyageX: This message was flagged for containing contact information. ' +
  'Please use VoyageX for all bookings and payments.] ';
