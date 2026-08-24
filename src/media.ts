type ProductMediaObject = {
  body: ReadableStream | null;
  httpEtag: string;
  writeHttpMetadata: (headers: Headers) => void;
};

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
  const bucket = getRuntimeEnvironment()?.PRODUCT_MEDIA;
  if (!bucket || typeof bucket !== "object" || !("put" in bucket) || !("get" in bucket)) return null;
  return bucket as ProductMediaBucket;
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
