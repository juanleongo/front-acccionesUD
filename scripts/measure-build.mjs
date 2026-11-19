import { spawn } from 'node:child_process';
import { lstat, mkdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const cache = path.join(root, '.next', 'cache');
// Next cleans its output directory: backups must live outside .next.
const backup = path.join(root, `.build-cache-profile-${Date.now()}`);
const cold = process.argv.includes('--cold');
let moved = false;
if (cold) {
  try {
    if ((await lstat(cache)).isSymbolicLink())
      throw new Error('Cache cannot be a symlink.');
    await rename(cache, backup);
    moved = true;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
const started = performance.now();
const child = spawn(
  process.execPath,
  ['node_modules/next/dist/bin/next', 'build'],
  {
    cwd: root,
    stdio: 'inherit',
    windowsHide: true,
  },
);
const code = await new Promise((resolve, reject) => {
  child.once('error', reject);
  child.once('exit', (code) => resolve(code ?? 1));
});
const result = {
  mode: cold ? 'cold-next-cache' : 'warm',
  seconds: Number(((performance.now() - started) / 1000).toFixed(2)),
  exitCode: code,
};
console.log(JSON.stringify(result));
// Only the fixed, project-local cache backup created above can be removed.
if (moved) {
  if (path.dirname(backup) !== root || (await lstat(backup)).isSymbolicLink()) {
    throw new Error('Unexpected cache backup path.');
  }
  if (code === 0) await rm(backup, { recursive: true });
  else {
    // Preserve the old cache for inspection after a failed build.
    console.log('Previous cache preserved at ' + path.basename(backup));
  }
}
await mkdir(path.join(root, 'test-results'), { recursive: true });
const { writeFile } = await import('node:fs/promises');
await writeFile(
  path.join(root, 'test-results', 'build-timing.json'),
  JSON.stringify(result, null, 2),
);
process.exitCode = code;
