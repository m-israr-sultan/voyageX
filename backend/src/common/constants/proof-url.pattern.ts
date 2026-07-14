/**
 * Accepted formats for uploaded proof/receipt references (bank transfer
 * payment proofs, subscription payment proofs):
 *
 *   1. Absolute URL — https://example.com/... (legacy / external links)
 *   2. Relative backend proxy path — /api/v1/images/{bucket}/{fileName}
 *      (current upload flow: POST /upload/image returns this proxy path,
 *      see backend/src/modules/images/images.service.ts)
 *
 * `@IsUrl()` alone rejects (2), which is what the upload endpoint actually
 * returns — this pattern keeps validation strict while accepting both.
 */
export const PROOF_URL_PATTERN =
  /^(https?:\/\/\S+|\/api\/v1\/images\/[A-Za-z0-9_-]+\/[A-Za-z0-9._-]+)$/;

export const PROOF_URL_MESSAGE =
  'proofUrl must be a full URL or a valid /api/v1/images/{bucket}/{fileName} proxy path';
