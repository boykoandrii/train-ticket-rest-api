import type { RawGraphData } from './graph.model';

export function isRawGraphData(value: unknown): value is RawGraphData {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const o = value as Record<string, unknown>;
  if (!Array.isArray(o.nodes) || !Array.isArray(o.edges)) {
    return false;
  }
  for (const item of o.nodes) {
    if (typeof item !== 'object' || item === null) {
      return false;
    }
    const n = item as Record<string, unknown>;
    if (typeof n.name !== 'string' || typeof n.kind !== 'string') {
      return false;
    }
  }
  for (const item of o.edges) {
    if (typeof item !== 'object' || item === null) {
      return false;
    }
    const e = item as Record<string, unknown>;
    if (typeof e.from !== 'string') {
      return false;
    }
    if (!(typeof e.to === 'string' || Array.isArray(e.to))) {
      return false;
    }
  }
  return true;
}
