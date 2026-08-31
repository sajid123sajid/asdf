type ProductMediaObject = {
  body: ReadableStream | null;
  httpEtag: string;
  writeHttpMetadata: (headers: Headers) => void;
};

export const PRODUCT_MEDIA_MAX_BYTES = 5 * 1024 * 1024;
export const PRODUCT_VIDEO_MAX_BYTES = 50 * 1024 * 1024;
const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/svg+xml",
]);
const VIDEO_MIME_TYPES = new Set(["video/mp4", "video/webm"]);

export type ProductMediaBucket = {
  put: (
    key: string,
    value: ArrayBuffer,
    options: { httpMetadata: { contentType: string }; customMetadata: Record<string, string> }
  ) => Promise<unknown>;
  get: (key: string) => Promise<ProductMediaObject | null>;
};

function getRuntimeEnvironment(): Record<string, unknown> | null {
  const runtime = globalThis as { __CLOUDFLARE_ENV__?: unknown };
  const env = runtime.__CLOUDFLARE_ENV__;
  return env && typeof env === "object" ? (env as Record<string, unknown>) : null;
}

export function getProductMediaBucket(): ProductMediaBucket | null {
  const bucket = getRuntimeEnvironment()?.["PRODUCT_MEDIA"];
  if (!bucket || typeof bucket !== "object" || !("put" in bucket) || !("get" in bucket)) return null;
  return bucket as ProductMediaBucket;
}

export function buildProductMediaUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith("/")) return trimmed;
  return `/media/${trimmed.split("/").map(encodeURIComponent).join("/")}`;
}

export function createProductMediaObjectKey(filename: string, productId?: string): string {
  const original = (filename ?? "").replace(/\\/g, "/").split("/").pop() ?? "product-image";
  const safeStem = original
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "product-image";
  const extension = original.includes(".") ? original.slice(original.lastIndexOf(".")) : ".jpg";
  const safeExtension = /\.[a-z0-9]+$/i.test(extension) ? extension.toLowerCase() : ".jpg";
  const suffix = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const productPrefix = productId ? `${productId}/` : "";
  return `products/${productPrefix}${safeStem}-${suffix}${safeExtension}`;
}

function decodeObjectKey(value: string): string | null {
  try {
    const key = value.split("/").map(decodeURIComponent).join("/");
    if (!key || key.includes("..") || key.startsWith("/") || key.length > 1024) return null;
    return key;
  } catch {
    return null;
  }
}

export async function validateProductImageUpload(file: Blob | File | null | undefined, maxBytes = PRODUCT_MEDIA_MAX_BYTES): Promise<{ ok: true; file: File | Blob; contentType: string; size: number } | { ok: false; error: string }> {
  if (!file) return { ok: false, error: "No image selected." };
  if (file.size <= 0 || file.size > maxBytes) {
    return { ok: false, error: `Image size must be between 1 byte and ${Math.round(maxBytes / (1024 * 1024))}MB.` };
  }

  const contentType = (file.type || "").toLowerCase();
  if (!contentType || !IMAGE_MIME_TYPES.has(contentType)) {
    return { ok: false, error: "Only common image formats are allowed for product uploads." };
  }

  return { ok: true, file, contentType, size: file.size };
}

export async function validateProductVideoUpload(file: Blob | File | null | undefined, maxBytes = PRODUCT_VIDEO_MAX_BYTES): Promise<{ ok: true; file: File | Blob; contentType: string; size: number } | { ok: false; error: string }> {
  if (!file) return { ok: false, error: "No video selected." };
  if (file.size <= 0 || file.size > maxBytes) return { ok: false, error: `Video size must be between 1 byte and ${Math.round(maxBytes / (1024 * 1024))}MB.` };
  const contentType = (file.type || "").toLowerCase();
  if (!VIDEO_MIME_TYPES.has(contentType)) return { ok: false, error: "Only MP4 and WebM videos are allowed." };
  return { ok: true, file, contentType, size: file.size };
}

/** Public, cacheable route for media stored in the private R2 bucket. */
export async function serveProductMedia(request: Request): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", { status: 405 });
  const url = new URL(request.url);
  const key = decodeObjectKey(url.pathname.slice("/media/".length));
  if (!key) return new Response("Not found", { status: 404 });
  const bucket = getProductMediaBucket();
  if (!bucket) return new Response("Media storage is not configured", { status: 503 });

  const object = await bucket.get(key);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers({
    etag: object.httpEtag,
    "cache-control": "public, max-age=31536000, immutable",
    "x-content-type-options": "nosniff",
  });
  object.writeHttpMetadata(headers);
  return new Response(request.method === "HEAD" ? null : object.body, { headers });
}
