import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const normalize = (value) => value.replaceAll('\\', '/');
const feature = (file) => /^src\/features\/([^/]+)\//.exec(file)?.[1];
const serverFile = (file) =>
  /(?:^|\/)(?:server|[^/]+\.server)\.tsx?$/.test(file);
const clientFile = (file) =>
  /(?:^|\/)(?:client|[^/]+\.client)\.tsx?$/.test(file);
const isTest = (file) => /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(file);

/** Parse TypeScript and resolve its module graph, including aliases/re-exports/dynamic imports. */
export function checkBoundaries(root = process.cwd()) {
  const configPath = path.join(root, 'tsconfig.json');
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  if (config.error)
    throw new Error(
      ts.flattenDiagnosticMessageText(config.error.messageText, '\n'),
    );
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  const options = parsed.options;
  const files = ts.sys
    .readDirectory(
      path.join(root, 'src'),
      ['.ts', '.tsx'],
      ['**/node_modules/**'],
    )
    .filter((file) => !isTest(file) && !file.endsWith('.d.ts'));
  const graph = new Map();
  const errors = [];
  const report = (rule, from, to = '') => errors.push({ rule, from, to });
  const relative = (file) => normalize(path.relative(root, file));

  for (const file of files) {
    const name = relative(file);
    const source = ts.createSourceFile(
      file,
      fs.readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
    );
    const imports = [];
    const info = {
      edges: [],
      client: clientFile(name),
      server: serverFile(name),
      poison: false,
      browser: false,
    };
    for (const statement of source.statements) {
      if (
        ts.isExpressionStatement(statement) &&
        ts.isStringLiteral(statement.expression) &&
        statement.expression.text === 'use client'
      )
        info.client = true;
    }
    const add = (node, typeOnly = false) => {
      if (node && ts.isStringLiteralLike(node))
        imports.push({ specifier: node.text, typeOnly });
      else if (node) report('static-import-required', name);
    };
    function visit(node) {
      if (ts.isImportDeclaration(node)) {
        const clause = node.importClause;
        const bindings = clause?.namedBindings;
        const onlyTypes =
          clause?.isTypeOnly ||
          (!clause?.name &&
            bindings &&
            ts.isNamedImports(bindings) &&
            bindings.elements.length > 0 &&
            bindings.elements.every((item) => item.isTypeOnly));
        add(node.moduleSpecifier, Boolean(onlyTypes));
      }
      if (ts.isExportDeclaration(node) && node.moduleSpecifier)
        add(node.moduleSpecifier, node.isTypeOnly);
      if (
        ts.isImportEqualsDeclaration(node) &&
        ts.isExternalModuleReference(node.moduleReference)
      )
        add(node.moduleReference.expression, node.isTypeOnly);
      if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument))
        add(node.argument.literal, true);
      if (
        ts.isCallExpression(node) &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(node.expression) &&
            node.expression.text === 'require'))
      )
        add(node.arguments[0]);
      if (ts.isIdentifier(node)) {
        // Inspect AST identifiers, not source text. Property names in type definitions are harmless.
        const reference = !(
          ts.isPropertySignature(node.parent) ||
          (ts.isPropertyAssignment(node.parent) && node.parent.name === node)
        );
        if (
          reference &&
          node.text === 'process' &&
          name !== 'src/lib/config/server.ts'
        )
          report('environment-only-in-server-config', name);
        if (
          reference &&
          [
            'window',
            'document',
            'navigator',
            'localStorage',
            'sessionStorage',
            'WebSocket',
          ].includes(node.text)
        )
          info.browser = true;
        if (
          reference &&
          node.text === 'fetch' &&
          name !== 'src/lib/api/fetch-transport.ts'
        )
          report('http-only-in-transport', name);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
    info.poison = imports.some((item) => item.specifier === 'server-only');
    info.server ||= info.poison;
    info.client ||= imports.some((item) => item.specifier === 'client-only');
    if (serverFile(name) && !info.poison)
      report('server-marker-required', name);
    if (
      clientFile(name) &&
      !imports.some((item) => item.specifier === 'client-only') &&
      !source.statements.some(
        (item) =>
          ts.isExpressionStatement(item) &&
          ts.isStringLiteral(item.expression) &&
          item.expression.text === 'use client',
      )
    )
      report('client-marker-required', name);
    if (info.browser && !info.client)
      report('browser-capability-in-shared-code', name);
    for (const { specifier, typeOnly } of imports) {
      const resolved = ts.resolveModuleName(
        specifier,
        file,
        options,
        ts.sys,
      ).resolvedModule;
      if (resolved && !resolved.isExternalLibraryImport) {
        const target = relative(resolved.resolvedFileName);
        if (target.startsWith('src/')) info.edges.push({ target, typeOnly });
      } else if (
        (specifier.startsWith('@/') || specifier.startsWith('.')) &&
        !/\.(css|svg|png)$/.test(specifier)
      )
        report('unresolved-internal-import', name, specifier);
      if (
        !typeOnly &&
        (specifier === 'server-only' ||
          specifier === 'next/headers' ||
          specifier === 'next/server' ||
          specifier.startsWith('node:'))
      ) {
        if (!info.server && !name.startsWith('src/app/'))
          report('server-capability-in-shared-code', name, specifier);
        info.server = true;
      }
    }
    graph.set(name, info);
  }

  for (const [from, info] of graph) {
    for (const { target, typeOnly } of info.edges) {
      if (
        /^src\/(lib|components)\//.test(from) &&
        /^src\/(app|features)\//.test(target)
      )
        report('shared-layer-dependency', from, target);
      if (feature(from) && target.startsWith('src/app/'))
        report('feature-to-app', from, target);
      if (
        feature(target) &&
        feature(from) !== feature(target) &&
        !/^src\/features\/[^/]+\/(index|server|client)\.tsx?$/.test(target)
      )
        report('feature-private-import', from, target);
      if (
        target === 'src/lib/api/fetch-transport.ts' &&
        !/^src\/lib\/api\/(client|server)\.ts$/.test(from)
      )
        report('transport-adapter-only', from, target);
      const destination = graph.get(target);
      if (
        !typeOnly &&
        destination?.server &&
        !info.server &&
        !from.startsWith('src/app/')
      )
        report('shared-to-server', from, target);
      if (
        !typeOnly &&
        destination?.client &&
        from.startsWith('src/lib/') &&
        !info.client
      )
        report('shared-lib-to-client', from, target);
      if (!typeOnly && info.server && clientFile(target))
        report('server-to-browser-adapter', from, target);
    }
    if (info.client) {
      const seen = new Set();
      const walk = (name) => {
        if (seen.has(name)) return;
        seen.add(name);
        const item = graph.get(name);
        if (item?.server) report('client-to-server-transitive', from, name);
        for (const edge of item?.edges ?? [])
          if (!edge.typeOnly) walk(edge.target);
      };
      walk(from);
    }
  }
  const visited = new Set();
  const active = new Set();
  function cycles(name) {
    if (active.has(name)) {
      report('cycle', name);
      return;
    }
    if (visited.has(name)) return;
    visited.add(name);
    active.add(name);
    for (const edge of graph.get(name)?.edges ?? []) cycles(edge.target);
    active.delete(name);
  }
  for (const name of graph.keys()) cycles(name);
  return [
    ...new Map(errors.map((error) => [JSON.stringify(error), error])).values(),
  ];
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const errors = checkBoundaries();
  if (errors.length) {
    for (const error of errors)
      console.error(
        `[${error.rule}] ${error.from}${error.to ? ` -> ${error.to}` : ''}`,
      );
    process.exitCode = 1;
  } else
    console.log('Fronteras, entradas públicas, cliente/servidor y ciclos: OK.');
}
