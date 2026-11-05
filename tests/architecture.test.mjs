import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { checkBoundaries } from '../scripts/check-boundaries.mjs';

const roots = [];
afterEach(() => {
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});
function analyze(files) {
  const root = mkdtempSync(path.join(tmpdir(), 'acciones-architecture-'));
  roots.push(root);
  writeFileSync(
    path.join(root, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        moduleResolution: 'bundler',
        paths: { '@/*': ['./src/*'] },
      },
    }),
  );
  for (const [name, content] of Object.entries(files)) {
    const file = path.join(root, name);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, content);
  }
  return checkBoundaries(root).map((error) => error.rule);
}

it.each(['@/features/b/private', '../b/private'])(
  'rejects cross-feature internals via %s',
  (specifier) => {
    expect(
      analyze({
        'src/features/a/index.ts': `import '${specifier}';`,
        'src/features/b/private.ts': 'export {};',
      }),
    ).toContain('feature-private-import');
  },
);
it('accepts public feature composition and type contracts', () => {
  expect(
    analyze({
      'src/app/page.ts': "import '@/features/a';",
      'src/features/a/index.ts': "export * from './view';",
      'src/features/a/view.ts': "import '@/features/b';",
      'src/features/b/index.ts': 'export {};',
    }),
  ).toEqual([]);
});
it.each(['lib', 'components'])(
  'rejects %s dependencies on app/features with resolved relative paths',
  (layer) => {
    expect(
      analyze({
        [`src/${layer}/bad.ts`]: "import '../app/page'; import '@/features/a';",
        'src/app/page.ts': 'export {};',
        'src/features/a/index.ts': 'export {};',
      }),
    ).toContain('shared-layer-dependency');
  },
);
it('detects cycles through re-exports', () => {
  expect(
    analyze({
      'src/lib/a.ts': "export * from './b';",
      'src/lib/b.ts': "export * from './a';",
    }),
  ).toContain('cycle');
});
it('detects transitive client/server leaks including dynamic imports', () => {
  expect(
    analyze({
      'src/app/widget.tsx': "'use client'; import '@/lib/bridge';",
      'src/lib/bridge.ts':
        "export const load = () => import('./secret.server');",
      'src/lib/secret.server.ts': "import 'server-only';",
    }),
  ).toContain('client-to-server-transitive');
});
it('rejects direct fetch, secrets and browser globals in shared modules', () => {
  const errors = analyze({
    'src/lib/bad.ts':
      "fetch('/api/probe'); process.env.SECRET; window.location;",
  });
  expect(errors).toEqual(
    expect.arrayContaining([
      'http-only-in-transport',
      'environment-only-in-server-config',
      'browser-capability-in-shared-code',
    ]),
  );
});
it('requires explicit poison markers on environment-specific entries', () => {
  expect(
    analyze({
      'src/lib/server.ts': 'export {};',
      'src/lib/client.ts': 'export {};',
    }),
  ).toEqual(
    expect.arrayContaining([
      'server-marker-required',
      'client-marker-required',
    ]),
  );
});
