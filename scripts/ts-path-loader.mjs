import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

function resolveWithExtensions(basePath) {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.json`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
    path.join(basePath, 'index.js'),
  ];

  const match = candidates.find((candidate) => fs.existsSync(candidate));
  return match ? pathToFileURL(match).href : null;
}

function resolveAliasPath(specifier) {
  if (!specifier.startsWith('@/')) return null;

  const relativePath = specifier.slice(2);
  const basePath = path.resolve(projectRoot, 'src', relativePath);
  return resolveWithExtensions(basePath);
}

function resolveRelativePath(specifier, parentURL) {
  if (!parentURL) return null;
  if (!specifier.startsWith('./') && !specifier.startsWith('../') && !specifier.startsWith('/')) {
    return null;
  }
  if (path.extname(specifier)) return null;

  const parentPath = parentURL.startsWith('file:') ? new URL(parentURL) : null;
  if (!parentPath) return null;

  const basePath = path.resolve(path.dirname(parentPath.pathname), specifier);
  return resolveWithExtensions(basePath);
}

export async function resolve(specifier, context, defaultResolve) {
  if (specifier === 'server-only') {
    return {
      url: pathToFileURL(path.resolve(projectRoot, 'scripts', 'server-only-shim.mjs')).href,
      shortCircuit: true,
    };
  }

  const aliasUrl = resolveAliasPath(specifier);
  if (aliasUrl) {
    return {
      url: aliasUrl,
      shortCircuit: true,
    };
  }

  const relativeUrl = resolveRelativePath(specifier, context.parentURL);
  if (relativeUrl) {
    return {
      url: relativeUrl,
      shortCircuit: true,
    };
  }

  return defaultResolve(specifier, context, defaultResolve);
}

export async function load(url, context, defaultLoad) {
  if (url.endsWith('.json')) {
    return {
      format: 'json',
      source: fs.readFileSync(new URL(url), 'utf8'),
      shortCircuit: true,
    };
  }

  return defaultLoad(url, context, defaultLoad);
}
