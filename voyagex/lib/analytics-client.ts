/**
 * First-party, privacy-friendly visitor analytics client (Phase N/M).
 * No third-party trackers — every ping goes straight to the VoyageX backend
 * (`/api/v1/analytics/*`). Fails silently: analytics must never break or
 * slow down the actual product experience.
 */
import api from './api';
import { isLoggedIn, getUser } from './auth';

const VISITOR_KEY = 'vx_visitor_id';
const SESSION_KEY = 'vx_session_id';
const SESSION_LAST_SEEN_KEY = 'vx_session_last_seen';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // matches PLATFORM_CONFIG.analyticsSessionTimeoutMinutes

function safeUuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  // Fallback for older browsers — analytics ids don't need to be cryptographically strong.
  return `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function getVisitorId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = safeUuid();
    try { localStorage.setItem(VISITOR_KEY, id); } catch { /* storage disabled — ok, analytics is best-effort */ }
  }
  return id;
}

/** Returns { sessionId, isNew } — a new session starts after 30 min of inactivity. */
function getSessionId(): { sessionId: string; isNew: boolean } {
  if (typeof window === 'undefined') return { sessionId: '', isNew: false };
  const lastSeenRaw = sessionStorage.getItem(SESSION_LAST_SEEN_KEY);
  const lastSeen = lastSeenRaw ? Number(lastSeenRaw) : 0;
  const now = Date.now();
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  let isNew = false;

  if (!sessionId || now - lastSeen > SESSION_TIMEOUT_MS) {
    sessionId = safeUuid();
    isNew = true;
    try { sessionStorage.setItem(SESSION_KEY, sessionId); } catch { /* noop */ }
  }
  try { sessionStorage.setItem(SESSION_LAST_SEEN_KEY, String(now)); } catch { /* noop */ }
  return { sessionId, isNew };
}

function detectDevice(): 'MOBILE' | 'TABLET' | 'DESKTOP' | 'UNKNOWN' {
  if (typeof navigator === 'undefined') return 'UNKNOWN';
  const ua = navigator.userAgent || '';
  if (/iPad|Tablet|PlayBook/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) return 'TABLET';
  if (/Mobi|iPhone|Android/i.test(ua)) return 'MOBILE';
  return 'DESKTOP';
}

function detectBrowser(): string {
  if (typeof navigator === 'undefined') return 'Unknown';
  const ua = navigator.userAgent || '';
  if (/Edg\//.test(ua)) return 'Edge';
  if (/OPR\//.test(ua)) return 'Opera';
  if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return 'Safari';
  if (/Firefox\//.test(ua)) return 'Firefox';
  return 'Other';
}

function detectOS(): string {
  if (typeof navigator === 'undefined') return 'Unknown';
  const ua = navigator.userAgent || '';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Mac OS X/i.test(ua)) return 'macOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Other';
}

function detectUtmSource(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    return new URLSearchParams(window.location.search).get('utm_source') || undefined;
  } catch {
    return undefined;
  }
}

let sessionInitPromise: Promise<void> | null = null;

/** Called once per session — sends device/browser/referrer/UTM context. Safe to call repeatedly. */
async function ensureSessionTracked(): Promise<string> {
  const visitorId = getVisitorId();
  const { sessionId, isNew } = getSessionId();
  if (!visitorId || !sessionId) return sessionId;

  if (isNew) {
    sessionInitPromise = api
      .post('/analytics/session', {
        visitorId,
        sessionId,
        device: detectDevice(),
        browser: detectBrowser(),
        os: detectOS(),
        screenWidth: typeof window !== 'undefined' ? window.innerWidth : undefined,
        screenHeight: typeof window !== 'undefined' ? window.innerHeight : undefined,
        referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
        landingPage: typeof window !== 'undefined' ? window.location.pathname : undefined,
        utmSource: detectUtmSource(),
      })
      .then(() => {
        if (isLoggedIn()) {
          const user = getUser();
          if (user?.id) {
            api.post('/analytics/link-user', { sessionId }).catch(() => undefined);
          }
        }
      })
      .catch(() => undefined);
  }
  await sessionInitPromise?.catch(() => undefined);
  return sessionId;
}

/** Fire-and-forget pageview ping. Call on every route change. */
export async function trackPageView(path: string, title?: string): Promise<void> {
  try {
    const visitorId = getVisitorId();
    const sessionId = await ensureSessionTracked();
    if (!visitorId || !sessionId) return;
    await api.post('/analytics/pageview', {
      visitorId,
      sessionId,
      path,
      title,
      referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
    });
  } catch {
    // Analytics must never disrupt the user experience.
  }
}

export type AnalyticsEventType =
  | 'GUIDE_PROFILE_OPENED'
  | 'AGENCY_PROFILE_OPENED'
  | 'PACKAGE_VIEWED'
  | 'DESTINATION_VIEWED'
  | 'BOOKING_STARTED'
  | 'BOOKING_ABANDONED'
  | 'MESSAGE_STARTED';

/**
 * Fire-and-forget product event ping — used to understand drop-off and
 * conversion (which guides/destinations/packages convert visitors into
 * bookings, where travelers abandon checkout, etc).
 */
export async function trackEvent(
  type: AnalyticsEventType,
  entityType?: 'guide' | 'agency' | 'package' | 'destination' | 'booking' | 'conversation',
  entityId?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    const visitorId = getVisitorId();
    const sessionId = await ensureSessionTracked();
    if (!visitorId || !sessionId) return;
    await api.post('/analytics/event', { visitorId, sessionId, type, entityType, entityId, metadata });
  } catch {
    // Analytics must never disrupt the user experience.
  }
}

/**
 * Best-effort "abandoned" signal fired via sendBeacon on page unload, since
 * a normal await-based POST is unreliable during navigation/tab close.
 */
export function trackEventOnUnload(
  type: AnalyticsEventType,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, unknown>,
): void {
  if (typeof navigator === 'undefined' || !navigator.sendBeacon) return;
  const visitorId = getVisitorId();
  const sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!visitorId || !sessionId) return;
  const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');
  const blob = new Blob(
    [JSON.stringify({ visitorId, sessionId, type, entityType, entityId, metadata })],
    { type: 'application/json' },
  );
  navigator.sendBeacon(`${base}/analytics/event`, blob);
}
