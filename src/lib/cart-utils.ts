export type CartLine = { slug: string; qty: number };

export function normalizeCartLines(entries: unknown, validSlugs: Set<string>): CartLine[] {
  if (!Array.isArray(entries)) {
    return [];
  }

  const next = new Map<string, number>();

  for (const item of entries) {
    if (!item || typeof item !== "object") continue;

    const record = item as Record<string, unknown>;
    const slug = typeof record["slug"] === "string" ? String(record["slug"]).trim() : "";
    const qtyValue = Number(record["qty"]);
    const qty = Number.isFinite(qtyValue) ? qtyValue : 0;

    if (!slug || qty <= 0 || (validSlugs.size > 0 && !validSlugs.has(slug))) {
      continue;
    }

    const current = next.get(slug) ?? 0;
    next.set(slug, current + qty);
  }

  return Array.from(next.entries()).map(([slug, qty]) => ({ slug, qty }));
}
