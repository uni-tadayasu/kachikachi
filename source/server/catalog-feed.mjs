const FRESH_MS = 6 * 60 * 60 * 1000;
const RETRY_MS = 15 * 60 * 1000;
const SOURCE_TIMEOUT_MS = 4500;
const SOURCE_MAX_BYTES = 1024 * 1024;
const ITEMS_PER_SOURCE = 8;
const INGEST_MAX_BYTES = 64 * 1024;

const sources = [
  {
    id: 'sammy-pachinko', name: 'サミー（パチンコ）', maker: 'サミー', type: 'pachinko',
    url: 'https://www.sammy.co.jp/japanese/products/pachinko/',
    endpoint: 'https://www.sammy.co.jp/assets/js/pachinko.json', parse: parseSammy,
  },
  {
    id: 'sammy-slot', name: 'サミー（パチスロ）', maker: 'サミー', type: 'slot',
    url: 'https://www.sammy.co.jp/japanese/products/pachislot/',
    endpoint: 'https://www.sammy.co.jp/assets/js/slot.json', parse: parseSammy,
  },
  {
    id: 'heiwa-pachinko', name: '平和（パチンコ）', maker: '平和', type: 'pachinko',
    url: 'https://www.heiwanet.co.jp/products/pachinko/', parse: parseHeiwa,
  },
  {
    id: 'heiwa-slot', name: '平和（パチスロ）', maker: '平和', type: 'slot',
    url: 'https://www.heiwanet.co.jp/products/pachislot/', parse: parseHeiwa,
  },
  {
    id: 'kitadenshi-slot', name: '北電子（パチスロ）', maker: '北電子', type: 'slot',
    url: 'https://www.kitadenshi.co.jp/hallnews/slot/', parse: parseKitadenshi,
  },
];

const entityCharacters = { amp: '&', quot: '"', apos: "'", nbsp: ' ', lt: '<', gt: '>' };

function cleanText(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/<[^>]*>/g, '').replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|nbsp|lt|gt);/gi, (entity, name) => {
    if (!name.startsWith('#')) return entityCharacters[name.toLowerCase()] ?? entity;
    const code = name[1].toLowerCase() === 'x' ? Number.parseInt(name.slice(2), 16) : Number(name.slice(1));
    return code > 0 && code <= 0x10ffff && (code < 0xd800 || code > 0xdfff) ? String.fromCodePoint(code) : '';
  }).replace(/[\p{Cc}\p{Cf}\s]+/gu, ' ').trim().slice(0, 160);
}

function productUrl(link, source) {
  if (!link) return source.url;
  try {
    const url = new URL(link.replace(/&amp;/gi, '&'), source.url);
    if (url.origin !== new URL(source.url).origin || url.username || url.password) return source.url;
    url.hash = '';
    return url.href;
  } catch {
    return source.url;
  }
}

function itemId(source, title) {
  // Titles may share a generic product-index link. Hash the title for a stable per-title ID.
  let hash = 2166136261;
  for (const character of title.normalize('NFKC').toLowerCase()) {
    hash = Math.imul(hash ^ character.codePointAt(0), 16777619);
  }
  return `${source.id}-${(hash >>> 0).toString(36)}`;
}

function asItem(source, title, rawDate, link, dateKind, maker = source.maker) {
  title = cleanText(title);
  const match = String(rawDate).normalize('NFKC').match(/(20\d{2})\s*(?:年|[./-])\s*(\d{1,2})(?:\s*(?:月|[./-])\s*(\d{1,2})\s*日?)?/);
  if (!title || !match) return null;
  const [, year, month, day] = match;
  if (Number(month) < 1 || Number(month) > 12 || (day && (Number(day) < 1 || Number(day) > 31))) return null;
  const date = `${year}-${month.padStart(2, '0')}${day ? `-${day.padStart(2, '0')}` : ''}`;
  const dateLabel = `${year}年${Number(month)}月${day ? `${Number(day)}日` : ''}${dateKind === 'announcement' ? ' 発表' : ''}`;
  return { id: itemId(source, title), sourceId: source.id, title, type: source.type, maker, date, dateLabel, dateKind, url: productUrl(link, source), sourceUrl: source.url };
}

function parseSammy(body, source) {
  const parsed = JSON.parse(body);
  if (!Array.isArray(parsed.products)) return [];
  return parsed.products.slice(0, ITEMS_PER_SOURCE * 2).flatMap(record => {
    if (!record || !/^20\d{2}$/.test(String(record.year)) || !/^\d{1,2}$/.test(String(record.month))) return [];
    const maker = cleanText(record.maker);
    return asItem(source, record.title, `${record.year}-${record.month}`, typeof record.url === 'string' ? record.url : '', 'release', maker && maker !== 'Sammy' ? maker : source.maker) ?? [];
  });
}

