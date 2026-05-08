import type { GraphReadModel } from '../../../graph/model/graph.model';
import type { GraphNode } from '../../../graph/model/graph.model';
import { PublicStartFilter } from '../public-start.filter';

function node(partial: Partial<GraphNode> & { name: string }): GraphNode {
  return {
    name: partial.name,
    kind: partial.kind ?? 'service',
    publicExposed: partial.publicExposed ?? false,
    vulnerabilities: partial.vulnerabilities ?? [],
    ...(partial.language !== undefined ? { language: partial.language } : {}),
    ...(partial.path !== undefined ? { path: partial.path } : {}),
    ...(partial.metadata !== undefined ? { metadata: partial.metadata } : {}),
  };
}

describe('PublicStartFilter', () => {
  const graph: GraphReadModel = {
    getNode(name: string) {
      const map: Record<string, GraphNode> = {
        pub: node({ name: 'pub', publicExposed: true }),
        priv: node({ name: 'priv', publicExposed: false }),
      };
      return map[name];
    },
    isSink: () => false,
  };

  it('keeps only routes starting at public nodes', () => {
    const f = new PublicStartFilter();
    const routes = [
      ['pub', 'priv'],
      ['priv', 'pub'],
    ] as const;
    const out = f.apply(routes, graph);
    expect(out).toHaveLength(1);
    expect(out[0][0]).toBe('pub');
  });

  it('is active only when startPublic is true', () => {
    const f = new PublicStartFilter();
    expect(f.isActive({})).toBe(false);
    expect(f.isActive({ startPublic: false })).toBe(false);
    expect(f.isActive({ startPublic: true })).toBe(true);
  });
});
