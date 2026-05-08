import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { RawGraphData } from '../model/graph.model';
import { GraphService } from '../graph.service';
import {
  GRAPH_INITIAL_SOURCE,
  type GraphInitialSource,
} from './graph-initial-source';

@Injectable()
export class GraphIngestionService implements OnModuleInit {
  constructor(
    private readonly graph: GraphService,
    @Inject(GRAPH_INITIAL_SOURCE)
    private readonly initialSource: GraphInitialSource,
  ) {}

  async onModuleInit(): Promise<void> {
    this.ingest(await this.initialSource.load());
  }

  ingest(raw: RawGraphData): { nodeCount: number; edgeCount: number } {
    this.graph.loadFromRawGraph(raw);
    return {
      nodeCount: this.graph.getAllNodes().length,
      edgeCount: this.graph.getAllEdges().length,
    };
  }
}
