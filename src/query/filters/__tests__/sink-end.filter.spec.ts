import { GraphService } from '../../../graph/graph.service';
import {
  isSinkKind,
  type GraphReadModel,
  type GraphNode,
} from '../../../graph/model/graph.model';
import { SinkEndFilter } from '../sink-end.filter';

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

function readModelFromNodes(nodes: Record<string, GraphNode>): GraphReadModel {
  return {
    getNode(name: string) {
      return nodes[name];
    },
    isSink(name: string) {
      const n = nodes[name];
      return n !== undefined && isSinkKind(n.kind);
    },
  };
}

describe('SinkEndFilter', () => {
  const nodes = {
    a: node({ name: 'a', kind: 'service' }),
    db: node({ name: 'db', kind: 'rds' }),
    q: node({ name: 'q', kind: 'sqs' }),
    sql: node({ name: 'sql', kind: 'sql' }),
  };

  const graph = readModelFromNodes(nodes);

  it('keeps routes ending at rds, sqs, or sql (SINK_KINDS / isSinkKind)', () => {
    const f = new SinkEndFilter();
    const routes = [
      ['a', 'db'],
      ['a', 'q'],
      ['a', 'sql'],
      ['a', 'a'],
    ] as const;
    const out = f.apply(routes, graph);
    expect(out).toEqual([
      ['a', 'db'],
      ['a', 'q'],
      ['a', 'sql'],
    ]);
  });

  it('rejects non-sink terminal kinds from bundle (e.g. service leaf)', () => {
    const leaf = node({ name: 'leaf', kind: 'service' });
    const g = readModelFromNodes({ ...nodes, leaf });
    const f = new SinkEndFilter();
    expect(f.apply([['a', 'leaf']], g)).toEqual([]);
  });

  it('keeps sqs terminal when using production GraphService.isSink', () => {
    const graphSvc = new GraphService();
    graphSvc.loadFromRawGraph({
      nodes: [
        { name: 'entry', kind: 'service' },
        { name: 'queue', kind: 'sqs' },
      ],
      edges: [{ from: 'entry', to: 'queue' }],
    });
    const f = new SinkEndFilter();
    expect(f.apply([['entry', 'queue']], graphSvc)).toEqual([
      ['entry', 'queue'],
    ]);
  });
});
