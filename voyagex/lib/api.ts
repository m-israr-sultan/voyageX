import axios, { AxiosRequestConfig } from 'axios';
import { getToken, clearAuth } from './auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// ── Low-connectivity settings ────────────────────────────────────────────────
// 15 s timeout suits 2G/weak-3G bursts; prevents infinite hangs on dead links.
const REQUEST_TIMEOUT_MS = 15_000;

// Retry budget: network/timeout errors only (not 4xx/5xx — those are app logic).
const MAX_RETRIES = 2;
const RETRY_DELAY_BASE_MS = 1_500;

// In-flight GET deduplication map  key → pending promise
const inFlightGets = new Map<string, Promise<any>>();

const api = axios.create({
  baseURL: BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor — attach token + GET deduplication ──────────────────
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    // Tag each request with a retry counter (starts at 0)
    (config as any)._retryCount = (config as any)._retryCount ?? 0;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — 401 redirect + network retry ─────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 401 → clear auth and redirect
    if (error.response?.status === 401) {
      clearAuth();
      if (typeof window !== 'undefined') window.location.href = '/login';
      return Promise.reject(error);
    }

    const config: AxiosRequestConfig & { _retryCount?: number } = error.config ?? {};

    // Only retry on network/timeout errors (no response = connectivity issue)
    const isNetworkError = !error.response;
    const isTimeout = error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK';
    const retryCount = config._retryCount ?? 0;

    if ((isNetworkError || isTimeout) && retryCount < MAX_RETRIES) {
      config._retryCount = retryCount + 1;
      const delay = RETRY_DELAY_BASE_MS * Math.pow(1.5, retryCount);
      await new Promise((r) => setTimeout(r, delay));
      return api(config);
    }

    return Promise.reject(error);
  }
);

/**
 * Deduplicated GET — if an identical in-flight GET exists, re-use its promise.
 * Prevents N identical requests when components mount simultaneously on slow networks.
 */
export function deduplicatedGet(url: string, config?: AxiosRequestConfig) {
  const key = url + JSON.stringify(config?.params ?? {});
  if (inFlightGets.has(key)) return inFlightGets.get(key)!;
  const req = api.get(url, config).finally(() => inFlightGets.delete(key));
  inFlightGets.set(key, req);
  return req;
}

// ============================================
// AUTH API
// ============================================
export const authApi = {
  registerTraveler: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => api.post('/auth/register/traveler', data),

  registerGuide: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    bio?: string;
    languages: string[];
    specialities: string[];
    location?: string;
    region: string;
  }) => api.post('/auth/register/guide', data),

  registerAgency: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    agencyName: string;
    description?: string;
    city?: string;
    country?: string;
    website?: string;
    phone?: string;
    address?: string;
    region?: string;
  }) => api.post('/auth/register/agency', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  verifyOtp: (data: { email: string; otp: string }) =>
    api.post('/auth/verify-otp', data),

  forgotPassword: (data: { email: string }) =>
    api.post('/auth/forgot-password', data),

  resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
    api.post('/auth/reset-password', data),

  refreshToken: (data: { refreshToken: string }) =>
    api.post('/auth/refresh', data),
};

// ============================================
// GUIDES API
// ============================================
export const guidesApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    location?: string;
    speciality?: string;
    language?: string;
    minRating?: number;
    isVerified?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }) => api.get('/guides', { params }),

  getBySlug: (slug: string) => api.get(`/guides/${slug}`),

  getMyProfile: () => api.get('/guides/my-profile'),

  updateMyProfile: (data: any) => api.put('/guides/my-profile', data),
};

// ============================================
// AGENCIES API
// ============================================
export const agenciesApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    city?: string;
    country?: string;
    minRating?: number;
    isVerified?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }) => api.get('/agencies', { params }),

  getBySlug: (slug: string) => api.get(`/agencies/${slug}`),

  getMyProfile: () => api.get('/agencies/my-profile'),

  updateMyProfile: (data: any) => api.put('/agencies/my-profile', data),

  getMySubscription: () => api.get('/agencies/my-subscription'),

  paySubscription: (data: {
    paymentMethod: string;
    mobileNumber?: string;
    cardToken?: string;
    bankReference?: string;
    proofUrl?: string;
  }) => api.post('/agencies/pay-subscription', data),

  getCommissionHistory: () => api.get('/agencies/commission-history'),

  payCommission: (bookingId: string, data: { transactionId: string }) =>
    api.post(`/agencies/pay-commission/${bookingId}`, data),
};

