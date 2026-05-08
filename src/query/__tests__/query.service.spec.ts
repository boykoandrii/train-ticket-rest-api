import { Test, TestingModule } from '@nestjs/testing';
import { GraphService } from '../../graph/graph.service';
import type { RawGraphData } from '../../graph/model/graph.model';
import type { GraphNode } from '../../graph/model/graph.model';
import { QueryModule } from '../query.module';
import { QueryService } from '../query.service';

function svcNode(name: string, kind = 'service'): GraphNode {
  return {
    name,
    kind,
    publicExposed: false,
    vulnerabilities: [],
  };
}

describe('QueryService', () => {
  describe('findAllRoutes when a sink has outgoing edges', () => {
    let service: QueryService;

    beforeEach(async () => {
      const mockGraph = {
        getStartNodes: () => [svcNode('a')],
        getNeighbors(name: string): string[] {
          if (name === 'a') {
            return ['sink'];
          }
          if (name === 'sink') {
            return ['c'];
          }
          return [];
        },
        isSink(name: string): boolean {
          return name === 'sink';
        },
      } as Pick<GraphService, 'getStartNodes' | 'getNeighbors' | 'isSink'>;

      const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [QueryModule],
      })
        .overrideProvider(GraphService)
        .useValue(mockGraph)
        .compile();

      service = moduleRef.get(QueryService);
    });

    it('records route ending at sink and continues through sink', () => {
      const routes = service.findAllRoutes();
      const asStrings = routes.map((r) => r.join('→'));
      expect(asStrings).toContain('a→sink');
      expect(asStrings).toContain('a→sink→c');
    });
  });

  describe('findAllRoutes excludes trivial single-node paths', () => {
    let service: QueryService;

    beforeEach(async () => {
      const mockGraph = {
        getStartNodes: () => [svcNode('lonely')],
        getNeighbors: () => [],
        isSink: () => false,
      } as Pick<GraphService, 'getStartNodes' | 'getNeighbors' | 'isSink'>;

      const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [QueryModule],
      })
        .overrideProvider(GraphService)
        .useValue(mockGraph)
        .compile();

      service = moduleRef.get(QueryService);
    });

    it('returns no routes for an isolated entry node', () => {
      expect(service.findAllRoutes()).toEqual([]);
    });
  });

  describe('findRoutes filter pipeline (AND)', () => {
    let query: QueryService;
    let graph: GraphService;

    beforeEach(async () => {
      const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [QueryModule],
      }).compile();
      graph = moduleRef.get(GraphService);
      query = moduleRef.get(QueryService);

      const raw: RawGraphData = {
        nodes: [
          {
            name: 'pub',
            kind: 'service',
            publicExposed: true,
            vulnerabilities: [],
          },
          {
            name: 'mid',
            kind: 'service',
            vulnerabilities: [
              { file: 't.java', severity: 'high', message: 'issue' },
            ],
          },
          { name: 'leaf', kind: 'service', vulnerabilities: [] },
          { name: 'db', kind: 'rds', vulnerabilities: [] },
        ],
        edges: [
          { from: 'pub', to: ['mid', 'leaf'] },
          { from: 'mid', to: 'db' },
        ],
      };
      graph.loadFromRawGraph(raw);
    });

    it('applies startPublic and endSink as intersection', () => {
      const routes = query.findRoutes({
        startPublic: true,
        endSink: true,
      });
      const keys = routes.map((r) => r.join('→'));
      expect(keys).toContain('pub→mid→db');
      expect(keys).not.toContain('pub→leaf');
    });

    it('findAllRoutes discovers paths from entry pub only', () => {
      const keys = query.findAllRoutes().map((r) => r.join('→'));
      expect(keys).toContain('pub→mid→db');
      expect(keys).toContain('pub→leaf');
    });

    it('applies hasVulnerability filter', () => {
      const keys = query
        .findRoutes({ hasVulnerability: true })
        .map((r) => r.join('→'));
      expect(keys).toContain('pub→mid→db');
      expect(keys).not.toContain('pub→leaf');
    });

    it('lists registered filters and full graph snapshot', () => {
      const filters = query.getAvailableFilters();
      expect(filters.length).toBeGreaterThan(0);
      expect(filters.every((f) => f.name.length > 0)).toBe(true);
      const overview = query.getFullGraph();
      expect(overview.nodes.length).toBe(4);
      expect(overview.edges.length).toBeGreaterThan(0);
    });
  });

  describe('findAllRoutes skips already-visited neighbors (cycles)', () => {
    let query: QueryService;
    let graph: GraphService;

    beforeEach(async () => {
      const moduleRef: TestingModule = await Test.createTestingModule({
        imports: [QueryModule],
      }).compile();
      graph = moduleRef.get(GraphService);
      query = moduleRef.get(QueryService);
      const raw: RawGraphData = {
        nodes: [
          { name: 'entry', kind: 'service', vulnerabilities: [] },
          { name: 'a', kind: 'service', vulnerabilities: [] },
          { name: 'b', kind: 'service', vulnerabilities: [] },
          { name: 'leaf', kind: 'service', vulnerabilities: [] },
        ],
        edges: [
          { from: 'entry', to: 'a' },
          { from: 'a', to: 'b' },
          { from: 'b', to: ['a', 'leaf'] },
        ],
      };
      graph.loadFromRawGraph(raw);
    });

    it('skips back-edge to visited node and still reaches leaf', () => {
      const keys = query.findAllRoutes().map((r) => r.join('→'));
      expect(keys).toContain('entry→a→b→leaf');
    });
  });
});
