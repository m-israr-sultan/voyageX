/**
 * Image URL utilities for VoyageX
 *
 * Backend upload response:
 *   { path: "filename.jpg", url: "/api/v1/images/images/filename.jpg" }
 *
 * Store relative proxy path in DB.
 * Use getImageUrl() when rendering images.
 */

const PLACEHOLDER = "/agency-placeholder.jpg";

/**
 * API origin without /api/v1
 * NEXT_PUBLIC_API_URL example:
 *   https://voyagex-v7ht.onrender.com/api/v1
 */
function getApiOrigin(): string {
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  return apiUrl.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");
}

/**
 * Convert stored image value into a browser-loadable absolute URL.
 */
export function getImageUrl(path?: string | null): string {
  if (!path || typeof path !== "string" || path.trim() === "") {
    return PLACEHOLDER;
  }

  const value = path.trim();

  // Absolute URL / local preview
  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("blob:") ||
    value.startsWith("data:")
  ) {
    // Rewrite old local upload URLs
    if (value.includes("/uploads/images/")) {
      const fileName = value.split("/uploads/images/").pop();
      if (fileName) {
        return `${getApiOrigin()}/api/v1/images/images/${fileName}`;
      }
    }
    return value;
  }

  // Correct proxy path
  if (value.startsWith("/api/v1/images/")) {
    return `${getApiOrigin()}${value}`;
  }

  // Old relative upload path
  if (value.startsWith("/uploads/images/")) {
    const fileName = value.replace("/uploads/images/", "");
    return `${getApiOrigin()}/api/v1/images/images/${fileName}`;
  }

  // Other relative path
  if (value.startsWith("/")) {
    return `${getApiOrigin()}${value}`;
  }

  // Bare filename
  return `${getApiOrigin()}/api/v1/images/images/${value}`;
}

/**
 * Extract path to store in DB from upload API response.
 * Prefer backend `url` (proxy path).
 */
export function extractUploadPath(uploadResponseData: any): string {
  const body = uploadResponseData?.data ?? uploadResponseData;

  if (body?.url && typeof body.url === "string") {
    return body.url; // /api/v1/images/images/xxx.jpg
  }

  if (body?.data?.url && typeof body.data.url === "string") {
    return body.data.url;
  }

  const fileName = body?.path || body?.data?.path || body?.fileName || "";
  if (fileName) {
    if (String(fileName).startsWith("/api/v1/images/")) {
      return String(fileName);
    }
    return `/api/v1/images/images/${fileName}`;
  }

  return "";
}

/**
 * Extract multiple upload paths.
 */
export function extractUploadPaths(uploadResponseData: any): string[] {
  const body = uploadResponseData?.data ?? uploadResponseData;
  const list = Array.isArray(body)
    ? body
    : Array.isArray(body?.data)
      ? body.data
      : [];

  return list
    .map((item: any) => extractUploadPath(item))
    .filter((p: string) => Boolean(p));
}

/**
 * UNIFIED UPLOAD CONTRACT
 *
 * Every upload flow (verification documents, package images, destination
 * images, payment/subscription proofs) must transform the raw
 * `uploadApi.uploadImage()` / `uploadApi.uploadDocument()` response into
 * this shape before sending it to any other endpoint. This is the single
 * place that reconciles the backend's `{ path, url }` response into a
 * consistent contract, so every feature-specific DTO builder maps from the
 * same fields instead of re-deriving them ad hoc.
 */
export interface UploadContract {
  /** Relative proxy path — store this, never a hardcoded absolute URL. */
  path: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export function buildUploadContract(
  uploadResponseData: any,
  file: File,
): UploadContract {
  return {
    path: extractUploadPath(uploadResponseData),
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  };
}