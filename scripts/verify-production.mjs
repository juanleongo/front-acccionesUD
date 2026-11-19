import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readdir, stat, mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const root = fileURLToPath(new URL('../', import.meta.url));
const chunks = path.join(root, '.next', 'static', 'chunks');
const files = (await readdir(chunks, { recursive: true })).filter((name) =>
  name.endsWith('.js'),
);
let largestChunkBytes = 0;
for (const file of files) {
  const size = (await stat(path.join(chunks, file))).size;
  largestChunkBytes = Math.max(largestChunkBytes, size);
  assert(
    size <= 1_000_000,
    `JavaScript chunk exceeds 1 MB: ${file} (${size} bytes)`,
  );
}
// Obtain a free loopback port; never reuse a running development server.
const reservation = createServer();
await new Promise((resolve) => reservation.listen(0, '127.0.0.1', resolve));
const port = reservation.address().port;
await new Promise((resolve) => reservation.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const started = performance.now();
const server = spawn(
  process.execPath,
  [
    'node_modules/next/dist/bin/next',
    'start',
    '--hostname',
    '127.0.0.1',
    '--port',
    String(port),
  ],
  {
    cwd: root,
    stdio: ['ignore', 'inherit', 'inherit'],
    windowsHide: true,
  },
);
let spawnError;
server.once('error', (error) => {
  spawnError = error;
});
const exited = new Promise((resolve) => server.once('exit', resolve));
const report = { readyMs: 0, largestChunkBytes, routes: [] };
async function get(url) {
  return fetch(url, { signal: AbortSignal.timeout(10_000), redirect: 'error' });
}
try {
  let ready = false;
  while (performance.now() - started < 30_000) {
    if (spawnError) throw spawnError;
    assert(
      server.exitCode === null,
      'Production server exited before readiness.',
    );
    try {
      const response = await get(origin + '/api/health');
      ready = response.ok && (await response.json()).status === 'ready';
    } catch {
      /* Retry only while the server is starting. */
    }
    if (ready) break;
    await delay(200);
  }
  assert(ready, 'Production server did not become ready in 30 seconds.');
  report.readyMs = Math.round(performance.now() - started);
  const assets = new Set();
  for (const route of [
    '/',
    '/login',
    '/registro',
    '/registro/broker',
    '/dashboard',
    '/markets',
    '/admin',
  ]) {
    const before = performance.now();
    const response = await get(origin + route);
    assert.equal(response.status, 200, route);
    assert.match(response.headers.get('content-type') ?? '', /text\/html/);
    const html = await response.text();
    for (const [, asset] of html.matchAll(
      /(?:src|href)="(\/_next\/static\/[^"?]+(?:\.js|\.css))(?:\?[^"\s]*)?"/g,
    ))
      assets.add(asset);
    report.routes.push({
      route,
      firstRequestMs: Math.round(performance.now() - before),
    });
  }
  assert(assets.size > 0, 'No production assets found.');
  for (const asset of assets) {
    const response = await get(origin + asset);
    assert.equal(response.status, 200, `Missing production asset: ${asset}`);
    await response.arrayBuffer();
  }
  const catalog = await get(
    origin + '/api/catalog/locations?country=CO&state=ANT',
  );
  assert.equal(catalog.status, 200);
  const data = await catalog.json();
  assert(data.states.some((state) => state.code === 'ANT'));
  assert(data.cities.includes('Medellín'));
  assert.equal(
    (await get(origin + '/api/catalog/locations?country=INVALID')).status,
    400,
  );
  await mkdir(path.join(root, 'test-results'), { recursive: true });
  await writeFile(
    path.join(root, 'test-results', 'production-smoke.json'),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  if (server.exitCode === null) server.kill();
  await exited;
}