// ============================================
// DESTINATIONS API
// ============================================

export const destinationsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    country?: string;
    search?: string;
  }) => api.get('/destinations', { params }),

  getBySlug: (slug: string) => api.get(`/destinations/${slug}`),

  create: (data: any) => api.post('/destinations', data),

  update: (id: string, data: any) => api.put(`/destinations/${id}`, data),

  delete: (id: string, hard = false) => api.delete(`/destinations/${id}${hard ? '?hard=true' : ''}`),
};

// ============================================
// PACKAGES API
// ============================================
export const packagesApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    destinationSlug?: string;
    guideSlug?: string;
    agencySlug?: string;
    minPrice?: number;
    maxPrice?: number;
    minDuration?: number;
    maxDuration?: number;
    minRating?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }) => api.get('/packages', { params }),

  getBySlug: (slug: string) => api.get(`/packages/${slug}`),

  getMyPackages: () => api.get('/packages/my-packages'),

  create: (data: any) => api.post('/packages', data),

  update: (id: string, data: any) => api.put(`/packages/${id}`, data),
delete: (id: string, hard = false) => api.delete(`/packages/${id}${hard ? '?hard=true' : ''}`),
};

// ============================================
// BOOKINGS API
// ============================================
export const bookingsApi = {
  calculatePrice: (data: {
    packageId?: string;
    guideId?: string;
    startDate: string;
    endDate: string;
    groupSize: number;
  }) => api.post('/bookings/calculate', data),

  getAll: () => api.get('/bookings'),

  getById: (id: string) => api.get(`/bookings/${id}`),

  create: (data: {
    packageId?: string;
    guideId?: string;
    startDate: string;
    endDate: string;
    groupSize?: number;
    notes?: string;
    isInternational?: boolean;
  }) => api.post('/bookings', data),

  cancel: (id: string) => api.patch(`/bookings/${id}/cancel`),

  startTour: (id: string) => api.patch(`/bookings/${id}/start-tour`),

  requestCompletion: (id: string) => api.patch(`/bookings/${id}/request-completion`),

  confirmCompletion: (id: string) => api.patch(`/bookings/${id}/confirm-completion`),

  raiseDispute: (id: string, data: { reason: string; description?: string }) =>
    api.post(`/bookings/${id}/dispute`, data),

  resolveDispute: (id: string, data: { decision: string; adminNote: string }) =>
    api.patch(`/bookings/${id}/resolve-dispute`, data),
};

// ============================================
// REVIEWS API
// ============================================
export const reviewsApi = {
  getByPackage: (packageId: string) =>
    api.get(`/reviews/package/${packageId}`),

  getByGuide: (guideId: string) => api.get(`/reviews/guide/${guideId}`),

  getByAgency: (agencyId: string) => api.get(`/reviews/agency/${agencyId}`),

  create: (data: {
    bookingId: string;
    packageId: string;
    rating: number;
    comment?: string;
  }) => api.post('/reviews', data),

  delete: (id: string) => api.delete(`/reviews/${id}`),
};

// ============================================
// MESSAGES API
// ============================================
export const messagesApi = {
  createConversation: (data: { recipientId: string }) =>
    api.post('/messages/conversations', data),

  getConversations: () => api.get('/messages/conversations'),

  getMessages: (conversationId: string) =>
    api.get(`/messages/conversations/${conversationId}`),

  sendMessage: (data: { conversationId: string; content: string }) =>
    api.post('/messages/send', data),

  getUnreadCount: () => api.get('/messages/unread'),
  getAllConversations: () => api.get('/messages/admin/conversations'),
};

// ============================================
// NOTIFICATIONS API
// ============================================
export const notificationsApi = {
  getAll: () => api.get('/notifications'),

  getUnreadCount: () => api.get('/notifications/unread-count'),

  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),

  markAllAsRead: () => api.patch('/notifications/read-all'),

  deleteAll: () => api.delete('/notifications'),
};

