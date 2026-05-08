import type { GraphEdge, RawGraphData } from './graph.model';

export function normalizeRawEdges(
  rawEdges: RawGraphData['edges'],
): GraphEdge[] {
  const out: GraphEdge[] = [];
  for (const e of rawEdges) {
    const targets = Array.isArray(e.to) ? e.to : [e.to];
    for (const to of targets) {
      out.push({ from: e.from, to });
    }
  }
  return out;
}
