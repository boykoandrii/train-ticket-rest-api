import { Injectable, Logger } from '@nestjs/common';
import {
  isSinkKind,
  type GraphEdge,
  type GraphNode,
  type GraphReadModel,
  type NodeKind,
  type RawGraphData,
  type RawVulnerability,
  type Vulnerability,
  type VulnerabilitySeverity,
} from './model/graph.model';
import { normalizeRawEdges } from './model/normalize-raw-edges';

const SEVERITY_SET = new Set<VulnerabilitySeverity>([
  'low',
  'medium',
  'high',
  'critical',
]);

function normalizeSeverity(raw: string): VulnerabilitySeverity {
  const s = raw.toLowerCase() as VulnerabilitySeverity;
  return SEVERITY_SET.has(s) ? s : 'low';
}

function normalizeVulnerability(v: RawVulnerability): Vulnerability {
  const cwe = typeof v.metadata?.cwe === 'string' ? v.metadata.cwe : undefined;
  return {
    file: v.file,
    severity: normalizeSeverity(v.severity),
    message: v.message,
    ...(cwe !== undefined ? { cwe } : {}),
  };
}

@Injectable()
export class GraphService implements GraphReadModel {
  private readonly logger = new Logger(GraphService.name);
  private nodes = new Map<string, GraphNode>();
  private adjacencyList = new Map<string, string[]>();
  private edges: GraphEdge[] = [];

  loadFromRawGraph(raw: RawGraphData): void {
    const { nodes, edges } = this.parseAndNormalize(raw);
    this.nodes = nodes;
    this.edges = edges;
    this.adjacencyList = this.buildAdjacencyList(edges);
    this.logger.log(
      `Loaded ${this.nodes.size} nodes, ${this.edges.length} edges`,
    );
  }

  getNode(name: string): GraphNode | undefined {
    return this.nodes.get(name);
  }

  getAllNodes(): GraphNode[] {
    return [...this.nodes.values()];
  }

  getAllEdges(): GraphEdge[] {
    return [...this.edges];
  }

  getNeighbors(name: string): string[] {
    return this.adjacencyList.get(name) ?? [];
  }

  getStartNodes(): GraphNode[] {
    const targets = new Set(this.edges.map((e) => e.to));
    return [...this.nodes.values()].filter((n) => !targets.has(n.name));
  }

  getTerminalNodes(): GraphNode[] {
    return [...this.nodes.values()].filter(
      (n) => (this.adjacencyList.get(n.name) ?? []).length === 0,
    );
  }

  isSink(name: string): boolean {
    const n = this.nodes.get(name);
    return n !== undefined && isSinkKind(n.kind);
  }

  getAllNodeNames(): string[] {
    return [...this.nodes.keys()];
  }

  private parseAndNormalize(raw: RawGraphData): {
    nodes: Map<string, GraphNode>;
    edges: GraphEdge[];
  } {
    const nodes = new Map<string, GraphNode>();
    for (const r of raw.nodes) {
      const vulns = (r.vulnerabilities ?? []).map(normalizeVulnerability);
      const node: GraphNode = {
        name: r.name,
        kind: this.coerceNodeKind(r.kind, r.name),
        ...(r.language !== undefined ? { language: r.language } : {}),
        ...(r.path !== undefined ? { path: r.path } : {}),
        publicExposed: r.publicExposed === true,
        vulnerabilities: vulns,
        ...(r.metadata !== undefined ? { metadata: r.metadata } : {}),
      };
      nodes.set(r.name, node);
    }

    const rawEdges = normalizeRawEdges(raw.edges);
    const edges: GraphEdge[] = [];
    for (const e of rawEdges) {
      if (!nodes.has(e.from)) {
        this.logger.warn(`Edge from unknown node "${e.from}" → "${e.to}"`);
        continue;
      }
      if (!nodes.has(e.to)) {
        this.logger.warn(`Edge to unknown node "${e.from}" → "${e.to}"`);
        continue;
      }
      edges.push(e);
    }

    return { nodes, edges };
  }

  private buildAdjacencyList(edgeList: GraphEdge[]): Map<string, string[]> {
    const m = new Map<string, string[]>();
    for (const e of edgeList) {
      const list = m.get(e.from);
      if (list === undefined) {
        m.set(e.from, [e.to]);
      } else {
        list.push(e.to);
      }
    }
    return m;
  }

  private coerceNodeKind(raw: string, nodeName: string): NodeKind {
    switch (raw) {
      case 'service':
      case 'rds':
      case 'sqs':
      case 'sql':
        return raw;
      default:
        this.logger.warn(
          `Unknown node kind "${raw}" for node "${nodeName}", coerced to service`,
        );
        return 'service';
    }
  }
}
