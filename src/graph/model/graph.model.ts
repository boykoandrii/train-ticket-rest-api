export type VulnerabilitySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Vulnerability {
  readonly file: string;
  readonly severity: VulnerabilitySeverity;
  readonly message: string;
  readonly cwe?: string;
}

export type NodeKind = 'service' | 'rds' | 'sqs' | 'sql';

export interface GraphNode {
  readonly name: string;
  readonly kind: NodeKind;
  readonly language?: string;
  readonly path?: string;
  readonly publicExposed: boolean;
  readonly vulnerabilities: readonly Vulnerability[];
  readonly metadata?: Record<string, unknown>;
}

export interface GraphEdge {
  readonly from: string;
  readonly to: string;
}

export interface RawGraphData {
  nodes: RawNode[];
  edges: RawEdge[];
}

export interface RawNode {
  name: string;
  kind: string;
  language?: string;
  path?: string;
  publicExposed?: boolean;
  vulnerabilities?: RawVulnerability[];
  metadata?: Record<string, unknown>;
}

export interface RawEdge {
  from: string;
  to: string | string[];
}

export interface RawVulnerability {
  file: string;
  severity: string;
  message: string;
  metadata?: {
    cwe?: string;
  };
}

export const SINK_KINDS = [
  'rds',
  'sqs',
  'sql',
] as const satisfies readonly NodeKind[];

export type SinkKind = (typeof SINK_KINDS)[number];

export function isSinkKind(kind: NodeKind): kind is SinkKind {
  return (SINK_KINDS as readonly NodeKind[]).includes(kind);
}

export interface GraphReadModel {
  getNode(name: string): GraphNode | undefined;
  isSink(name: string): boolean;
}
