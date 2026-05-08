import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { Server } from 'node:http';
import { AppModule } from '../src/app.module';

interface GraphBody {
  nodes: { name: string; kind: string }[];
  edges: { from: string; to: string }[];
}

interface FiltersBody {
  filters: { name: string; description: string }[];
}

interface RoutesBody {
  filters_applied: string[];
  total_routes: number;
  routes: { nodes: { kind: string; vulnerabilities: unknown[] }[] }[];
}

describe('Graph API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: false },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const http = (): Server => app.getHttpServer() as Server;

  it('GET /api/graph returns nodes and edges', async () => {
    const res = await request(http()).get('/api/graph').expect(200);
    const body = res.body as GraphBody;
    expect(body.nodes.length).toBeGreaterThan(0);
    expect(body.edges.length).toBeGreaterThan(0);
    const first = body.nodes[0];
    expect(typeof first.name).toBe('string');
    expect(typeof first.kind).toBe('string');
  });

  it('GET /api/graph/filters lists filters', async () => {
    const res = await request(http()).get('/api/graph/filters').expect(200);
    const body = res.body as FiltersBody;
    expect(body.filters).toHaveLength(3);
    const names = body.filters.map((f) => f.name).sort();
    expect(names).toEqual(
      ['endSink', 'hasVulnerability', 'startPublic'].sort(),
    );
  });

  it('GET /api/graph/routes rejects unknown query params', async () => {
    await request(http())
      .get('/api/graph/routes')
      .query({ unknown: '1' })
      .expect(400);
  });

  it('GET /api/graph/routes without filters returns routes', async () => {
    const res = await request(http()).get('/api/graph/routes').expect(200);
    const body = res.body as RoutesBody;
    expect(body.total_routes).toBeGreaterThan(0);
    expect(Array.isArray(body.routes)).toBe(true);
  });

  it('GET /api/graph/routes with startPublic and endSink combined', async () => {
    const res = await request(http())
      .get('/api/graph/routes')
      .query({ startPublic: 'true', endSink: 'true' })
      .expect(200);
    const body = res.body as RoutesBody;
    expect([...body.filters_applied].sort()).toEqual(
      ['endSink', 'startPublic'].sort(),
    );
    for (const r of body.routes) {
      expect(r.nodes[0].publicExposed).toBe(true);
      const last = r.nodes[r.nodes.length - 1];
      expect(['rds', 'sqs', 'sql']).toContain(last.kind);
    }
  });

  it('GET /api/graph/routes with hasVulnerability only includes routes with a vuln node', async () => {
    const res = await request(http())
      .get('/api/graph/routes')
      .query({ hasVulnerability: 'true' })
      .expect(200);
    const body = res.body as RoutesBody;
    expect(body.filters_applied).toContain('hasVulnerability');
    expect(body.total_routes).toBeGreaterThan(0);
    for (const r of body.routes) {
      expect(r.nodes.some((n) => n.vulnerabilities.length > 0)).toBe(true);
    }
  });

  it('GET /api/graph/routes with endSink ends at rds, sqs, or sql', async () => {
    const res = await request(http())
      .get('/api/graph/routes')
      .query({ endSink: 'true' })
      .expect(200);
    const body = res.body as RoutesBody;
    expect(body.filters_applied).toContain('endSink');
    expect(body.total_routes).toBeGreaterThan(0);
    for (const r of body.routes) {
      const last = r.nodes[r.nodes.length - 1];
      expect(['rds', 'sqs', 'sql']).toContain(last.kind);
    }
  });

  it('POST /api/graph replaces graph from multipart file', async () => {
    const graphJson = JSON.stringify({
      nodes: [{ name: 'solo', kind: 'service', vulnerabilities: [] }],
      edges: [],
    });
    const post = await request(http())
      .post('/api/graph')
      .attach('file', Buffer.from(graphJson, 'utf-8'), 'graph.json')
      .expect(200);
    expect(post.body).toEqual({ node_count: 1, edge_count: 0 });
    const get = await request(http()).get('/api/graph').expect(200);
    const body = get.body as GraphBody;
    expect(body.nodes).toHaveLength(1);
    expect(body.nodes[0].name).toBe('solo');
    expect(body.edges).toHaveLength(0);
  });
});
