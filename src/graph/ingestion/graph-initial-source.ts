import type { RawGraphData } from '../model/graph.model';

export interface GraphInitialSource {
  load(): Promise<RawGraphData>;
}

export const GRAPH_INITIAL_SOURCE = Symbol('GRAPH_INITIAL_SOURCE');
