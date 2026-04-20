import fs from 'node:fs';
import path from 'node:path';

export function resolveGraphRoot(): string {
  return path.resolve(process.env.GRAPH_BUILD_ROOT || '/data/lemon-manuals/graph-backbone');
}

export function resolveGraphBackendBaseUrl(): string {
  return (process.env.GRAPH_BACKEND_BASE_URL || 'http://116.202.210.109/graph-backbone').replace(/\/+$/, '');
}

export function safeReadJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}
