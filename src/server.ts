import "./lib/error-capture";

import { isAdminUser } from "./auth";
import { getUserBySession } from "./db";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { buildProductMediaUrl, createProductMediaObjectKey, getProductMediaBucket, serveProductMedia, validateProductImageUpload, validateProductVideoUpload } from "./media";
import { processSslcommerzCallback } from "./payment";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

function getSessionIdFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.trim().split("=");
    if (name === "zupona_session") {
      return decodeURIComponent(rest.join("="));
    }
  }
  return null;
}

async function getAuthenticatedAdminForRequest(request: Request) {
  const sessionId = getSessionIdFromRequest(request);
  if (!sessionId) return null;
  const user = await getUserBySession(sessionId);
  if (!user) return null;
  const safeUser = {
    id: user.id,
    email: user.email,
    role: user.role ?? "customer",
    name: user.name,
    phone: user.phone,
    address: user.address,
  };
  if (!isAdminUser(safeUser)) return null;
  return safeUser;
}

async function handleProductMediaUpload(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed." }), { status: 405, headers: { "content-type": "application/json" } });
  }

  const adminUser = await getAuthenticatedAdminForRequest(request);
  if (!adminUser) {
    return new Response(JSON.stringify({ error: "Sign in with an administrator account to continue." }), { status: 401, headers: { "content-type": "application/json" } });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return new Response(JSON.stringify({ error: "Multipart form upload is required." }), { status: 400, headers: { "content-type": "application/json" } });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return new Response(JSON.stringify({ error: "Choose an image file to upload." }), { status: 400, headers: { "content-type": "application/json" } });
  }

  const mediaType = formData.get("mediaType") === "video" ? "video" : "image";
  const validation = mediaType === "video"
    ? await validateProductVideoUpload(file)
    : await validateProductImageUpload(file);
  if (!validation.ok) {
    return new Response(JSON.stringify({ error: validation.error }), { status: 400, headers: { "content-type": "application/json" } });
  }

  const bucket = getProductMediaBucket();
  if (!bucket) {
    return new Response(JSON.stringify({ error: "Product image storage is not configured in Cloudflare R2." }), { status: 503, headers: { "content-type": "application/json" } });
  }

  const objectKey = createProductMediaObjectKey(file.name || (mediaType === "video" ? "product-video.mp4" : "product-image.jpg"), String(adminUser.id));
  const arrayBuffer = await file.arrayBuffer();
  await bucket.put(objectKey, arrayBuffer, {
    httpMetadata: { contentType: validation.contentType || "image/jpeg" },
    customMetadata: { uploadedBy: String(adminUser.id), originalName: file.name || `product-${mediaType}` },
  });

  return new Response(JSON.stringify({ objectKey, url: buildProductMediaUrl(objectKey), altText: file.name || `Product ${mediaType}` }), {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    if (env) {
      (globalThis as any).__CLOUDFLARE_ENV__ = env;
    }
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/media/")) {
        return await serveProductMedia(request);
      }
      if (url.pathname === "/api/admin/product-media") {
        return await handleProductMediaUpload(request);
      }
      const pathname = url.pathname;
      if (pathname === "/payments/sslcommerz/success") return await processSslcommerzCallback(request);
      if (pathname === "/payments/sslcommerz/fail") return await processSslcommerzCallback(request);
      if (pathname === "/payments/sslcommerz/cancel") return await processSslcommerzCallback(request);
      if (pathname === "/payments/sslcommerz/ipn") return await processSslcommerzCallback(request, false);
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
