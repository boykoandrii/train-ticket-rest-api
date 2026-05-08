import { Test, TestingModule } from '@nestjs/testing';
import { GraphService } from '../../graph/graph.service';
import type { RawGraphData } from '../../graph/model/graph.model';
import { QueryController } from '../query.controller';
import { QueryModule } from '../query.module';

describe('QueryController', () => {
  let controller: QueryController;
  let graph: GraphService;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [QueryModule],
    }).compile();
    controller = moduleRef.get(QueryController);
    graph = moduleRef.get(GraphService);
    const raw: RawGraphData = {
      nodes: [{ name: 'x', kind: 'service', vulnerabilities: [] }],
      edges: [],
    };
    graph.loadFromRawGraph(raw);
  });

  it('getGraph returns overview from service', () => {
    const r = controller.getGraph();
    expect(r.nodes).toHaveLength(1);
    expect(r.nodes[0].name).toBe('x');
  });

  it('getFilters returns filter metadata', () => {
    const r = controller.getFilters();
    expect(r.filters.length).toBeGreaterThan(0);
  });

  it('getRoutes delegates to buildRoutesResponse', () => {
    const r = controller.getRoutes({});
    expect(Array.isArray(r.routes)).toBe(true);
    expect(typeof r.total_routes).toBe('number');
  });

  it('uploadGraph applies JSON from multipart buffer', () => {
    const payload = {
      nodes: [
        { name: 'a', kind: 'service', vulnerabilities: [] },
        { name: 'b', kind: 'rds', vulnerabilities: [] },
      ],
      edges: [{ from: 'a', to: 'b' }],
    };
    const file = {
      buffer: Buffer.from(JSON.stringify(payload), 'utf-8'),
    } as Express.Multer.File;
    const r = controller.uploadGraph(file);
    expect(r.node_count).toBe(2);
    expect(r.edge_count).toBe(1);
    expect(
      controller
        .getGraph()
        .nodes.map((n) => n.name)
        .sort(),
    ).toEqual(['a', 'b']);
  });
});