// ============================================
// WISHLIST API
// ============================================
export const wishlistApi = {
  getAll: () => api.get('/wishlist'),

  add: (packageId: string) => api.post(`/wishlist/${packageId}`),

  remove: (packageId: string) => api.delete(`/wishlist/${packageId}`),

  check: (packageId: string) => api.get(`/wishlist/check/${packageId}`),
};

// ============================================
// WEATHER API
// ============================================
export const weatherApi = {
  getCurrent: (city: string) =>
    api.get('/weather/current', { params: { city } }),

  getForecast: (city: string) =>
    api.get('/weather/forecast', { params: { city } }),
};

// ============================================
// USERS API
// ============================================
export const usersApi = {
  getProfile: () => api.get('/users/me'),

  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
  }) => api.put('/users/me', data),

  getMyBookings: () => api.get('/users/me/bookings'),

  getMyReviews: () => api.get('/users/me/reviews'),

  getMyWishlist: () => api.get('/users/me/wishlist'),

changePassword: (data: { currentPassword: string; newPassword: string }) => 
  api.post('/users/change-password', data),

deleteAccount: () => api.delete('/users/me'),

};

// ============================================
// UPLOAD API
// ============================================
export const uploadApi = {
  uploadImage: (formData: FormData) =>
    api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadMultiple: (formData: FormData) =>
    api.post('/upload/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadDocument: (formData: FormData) =>
    api.post('/upload/document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ============================================
// REPORTS API
// ============================================
export const reportsApi = {
  create: (data: {
    type: string;
    targetId?: string;
    reason?: string;
    details?: string;
    title?: string;
    description?: string;
    bookingId?: string;
  }) => api.post('/reports', data),

  getMyReports: () => api.get('/reports/my-reports'),
};

// ============================================
// ADMIN API
// ============================================
export const adminApi = {
  getStats: () => api.get('/admin/stats'),

  getUsers: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/users', { params }),

  toggleUserStatus: (id: string) =>
    api.patch(`/admin/users/${id}/toggle-status`),

  getGuides: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/guides', { params }),

  getAllGuides: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/guides', { params }),

  getPendingGuides: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/guides/pending', { params }),

  // Use POST /admin/guides/:id/approve (sets adminApproved + free trial)
  approveGuide: (id: string) => api.post(`/admin/guides/${id}/approve`),

  // Use POST /admin/guides/:id/reject
  rejectGuide: (id: string, reason?: string) =>
    api.post(`/admin/guides/${id}/reject`, { reason }),

  verifyGuide: (id: string) => api.patch(`/admin/guides/${id}/verify`),

  unverifyGuide: (id: string) => api.patch(`/admin/guides/${id}/unverify`),

  getAgencies: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/agencies', { params }),

  getPendingAgencies: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/agencies/pending', { params }),

  // Use POST /admin/agencies/:id/approve-documents
  approveAgencyDocuments: (id: string) =>
    api.post(`/admin/agencies/${id}/approve-documents`),

  // Use POST /admin/agencies/:id/reject-documents
  rejectAgencyDocuments: (id: string, reason?: string) =>
    api.post(`/admin/agencies/${id}/reject-documents`, { reason }),

  verifyAgency: (id: string) => api.patch(`/admin/agencies/${id}/verify`),

  unverifyAgency: (id: string) =>
    api.patch(`/admin/agencies/${id}/unverify`),

  getPackages: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/packages', { params }),

  togglePackageStatus: (id: string) =>
    api.patch(`/admin/packages/${id}/toggle-status`),

  getBookings: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/bookings', { params }),

  // Correct path: GET /bookings/manual/pending (not /admin/manual-bookings)
  getManualBookings: (params?: { page?: number; limit?: number }) =>
    api.get('/bookings/manual/pending', { params }),

  // Correct path: POST /bookings/manual/assign-whatsapp
  assignWhatsAppToManualBooking: (data: { bookingId: string; whatsappId: string; notes?: string }) =>
    api.post('/bookings/manual/assign-whatsapp', data),

  // Correct path: POST /bookings/manual/mark-paid
  markManualBookingPaid: (data: { bookingId: string; transactionId: string; notes?: string }) =>
    api.post('/bookings/manual/mark-paid', data),

  // Correct path: POST /bookings/manual/assign-guide
  assignGuideToManualBooking: (data: { bookingId: string; guideId: string; notes?: string }) =>
    api.post('/bookings/manual/assign-guide', data),

  // Correct path: PATCH /bookings/manual/:id/complete
  completeManualBooking: (id: string) =>
    api.patch(`/bookings/manual/${id}/complete`),

  // Correct path: PATCH /bookings/manual/:id/cancel
  cancelManualBooking: (id: string) =>
    api.patch(`/bookings/manual/${id}/cancel`),

  getReports: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/reports', { params }),

  updateReportStatus: (id: string, status: string) =>
    api.patch(`/admin/reports/${id}/status`, { status }),

  getDisputes: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/disputes', { params }),

  resolveDispute: (id: string, data: { decision: string; adminNote: string }) =>
    api.patch(`/bookings/${id}/resolve-dispute`, data),

  getPendingCommissions: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/commissions/pending', { params }),

  // Correct path: POST /admin/commissions/:id/mark-paid
  markCommissionPaid: (id: string, transactionId?: string) =>
    api.post(`/admin/commissions/${id}/mark-paid`, { transactionId }),

  // Correct path: GET /admin/agencies/subscription/expiring
  getExpiringSubscriptions: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/agencies/subscription/expiring', { params }),

  // Correct path: GET /admin/subscriptions/history (now wired in admin controller)
  getSubscriptionHistory: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/subscriptions/history', { params }),

  // Correct path: POST /admin/agencies/:id/record-subscription-payment
  recordSubscriptionPayment: (id: string, data: any) =>
    api.post(`/admin/agencies/${id}/record-subscription-payment`, data),

  // Get pending subscription proofs awaiting admin review
  getPendingSubscriptionProofs: () =>
    api.get('/admin/subscriptions/pending-proofs'),

  // Approve/reject agency subscription payment proof
  approveSubscriptionPayment: (paymentId: string) =>
    api.post(`/admin/subscriptions/${paymentId}/approve`),

  rejectSubscriptionPayment: (paymentId: string, reason: string) =>
    api.post(`/admin/subscriptions/${paymentId}/reject`, { reason }),

  getPendingPayoutAccounts: () => api.get('/admin/payouts/accounts/pending'),

  approvePayoutAccount: (id: string) =>
    api.post(`/admin/payouts/accounts/${id}/approve`),

  rejectPayoutAccount: (id: string, reason: string) =>
    api.post(`/admin/payouts/accounts/${id}/reject`, { reason }),

  suspendPayoutAccount: (id: string, reason?: string) =>
    api.post(`/admin/payouts/accounts/${id}/suspend`, { reason }),

  listPayouts: (params?: { status?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/admin/payouts', { params }),

  retryPayout: (id: string) => api.post(`/admin/payouts/${id}/retry`),

  listFinancialReceipts: (params?: { type?: string; status?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/admin/financial/receipts', { params }),

  listFinancialLedger: (params?: { type?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/admin/financial/ledger', { params }),

  downloadReceipt: (id: string) =>
    api.get(`/admin/financial/receipts/${id}/download`, { responseType: 'blob' }),

  getFinancialMetrics: (params?: {
    from?: string;
    to?: string;
    provider?: string;
    guideId?: string;
    agencyId?: string;
  }) => api.get('/admin/financial/metrics', { params }),

  exportFinancialMetrics: (params?: { from?: string; to?: string; provider?: string }) =>
    api.get('/admin/financial/metrics/export', { params, responseType: 'blob' }),

  listReconciliationReports: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/financial/reconciliation', { params }),

  runReconciliation: (data?: { period?: string; periodStart?: string; periodEnd?: string }) =>
    api.post('/admin/financial/reconciliation/run', data ?? {}),

  resolveReconciliationIssue: (id: string) =>
    api.patch(`/admin/financial/reconciliation/issues/${id}/resolve`),

  listProviderStatements: (params?: { page?: number; provider?: string }) =>
    api.get('/admin/financial/statements', { params }),

  importProviderStatement: (data: {
    provider: string;
    statementType: string;
    source: string;
    fileName?: string;
    lines: Array<{ providerReference: string; amount: number; currency?: string }>;
  }) => api.post('/admin/financial/statements/import', data),

  listFinancialSettings: () => api.get('/admin/financial/settings'),

  updateFinancialSetting: (key: string, value: string) =>
    api.patch(`/admin/financial/settings/${key}`, { value }),

  listWebhookEvents: (params?: {
    page?: number;
    limit?: number;
    provider?: string;
    status?: string;
    eventType?: string;
  }) => api.get('/admin/financial/webhooks', { params }),

  reprocessWebhook: (id: string) => api.post(`/admin/financial/webhooks/${id}/reprocess`),

  listRefunds: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/admin/financial/refunds', { params }),

  approveRefund: (id: string) => api.post(`/admin/financial/refunds/${id}/approve`),

  rejectRefund: (id: string, reason: string) =>
    api.post(`/admin/financial/refunds/${id}/reject`, { reason }),
};

export const receiptsApi = {
  verify: (token: string) => api.get(`/receipts/verify/${token}`),

  download: (id: string) =>
    api.get(`/receipts/${id}/download`, { responseType: 'blob' }),
};

// ============================================
// PAYMENTS API
// ============================================
export const paymentsApi = {
  initiate: (data: {
    bookingId: string;
    paymentMethod: string; // PaymentMethodType — enforced at component level
    amount: number;
    mobileNumber?: string;
    cardToken?: string;
    bankReference?: string;
    proofUrl?: string;
  }) => api.post('/payments/initiate', data),

  release: (id: string) => api.patch(`/payments/${id}/release`),

  // Admin: approve / reject bank transfer proof
  approveProof: (id: string) => api.patch(`/payments/${id}/approve-proof`),
  rejectProof: (id: string, reason: string) =>
    api.patch(`/payments/${id}/reject-proof`, { reason }),

  // Admin: force-confirm payment in sandbox mode
  sandboxConfirm: (id: string) => api.patch(`/payments/${id}/sandbox-confirm`),

  // Admin: initiate refund
  refund: (id: string, amount: number, reason: string) =>
    api.post(`/payments/${id}/refund`, { amount, reason }),
};

// ============================================
// VERIFICATIONS API
// ============================================

/**
 * Matches backend UploadVerificationDocumentDto exactly.
 * NOTE: this is a plain JSON body — POST /verifications/documents has no
 * FileInterceptor, it only accepts already-uploaded file metadata (the file
 * itself goes through uploadApi.uploadDocument() first).
 */
export interface UploadVerificationDocumentPayload {
  type: string;
  fileUrl: string;
  fileKey?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export const verificationsApi = {
  uploadDocuments: (payload: UploadVerificationDocumentPayload) =>
    api.post('/verifications/documents', payload),

  getMyDocuments: () => api.get('/verifications/my-documents'),

  getMyChecklist: () => api.get('/verifications/my-checklist'),

  getPendingVerifications: () => api.get('/verifications/admin/pending'),

  updateDocumentStatus: (id: string, status: string, rejectionReason?: string) =>
    api.patch(`/verifications/documents/${id}/status`, { status, ...(rejectionReason && { rejectionReason }) }),
};

// ============================================
// GUIDE FINANCIAL API
// ============================================
export const guideFinancialApi = {
  listPayoutAccounts: () => api.get('/guides/payout-accounts'),

  createPayoutAccount: (data: {
    provider: 'EASYPAISA' | 'JAZZCASH' | 'BANK_ACCOUNT';
    accountTitle: string;
    mobileNumber?: string;
    iban?: string;
    bankName?: string;
    isDefault?: boolean;
  }) => api.post('/guides/payout-accounts', data),

  updatePayoutAccount: (
    id: string,
    data: {
      accountTitle?: string;
      mobileNumber?: string;
      iban?: string;
      bankName?: string;
      isDefault?: boolean;
    },
  ) => api.put(`/guides/payout-accounts/${id}`, data),

  deletePayoutAccount: (id: string) => api.delete(`/guides/payout-accounts/${id}`),

  setDefaultPayoutAccount: (id: string) =>
    api.patch(`/guides/payout-accounts/${id}/default`),

  getWallet: (params?: { status?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/guides/wallet', { params }),
};

export default api;