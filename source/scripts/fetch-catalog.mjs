import { execFile } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { refreshCatalog } from '../server/catalog-feed.mjs';

const run = promisify(execFile);
const output = process.argv[2];
if (!output || process.argv.length !== 3) {
  console.error('Usage: node scripts/fetch-catalog.mjs <snapshot.json>');
  process.exitCode = 2;
} else {
  const { successful, persisted, ...snapshot } = await refreshCatalog({}, async (url, options) => {
    const { stdout } = await run('curl', [
      '--silent', '--show-error', '--fail', '--compressed', '--max-time', '20',
      '--proto', '=https', '--max-filesize', '1048576',
      '--header', `Accept: ${options.headers.Accept}`, '--', url,
    ], { maxBuffer: 1024 * 1024, encoding: 'buffer' });
    return new Response(stdout);
  });
  if (!successful) {
    console.error('Every official source failed. The previous snapshot was preserved.');
    process.exitCode = 1;
  } else {
    await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`, { mode: 0o600 });
    console.error(`Saved ${snapshot.items.length} entries from ${snapshot.sources.filter(source => source.ok).length} official sources.`);
  }
}
