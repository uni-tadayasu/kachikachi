import { cp, mkdir, readFile, readdir, rename, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const publicFiles = [
  'index.html', '404.html', 'assets', 'machines', 'guides', 'glossary', 'updates', 'play', 'tools', 'site.webmanifest',
];
const localAttribute = /\b(href|src|action|poster)="([^"]+)"/gi;
const scriptLd = /(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/i;
const emptyRobots = 'User-agent: *\nAllow: /\n';

function safeBase(value) {
  if (!value) return null;
  const url = new URL(value);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('The public site URL must be an HTTP(S) URL without credentials, query or fragment.');
  }
  url.pathname = url.pathname.replace(/\/*$/, '/');
  return url;
}

function escapeMarkup(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

async function visit(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error('Symbolic links cannot be exported: ' + path);
    if (entry.isDirectory()) files.push(...await visit(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

async function exists(path) {
  try {
    return await stat(path);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

function pagePath(file, site) {
  const parts = relative(site, file).split(sep);
  const name = parts.pop();
  return [...parts, name === 'index.html' ? '' : name].join('/');
}

function toPortableHtml(html, route, base) {
  const prefix = '../'.repeat(route.split('/').length - 1) || './';
  let content = html
    .replace(/<link\b[^>]*\brel="canonical"[^>]*>/gi, '')
    .replace(/<meta\b[^>]*\bname="zettai-site-root"[^>]*>/gi, '')
    .replace(/<meta\b[^>]*\bproperty="og:(?:url|image)"[^>]*>/gi, '')
    .replace(localAttribute, (full, attr, value) => value.startsWith('/') && !value.startsWith('//')
      ? attr + '="' + prefix + value.slice(1) + '"' : full)
    .replace(/\bsrcset="([^"]+)"/gi, (full, candidates) => 'srcset="' + candidates.split(',').map(candidate =>
      candidate.replace(/^(\s*)\/(?!\/)/, '$1' + prefix)).join(',') + '"');

  const canonical = base ? new URL(route, base).href : '';
  const imageUrl = base ? new URL('assets/ogp.jpg', base).href : prefix + 'assets/ogp.jpg';
  const metadata = [
    '<meta name="zettai-site-root" content="' + prefix + '">',
    '<meta property="og:image" content="' + escapeMarkup(imageUrl) + '">',
    ...(canonical ? [
      '<link rel="canonical" href="' + escapeMarkup(canonical) + '">',
      '<meta property="og:url" content="' + escapeMarkup(canonical) + '">',
    ] : []),
  ].join('');
  content = content.replace('</head>', metadata + '</head>').replace(scriptLd, (_, before, json, after) => {
    const data = JSON.parse(json);
    if (canonical) data.url = canonical;
    else delete data.url;
    return before + JSON.stringify(data).replaceAll('<', '\\u003c') + after;
  });
  return content;
}

async function verifyPageLinks(output, pages) {
  for (const page of pages) {
    const html = await readFile(page, 'utf8');
    for (const prefix of ['', '/subfolder']) {
      const root = new URL('https://verify.invalid' + prefix + '/');
      const currentPage = new URL(pagePath(page, output), root);
      for (const [, , attribute] of html.matchAll(localAttribute)) {
        if (/^(?:[a-z][\w+.-]*:|\/\/|#)/i.test(attribute)) continue;
        const target = new URL(attribute, currentPage);
        if (!target.pathname.startsWith(root.pathname)) {
          throw new Error('Link escapes the hosting folder: ' + currentPage.pathname + ' → ' + attribute);
        }
        const path = join(output, decodeURIComponent(target.pathname.slice(root.pathname.length)));
        const info = await exists(path);
        if (!info || (info.isDirectory() && !await exists(join(path, 'index.html')))) {
          throw new Error('Missing local link: ' + currentPage.pathname + ' → ' + attribute);
        }
      }
    }
  }
}

export async function buildStaticSite(inputPath, outputPath, baseUrl) {
  const input = resolve(inputPath);
  const output = resolve(outputPath);
  if (input === output || input.startsWith(output + sep)) {
    throw new Error('Choose a new output folder outside of the source folders.');
  }
  if (await exists(join(output, 'index.html'))) {
    throw new Error('The output folder already contains a website. Choose a new folder.');
  }
  const base = safeBase(baseUrl);
  await mkdir(output, { recursive: true });
  for (const filename of publicFiles) {
    const file = join(input, filename);
    if (!await exists(file)) continue;
    if (filename === 'assets') await visit(file);
    await cp(file, join(output, filename), { recursive: true, errorOnExist: true });
  }
  if (!await exists(join(output, 'index.html'))) throw new Error('The input folder has no index.html.');
  const pages = (await visit(output)).filter(file => extname(file) === '.html');
  for (const file of pages) {
    await writeFile(file, toPortableHtml(await readFile(file, 'utf8'), pagePath(file, output), base));
  }
  const manifestFile = join(output, 'site.webmanifest');
  const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
  manifest.start_url = './';
  manifest.scope = './';
  for (const icon of manifest.icons ?? []) icon.src = icon.src.replace(/^\/+/, './');
  await writeFile(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
  await writeFile(join(output, '.nojekyll'), '');
  await writeFile(join(output, 'robots.txt'), emptyRobots + (base ? 'Sitemap: ' + new URL('sitemap.xml', base).href + '\n' : ''));
  if (base) {
    const routes = pages.map(file => pagePath(file, output)).filter(route => route !== '404.html');
    const entries = routes.map(route => '<url><loc>' + escapeMarkup(new URL(route, base).href) + '</loc></url>');
    await writeFile(join(output, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + entries.join('\n') + '\n</urlset>\n');
  }
  await verifyPageLinks(output, pages);
  return pages.length;
}

async function mergeFeed(candidatePath, previousPath) {
  const candidate = JSON.parse(await readFile(candidatePath, 'utf8'));
  const previous = JSON.parse(await readFile(previousPath, 'utf8'));
  if (!Array.isArray(candidate.items) || !candidate.items.length || !Array.isArray(candidate.sources)) {
    throw new Error('No updated official items.');
  }
  const updated = new Set(candidate.sources.filter(source => source.ok).map(source => source.id));
  const earlierItems = previous.items.filter(item => !updated.has(item.sourceId));
  candidate.items.push(...earlierItems);
  candidate.items.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title, 'ja'));
  for (const source of candidate.sources) {
    if (!source.ok) source.checkedAt = previous.sources.find(earlier => earlier.id === source.id)?.checkedAt ?? null;
  }
  const temporary = previousPath + '.next';
  await writeFile(temporary, JSON.stringify(candidate, null, 2) + '\n');
  await rename(temporary, previousPath);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [, , input, output, base] = process.argv;
  if (input === '--merge-feed' && output && base) await mergeFeed(output, base);
  else if (input && output) console.log('Validated ' + await buildStaticSite(input, output, base) + ' public pages.');
  else {
    console.error('Usage: node static-site.mjs <input-folder> <new-output-folder> [public-site-url]');
    process.exitCode = 2;
  }
}