function parseHeiwa(body, source) {
  const section = body.split(/<ul\b[^>]*class=["'][^"']*\bproducts-list-by-model\b[^"']*["'][^>]*>/i)[1];
  if (!section) return [];
  return section.split(/<li\b[^>]*class=["']item["'][^>]*>/i).slice(1, ITEMS_PER_SOURCE * 2 + 1).flatMap(block => {
    const title = block.match(/<h4\b[^>]*>([\s\S]*?)<\/h4>/i)?.[1];
    const release = block.match(/<span\b[^>]*class=["']release["'][^>]*>([\s\S]*?)<\/span>/i)?.[1];
    const link = block.match(/<li\b[^>]*class=["'][^"']*\bproducts-site\b[^"']*["'][^>]*>\s*<a\b[^>]*href=["']([^"']+)["']/i)?.[1];
    const maker = block.match(/class=["'][^"']*\bmanufacturer\b[^"']*["'][^>]*>\s*<img\b[^>]*\balt=["']([^"']+)["']/i)?.[1];
    return asItem(source, title, cleanText(release), link, 'release', maker && maker !== 'HEIWA' ? cleanText(maker) : source.maker) ?? [];
  });
}

function parseKitadenshi(body, source) {
  const section = body.split(/<ul\b[^>]*class=["']news-list["'][^>]*>/i)[1];
  if (!section) return [];
  return section.split(/<li\b[^>]*class=["']news-list_item["'][^>]*>/i).slice(1, ITEMS_PER_SOURCE * 2 + 1).flatMap(block => {
    const link = block.match(/<a\b[^>]*class=["']news-link["'][^>]*\bhref=["']([^"']+)["']/i)?.[1];
    const text = cleanText(block.match(/<div\b[^>]*class=["']news-link_text["'][^>]*>([\s\S]*?)<\/div>/i)?.[1]);
    const title = text.match(/^(.*?)\s*(?:製品情報|特設サイト)を公開/u)?.[1];
    const date = cleanText(block.match(/<time\b[^>]*>([\s\S]*?)<\/time>/i)?.[1]);
    return asItem(source, title, date, link, 'announcement') ?? [];
  });
}

async function readSource(response) {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Source response is empty');
  const decoder = new TextDecoder();
  let size = 0;
  let body = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return body + decoder.decode();
      size += value.byteLength;
      if (size > SOURCE_MAX_BYTES) {
        await reader.cancel();
        throw new Error('Source response exceeds the size limit');
      }
      body += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

async function fetchSource(source, fetcher) {
  try {
    const response = await fetcher(source.endpoint ?? source.url, {
      redirect: 'error', signal: AbortSignal.timeout(SOURCE_TIMEOUT_MS),
      headers: { Accept: source.endpoint ? 'application/json' : 'text/html' },
    });
    if (!response.ok || Number(response.headers.get('Content-Length')) > SOURCE_MAX_BYTES) {
      console.warn('Catalog source response rejected', source.id, response.status);
      return [];
    }
    const items = source.parse(await readSource(response), source);
    if (!items.length) console.warn('Catalog source returned no recognizable entries', source.id);
    return [...new Map(items.map(item => [item.id, item])).values()].slice(0, ITEMS_PER_SOURCE);
  } catch (error) {
    console.warn('Catalog source fetch failed', source.id, error.name, error.message);
    return [];
  }
}

function sortItems(items) {
  return items.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'ja'));
}

async function readSnapshot(db) {
  if (!db) return null;
  try {
    const row = await db.prepare("SELECT payload FROM catalog_feed WHERE id = 'latest'").first();
    return row ? JSON.parse(row.payload) : null;
  } catch (error) {
    console.warn('Catalog snapshot read failed', error.message);
    return null;
  }
}

function emptyFeed() {
  return { updatedAt: null, items: [], sources: sources.map(({ id, name, url }) => ({ id, name, url, ok: false, checkedAt: null })), stale: true };
}

let memoryFeed;
let nextAttempt = 0;

function combineFeed(fetched, checkedAt, previous) {
  return {
    updatedAt: fetched.some(items => items.length) ? checkedAt : previous.updatedAt,
    items: sortItems(fetched.flatMap((items, i) => items.length ? items : previous.items.filter(item => item.sourceId === sources[i].id))),
    sources: sources.map(({ id, name, url }, i) => ({
      id, name, url, ok: fetched[i].length > 0,
      checkedAt: fetched[i].length ? checkedAt : previous.sources.find(source => source.id === id)?.checkedAt ?? null,
    })),
    stale: fetched.some(items => !items.length),
  };
}

async function storeCatalog(fetched, env) {
  const checkedAt = new Date().toISOString();
  const successful = fetched.some(items => items.length);
  let previous = await readSnapshot(env.DB) ?? memoryFeed ?? env.CATALOG_SEED ?? emptyFeed();
  let result = combineFeed(fetched, checkedAt, previous);
  let persisted = false;
  if (successful && env.DB) {
    try {
      for (let attempt = 0; attempt < 3 && !persisted; attempt++) {
        const update = await env.DB.prepare(`
          INSERT INTO catalog_feed (id, payload, updated_at) VALUES ('latest', ?, ?)
          ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at
          WHERE catalog_feed.updated_at = ? AND catalog_feed.updated_at <= excluded.updated_at
        `).bind(JSON.stringify(result), checkedAt, previous.updatedAt).run();
        persisted = Boolean(update.meta.changes);
        if (!persisted) {
          previous = await readSnapshot(env.DB) ?? previous;
          if (previous.updatedAt >= checkedAt) {
            result = previous;
            persisted = true;
          } else {
            result = combineFeed(fetched, checkedAt, previous);
          }
        }
      }
    } catch (error) {
      console.warn('Catalog snapshot write failed', error.message);
    }
  }
  memoryFeed = result;
  nextAttempt = Date.now() + (result.stale ? RETRY_MS : FRESH_MS);
  return { ...result, successful, persisted };
}

export async function refreshCatalog(env = {}, fetcher = fetch) {
  const fetched = await Promise.all(sources.map(source => fetchSource(source, fetcher)));
  return storeCatalog(fetched, env);
}

function json(feed, status = 200) {
  return Response.json(feed, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

function publicFeed(feed) {
  const { updatedAt, items, sources, stale } = feed;
  return { updatedAt, items, sources, stale };
}

export async function handleCatalogFeed(request, ctx, env = {}) {
  if (request.method !== 'GET') return new Response(null, { status: 405, headers: { Allow: 'GET' } });
  const saved = await readSnapshot(env.DB);
  const latest = saved && (!memoryFeed?.updatedAt || saved.updatedAt > memoryFeed.updatedAt) ? saved : memoryFeed ?? saved ?? env.CATALOG_SEED;
  const maxAge = latest?.stale ? RETRY_MS : FRESH_MS;
  if (latest && Date.now() - Date.parse(latest.updatedAt) < maxAge) return json(publicFeed(latest));
  if (latest && Date.now() < nextAttempt) return json(publicFeed({ ...latest, stale: true }));
  if (latest?.items.length && ctx?.waitUntil) {
    nextAttempt = Date.now() + RETRY_MS;
    ctx.waitUntil(refreshCatalog(env));
    return json(publicFeed({ ...latest, stale: true }));
  }
  return json(publicFeed(await refreshCatalog(env)));
}

// The routing layer must verify access before calling this write endpoint.
export async function handleCatalogRefresh(request, env = {}) {
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
  const result = await refreshCatalog(env);
  return json(result, result.persisted ? 200 : 503);
}

function verifyIngestItems(records) {
  if (!Array.isArray(records) || !records.length || records.length > sources.length * ITEMS_PER_SOURCE) return null;
  const bySource = sources.map(() => new Map());
  for (const record of records) {
    if (!record || typeof record !== 'object' || typeof record.url !== 'string' || record.url.length > 750) return null;
    const index = sources.findIndex(source => source.id === record.sourceId);
    if (index < 0) return null;
    const source = sources[index];
    const sourceDateKind = source.id === 'kitadenshi-slot' ? 'announcement' : 'release';
    const datePattern = sourceDateKind === 'announcement' ? /^20\d{2}-\d{2}-\d{2}$/ : /^20\d{2}-\d{2}$/;
    if (record.type !== source.type || record.dateKind !== sourceDateKind || !datePattern.test(record.date) ||
        record.sourceUrl !== source.url || productUrl(record.url, source) !== record.url) return null;
    const item = asItem(source, record.title, record.date, record.url, sourceDateKind, cleanText(record.maker) || source.maker);
    if (!item || item.date !== record.date || (record.date.length === 10 && new Date(`${record.date}T00:00:00Z`).toISOString().slice(0, 10) !== record.date)) return null;
    bySource[index].set(item.id, item);
    if (bySource[index].size > ITEMS_PER_SOURCE) return null;
  }
  return bySource.map(items => [...items.values()]);
}

// The routing layer must verify owner or service access before calling this write endpoint.
export async function handleCatalogIngest(request, env = {}) {
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST' } });
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return json({ error: 'Expected JSON' }, 415);
  if (Number(request.headers.get('Content-Length')) > INGEST_MAX_BYTES) return json({ error: 'Snapshot is too large' }, 413);
  let fetched;
  try {
    const reader = request.body?.getReader();
    if (!reader) return json({ error: 'Snapshot is missing' }, 400);
    const decoder = new TextDecoder('utf-8', { fatal: true });
    let bytes = 0;
    let content = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > INGEST_MAX_BYTES) {
        await reader.cancel();
        return json({ error: 'Snapshot is too large' }, 413);
      }
      content += decoder.decode(value, { stream: true });
    }
    fetched = verifyIngestItems(JSON.parse(content + decoder.decode())?.items);
  } catch {
    return json({ error: 'Invalid snapshot' }, 400);
  }
  if (!fetched) return json({ error: 'Invalid snapshot' }, 400);
  const result = await storeCatalog(fetched, env);
  if (!result.persisted) return json({ error: 'Snapshot could not be stored' }, 503);
  const saved = await readSnapshot(env.DB);
  if (!saved?.updatedAt || saved.updatedAt < result.updatedAt) return json({ error: 'Snapshot readback failed' }, 503);
  return json({ ...publicFeed(saved), persisted: true });
}
