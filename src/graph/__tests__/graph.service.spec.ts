import { Logger } from '@nestjs/common';
import type { RawGraphData } from '../model/graph.model';
import { GraphService } from '../graph.service';

describe('GraphService', () => {
  let service: GraphService;

  beforeEach(() => {
    service = new GraphService();
  });

  it('normalizes string and array to fields into edges', () => {
    const raw: RawGraphData = {
      nodes: [
        { name: 'a', kind: 'service' },
        { name: 'b', kind: 'service' },
        { name: 'c', kind: 'service' },
      ],
      edges: [
        { from: 'a', to: 'b' },
        { from: 'b', to: ['c'] },
      ],
    };
    service.loadFromRawGraph(raw);
    expect(service.getAllEdges()).toEqual([
      { from: 'a', to: 'b' },
      { from: 'b', to: 'c' },
    ]);
    expect(service.getNeighbors('a')).toEqual(['b']);
    expect(service.getNeighbors('b')).toEqual(['c']);
  });

  it('drops edges to missing nodes and warns', () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const raw: RawGraphData = {
      nodes: [{ name: 'a', kind: 'service' }],
      edges: [{ from: 'a', to: 'ghost' }],
    };
    service.loadFromRawGraph(raw);
    expect(service.getAllEdges()).toEqual([]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('drops edges from missing nodes and warns', () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const raw: RawGraphData = {
      nodes: [{ name: 'a', kind: 'service' }],
      edges: [{ from: 'ghost', to: 'a' }],
    };
    service.loadFromRawGraph(raw);
    expect(service.getAllEdges()).toEqual([]);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('exposes read model helpers', () => {
    const raw: RawGraphData = {
      nodes: [
        { name: 'a', kind: 'service' },
        { name: 'b', kind: 'rds' },
      ],
      edges: [{ from: 'a', to: 'b' }],
    };
    service.loadFromRawGraph(raw);
    expect(
      service
        .getAllNodes()
        .map((n) => n.name)
        .sort(),
    ).toEqual(['a', 'b']);
    expect(service.getAllNodeNames().sort()).toEqual(['a', 'b']);
    expect(service.getTerminalNodes().map((n) => n.name)).toEqual(['b']);
    expect(service.isSink('b')).toBe(true);
    expect(service.isSink('missing')).toBe(false);
  });

  it('coerces unknown node kind to service', () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const raw: RawGraphData = {
      nodes: [{ name: 'x', kind: 'banana' }],
      edges: [],
    };
    service.loadFromRawGraph(raw);
    expect(service.getNode('x')?.kind).toBe('service');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('computes entry nodes for route discovery', () => {
    const raw: RawGraphData = {
      nodes: [
        { name: 'entry', kind: 'service' },
        { name: 'mid', kind: 'service' },
        { name: 'db', kind: 'rds' },
      ],
      edges: [
        { from: 'entry', to: 'mid' },
        { from: 'mid', to: 'db' },
      ],
    };
    service.loadFromRawGraph(raw);
    const starts = service.getStartNodes().map((n) => n.name);
    expect(starts).toEqual(['entry']);
  });
});
