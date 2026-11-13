import { execFileSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildStaticSite } from './static-site.mjs';

const [, , output, base] = process.argv;
if (!output) {
  console.error('Usage: node source/scripts/rebuild-portable.mjs <new-output-folder> [public-site-url]');
  process.exit(2);
}

const siteRoot = fileURLToPath(new URL('../../', import.meta.url));
const renderer = fileURLToPath(new URL('./render.mjs', import.meta.url));
const workspace = await mkdtemp(join(tmpdir(), 'zettai-rebuild-'));
try {
  const dist = join(workspace, 'dist');
  await mkdir(dist, { recursive: true });
  await cp(join(siteRoot, 'assets'), join(dist, 'assets'), { recursive: true });
  execFileSync(process.execPath, [renderer, ...(base ? [base] : [])], { cwd: workspace, stdio: 'inherit' });
  console.log('Validated ' + await buildStaticSite(dist, resolve(output), base) + ' public pages.');
} finally {
  await rm(workspace, { recursive: true, force: true });
}
